import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public endpoint — cache for 2 minutes at the edge, revalidate in background
export const revalidate = 120;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  visible: boolean;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Query visible FAQs ordered by display_order
    const { data, error } = await supabase
      .from("faqs")
      .select("id, question, answer, display_order")
      .eq("visible", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: (data as FAQ[]) || [] },
      {
        headers: {
          // Cache at CDN edge for 2 min, serve stale while revalidating
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load FAQs.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
