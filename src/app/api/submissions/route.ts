import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const submissionValidationSchema = z.object({
  team_id: z.string().uuid("Invalid team ID format"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  google_docs_url: z.string().url("Please provide a valid Google Docs URL"),
  notes: z.string().optional().nullable(),
});

// GET: Fetch team submission
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

    // 2. Authorize (Must be member of the team)
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

    // 3. Fetch submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("team_id", teamId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: submission || null,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load submission.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Submit project proposal
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2. Validate payload
    const body = await req.json();
    const parseResult = submissionValidationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { team_id, title, google_docs_url, notes } = parseResult.data;

    // 3. Authorize (Must be accepted member of this team)
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

    // 4. Validate Submission Timeline Window
    const comp = teamRecord.competitions;
    const now = new Date();
    const subStart = new Date(comp.submission_start);
    const subEnd = new Date(comp.submission_end);

    if (now < subStart) {
      return NextResponse.json(
        { success: false, message: `Submission phase has not started yet. Opens: ${subStart.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (now > subEnd) {
      return NextResponse.json(
        { success: false, message: `Submission period is locked. Closed on: ${subEnd.toLocaleString()}` },
        { status: 400 }
      );
    }

    // 5. Upsert Submission record
    const { error: upsertErr } = await supabase
      .from("submissions")
      .upsert({
        team_id,
        competition_id: comp.id,
        title,
        google_docs_url,
        notes,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });

    if (upsertErr) {
      throw new Error(`Failed to save submission: ${upsertErr.message}`);
    }

    // 6. Update Team Status to 'submitted'
    const { error: teamUpdateErr } = await supabase
      .from("teams")
      .update({
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", team_id);

    if (teamUpdateErr) {
      throw new Error(`Failed to update team state: ${teamUpdateErr.message}`);
    }

    // 7. Notify team leader and members
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", team_id)
      .eq("invitation_status", "accepted");

    if (teamMembers) {
      const notifications = teamMembers.map((m) => ({
        user_id: m.user_id,
        title: "Proposal Submitted",
        message: `Your team "${teamRecord.name}" successfully submitted the proposal "${title}".`,
        type: "success",
        action_url: "/submissions",
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: "Proposal successfully submitted.",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to post submission.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
