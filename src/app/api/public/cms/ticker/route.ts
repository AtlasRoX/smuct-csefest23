import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Query active news ticker messages
    const { data, error } = await supabase
      .from("ticker_items")
      .select("*")
      .eq("active", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load news ticker.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
