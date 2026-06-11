import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCSVValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── Row types returned by Supabase queries ──────────────────────────────────
// Supabase returns joined relations as arrays from .select() even for
// foreign-key relationships — we access [0] manually or use the null-coalescing
// pattern. The `as unknown as X[]` double-cast bridges the Supabase generic and
// our typed interface without reaching for `any`.

interface TeamRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  competitions: Array<{ name: string }>;
  users: Array<{ email: string }>;
}

interface PaymentRow {
  id: string;
  amount: number;
  transaction_id: string;
  method: string;
  status: string;
  created_at: string;
  teams: Array<{ name: string }>;
  competitions: Array<{ name: string }>;
}

interface RankingRow {
  id: string;
  total_score: number;
  rank_position: number | null;
  is_finalist: boolean;
  is_public: boolean;
  teams: Array<{ name: string }>;
  competitions: Array<{ name: string }>;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2. Authorize admin
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userRecord || userRecord.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("type"); // 'teams' | 'payments' | 'rankings'
    const competitionId = searchParams.get("competition_id");

    if (!exportType) {
      return NextResponse.json(
        { success: false, message: "Missing export type parameter." },
        { status: 400 }
      );
    }

    let csvContent = "";
    let filename = "export.csv";

    // 3. Query and build CSV by type
    if (exportType === "teams") {
      filename = `teams_${competitionId || "all"}.csv`;
      let query = supabase
        .from("teams")
        .select("id, name, status, created_at, competitions(name), users:leader_id(email)");

      if (competitionId) {
        query = query.eq("competition_id", competitionId);
      }

      const { data: teams, error } = await query;
      if (error) throw error;

      csvContent += "Team ID,Team Name,Competition,Leader Email,Status,Created At\n";
      (teams as unknown as TeamRow[] || []).forEach((t) => {
        csvContent += [
          escapeCSVValue(t.id),
          escapeCSVValue(t.name),
          escapeCSVValue((t.competitions as Array<{ name: string }>)?.[0]?.name ?? "N/A"),
          escapeCSVValue((t.users as Array<{ email: string }>)?.[0]?.email ?? "N/A"),
          escapeCSVValue(t.status),
          escapeCSVValue(t.created_at),
        ].join(",") + "\n";
      });

    } else if (exportType === "payments") {
      filename = "payments_record.csv";
      let query = supabase
        .from("payments")
        .select("id, amount, transaction_id, method, status, created_at, teams(name), competitions(name)");

      if (competitionId) {
        query = query.eq("competition_id", competitionId);
      }

      const { data: payments, error } = await query;
      if (error) throw error;

      csvContent += "Payment ID,Team Name,Competition,Amount,Transaction ID,Method,Status,Created At\n";
      (payments as unknown as PaymentRow[] || []).forEach((p) => {
        csvContent += [
          escapeCSVValue(p.id),
          escapeCSVValue((p.teams as Array<{ name: string }>)?.[0]?.name ?? "N/A"),
          escapeCSVValue((p.competitions as Array<{ name: string }>)?.[0]?.name ?? "N/A"),
          escapeCSVValue(p.amount),
          escapeCSVValue(p.transaction_id),
          escapeCSVValue(p.method),
          escapeCSVValue(p.status),
          escapeCSVValue(p.created_at),
        ].join(",") + "\n";
      });

    } else if (exportType === "rankings") {
      filename = `rankings_${competitionId || "all"}.csv`;
      let query = supabase
        .from("rankings")
        .select("id, total_score, rank_position, is_finalist, is_public, teams(name), competitions(name)")
        .order("rank_position", { ascending: true });

      if (competitionId) {
        query = query.eq("competition_id", competitionId);
      }

      const { data: rankings, error } = await query;
      if (error) throw error;

      csvContent += "Rank,Team Name,Competition,Total Score,Is Finalist,Is Public\n";
      (rankings as unknown as RankingRow[] || []).forEach((r) => {
        csvContent += [
          escapeCSVValue(r.rank_position ?? "—"),
          escapeCSVValue((r.teams as Array<{ name: string }>)?.[0]?.name ?? "N/A"),
          escapeCSVValue((r.competitions as Array<{ name: string }>)?.[0]?.name ?? "N/A"),
          escapeCSVValue(r.total_score),
          escapeCSVValue(r.is_finalist ? "Yes" : "No"),
          escapeCSVValue(r.is_public ? "Yes" : "No"),
        ].join(",") + "\n";
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid export type. Must be teams, payments, or rankings." },
        { status: 400 }
      );
    }

    // 4. Return CSV as attachment — no-cache since this is sensitive admin data
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to export CSV.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
