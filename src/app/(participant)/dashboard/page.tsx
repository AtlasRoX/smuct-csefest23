"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  UserCheck,
  BookOpen,
  ExternalLink,
  FileText,
  X,
  Calendar,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

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

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  university: string | null;
  verification_status: "incomplete" | "pending" | "verified";
  student_id: string | null;
  profile_complete: boolean | null;
}

interface Team {
  id: string;
  name: string;
  status: string;
  leader_id: string;
  competitions: {
    id: string;
    name: string;
    type: string;
    entry_fee: number;
    eligibility: string;
    registration_end: string;
    submission_end: string;
    submission_required: boolean;
    rulebook_url?: string | null;
    template_link?: string | null;
    description?: string | null;
  } | null;
}

interface CompetitionItem {
  name: string;
  registration_end: string;
  submission_end: string;
  submission_required: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
} as const;

function StatusBanner({
  type,
  title,
  message,
  action,
}: {
  type: "warning" | "pending" | "success";
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const config = {
    warning: {
      dot: "bg-warning",
    },
    pending: {
      dot: "bg-primary",
    },
    success: {
      dot: "bg-success",
    },
  };
  const c = config[type];

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card
        variant="glass"
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full"
      >
        <div className="flex gap-3 items-start relative z-10">
          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm text-neutral-100">{title}</h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">{message}</p>
          </div>
        </div>
        {action && <div className="relative z-10 shrink-0">{action}</div>}
      </Card>
    </motion.div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [allCompetitions, setAllCompetitions] = React.useState<CompetitionItem[]>([]);
  const [selectedCompInfo, setSelectedCompInfo] = React.useState<NonNullable<Team["competitions"]> | null>(null);

  useBodyScrollLock(selectedCompInfo !== null);
  const supabase = createClient();

  const loadDashboardData = React.useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        const { data: compList } = await supabase
          .from("competitions")
          .select("name, registration_end, submission_end, submission_required")
          .neq("status", "draft");
        setAllCompetitions((compList as CompetitionItem[]) || []);

        if (profileData) {
          const { data: members } = await supabase
            .from("team_members")
            .select("team_id, joined_at")
            .eq("user_id", user.id)
            .eq("invitation_status", "accepted");

          if (members && members.length > 0) {
            const teamIds = members.map((m) => m.team_id);
            const { data: teamData } = await supabase
              .from("teams")
              .select("*, competitions(id, name, type, entry_fee, eligibility, registration_end, submission_end, submission_required, rulebook_url, template_link, description)")
              .in("id", teamIds);
            setTeams(teamData || []);
          } else {
            setTeams([]);
          }
        }
      } catch (err) {
        console.error("Dashboard loading error", err);
      } finally {
        setLoading(false);
      }
    },
    [supabase, router]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => { loadDashboardData(true); }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  React.useEffect(() => {
    function handleFocus() { loadDashboardData(false); }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") loadDashboardData(false);
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6" suppressHydrationWarning>
        <div className="space-y-2 animate-pulse">
          <div className="h-9 bg-muted w-56 rounded-lg" suppressHydrationWarning />
          <div className="h-4 bg-muted/60 w-80 rounded-md" suppressHydrationWarning />
        </div>
        <div className="h-20 bg-card rounded-xl border border-border animate-pulse" suppressHydrationWarning />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" suppressHydrationWarning>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border animate-pulse" suppressHydrationWarning />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" suppressHydrationWarning>
          <div className="lg:col-span-2 space-y-3" suppressHydrationWarning>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-xl border border-border animate-pulse" suppressHydrationWarning />
            ))}
          </div>
          <div className="h-64 bg-card rounded-xl border border-border animate-pulse" suppressHydrationWarning />
        </div>
      </div>
    );
  }

  const isIncomplete = !profile || !profile.profile_complete;

  const registeredTeams = teams.filter((t) => t.status !== "forming");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Participant Portal
          </p>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">
            Welcome back,{" "}
            <span className="text-foreground">{profile?.full_name?.split(" ")[0] || "Innovator"}</span>
          </h1>
          <p className="text-xs text-muted-foreground font-sans mt-1">
            Manage your teams, track submissions, and stay on top of deadlines.
          </p>
        </div>
      </motion.div>

      {/* Status Banners */}
      {isIncomplete && (
        <StatusBanner
          type="warning"
          title="Profile Setup Required"
          message="Complete your profile and upload your student ID to unlock competition registration."
          action={
            <Link href="/profile-setup">
              <Button variant="primary" className="text-xs py-2 px-4 shadow-sm">
                Complete Profile
              </Button>
            </Link>
          }
        />
      )}

      {!isIncomplete && teams.length === 0 && (
        <StatusBanner
          type="success"
          title="Profile Complete — Competition Access Unlocked!"
          message="Your profile is complete. You can now create or join teams and register for competitions."
          action={
            <Link href="/teams">
              <Button variant="primary" className="text-xs py-2 px-4 shadow-sm">
                Create a Team
              </Button>
            </Link>
          }
        />
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Status */}
        <Card
          variant="glass"
          hoverable
          className="p-5 flex items-center justify-between w-full"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-400 font-sans uppercase tracking-widest block">
              Profile Status
            </span>
            <h4 className={`text-base font-heading font-bold capitalize font-mono ${
              !isIncomplete ? "text-success" : "text-destructive"
            }`}>
              {!isIncomplete ? "Complete" : "Incomplete"}
            </h4>
          </div>
          <div className="p-2.5 rounded border border-border bg-muted text-neutral-400">
            <UserCheck className="h-4 w-4" />
          </div>
        </Card>

        {/* Teams */}
        <Card
          variant="glass"
          hoverable
          className="p-5 flex items-center justify-between w-full"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-400 font-sans uppercase tracking-widest block">
              My Teams
            </span>
            <h4 className="text-2xl font-heading font-bold text-neutral-100 font-mono leading-none">
              {teams.length}
            </h4>
          </div>
          <div className="p-2.5 rounded border border-border bg-muted text-neutral-400">
            <Users className="h-4 w-4" />
          </div>
        </Card>

        {/* Competitions */}
        <Card
          variant="glass"
          hoverable
          className="p-5 flex items-center justify-between w-full"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-400 font-sans uppercase tracking-widest block">
              Registered
            </span>
            <h4 className="text-2xl font-heading font-bold text-neutral-100 font-mono leading-none">
              {registeredTeams.length}
            </h4>
          </div>
          <div className="p-2.5 rounded border border-border bg-muted text-neutral-400">
            <Trophy className="h-4 w-4" />
          </div>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Teams List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-muted-foreground" />
              <h2 className="text-base font-heading font-semibold text-foreground">My Teams</h2>
              {teams.length > 0 && (
                <span className="text-[10px] font-mono bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded font-bold">
                  {teams.length}
                </span>
              )}
            </div>
            <Link href="/teams">
              <Button
                variant="secondary"
                disabled={isIncomplete}
                className="text-xs py-1.5 px-3 h-auto gap-1.5 shadow-sm"
              >
                <span>Manage Teams</span>
              </Button>
            </Link>
          </div>

          {teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team, idx) => {
                const isFinalist = team.status === "finalist";
                const isSelected = team.status === "selected";
                const isRejected = team.status === "rejected";
                const isForming = team.status === "forming";

                const badgeVariant =
                  isFinalist || isSelected
                    ? "success"
                    : isRejected
                    ? "error"
                    : isForming
                    ? "warning"
                    : team.status === "submitted" || team.status === "registered"
                    ? "primary"
                    : "neutral";

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      variant="default"
                      hoverable
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full group"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-semibold text-sm text-foreground truncate">
                            {team.name}
                          </h3>
                          <Badge variant={badgeVariant} className="capitalize text-[10px] py-0.5 px-2 font-mono">
                            {team.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-sans text-muted-foreground">
                          <span className="font-medium text-foreground/80">{team.competitions?.name}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="capitalize">{team.competitions?.type}</span>
                        </div>
                      </div>

                      {team.competitions && (
                        <button
                          onClick={() => setSelectedCompInfo(team.competitions)}
                          className="shrink-0 text-xs py-1.5 px-3 rounded border border-border bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer hover:bg-muted/80 transition-colors shadow-sm"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground/85" />
                          <span>View Rules</span>
                        </button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 border border-dashed border-border rounded-lg text-center bg-card space-y-4 shadow-sm">
              <div className="p-3 bg-muted border border-border rounded-full w-fit mx-auto text-muted-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h3 className="font-heading font-semibold text-foreground text-sm">No Active Teams</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  You haven&apos;t joined any teams. Create a new team or accept a pending invitation.
                </p>
              </div>
              <Link href="/teams">
                <Button
                  variant="primary"
                  disabled={isIncomplete}
                  className="text-xs gap-1.5 mx-auto shadow-sm"
                >
                  Create Team
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right: Deadlines */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Flame className="h-4.5 w-4.5 text-muted-foreground" />
            <h2 className="text-base font-heading font-semibold text-foreground">Deadlines</h2>
          </div>

          <Card variant="glass" className="p-5">
            <div className="pb-3 mb-4 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {teams.length > 0 ? "My Deadlines" : "Upcoming Deadlines"}
                </h3>
              </div>
            </div>
            <div className="font-sans text-xs">
              {(() => {
                const formatDeadlineDate = (dateStr: string) => {
                  try {
                    return new Date(dateStr).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  } catch {
                    return "TBD";
                  }
                };

                const isUpcoming = (dateStr: string) => {
                  try {
                    return new Date(dateStr) > new Date();
                  } catch {
                    return false;
                  }
                };

                const deadlinesToDisplay: { label: string; date: string; compName: string; dateStr: string }[] = [];

                if (teams.length > 0) {
                  teams.forEach((team) => {
                    if (team.competitions) {
                      const comp = team.competitions;
                      deadlinesToDisplay.push({
                        label: "Registration Closes",
                        date: formatDeadlineDate(comp.registration_end),
                        compName: comp.name,
                        dateStr: comp.registration_end,
                      });
                      if (comp.submission_required) {
                        deadlinesToDisplay.push({
                          label: "Submission Closes",
                          date: formatDeadlineDate(comp.submission_end),
                          compName: comp.name,
                          dateStr: comp.submission_end,
                        });
                      }
                    }
                  });
                } else {
                  allCompetitions.forEach((comp) => {
                    deadlinesToDisplay.push({
                      label: "Registration Closes",
                      date: formatDeadlineDate(comp.registration_end),
                      compName: comp.name,
                      dateStr: comp.registration_end,
                    });
                    if (comp.submission_required) {
                      deadlinesToDisplay.push({
                        label: "Submission Closes",
                        date: formatDeadlineDate(comp.submission_end),
                        compName: comp.name,
                        dateStr: comp.submission_end,
                      });
                    }
                  });
                }

                if (deadlinesToDisplay.length > 0) {
                  return (
                    <div className="relative pl-5 space-y-5">
                      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                      {deadlinesToDisplay.map((item, idx) => {
                        const upcoming = isUpcoming(item.dateStr);
                        return (
                          <div key={idx} className="relative group">
                            <div className={`absolute -left-[19px] top-1.5 w-2 h-2 rounded-full border border-border bg-card z-10 transition-colors ${
                              upcoming ? "group-hover:border-primary" : ""
                            }`} />
                            <div className="space-y-0.5">
                              <div className={`font-medium leading-snug ${upcoming ? "text-foreground" : "text-muted-foreground line-through"}`}>
                                {item.compName}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{item.label}</div>
                              <div className={`font-mono text-[9px] ${upcoming ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                                {item.date}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="text-muted-foreground text-center py-6 font-sans text-xs">
                    No upcoming deadlines.
                  </div>
                );
              })()}
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Rules & Instructions Modal */}
      <AnimatePresence>
        {selectedCompInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompInfo(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-3xl bg-card border border-border rounded-lg p-6 shadow-level-3 relative z-10 space-y-5 max-h-[85vh] overflow-y-auto font-sans text-foreground"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" className="text-[10px] uppercase font-mono font-bold tracking-widest py-0.5 px-2 rounded">
                      {selectedCompInfo.type}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-foreground tracking-tight mt-1">
                    {selectedCompInfo.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCompInfo(null)}
                  className="p-1.5 rounded border border-border bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Description */}
                {selectedCompInfo.description && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-mono">Overview</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                      {selectedCompInfo.description}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-border bg-muted p-4 rounded-lg">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono block">Entry Fee</span>
                    <span className="text-sm font-semibold text-foreground block">
                      {Number(selectedCompInfo.entry_fee) === 0 ? "Free" : `${selectedCompInfo.entry_fee} BDT`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono block">Eligibility</span>
                    <span className="text-sm font-semibold text-foreground block capitalize">
                      {selectedCompInfo.eligibility || "Open"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono block">Template</span>
                    {selectedCompInfo.template_link ? (
                      <a
                        href={selectedCompInfo.template_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Download</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not required</span>
                    )}
                  </div>
                </div>

                {/* Rulebook */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-mono">Official Rulebook</h4>
                    {selectedCompInfo.rulebook_url && (
                      <a href={selectedCompInfo.rulebook_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" className="text-[10px] py-1 px-2.5 h-auto gap-1 rounded border border-border bg-card text-foreground hover:bg-muted shadow-sm">
                          <span>Open in Drive</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>

                  {selectedCompInfo.rulebook_url ? (
                    <div className="w-full aspect-[16/9] rounded border border-border bg-background overflow-hidden">
                      <iframe
                        src={getEmbedUrl(selectedCompInfo.rulebook_url)}
                        className="w-full h-full border-0"
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-border rounded bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground leading-normal max-w-sm mx-auto">
                        No rulebook has been uploaded yet. Check back later or consult the coordinator desk.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button variant="secondary" onClick={() => setSelectedCompInfo(null)} className="text-xs py-2 px-4 rounded border border-border bg-card text-foreground hover:bg-muted shadow-sm">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

