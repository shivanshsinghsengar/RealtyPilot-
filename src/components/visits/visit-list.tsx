"use client";

import { useState } from "react";
import { VisitCard, VisitItem } from "@/components/visits/visit-card";
import { VisitBookingModal } from "@/components/visits/visit-booking-modal";
import { isTodayInIST } from "@/lib/utils/date";
import {
  Calendar,
  Filter,
  Search,
  RotateCcw,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Building,
} from "lucide-react";

interface VisitListProps {
  initialVisits: VisitItem[];
  leads: Array<{ id: string; full_name: string; phone: string; opted_out: boolean }>;
  projects: Array<{ id: string; name: string; location: string }>;
}

export function VisitList({ initialVisits, leads, projects }: VisitListProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "today" | "completed" | "all">("upcoming");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVisits = initialVisits.filter((v) => {
    // Project filter
    const matchesProject = projectFilter === "all" || v.project_id === projectFilter;

    // Search query
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      searchLower === "" ||
      v.lead.full_name.toLowerCase().includes(searchLower) ||
      v.lead.phone.includes(searchLower) ||
      v.project.name.toLowerCase().includes(searchLower);

    // Tab filter
    let matchesTab = true;
    const isToday = isTodayInIST(v.scheduled_at_utc);
    const isPast = new Date(v.scheduled_at_utc).getTime() < Date.now();

    if (activeTab === "today") {
      matchesTab = isToday;
    } else if (activeTab === "upcoming") {
      // Scheduled or confirmed and not completed/cancelled
      matchesTab =
        (v.status === "scheduled" || v.status === "confirmed" || v.status === "rescheduled") &&
        (!isPast || isToday);
    } else if (activeTab === "completed") {
      matchesTab = v.status === "completed";
    }

    return matchesProject && matchesSearch && matchesTab;
  });

  const clearFilters = () => {
    setActiveTab("upcoming");
    setProjectFilter("all");
    setSearchTerm("");
  };

  const todayCount = initialVisits.filter((v) => isTodayInIST(v.scheduled_at_utc)).length;
  const upcomingCount = initialVisits.filter(
    (v) =>
      (v.status === "scheduled" || v.status === "confirmed" || v.status === "rescheduled") &&
      new Date(v.scheduled_at_utc).getTime() >= Date.now() - 3600000
  ).length;
  const completedCount = initialVisits.filter((v) => v.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold w-full md:w-auto">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "upcoming"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-brand-600" />
            <span>Upcoming ({upcomingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("today")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "today"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            <span>Today ({todayCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Completed ({completedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>All ({initialVisits.length})</span>
          </button>
        </div>

        {/* Search & Project Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search buyer or project..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Project dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {(searchTerm !== "" || projectFilter !== "all" || activeTab !== "upcoming") && (
              <button
                onClick={clearFilters}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Visits */}
      {initialVisits.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Site Visits Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Book on-site appointments for buyers to explore residential plots and duplexes across Bhopal.
            </p>
          </div>
          <div className="pt-2">
            <VisitBookingModal leads={leads} projects={projects} />
          </div>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <p className="text-base font-bold text-slate-800">No visits match current filters</p>
          <p className="text-xs text-slate-500">
            Try switching tabs or clearing your project and search filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}
