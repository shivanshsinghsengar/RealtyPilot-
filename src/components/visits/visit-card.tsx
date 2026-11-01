"use client";

import { useState } from "react";
import Link from "next/link";
import { updateVisitStatusAction } from "@/app/dashboard/visits/actions";
import { RescheduleModal } from "@/components/visits/reschedule-modal";
import { formatInIST, getVisitCountdownText } from "@/lib/utils/date";
import {
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export interface VisitItem {
  id: string;
  lead_id: string;
  project_id: string;
  scheduled_at_utc: string;
  status: "scheduled" | "confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show";
  notes: string | null;
  reminder_sent_24h: boolean;
  reminder_sent_2h: boolean;
  lead: {
    id: string;
    full_name: string;
    phone: string;
    opted_out: boolean;
    stage: string;
  };
  project: {
    id: string;
    name: string;
    location: string;
  };
}

interface VisitCardProps {
  visit: VisitItem;
}

export function VisitCard({ visit }: VisitCardProps) {
  const [status, setStatus] = useState(visit.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const countdown = getVisitCountdownText(visit.scheduled_at_utc);

  const handleStatusChange = async (newStatus: string) => {
    const prevStatus = status;
    setStatus(newStatus as VisitItem["status"]);
    setIsUpdating(true);
    setErrorMsg(null);

    try {
      const res = await updateVisitStatusAction(visit.id, newStatus);
      if (!res.success) {
        setStatus(prevStatus);
        setErrorMsg(res.error || "Failed to update status.");
      }
    } catch {
      setStatus(prevStatus);
      setErrorMsg("Network connection error. Reverted to previous status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "rescheduled":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
      case "no_show":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-500 text-white font-bold animate-pulse";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
      case "past":
        return "bg-slate-100 text-slate-500 font-medium";
      default:
        return "bg-brand-50 text-brand-700 border-brand-200 font-medium";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Error alert if status update fails */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Header: Lead Name + Status & Countdown Badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/leads/${visit.lead.id}`}
            className="text-base font-bold text-slate-900 hover:text-brand-600 hover:underline flex items-center gap-1.5"
          >
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{visit.lead.full_name}</span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
            <a
              href={`tel:${visit.lead.phone}`}
              className="flex items-center gap-1 hover:text-brand-600 transition-colors"
            >
              <Phone className="h-3 w-3 text-slate-400" />
              <span>{visit.lead.phone}</span>
            </a>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(
              status
            )}`}
          >
            {status.replace(/_/g, " ")}
          </span>

          {status !== "completed" && status !== "cancelled" && status !== "no_show" && (
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] border ${getUrgencyBadge(
                countdown.urgency
              )}`}
            >
              {countdown.label}
            </span>
          )}
        </div>
      </div>

      {/* Project & IST Scheduled Time Details */}
      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            Project Site:
          </span>
          <span className="font-bold text-slate-900">
            {visit.project.name} &bull; <span className="text-slate-600 font-normal">{visit.project.location}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            Scheduled (IST):
          </span>
          <span className="font-bold font-mono text-slate-900">
            {formatInIST(visit.scheduled_at_utc, "dd MMM yyyy, hh:mm a")}
          </span>
        </div>

        {visit.notes && (
          <div className="pt-1.5 border-t border-slate-200/60 text-slate-700 italic">
            &ldquo;{visit.notes}&rdquo;
          </div>
        )}
      </div>

      {/* Compliance Warning if lead opted out */}
      {visit.lead.opted_out && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700 bg-red-50/80 p-2 rounded-lg border border-red-200">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>DPDP Act: Lead opted out. WhatsApp reminders blocked.</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Quick Confirm */}
          {status === "scheduled" && (
            <button
              onClick={() => handleStatusChange("confirmed")}
              disabled={isUpdating}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Confirm</span>
            </button>
          )}

          {/* Mark Complete */}
          {(status === "scheduled" || status === "confirmed" || status === "rescheduled") && (
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={isUpdating}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>Mark Done</span>
            </button>
          )}

          {/* Reschedule Button */}
          {status !== "completed" && status !== "cancelled" && (
            <button
              onClick={() => setIsRescheduleOpen(true)}
              disabled={isUpdating}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reschedule</span>
            </button>
          )}

          {/* Mark Cancelled or No-Show */}
          {status !== "completed" && status !== "cancelled" && status !== "no_show" && (
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={isUpdating}
              className="px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-700 text-xs font-semibold transition-colors flex items-center gap-1"
              title="Cancel Visit"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Lead Profile Link */}
        <Link
          href={`/dashboard/leads/${visit.lead.id}`}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          <span>Lead CRM</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        visitId={visit.id}
        leadName={visit.lead.full_name}
        projectName={visit.project.name}
        currentScheduledAtUtc={visit.scheduled_at_utc}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
      />
    </div>
  );
}
