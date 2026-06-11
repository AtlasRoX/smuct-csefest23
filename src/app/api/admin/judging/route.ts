import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const criteriaScoreSchema = z.object({
  criteria_name: z.string().min(1, "Criteria name is required"),
  weight: z.number().min(0, "Weight cannot be negative"),
  score: z.number().min(0, "Score cannot be negative"),
  max_score: z.number().positive("Max score must be positive"),
});

const saveScoresSchema = z.object({
  team_id: z.string().uuid("Invalid team ID format"),
  competition_id: z.string().uuid("Invalid competition ID format"),
  scores: z.array(criteriaScoreSchema).min(1, "At least one criteria score is required"),
});

// GET: Fetch judging data (teams, existing scores, rankings) for a competition
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
    const competitionId = searchParams.get("competition_id");

    if (!competitionId) {
      return NextResponse.json(
        { success: false, message: "Missing competition_id parameter." },
        { status: 400 }
      );
    }

    // 3. Fetch competition details (for criteria configuration)
    const { data: competition, error: compErr } = await supabase
      .from("competitions")
      .select("id, name, type, judging_criteria, finalist_limit")
      .eq("id", competitionId)
      .single();

    if (compErr || !competition) {
      return NextResponse.json(
        { success: false, message: "Competition not found." },
        { status: 404 }
      );
    }

    // 4. Fetch all teams (and their optional project submissions)
    const { data: teams, error: teamsErr } = await supabase
      .from("teams")
      .select("id, name, status, created_at, submissions(title, submitted_at)")
      .eq("competition_id", competitionId);

    if (teamsErr) throw teamsErr;

    // 5. Fetch all scores for this competition
    const { data: allScores, error: scoresErr } = await supabase
      .from("scores")
      .select("*")
      .eq("competition_id", competitionId);

    if (scoresErr) throw scoresErr;

    // 6. Fetch existing rankings
    const { data: rankings, error: rankingsErr } = await supabase
      .from("rankings")
      .select("*")
      .eq("competition_id", competitionId)
      .order("rank_position", { ascending: true });

    if (rankingsErr) throw rankingsErr;

    // Combine data for frontend view
    const formattedTeams = (teams || []).map((team) => {
      const teamScores = (allScores || []).filter((s) => s.team_id === team.id);
      const teamRanking = (rankings || []).find((r) => r.team_id === team.id);
      const submission = team.submissions && Array.isArray(team.submissions) && team.submissions.length > 0
        ? team.submissions[0]
        : null;

      return {
        id: team.id,
        name: team.name,
        status: team.status,
        created_at: team.created_at,
        submission: submission ? {
          title: submission.title,
          submitted_at: submission.submitted_at,
        } : null,
        scores: teamScores,
        total_score: teamRanking ? teamRanking.total_score : 0,
        rank_position: teamRanking ? teamRanking.rank_position : null,
        is_finalist: teamRanking ? teamRanking.is_finalist : false,
        is_public: teamRanking ? teamRanking.is_public : false,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        competition,
        teams: formattedTeams,
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load judging parameters.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Enter/Save scores for a team and update leaderboard rankings
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

    // 3. Validate payload
    const body = await req.json();
    const parseResult = saveScoresSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { team_id, competition_id, scores } = parseResult.data;

    // 4. Fetch previous scores for audit logs
    const { data: prevScores } = await supabase
      .from("scores")
      .select("*")
      .eq("team_id", team_id)
      .eq("competition_id", competition_id);

    // 5. Delete existing scores for this team/competition
    const { error: deleteErr } = await supabase
      .from("scores")
      .delete()
      .eq("team_id", team_id)
      .eq("competition_id", competition_id);

    if (deleteErr) {
      throw new Error(`Failed to clear existing scores: ${deleteErr.message}`);
    }

    // 6. Insert new scores
    const insertPayload = scores.map((s) => ({
      team_id,
      competition_id,
      criteria_name: s.criteria_name,
      weight: s.weight,
      score: s.score,
      max_score: s.max_score,
      entered_by: user.id,
    }));

    const { error: insertErr } = await supabase.from("scores").insert(insertPayload);

    if (insertErr) {
      throw new Error(`Failed to save scores: ${insertErr.message}`);
    }

    // 7. Calculate weighted total score
    // score_contribution = (score / max_score) * weight
    let totalScore = 0;
    scores.forEach((s) => {
      const contribution = (s.score / s.max_score) * s.weight;
      totalScore += contribution;
    });

    // Round to 2 decimal places
    totalScore = Math.round(totalScore * 100) / 100;

    // 8. Fetch previous ranking for audit logs
    const { data: prevRanking } = await supabase
      .from("rankings")
      .select("*")
      .eq("team_id", team_id)
      .maybeSingle();

    // 9. Upsert new total score in rankings table
    const { error: rankUpsertErr } = await supabase.from("rankings").upsert({
      team_id,
      competition_id,
      total_score: totalScore,
      updated_at: new Date().toISOString(),
    }, { onConflict: "team_id" });

    if (rankUpsertErr) {
      throw new Error(`Failed to update ranking table: ${rankUpsertErr.message}`);
    }

    // 10. Recalculate rank positions for ALL teams in this competition (Tie-breaking algorithm)
    // Fetch all current rankings for this competition
    const { data: allRankings } = await supabase
      .from("rankings")
      .select("id, team_id, total_score")
      .eq("competition_id", competition_id);

    // Fetch submissions (for tie-break: earlier submission_time wins)
    const { data: submissions } = await supabase
      .from("submissions")
      .select("team_id, submitted_at")
      .eq("competition_id", competition_id);

    // Fetch team registration details (for fallback tie-break: earlier team creation wins)
    const { data: teams } = await supabase
      .from("teams")
      .select("id, created_at")
      .eq("competition_id", competition_id);

    if (allRankings && allRankings.length > 0) {
      // Sort rankings list by tie-breaker rules:
      // Rule 1: Higher total_score wins
      // Rule 2: Earlier submission wins (submissions.submitted_at)
      // Rule 3: Earlier team creation wins (teams.created_at)
      const sortedRankings = [...allRankings].sort((a, b) => {
        // Score comparison
        if (b.total_score !== a.total_score) {
          return b.total_score - a.total_score;
        }

        // Submission time comparison (earlier submission wins)
        const subA = (submissions || []).find((s) => s.team_id === a.team_id);
        const subB = (submissions || []).find((s) => s.team_id === b.team_id);
        const timeA = subA ? new Date(subA.submitted_at).getTime() : Infinity;
        const timeB = subB ? new Date(subB.submitted_at).getTime() : Infinity;

        if (timeA !== timeB) {
          return timeA - timeB;
        }

        // Creation time fallback (earlier team creation wins)
        const teamA = (teams || []).find((t) => t.id === a.team_id);
        const teamB = (teams || []).find((t) => t.id === b.team_id);
        const createA = teamA ? new Date(teamA.created_at).getTime() : Infinity;
        const createB = teamB ? new Date(teamB.created_at).getTime() : Infinity;

        return createA - createB;
      });

      // Update ranking position inside a transaction/sequential calls
      for (let i = 0; i < sortedRankings.length; i++) {
        const item = sortedRankings[i];
        if (!item) continue;
        const { error: updateRankErr } = await supabase
          .from("rankings")
          .update({
            rank_position: i + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (updateRankErr) {
          throw new Error(`Failed to assign rank positions: ${updateRankErr.message}`);
        }
      }
    }

    // 11. Write audit log
    await logAdminAction(
      supabase,
      user.id,
      "JUDGE_TEAM_SCORE",
      "scores",
      team_id,
      { scores: prevScores || [], ranking: prevRanking || null },
      { scores: insertPayload, total_score: totalScore }
    );

    return NextResponse.json({
      success: true,
      message: "Scores updated and leaderboards recalculated successfully.",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to record team score.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
