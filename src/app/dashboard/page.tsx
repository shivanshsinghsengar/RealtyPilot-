import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatInIST } from "@/lib/utils/date";
import {
  Users,
  CalendarCheck,
  Building2,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Inbox,
  PlusCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  full_name: string;
  phone: string;
  budget_min: number | null;
  budget_max: number | null;
  stage: string;
  score: number;
  source: string;
  created_at: string;
}

export default async function DashboardPage() {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let leadsCount = 10;
  let qualifiedCount = 4;
  let visitsCount = 2;
  let projectsCount = 2;
  let recentLeads: LeadRow[] = [];

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();

      const [leadsRes, visitsRes, projectsRes, recentRes, qualRes] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("visits").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage", "qualified"),
      ]);

      leadsCount = leadsRes.count ?? 0;
      visitsCount = visitsRes.count ?? 0;
      projectsCount = projectsRes.count ?? 0;
      qualifiedCount = qualRes.count ?? 0;
      recentLeads = (recentRes.data as unknown as LeadRow[]) ?? [];
    } catch {
      // Fallback to baseline default counts
    }
  }

  // Fallback demo leads if in placeholder preview mode
  if (isPlaceholder && recentLeads.length === 0) {
    recentLeads = [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        full_name: "Rohit Sharma",
        phone: "+919826011111",
        budget_min: 2500000,
        budget_max: 3500000,
        stage: "qualified",
        score: 75,
        source: "website_form",
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        full_name: "Priya Verma",
        phone: "+919826022222",
        budget_min: 3500000,
        budget_max: 5000000,
        stage: "visit_scheduled",
        score: 85,
        source: "meta_ad",
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000003",
        full_name: "Amit Tiwari",
        phone: "+919826033333",
        budget_min: 4000000,
        budget_max: 6000000,
        stage: "contacted",
        score: 50,
        source: "google_places",
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000005",
        full_name: "Vikram Singh Patel",
        phone: "+919826055555",
        budget_min: 2800000,
        budget_max: 4000000,
        stage: "negotiation",
        score: 95,
        source: "website_form",
        created_at: new Date().toISOString(),
      },
      {
        id: "c1000000-0000-0000-0000-000000000007",
        full_name: "Rajesh Mishra",
        phone: "+919826077777",
        budget_min: 7000000,
        budget_max: 9000000,
        stage: "won",
        score: 100,
        source: "direct_call",
        created_at: new Date().toISOString(),
      },
    ];
  }

  const kpis = [
    {
      label: "Total CRM Leads",
      value: leadsCount,
      icon: Users,
      trend: "+10 this week",
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Site Visits Booked",
      value: visitsCount,
      icon: CalendarCheck,
      trend: "Kolar & Hoshangabad Rd",
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      label: "Active Bhopal Projects",
      value: projectsCount,
      icon: Building2,
      trend: "RERA Registered",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "AI Qualified Leads",
      value: qualifiedCount,
      icon: TrendingUp,
      trend: "High Intent",
      color: "text-brand-600 bg-brand-50 border-brand-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>RealtyPilot Live Dashboard &bull; Phase 2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bhopal Real Estate Sales Hub
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Real-time pipeline monitoring, site visit coordination, and WhatsApp AI qualification for residential plots and duplexes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/leads"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-600/30 flex items-center gap-2"
          >
            <span>View Pipeline</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/visits"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all border border-slate-700"
          >
            Schedule Visit
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-start justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {kpi.trend}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Two Column Layout: Projects + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bhopal Projects Inventory Snapshot (1 col) */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-600" />
              Active Projects
            </h2>
            <span className="text-xs font-semibold text-slate-400">Bhopal, M.P.</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Project 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Narmada Greens</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" /> Kolar Road
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RERA APPROVED
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                RERA: P-BPL-22-3841
              </p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Price Range</span>
                <span className="font-bold text-slate-800">₹28L - ₹55L</span>
              </div>
            </div>

            {/* Project 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Bhojpal Enclave</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" /> Hoshangabad Road
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RERA APPROVED
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                RERA: P-BPL-23-4190
              </p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Price Range</span>
                <span className="font-bold text-slate-800">₹42L - ₹85L</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Recent Inbound Leads (2 cols) */}
        <section className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Lead Inquiries
              </h2>
              <p className="text-xs text-slate-500">
                Latest prospects for Bhopal residential plots
              </p>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All Leads</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">No leads recorded yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Run <code className="font-mono text-brand-700">npm run db:seed</code> or submit your first lead form to populate the CRM.
                </p>
              </div>
              <Link
                href="/dashboard/leads"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create First Lead</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Lead Name</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Budget Range</th>
                    <th className="py-3 px-4">Lead Score</th>
                    <th className="py-3 px-4">Created (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{lead.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {lead.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.stage?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {lead.budget_min && lead.budget_max
                          ? `₹${(lead.budget_min / 100000).toFixed(1)}L - ₹${(lead.budget_max / 100000).toFixed(1)}L`
                          : "Not specified"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            lead.score >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : lead.score >= 50
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lead.score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatInIST(lead.created_at, "dd MMM, hh:mm a")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
