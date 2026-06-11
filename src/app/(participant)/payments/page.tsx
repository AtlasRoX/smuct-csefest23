"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  AlertCircle,
  Check,
  CreditCard,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
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
    type: string;
    entry_fee: number;
    eligibility: string;
    payment_instructions: string | null;
  } | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string;
  method: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

export default function PaymentsPage() {
  const [loading, setLoading] = React.useState(true);
  const [teams, setTeams] = React.useState<UserTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const [payments, setPayments] = React.useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = React.useState(false);

  // Form states
  const [method, setMethod] = React.useState<"bkash" | "nagad">("bkash");
  const [transactionId, setTransactionId] = React.useState("");
  const [screenshotBase64, setScreenshotBase64] = React.useState<string | null>(null);
  const [screenshotError, setScreenshotError] = React.useState<string | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);

  // Messages
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
            .select("id, name, status, competitions(id, name, type, entry_fee, eligibility, payment_instructions)")
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

  // Load payment records for selected team
  React.useEffect(() => {
    let active = true;
    async function loadPayments() {
      if (!selectedTeamId) {
        await Promise.resolve();
        if (active) setPayments([]);
        return;
      }

      setPaymentsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/payments?team_id=${selectedTeamId}`);
        const data = await res.json();
        if (active) {
          if (data.success && data.data) {
            setPayments(data.data);
          } else {
            setPayments([]);
          }
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load payments.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setPaymentsLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      active = false;
    };
  }, [selectedTeamId]);

  // Handle file picker selection and base64 conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("File exceeds the 5MB size limit. Please upload a smaller image.");
      return;
    }

    // Validate file type (jpg, jpeg, png)
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setScreenshotError("Only JPG, JPEG, and PNG images are supported.");
      return;
    }

    setScreenshotError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    const activeTeam = teams.find((t) => t.id === selectedTeamId);
    if (!activeTeam || !activeTeam.competitions) return;

    if (!screenshotBase64) {
      setScreenshotError("Transaction screenshot is required.");
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: selectedTeamId,
          amount: activeTeam.competitions.entry_fee,
          transaction_id: transactionId.trim(),
          method,
          screenshot_base64: screenshotBase64,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to submit payment proof.");
      }

      setSuccessMsg(data.message);
      setTransactionId("");
      setScreenshotBase64(null);

      // Reload payments list
      const pRes = await fetch(`/api/payments?team_id=${selectedTeamId}`);
      const pData = await pRes.json();
      if (pData.success) {
        setPayments(pData.data);
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
        <div className="h-10 bg-neutral-900 w-1/3 rounded-radius-sm" />
        <div className="h-24 bg-neutral-900 w-full rounded-radius-md" />
        <div className="h-64 bg-neutral-900 w-full rounded-radius-md" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-neutral-800 rounded-radius-md bg-neutral-900/10 space-y-4">
        <Users className="h-10 w-10 text-neutral-700 mx-auto" />
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="font-heading font-semibold text-sm text-neutral-300">No Roster Memberships</h3>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            You must join or create a team to view or submit registrations payments.
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
    );
  }

  const activeTeam = teams.find((t) => t.id === selectedTeamId);
  const comp = activeTeam?.competitions;
  const entryFee = comp?.entry_fee || 0;

  // Find the latest payment record
  const latestPayment = payments.length > 0 ? payments[0] : null;

  // Business check: Can submit payment if:
  // 1. Entry fee is > 0
  // 2. And no payment exists yet OR the latest payment is rejected/resubmission requested
  // 3. And if external competition: team status must be 'selected' (proposal accepted) OR team status is registered/finalist (but they are resubmitting).
  // Wait, if it's external, they need proposal selection first.
  const isExternal = comp?.eligibility === "external";
  const proposalSelected = activeTeam?.status === "selected" || activeTeam?.status === "registered" || activeTeam?.status === "finalist";
  
  const paymentApproved = latestPayment?.status === "approved";
  const paymentPending = latestPayment?.status === "pending";

  const isEligibleToPay =
    entryFee > 0 &&
    (!latestPayment ||
      latestPayment.status === "rejected" ||
      latestPayment.status === "resubmission_required") &&
    (!isExternal || proposalSelected);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Registration Payments</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Complete entry fee payments for your teams via bKash or Nagad.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Payment Status and Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team selector card */}
          <Card variant="default">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-semibold text-neutral-300 font-sans">
                  Select Team to Review Payment
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="flex h-10 w-full rounded-radius-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.competitions?.name}) — Status: {t.status}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Info */}
          {paymentsLoading ? (
            <div className="h-48 bg-neutral-900/40 rounded-radius-md animate-pulse" />
          ) : latestPayment ? (
            <Card
              variant="default"
              className={
                latestPayment.status === "approved"
                  ? "border-success/20 bg-success/5"
                  : latestPayment.status === "pending"
                  ? "border-warning/20 bg-warning/5"
                  : "border-error/20 bg-error/5"
              }
            >
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-md">Latest Payment Transaction</CardTitle>
                <Badge
                  variant={
                    latestPayment.status === "approved"
                      ? "success"
                      : latestPayment.status === "pending"
                      ? "warning"
                      : "error"
                  }
                  className="capitalize font-mono"
                >
                  {latestPayment.status.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                        Transaction ID
                      </div>
                      <div className="text-sm text-neutral-200 font-mono font-medium mt-1">
                        {latestPayment.transaction_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                        Method & Amount
                      </div>
                      <div className="text-sm text-neutral-200 font-medium mt-1 uppercase">
                        {latestPayment.method} — {latestPayment.amount} BDT
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                        Submitted Date
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {new Date(latestPayment.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-neutral-850">
                      {latestPayment.status === "approved" ? (
                        <div className="flex items-center gap-2 text-xs text-success font-medium">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span>Your registration fee has been verified. Welcome to CSE Fest 2026!</span>
                        </div>
                      ) : latestPayment.status === "pending" ? (
                        <div className="flex items-center gap-2 text-xs text-warning font-medium">
                          <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                          <span>Manual verification is in progress. Usually takes up to 24 hours.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-error font-medium">
                          <XCircle className="h-4 w-4 shrink-0" />
                          <span>Verification failed. Please review instructions and resubmit below.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screenshot Preview */}
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                      Screenshot Proof
                    </div>
                    <div className="relative aspect-video max-w-sm rounded-radius-sm border border-neutral-800 overflow-hidden bg-neutral-950">
                      <img
                        src={latestPayment.screenshot_url}
                        alt="Payment screenshot proof"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Form to submit payment */}
          {isEligibleToPay && (
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <span>Submit Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Select Payment Method */}
                  <div className="space-y-2 font-sans">
                    <label className="text-sm font-medium text-neutral-300">Payment Gateway</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setMethod("bkash")}
                        className={`flex items-center justify-between px-4 py-3 rounded-radius-sm border font-semibold text-sm transition-all ${
                          method === "bkash"
                            ? "bg-[#E2125D]/10 border-[#E2125D] text-[#E2125D]"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <span>bKash</span>
                        {method === "bkash" && <span className="h-2 w-2 rounded-full bg-[#E2125D]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod("nagad")}
                        className={`flex items-center justify-between px-4 py-3 rounded-radius-sm border font-semibold text-sm transition-all ${
                          method === "nagad"
                            ? "bg-[#F57C20]/10 border-[#F57C20] text-[#F57C20]"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <span>Nagad</span>
                        {method === "nagad" && <span className="h-2 w-2 rounded-full bg-[#F57C20]" />}
                      </button>
                    </div>
                  </div>

                  {/* Transaction ID & Amount Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5 justify-end">
                      <label className="text-sm font-medium text-neutral-300 font-sans">
                        Required Registration Fee
                      </label>
                      <div className="h-10 flex items-center bg-neutral-900 border border-neutral-800 px-3 rounded-radius-sm text-neutral-100 font-mono font-bold text-sm">
                        {entryFee} BDT
                      </div>
                    </div>
                    <Input
                      label="Transaction ID (TXID)"
                      placeholder="e.g. A1B2C3D4E5"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      required
                      disabled={formLoading}
                    />
                  </div>

                  {/* Drag and Drop Screenshot */}
                  <div className="space-y-2 font-sans">
                    <label className="text-sm font-medium text-neutral-300">
                      Upload Screenshot Proof
                    </label>
                    <div className="relative border-2 border-dashed border-neutral-800 rounded-radius-md p-6 flex flex-col items-center justify-center bg-neutral-950 hover:border-neutral-700 transition-colors">
                      {screenshotBase64 ? (
                        <div className="relative max-h-48 w-full overflow-hidden flex flex-col items-center justify-center">
                          <img
                            src={screenshotBase64}
                            alt="Screenshot preview"
                            className="max-h-40 rounded-radius-sm object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setScreenshotBase64(null)}
                            className="absolute top-2 right-2 bg-neutral-900/80 hover:bg-neutral-900 text-neutral-300 p-1 rounded-full border border-neutral-700"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <Upload className="h-8 w-8 text-neutral-600 mx-auto" />
                          <div className="text-xs text-neutral-500">
                            Drag and drop or click to upload transaction screenshot
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={formLoading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {screenshotError && (
                      <span className="text-xs text-error font-medium">{screenshotError}</span>
                    )}
                  </div>

                  <Button variant="primary" type="submit" isLoading={formLoading} className="w-full gap-2 justify-center">
                    <Send className="h-4.5 w-4.5" />
                    <span>Submit Payment Proof</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Conditional state messages */}
          {!isEligibleToPay && entryFee > 0 && (
            <Card variant="default" className="bg-neutral-900/10 border-neutral-850">
              <CardContent className="p-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1 font-sans text-xs">
                  <h4 className="font-semibold text-neutral-300">Payment Window Inactive</h4>
                  <p className="text-neutral-500 leading-relaxed">
                    {paymentApproved
                      ? "Your payment is verified and registration is fully complete."
                      : paymentPending
                      ? "A payment submission is currently under review by organisers. You will be notified if a resubmission is required."
                      : isExternal && !proposalSelected
                      ? `Your team status is "${activeTeam?.status}". You must wait for the proposal review phase to complete and your team selection before making payments.`
                      : "Payment options are currently locked or inactive for this team configuration."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {entryFee <= 0 && (
            <Card variant="default" className="bg-success/5 border-success/10">
              <CardContent className="p-6 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div className="space-y-1 font-sans text-xs">
                  <h4 className="font-semibold text-success">Free Competition</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    This competition has no registration fees. Registration is completed automatically upon team confirmation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Payment numbers & coordinates */}
        <div className="space-y-6">
          <h2 className="text-lg font-heading font-semibold text-neutral-200">Payment Instructions</h2>
          <Card variant="default">
            <CardContent className="p-6 space-y-4 font-sans text-xs">
              <div className="space-y-2 pb-4 border-b border-neutral-850">
                <h3 className="font-semibold text-neutral-300">Gateway Accounts</h3>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-radius-sm border border-neutral-850">
                    <span className="text-[#E2125D] font-bold">bKash Personal</span>
                    <span className="text-neutral-300 font-mono font-medium">+880 1711-223344</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-radius-sm border border-neutral-850">
                    <span className="text-[#F57C20] font-bold">Nagad Personal</span>
                    <span className="text-neutral-300 font-mono font-medium">+880 1711-223344</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 leading-relaxed text-neutral-400">
                <h4 className="font-semibold text-neutral-300">Step-by-Step Guide:</h4>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Send the exact entry fee amount (<span className="text-neutral-200 font-bold font-mono">{entryFee} BDT</span>) to one of the numbers above.</li>
                  <li>Use your <span className="text-accent font-semibold">Team Name</span> as the reference during the transaction.</li>
                  <li>Copy the <span className="text-neutral-200 font-bold font-mono">Transaction ID (TXID)</span> from the confirmation SMS/app screen.</li>
                  <li>Take a screenshot of the confirmation statement as proof of payment.</li>
                  <li>Fill in the details in the form on the left and submit.</li>
                </ol>
              </div>

              {comp?.payment_instructions && (
                <div className="pt-4 border-t border-neutral-850 space-y-2">
                  <h4 className="font-semibold text-neutral-300">Organiser Note:</h4>
                  <p className="text-neutral-500 whitespace-pre-wrap leading-relaxed">
                    {comp.payment_instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
