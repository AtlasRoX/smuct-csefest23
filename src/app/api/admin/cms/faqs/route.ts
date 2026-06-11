import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const faqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  display_order: z.number().int().default(0),
  visible: z.boolean().default(true),
  is_delete: z.boolean().optional(),
});

// GET: Fetch all FAQs for admin review
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

    const { data: faqs, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: faqs || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load FAQs.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create/Update/Delete FAQ
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
    const parseResult = faqSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { id, question, answer, display_order, visible, is_delete } = parseResult.data;

    let actionName = "CREATE_FAQ";
    let prevVal = null;
    let newVal = null;

    if (id) {
      // Fetch old record for logging
      const { data: oldRecord } = await supabase
        .from("faqs")
        .select("*")
        .eq("id", id)
        .single();
      prevVal = oldRecord;

      if (is_delete) {
        actionName = "DELETE_FAQ";
        const { error: deleteErr } = await supabase
          .from("faqs")
          .delete()
          .eq("id", id);

        if (deleteErr) throw deleteErr;

        await logAdminAction(
          supabase,
          user.id,
          actionName,
          "faqs",
          id,
          prevVal,
          null
        );

        return NextResponse.json({
          success: true,
          message: "FAQ successfully deleted.",
        });
      } else {
        actionName = "UPDATE_FAQ";
        const updatePayload = {
          question,
          answer,
          display_order,
          visible,
        };

        const { data: updatedFaq, error: updateErr } = await supabase
          .from("faqs")
          .update(updatePayload)
          .eq("id", id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        newVal = updatedFaq;

        await logAdminAction(
          supabase,
          user.id,
          actionName,
          "faqs",
          id,
          prevVal,
          newVal
        );

        return NextResponse.json({
          success: true,
          message: "FAQ successfully updated.",
          data: updatedFaq,
        });
      }
    } else {
      // Create new FAQ
      const insertPayload = {
        question,
        answer,
        display_order,
        visible,
      };

      const { data: newFaq, error: insertErr } = await supabase
        .from("faqs")
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      newVal = newFaq;

      await logAdminAction(
        supabase,
        user.id,
        actionName,
        "faqs",
        newFaq.id,
        null,
        newVal
      );

      return NextResponse.json({
        success: true,
        message: "FAQ successfully created.",
        data: newFaq,
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
