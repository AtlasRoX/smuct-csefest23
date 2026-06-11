"use client";

import * as React from "react";
import {
  TrendingUp,
  Banknote,
  Users,
  Percent,
  Download,
  BarChart3,
  Calendar,
  Sparkles,
} from "lucide-react";
import useSWR from "swr";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CompItem {
  id: string;
  name: string;
}

interface AnalyticsData {
  registrationTrends: Array<{ date: string; count: number }>;
  competitionShares: Array<{ name: string; teamsCount: number }>;
  universityStats: Array<{ university: string; count: number }>;
  paymentCollections: Array<{ method: string; total: number }>;
  summary: {
    totalRevenue: number;
    averageTeamsPerComp: number;
    verifiedRatio: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CHART_COLORS = ["#8B5CF6", "#06B6D4", "#A78BFA", "#3B82F6", "#10B981"];

export default function AdminAnalyticsPage() {
  const [exportType, setExportType] = React.useState<"teams" | "payments" | "rankings">("teams");
  const [selectedCompId, setSelectedCompId] = React.useState<string>("");

  const { data: analyticsRes, error: analyticsErr, isLoading } = useSWR<{ success: boolean; data: AnalyticsData }>(
    "/api/admin/analytics",
    fetcher
  );

  const { data: compRes } = useSWR<{ success: boolean; data: CompItem[] }>(
    "/api/admin/competitions",
    fetcher
  );

  const competitions = React.useMemo(() => compRes?.data || [], [compRes]);
  const analytics = React.useMemo(() => analyticsRes?.data, [analyticsRes]);

  const handleExport = () => {
    let url = `/api/admin/export?type=${exportType}`;
    if (selectedCompId) {
      url += `&competition_id=${selectedCompId}`;
    }
    // Trigger download
    window.location.href = url;
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-neutral-900 w-1/4 rounded-sm" />
          <div className="h-4 bg-neutral-900 w-1/3 rounded-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-900 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-72 bg-neutral-900 rounded-md" />
          <div className="h-72 bg-neutral-900 rounded-md" />
        </div>
      </div>
    );
  }

  if (analyticsErr || !analytics) {
    return (
      <div className="py-12 text-center">
        <div className="p-4 rounded-sm bg-error/10 border border-error/20 max-w-md mx-auto text-error text-sm font-sans font-medium">
          <p>Failed to load analytics dashboard. Please try again.</p>
          <Button variant="secondary" className="mt-4 text-xs" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Analytics & Insights</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Review participant conversion rates, registration growth timelines, college distributions, and collections reports.
        </p>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Total Revenue
              </span>
              <h4 className="text-2xl font-heading font-bold text-success font-mono">
                ৳{analytics.summary.totalRevenue.toLocaleString()}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Banknote className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Teams Per Comp */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Avg Teams / Comp
              </span>
              <h4 className="text-2xl font-heading font-bold text-neutral-200 font-mono">
                {analytics.summary.averageTeamsPerComp}
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Users className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>

        {/* Verification Ratio */}
        <Card variant="default">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider">
                Student Verification Rate
              </span>
              <h4 className="text-2xl font-heading font-bold text-neutral-200 font-mono">
                {analytics.summary.verifiedRatio}%
              </h4>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm">
              <Percent className="h-6 w-6 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Registration Trend Over Time */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span>Registration Trend (Last 15 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.registrationTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "4px" }}
                  labelStyle={{ color: "#a3a3a3", fontSize: "11px", fontFamily: "sans-serif" }}
                  itemStyle={{ color: "#f5f5f5", fontSize: "11px", fontFamily: "sans-serif" }}
                />
                <Area type="monotone" dataKey="count" name="Registrations" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Competitions Roster Shares */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" />
              <span>Registered Teams by Competition</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.competitionShares} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#525252" fontSize={9} tickLine={false} tickFormatter={(value) => value.substring(0, 10) + "..."} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "4px" }}
                  labelStyle={{ color: "#a3a3a3", fontSize: "11px" }}
                  itemStyle={{ color: "#f5f5f5", fontSize: "11px" }}
                />
                <Bar dataKey="teamsCount" name="Teams" radius={[4, 4, 0, 0]}>
                  {analytics.competitionShares.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Top Participating Universities */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Top 5 Universities Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={analytics.universityStats}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} />
                <YAxis dataKey="university" type="category" stroke="#525252" fontSize={9} tickLine={false} width={100} tickFormatter={(val) => val.substring(0, 15)} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "4px" }}
                  labelStyle={{ color: "#a3a3a3", fontSize: "11px" }}
                  itemStyle={{ color: "#f5f5f5", fontSize: "11px" }}
                />
                <Bar dataKey="count" name="Participants" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Payment Collections split */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span>Gateway Collections Split</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.paymentCollections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="method" stroke="#525252" fontSize={10} tickLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "4px" }}
                  labelStyle={{ color: "#a3a3a3", fontSize: "11px" }}
                  itemStyle={{ color: "#f5f5f5", fontSize: "11px" }}
                />
                <Bar dataKey="total" name="Amount (৳)" radius={[4, 4, 0, 0]}>
                  <Cell fill="#d32f2f" />
                  <Cell fill="#ff6d00" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* CSV Export Console Card */}
      <Card variant="default" className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-md flex items-center gap-2 text-neutral-200">
            <Download className="h-5 w-5 text-accent" />
            <span>CSV Data Export Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 font-sans text-xs">
          <p className="text-neutral-500 leading-relaxed">
            Download standard RFC 4180 CSV spreadsheet collections directly from the database. Select filters to refine output size.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Type */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-400">Export Category</label>
              <select
                className="flex h-10 w-full rounded-sm border border-neutral-850 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                value={exportType}
                onChange={(e) => setExportType(e.target.value as "teams" | "payments" | "rankings")}
              >
                <option value="teams">Teams & Members List</option>
                <option value="payments">Approved Payments History</option>
                <option value="rankings">Recalculated Competition Rankings</option>
              </select>
            </div>

            {/* Competition Filter */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-400">Refine by Competition (Optional)</label>
              <select
                className="flex h-10 w-full rounded-sm border border-neutral-850 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
              >
                <option value="">All Competitions</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-850 flex justify-end">
            <Button
              variant="primary"
              onClick={handleExport}
              className="bg-accent border-accent hover:bg-accent/90 gap-1.5 text-xs font-semibold py-2 px-5"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV Spreadsheet</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
