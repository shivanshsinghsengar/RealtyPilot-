import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { LeadDetailHeader } from "@/components/leads/lead-detail-header";
import { LeadNotesTimeline, ActivityItem } from "@/components/leads/lead-notes-timeline";
import { ScoreBreakdownCard } from "@/components/insights/score-breakdown-card";
import { calculateLeadScore } from "@/lib/scoring/engine";
import { formatInIST } from "@/lib/utils/date";
import { Database } from "@/types/database.types";
import {
  IndianRupee,
  Maximize2,
  Calendar,
  Home,
  CreditCard,
  ShieldCheck,
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ConsentRow = Database["public"]["Tables"]["consents"]["Row"];

const uuidParamSchema = z.string().uuid();

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = params;

  // Strict URL UUID validation: immediately 404 on malformed IDs
  const idValidation = uuidParamSchema.safeParse(id);
  if (!idValidation.success) {
    notFound();
  }

  const validId = idValidation.data;

  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let lead: LeadRow | null = null;
  let activities: ActivityItem[] = [];
  let consent: ConsentRow | null = null;
  let hasDatabaseError = false;

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();

      const [leadRes, actRes, consentRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", validId).maybeSingle(),
        supabase
          .from("activities")
          .select("id, activity_type, description, metadata, created_at")
          .eq("lead_id", validId)
          .order("created_at", { ascending: false }),
        supabase.from("consents").select("*").eq("lead_id", validId).maybeSingle(),
      ]);

      if (leadRes.error) {
        hasDatabaseError = true;
      } else {
        lead = leadRes.data as LeadRow | null;
      }

      if (!actRes.error && actRes.data) {
        activities = actRes.data as unknown as ActivityItem[];
      }

      if (!consentRes.error && consentRes.data) {
        consent = consentRes.data as ConsentRow | null;
      }
    } catch {
      hasDatabaseError = true;
    }
  }

  // Fallback demo lead in placeholder mode
  if (!lead && isPlaceholder) {
    lead = {
      id: validId,
      full_name: "Rohit Sharma",
      phone: "+919826011111",
      email: "rohit.sharma@example.com",
      city: "Bhopal",
      budget_min: 2500000,
      budget_max: 3500000,
      preferred_size_sqft: 1000,
      timeline_months: 1,
      loan_needed: true,
      purpose: "end_use",
      stage: "qualified",
      score: 75,
      source: "website_form",
      opted_out: false,
      needs_human_followup: false,
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    activities = [
      {
        id: "f1000000-0000-0000-0000-000000000001",
        activity_type: "lead_created",
        description: "Lead submitted enquiry form for Narmada Greens (Kolar Road).",
        metadata: { source: "website_form", city: "Bhopal" },
        created_at: new Date().toISOString(),
      },
      {
        id: "f1000000-0000-0000-0000-000000000002",
        activity_type: "staff_note",
        description: "Called lead. Looking for 1000 sqft East facing plot within 1 month. Bank loan required.",
        metadata: { channel: "crm_note" },
        created_at: new Date().toISOString(),
      },
    ];

    consent = {
      id: "e1000000-0000-0000-0000-000000000001",
      lead_id: validId,
      status: "granted",
      channel: "whatsapp",
      consent_text: "Opted-in via website enquiry form checkbox for WhatsApp updates.",
      recorded_ip: "103.24.120.15",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (hasDatabaseError && !lead) {
    throw new Error("Unable to retrieve lead details from database. Please check connection and retry.");
  }

  if (!lead) {
    notFound();
  }

  const scoreResult = calculateLeadScore(lead, {
    hasScheduledVisit: lead.stage === "visit_scheduled",
    hasCompletedVisit:
      lead.stage === "visit_completed" ||
      lead.stage === "negotiation" ||
      lead.stage === "won",
  });

  return (
    <div className="space-y-8">
      {/* Lead Header */}
      <LeadDetailHeader lead={lead} />

      {/* Grid: Preferences + Notes/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Lead Health & Property Preferences & DPDP Compliance (1 col) */}
        <div className="space-y-6">
          {/* Dynamic Lead Score & Action Card */}
          <ScoreBreakdownCard scoreResult={scoreResult} isOptedOut={lead.opted_out} />

          {/* Property Requirement Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-5 w-5 text-brand-600" />
              Plot & Property Preferences
            </h2>

            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Budget */}
              <div className="flex items-start justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-slate-400" /> Budget Range
                </span>
                <span className="font-bold text-slate-900 text-right">
                  {lead.budget_min && lead.budget_max
                    ? `₹${(lead.budget_min / 100000).toFixed(1)}L - ₹${(lead.budget_max / 100000).toFixed(1)}L`
                    : lead.budget_min
                    ? `₹${(lead.budget_min / 100000).toFixed(1)}L+`
                    : "Not specified"}
                </span>
              </div>

              {/* Plot Size */}
              <div className="flex items-start justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Maximize2 className="h-4 w-4 text-slate-400" /> Preferred Size
                </span>
                <span className="font-bold text-slate-900">
                  {lead.preferred_size_sqft ? `${lead.preferred_size_sqft} sq. ft.` : "Flexible"}
                </span>
              </div>

              {/* Purchase Timeline */}
              <div className="flex items-start justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" /> Target Timeline
                </span>
                <span className="font-bold text-slate-900">
                  {lead.timeline_months
                    ? `Within ${lead.timeline_months} month${lead.timeline_months > 1 ? "s" : ""}`
                    : "Immediate / Undecided"}
                </span>
              </div>

              {/* Purpose */}
              <div className="flex items-start justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-slate-400" /> Purchase Purpose
                </span>
                <span className="font-bold text-slate-900 capitalize">
                  {lead.purpose === "end_use" ? "End Use (Self Residence)" : "Investment"}
                </span>
              </div>

              {/* Loan Needed */}
              <div className="flex items-start justify-between py-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-slate-400" /> Loan Assistance
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    lead.loan_needed
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {lead.loan_needed ? "Loan Required" : "Self Funded"}
                </span>
              </div>
            </div>
          </div>

          {/* DPDP Act Compliance Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              DPDP Act Compliance Record
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Consent Status</span>
                <span
                  className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                    lead.opted_out
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {lead.opted_out ? "REVOKED / OPTED OUT" : "GRANTED"}
                </span>
              </div>

              <div className="py-1.5 border-b border-slate-100 space-y-1">
                <span className="text-slate-500 block">Consent Notice / Text:</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded-lg leading-relaxed text-[11px]">
                  {consent?.consent_text || "Recorded via website opt-in inquiry form."}
                </p>
              </div>

              {consent?.recorded_ip && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Audit IP:</span>
                  <span className="font-mono text-slate-700">{consent.recorded_ip}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 text-slate-400">
                <span>First Ingested:</span>
                <span className="font-mono">
                  {formatInIST(lead.created_at, "dd MMM yyyy, hh:mm a")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notes & Activity Audit Log (2 cols) */}
        <div className="lg:col-span-2">
          <LeadNotesTimeline leadId={lead.id} initialActivities={activities} />
        </div>
      </div>
    </div>
  );
}
