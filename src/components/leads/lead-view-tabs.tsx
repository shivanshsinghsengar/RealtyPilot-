"use client";

import { useState } from "react";
import { LeadTable, LeadItem } from "@/components/leads/lead-table";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { Table, Kanban } from "lucide-react";

interface LeadViewTabsProps {
  leads: LeadItem[];
}

export function LeadViewTabs({ leads }: LeadViewTabsProps) {
  const [activeTab, setActiveTab] = useState<"table" | "kanban">("table");

  return (
    <div className="space-y-4">
      {/* View Switcher Pill */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 rounded-xl bg-slate-200/80 border border-slate-300/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "table"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Table List ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "kanban"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Kanban Pipeline</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === "table" ? (
        <LeadTable initialLeads={leads} />
      ) : (
        <LeadKanban initialLeads={leads} />
      )}
    </div>
  );
}
