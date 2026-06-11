"use client";

import * as React from "react";
import {
  Trophy,
  Plus,
  Edit,
  AlertCircle,
  Check,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

type Competition = {
  id?: string;
  name: string;
  type: "Showcase" | "Programming" | "Security" | "Robotics" | "Esports" | "Custom";
  description: string;
  short_description: string;
  cover_image_url: string;
  banner_image_url: string;
  eligibility: "internal" | "external" | "both";
  solo_allowed: boolean;
  team_allowed: boolean;
  min_members: number;
  max_members: number;
  registration_start: string;
  registration_end: string;
  submission_start: string;
  submission_end: string;
  entry_fee: number;
  payment_instructions: string;
  rulebook_url: string;
  prize_pool: string;
  champion_prize: string;
  runner_up_prize: string;
  status: "draft" | "published" | "registration_open" | "registration_closed" | "archived";
};

const defaultCompState: Competition = {
  name: "",
  type: "Custom",
  description: "",
  short_description: "",
  cover_image_url: "",
  banner_image_url: "",
  eligibility: "both",
  solo_allowed: true,
  team_allowed: true,
  min_members: 1,
  max_members: 4,
  registration_start: "",
  registration_end: "",
  submission_start: "",
  submission_end: "",
  entry_fee: 0,
  payment_instructions: "",
  rulebook_url: "",
  prize_pool: "",
  champion_prize: "",
  runner_up_prize: "",
  status: "draft",
};

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = React.useState<Competition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Form display toggle
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState<Competition>(defaultCompState);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    async function loadCompetitions() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/admin/competitions");
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        if (active) {
          setCompetitions(data.data || []);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load competitions.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadCompetitions();
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const handleEdit = (comp: Competition) => {
    // Format ISO date strings for input type datetime-local (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (isoString: string) => {
      if (!isoString) return "";
      try {
        const d = new Date(isoString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {
        return "";
      }
    };

    setFormData({
      ...comp,
      description: comp.description || "",
      short_description: comp.short_description || "",
      cover_image_url: comp.cover_image_url || "",
      banner_image_url: comp.banner_image_url || "",
      payment_instructions: comp.payment_instructions || "",
      rulebook_url: comp.rulebook_url || "",
      prize_pool: comp.prize_pool || "",
      champion_prize: comp.champion_prize || "",
      runner_up_prize: comp.runner_up_prize || "",
      registration_start: formatDateForInput(comp.registration_start),
      registration_end: formatDateForInput(comp.registration_end),
      submission_start: formatDateForInput(comp.submission_start),
      submission_end: formatDateForInput(comp.submission_end),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateNew = () => {
    setFormData(defaultCompState);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Convert HTML dates to complete ISO strings
      const payload = {
        ...formData,
        registration_start: new Date(formData.registration_start).toISOString(),
        registration_end: new Date(formData.registration_end).toISOString(),
        submission_start: new Date(formData.submission_start).toISOString(),
        submission_end: new Date(formData.submission_end).toISOString(),
        entry_fee: Number(formData.entry_fee),
        min_members: Number(formData.min_members),
        max_members: Number(formData.max_members),
      };

      const res = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccessMsg(data.message);
      setShowForm(false);
      setFormData(defaultCompState);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit competition.";
      setErrorMsg(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-h3 font-heading font-bold text-neutral-50">Competition Builder</h1>
          <p className="text-sm text-neutral-400 font-sans mt-1">
            Create, configure, publish, and edit festival competitions.
          </p>
        </div>
        <div>
          {!showForm ? (
            <Button variant="primary" onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4.5 w-4.5" />
              <span>Create Competition</span>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Back to Catalog
            </Button>
          )}
        </div>
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

      {/* Main layout views */}
      {showForm ? (
        <Card variant="default" className="border-primary/20 bg-neutral-900/40">
          <CardHeader>
            <CardTitle>{formData.id ? "Edit Competition" : "Build New Competition"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Row 1: Name and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Competition Name"
                  placeholder="e.g. Speed Programming Contest"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={formLoading}
                  required
                />
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Competition["type"] })}
                    disabled={formLoading}
                    required
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  >
                    {["Showcase", "Programming", "Security", "Robotics", "Esports", "Custom"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Descriptions */}
              <div className="space-y-4">
                <Input
                  label="Short Description"
                  placeholder="Quick summary snippet displayed on public catalog cards..."
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  disabled={formLoading}
                  required
                />
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Full Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide full rule descriptions, parameters, details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={formLoading}
                    required
                    className="flex w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  />
                </div>
              </div>

              {/* Row 3: Rules, Cover URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Cover Image URL"
                  placeholder="https://example.com/cover.png"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  disabled={formLoading}
                />
                <Input
                  label="Rulebook Document URL"
                  placeholder="https://drive.google.com/rulebook.pdf"
                  value={formData.rulebook_url}
                  onChange={(e) => setFormData({ ...formData, rulebook_url: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              {/* Row 4: Team limits & Solo Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-sm bg-neutral-950 border border-neutral-850 items-end">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Min Team Members</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.min_members}
                    onChange={(e) => setFormData({ ...formData, min_members: parseInt(e.target.value) || 1 })}
                    disabled={formLoading}
                    required
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Max Team Members</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 1 })}
                    disabled={formLoading}
                    required
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                  />
                </div>
                <label className="flex items-center gap-3 py-2.5 cursor-pointer text-sm font-sans text-neutral-300">
                  <input
                    type="checkbox"
                    checked={formData.solo_allowed}
                    onChange={(e) => setFormData({ ...formData, solo_allowed: e.target.checked })}
                    disabled={formLoading}
                    className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-primary focus:ring-0"
                  />
                  <span>Solo Allowed</span>
                </label>
                <label className="flex items-center gap-3 py-2.5 cursor-pointer text-sm font-sans text-neutral-300">
                  <input
                    type="checkbox"
                    checked={formData.team_allowed}
                    onChange={(e) => setFormData({ ...formData, team_allowed: e.target.checked })}
                    disabled={formLoading}
                    className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-primary focus:ring-0"
                  />
                  <span>Teams Allowed</span>
                </label>
              </div>

              {/* Row 5: Eligibility, Fees, & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Eligibility</label>
                  <select
                    value={formData.eligibility}
                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value as Competition["eligibility"] })}
                    disabled={formLoading}
                    required
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  >
                    <option value="both">Both (Internal & External)</option>
                    <option value="internal">Internal (SMUCT only)</option>
                    <option value="external">External only</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Entry Fee (BDT)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: parseFloat(e.target.value) || 0 })}
                    disabled={formLoading}
                    required
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-300 font-sans">Publish Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Competition["status"] })}
                    disabled={formLoading}
                    required
                    className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published (Listed on catalog)</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="registration_closed">Registration Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Prizes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Total Prize Pool"
                  placeholder="e.g. 50,000 BDT"
                  value={formData.prize_pool}
                  onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                  disabled={formLoading}
                />
                <Input
                  label="Champion Prize"
                  placeholder="e.g. 25,000 BDT + Crest"
                  value={formData.champion_prize}
                  onChange={(e) => setFormData({ ...formData, champion_prize: e.target.value })}
                  disabled={formLoading}
                />
                <Input
                  label="Runner-up Prize"
                  placeholder="e.g. 15,000 BDT + Crest"
                  value={formData.runner_up_prize}
                  onChange={(e) => setFormData({ ...formData, runner_up_prize: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              {/* Row 7: Date/Time Timelines */}
              <div className="p-4 rounded-sm bg-neutral-950 border border-neutral-850 space-y-4">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-sans">Timeline Configurations</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300 font-sans">Registration Start</label>
                    <input
                      type="datetime-local"
                      value={formData.registration_start}
                      onChange={(e) => setFormData({ ...formData, registration_start: e.target.value })}
                      disabled={formLoading}
                      required
                      className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300 font-sans">Registration End</label>
                    <input
                      type="datetime-local"
                      value={formData.registration_end}
                      onChange={(e) => setFormData({ ...formData, registration_end: e.target.value })}
                      disabled={formLoading}
                      required
                      className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300 font-sans">Submission Start</label>
                    <input
                      type="datetime-local"
                      value={formData.submission_start}
                      onChange={(e) => setFormData({ ...formData, submission_start: e.target.value })}
                      disabled={formLoading}
                      required
                      className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300 font-sans">Submission End</label>
                    <input
                      type="datetime-local"
                      value={formData.submission_end}
                      onChange={(e) => setFormData({ ...formData, submission_end: e.target.value })}
                      disabled={formLoading}
                      required
                      className="flex h-10 w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 8: Payment Instructions */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-neutral-300 font-sans">Payment Instructions</label>
                <textarea
                  rows={3}
                  placeholder="bKash/Nagad Merchant Number details, instruction details..."
                  value={formData.payment_instructions}
                  onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                  disabled={formLoading}
                  className="flex w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-4 pt-2">
                <Button variant="primary" type="submit" isLoading={formLoading}>
                  {formData.id ? "Update Competition" : "Create Competition"}
                </Button>
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)} disabled={formLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Catalog list */
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-neutral-900 rounded-md" />
              ))}
            </div>
          ) : competitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competitions.map((comp) => (
                <Card key={comp.id} variant="default" className="border-neutral-800/80 p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-xxs font-semibold font-mono text-accent uppercase tracking-wide">
                          {comp.type}
                        </span>
                        <h3 className="font-heading font-bold text-base text-neutral-150">
                          {comp.name}
                        </h3>
                      </div>
                      <Badge
                        variant={
                          comp.status === "registration_open"
                            ? "success"
                            : comp.status === "draft"
                            ? "neutral"
                            : comp.status === "published"
                            ? "primary"
                            : "warning"
                        }
                        className="capitalize shrink-0"
                      >
                        {comp.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                      {comp.short_description || comp.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xxs font-sans text-neutral-400 border-t border-neutral-850/60">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        <span>Size: {comp.min_members}-{comp.max_members} Devs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        <span>Fee: {comp.entry_fee} BDT</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        <span className="capitalize">Target: {comp.eligibility}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        <span>Ends: {new Date(comp.registration_end).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3 border-t border-neutral-850/60">
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(comp)}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5 grow justify-center"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Configuration</span>
                    </Button>
                    {comp.rulebook_url && (
                      <a
                        href={comp.rulebook_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="ghost" className="p-2 border border-neutral-800 hover:bg-neutral-900" aria-label="View rulebook">
                          <Eye className="h-3.5 w-3.5 text-neutral-400" />
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-neutral-800 rounded-md bg-neutral-900/10">
              <Trophy className="h-10 w-10 text-neutral-700 mb-4 mx-auto" />
              <h3 className="font-heading font-semibold text-neutral-300 mb-1">No Competitions Created</h3>
              <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto mb-4">
                Get started by creating your first festival competition.
              </p>
              <Button variant="primary" onClick={handleCreateNew} className="text-xs">
                Create First Competition
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
