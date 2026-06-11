import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const submissionReviewSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID format"),
  status: z.enum(["under_review", "selected", "rejected"]),
});

// GET: Fetch all submissions for admin review
export async function GET() {
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

    // 3. Fetch submissions with team and competition details
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("*, teams(id, name, leader_id), competitions(id, name, type)")
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: submissions || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load submissions queue.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Review and update proposal submission status
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
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

    // 3. Validate request payload
    const body = await req.json();
    const parseResult = submissionReviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { submission_id, status } = parseResult.data;

    // 4. Fetch previous submission state
    const { data: prevSubmission, error: fetchErr } = await supabase
      .from("submissions")
      .select("*, teams(name)")
      .eq("id", submission_id)
      .single();

    if (fetchErr || !prevSubmission) {
      return NextResponse.json(
        { success: false, message: "Submission not found." },
        { status: 404 }
      );
    }

    // 5. Update submission status
    const { error: subUpdateErr } = await supabase
      .from("submissions")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    if (subUpdateErr) {
      throw new Error(`Failed to update submission status: ${subUpdateErr.message}`);
    }

    // 6. Update corresponding Team status
    // Submission status 'selected' maps to Team status 'selected'
    // Submission status 'rejected' maps to Team status 'rejected'
    // Submission status 'under_review' maps to Team status 'submitted'
    let teamStatus = "submitted";
    if (status === "selected") teamStatus = "selected";
    if (status === "rejected") teamStatus = "rejected";

    const { error: teamUpdateErr } = await supabase
      .from("teams")
      .update({
        status: teamStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prevSubmission.team_id);

    if (teamUpdateErr) {
      throw new Error(`Failed to sync team status: ${teamUpdateErr.message}`);
    }

    // 7. Log admin audit mutation
    await logAdminAction(
      supabase,
      user.id,
      "REVIEW_SUBMISSION",
      "submissions",
      submission_id,
      prevSubmission,
      { status, team_status: teamStatus }
    );

    // 8. In-app notification is handled automatically via database trigger (tr_submission_notification)

    return NextResponse.json({
      success: true,
      message: `Project proposal successfully updated to ${status}.`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to execute review action.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
