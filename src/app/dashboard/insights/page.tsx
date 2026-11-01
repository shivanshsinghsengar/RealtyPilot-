import { createClient } from "@/lib/supabase/server";
import { calculateLeadScore } from "@/lib/scoring/engine";
import { InsightsDashboard, LeadInsightItem, FunnelStageData } from "@/components/insights/insights-dashboard";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let leads: LeadInsightItem[] = [];
  const funnelCounts: Record<string, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    visit_scheduled: 0,
    visit_completed: 0,
    negotiation: 0,
    won: 0,
  };

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();

      const { data: rawLeads } = await supabase
        .from("leads")
        .select(`
          id,
          full_name,
          phone,
          city,
          stage,
          budget_min,
          budget_max,
          preferred_size_sqft,
          timeline_months,
          loan_needed,
          purpose,
          source,
          score,
          opted_out,
          needs_human_followup,
          created_at,
          visits (
            id,
            status
          )
        `)
        .order("score", { ascending: false });

      if (rawLeads) {
        leads = (rawLeads as any[]).map((l) => {
          const visits = l.visits || [];
          const hasScheduledVisit = visits.some((v: any) => v.status === "scheduled");
          const hasCompletedVisit = visits.some((v: any) => v.status === "completed");
          const hasCancelledVisit = visits.some((v: any) => v.status === "cancelled" || v.status === "no_show");

          const scoreRes = calculateLeadScore(l, {
            siteVisitsCount: visits.length,
            hasScheduledVisit,
            hasCompletedVisit,
            hasCancelledVisit,
          });

          // Tally funnel stage
          if (funnelCounts[l.stage] !== undefined) {
            funnelCounts[l.stage]++;
          }

          return {
            id: l.id,
            full_name: l.full_name,
            phone: l.phone,
            city: l.city,
            stage: l.stage,
            score: scoreRes.score,
            tier: scoreRes.tier,
            budget_max: l.budget_max,
            preferred_size_sqft: l.preferred_size_sqft,
            opted_out: l.opted_out,
            needs_human_followup: l.needs_human_followup,
            nextBestAction: scoreRes.nextBestAction,
            created_at: l.created_at,
          };
        });
      }
    } catch {
      // Fallback handled below
    }
  }

  // Fallback demo data in placeholder mode
  if (isPlaceholder && leads.length === 0) {
    const demoLeads = [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        full_name: "Rohit Sharma",
        phone: "+919826011111",
        city: "Bhopal",
        stage: "qualified",
        budget_min: 2500000,
        budget_max: 3500000,
        preferred_size_sqft: 1000,
        timeline_months: 1,
        loan_needed: false,
        purpose: "end_use" as const,
        source: "website_form" as const,
        score: 85,
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        full_name: "Priya Verma",
        phone: "+919826022222",
        city: "Bhopal",
        stage: "visit_scheduled",
        budget_min: 3500000,
        budget_max: 5000000,
        preferred_size_sqft: 1500,
        timeline_months: 2,
        loan_needed: true,
        purpose: "end_use" as const,
        source: "direct_call" as const,
        score: 90,
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000003",
        full_name: "Amitabh Patel",
        phone: "+919826033333",
        city: "Indore",
        stage: "contacted",
        budget_min: 5000000,
        budget_max: 6500000,
        preferred_size_sqft: 2400,
        timeline_months: 6,
        loan_needed: false,
        purpose: "investment" as const,
        source: "website_form" as const,
        score: 65,
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000004",
        full_name: "Sunil Agrawal",
        phone: "+919826044444",
        city: "Bhopal",
        stage: "new",
        budget_min: null,
        budget_max: null,
        preferred_size_sqft: null,
        timeline_months: null,
        loan_needed: null,
        purpose: null,
        source: "walk_in" as const,
        score: 35,
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000009",
        full_name: "Kavita Jain (Opted Out)",
        phone: "+919826099999",
        city: "Bhopal",
        stage: "contacted",
        budget_min: 3000000,
        budget_max: 4500000,
        preferred_size_sqft: 1500,
        timeline_months: 3,
        loan_needed: true,
        purpose: "end_use" as const,
        source: "direct_call" as const,
        score: 20,
        opted_out: true,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
    ];

    leads = demoLeads.map((l) => {
      const scoreRes = calculateLeadScore(l, {
        hasScheduledVisit: l.stage === "visit_scheduled",
        hasCompletedVisit: false,
      });

      if (funnelCounts[l.stage] !== undefined) {
        funnelCounts[l.stage]++;
      }

      return {
        id: l.id,
        full_name: l.full_name,
        phone: l.phone,
        city: l.city,
        stage: l.stage,
        score: scoreRes.score,
        tier: scoreRes.tier,
        budget_max: l.budget_max,
        preferred_size_sqft: l.preferred_size_sqft,
        opted_out: l.opted_out,
        needs_human_followup: l.needs_human_followup,
        nextBestAction: scoreRes.nextBestAction,
        created_at: l.created_at,
      };
    });
  }

  // Sort by score descending
  leads.sort((a, b) => b.score - a.score);

  const hotCount = leads.filter((l) => l.tier === "hot").length;
  const warmCount = leads.filter((l) => l.tier === "warm").length;
  const coldCount = leads.filter((l) => l.tier === "cold").length;
  const avgScore =
    leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
      : 0;

  const totalFunnelLeads = Math.max(1, leads.length);
  const funnelData: FunnelStageData[] = [
    {
      stage: "new",
      label: "1. Inbound Leads Received",
      count: funnelCounts.new + funnelCounts.contacted + funnelCounts.qualified + funnelCounts.visit_scheduled + funnelCounts.visit_completed + funnelCounts.negotiation + funnelCounts.won,
      percentage: 100,
    },
    {
      stage: "qualified",
      label: "2. Qualified (Budget & Plot Size Defined)",
      count: funnelCounts.qualified + funnelCounts.visit_scheduled + funnelCounts.visit_completed + funnelCounts.negotiation + funnelCounts.won,
      percentage: Math.round(((funnelCounts.qualified + funnelCounts.visit_scheduled + funnelCounts.visit_completed + funnelCounts.negotiation + funnelCounts.won) / totalFunnelLeads) * 100),
    },
    {
      stage: "visit_scheduled",
      label: "3. Site Visit Booked / Visited",
      count: funnelCounts.visit_scheduled + funnelCounts.visit_completed + funnelCounts.negotiation + funnelCounts.won,
      percentage: Math.round(((funnelCounts.visit_scheduled + funnelCounts.visit_completed + funnelCounts.negotiation + funnelCounts.won) / totalFunnelLeads) * 100),
    },
    {
      stage: "negotiation",
      label: "4. Token & Commercial Negotiation",
      count: funnelCounts.negotiation + funnelCounts.won,
      percentage: Math.round(((funnelCounts.negotiation + funnelCounts.won) / totalFunnelLeads) * 100),
    },
    {
      stage: "won",
      label: "5. Closed & Registry Executed",
      count: funnelCounts.won,
      percentage: Math.round((funnelCounts.won / totalFunnelLeads) * 100),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Lead Scoring & Qualification Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Algorithmic lead health evaluation, conversion funnel analytics, and AI action recommendations
          </p>
        </div>
      </div>

      {/* Main Dashboard Component */}
      <InsightsDashboard
        leads={leads}
        funnelData={funnelData}
        hotCount={hotCount}
        warmCount={warmCount}
        coldCount={coldCount}
        avgScore={avgScore}
      />
    </div>
  );
}
