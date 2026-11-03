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
  Target,
  DollarSign,
  Clock,
  BarChart3,
} from "lucide-react";

import { EnhancedCard, CardHeader, StatCard, MetricCard } from "@/components/ui/enhanced-card";
import { StatusBadge, BudgetBadge, LeadScoreBadge, TimelineBadge } from "@/components/ui/status-badge";

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
  preferred_locality: string;
  timeline_months: number | null;
}

export default async function DashboardPage() {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let leadsCount = 10;
  let qualifiedCount = 4;
  let visitsCount = 2;
  let projectsCount = 2;
  let wonCount = 0;
  let pipelineValue = 0;
  let recentLeads: LeadRow[] = [];

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();

      const [leadsRes, visitsRes, projectsRes, recentRes, qualRes, wonRes] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("visits").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(6),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage", "qualified"),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage", "won"),
      ]);

      leadsCount = leadsRes.count ?? 0;
      visitsCount = visitsRes.count ?? 0;
      projectsCount = projectsRes.count ?? 0;
      qualifiedCount = qualRes.count ?? 0;
      wonCount = wonRes.count ?? 0;
      recentLeads = (recentRes.data as unknown as LeadRow[]) ?? [];

      // Calculate pipeline value
      const { data: allLeads } = await supabase.from("leads").select("budget_min");
      if (allLeads) {
        pipelineValue = allLeads.reduce((sum: number, lead: any) => sum + (lead.budget_min || 0), 0);
      }
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
        preferred_locality: "Kolar Road",
        timeline_months: 1,
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
        preferred_locality: "Hoshangabad Road",
        timeline_months: 1,
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
        preferred_locality: "Airport Road",
        timeline_months: 6,
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
        preferred_locality: "Kolar Road",
        timeline_months: 2,
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
        preferred_locality: "Bhojpal",
        timeline_months: 1,
      },
    ];
    
    pipelineValue = 20000000; // ₹2Cr for demo
  }

  // Calculate conversion rate
  const conversionRate = leadsCount > 0 ? Math.round((wonCount / leadsCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner - Modern */}
      <EnhancedCard className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
              <Sparkles className="h-4 w-4 text-white" />
              <span>RealtyPilot CRM Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Bhopal Real Estate CRM
            </h1>
            <p className="text-white/80 max-w-xl text-sm md:text-base">
              Manage all leads, calls, and deals in one place. AI qualification and automated WhatsApp follow-ups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/leads"
              className="interactive-btn bg-white text-primary-600 hover:bg-white/90 font-semibold shadow-elevated flex items-center gap-2"
            >
              <span>View Pipeline</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/ai-config"
              className="interactive-btn bg-primary-400 text-white hover:bg-primary-300 font-semibold border border-white/30"
            >
              AI Configuration
            </Link>
          </div>
        </div>
      </EnhancedCard>

      {/* KPI Metrics Grid - Modern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={leadsCount}
          change="+10 this week"
          icon={<Users className="h-6 w-6" />}
          color="primary"
        />
        
        <StatCard
          title="Site Visits"
          value={visitsCount}
          change="3 scheduled"
          icon={<CalendarCheck className="h-6 w-6" />}
          color="secondary"
        />
        
        <StatCard
          title="Pipeline Value"
          value={`₹${(pipelineValue / 10000000).toFixed(1)}Cr`}
          change="+8% growth"
          icon={<DollarSign className="h-6 w-6" />}
          color="accent"
        />
        
        <StatCard
          title="Success Rate"
          value={`${conversionRate}%`}
          change="+3% last month"
          icon={<Target className="h-6 w-6" />}
          color="success"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Projects */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <EnhancedCard>
            <CardHeader
              title="Performance Metrics"
              description="This month's performance"
            />
            <div className="space-y-4">
              <MetricCard
                title="Lead Qualification Rate"
                value={`${qualifiedCount}/${leadsCount}`}
                progress={leadsCount > 0 ? Math.round((qualifiedCount / leadsCount) * 100) : 0}
                trend="up"
              />
              <MetricCard
                title="Visit to Deal Rate"
                value={`${wonCount}/${visitsCount}`}
                progress={visitsCount > 0 ? Math.round((wonCount / visitsCount) * 100) : 0}
                trend="neutral"
              />
              <MetricCard
                title="Response Time"
                value="2.4 hrs"
                target="4 hrs"
                progress={60}
                trend="up"
              />
            </div>
          </EnhancedCard>

          {/* Active Projects */}
          <EnhancedCard>
            <CardHeader
              title="Active Projects"
              description="Bhopal residential plots"
              action={<span className="text-xs font-semibold text-surface-600">RERA Approved</span>}
            />
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-50 border border-border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-surface-900">Narmada Greens</h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-surface-600">
                      <MapPin className="h-3 w-3" />
                      Kolar Road, Bhopal
                    </div>
                  </div>
                  <StatusBadge status="qualified" size="sm" showIcon={false} />
                </div>
                <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-surface-500">Price Range</div>
                    <div className="font-semibold text-surface-900">₹28L - ₹55L</div>
                  </div>
                  <div>
                    <div className="text-xs text-surface-500">Plots Available</div>
                    <div className="font-semibold text-surface-900">5</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-surface-50 border border-border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-surface-900">Bhojpal Enclave</h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-surface-600">
                      <MapPin className="h-3 w-3" />
                      Hoshangabad Road, Bhopal
                    </div>
                  </div>
                  <StatusBadge status="qualified" size="sm" showIcon={false} />
                </div>
                <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-surface-500">Price Range</div>
                    <div className="font-semibold text-surface-900">₹42L - ₹85L</div>
                  </div>
                  <div>
                    <div className="text-xs text-surface-500">Plots Available</div>
                    <div className="font-semibold text-surface-900">3</div>
                  </div>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Right Column: Recent Leads */}
        <div className="lg:col-span-2">
          <EnhancedCard>
            <CardHeader
              title="Recent Leads"
              description="Latest prospects for Bhopal residential plots"
              action={
                <Link
                  href="/dashboard/leads"
                  className="text-sm font-semibold text-secondary-600 hover:text-secondary-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />

            {recentLeads.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-border bg-surface-50 space-y-4">
                <div className="h-12 w-12 rounded-full bg-surface-100 text-surface-400 mx-auto flex items-center justify-center">
                  <Inbox className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold text-surface-800">No leads recorded yet</p>
                  <p className="text-sm text-surface-500 max-w-sm mx-auto">
                    Start by importing leads or creating your first lead manually.
                  </p>
                </div>
                <Link
                  href="/dashboard/leads"
                  className="interactive-btn bg-secondary-500 text-white hover:bg-secondary-600 inline-flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create First Lead</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="modern-table">
                  <thead>
                    <tr>
                      <th className="py-4">Lead Details</th>
                      <th className="py-4">Status</th>
                      <th className="py-4">Budget</th>
                      <th className="py-4">Score</th>
                      <th className="py-4">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.id} className="group hover:bg-surface-50">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
                              {lead.full_name}
                            </span>
                            <span className="text-xs text-surface-500 mt-1">
                              {lead.phone}
                            </span>
                            <span className="text-xs text-surface-400 mt-1">
                              {lead.preferred_locality}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <StatusBadge status={lead.stage as any} size="sm" />
                        </td>
                        <td className="py-4">
                          {lead.budget_min ? (
                            <BudgetBadge amount={lead.budget_min} size="sm" />
                          ) : (
                            <span className="text-sm text-surface-500">Not specified</span>
                          )}
                        </td>
                        <td className="py-4">
                          <LeadScoreBadge score={lead.score} size="sm" />
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            <TimelineBadge 
                              timeline={
                                lead.timeline_months === null ? "flexible" :
                                lead.timeline_months <= 1 ? "urgent" :
                                lead.timeline_months <= 3 ? "soon" :
                                "future"
                              } 
                              size="sm" 
                            />
                            <span className="text-xs text-surface-500">
                              {formatInIST(lead.created_at, "dd MMM, hh:mm a")}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </div>
              </div>
            )}
          </EnhancedCard>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <EnhancedCard className="p-4" hoverable={false}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-600">AI Qualified</div>
                  <div className="text-xl font-bold text-surface-900">{qualifiedCount}</div>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-4" hoverable={false}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-50 text-accent-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-600">Upcoming Visits</div>
                  <div className="text-xl font-bold text-surface-900">{visitsCount}</div>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard className="p-4" hoverable={false}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success-50 text-success-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-600">Deals Won</div>
                  <div className="text-xl font-bold text-surface-900">{wonCount}</div>
                </div>
              </div>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}
