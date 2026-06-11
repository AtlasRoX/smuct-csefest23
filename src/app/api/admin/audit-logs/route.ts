import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // 3. Fetch recent audit logs
    const { data: logs, error: logsError } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (logsError) throw logsError;

    // 4. Fetch admin profiles in memory to avoid RLS join warnings
    const adminIds = Array.from(new Set((logs || []).map((l) => l.admin_id).filter((id): id is string => !!id)));
    
    const profilesMap: Record<string, string> = {};
    if (adminIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", adminIds);
      
      if (!profilesError && profiles) {
        profiles.forEach((p) => {
          profilesMap[p.id] = p.full_name;
        });
      }
    }

    const mergedData = (logs || []).map((log) => ({
      id: log.id,
      admin_id: log.admin_id,
      admin_name: log.admin_id ? (profilesMap[log.admin_id] || "System Admin") : "System",
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      previous_value: log.previous_value,
      new_value: log.new_value,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: mergedData,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load audit logs.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
