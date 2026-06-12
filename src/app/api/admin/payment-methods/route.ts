import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const paymentMethodSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(2, "Identifier must be at least 2 characters")
    .regex(/^[a-z0-9_-]+$/, "Identifier must be lowercase alphanumeric, hyphens, or underscores only"),
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  number: z.string().min(6, "Account number must be at least 6 characters"),
  instructions: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

// GET: Fetch all payment methods (both active and inactive) for admin management
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

    // 3. Query all payment methods
    const { data: methods, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: methods || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load payment methods.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create or Update a payment method
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
    const parseResult = paymentMethodSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const gatewayData = parseResult.data;
    const isUpdate = !!gatewayData.id;

    let previousVal: unknown = null;

    if (isUpdate) {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("id", gatewayData.id)
        .single();
      previousVal = data;
    }

    // 4. Save/Upsert payment method
    const dbPayload = {
      ...gatewayData,
      updated_at: new Date().toISOString(),
    };

    const { data: savedGateway, error: saveError } = await supabase
      .from("payment_methods")
      .upsert(dbPayload)
      .select()
      .single();

    if (saveError) {
      if (saveError.code === "23505") {
        return NextResponse.json(
          { success: false, message: "A payment gateway identifier with this name already exists." },
          { status: 409 }
        );
      }
      throw new Error(`Failed to save payment method: ${saveError.message}`);
    }

    // 5. Write to Audit Logs
    await logAdminAction(
      supabase,
      user.id,
      isUpdate ? "UPDATE_PAYMENT_METHOD" : "CREATE_PAYMENT_METHOD",
      "payment_methods",
      savedGateway.id,
      previousVal,
      savedGateway
    );

    return NextResponse.json({
      success: true,
      message: `Payment method successfully ${isUpdate ? "updated" : "created"}.`,
      data: savedGateway,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE: Delete a payment method
export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing payment method id." },
        { status: 400 }
      );
    }

    // 3. Get previous state for audit log before delete
    const { data: prevGateway, error: fetchErr } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !prevGateway) {
      return NextResponse.json(
        { success: false, message: "Payment method not found." },
        { status: 404 }
      );
    }

    // 4. Delete payment method
    const { error: deleteErr } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      throw new Error(`Failed to delete payment method: ${deleteErr.message}`);
    }

    // 5. Write to Audit Logs
    await logAdminAction(
      supabase,
      user.id,
      "DELETE_PAYMENT_METHOD",
      "payment_methods",
      id,
      prevGateway,
      null
    );

    return NextResponse.json({
      success: true,
      message: "Payment method successfully deleted.",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
