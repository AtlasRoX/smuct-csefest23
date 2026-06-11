import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/utils/logger";

const competitionValidationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Competition name is required"),
  type: z.enum(["Showcase", "Programming", "Security", "Robotics", "Esports", "Custom"]),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  eligibility: z.enum(["internal", "external", "both"]),
  solo_allowed: z.boolean().default(true),
  team_allowed: z.boolean().default(true),
  min_members: z.number().int().min(1).default(1),
  max_members: z.number().int().min(1).default(4),
  registration_start: z.string().min(1, "Registration start is required"),
  registration_end: z.string().min(1, "Registration end is required"),
  submission_start: z.string().min(1, "Submission start is required"),
  submission_end: z.string().min(1, "Submission end is required"),
  entry_fee: z.number().min(0, "Entry fee cannot be negative").default(0),
  payment_instructions: z.string().optional().nullable(),
  rulebook_url: z.string().optional().nullable(),
  prize_pool: z.string().optional().nullable(),
  champion_prize: z.string().optional().nullable(),
  runner_up_prize: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "registration_open", "registration_closed", "archived"]).default("draft"),
});

// GET list of all competitions for admin view (including draft ones)
export async function GET() {
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

    // 2. Authorize role (admin only)
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

    const { data: competitions, error } = await supabase
      .from("competitions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: competitions || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch competitions.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create or Update a competition
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
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
        { success: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    // 3. Validate request payload
    const body = await req.json();
    const parseResult = competitionValidationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const compData = parseResult.data;
    const isUpdate = !!compData.id;

    let previousVal: unknown = null;

    if (isUpdate) {
      // Get previous state for audit logging
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", compData.id)
        .single();
      previousVal = data;
    }

    // 4. Save (Upsert) to database
    const dbPayload = {
      ...compData,
      updated_at: new Date().toISOString(),
    };

    const { data: savedComp, error: saveError } = await supabase
      .from("competitions")
      .upsert(dbPayload)
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save competition: ${saveError.message}`);
    }

    // 5. Write to Audit Logs
    await logAdminAction(
      supabase,
      user.id,
      isUpdate ? "UPDATE_COMPETITION" : "CREATE_COMPETITION",
      "competitions",
      savedComp.id,
      previousVal,
      savedComp
    );

    return NextResponse.json({
      success: true,
      message: `Competition successfully ${isUpdate ? "updated" : "created"}.`,
      data: savedComp,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
