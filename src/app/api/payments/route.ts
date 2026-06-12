import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const paymentSubmissionSchema = z.object({
  team_id: z.string().uuid("Invalid team ID format"),
  amount: z.number().positive("Amount must be a positive number"),
  transaction_id: z.string().min(6, "Transaction ID must be at least 6 characters"),
  method: z.string().min(2, "Payment method is required"),
  screenshot_base64: z.string().min(1, "Screenshot image is required"),
});

// GET: Fetch payment history/status for a team
export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("team_id");

    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Missing team_id parameter." },
        { status: 400 }
      );
    }

    // 2. Authorize (Must be accepted member of the team)
    const { data: memberRecord } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();

    if (!memberRecord) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You are not a member of this team." },
        { status: 403 }
      );
    }

    // 3. Fetch payments, sorting by newest first
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: payments || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load payments.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Submit a payment proof (bKash/Nagad)
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2b. Rate limit: 5 payment submissions per 5 minutes per user (Cloudinary uploads are expensive)
    const { success: withinLimit } = checkRateLimit(`payments:${user.id}`, {
      limit: 5,
      windowMs: 5 * 60_000,
    });
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, message: "Too many payment submissions. Please wait 5 minutes before trying again." },
        { status: 429 }
      );
    }

    // 2. Validate payload
    const body = await req.json();
    const parseResult = paymentSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { team_id, amount, transaction_id, method, screenshot_base64 } = parseResult.data;

    // 3. Authorize (Must be accepted member of the team)
    const { data: teamRecord, error: teamQueryErr } = await supabase
      .from("teams")
      .select("*, competitions(*)")
      .eq("id", team_id)
      .single();

    if (teamQueryErr || !teamRecord) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    const { data: memberRecord } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", team_id)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();

    if (!memberRecord) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You are not a member of this team." },
        { status: 403 }
      );
    }

    const comp = teamRecord.competitions;

    // 4. Validate registration fee requirements
    if (comp.entry_fee <= 0) {
      return NextResponse.json(
        { success: false, message: "This competition has no entry fee. Payment not required." },
        { status: 400 }
      );
    }

    // Verify the payment method is active in the database
    const { data: activeMethod } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("name", method)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (!activeMethod) {
      return NextResponse.json(
        { success: false, message: `The payment method "${method}" is not supported or currently inactive.` },
        { status: 400 }
      );
    }

    // 5. Verify flow state eligibility
    // 2-round competitions require proposal selection (clearing round 1) before payment
    if (comp.rounds_count === 2 && teamRecord.status !== "selected") {
      // If payment has already been submitted or rejected, the team status might still be something else.
      // But they can pay only if their proposal is selected.
      // Let's verify if they have any existing payment that was rejected or needs resubmission.
      const { data: latestPayment } = await supabase
        .from("payments")
        .select("status")
        .eq("team_id", team_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const canResubmit = latestPayment && (latestPayment.status === "rejected" || latestPayment.status === "resubmission_required");

      if (!canResubmit) {
        return NextResponse.json(
          { success: false, message: "For 2-round competitions, payment is only open after clearing Round 1 verification." },
          { status: 400 }
        );
      }
    }

    // Check if there's already an approved payment
    const { data: approvedPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("team_id", team_id)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (approvedPayment) {
      return NextResponse.json(
        { success: false, message: "Payment for this team has already been approved." },
        { status: 400 }
      );
    }

    // 6. Upload screenshot to Cloudinary
    const uploadRes = await uploadImage(
      screenshot_base64,
      `csefest/payments/${team_id}`
    );

    // 7. Insert payment record
    const { error: insertErr } = await supabase
      .from("payments")
      .insert({
        team_id,
        competition_id: comp.id,
        amount,
        transaction_id,
        screenshot_url: uploadRes.secure_url,
        method,
        status: "pending",
      });

    if (insertErr) {
      // Handle unique constraint violation on transaction_id
      if (insertErr.code === "23505") {
        return NextResponse.json(
          { success: false, message: "This Transaction ID has already been submitted." },
          { status: 409 }
        );
      }
      throw new Error(`Failed to record payment: ${insertErr.message}`);
    }

    // 8. In-app notification is handled automatically via database trigger (tr_payment_inserted_notification)

    return NextResponse.json({
      success: true,
      message: "Payment proof successfully submitted. Organizers will verify it manually.",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to submit payment proof.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
