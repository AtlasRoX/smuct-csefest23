import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  gender: z.string().min(1, "Gender is required"),
  university: z.string().min(2, "University is required"),
  department: z.string().min(2, "Department is required"),
  semester: z.string().min(1, "Semester is required"),
  student_id: z.string().min(2, "Student ID is required"),
  github: z.string().url("Please enter a valid GitHub profile URL").optional().or(z.literal("")),
  portfolio: z.string().url("Please enter a valid portfolio URL").optional().or(z.literal("")),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  bio: z.string().max(250, "Bio must be under 250 characters").optional().or(z.literal("")),
  tshirt_size: z.string().min(1, "T-shirt size is required"),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please login first." },
        { status: 401 }
      );
    }

    // 1b. Rate limit: 20 profile saves per minute per user
    const { success: withinLimit } = checkRateLimit(`profile:${user.id}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait a moment before saving again." },
        { status: 429 }
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const parseResult = profileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    // 3. Update profile row
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parseResult.data.full_name,
        phone: parseResult.data.phone,
        gender: parseResult.data.gender,
        university: parseResult.data.university,
        department: parseResult.data.department,
        semester: parseResult.data.semester,
        student_id: parseResult.data.student_id,
        github: parseResult.data.github || null,
        portfolio: parseResult.data.portfolio || null,
        skills: parseResult.data.skills,
        bio: parseResult.data.bio || null,
        tshirt_size: parseResult.data.tshirt_size,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
