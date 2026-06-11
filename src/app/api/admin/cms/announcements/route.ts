import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const announcementSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["low", "normal", "high", "emergency"]),
  type: z.enum(["general", "competition", "results", "deadline", "emergency"]),
  status: z.enum(["draft", "published", "archived"]),
  publish_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  pinned: z.boolean().default(false),
  is_delete: z.boolean().optional(),
});

// GET: Fetch all announcements for admin review
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

    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: announcements || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load announcements.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create/Update/Delete announcement
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
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

    // 3. Validate request payload
    const body = await req.json();
    const parseResult = announcementSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const {
      id,
      title,
      content,
      priority,
      type,
      status,
      publish_date,
      expiry_date,
      pinned,
      is_delete,
    } = parseResult.data;

    let actionName = "CREATE_ANNOUNCEMENT";
    let prevVal = null;
    let newVal = null;

    if (id) {
      // Fetch previous value for logging
      const { data: oldRecord } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();
      prevVal = oldRecord;

      if (is_delete) {
        actionName = "DELETE_ANNOUNCEMENT";
        const { error: deleteErr } = await supabase
          .from("announcements")
          .delete()
          .eq("id", id);

        if (deleteErr) throw deleteErr;

        await logAdminAction(
          supabase,
          user.id,
          actionName,
          "announcements",
          id,
          prevVal,
          null
        );

        return NextResponse.json({
          success: true,
          message: "Announcement successfully deleted.",
        });
      } else {
        actionName = "UPDATE_ANNOUNCEMENT";
        const updatePayload = {
          title,
          content,
          priority,
          type,
          status,
          publish_date: publish_date || new Date().toISOString(),
          expiry_date,
          pinned,
        };

        const { data: updatedAnn, error: updateErr } = await supabase
          .from("announcements")
          .update(updatePayload)
          .eq("id", id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        newVal = updatedAnn;

        await logAdminAction(
          supabase,
          user.id,
          actionName,
          "announcements",
          id,
          prevVal,
          newVal
        );

        return NextResponse.json({
          success: true,
          message: "Announcement successfully updated.",
          data: updatedAnn,
        });
      }
    } else {
      // Create new announcement
      const insertPayload = {
        title,
        content,
        priority,
        type,
        status,
        publish_date: publish_date || new Date().toISOString(),
        expiry_date,
        pinned,
      };

      const { data: newAnn, error: insertErr } = await supabase
        .from("announcements")
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      newVal = newAnn;

      await logAdminAction(
        supabase,
        user.id,
        actionName,
        "announcements",
        newAnn.id,
        null,
        newVal
      );

      return NextResponse.json({
        success: true,
        message: "Announcement successfully created.",
        data: newAnn,
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
