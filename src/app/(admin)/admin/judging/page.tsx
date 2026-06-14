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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

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

  useBodyScrollLock(activeGradingTeam !== null);

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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50 tracking-tight">Evaluation & Rankings</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Input weighted criteria scores, view auto-calculated leaderboard ranks, and publish final finalists.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-xs text-error font-sans font-medium flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-sans font-medium flex items-start gap-2.5">
          <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {competitions.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Main Scoring Grid */}
          <div className="xl:col-span-2 space-y-6">
            {/* Selection Card */}
            <Card variant="glass" className="bg-glass border-glass">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-sans">
                    Select Competition Dashboard
                  </label>
                  <select
                    value={selectedCompId}
                    onChange={(e) => setSelectedCompId(e.target.value)}
                    className="flex h-11 w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 hover:border-neutral-700 transition-all duration-150 outline-none font-sans cursor-pointer"
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
            <Card variant="glass" className="bg-glass border-glass p-0 overflow-hidden">
              <CardHeader className="flex flex-row justify-between items-center p-6 pb-4 border-b border-neutral-800 bg-neutral-900/10">
                <CardTitle className="text-md font-heading font-semibold text-neutral-100">Teams Evaluation Ledger</CardTitle>
                <Badge variant={isLeaderboardPublic ? "success" : "neutral"} className="flex gap-1.5 items-center font-mono">
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
                      <div key={idx} className="h-10 bg-neutral-900/40 w-full rounded-lg border border-neutral-850" />
                    ))}
                  </div>
                ) : teams.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 font-semibold tracking-wider uppercase text-xxs">
                          <th className="py-4 px-6 font-mono w-16 text-center">Rank</th>
                          <th className="py-4 px-6">Team Name</th>
                          <th className="py-4 px-6">Phase State</th>
                          <th className="py-4 px-6">Total Score</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-850/30">
                        {teams.map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-900/20 transition-colors">
                            <td className="py-4 px-6 text-center font-mono font-bold text-neutral-350 text-sm">
                              {t.rank_position ? `#${t.rank_position}` : "—"}
                            </td>
                            <td className="py-4 px-6 font-medium text-neutral-100">
                              <div className="space-y-1">
                                <div className="font-semibold text-sm">{t.name}</div>
                                {t.submission && (
                                  <div className="text-neutral-500 text-xxs font-normal font-mono">
                                    Docs: {t.submission.title}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge
                                variant={
                                  t.status === "finalist" || t.status === "selected"
                                    ? "success"
                                    : t.status === "rejected"
                                    ? "error"
                                    : t.status === "forming"
                                    ? "warning"
                                    : t.status === "submitted" || t.status === "registered"
                                    ? "primary"
                                    : "neutral"
                                }
                                className="capitalize"
                              >
                                {t.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 font-mono font-bold text-sm text-neutral-200">
                              {t.total_score} pts
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Button
                                variant="secondary"
                                onClick={() => handleOpenGrading(t)}
                                className="text-xxs py-1.5 px-3 h-8 gap-1.5 font-semibold"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                                <span>Grade Entry</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center text-neutral-500 font-sans leading-relaxed">
                    No teams have registered for this competition yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Rankings Publish Console */}
          <div className="space-y-6">
            <h2 className="text-lg font-heading font-semibold text-neutral-200">Leaderboard Console</h2>
            <Card variant="glass" className="bg-glass border-glass">
              <CardContent className="p-6 space-y-6 font-sans text-xs">
                {/* Competition Details summary */}
                <div className="space-y-3 pb-4 border-b border-neutral-800">
                  <h3 className="font-semibold text-neutral-300 text-sm tracking-tight">{activeComp?.name} parameters</h3>
                  <div className="text-neutral-400 space-y-2">
                    <div>Finalist limit quota: <span className="text-neutral-200 font-bold font-mono bg-neutral-950 px-2 py-1 rounded border border-neutral-850 ml-1">{activeComp?.finalist_limit || 20} teams</span></div>
                    <div className="pt-1.5">
                      <div className="text-xxs font-bold text-neutral-500 uppercase tracking-wider mb-2">Criteria Checklist</div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeComp?.judging_criteria.map((c) => (
                          <Badge key={c.name} variant="neutral" className="text-xxs px-2 py-0.5">
                            {c.name} ({c.weight}w)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Finalists Checklist Selection */}
                {teams.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-neutral-300 text-sm">Select Finalists Checklist</h4>
                      <p className="text-xxs text-neutral-500 leading-relaxed mt-0.5">
                        Choose teams to confirm as finalists. Recommended quota limit: top {activeComp?.finalist_limit}.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto border border-neutral-850 rounded-xl bg-neutral-950/40 p-2.5">
                      {teams.map((t, idx) => {
                        const isChecked = finalistTeamIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleFinalistToggle(t.id)}
                            className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-all duration-150 border ${
                              isChecked
                                ? "bg-neutral-900 border-neutral-750 text-neutral-100 font-bold"
                                : "border-transparent text-neutral-400 hover:bg-neutral-900/40 hover:text-neutral-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-neutral-750 bg-neutral-900 text-neutral-300 focus:ring-neutral-850 h-3.5 w-3.5 cursor-pointer"
                            />
                            <div className="flex-1 flex justify-between font-medium items-center min-w-0 pr-1">
                              <span className="truncate text-xs font-semibold">
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
                        variant="success"
                        onClick={() => handlePublishResults(true)}
                        disabled={publishing}
                        isLoading={publishing}
                        className="w-full justify-center gap-2 text-xs font-semibold py-3 active:scale-[0.99] shadow-level-2"
                      >
                        <Unlock className="h-4 w-4" />
                        <span>Publish Leaderboard & Finalists</span>
                      </Button>
                      {isLeaderboardPublic && (
                        <Button
                          variant="destructive"
                          onClick={() => handlePublishResults(false)}
                          disabled={publishing}
                          isLoading={publishing}
                          className="w-full justify-center gap-2 text-xs font-semibold py-3 active:scale-[0.99] shadow-level-2"
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
        <Card variant="glass" className="p-12 text-center text-neutral-500 leading-relaxed bg-glass border-glass">
          No competitions created yet.
        </Card>
      )}

      {/* Score entry scorecard Modal overlay */}
      {activeGradingTeam && (
        <div className="fixed inset-0 z-50 flex bg-neutral-950/85 backdrop-blur-md items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-neutral-900 border border-neutral-800 p-6 space-y-6 shadow-level-3">
            <CardHeader className="p-0 flex flex-row justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <CardTitle className="text-sm font-heading font-bold text-neutral-50">
                  Grade Team Scorecard
                </CardTitle>
                <p className="text-xxs text-neutral-400 font-sans mt-0.5">
                  Input score grades for Team: <span className="text-neutral-100 font-mono font-bold">{activeGradingTeam.name}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveGradingTeam(null)}
                className="p-1.5 rounded-full bg-neutral-950 border border-neutral-850 hover:bg-neutral-800 transition-colors text-neutral-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {gradingScores.map((criterion, idx) => (
                  <div key={criterion.criteria_name} className="space-y-2 border-b border-neutral-800/40 pb-4 last:border-b-0 last:pb-0 font-sans text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-200">
                        {criterion.criteria_name}
                      </span>
                      <Badge variant="neutral" className="text-xxs px-2.5 py-0.5">
                        Weight: {criterion.weight} points
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Score Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Assigned Score</label>
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
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Out Of (Max Score)</label>
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
              <div className="flex justify-end gap-3.5 text-xs border-t border-neutral-800 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setActiveGradingTeam(null)}
                  disabled={savingScores}
                  className="active:scale-[0.98]"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveScores}
                  isLoading={savingScores}
                  disabled={savingScores}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-transparent text-xs font-mono uppercase tracking-wider py-2 px-5 active:scale-[0.98] rounded cursor-pointer"
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

