"use client";

import * as React from "react";
import { Plus, Users, UserPlus, ShieldAlert, Check, X, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { COMPETITIONS_CATALOG } from "@/constants/content";

interface Competition {
  name: string;
  type: string;
  entry_fee: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: "leader" | "member";
  invitation_status: "pending" | "accepted" | "rejected";
  profiles: {
    full_name: string;
    email: string;
    university: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  competition_id: string;
  leader_id: string;
  status: string;
  competitions: Competition | null;
  members: TeamMember[];
}

interface Invitation {
  id: string;
  role: string;
  team_id: string;
  teams: {
    name: string;
    competition_id: string;
    competitions: {
      name: string;
    } | null;
  } | null;
}

export default function TeamsPage() {
  const [activeTab, setActiveTab] = React.useState<"teams" | "invites">("teams");
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [invites, setInvites] = React.useState<Invitation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Form states
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [newTeamCompId, setNewTeamCompId] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Invite states (keyed by teamId)
  const [inviteEmails, setInviteEmails] = React.useState<{ [key: string]: string }>({});
  const [inviteLoading, setInviteLoading] = React.useState<{ [key: string]: boolean }>({});

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch teams
      const teamsRes = await fetch("/api/teams");
      const teamsData = await teamsRes.json();
      if (teamsData.success) {
        setTeams(teamsData.data);
      }

      // Fetch invitations
      const invitesRes = await fetch("/api/teams?mode=invitations");
      const invitesData = await invitesRes.json();
      if (invitesData.success) {
        setInvites(invitesData.data);
      }
    } catch (err: unknown) {
      setErrorMsg("Failed to load roster data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamCompId) return;

    setCreateLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/teams?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          competition_id: newTeamCompId,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to create team.");
      }

      setNewTeamName("");
      setNewTeamCompId("");
      setShowCreateForm(false);
      await loadData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to create team.";
      setErrorMsg(errMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInviteMember = async (teamId: string) => {
    const email = inviteEmails[teamId];
    if (!email) return;

    setInviteLoading((prev) => ({ ...prev, [teamId]: true }));
    setErrorMsg(null);

    try {
      const res = await fetch("/api/teams?action=invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          email,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to send invitation.");
      }

      // Clear input
      setInviteEmails((prev) => ({ ...prev, [teamId]: "" }));
      await loadData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send invitation.";
      setErrorMsg(errMsg);
    } finally {
      setInviteLoading((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const handleRespondInvite = async (inviteId: string, status: "accepted" | "rejected") => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/teams?action=respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: inviteId,
          status,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Response action failed.");
      }

      await loadData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Response action failed.";
      setErrorMsg(errMsg);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-h3 font-heading font-bold text-neutral-50">Team Management</h1>
          <p className="text-sm text-neutral-400 font-sans mt-1">
            Build your roster, invite developers, and manage invitations.
          </p>
        </div>
        <div>
          {!showCreateForm && (
            <Button variant="primary" onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="h-4.5 w-4.5" />
              <span>Create Team</span>
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-radius-sm bg-error/10 border border-error/20 text-xs text-error font-sans font-medium flex items-start gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create Team Overlay Form */}
      {showCreateForm && (
        <Card variant="default" className="border-primary/30 bg-neutral-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4 max-w-lg">
              <Input
                label="Team Name"
                placeholder="e.g. Code Knights"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={createLoading}
                required
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-neutral-300 font-sans">Competition</label>
                <select
                  value={newTeamCompId}
                  onChange={(e) => setNewTeamCompId(e.target.value)}
                  disabled={createLoading}
                  required
                  className="flex h-10 w-full rounded-radius-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                >
                  <option value="">Select Competition</option>
                  {COMPETITIONS_CATALOG.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.eligibility})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="primary" type="submit" isLoading={createLoading}>
                  Create Team
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-neutral-800/80 gap-6">
        <button
          onClick={() => setActiveTab("teams")}
          className={`py-3.5 text-sm font-semibold tracking-wide font-sans capitalize transition-colors border-b-2 outline-none ${
            activeTab === "teams"
              ? "border-accent text-accent"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          My Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`py-3.5 text-sm font-semibold tracking-wide font-sans capitalize transition-colors border-b-2 outline-none ${
            activeTab === "invites"
              ? "border-accent text-accent"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Invitations ({invites.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center animate-pulse space-y-4">
          <div className="h-10 bg-neutral-900 w-full rounded-radius-sm" />
          <div className="h-10 bg-neutral-900 w-full rounded-radius-sm" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Content: Teams list */}
          {activeTab === "teams" && (
            <>
              {teams.length > 0 ? (
                <div className="space-y-6">
                  {teams.map((team) => {
                    const isLeader = team.members.some(
                      (m: TeamMember) => m.role === "leader" && m.user_id === team.leader_id
                    );
                    const isUserLeader = team.leader_id === team.members.find((m: TeamMember) => m.role === "leader")?.user_id;

                    return (
                      <Card key={team.id} variant="default" className="border-neutral-800/60 p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-neutral-800/60">
                          <div className="space-y-1">
                            <h3 className="text-lg font-heading font-semibold text-neutral-100">{team.name}</h3>
                            <p className="text-xs text-neutral-400 font-sans">
                              Registered for: <span className="text-neutral-300 font-medium">{team.competitions?.name}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Badge variant={team.leader_id === team.members[0]?.user_id ? "primary" : "neutral"}>
                              {team.leader_id === team.members[0]?.user_id ? "Leader" : "Member"}
                            </Badge>
                            <Badge variant="accent" className="capitalize">{team.status}</Badge>
                          </div>
                        </div>

                        {/* Roster list */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-sans">Roster Members</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {team.members.map((member: TeamMember) => (
                              <div
                                key={member.id}
                                className="p-3 rounded-radius-sm bg-neutral-950 border border-neutral-850 flex items-center justify-between gap-3 text-sm font-sans"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-neutral-200">{member.profiles?.full_name || "Unknown"}</div>
                                  <div className="text-xs text-neutral-500">{member.profiles?.email}</div>
                                </div>
                                <Badge variant={member.invitation_status === "accepted" ? "success" : "warning"} className="capitalize">
                                  {member.invitation_status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Invite Form (Leader Only) */}
                        {team.leader_id && (
                          <div className="pt-4 border-t border-neutral-800/60 space-y-3">
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-sans">Invite Developer</h4>
                            <div className="flex gap-3 max-w-md">
                              <Input
                                placeholder="developer@university.edu.bd"
                                value={inviteEmails[team.id] || ""}
                                onChange={(e) =>
                                  setInviteEmails((prev) => ({ ...prev, [team.id]: e.target.value }))
                                }
                                disabled={inviteLoading[team.id]}
                                className="flex-1"
                              />
                              <Button
                                variant="primary"
                                onClick={() => handleInviteMember(team.id)}
                                isLoading={inviteLoading[team.id]}
                                className="shrink-0 gap-2"
                              >
                                <UserPlus className="h-4.5 w-4.5" />
                                <span>Invite</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-neutral-800 rounded-radius-md bg-neutral-900/10">
                  <Users className="h-10 w-10 text-neutral-700 mb-4 mx-auto" />
                  <h3 className="font-heading font-semibold text-neutral-300 mb-1">No Active Teams</h3>
                  <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto leading-relaxed">
                    You are not on any teams yet. Create a team above or check the invitations tab.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Tabs Content: Incoming invitations */}
          {activeTab === "invites" && (
            <>
              {invites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invites.map((invite) => (
                    <Card key={invite.id} variant="default" className="p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <Badge variant="secondary">Invite Pending</Badge>
                        <h3 className="font-heading font-bold text-base text-neutral-100">{invite.teams?.name}</h3>
                        <p className="text-xs text-neutral-400 font-sans leading-normal">
                          You are invited to join this team for <span className="text-neutral-300 font-medium">{invite.teams?.competitions?.name}</span>.
                        </p>
                      </div>
                      <div className="flex gap-2.5 pt-2 border-t border-neutral-800/40">
                        <Button
                          variant="primary"
                          onClick={() => handleRespondInvite(invite.id, "accepted")}
                          className="flex-1 justify-center gap-1.5 py-2 text-xs"
                        >
                          <Check className="h-4 w-4" />
                          <span>Accept</span>
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleRespondInvite(invite.id, "rejected")}
                          className="flex-1 justify-center gap-1.5 py-2 text-xs hover:border-error hover:text-error"
                        >
                          <X className="h-4 w-4" />
                          <span>Decline</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-neutral-800 rounded-radius-md bg-neutral-900/10">
                  <ShieldAlert className="h-10 w-10 text-neutral-700 mb-4 mx-auto" />
                  <h3 className="font-heading font-semibold text-neutral-300 mb-1">No Pending Invitations</h3>
                  <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto">
                    You don't have any incoming team invitations right now.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
