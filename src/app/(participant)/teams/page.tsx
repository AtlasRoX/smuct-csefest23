"use client";

import * as React from "react";
import {
  Plus,
  Users,
  UserPlus,
  ShieldAlert,
  Check,
  X,
  AlertCircle,
  Edit,
  Trash2,
  LogOut,
  Crown,
  Lock,
  Calendar,
  BookOpen,
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    let fileId = "";
    const dMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      fileId = dMatch[1];
    } else {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  return url;
}

interface Competition {
  id: string;
  name: string;
  type: string;
  eligibility: string;
  entry_fee: number;
  registration_end?: string;
  submission_end?: string;
  rulebook_url?: string | null;
  template_link?: string | null;
  description?: string | null;
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
  leader_confirmed: boolean;
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
  const [mutationError, setMutationError] = React.useState<string | null>(null);
  const [selectedCompInfo, setSelectedCompInfo] = React.useState<Competition | null>(null);

  // Authenticated user detection
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  // Form states
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [newTeamCompId, setNewTeamCompId] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Rename states
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editLoading, setEditLoading] = React.useState(false);

  // Modals / Confirmations
  const [confirmDisbandId, setConfirmDisbandId] = React.useState<string | null>(null);
  const [disbandLoading, setDisbandLoading] = React.useState(false);

  const [confirmLeaveId, setConfirmLeaveId] = React.useState<string | null>(null);
  const [leaveLoading, setLeaveLoading] = React.useState(false);

  const [confirmKickMember, setConfirmKickMember] = React.useState<{ teamId: string; member: TeamMember } | null>(null);
  const [kickLoading, setKickLoading] = React.useState(false);

  const [confirmTransfer, setConfirmTransfer] = React.useState<{ teamId: string; member: TeamMember } | null>(null);
  const [transferLoading, setTransferLoading] = React.useState(false);

  // Set Leader confirmation state
  const [confirmSetLeader, setConfirmSetLeader] = React.useState<{ teamId: string; member: TeamMember } | null>(null);
  const [setLeaderSelfLoading, setSetLeaderSelfLoading] = React.useState<{ [key: string]: boolean }>({});

  // Invite states (keyed by teamId)
  const [inviteEmails, setInviteEmails] = React.useState<{ [key: string]: string }>({});
  const [inviteLoading, setInviteLoading] = React.useState<{ [key: string]: boolean }>({});

  useBodyScrollLock(
    confirmSetLeader !== null ||
      confirmDisbandId !== null ||
      confirmLeaveId !== null ||
      confirmKickMember !== null ||
      confirmTransfer !== null ||
      selectedCompInfo !== null
  );

  // Setup SWR hooks for fetching
  const {
    data: teamsRes,
    error: teamsError,
    isLoading: teamsLoading,
    mutate: mutateTeams,
  } = useSWR<{ success: boolean; data: Team[] }>("/api/teams", fetcher);

  const {
    data: invitesRes,
    error: invitesError,
    isLoading: invitesLoading,
    mutate: mutateInvites,
  } = useSWR<{ success: boolean; data: Invitation[] }>("/api/teams?mode=invitations", fetcher);

  const { data: compsRes } = useSWR<{ success: boolean; data: Competition[] }>("/api/public/competitions", fetcher);

  const teams = React.useMemo(() => (teamsRes?.success ? teamsRes.data : []), [teamsRes]);
  const invites = React.useMemo(() => (invitesRes?.success ? invitesRes.data : []), [invitesRes]);
  const dbCompetitions = React.useMemo(() => (compsRes?.success ? compsRes.data : []), [compsRes]);
  const loading = teamsLoading || invitesLoading;

  const errorMsg = mutationError || (teamsError || invitesError ? "Failed to load roster data." : null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamCompId) return;

    setCreateLoading(true);
    setMutationError(null);

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
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to create team.";
      setMutationError(errMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditName = async (teamId: string) => {
    if (!editingName.trim()) return;

    setEditLoading(true);
    setMutationError(null);

    try {
      const res = await fetch("/api/teams?action=update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          name: editingName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update team name.");
      }

      setEditingTeamId(null);
      setEditingName("");
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to update team name.";
      setMutationError(errMsg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDisbandTeam = async (teamId: string) => {
    setDisbandLoading(true);
    setMutationError(null);

    try {
      const res = await fetch("/api/teams?action=disband", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to disband team.");
      }

      setConfirmDisbandId(null);
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to disband team.";
      setMutationError(errMsg);
    } finally {
      setDisbandLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    setLeaveLoading(true);
    setMutationError(null);

    try {
      const res = await fetch("/api/teams?action=leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to leave team.");
      }

      setConfirmLeaveId(null);
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to leave team.";
      setMutationError(errMsg);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleKickMember = async (teamId: string, userId: string) => {
    setKickLoading(true);
    setMutationError(null);

    try {
      const res = await fetch("/api/teams?action=remove_member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, user_id: userId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to remove member.");
      }

      setConfirmKickMember(null);
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to remove member.";
      setMutationError(errMsg);
    } finally {
      setKickLoading(false);
    }
  };

  const handleTransferLeadership = async (teamId: string, newLeaderId: string) => {
    setTransferLoading(true);
    setMutationError(null);

    try {
      const res = await fetch("/api/teams?action=transfer_leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, new_leader_id: newLeaderId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to transfer leadership.");
      }

      setConfirmTransfer(null);
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to transfer leadership.";
      setMutationError(errMsg);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleInviteMember = async (teamId: string) => {
    const email = inviteEmails[teamId];
    if (!email) return;

    setInviteLoading((prev) => ({ ...prev, [teamId]: true }));
    setMutationError(null);

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
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send invitation.";
      setMutationError(errMsg);
    } finally {
      setInviteLoading((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const handleRespondInvite = async (inviteId: string, status: "accepted" | "rejected") => {
    setMutationError(null);
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

      await Promise.all([mutateTeams(), mutateInvites()]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Response action failed.";
      setMutationError(errMsg);
    }
  };

  const handleSetLeader = async (teamId: string, userId: string, isSelf: boolean) => {
    const loadingKey = `${teamId}-${userId}`;
    setSetLeaderSelfLoading((prev) => ({ ...prev, [loadingKey]: true }));
    setMutationError(null);

    try {
      const res = await fetch("/api/teams?action=set_leader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, user_id: userId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to confirm team leader.");
      }

      setConfirmSetLeader(null);
      await mutateTeams();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to confirm team leader.";
      setMutationError(errMsg);
    } finally {
      setSetLeaderSelfLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="space-y-6 relative animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800/40">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-neutral-100 tracking-tight uppercase">Team Management</h1>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            Build your roster, invite developers, and manage invitations.
          </p>
        </div>
        <div>
          {!showCreateForm && (
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              className="gap-2 hover:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-transparent font-mono text-xs uppercase tracking-wider py-2 rounded transition-all duration-150 active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>Create Team</span>
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded border border-error/30 bg-error/10 text-xs text-error font-mono flex items-start gap-2 animate-slide-down">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create Team Overlay Form */}
      {showCreateForm && (
        <Card className="border-neutral-800/40 bg-neutral-900/10 shadow-none rounded-lg p-5 max-w-2xl">
          <CardHeader className="border-b border-neutral-800/40 pb-3 mb-5">
            <CardTitle className="text-xs uppercase font-mono tracking-widest text-neutral-400">Create New Team</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Team Name</label>
                <Input
                  placeholder="e.g. Code Knights"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={createLoading}
                  className="bg-neutral-950 border-neutral-800/80 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 hover:border-neutral-700/60 transition-all duration-150 text-xs h-9"
                  required
                />
              </div>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Competition</label>
                <select
                  value={newTeamCompId}
                  onChange={(e) => setNewTeamCompId(e.target.value)}
                  disabled={createLoading}
                  required
                  className="flex h-9 w-full rounded border border-neutral-800/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 hover:border-neutral-700/60 transition-all outline-none font-sans cursor-pointer"
                >
                  <option value="">Select Competition</option>
                  {dbCompetitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.eligibility})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800/40 mt-5">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={createLoading}
                  className="py-2 px-4 rounded border border-transparent bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-98"
                >
                  Create Team
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={createLoading}
                  className="py-2 px-4 rounded border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-350 font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-98"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs Selector */}
      <div className="flex justify-between items-center flex-wrap gap-4 pb-1">
        <div className="flex gap-1.5 bg-neutral-900/10 p-1 rounded border border-neutral-800/40 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("teams")}
            className={`py-1.5 px-4 text-xs font-mono tracking-wider capitalize rounded transition-all duration-150 cursor-pointer outline-none ${
              activeTab === "teams"
                ? "bg-neutral-900 border border-neutral-800/60 text-neutral-100 font-semibold"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40 border border-transparent"
            }`}
          >
            My Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className={`py-1.5 px-4 text-xs font-mono tracking-wider capitalize rounded transition-all duration-150 cursor-pointer outline-none ${
              activeTab === "invites"
                ? "bg-neutral-900 border border-neutral-800/60 text-neutral-100 font-semibold"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40 border border-transparent"
            }`}
          >
            Invitations ({invites.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-neutral-900/10 border border-neutral-800/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Content: Teams list */}
          {activeTab === "teams" && (
            <>
              {teams.length > 0 ? (
                <div className="space-y-6">
                  {teams.map((team) => {
                    const isLeader = team.leader_id === currentUserId;
                    const isDeadlinePassed = team.competitions?.registration_end
                      ? new Date() > new Date(team.competitions.registration_end)
                      : false;

                    const regEndFormatted = team.competitions?.registration_end
                      ? new Date(team.competitions.registration_end).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "TBD";

                    return (
                      <Card key={team.id} className="border-neutral-800/40 bg-neutral-900/10 p-5 space-y-5 hover:border-neutral-700/65 shadow-none transition-all duration-150 rounded-lg">
                        {/* Lock Warning Banner */}
                        {isDeadlinePassed ? (
                          <div className="p-3 rounded border border-error/30 bg-error/10 flex items-center gap-2.5 text-xs text-error font-mono tracking-wide animate-slide-down">
                            <Lock className="h-4 w-4 shrink-0 text-error" />
                            <span>ROSTER LOCKED. Registration ended on {regEndFormatted}. No roster changes are permitted.</span>
                          </div>
                        ) : !team.leader_confirmed && isLeader ? (
                          <div className="p-3 rounded border border-warning/30 bg-warning/10 flex items-start gap-2.5 text-xs font-mono tracking-wide animate-slide-down">
                            <Crown className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                            <div className="space-y-1.5">
                              <p className="text-warning font-semibold">LEADER NOT CONFIRMED — Submission locked until you designate a team leader.</p>
                              <p className="text-warning/80 text-[10px]">Click the crown icon next to a member to set them as leader, or click below to confirm yourself.</p>
                              <button
                                type="button"
                                onClick={() => handleSetLeader(team.id, currentUserId!, true)}
                                disabled={setLeaderSelfLoading[`${team.id}-${currentUserId}`]}
                                className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded border border-warning/30 text-warning hover:bg-warning/20 hover:border-warning/80 transition-all text-[10px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                {setLeaderSelfLoading[`${team.id}-${currentUserId}`] ? "Confirming..." : "Confirm Myself as Leader"}
                              </button>
                            </div>
                          </div>
                        ) : team.leader_confirmed ? (
                          <div className="p-3 rounded border border-success/30 bg-success/10 flex items-center gap-2.5 text-xs text-success font-mono tracking-wide">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                            <span>LEADER CONFIRMED. Team is ready to submit.</span>
                          </div>
                        ) : (
                          <div className="p-3 rounded border border-neutral-800 bg-neutral-950/40 flex items-center gap-2.5 text-xs text-neutral-400 font-mono tracking-wide animate-slide-down">
                            <Calendar className="h-4 w-4 shrink-0 text-neutral-500" />
                            <span>Roster editable until: <strong className="text-neutral-250 font-bold">{regEndFormatted}</strong>.</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-neutral-800/40">
                          <div className="space-y-2 flex-1">
                            {editingTeamId === team.id ? (
                              <div className="flex items-center gap-2 w-full max-w-sm">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  disabled={editLoading}
                                  className="h-9 text-xs bg-neutral-950 border-neutral-800"
                                  placeholder="New team name"
                                  required
                                />
                                <Button
                                  variant="primary"
                                  onClick={() => handleEditName(team.id)}
                                  isLoading={editLoading}
                                  className="h-9 w-9 p-0 shrink-0 flex items-center justify-center hover:scale-102 transition-all"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingTeamId(null);
                                    setEditingName("");
                                  }}
                                  disabled={editLoading}
                                  className="h-9 w-9 p-0 shrink-0 flex items-center justify-center hover:border-rose-900 hover:text-error hover:scale-102 transition-all"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-heading font-bold text-neutral-100">{team.name}</h3>
                                {isLeader && !isDeadlinePassed && (
                                  <button
                                    onClick={() => {
                                      setEditingTeamId(team.id);
                                      setEditingName(team.name);
                                    }}
                                    className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/60 transition-all duration-150 cursor-pointer outline-none border-0 bg-transparent"
                                    title="Edit Team Name"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-neutral-500 font-sans flex items-center gap-1.5">
                              <span>Registered for:</span>
                              <span className="text-neutral-300 font-semibold">{team.competitions?.name}</span>
                            </p>
                            {team.competitions && (
                              <div className="mt-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => setSelectedCompInfo(team.competitions)}
                                  className="text-[10px] py-1 px-2.5 h-auto border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 gap-1.5 rounded transition-all font-mono uppercase tracking-wider"
                                >
                                  <BookOpen className="h-3.5 w-3.5 text-neutral-500" />
                                  <span>View Rules & Instructions</span>
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 border rounded text-[9px] uppercase font-mono tracking-widest ${
                              isLeader
                                ? "border-neutral-500 bg-neutral-900 text-neutral-200 font-semibold"
                                : "border-neutral-800 bg-neutral-950/45 text-neutral-500"
                            }`}>
                              {isLeader ? "Leader" : "Member"}
                            </span>
                            <span className={`px-2 py-0.5 border rounded text-[9px] uppercase font-mono tracking-widest ${
                              team.status === "finalist" || team.status === "selected"
                                ? "border-success/30 bg-success/10 text-success"
                                : team.status === "rejected"
                                ? "border-error/30 bg-error/10 text-error"
                                : team.status === "forming"
                                ? "border-warning/30 bg-warning/10 text-warning"
                                : "border-neutral-800 bg-neutral-900 text-neutral-300"
                            }`}>
                              {team.status}
                            </span>

                            {/* Disband (Leader) / Leave (Member) buttons */}
                            {isLeader ? (
                              !isDeadlinePassed && (
                                <Button
                                  variant="secondary"
                                  onClick={() => setConfirmDisbandId(team.id)}
                                  className="text-xs py-1.5 px-3 border border-error/30 text-error hover:bg-error/10 hover:border-rose-900 transition-all gap-1.5 h-8 font-mono uppercase tracking-wider"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Disband</span>
                                </Button>
                              )
                            ) : (
                              !isDeadlinePassed && (
                                <Button
                                  variant="secondary"
                                  onClick={() => setConfirmLeaveId(team.id)}
                                  className="text-xs py-1.5 px-3 border border-warning/30 text-warning hover:bg-warning/10 hover:border-amber-900 transition-all gap-1.5 h-8 font-mono uppercase tracking-wider"
                                >
                                  <LogOut className="h-3.5 w-3.5" />
                                  <span>Leave Team</span>
                                </Button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Roster list */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest font-mono">Roster Members</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {team.members.map((member: TeamMember) => {
                              const isMemberLeader = member.role === "leader";
                              return (
                                <div
                                  key={member.id}
                                  className="p-3 rounded border border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3 text-xs font-sans hover:border-neutral-700/60 transition-all duration-150"
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                                      <span>{member.profiles?.full_name || "Unknown"}</span>
                                      {isMemberLeader && (
                                        <span title="Team Leader" className="text-neutral-400">
                                          <Crown className="h-3.5 w-3.5" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 font-mono">{member.profiles?.email}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 border rounded text-[9px] font-mono uppercase tracking-widest ${
                                      member.invitation_status === "accepted"
                                        ? "border-success/30 bg-success/10 text-success"
                                        : "border-warning/30 bg-warning/10 text-warning"
                                    }`}>
                                      {member.invitation_status}
                                    </span>

                                    {/* Action Buttons (Leader only, before deadline) */}
                                    {isLeader && !isMemberLeader && !isDeadlinePassed && (
                                      <div className="flex items-center gap-1">
                                        {member.invitation_status === "accepted" && (
                                          <button
                                            type="button"
                                            onClick={() => setConfirmSetLeader({ teamId: team.id, member })}
                                            className="p-1 rounded text-neutral-500 hover:text-warning hover:bg-neutral-900 transition-all duration-150 cursor-pointer outline-none bg-transparent border-0"
                                            title="Set as Team Leader"
                                          >
                                            <Crown className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setConfirmKickMember({ teamId: team.id, member })}
                                          className="p-1 rounded text-neutral-500 hover:text-error hover:bg-neutral-900 transition-all duration-150 cursor-pointer outline-none bg-transparent border-0"
                                          title={member.invitation_status === "pending" ? "Cancel Invitation" : "Remove Member"}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Invite Form (Leader Only, before deadline) */}
                        {isLeader && !isDeadlinePassed && (
                          <div className="pt-4 border-t border-neutral-800/40 space-y-3">
                            <h4 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest font-mono">Invite Developer</h4>
                            <div className="flex gap-3 max-w-md">
                              <Input
                                placeholder="developer@university.edu.bd"
                                value={inviteEmails[team.id] || ""}
                                onChange={(e) =>
                                  setInviteEmails((prev) => ({ ...prev, [team.id]: e.target.value }))
                                }
                                disabled={inviteLoading[team.id]}
                                className="flex-1 bg-neutral-950 border-neutral-800 focus:border-neutral-700 hover:border-neutral-700/60 text-xs transition-all h-9"
                              />
                              <Button
                                variant="primary"
                                onClick={() => handleInviteMember(team.id)}
                                isLoading={inviteLoading[team.id]}
                                className="shrink-0 gap-2 hover:border-neutral-705 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-transparent font-mono text-xs uppercase tracking-wider px-4 h-9 rounded transition-all duration-150 active:scale-98"
                              >
                                <UserPlus className="h-4 w-4" />
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
                <div className="py-16 text-center border border-dashed border-neutral-800/80 rounded bg-neutral-900/10">
                  <Users className="h-8 w-8 text-neutral-700 mb-3 mx-auto" />
                  <h3 className="font-heading font-semibold text-neutral-400 text-sm mb-1">No Active Teams</h3>
                  <p className="text-xs text-neutral-600 font-sans max-w-xs mx-auto leading-relaxed">
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
                    <Card key={invite.id} className="border-neutral-800/40 bg-neutral-900/10 p-5 flex flex-col justify-between gap-4 hover:border-neutral-700/60 hover:shadow-none transition-all rounded-lg">
                      <div className="space-y-2">
                        <span className="px-1.5 py-0.5 border border-warning/30 bg-warning/10 text-warning rounded text-[9px] font-mono uppercase tracking-widest">Invite Pending</span>
                        <h3 className="font-heading font-bold text-sm text-neutral-100 mt-1">{invite.teams?.name}</h3>
                        <p className="text-xs text-neutral-500 font-sans leading-normal">
                          You are invited to join this team for <span className="text-neutral-300 font-semibold">{invite.teams?.competitions?.name}</span>.
                        </p>
                      </div>
                      <div className="flex gap-2.5 pt-3 border-t border-neutral-800/40">
                        <Button
                          variant="success"
                          onClick={() => handleRespondInvite(invite.id, "accepted")}
                          className="flex-1 justify-center gap-1.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept</span>
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRespondInvite(invite.id, "rejected")}
                          className="flex-1 justify-center gap-1.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Decline</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-neutral-800/80 rounded bg-neutral-900/10">
                  <ShieldAlert className="h-8 w-8 text-neutral-700 mb-3 mx-auto" />
                  <h3 className="font-heading font-semibold text-neutral-400 text-sm mb-1">No Pending Invitations</h3>
                  <p className="text-xs text-neutral-600 font-sans max-w-xs mx-auto">
                    You don&apos;t have any incoming team invitations right now.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}


      <AnimatePresence>
        {/* Set Team Leader Modal */}
        {confirmSetLeader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmSetLeader(null)}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-xl p-6 shadow-level-3 relative z-10 space-y-4 font-sans backdrop-blur-lg border-glass"
            >
              <div className="flex items-start gap-3">
                <Crown className="h-6 w-6 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold font-heading text-neutral-100">Designate Team Leader?</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Set <strong className="text-neutral-100">{confirmSetLeader.member.profiles?.full_name || "this member"}</strong> as the official team leader. This will confirm their role and unlock submissions for your team.
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono">You can still transfer leadership again later before the deadline.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => handleSetLeader(confirmSetLeader.teamId, confirmSetLeader.member.user_id, false)}
                  isLoading={setLeaderSelfLoading[`${confirmSetLeader.teamId}-${confirmSetLeader.member.user_id}`]}
                  className="flex-1 py-2 text-xs gap-1.5 bg-warning hover:bg-warning text-neutral-950 border-transparent hover:scale-[1.02] active:scale-[0.98] transition-all font-mono"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Confirm as Leader
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmSetLeader(null)}
                  disabled={setLeaderSelfLoading[`${confirmSetLeader.teamId}-${confirmSetLeader.member.user_id}`]}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Disband Modal */}
        {confirmDisbandId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDisbandId(null)}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-xl p-6 shadow-level-3 relative z-10 space-y-4 font-sans backdrop-blur-lg border-glass"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-error shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold font-heading text-neutral-100">Disband Team?</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Are you sure you want to disband this team? This will permanently delete the team, its roster, and any uploaded submissions or payments. 
                    <strong className="text-error mt-2 block">This action cannot be undone.</strong>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDisbandTeam(confirmDisbandId)}
                  isLoading={disbandLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Disband Team
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDisbandId(null)}
                  disabled={disbandLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leave Team Modal */}
        {confirmLeaveId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmLeaveId(null)}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-xl p-6 shadow-level-3 relative z-10 space-y-4 font-sans backdrop-blur-lg border-glass"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold font-heading text-neutral-100">Leave Team?</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Are you sure you want to leave this team? You will be removed from the roster and will no longer participate in this competition with this team.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  onClick={() => handleLeaveTeam(confirmLeaveId)}
                  isLoading={leaveLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Leave Team
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmLeaveId(null)}
                  disabled={leaveLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Kick Member Modal */}
        {confirmKickMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmKickMember(null)}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-xl p-6 shadow-level-3 relative z-10 space-y-4 font-sans backdrop-blur-lg border-glass"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-error shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold font-heading text-neutral-100">
                    {confirmKickMember.member.invitation_status === "pending" ? "Cancel Invitation?" : "Remove Member?"}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Are you sure you want to {confirmKickMember.member.invitation_status === "pending" ? "cancel the invitation for" : "remove"}{" "}
                    <strong className="text-neutral-200">{confirmKickMember.member.profiles?.full_name || "this user"}</strong>?
                    {confirmKickMember.member.invitation_status === "accepted" && " They will be removed from the team roster."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  onClick={() => handleKickMember(confirmKickMember.teamId, confirmKickMember.member.user_id)}
                  isLoading={kickLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {confirmKickMember.member.invitation_status === "pending" ? "Cancel Invitation" : "Remove Member"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmKickMember(null)}
                  disabled={kickLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Transfer Leadership Modal */}
        {confirmTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmTransfer(null)}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-xl p-6 shadow-level-3 relative z-10 space-y-4 font-sans backdrop-blur-lg border-glass"
            >
              <div className="flex items-start gap-3">
                <Crown className="h-6 w-6 text-gold shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold font-heading text-neutral-100">Transfer Leadership?</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Are you sure you want to transfer team leadership to{" "}
                    <strong className="text-neutral-200">{confirmTransfer.member.profiles?.full_name}</strong>?
                    <span className="block mt-2">You will become a regular member of the team and lose leader permissions (such as renaming the team, inviting/removing members, or disbanding the team).</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => handleTransferLeadership(confirmTransfer.teamId, confirmTransfer.member.user_id)}
                  isLoading={transferLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Transfer Leadership
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmTransfer(null)}
                  disabled={transferLoading}
                  className="flex-1 py-2 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Competition Rules & Instructions Modal */}
        {selectedCompInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompInfo(null)}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl bg-neutral-900/95 border border-neutral-800 rounded-xl p-6 shadow-level-3 relative z-10 space-y-5 max-h-[85vh] overflow-y-auto font-sans text-neutral-300 backdrop-blur-lg border-glass"
            >
              <div className="flex justify-between items-start border-b border-neutral-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" className="text-xs uppercase font-mono font-bold tracking-wider py-0.5">
                      {selectedCompInfo.type}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold font-heading text-neutral-50 tracking-tight">
                    {selectedCompInfo.name.toUpperCase()}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCompInfo(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer outline-none border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Description */}
                {selectedCompInfo.description && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest font-mono">Overview</h4>
                    <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                      {selectedCompInfo.description}
                    </p>
                  </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-neutral-800/80 bg-neutral-950/50 p-4 rounded-lg">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-sans block">Entry Fee</span>
                    <span className="text-sm font-semibold text-neutral-200 mt-0.5 block">
                      {selectedCompInfo.entry_fee || selectedCompInfo.entry_fee === 0 ? (
                        Number(selectedCompInfo.entry_fee) === 0 ? "Free" : `${selectedCompInfo.entry_fee} BDT`
                      ) : (
                        "Free"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-sans block">Eligibility</span>
                    <span className="text-sm font-semibold text-neutral-200 mt-0.5 block capitalize">
                      {selectedCompInfo.eligibility || "Open"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-sans block">Templates & Submissions</span>
                    {selectedCompInfo.template_link ? (
                      <a
                        href={selectedCompInfo.template_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-accent hover:text-accent/85 transition-colors inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>Template Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-neutral-400 mt-0.5 block">
                        No templates required
                      </span>
                    )}
                  </div>
                </div>

                {/* Rulebook section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest font-mono">Official Rulebook</h4>
                    {selectedCompInfo.rulebook_url ? (
                      <a
                        href={selectedCompInfo.rulebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" className="text-[11px] py-1.5 px-3 h-auto gap-1 rounded hover:scale-105 active:scale-[0.98] transition-all">
                          <span>Open in Drive</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-500">No rulebook link attached</span>
                    )}
                  </div>

                  {selectedCompInfo.rulebook_url ? (
                    <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 relative">
                      <iframe
                        src={getEmbedUrl(selectedCompInfo.rulebook_url)}
                        className="w-full h-full border-0"
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-neutral-850 rounded-sm bg-neutral-900/10">
                      <FileText className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500 leading-normal max-w-sm mx-auto">
                        No rulebook PDF has been uploaded for this competition yet. Please check back later or consult the coordinator desk.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-neutral-800/60">
                <Button variant="secondary" onClick={() => setSelectedCompInfo(null)} className="text-xs py-2 px-4 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
