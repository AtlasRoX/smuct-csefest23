import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const publishLeaderboardSchema = z.object({
  competition_id: z.string().uuid("Invalid competition ID format"),
  is_public: z.boolean(),
  finalist_team_ids: z.array(z.string().uuid("Invalid team ID format")),
});

// POST: Publish/unpublish leaderboard and assign finalist statuses
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
    const parseResult = publishLeaderboardSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { competition_id, is_public, finalist_team_ids } = parseResult.data;

    // 4. Fetch competition info
    const { data: compRecord } = await supabase
      .from("competitions")
      .select("name")
      .eq("id", competition_id)
      .single();

    if (!compRecord) {
      return NextResponse.json(
        { success: false, message: "Competition not found." },
        { status: 404 }
      );
    }

    // 5. Fetch previous rankings state for audit logs
    const { data: prevRankings } = await supabase
      .from("rankings")
      .select("*")
      .eq("competition_id", competition_id);

    // 6. Update all rankings visibility (is_public) for this competition
    const { error: publicUpdateErr } = await supabase
      .from("rankings")
      .update({
        is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("competition_id", competition_id);

    if (publicUpdateErr) {
      throw new Error(`Failed to update public visibility: ${publicUpdateErr.message}`);
    }

    // 7. Process finalist changes
    // Get list of all rankings in this competition to check which teams should be demoted/promoted
    const { data: allCompRankings } = await supabase
      .from("rankings")
      .select("team_id, is_finalist")
      .eq("competition_id", competition_id);

    if (allCompRankings) {
      for (const rank of allCompRankings) {
        const shouldBeFinalist = finalist_team_ids.includes(rank.team_id);

        if (shouldBeFinalist) {
          // Promote to finalist
          // Update rankings table
          await supabase
            .from("rankings")
            .update({ is_finalist: true, updated_at: new Date().toISOString() })
            .eq("team_id", rank.team_id);

          // Update teams status to 'finalist'
          await supabase
            .from("teams")
            .update({ status: "finalist", updated_at: new Date().toISOString() })
            .eq("id", rank.team_id);

          // In-app notification for finalist selection is handled automatically via database trigger (tr_team_finalist_notification)
        } else {
          // Demote from finalist (set back to registered)
          // Update rankings table
          await supabase
            .from("rankings")
            .update({ is_finalist: false, updated_at: new Date().toISOString() })
            .eq("team_id", rank.team_id);

          // Update teams status back to 'judging_ready' if they were 'finalist'
          await supabase
            .from("teams")
            .update({ status: "judging_ready", updated_at: new Date().toISOString() })
            .eq("id", rank.team_id)
            .eq("status", "finalist");
        }
      }
    }

    // 8. General notification to everyone in the competition if leaderboard became public
    if (is_public && (!prevRankings || prevRankings.some((r) => !r.is_public))) {
      // Find all team members of this competition
      const { data: compTeams } = await supabase
        .from("teams")
        .select("id")
        .eq("competition_id", competition_id);

      if (compTeams && compTeams.length > 0) {
        const teamIds = compTeams.map((t) => t.id);
        const { data: allMembers } = await supabase
          .from("team_members")
          .select("user_id")
          .in("team_id", teamIds)
          .eq("invitation_status", "accepted");

        if (allMembers && allMembers.length > 0) {
          // Send un-duplicated notifications
          const userIds = Array.from(new Set(allMembers.map((m) => m.user_id)));
          const publicNotifications = userIds.map((uid) => ({
            user_id: uid,
            title: "Leaderboard Published",
            message: `The official leaderboard and finalist list for "${compRecord.name}" have been published!`,
            type: "info",
            action_url: "/competitions",
          }));
          await supabase.from("notifications").insert(publicNotifications);
        }
      }
    }

    // 9. Write audit log
    await logAdminAction(
      supabase,
      user.id,
      "PUBLISH_LEADERBOARD",
      "rankings",
      competition_id,
      prevRankings || [],
      { is_public, finalist_team_ids }
    );

    return NextResponse.json({
      success: true,
      message: `Leaderboard successfully ${is_public ? "published" : "hidden"} with ${finalist_team_ids.length} finalists.`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to publish rankings.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
