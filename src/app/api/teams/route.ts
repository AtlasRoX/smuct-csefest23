import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createTeamSchema = z.object({
  name: z.string().min(3, "Team Name must be at least 3 characters"),
  competition_id: z.string().uuid("Please select a valid competition"),
});

const inviteMemberSchema = z.object({
  team_id: z.string().uuid(),
  email: z.string().email("Please enter a valid email address"),
});

const respondInviteSchema = z.object({
  member_id: z.string().uuid(),
  status: z.enum(["accepted", "rejected"]),
});

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // Mode: "invitations" lists all pending invitations for this user
    if (mode === "invitations") {
      const { data: invites, error } = await supabase
        .from("team_members")
        .select("id, role, team_id, teams(name, competition_id, competitions(name))")
        .eq("user_id", user.id)
        .eq("invitation_status", "pending");

      if (error) throw new Error(error.message);

      return NextResponse.json({ success: true, data: invites });
    }

    // Default: List user's active teams
    const { data: memberRecords } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted");

    if (!memberRecords || memberRecords.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const teamIds = memberRecords.map((m) => m.team_id);
    const { data: teams, error } = await supabase
      .from("teams")
      .select("*, competitions(name, type, min_members, max_members)")
      .in("id", teamIds);

    if (error) throw new Error(error.message);

    // Fetch rosters for each team
    const teamsWithRosters = await Promise.all(
      teams.map(async (team) => {
        const { data: members } = await supabase
          .from("team_members")
          .select("id, role, invitation_status, user_id, profiles(full_name, email)")
          .eq("team_id", team.id);

        return { ...team, members: members || [] };
      })
    );

    return NextResponse.json({ success: true, data: teamsWithRosters });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Action: create a new team
    if (action === "create") {
      const body = await req.json();
      const parseResult = createTeamSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, message: parseResult.error.issues[0]?.message },
          { status: 400 }
        );
      }

      // Check user's profile is verified
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", user.id)
        .single();

      if (!profile || profile.verification_status !== "verified") {
        return NextResponse.json(
          { success: false, message: "Only verified student profiles can create teams." },
          { status: 403 }
        );
      }

      // Check if user is already on a team in this competition
      const { data: existingTeamMember } = await supabase
        .from("team_members")
        .select("id, team_id, teams(competition_id)")
        .eq("user_id", user.id)
        .eq("invitation_status", "accepted");

      const inSameCompetition = existingTeamMember?.some(
        (m: any) => m.teams?.competition_id === parseResult.data.competition_id
      );

      if (inSameCompetition) {
        return NextResponse.json(
          { success: false, message: "You are already a registered team member in this competition." },
          { status: 409 }
        );
      }

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: parseResult.data.name,
          competition_id: parseResult.data.competition_id,
          leader_id: user.id,
          status: "forming",
        })
        .select()
        .single();

      if (teamError) {
        if (teamError.code === "23505") {
          return NextResponse.json(
            { success: false, message: "A team with this name already exists in this competition." },
            { status: 409 }
          );
        }
        throw new Error(teamError.message);
      }

      // Add leader to team_members
      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "leader",
        invitation_status: "accepted",
        joined_at: new Date().toISOString(),
      });

      if (memberError) throw new Error(memberError.message);

      return NextResponse.json({ success: true, data: team });
    }

    // Action: invite a member
    if (action === "invite") {
      const body = await req.json();
      const parseResult = inviteMemberSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, message: parseResult.error.issues[0]?.message },
          { status: 400 }
        );
      }

      // Check if user has permission to invite (must be team leader)
      const { data: team } = await supabase
        .from("teams")
        .select("*, competitions(max_members)")
        .eq("id", parseResult.data.team_id)
        .single();

      if (!team || team.leader_id !== user.id) {
        return NextResponse.json(
          { success: false, message: "Only the team leader can invite members." },
          { status: 403 }
        );
      }

      // Check current accepted roster size limit
      const { count: memberCount } = await supabase
        .from("team_members")
        .select("id", { count: "exact" })
        .eq("team_id", team.id)
        .eq("invitation_status", "accepted");

      if (memberCount && memberCount >= team.competitions.max_members) {
        return NextResponse.json(
          { success: false, message: `This team already has the maximum of ${team.competitions.max_members} members.` },
          { status: 400 }
        );
      }

      // Find user by email
      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", parseResult.data.email)
        .single();

      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: "User not found on platform. Ask them to sign up first!" },
          { status: 404 }
        );
      }

      // Check if target user is already in a team for this competition
      const { data: targetMembership } = await supabase
        .from("team_members")
        .select("id, team_id, teams(competition_id)")
        .eq("user_id", targetUser.id)
        .eq("invitation_status", "accepted");

      const targetInSameComp = targetMembership?.some(
        (m: any) => m.teams?.competition_id === team.competition_id
      );

      if (targetInSameComp) {
        return NextResponse.json(
          { success: false, message: "User is already registered in a team for this competition." },
          { status: 409 }
        );
      }

      // Create pending invitation
      const { error: inviteError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: targetUser.id,
        role: "member",
        invitation_status: "pending",
      });

      if (inviteError) {
        if (inviteError.code === "23505") {
          return NextResponse.json(
            { success: false, message: "An invitation has already been sent to this user." },
            { status: 409 }
          );
        }
        throw new Error(inviteError.message);
      }

      // Trigger notification
      await supabase.from("notifications").insert({
        user_id: targetUser.id,
        title: "Team Invitation",
        message: `You have been invited to join the team "${team.name}" for "${team.competitions?.name || "competition"}".`,
        type: "info",
        action_url: "/teams",
      });

      return NextResponse.json({ success: true, message: "Invitation sent successfully." });
    }

    // Action: respond to invitation (accept / reject)
    if (action === "respond") {
      const body = await req.json();
      const parseResult = respondInviteSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, message: parseResult.error.issues[0]?.message },
          { status: 400 }
        );
      }

      // Validate invitation belongs to the authenticated user
      const { data: memberRecord } = await supabase
        .from("team_members")
        .select("*, teams(name, leader_id)")
        .eq("id", parseResult.data.member_id)
        .eq("user_id", user.id)
        .single();

      if (!memberRecord) {
        return NextResponse.json({ success: false, message: "Invitation not found." }, { status: 404 });
      }

      if (parseResult.data.status === "accepted") {
        // Update status to accepted
        const { error } = await supabase
          .from("team_members")
          .update({
            invitation_status: "accepted",
            joined_at: new Date().toISOString(),
          })
          .eq("id", parseResult.data.member_id);

        if (error) throw new Error(error.message);

        // Notify leader
        await supabase.from("notifications").insert({
          user_id: memberRecord.teams.leader_id,
          title: "Invitation Accepted",
          message: `Your invitation to join "${memberRecord.teams.name}" was accepted.`,
          type: "success",
          action_url: "/teams",
        });
      } else {
        // Delete or update to rejected
        const { error } = await supabase
          .from("team_members")
          .delete()
          .eq("id", parseResult.data.member_id);

        if (error) throw new Error(error.message);
      }

      return NextResponse.json({ success: true, message: `Invitation ${parseResult.data.status}.` });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
