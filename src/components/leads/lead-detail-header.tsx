"use client";

import { useState } from "react";
import Link from "next/link";
import { updateLeadStageAction, toggleLeadOptOutAction, toggleHumanFollowupAction } from "@/app/dashboard/leads/actions";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";

interface LeadDetailHeaderProps {
  lead: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    city: string | null;
    stage: string;
    score: number;
    opted_out: boolean;
    needs_human_followup: boolean;
    source: string;
  };
}

const STAGES = [
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "visit_scheduled", label: "Visit Scheduled" },
  { value: "visit_completed", label: "Visit Completed" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won (Deal Closed)" },
  { value: "lost", label: "Lost" },
];

export function LeadDetailHeader({ lead }: LeadDetailHeaderProps) {
  const [stage, setStage] = useState(lead.stage);
  const [optedOut, setOptedOut] = useState(lead.opted_out);
  const [needsFollowup, setNeedsFollowup] = useState(lead.needs_human_followup);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStageChange = async (newStage: string) => {
    const prevStage = stage;
    setStage(newStage);
    setIsUpdating(true);
    setActionError(null);

    const res = await updateLeadStageAction(lead.id, newStage);
    if (!res.success) {
      setStage(prevStage);
      setActionError(res.error || "Failed to update pipeline stage.");
    }
    setIsUpdating(false);
  };

  const handleOptOutToggle = async () => {
    const prevVal = optedOut;
    const nextVal = !optedOut;
    setOptedOut(nextVal);
    setActionError(null);

    const res = await toggleLeadOptOutAction(lead.id, nextVal);
    if (!res.success) {
      setOptedOut(prevVal);
      setActionError(res.error || "Failed to update DPDP opt-out status.");
    }
  };

  const handleFollowupToggle = async () => {
    const prevVal = needsFollowup;
    const nextVal = !needsFollowup;
    setNeedsFollowup(nextVal);
    setActionError(null);

    const res = await toggleHumanFollowupAction(lead.id, nextVal);
    if (!res.success) {
      setNeedsFollowup(prevVal);
      setActionError(res.error || "Failed to update follow-up flag.");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-bold underline text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Leads</span>
        </Link>

        {/* Quick Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stage Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Pipeline Stage:</span>
            <select
              value={stage}
              onChange={(e) => handleStageChange(e.target.value)}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Follow-up Flag Toggle */}
          <button
            onClick={handleFollowupToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              needsFollowup
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{needsFollowup ? "Human Follow-up Required" : "Flag for Follow-up"}</span>
          </button>

          {/* Opt-out Toggle (DPDP Compliance) */}
          <button
            onClick={handleOptOutToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              optedOut
                ? "bg-red-50 text-red-700 border-red-300"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {optedOut ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            <span>{optedOut ? "DPDP: Opted Out (Messages Blocked)" : "DPDP: Consented"}</span>
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lead.full_name}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                lead.score >= 80
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : lead.score >= 50
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              Score: {lead.score}/100
            </span>
          </div>

          {/* Contact Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 font-mono text-slate-900 hover:text-brand-600"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{lead.phone}</span>
            </a>

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600"
              >
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{lead.email}</span>
              </a>
            )}

            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{lead.city || "Bhopal, M.P."}</span>
            </div>

            <div className="text-slate-400">
              Source: <span className="font-semibold text-slate-600 capitalize">{lead.source.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {/* Quick CTA */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/visits"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Site Visit</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
