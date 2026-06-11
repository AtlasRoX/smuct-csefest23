"use client";

import * as React from "react";
import {
  Search,
  Check,
  X,
  Eye,
  AlertCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface PaymentItem {
  id: string;
  team_id: string;
  competition_id: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string;
  method: string;
  status: "pending" | "approved" | "rejected" | "resubmission_required";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  teams: {
    id: string;
    name: string;
  } | null;
  competitions: {
    id: string;
    name: string;
    type: string;
    entry_fee: number;
  } | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Note dialog state
  const [actioningPaymentId, setActioningPaymentId] = React.useState<string | null>(null);
  const [actionType, setActionType] = React.useState<"reject" | "resubmission_required" | null>(null);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Lightbox zoom modal state
  const [zoomImage, setZoomImage] = React.useState<{ url: string; teamName: string; txid: string } | null>(null);

  React.useEffect(() => {
    let active = true;
    async function loadPayments() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const url = statusFilter === "all" 
          ? "/api/admin/payments" 
          : `/api/admin/payments?status=${statusFilter}`;
        
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        if (active) {
          setPayments(data.data || []);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load payments queue.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      active = false;
    };
  }, [statusFilter, refreshTrigger]);

  const handleApprove = async (paymentId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, status: "approved" }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to approve payment.");
      }
      setSuccessMsg(data.message);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred.";
      setErrorMsg(errorMessage);
    }
  };

  const openActionDialog = (paymentId: string, type: "reject" | "resubmission_required") => {
    setActioningPaymentId(paymentId);
    setActionType(type);
    setReviewNotes("");
  };

  const closeActionDialog = () => {
    setActioningPaymentId(null);
    setActionType(null);
    setReviewNotes("");
  };

  const handleActionSubmit = async () => {
    if (!actioningPaymentId || !actionType) return;

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const status = actionType === "reject" ? "rejected" : "resubmission_required";
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: actioningPaymentId,
          status,
          notes: reviewNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update transaction status.");
      }
      setSuccessMsg(data.message);
      closeActionDialog();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred.";
      setErrorMsg(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Search filter matching
  const filteredPayments = payments.filter((p) => {
    const txid = p.transaction_id?.toLowerCase() || "";
    const teamName = p.teams?.name?.toLowerCase() || "";
    const compName = p.competitions?.name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return txid.includes(search) || teamName.includes(search) || compName.includes(search);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Fee Payments Queue</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Review manual mobile bank payments (bKash & Nagad) submitted by teams and approve registrations.
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

      {/* Search and Tab Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-850 pb-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "resubmission_required", label: "Needs Resubmit" },
            { value: "all", label: "All" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`py-2 px-3 text-xs font-semibold tracking-wide font-sans capitalize transition-colors border-b-2 outline-none ${
                statusFilter === tab.value
                  ? "border-accent text-accent"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {tab.label} {statusFilter === tab.value ? `(${filteredPayments.length})` : ""}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Input
            placeholder="Search TXID, team, competition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {/* Payment records rendering */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-neutral-900 rounded-md" />
          ))}
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="space-y-6">
          {filteredPayments.map((p) => {
            const isPending = p.status === "pending";
            const expectedFee = p.competitions?.entry_fee || 0;
            const amountMatches = p.amount === expectedFee;

            return (
              <Card key={p.id} variant="default" className="border-neutral-800/80 p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  {/* Left part: text details */}
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <span className="text-xxs font-semibold font-mono text-accent uppercase tracking-wide">
                          {p.competitions?.name}
                        </span>
                        <Badge
                          variant={
                            p.status === "approved"
                              ? "success"
                              : p.status === "pending"
                              ? "warning"
                              : "error"
                          }
                          className="capitalize"
                        >
                          {p.status.replace("_", " ")}
                        </Badge>
                        {!amountMatches && isPending && (
                          <Badge variant="error" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Amount Mismatch (Expected {expectedFee})</span>
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-heading font-semibold text-neutral-100 mt-1">
                        Team: <span className="text-accent">{p.teams?.name || "N/A"}</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs font-sans text-neutral-400">
                      <div>
                        Transaction ID
                        <div className="text-neutral-200 font-mono font-semibold pt-0.5">{p.transaction_id}</div>
                      </div>
                      <div>
                        Submitted Amount
                        <div className={`font-semibold pt-0.5 ${amountMatches ? "text-neutral-200" : "text-error font-bold"}`}>
                          {p.amount} BDT
                        </div>
                      </div>
                      <div>
                        Payment Method
                        <div className="text-neutral-200 font-medium pt-0.5 uppercase">{p.method}</div>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        Submitted Date
                        <div className="text-neutral-300 pt-0.5">{new Date(p.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Middle part: screenshot preview */}
                  <div className="space-y-1.5 shrink-0 self-stretch md:self-auto flex flex-col justify-center">
                    <div className="text-xxs text-neutral-500 font-semibold uppercase tracking-wide font-sans">
                      Transaction Screenshot
                    </div>
                    <div className="relative group w-full md:w-48 aspect-video rounded-sm border border-neutral-850 overflow-hidden bg-neutral-950 flex items-center justify-center">
                      <img
                        src={p.screenshot_url}
                        alt="Screenshot Preview"
                        className="object-contain w-full h-full"
                      />
                      <button
                        onClick={() =>
                          setZoomImage({
                            url: p.screenshot_url,
                            teamName: p.teams?.name || "N/A",
                            txid: p.transaction_id,
                          })
                        }
                        className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity text-xs font-semibold text-neutral-200 font-sans"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Zoom Proof</span>
                      </button>
                    </div>
                  </div>

                  {/* Right part: Action triggers */}
                  {isPending && (
                    <div className="flex md:flex-col lg:flex-row gap-2 self-stretch md:self-auto shrink-0 pt-2 md:pt-0">
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(p.id)}
                        className="flex-1 md:flex-none text-xs py-2 px-4 flex items-center justify-center gap-1.5 bg-success hover:bg-success/90 border-success"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openActionDialog(p.id, "resubmission_required")}
                        className="flex-1 md:flex-none text-xs py-2 px-4 flex items-center justify-center gap-1.5 hover:border-warning hover:text-warning"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Request Resubmit</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openActionDialog(p.id, "reject")}
                        className="flex-1 md:flex-none text-xs py-2 px-4 flex items-center justify-center gap-1.5 hover:border-error hover:text-error"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes overlay / action dialog inline inside card */}
                {actioningPaymentId === p.id && actionType && (
                  <div className="border-t border-neutral-850 pt-4 space-y-4 animate-fade-in font-sans">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-accent" />
                      <h4 className="text-xs font-semibold text-neutral-300">
                        {actionType === "reject" ? "Specify Rejection Reason" : "Specify Resubmission Instructions"}
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        placeholder={
                          actionType === "reject"
                            ? "Provide notes explaining why this transaction proof was rejected..."
                            : "Provide instruction details on what needs to be fixed (e.g. upload a valid screenshot showing full statement details)..."
                        }
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="flex w-full rounded-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <Button
                          variant="ghost"
                          onClick={closeActionDialog}
                          className="py-1 px-3"
                          disabled={actionLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleActionSubmit}
                          isLoading={actionLoading}
                          className={`py-1 px-4 ${actionType === "reject" ? "bg-error hover:bg-error/90 border-error" : "bg-warning hover:bg-warning/90 border-warning"}`}
                        >
                          Confirm Status
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-md bg-neutral-900/10">
          <CreditCard className="h-10 w-10 text-neutral-700 mb-4 mx-auto" />
          <h3 className="font-heading font-semibold text-neutral-300 mb-1">No Payments Found</h3>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto">
            There are no payment proofs matching this search filter.
          </p>
        </div>
      )}

      {/* Lightbox / Zoom Overlay */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-md justify-center items-center p-4">
          <div className="w-full max-w-4xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <div className="space-y-0.5">
                <h3 className="font-heading font-bold text-neutral-50 text-base">
                  Payment Verification Zoom
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  Team: <span className="text-accent">{zoomImage.teamName}</span> | Transaction ID: <span className="text-neutral-200 font-mono">{zoomImage.txid}</span>
                </p>
              </div>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors text-neutral-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border border-neutral-800 rounded-md overflow-hidden bg-neutral-950 aspect-16/10 max-h-[75vh] flex items-center justify-center">
              <img
                src={zoomImage.url}
                alt="Payment proof zoom screenshot"
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
