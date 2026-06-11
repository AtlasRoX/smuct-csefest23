"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Users,
  Trophy,
  Calendar,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  university: string | null;
  verification_status: "incomplete" | "pending" | "verified";
  student_id: string | null;
}

interface Team {
  id: string;
  name: string;
  status: string;
  leader_id: string;
  competitions: {
    name: string;
    type: string;
    entry_fee: number;
    registration_end: string;
    submission_end: string;
    submission_required: boolean;
  } | null;
}

interface CompetitionItem {
  name: string;
  registration_end: string;
  submission_end: string;
  submission_required: boolean;
}

export default function DashboardHome() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [allCompetitions, setAllCompetitions] = React.useState<CompetitionItem[]>([]);
  const supabase = createClient();

  const loadDashboardData = React.useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Load profile (always fresh — no cache)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        // Load all active competitions for general deadlines fallback
        const { data: compList } = await supabase
          .from("competitions")
          .select("name, registration_end, submission_end, submission_required")
          .neq("status", "draft");
        setAllCompetitions((compList as CompetitionItem[]) || []);

        // Load user's teams
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
              .select("*, competitions(name, type, entry_fee, registration_end, submission_end, submission_required)")
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

  // Initial load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  // Re-fetch silently when user comes back to the tab
  // (so after admin approves, status updates without hard refresh)
  React.useEffect(() => {
    function handleFocus() {
      loadDashboardData(false);
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadDashboardData(false);
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadDashboardData]);

  if (loading) {
    // Premium skeleton loader
    return (
      <div className="space-y-6 animate-pulse" suppressHydrationWarning>
        <div className="h-10 bg-neutral-900 w-1/3 rounded-sm" suppressHydrationWarning />
        <div className="h-24 bg-neutral-900 w-full rounded-md" suppressHydrationWarning />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" suppressHydrationWarning>
          <div className="h-32 bg-neutral-900 rounded-md" suppressHydrationWarning />
          <div className="h-32 bg-neutral-900 rounded-md" suppressHydrationWarning />
          <div className="h-32 bg-neutral-900 rounded-md" suppressHydrationWarning />
        </div>
        <div className="h-64 bg-neutral-900 w-full rounded-md" suppressHydrationWarning />
      </div>
    );
  }

  // Check if profile details are incomplete
  const isIncomplete =
    !profile ||
    !profile.phone ||
    !profile.university ||
    profile.verification_status === "incomplete";

  return (
    <div className="space-y-8">
      {/* Page Title & Profile Name */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-h3 font-heading font-bold text-neutral-50">
            Welcome back, {profile?.full_name || "Innovator"}
          </h1>
          <p className="text-sm text-neutral-400 font-sans mt-1">
            Manage your rosters, register for events, and monitor submission timelines.
          </p>
        </div>
      </div>

      {/* Warnings & Alerts */}
      {isIncomplete && (
        <div className="p-4 rounded-md bg-warning/10 border border-warning/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-sm text-neutral-200">
                Profile Setup Required
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                You must complete your profile and upload your student ID to register for competitions.
              </p>
            </div>
          </div>
          <Link href="/profile-setup">
            <Button variant="primary" className="text-xs py-2 px-4 shrink-0">
              Complete Profile Setup
            </Button>
          </Link>
        </div>
      )}

      {/* Profile Verification status banner */}
      {!isIncomplete && profile?.verification_status === "pending" && (
        <div className="p-4 rounded-md bg-primary/10 border border-primary/20 flex items-start gap-3">
          <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-sm text-neutral-200">
              Student ID Review Pending
            </h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Your student ID verification is currently pending review by festival organizers. Competition access unlocks once verified.
            </p>
          </div>
        </div>
      )}

      {/* Verified success banner — shown after admin approves */}
      {profile?.verification_status === "verified" && teams.length === 0 && (
        <div className="p-4 rounded-md bg-success/10 border border-success/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-sm text-neutral-200">
                You&apos;re Verified — Competition Access Unlocked!
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Your student ID has been verified. You can now create or join teams and register for competitions.
              </p>
            </div>
          </div>
          <Link href="/teams">
            <Button variant="primary" className="text-xs py-2 px-4 shrink-0 bg-success hover:bg-success/90 border-success">
              Create a Team
            </Button>
          </Link>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verification Widget */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Verification Status
              </span>
              <h4 className="text-lg font-heading font-bold text-neutral-200 capitalize">
                {profile?.verification_status || "Incomplete"}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              {profile?.verification_status === "verified" ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : profile?.verification_status === "pending" ? (
                <Clock className="h-6 w-6 text-warning" />
              ) : (
                <UserCheck className="h-6 w-6 text-neutral-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registered Teams Counter */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                My Teams
              </span>
              <h4 className="text-lg font-heading font-bold text-neutral-200 font-mono">
                {teams.length}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Users className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>

        {/* Competition Registrations Counter */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Competitions
              </span>
              <h4 className="text-lg font-heading font-bold text-neutral-200 font-mono">
                {teams.filter((t) => t.status !== "forming").length}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Trophy className="h-6 w-6 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel Content: Teams and registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Active Teams */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-heading font-semibold text-neutral-200">My Teams</h2>
            <Link href="/teams">
              <Button
                variant="secondary"
                disabled={profile?.verification_status !== "verified"}
                className="text-xs py-1.5 px-3 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Team</span>
              </Button>
            </Link>
          </div>

          {teams.length > 0 ? (
            <div className="space-y-4">
              {teams.map((team) => (
                <Card key={team.id} hoverable className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-heading font-semibold text-base text-neutral-200">
                      {team.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-sans text-neutral-400">
                      <span>{team.competitions?.name}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-700" />
                      <span className="capitalize">{team.competitions?.type}</span>
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant={
                        team.status === "finalist"
                          ? "success"
                          : team.status === "submitted"
                          ? "primary"
                          : team.status === "rejected"
                          ? "error"
                          : "neutral"
                      }
                      className="capitalize"
                    >
                      {team.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Custom standard empty state illustration CTA card */
            <div className="py-12 border border-dashed border-neutral-800 rounded-md text-center bg-neutral-900/10 space-y-4">
              <Users className="h-10 w-10 text-neutral-700 mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-heading font-semibold text-sm text-neutral-300">No Teams Joined</h3>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  You are not a member of any teams yet. Create a new team or accept an invitation to join one.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/teams">
                  <Button
                    variant="primary"
                    disabled={profile?.verification_status !== "verified"}
                    className="text-xs"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Timelines and Announcements */}
        <div className="space-y-6">
          <h2 className="text-lg font-heading font-semibold text-neutral-200">Deadlines</h2>
          <Card variant="default">
            <CardHeader>
              <h3 className="text-sm font-semibold font-heading text-neutral-300">
                {teams.length > 0 ? "My Deadlines" : "Upcoming Deadlines"}
              </h3>
            </CardHeader>
            <CardContent className="space-y-4 font-sans text-xs">
              {(() => {
                const formatDeadlineDate = (dateStr: string) => {
                  try {
                    return new Date(dateStr).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  } catch {
                    return "TBD";
                  }
                };

                const deadlinesToDisplay: { label: string; date: string; compName: string }[] = [];

                if (teams.length > 0) {
                  teams.forEach((team) => {
                    if (team.competitions) {
                      const comp = team.competitions;
                      deadlinesToDisplay.push({
                        label: "Registration Close",
                        date: formatDeadlineDate(comp.registration_end),
                        compName: comp.name,
                      });
                      if (comp.submission_required) {
                        deadlinesToDisplay.push({
                          label: "Proposal Submission Close",
                          date: formatDeadlineDate(comp.submission_end),
                          compName: comp.name,
                        });
                      }
                    }
                  });
                } else {
                  allCompetitions.forEach((comp) => {
                    deadlinesToDisplay.push({
                      label: "Registration Close",
                      date: formatDeadlineDate(comp.registration_end),
                      compName: comp.name,
                    });
                    if (comp.submission_required) {
                      deadlinesToDisplay.push({
                        label: "Proposal Submission Close",
                        date: formatDeadlineDate(comp.submission_end),
                        compName: comp.name,
                      });
                    }
                  });
                }

                if (deadlinesToDisplay.length > 0) {
                  return deadlinesToDisplay.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 py-1.5 ${
                        idx < deadlinesToDisplay.length - 1 ? "border-b border-neutral-800/40" : ""
                      }`}
                    >
                      <Calendar className="h-4.5 w-4.5 text-accent shrink-0" />
                      <div className="space-y-1">
                        <div className="font-semibold text-neutral-300">
                          {item.compName} - {item.label}
                        </div>
                        <div className="text-neutral-500">{item.date}</div>
                      </div>
                    </div>
                  ));
                }

                return (
                  <div className="text-neutral-500 text-center py-4">No upcoming deadlines.</div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
