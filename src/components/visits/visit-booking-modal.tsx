"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { bookVisitAction } from "@/app/dashboard/visits/actions";
import { ActionResult } from "@/app/dashboard/leads/actions";
import { formatInIST } from "@/lib/utils/date";
import { X, CalendarPlus, AlertTriangle, ShieldAlert, UserPlus } from "lucide-react";

interface LeadOption {
  id: string;
  full_name: string;
  phone: string;
  opted_out: boolean;
}

interface ProjectOption {
  id: string;
  name: string;
  location: string;
}

interface VisitBookingModalProps {
  leads: LeadOption[];
  projects: ProjectOption[];
  preselectedLeadId?: string;
  buttonLabel?: string;
  className?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Scheduling Visit...</span>
        </>
      ) : (
        <>
          <CalendarPlus className="h-4 w-4" />
          <span>Confirm & Schedule Visit</span>
        </>
      )}
    </button>
  );
}

export function VisitBookingModal({
  leads,
  projects,
  preselectedLeadId,
  buttonLabel = "Schedule Site Visit",
  className,
}: VisitBookingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId || leads[0]?.id || "");

  const tomorrow = new Date(Date.now() + 86400000);
  const defaultDateStr = formatInIST(tomorrow, "yyyy-MM-dd");

  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await bookVisitAction(prev, formData);
      if (res.success) {
        setIsOpen(false);
      }
      return res;
    },
    null
  );

  const currentLead = leads.find((l) => l.id === selectedLeadId);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
        }
      >
        <CalendarPlus className="h-4 w-4" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Book Bhopal Site Visit
                </h3>
                <p className="text-xs text-slate-500">
                  Coordinate buyer on-site property tour for residential plots & duplexes
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            {leads.length === 0 ? (
              <div className="py-10 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">No Leads Registered</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Please create or import a lead in the Leads module before booking a site visit.
                  </p>
                </div>
                <Link
                  href="/dashboard/leads"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Go to Leads & Add Buyer</span>
                </Link>
              </div>
            ) : (
              /* Form */
              <form action={formAction} className="mt-6 space-y-4">
                {/* Lead Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Lead / Buyer *
                  </label>
                  <select
                    name="lead_id"
                    required
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} &bull; {l.phone} {l.opted_out ? "(Opted Out)" : ""}
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.lead_id && (
                    <p className="text-xs text-red-500 mt-1">{state.fieldErrors.lead_id[0]}</p>
                  )}
                </div>

                {/* DPDP Opt-out Alert if Lead is Opted-out */}
                {currentLead?.opted_out && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">DPDP Compliance Notice:</span> This buyer has revoked consent for automated communications. You may book this visit manually, but automated WhatsApp appointment reminders will be blocked.
                    </div>
                  </div>
                )}

                {/* Project Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bhopal Project Location *
                  </label>
                  <select
                    name="project_id"
                    required
                    defaultValue={projects[0]?.id}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location})
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.project_id && (
                    <p className="text-xs text-red-500 mt-1">{state.fieldErrors.project_id[0]}</p>
                  )}
                </div>

                {/* Date & Time (IST) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Visit Date (IST) *
                    </label>
                    <input
                      name="visit_date"
                      type="date"
                      required
                      defaultValue={defaultDateStr}
                      min={formatInIST(new Date(), "yyyy-MM-dd")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {state?.fieldErrors?.visit_date && (
                      <p className="text-xs text-red-500 mt-1">{state.fieldErrors.visit_date[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Visit Time (IST) * (07:00 AM - 07:30 PM)
                    </label>
                    <input
                      name="visit_time"
                      type="time"
                      required
                      defaultValue="11:00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {state?.fieldErrors?.visit_time && (
                      <p className="text-xs text-red-500 mt-1">{state.fieldErrors.visit_time[0]}</p>
                    )}
                  </div>
                </div>

                {/* Visit Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Visit Notes & Instructions (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="e.g. Buyer interested in East-facing 1500 sqft plot; arriving with family by car from MP Nagar..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                  {state?.fieldErrors?.notes && (
                    <p className="text-xs text-red-500 mt-1">{state.fieldErrors.notes[0]}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <SubmitButton />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
