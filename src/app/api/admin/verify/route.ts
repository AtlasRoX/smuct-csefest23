import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const verifyActionSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2. Authorize role (Must be admin)
    const { data: adminRecord, error: adminCheckError } = await supabase
      .from("users")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminCheckError || !adminRecord || adminRecord.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await req.json();
    const parseResult = verifyActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { user_id, action } = parseResult.data;
    const targetStatus = action === "approve" ? "verified" : "incomplete";

    // 4. Fetch previous value for audit log
    const { data: prevVerify } = await supabase
      .from("student_verifications")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // 5. Update student_verifications status
    const { data: verifyData, error: verifyErr } = await supabase
      .from("student_verifications")
      .update({
        status: targetStatus,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select("id");

    if (verifyErr) {
      throw new Error(`Verification update failed: ${verifyErr.message}`);
    }

    // Detect silent RLS block (update succeeded but 0 rows affected)
    if (!verifyData || verifyData.length === 0) {
      throw new Error(
        "student_verifications update was blocked — check RLS policies. Run migration_fix_admin_update.sql in Supabase."
      );
    }

    // 6. Update profiles verification_status
    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .update({
        verification_status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id)
      .select("id");

    if (profileErr) {
      throw new Error(`Profile status update failed: ${profileErr.message}`);
    }

    // Detect silent RLS block on profiles
    if (!profileData || profileData.length === 0) {
      throw new Error(
        "profiles.verification_status update was blocked — admin UPDATE policy is missing. Run migration_fix_admin_update.sql in Supabase."
      );
    }

    // 7. Write to audit logs
    await logAdminAction(
      supabase,
      adminUser.id,
      `${action.toUpperCase()}_STUDENT_ID`,
      "student_verifications",
      prevVerify?.id || null,
      prevVerify,
      {
        user_id,
        status: targetStatus,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      }
    );

    // 8. In-app notification is handled automatically via database trigger (tr_verification_notification)

    return NextResponse.json({
      success: true,
      message: `Student ID successfully ${action === "approve" ? "approved" : "rejected"}.`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[/api/admin/verify] Error:", errorMessage);
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
