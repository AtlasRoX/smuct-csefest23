"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  AlertCircle,
  Check,
  Calendar,
  ExternalLink,
  Users,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

interface UserTeam {
  id: string;
  name: string;
  status: string;
  competitions: {
    id: string;
    name: string;
    submission_start: string;
    submission_end: string;
  } | null;
}

interface Submission {
  id: string;
  title: string;
  google_docs_url: string;
  notes: string | null;
  status: string;
  submitted_at: string;
}

export default function SubmissionsPage() {
  const [loading, setLoading] = React.useState(true);
  const [teams, setTeams] = React.useState<UserTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [subLoading, setSubLoading] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState("");
  const [googleDocsUrl, setGoogleDocsUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [formLoading, setFormLoading] = React.useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const supabase = createClient();

  // Load user's teams
  React.useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch team memberships
        const { data: memberships } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .eq("invitation_status", "accepted");

        if (memberships && memberships.length > 0) {
          const ids = memberships.map((m) => m.team_id);
          const { data: teamData, error } = await supabase
            .from("teams")
            .select("id, name, status, competitions(id, name, submission_start, submission_end)")
            .in("id", ids);

          if (error) throw error;
          const formattedTeams = (teamData || []) as unknown as UserTeam[];
          setTeams(formattedTeams);

          if (formattedTeams.length > 0) {
            setSelectedTeamId(formattedTeams[0].id);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load team rosters.";
        setErrorMsg(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [supabase]);

  // Load submission for selected team
  React.useEffect(() => {
    let active = true;
    async function loadSubmission() {
      if (!selectedTeamId) {
        await Promise.resolve();
        if (active) setSubmission(null);
        return;
      }

      setSubLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/submissions?team_id=${selectedTeamId}`);
        const data = await res.json();
        if (active) {
          if (data.success && data.data) {
            setSubmission(data.data);
            setTitle(data.data.title);
            setGoogleDocsUrl(data.data.google_docs_url);
            setNotes(data.data.notes || "");
          } else {
            setSubmission(null);
            setTitle("");
            setGoogleDocsUrl("");
            setNotes("");
          }
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load submission data.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setSubLoading(false);
        }
      }
    }

    loadSubmission();

    return () => {
      active = false;
    };
  }, [selectedTeamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: selectedTeamId,
          title,
          google_docs_url: googleDocsUrl,
          notes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to submit proposal.");
      }

      setSuccessMsg(data.message);
      // Reload submission
      const subRes = await fetch(`/api/submissions?team_id=${selectedTeamId}`);
      const subData = await subRes.json();
      if (subData.success) {
        setSubmission(subData.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred.";
      setErrorMsg(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-neutral-900 w-1/3 rounded-sm" />
        <div className="h-24 bg-neutral-900 w-full rounded-md" />
        <div className="h-64 bg-neutral-900 w-full rounded-md" />
      </div>
    );
  }

  const activeTeam = teams.find((t) => t.id === selectedTeamId);
  const comp = activeTeam?.competitions;
  const now = new Date();
  const subStart = comp ? new Date(comp.submission_start) : null;
  const subEnd = comp ? new Date(comp.submission_end) : null;

  const isWindowOpen = subStart && subEnd && now >= subStart && now <= subEnd;
  const hasNotOpened = subStart && now < subStart;
  const isExpired = subEnd && now > subEnd;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Project Submissions</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Submit project proposals and Google Docs description links for evaluation.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-sm bg-error/10 border border-error/20 text-xs text-error font-sans font-medium flex items-start gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-sm bg-success/10 border border-success/20 text-xs text-success font-sans font-medium flex items-start gap-2">
          <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form/Detail Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Selector card */}
            <Card variant="default">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-300 font-sans">
                    Select Active Team Roster
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.competitions?.name})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {subLoading ? (
              <div className="h-48 bg-neutral-900/40 rounded-md animate-pulse" />
            ) : submission ? (
              /* Submission details */
              <Card variant="default" className="border-success/20 bg-success/5">
                <CardHeader className="flex flex-row justify-between items-start">
                  <CardTitle>Roster Proposal Info</CardTitle>
                  <Badge variant="success" className="capitalize">
                    {submission.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 font-sans">
                    <div>
                      <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                        Proposal Title
                      </div>
                      <div className="text-sm text-neutral-100 font-medium mt-1">
                        {submission.title}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                        Google Docs Rulebook/Proposal Link
                      </div>
                      <div className="mt-1 flex items-center">
                        <a
                          href={submission.google_docs_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:underline flex items-center gap-1.5"
                        >
                          <span>Open Google Docs URL</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    {submission.notes && (
                      <div>
                        <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                          Roster Notes
                        </div>
                        <div className="text-xs text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {submission.notes}
                        </div>
                      </div>
                    )}
                    <div className="text-xxs text-neutral-500 pt-2 border-t border-neutral-800">
                      Submitted on: {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Edit submission if window open */}
                  {isWindowOpen && (
                    <div className="border-t border-neutral-800 pt-6 space-y-4">
                      <h3 className="font-heading font-semibold text-sm text-neutral-300">
                        Update Submission Configuration
                      </h3>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                          label="Proposal Title"
                          placeholder="Update title..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={formLoading}
                          required
                        />
                        <Input
                          label="Google Docs Link"
                          placeholder="https://docs.google.com/..."
                          value={googleDocsUrl}
                          onChange={(e) => setGoogleDocsUrl(e.target.value)}
                          disabled={formLoading}
                          required
                        />
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-sm font-medium text-neutral-300 font-sans">Notes</label>
                          <textarea
                            rows={3}
                            placeholder="Update technical overview details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={formLoading}
                            className="flex w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                          />
                        </div>
                        <Button variant="primary" type="submit" isLoading={formLoading}>
                          Update Submission
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : isWindowOpen ? (
              /* Proposal submission form */
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Submit Project Proposal</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Project Title"
                      placeholder="e.g. Smart IoT Agriculture Tracker"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={formLoading}
                      required
                    />
                    <Input
                      label="Google Docs Link"
                      placeholder="https://docs.google.com/document/d/..."
                      value={googleDocsUrl}
                      onChange={(e) => setGoogleDocsUrl(e.target.value)}
                      disabled={formLoading}
                      required
                    />
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-neutral-300 font-sans">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Provide details about system constraints, hardware, or tech stack..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={formLoading}
                        className="flex w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                      />
                    </div>
                    <Button variant="primary" type="submit" isLoading={formLoading} className="gap-2">
                      <Send className="h-4.5 w-4.5" />
                      <span>Submit Proposal</span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              /* Window not open status card */
              <Card variant="default" className="text-center p-8 bg-neutral-900/10">
                <CardContent className="space-y-4">
                  <Clock className="h-10 w-10 text-neutral-700 mx-auto" />
                  <h3 className="font-heading font-semibold text-sm text-neutral-300">
                    Submission Phase Inactive
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans max-w-sm mx-auto leading-relaxed">
                    {hasNotOpened
                      ? `The submission phase is not open yet. It is scheduled to start on ${subStart?.toLocaleString()}.`
                      : isExpired
                      ? `The submission phase closed on ${subEnd?.toLocaleString()} and is no longer accepting entries.`
                      : "Submission timings are currently unconfigured. Contact event organizers."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side: Timeline coordinates card */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-semibold text-neutral-200">Timeline Parameters</h2>
            {comp ? (
              <Card variant="default">
                <CardHeader>
                  <CardTitle className="text-sm font-heading font-semibold text-neutral-300">
                    {comp.name} Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 font-sans text-xs">
                  <div className="flex gap-3 py-1.5 border-b border-neutral-850/60">
                    <Calendar className="h-4.5 w-4.5 text-accent shrink-0" />
                    <div className="space-y-1">
                      <div className="font-semibold text-neutral-300">Submissions Open</div>
                      <div className="text-neutral-500">{subStart?.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 py-1.5">
                    <Calendar className="h-4.5 w-4.5 text-secondary shrink-0" />
                    <div className="space-y-1">
                      <div className="font-semibold text-neutral-300">Submissions Locked</div>
                      <div className="text-neutral-500">{subEnd?.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card variant="default">
                <CardContent className="p-5 text-center text-xs text-neutral-500 font-sans">
                  No competition details matching this team.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-md bg-neutral-900/10 space-y-4">
          <Users className="h-10 w-10 text-neutral-700 mx-auto" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-heading font-semibold text-sm text-neutral-300">No Roster Memberships</h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              You are not currently in any approved teams. You must join or create a team before submitting project proposals.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/teams">
              <Button variant="primary" className="text-xs">
                Go to Team Management
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
