"use client";

import * as React from "react";
import {
  Send,
  Search,
  Check,
  X,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface SubmissionItem {
  id: string;
  team_id: string;
  competition_id: string;
  title: string;
  google_docs_url: string;
  notes: string | null;
  status: "draft" | "submitted" | "under_review" | "selected" | "rejected";
  submitted_at: string;
  teams: {
    id: string;
    name: string;
    leader_id: string;
  } | null;
  competitions: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = React.useState<SubmissionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    async function loadSubmissions() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/admin/submissions");
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        if (active) {
          setSubmissions(data.data || []);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load submissions queue.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSubmissions();

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const handleStatusUpdate = async (submissionId: string, status: "under_review" | "selected" | "rejected") => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, status }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update proposal status.");
      }
      setSuccessMsg(data.message);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred.";
      setErrorMsg(errorMessage);
    }
  };

  // Filter listings based on searches and tab filters
  const filteredSubmissions = submissions.filter((s) => {
    const titleMatch = s.title?.toLowerCase() || "";
    const teamNameMatch = s.teams?.name?.toLowerCase() || "";
    const compNameMatch = s.competitions?.name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      titleMatch.includes(search) ||
      teamNameMatch.includes(search) ||
      compNameMatch.includes(search);

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Project Proposals Queue</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Review project descriptions and docs from team rosters and evaluate their selection status.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-radius-sm bg-error/10 border border-error/20 text-xs text-error font-sans font-medium flex items-start gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-radius-sm bg-success/10 border border-success/20 text-xs text-success font-sans font-medium flex items-start gap-2">
          <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-850 pb-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {["all", "submitted", "under_review", "selected", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`py-2 px-3 text-xs font-semibold tracking-wide font-sans capitalize transition-colors border-b-2 outline-none ${
                statusFilter === status
                  ? "border-accent text-accent"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Input
            placeholder="Search team, proposal title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {/* Grid Submissions List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-neutral-900 rounded-radius-md" />
          ))}
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <div className="space-y-6">
          {filteredSubmissions.map((s) => (
            <Card key={s.id} variant="default" className="border-neutral-800/80 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xxs font-semibold font-mono text-accent uppercase tracking-wide">
                      {s.competitions?.name} ({s.competitions?.type})
                    </span>
                    <Badge
                      variant={
                        s.status === "selected"
                          ? "success"
                          : s.status === "rejected"
                          ? "error"
                          : s.status === "under_review"
                          ? "primary"
                          : "neutral"
                      }
                      className="capitalize"
                    >
                      {s.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <h3 className="text-base font-heading font-semibold text-neutral-100">
                    {s.title}
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Submitted by Team: <span className="text-neutral-200 font-semibold">{s.teams?.name || "N/A"}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col lg:flex-row gap-2 shrink-0">
                  {s.status === "submitted" && (
                    <Button
                      variant="secondary"
                      onClick={() => handleStatusUpdate(s.id, "under_review")}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Mark Reviewing</span>
                    </Button>
                  )}
                  {s.status !== "selected" && (
                    <Button
                      variant="primary"
                      onClick={() => handleStatusUpdate(s.id, "selected")}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5 bg-success hover:bg-success/90 border-success"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Select Team</span>
                    </Button>
                  )}
                  {s.status !== "rejected" && (
                    <Button
                      variant="secondary"
                      onClick={() => handleStatusUpdate(s.id, "rejected")}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-error hover:text-error"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject Proposal</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Proposal Document Link & Notes */}
              <div className="pt-4 border-t border-neutral-850 space-y-3 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                    Google Docs Proposal
                  </div>
                  <a
                    href={s.google_docs_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <span>Open Proposal Document</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {s.notes && (
                  <div className="p-3 bg-neutral-950 rounded-radius-sm border border-neutral-850/60 text-xs">
                    <div className="font-semibold text-neutral-400 mb-1">Roster Technical Notes:</div>
                    <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{s.notes}</p>
                  </div>
                )}

                <div className="text-xxs text-neutral-500 pt-1">
                  Submitted at: {new Date(s.submitted_at).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-radius-md bg-neutral-900/10">
          <Send className="h-10 w-10 text-neutral-700 mb-4 mx-auto" />
          <h3 className="font-heading font-semibold text-neutral-300 mb-1">No Proposals Found</h3>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto">
            There are no submissions matching this status or query.
          </p>
        </div>
      )}
    </div>
  );
}
