import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Logs an admin mutation/action to the database audit_logs table.
 * Assumes RLS permits the admin to insert into public.audit_logs.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  previousValue: unknown | null,
  newValue: unknown | null
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    previous_value: previousValue ? JSON.stringify(previousValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
  });

  if (error) {
    console.error(`[AUDIT LOG FAILURE] Action: ${action}, Error: ${error.message}`);
  }
}
