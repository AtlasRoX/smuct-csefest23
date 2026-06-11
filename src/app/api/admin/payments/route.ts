import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const paymentReviewSchema = z.object({
  payment_id: z.string().uuid("Invalid payment ID format"),
  status: z.enum(["approved", "rejected", "resubmission_required"]),
  notes: z.string().optional().nullable(),
});

// GET: Fetch all payments for admin review
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

    // 2. Authorize admin
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userRecord || userRecord.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // 3. Query payments with team and competition details
    let query = supabase
      .from("payments")
      .select("*, teams(id, name), competitions(id, name, type, entry_fee)")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: payments || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load payments queue.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Review and update payment status
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    // 2. Authorize admin
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userRecord || userRecord.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin only." },
        { status: 403 }
      );
    }

    // 3. Validate payload
    const body = await req.json();
    const parseResult = paymentReviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { payment_id, status, notes } = parseResult.data;

    // 4. Fetch previous payment state
    const { data: prevPayment, error: fetchErr } = await supabase
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (fetchErr || !prevPayment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found." },
        { status: 404 }
      );
    }

    // 5. Update payment status
    const { error: updateErr } = await supabase
      .from("payments")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", payment_id);

    if (updateErr) {
      throw new Error(`Failed to update payment status: ${updateErr.message}`);
    }

    // 6. Update Team Status if approved
    // Payment approved -> Team status becomes 'registered'
    // Payment resubmission_required or rejected -> Team status remains unchanged (either selected or forming)
    let teamStatus = null;
    if (status === "approved") {
      teamStatus = "registered";

      const { error: teamUpdateErr } = await supabase
        .from("teams")
        .update({
          status: teamStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prevPayment.team_id);

      if (teamUpdateErr) {
        throw new Error(`Failed to update team registration state: ${teamUpdateErr.message}`);
      }
    }

    // 7. Log admin audit mutation
    await logAdminAction(
      supabase,
      user.id,
      "REVIEW_PAYMENT",
      "payments",
      payment_id,
      prevPayment,
      { status, notes, team_status: teamStatus }
    );

    // 8. Notify all accepted team members
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", prevPayment.team_id)
      .eq("invitation_status", "accepted");

    if (members && members.length > 0) {
      let titleMsg = "Payment Verification Status";
      let detailMsg = `Your team payment status has been updated to ${status.toUpperCase()}.`;
      let typeMsg: "info" | "success" | "warning" | "error" = "info";

      if (status === "approved") {
        titleMsg = "Payment Confirmed!";
        detailMsg = `Great news! Your team payment (TXID: ${prevPayment.transaction_id}) has been verified. Your team is now registered.`;
        typeMsg = "success";
      } else if (status === "rejected") {
        titleMsg = "Payment Rejected";
        detailMsg = `Your payment proof was rejected. ${notes ? `Reason: ${notes}` : "Please contact support."}`;
        typeMsg = "error";
      } else if (status === "resubmission_required") {
        titleMsg = "Payment Resubmission Required";
        detailMsg = `We could not verify your payment. Please resubmit your transaction details. ${notes ? `Details: ${notes}` : ""}`;
        typeMsg = "warning";
      }

      const notifications = members.map((m) => ({
        user_id: m.user_id,
        title: titleMsg,
        message: detailMsg,
        type: typeMsg,
        action_url: "/payments",
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: `Payment status successfully updated to ${status}.`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to review payment.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
