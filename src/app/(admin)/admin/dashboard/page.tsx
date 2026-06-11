"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Banknote,
  FileCode,
  History,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface VerificationItem {
  id: string;
  user_id: string;
  id_front_url: string;
  id_back_url: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    university: string;
    student_id: string;
  } | null;
}

interface AuditLogItem {
  id: string;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    totalTeams: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalSubmissions: 0,
    selectedSubmissions: 0,
  });
  const [pendingVerifications, setPendingVerifications] = React.useState<VerificationItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const supabase = createClient();

  React.useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Fetch profiles count breakdown
        const { data: profiles, error: profileErr } = await supabase
          .from("profiles")
          .select("verification_status");

        if (profileErr) throw profileErr;

        let total = 0;
        let verified = 0;
        let pending = 0;

        if (profiles) {
          total = profiles.length;
          profiles.forEach((p) => {
            if (p.verification_status === "verified") verified++;
            if (p.verification_status === "pending") pending++;
          });
        }

        // 2. Fetch teams count
        const { count: teamCount, error: teamErr } = await supabase
          .from("teams")
          .select("*", { count: "exact", head: true });

        if (teamErr) throw teamErr;

        // 3. Fetch approved payments for revenue calculation
        const { data: approvedPayments, error: payErr } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "approved");

        if (payErr) throw payErr;

        const revSum = (approvedPayments || []).reduce((acc, p) => acc + Number(p.amount), 0);

        // 4. Fetch pending payments count
        const { count: pendingPayCount, error: pendingPayErr } = await supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        if (pendingPayErr) throw pendingPayErr;

        // 5. Fetch submissions count breakdown
        const { data: submissionsData, error: subErr } = await supabase
          .from("submissions")
          .select("status");

        if (subErr) throw subErr;

        let totalSubs = 0;
        let selectedSubs = 0;
        if (submissionsData) {
          totalSubs = submissionsData.length;
          submissionsData.forEach((s) => {
            if (s.status === "selected") selectedSubs++;
          });
        }

        setStats({
          totalUsers: total,
          verifiedUsers: verified,
          pendingUsers: pending,
          totalTeams: teamCount || 0,
          totalRevenue: revSum,
          pendingPayments: pendingPayCount || 0,
          totalSubmissions: totalSubs,
          selectedSubmissions: selectedSubs,
        });

        // 6. Fetch recent pending student verifications
        const { data: verifs, error: verifErr } = await supabase
          .from("student_verifications")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(3);

        if (verifErr) throw verifErr;

        if (verifs && verifs.length > 0) {
          const userIds = verifs.map((v) => v.user_id);
          const { data: profilesData, error: profilesErr } = await supabase
            .from("profiles")
            .select("id, full_name, university, student_id")
            .in("id", userIds);

          if (profilesErr) throw profilesErr;

          const mergedVerifs = verifs.map((v) => {
            const profile = profilesData?.find((p) => p.id === v.user_id) || null;
            return {
              ...v,
              profiles: profile
                ? {
                    full_name: profile.full_name || "",
                    university: profile.university || "",
                    student_id: profile.student_id || "",
                  }
                : null,
            };
          });

          setPendingVerifications(mergedVerifs as unknown as VerificationItem[]);
        } else {
          setPendingVerifications([]);
        }

        // 7. Fetch audit logs from the new API route
        const logsRes = await fetch("/api/admin/audit-logs");
        const logsJson = await logsRes.json();
        if (logsJson.success) {
          setAuditLogs(logsJson.data || []);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard metrics.";
        setErrorMsg(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, [supabase]);

  // Translate audit log actions to human friendly tags
  function getActionMeta(action: string) {
    switch (action) {
      case "CREATE_COMPETITION":
        return { label: "Created Comp", color: "success" as const };
      case "UPDATE_COMPETITION":
        return { label: "Updated Comp", color: "neutral" as const };
      case "REVIEW_SUBMISSION":
        return { label: "Reviewed Proposal", color: "primary" as const };
      case "REVIEW_PAYMENT":
        return { label: "Reviewed Payment", color: "secondary" as const };
      case "APPROVE_STUDENT_ID":
        return { label: "Approved ID", color: "success" as const };
      case "REJECT_STUDENT_ID":
        return { label: "Rejected ID", color: "neutral" as const };
      case "JUDGE_TEAM_SCORE":
        return { label: "Graded Team", color: "primary" as const };
      case "PUBLISH_LEADERBOARD":
        return { label: "Published Ranks", color: "success" as const };
      default:
        return { label: action.replace(/_/g, " ").toLowerCase(), color: "neutral" as const };
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-neutral-900 w-1/4 rounded-sm" />
          <div className="h-4 bg-neutral-900 w-1/3 rounded-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-900 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72 bg-neutral-900 rounded-md" />
          <div className="h-72 bg-neutral-900 rounded-md" />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="py-12 text-center">
        <div className="p-4 rounded-sm bg-error/10 border border-error/20 max-w-md mx-auto text-error text-sm font-sans font-medium">
          <p>{errorMsg}</p>
          <Button variant="secondary" className="mt-4 text-xs" onClick={() => window.location.reload()}>
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Admin Dashboard</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Monitor attendee registration stats, verify student credentials, check payment collection, and track event structures.
        </p>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Total Registrations
              </span>
              <h4 className="text-2xl font-heading font-bold text-neutral-200 font-mono">
                {stats.totalUsers}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Users className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Total Revenue Collected
              </span>
              <h4 className="text-2xl font-heading font-bold text-success font-mono">
                ৳{stats.totalRevenue.toLocaleString()}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Banknote className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments Review */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Pending Payments
              </span>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-heading font-bold text-neutral-200 font-mono">
                  {stats.pendingPayments}
                </h4>
                {stats.pendingPayments > 0 && (
                  <Badge variant="warning" className="text-xxs px-1.5 py-0.5">
                    Needs Action
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Clock className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>

        {/* Submissions Selected Rate */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Selected proposals
              </span>
              <h4 className="text-2xl font-heading font-bold text-neutral-200 font-mono">
                {stats.selectedSubmissions} <span className="text-xs text-neutral-500 font-sans font-normal">/ {stats.totalSubmissions}</span>
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <FileCode className="h-6 w-6 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Area (Column 1 & 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Student Verifications queue preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-semibold text-neutral-200">
                Pending Student Verifications
              </h2>
              <Link href="/admin/verifications">
                <Button variant="ghost" className="text-xs flex items-center gap-1.5 py-1 px-2.5">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {pendingVerifications.length > 0 ? (
              <div className="space-y-4">
                {pendingVerifications.map((v) => (
                  <Card key={v.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="font-heading font-semibold text-sm text-neutral-200">
                        {v.profiles?.full_name || "Applicant Name"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-sans text-neutral-400">
                        <span>ID: {v.profiles?.student_id || "N/A"}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                        <span>{v.profiles?.university || "University"}</span>
                      </div>
                    </div>
                    <div>
                      <Link href="/admin/verifications">
                        <Button variant="secondary" className="text-xs py-1.5 px-3">
                          Review ID Documents
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 border border-dashed border-neutral-800 rounded-md text-center bg-neutral-900/10 space-y-3">
                <ShieldCheck className="h-10 w-10 text-neutral-700 mx-auto" />
                <h3 className="font-heading font-semibold text-sm text-neutral-300">Queue is Empty</h3>
                <p className="text-xs text-neutral-500 font-sans max-w-sm mx-auto leading-relaxed">
                  All student verifications are completed. No reviews pending at this moment.
                </p>
              </div>
            )}
          </div>

          {/* Admin Activity Feed (Step 11 Log Feed) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-neutral-400" />
              <h2 className="text-lg font-heading font-semibold text-neutral-200">
                Admin Activity Audit Logs
              </h2>
            </div>

            <Card variant="default">
              <CardContent className="p-0">
                {auditLogs.length > 0 ? (
                  <div className="divide-y divide-neutral-850 font-sans text-xs">
                    {auditLogs.map((log) => {
                      const meta = getActionMeta(log.action);
                      return (
                        <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-neutral-900/15 transition-colors">
                          <div className="flex items-start gap-2.5">
                            <Badge variant={meta.color} className="text-xxs px-2 py-0.5 mt-0.5 shrink-0 uppercase tracking-wider font-semibold">
                              {meta.label}
                            </Badge>
                            <div className="space-y-1">
                              <div className="text-neutral-300 font-medium leading-relaxed">
                                Action on <span className="font-mono text-accent text-xxs bg-accent/5 px-1 py-0.5 rounded border border-accent/10">{log.resource_type}</span>
                                {log.resource_id && (
                                  <span className="text-neutral-500 font-mono text-xxs ml-1.5 shrink-0">({log.resource_id.substring(0, 8)}...)</span>
                                )}
                              </div>
                              <div className="text-neutral-500 text-xxs flex flex-wrap gap-2 items-center">
                                <span className="text-neutral-400 font-semibold">{log.admin_name}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-neutral-500 font-sans leading-relaxed flex flex-col items-center gap-2">
                    <History className="h-8 w-8 text-neutral-700" />
                    <span>No admin actions have been logged yet.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          <h2 className="text-lg font-heading font-semibold text-neutral-200">System Insights</h2>
          
          {/* Verification Progress */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span>Verification Ratio</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-neutral-400">
                  <span>Progress Ratio</span>
                  <span>
                    {stats.totalUsers > 0
                      ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
                      : 0}
                    % verified
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                  <motion.div
                    className="h-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        stats.totalUsers > 0
                          ? (stats.verifiedUsers / stats.totalUsers) * 100
                          : 0
                      }%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              <p className="text-xxs text-neutral-500 leading-normal">
                Verifying students ensures correct eligibility matches (internal vs external) for competitions and team formation.
              </p>
            </CardContent>
          </Card>

          {/* Submission and Teams Status */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                <span>Roster Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-sans text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-neutral-400">
                  <span>Total Formed Teams</span>
                  <span className="font-semibold font-mono text-neutral-200">{stats.totalTeams}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Verified Accounts</span>
                  <span className="font-semibold font-mono text-neutral-200">{stats.verifiedUsers}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Pending review</span>
                  <span className="font-semibold font-mono text-neutral-200">{stats.pendingUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
