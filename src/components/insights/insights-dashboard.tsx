"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame,
  Sun,
  Snowflake,
  TrendingUp,
  RotateCcw,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Users,
  Award,
} from "lucide-react";

export interface LeadInsightItem {
  id: string;
  full_name: string;
  phone: string;
  city: string | null;
  stage: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  budget_max: number | null;
  preferred_size_sqft: number | null;
  opted_out: boolean;
  needs_human_followup: boolean;
  nextBestAction: string;
  created_at: string;
}

export interface FunnelStageData {
  stage: string;
  label: string;
  count: number;
  percentage: number;
}

interface InsightsDashboardProps {
  leads: LeadInsightItem[];
  funnelData: FunnelStageData[];
  hotCount: number;
  warmCount: number;
  coldCount: number;
  avgScore: number;
}

export function InsightsDashboard({
  leads,
  funnelData,
  hotCount,
  warmCount,
  coldCount,
  avgScore,
}: InsightsDashboardProps) {
  const [selectedTier, setSelectedTier] = useState<"all" | "hot" | "warm" | "cold">("hot");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState<string | null>(null);
  const [recalcError, setRecalcError] = useState<string | null>(null);

  const filteredLeads = leads.filter((l) => {
    if (selectedTier === "all") return true;
    return l.tier === selectedTier;
  });

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setRecalcSuccess(null);
    setRecalcError(null);
    try {
      const res = await fetch("/api/leads/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: false }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecalcSuccess(`Recalculated scores for ${data.recalculated_count} leads successfully!`);
        setTimeout(() => setRecalcSuccess(null), 4000);
      } else {
        setRecalcError(data.error || "Failed to recalculate lead scores.");
        setTimeout(() => setRecalcError(null), 5000);
      }
    } catch {
      setRecalcError("Network error while connecting to lead scoring engine.");
      setTimeout(() => setRecalcError(null), 5000);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Recalculate Toast / Error Banners */}
      {recalcSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{recalcSuccess}</span>
        </div>
      )}

      {recalcError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{recalcError}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Avg Score */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Lead Score</span>
            <Award className="h-4 w-4 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {avgScore} <span className="text-xs text-slate-400 font-sans">/ 100</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Based on {leads.length} active leads in CRM
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-2 bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-bold uppercase tracking-wider">Hot Leads (80+)</span>
            <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-600">
            {hotCount}
          </div>
          <div className="text-xs text-rose-700/80 font-medium">
            High intent &bull; Immediate closure focus
          </div>
        </div>

        {/* Warm Leads */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm space-y-2 bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold uppercase tracking-wider">Warm Leads (50-79)</span>
            <Sun className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-600">
            {warmCount}
          </div>
          <div className="text-xs text-amber-700/80 font-medium">
            Needs site visit / follow-up nudge
          </div>
        </div>

        {/* Cold Leads */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cold Leads (&lt;50)</span>
            <Snowflake className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-700">
            {coldCount}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Nurturing via WhatsApp automation
          </div>
        </div>
      </div>

      {/* Conversion Funnel Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              Bhopal Pipeline Conversion Funnel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stage progression from new buyer inquiry to deed closure
            </p>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRecalculating ? "animate-spin text-brand-600" : ""}`} />
            <span>{isRecalculating ? "Recalculating..." : "Recalculate All Scores"}</span>
          </button>
        </div>

        {/* Funnel Stage Horizontal Bars */}
        <div className="space-y-3">
          {funnelData.map((f) => (
            <div key={f.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{f.label}</span>
                <span className="font-mono text-slate-500 font-medium">
                  {f.count} leads ({f.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(4, f.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Action Queue & Priority Tier Filter */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header & Tier Switcher */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              Lead Priority Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by purchase readiness, budget alignment, and urgency
            </p>
          </div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit text-xs">
            <button
              onClick={() => setSelectedTier("hot")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                selectedTier === "hot"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Hot ({hotCount})</span>
            </button>
            <button
              onClick={() => setSelectedTier("warm")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                selectedTier === "warm"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Warm ({warmCount})</span>
            </button>
            <button
              onClick={() => setSelectedTier("cold")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                selectedTier === "cold"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Snowflake className="h-3.5 w-3.5" />
              <span>Cold ({coldCount})</span>
            </button>
            <button
              onClick={() => setSelectedTier("all")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedTier === "all"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({leads.length})
            </button>
          </div>
        </div>

        {/* Priority Table */}
        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700">No leads in this tier</p>
              <p>Try switching to another tier filter above.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Buyer Name</th>
                  <th className="py-3 px-4">Score & Tier</th>
                  <th className="py-3 px-4">Budget / Size</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-6">Recommended Action</th>
                  <th className="py-3 px-6 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Phone */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {item.phone} &bull; {item.city || "Bhopal"}
                      </div>
                    </td>

                    {/* Score Badge */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-xl border ${
                            item.score >= 80
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : item.score >= 50
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {item.score}
                        </span>
                        {item.opted_out && (
                          <span
                            title="Opted out under DPDP Act"
                            className="text-red-500"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Budget & Plot size */}
                    <td className="py-4 px-4 font-medium">
                      <div>
                        {item.budget_max
                          ? `₹${(item.budget_max / 100000).toFixed(0)} Lakhs`
                          : "Budget TBD"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.preferred_size_sqft
                          ? `${item.preferred_size_sqft} sq.ft`
                          : "Size flexible"}
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full uppercase text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.stage.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Next Action */}
                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-slate-600 line-clamp-2 text-xs font-medium">
                        {item.nextBestAction}
                      </p>
                    </td>

                    {/* Action Links */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* WhatsApp Inbox CTA */}
                        <Link
                          href="/dashboard/inbox"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Open in WhatsApp Inbox"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Link>

                        {/* CRM Detail Link */}
                        <Link
                          href={`/dashboard/leads/${item.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
