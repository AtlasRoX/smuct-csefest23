import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/notifications/[id]
// Marks a single notification as read. User can only modify their own.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id); // RLS enforced + explicit check

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
