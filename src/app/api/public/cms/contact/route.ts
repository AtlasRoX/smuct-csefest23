import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Query contact info coordinates
    const { data, error } = await supabase
      .from("contact_info")
      .select("*");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data && data.length > 0 ? data[0] : null,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load contact info.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
