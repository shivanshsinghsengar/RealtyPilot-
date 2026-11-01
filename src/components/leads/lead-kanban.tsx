"use client";

import { useState } from "react";
import Link from "next/link";
import { updateLeadStageAction } from "@/app/dashboard/leads/actions";
import { LeadItem } from "@/components/leads/lead-table";
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

interface LeadKanbanProps {
  initialLeads: LeadItem[];
}

const KANBAN_STAGES = [
  { key: "new", label: "New Leads", color: "border-slate-300 bg-slate-50 text-slate-700" },
  { key: "contacted", label: "Contacted", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { key: "qualified", label: "Qualified", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { key: "visit_scheduled", label: "Visit Scheduled", color: "border-purple-300 bg-purple-50 text-purple-700" },
  { key: "visit_completed", label: "Visit Done", color: "border-indigo-300 bg-indigo-50 text-indigo-700" },
  { key: "negotiation", label: "Negotiation", color: "border-amber-300 bg-amber-50 text-amber-700" },
];

export function LeadKanban({ initialLeads }: LeadKanbanProps) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMoveStage = async (leadId: string, currentStage: string, direction: "next" | "prev") => {
    const currentIndex = KANBAN_STAGES.findIndex((s) => s.key === currentStage);
    if (currentIndex === -1) return;

    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= KANBAN_STAGES.length) return;

    const targetStage = KANBAN_STAGES[targetIndex].key;
    setErrorMessage(null);

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage: targetStage } : lead))
    );

    setIsUpdating(leadId);
    try {
      const res = await updateLeadStageAction(leadId, targetStage);
      if (!res.success) {
        // Rollback optimistic update on failure
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, stage: currentStage } : lead))
        );
        setErrorMessage(res.error || "Failed to update lead stage. Reverted changes.");
      }
    } catch {
      // Rollback on network exception
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, stage: currentStage } : lead))
      );
      setErrorMessage("Network error updating stage. Please check your connection.");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {KANBAN_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.key);

          return (
            <div
              key={stage.key}
              className="flex-shrink-0 w-72 bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full border ${stage.color}`} />
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                    {stage.label}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200">
                  {stageLeads.length}
                </span>
              </div>

              {/* Column Body / Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-white/40">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2.5"
                    >
                      {/* Top Row: Name + Score */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="font-bold text-slate-900 text-xs sm:text-sm hover:text-brand-600 hover:underline leading-snug"
                        >
                          {lead.full_name}
                        </Link>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            lead.score >= 80
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : lead.score >= 50
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lead.score}
                        </span>
                      </div>

                      {/* Phone & Budget */}
                      <div className="text-xs text-slate-500 font-mono">
                        {lead.phone}
                      </div>

                      <div className="text-xs text-slate-700 font-medium">
                        {lead.budget_min && lead.budget_max
                          ? `₹${(lead.budget_min / 100000).toFixed(1)}L - ₹${(lead.budget_max / 100000).toFixed(1)}L`
                          : "Budget flexible"}
                      </div>

                      {/* Flags */}
                      <div className="flex flex-wrap gap-1">
                        {lead.opted_out && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert className="h-2.5 w-2.5" /> Opted Out
                          </span>
                        )}
                        {lead.needs_human_followup && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-2.5 w-2.5" /> Human Needed
                          </span>
                        )}
                      </div>

                      {/* Stage Mover Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleMoveStage(lead.id, lead.stage, "prev")}
                          disabled={isUpdating === lead.id || stage.key === "new"}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition-colors"
                          title="Move to previous stage"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
                        >
                          Details &rarr;
                        </Link>

                        <button
                          onClick={() => handleMoveStage(lead.id, lead.stage, "next")}
                          disabled={isUpdating === lead.id || stage.key === "negotiation"}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition-colors"
                          title="Advance to next stage"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
