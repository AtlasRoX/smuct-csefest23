"use client";

import * as React from "react";
import {
  Check,
  X,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

interface CompetitionItem {
  id: string;
  name: string;
  type: string;
  judging_criteria: Array<{ name: string; weight: number }>;
  finalist_limit: number;
}

interface TeamItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  submission: {
    title: string;
    submitted_at: string;
  } | null;
  scores: Array<{
    id: string;
    criteria_name: string;
    weight: number;
    score: number;
    max_score: number;
  }>;
  total_score: number;
  rank_position: number | null;
  is_finalist: boolean;
  is_public: boolean;
}

export default function AdminJudgingPage() {
  const [competitions, setCompetitions] = React.useState<CompetitionItem[]>([]);
  const [selectedCompId, setSelectedCompId] = React.useState<string>("");
  const [teams, setTeams] = React.useState<TeamItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Messages
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Scoring Modal state
  const [activeGradingTeam, setActiveGradingTeam] = React.useState<TeamItem | null>(null);
  const [gradingScores, setGradingScores] = React.useState<
    Array<{ criteria_name: string; weight: number; score: number; max_score: number }>
  >([]);
  const [savingScores, setSavingScores] = React.useState(false);

  // Publishing State
  const [finalistTeamIds, setFinalistTeamIds] = React.useState<string[]>([]);
  const [publishing, setPublishing] = React.useState(false);

  const supabase = createClient();

  // Load competitions on mount
  React.useEffect(() => {
    async function loadCompetitions() {
      try {
        setLoading(true);
        setErrorMsg(null);
        // Load active and published competitions
        const { data, error } = await supabase
          .from("competitions")
          .select("id, name, type, judging_criteria, finalist_limit")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCompetitions(data || []);
        if (data && data.length > 0) {
          setSelectedCompId(data[0].id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load competitions.";
        setErrorMsg(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    loadCompetitions();
  }, [supabase]);

  // Load team scores & rankings for selected competition
  React.useEffect(() => {
    let active = true;
    async function loadJudgingData() {
      if (!selectedCompId) return;

      setDataLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/admin/judging?competition_id=${selectedCompId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (active) {
          const compTeams = data.data.teams || [];
          setTeams(compTeams);

          // Populate finalists from current active states
          const currentFinalists = compTeams
            .filter((t: TeamItem) => t.is_finalist)
            .map((t: TeamItem) => t.id);
          setFinalistTeamIds(currentFinalists);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load scoring data.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setDataLoading(false);
        }
      }
    }

    loadJudgingData();

    return () => {
      active = false;
    };
  }, [selectedCompId, refreshTrigger]);

  // Open scorecard input
  const handleOpenGrading = (team: TeamItem) => {
    setActiveGradingTeam(team);

    const activeComp = competitions.find((c) => c.id === selectedCompId);
    if (!activeComp) return;

    // Map existing scores or fallback to criteria layout defaults
    const initialScores = activeComp.judging_criteria.map((criterion) => {
      const existing = team.scores.find((s) => s.criteria_name === criterion.name);
      return {
        criteria_name: criterion.name,
        weight: criterion.weight,
        score: existing ? existing.score : 0,
        max_score: existing ? existing.max_score : 10, // Defaults to 10 points grading scale
      };
    });

    setGradingScores(initialScores);
  };

  const handleScoreChange = (index: number, value: number) => {
    const updated = [...gradingScores];
    const item = updated[index];
    if (!item) return;

    // Clamp score within 0 and max_score
    const clamped = Math.max(0, Math.min(item.max_score, value));
    item.score = clamped;
    setGradingScores(updated);
  };

  const handleMaxScoreChange = (index: number, value: number) => {
    const updated = [...gradingScores];
    const item = updated[index];
    if (!item) return;

    const newMax = Math.max(1, value);
    item.max_score = newMax;
    // Adjust score if it now exceeds max
    if (item.score > newMax) {
      item.score = newMax;
    }
    setGradingScores(updated);
  };

  // Save score submissions
  const handleSaveScores = async () => {
    if (!activeGradingTeam) return;

    setSavingScores(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/judging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: activeGradingTeam.id,
          competition_id: selectedCompId,
          scores: gradingScores,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccessMsg(data.message);
      setActiveGradingTeam(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to record team score.";
      setErrorMsg(errorMessage);
    } finally {
      setSavingScores(false);
    }
  };

  // Toggle finalist checkboxes
  const handleFinalistToggle = (teamId: string) => {
    setFinalistTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  // Publish leaderboard & finalist results
  const handlePublishResults = async (publishState: boolean) => {
    setPublishing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/judging/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition_id: selectedCompId,
          is_public: publishState,
          finalist_team_ids: publishState ? finalistTeamIds : [],
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccessMsg(data.message);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to publish rankings.";
      setErrorMsg(errorMessage);
    } finally {
      setPublishing(false);
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

  const activeComp = competitions.find((c) => c.id === selectedCompId);
  const isLeaderboardPublic = teams.length > 0 && teams[0]?.is_public;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Evaluation & Rankings</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Input weighted criteria scores, view auto-calculated leaderboard ranks, and publish final finalists.
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

      {competitions.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Main Scoring Grid */}
          <div className="xl:col-span-2 space-y-6">
            {/* Selection Card */}
            <Card variant="default">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-300 font-sans">
                    Select Competition Dashboard
                  </label>
                  <select
                    value={selectedCompId}
                    onChange={(e) => setSelectedCompId(e.target.value)}
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  >
                    {competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Teams Grading Queue */}
            <Card variant="default">
              <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-neutral-850">
                <CardTitle className="text-md">Teams Evaluation Ledger</CardTitle>
                <Badge variant={isLeaderboardPublic ? "success" : "neutral"} className="flex gap-1.5 items-center">
                  {isLeaderboardPublic ? (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Leaderboard Published</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Leaderboard Hidden</span>
                    </>
                  )}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {dataLoading ? (
                  <div className="p-12 space-y-4 animate-pulse">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="h-10 bg-neutral-900 w-full rounded-sm" />
                    ))}
                  </div>
                ) : teams.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="border-b border-neutral-850 bg-neutral-900/30 text-neutral-400 font-semibold tracking-wide uppercase">
                          <th className="py-3.5 px-4 font-mono w-16">Rank</th>
                          <th className="py-3.5 px-4">Team Name</th>
                          <th className="py-3.5 px-4">Phase State</th>
                          <th className="py-3.5 px-4">Total Score</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-y-neutral-850/50">
                        {teams.map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-900/20 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-accent text-sm">
                              {t.rank_position ? `#${t.rank_position}` : "—"}
                            </td>
                            <td className="py-4 px-4 font-medium text-neutral-100">
                              <div className="space-y-0.5">
                                <div>{t.name}</div>
                                {t.submission && (
                                  <div className="text-neutral-500 text-xxs font-normal">
                                    Docs: {t.submission.title}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant={
                                  t.status === "finalist"
                                    ? "success"
                                    : t.status === "registered"
                                    ? "primary"
                                    : "neutral"
                                }
                                className="capitalize"
                              >
                                {t.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-sm text-neutral-200">
                              {t.total_score} pts
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="secondary"
                                onClick={() => handleOpenGrading(t)}
                                className="text-xxs py-1 px-2.5 h-7 gap-1 font-semibold"
                              >
                                <Sliders className="h-3 w-3" />
                                <span>Grade Entry</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-neutral-500 leading-relaxed">
                    No teams have registered for this competition yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Rankings Publish Console */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-semibold text-neutral-200">Leaderboard Console</h2>
            <Card variant="default">
              <CardContent className="p-6 space-y-6 font-sans text-xs">
                {/* Competition Details summary */}
                <div className="space-y-2.5 pb-4 border-b border-neutral-850">
                  <h3 className="font-semibold text-neutral-300 text-sm">{activeComp?.name} parameters</h3>
                  <div className="text-neutral-500 space-y-1">
                    <div>Finalist limit quota: <span className="text-neutral-300 font-bold">{activeComp?.finalist_limit || 20} teams</span></div>
                    <div>Criteria checklist:</div>
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {activeComp?.judging_criteria.map((c) => (
                        <Badge key={c.name} variant="neutral" className="text-xxs px-1.5 py-0.5">
                          {c.name} ({c.weight}w)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Finalists Checklist Selection */}
                {teams.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-neutral-300">Select Finalists Checklist</h4>
                      <p className="text-xxs text-neutral-500 leading-relaxed mt-0.5">
                        Choose teams to confirm as finalists. Recommended quota limit: top {activeComp?.finalist_limit}.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto border border-neutral-850 rounded bg-neutral-950 p-2">
                      {teams.map((t, idx) => {
                        const isChecked = finalistTeamIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleFinalistToggle(t.id)}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border ${
                              isChecked
                                ? "bg-accent/10 border-accent/30 text-neutral-100"
                                : "border-transparent text-neutral-400 hover:bg-neutral-900/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-neutral-700 bg-neutral-900 text-accent focus:ring-accent h-3.5 w-3.5"
                            />
                            <div className="flex-1 flex justify-between font-medium items-center min-w-0 pr-1">
                              <span className="truncate text-xs font-sans">
                                {idx + 1}. {t.name}
                              </span>
                              <span className="font-mono text-xxs shrink-0 text-neutral-500 pl-2">
                                {t.total_score} pts
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Publish Action buttons */}
                    <div className="pt-2 space-y-2">
                      <Button
                        variant="primary"
                        onClick={() => handlePublishResults(true)}
                        disabled={publishing}
                        isLoading={publishing}
                        className="w-full justify-center gap-2 bg-success hover:bg-success/90 border-success text-xs font-semibold py-2.5"
                      >
                        <Unlock className="h-4 w-4" />
                        <span>Publish Leaderboard & Finalists</span>
                      </Button>
                      {isLeaderboardPublic && (
                        <Button
                          variant="secondary"
                          onClick={() => handlePublishResults(false)}
                          disabled={publishing}
                          isLoading={publishing}
                          className="w-full justify-center gap-2 text-xs font-semibold hover:border-error hover:text-error"
                        >
                          <Lock className="h-4 w-4" />
                          <span>Unpublish & Hide Leaderboard</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 py-6">
                    Enroll teams to enable public consoles.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card variant="default" className="p-8 text-center text-neutral-500 leading-relaxed">
          No competitions created yet.
        </Card>
      )}

      {/* Score entry scorecard Modal overlay */}
      {activeGradingTeam && (
        <div className="fixed inset-0 z-50 flex bg-neutral-950/80 backdrop-blur-sm items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-neutral-900 border border-neutral-800 p-6 space-y-6">
            <CardHeader className="p-0 flex flex-row justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <CardTitle className="text-sm font-heading font-bold text-neutral-50">
                  Grade Team scorecard
                </CardTitle>
                <p className="text-xxs text-neutral-400 font-sans mt-0.5">
                  Input score grades for Team: <span className="text-accent font-semibold">{activeGradingTeam.name}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveGradingTeam(null)}
                className="p-1 rounded-full bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 transition-colors text-neutral-400"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {gradingScores.map((criterion, idx) => (
                  <div key={criterion.criteria_name} className="space-y-2 border-b border-neutral-850/45 pb-4 font-sans text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-200">
                        {criterion.criteria_name}
                      </span>
                      <Badge variant="neutral" className="text-xxs px-1.5 py-0.5">
                        Weight: {criterion.weight} points
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Score Input */}
                      <div className="space-y-1">
                        <label className="text-xxs text-neutral-400">Assigned Score</label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max={criterion.max_score}
                          value={criterion.score}
                          onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value) || 0)}
                          required
                          disabled={savingScores}
                        />
                      </div>
                      {/* Max Score Input */}
                      <div className="space-y-1">
                        <label className="text-xxs text-neutral-400">Out Of (Max Score)</label>
                        <Input
                          type="number"
                          min="1"
                          value={criterion.max_score}
                          onChange={(e) => handleMaxScoreChange(idx, parseInt(e.target.value) || 10)}
                          required
                          disabled={savingScores}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 text-xs border-t border-neutral-800 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setActiveGradingTeam(null)}
                  disabled={savingScores}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveScores}
                  isLoading={savingScores}
                  disabled={savingScores}
                  className="bg-accent border-accent hover:bg-accent/90"
                >
                  Confirm Grades
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
