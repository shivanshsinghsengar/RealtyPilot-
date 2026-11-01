"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, UserPlus, RotateCcw } from "lucide-react";

export interface LeadItem {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_size_sqft: number | null;
  stage: string;
  score: number;
  source: string;
  opted_out: boolean;
  needs_human_followup: boolean;
  created_at: string;
}

interface LeadTableProps {
  initialLeads: LeadItem[];
}

export function LeadTable({ initialLeads }: LeadTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filteredLeads = initialLeads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      searchLower === "" ||
      lead.full_name.toLowerCase().includes(searchLower) ||
      lead.phone.includes(searchLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower));

    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStageFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone (+91...) or email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Stages ({initialLeads.length})</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="visit_scheduled">Visit Scheduled</option>
            <option value="visit_completed">Visit Completed</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won (Deal Closed)</option>
            <option value="lost">Lost</option>
          </select>
          {(searchTerm !== "" || stageFilter !== "all") && (
            <button
              onClick={clearFilters}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset search & filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {initialLeads.length === 0 ? (
          /* Empty CRM State */
          <div className="py-16 px-4 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <UserPlus className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-slate-900">No leads registered yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by clicking the &ldquo;Add Lead&rdquo; button above to log a new plot buyer inquiry in Bhopal.
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          /* Filtered Out Empty State */
          <div className="py-12 px-4 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">No matching leads found</p>
            <p className="text-xs text-slate-400">
              No results for current search filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Lead Name & Phone</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Budget Range</th>
                  <th className="py-3 px-4">Plot Size</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">DPDP / Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lead.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{lead.phone}</span>
                        {lead.city && (
                          <span className="text-[10px] text-slate-400">({lead.city})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.stage.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {lead.budget_min && lead.budget_max
                        ? `₹${(lead.budget_min / 100000).toFixed(1)}L - ₹${(lead.budget_max / 100000).toFixed(1)}L`
                        : lead.budget_min
                        ? `₹${(lead.budget_min / 100000).toFixed(1)}L+`
                        : "Not specified"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {lead.preferred_size_sqft ? `${lead.preferred_size_sqft} sqft` : "Flexible"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          lead.score >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : lead.score >= 50
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {lead.score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {lead.opted_out ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert className="h-3 w-3" />
                            Opted Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Consented
                          </span>
                        )}
                        {lead.needs_human_followup && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            Human Needed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
