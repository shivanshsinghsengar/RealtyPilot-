import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLeadScore } from "@/lib/scoring/engine";
import { scoreRecalculateSchema } from "@/lib/validations/scoring";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Authorization check: either valid CRON_SECRET header or active staff session
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(expectedSecret) &&
    (authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret);

  let isStaffAuthorized = false;
  try {
    const staffClient = await createClient();
    const {
      data: { user },
    } = await staffClient.auth.getUser();
    if (user) isStaffAuthorized = true;
  } catch {
    // Handled below
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // In production, unauthenticated calls are strictly rejected with 401
  if (isProduction && !isCronAuthorized && !isStaffAuthorized && !isPlaceholder) {
    return NextResponse.json(
      { error: "Unauthorized. Staff authentication or valid cron secret required." },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const validation = scoreRecalculateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid scoring parameters.", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { lead_id, dry_run } = validation.data;

  if (isPlaceholder) {
    return NextResponse.json({
      success: true,
      mode: "simulated_placeholder",
      recalculated_count: lead_id ? 1 : 12,
      dry_run,
      tier_summary: {
        hot: 4,
        warm: 6,
        cold: 2,
      },
    });
  }

  const supabase = createAdminClient();

  try {
    let query = supabase.from("leads").select(`
      id,
      full_name,
      stage,
      budget_min,
      budget_max,
      preferred_size_sqft,
      timeline_months,
      loan_needed,
      purpose,
      source,
      opted_out,
      needs_human_followup,
      visits (
        id,
        status
      )
    `);

    if (lead_id) {
      query = query.eq("id", lead_id);
    }

    const { data: rawLeads, error } = await query;

    if (error || !rawLeads) {
      return NextResponse.json({ error: error?.message || "Failed to fetch leads" }, { status: 500 });
    }

    let updatedCount = 0;
    const tierSummary = { hot: 0, warm: 0, cold: 0 };

    for (const rawLead of rawLeads as any[]) {
      const visits = rawLead.visits || [];
      const hasScheduledVisit = visits.some((v: any) => v.status === "scheduled");
      const hasCompletedVisit = visits.some((v: any) => v.status === "completed");
      const hasCancelledVisit = visits.some((v: any) => v.status === "cancelled" || v.status === "no_show");

      const scoreResult = calculateLeadScore(rawLead, {
        siteVisitsCount: visits.length,
        hasScheduledVisit,
        hasCompletedVisit,
        hasCancelledVisit,
      });

      tierSummary[scoreResult.tier]++;

      if (!dry_run) {
        await supabase
          .from("leads")
          // @ts-expect-error Supabase admin client typing helper
          .update({
            score: scoreResult.score,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rawLead.id);

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      recalculated_count: updatedCount,
      dry_run,
      tier_summary: tierSummary,
    });
  } catch (error) {
    console.error("Score recalculation API error:", error);
    return NextResponse.json({ error: "Score calculation exception" }, { status: 500 });
  }
}
