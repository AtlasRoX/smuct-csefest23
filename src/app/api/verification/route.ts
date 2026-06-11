import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/cloudinary";

const verificationSchema = z.object({
  id_front_base64: z.string().min(1, "Front image is required"),
  id_back_base64: z.string().min(1, "Back image is required"),
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

    // 2. Validate request body
    const body = await req.json();
    const parseResult = verificationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    // 3. Upload to Cloudinary using standard pathing
    const frontUpload = await uploadImage(
      parseResult.data.id_front_base64,
      `csefest/verifications/${user.id}/front`
    );

    const backUpload = await uploadImage(
      parseResult.data.id_back_base64,
      `csefest/verifications/${user.id}/back`
    );

    // 4. Create database transaction (Manual multi-table mutations)
    // Insert/update verification record
    const { error: verifyError } = await supabase
      .from("student_verifications")
      .upsert({
        user_id: user.id,
        id_front_url: frontUpload.secure_url,
        id_back_url: backUpload.secure_url,
        status: "pending",
      });

    if (verifyError) {
      throw new Error(verifyError.message);
    }

    // Update profile status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw new Error(profileError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Student ID documents uploaded successfully. Verification status is now pending review.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Upload operation failed." },
      { status: 500 }
    );
  }
}
