import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email("Invalid email").or(z.string().length(0)).optional().nullable(),
  phone: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  maps_url: z.string().optional().nullable(),
});

// GET: Fetch contact info coordinates for admin review
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

    const { data: contact, error } = await supabase
      .from("contact_info")
      .select("*");

    if (error) throw error;

    // Return the first row, or null if empty
    return NextResponse.json({
      success: true,
      data: contact && contact.length > 0 ? contact[0] : null,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load contact info.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Upsert contact info coordinates
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

    // 3. Validate payload
    const body = await req.json();
    const parseResult = contactSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { id, email, phone, facebook, linkedin, address, maps_url } = parseResult.data;

    let prevVal = null;
    let newVal = null;

    if (id) {
      // Fetch Old Record
      const { data: oldRecord } = await supabase
        .from("contact_info")
        .select("*")
        .eq("id", id)
        .single();
      prevVal = oldRecord;

      const updatePayload = {
        email: email || null,
        phone: phone || null,
        facebook: facebook || null,
        linkedin: linkedin || null,
        address: address || null,
        maps_url: maps_url || null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedContact, error: updateErr } = await supabase
        .from("contact_info")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      newVal = updatedContact;

      await logAdminAction(
        supabase,
        user.id,
        "UPDATE_CONTACT_INFO",
        "contact_info",
        id,
        prevVal,
        newVal
      );

      return NextResponse.json({
        success: true,
        message: "Contact coordinates successfully updated.",
        data: updatedContact,
      });
    } else {
      // Create New row (check if table is really empty)
      const { data: existingRows } = await supabase
        .from("contact_info")
        .select("*")
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        // Force update of existing instead
        const targetId = existingRows[0].id;
        const updatePayload = {
          email: email || null,
          phone: phone || null,
          facebook: facebook || null,
          linkedin: linkedin || null,
          address: address || null,
          maps_url: maps_url || null,
          updated_at: new Date().toISOString(),
        };

        const { data: updatedContact, error: updateErr } = await supabase
          .from("contact_info")
          .update(updatePayload)
          .eq("id", targetId)
          .select()
          .single();

        if (updateErr) throw updateErr;
        newVal = updatedContact;

        await logAdminAction(
          supabase,
          user.id,
          "UPDATE_CONTACT_INFO",
          "contact_info",
          targetId,
          existingRows[0],
          newVal
        );

        return NextResponse.json({
          success: true,
          message: "Contact coordinates successfully updated.",
          data: updatedContact,
        });
      }

      const insertPayload = {
        email: email || null,
        phone: phone || null,
        facebook: facebook || null,
        linkedin: linkedin || null,
        address: address || null,
        maps_url: maps_url || null,
        updated_at: new Date().toISOString(),
      };

      const { data: newContact, error: insertErr } = await supabase
        .from("contact_info")
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      newVal = newContact;

      await logAdminAction(
        supabase,
        user.id,
        "CREATE_CONTACT_INFO",
        "contact_info",
        newContact.id,
        null,
        newVal
      );

      return NextResponse.json({
        success: true,
        message: "Contact coordinates successfully created.",
        data: newContact,
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
