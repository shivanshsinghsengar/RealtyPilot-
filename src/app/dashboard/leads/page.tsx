import { createClient } from "@/lib/supabase/server";
import { LeadItem } from "@/components/leads/lead-table";
import { LeadViewTabs } from "@/components/leads/lead-view-tabs";
import { LeadFormModal } from "@/components/leads/lead-form-modal";
import { CSVImportModal } from "@/components/leads/csv-import-modal";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let leads: LeadItem[] = [];

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, full_name, phone, email, city, budget_min, budget_max, preferred_size_sqft, stage, score, source, opted_out, needs_human_followup, created_at"
        )
        .order("created_at", { ascending: false });

      if (!error && data) {
        leads = data as unknown as LeadItem[];
      }
    } catch {
      // Handled via fallback
    }
  }

  // Fallback demo leads if in placeholder mode
  if (isPlaceholder && leads.length === 0) {
    leads = [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        full_name: "Rohit Sharma",
        phone: "+919826011111",
        email: "rohit.sharma@example.com",
        city: "Bhopal",
        budget_min: 2500000,
        budget_max: 3500000,
        preferred_size_sqft: 1000,
        stage: "qualified",
        score: 75,
        source: "website_form",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        full_name: "Priya Verma",
        phone: "+919826022222",
        email: "priya.verma@example.com",
        city: "Bhopal",
        budget_min: 3500000,
        budget_max: 5000000,
        preferred_size_sqft: 1500,
        stage: "visit_scheduled",
        score: 85,
        source: "meta_ad",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000003",
        full_name: "Amit Tiwari",
        phone: "+919826033333",
        email: "amit.tiwari@example.com",
        city: "Bhopal",
        budget_min: 4000000,
        budget_max: 6000000,
        preferred_size_sqft: 1800,
        stage: "contacted",
        score: 50,
        source: "google_places",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000004",
        full_name: "Neha Saxena",
        phone: "+919826044444",
        email: "neha.saxena@example.com",
        city: "Bhopal",
        budget_min: 6000000,
        budget_max: 8500000,
        preferred_size_sqft: 2400,
        stage: "visit_completed",
        score: 90,
        source: "referral",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000005",
        full_name: "Vikram Singh Patel",
        phone: "+919826055555",
        email: "vikram.patel@example.com",
        city: "Bhopal",
        budget_min: 2800000,
        budget_max: 4000000,
        preferred_size_sqft: 1200,
        stage: "negotiation",
        score: 95,
        source: "website_form",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000006",
        full_name: "Sunita Chouhan",
        phone: "+919826066666",
        email: "sunita.c@example.com",
        city: "Bhopal",
        budget_min: 3000000,
        budget_max: 4500000,
        preferred_size_sqft: 1200,
        stage: "new",
        score: 30,
        source: "rera_public",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000007",
        full_name: "Rajesh Mishra",
        phone: "+919826077777",
        email: "rajesh.mishra@example.com",
        city: "Bhopal",
        budget_min: 7000000,
        budget_max: 9000000,
        preferred_size_sqft: 2000,
        stage: "won",
        score: 100,
        source: "direct_call",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000008",
        full_name: "Deepak Malviya",
        phone: "+919826088888",
        email: "deepak.m@example.com",
        city: "Bhopal",
        budget_min: 2000000,
        budget_max: 2500000,
        preferred_size_sqft: 800,
        stage: "lost",
        score: 15,
        source: "meta_ad",
        opted_out: false,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000009",
        full_name: "Kavita Jain (Opted Out)",
        phone: "+919826099999",
        email: "kavita.jain@example.com",
        city: "Bhopal",
        budget_min: 3500000,
        budget_max: 5000000,
        preferred_size_sqft: 1500,
        stage: "contacted",
        score: 10,
        source: "website_form",
        opted_out: true,
        needs_human_followup: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000010",
        full_name: "Suresh Yadav (Special Request)",
        phone: "+919826012345",
        email: "suresh.yadav@example.com",
        city: "Bhopal",
        budget_min: 5000000,
        budget_max: 7500000,
        preferred_size_sqft: 2000,
        stage: "qualified",
        score: 70,
        source: "website_form",
        opted_out: false,
        needs_human_followup: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Leads & Pipeline Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track inquiries, update qualification stages, and coordinate plot sales across Bhopal projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImportModal />
          <LeadFormModal />
        </div>
      </div>

      {/* Main Content Tabs (Table & Kanban) */}
      <LeadViewTabs leads={leads} />
    </div>
  );
}
