import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const tickerSchema = z.object({
  id: z.string().uuid().optional(),
  message: z.string().min(1, "Message is required"),
  pinned: z.boolean().default(false),
  scheduled_at: z.string().optional().nullable(),
  active: z.boolean().default(true),
  is_delete: z.boolean().optional(),
});

// GET: Fetch all ticker items for admin review
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

    const { data: items, error } = await supabase
      .from("ticker_items")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: items || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load ticker items.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create/Update/Delete ticker item
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
    const parseResult = tickerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { id, message, pinned, scheduled_at, active, is_delete } = parseResult.data;

    let actionName = "CREATE_TICKER_ITEM";
    let prevVal = null;
    let newVal = null;

    if (id) {
      // Fetch previous value for logging
      const { data: oldRecord } = await supabase
        .from("ticker_items")
        .select("*")
        .eq("id", id)
        .single();
      prevVal = oldRecord;

      if (is_delete) {
        actionName = "DELETE_TICKER_ITEM";
        const { error: deleteErr } = await supabase
          .from("ticker_items")
          .delete()
          .eq("id", id);

        if (deleteErr) throw deleteErr;

        await logAdminAction(
          supabase,
          user.id,
          actionName,
          "ticker_items",
          id,
          prevVal,
          null
        );

        return NextResponse.json({
          success: true,
          message: "Ticker item successfully deleted.",
        });
      } else {
        actionName = "UPDATE_TICKER_ITEM";
        const updatePayload = {
          message,
          pinned,
          scheduled_at,
          active,
        };

        const { data: updatedItem, error: updateErr } = await supabase
          .from("ticker_items")
          .update(updatePayload)
          .eq("id", id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        newVal = updatedItem;

        await logAdminAction(
          supabase,
          user.id,
          actionName,
          "ticker_items",
          id,
          prevVal,
          newVal
        );

        return NextResponse.json({
          success: true,
          message: "Ticker item successfully updated.",
          data: updatedItem,
        });
      }
    } else {
      // Create new ticker item
      const insertPayload = {
        message,
        pinned,
        scheduled_at: scheduled_at || new Date().toISOString(),
        active,
      };

      const { data: newItem, error: insertErr } = await supabase
        .from("ticker_items")
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      newVal = newItem;

      await logAdminAction(
        supabase,
        user.id,
        actionName,
        "ticker_items",
        newItem.id,
        null,
        newVal
      );

      return NextResponse.json({
        success: true,
        message: "Ticker item successfully created.",
        data: newItem,
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
