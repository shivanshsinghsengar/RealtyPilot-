"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { rescheduleVisitAction } from "@/app/dashboard/visits/actions";
import { ActionResult } from "@/app/dashboard/leads/actions";
import { formatInIST, getCurrentIST } from "@/lib/utils/date";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";

interface RescheduleModalProps {
  visitId: string;
  leadName: string;
  projectName: string;
  currentScheduledAtUtc: string;
  isOpen: boolean;
  onClose: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Rescheduling...</span>
        </>
      ) : (
        <span>Confirm Reschedule</span>
      )}
    </button>
  );
}

export function RescheduleModal({
  visitId,
  leadName,
  projectName,
  currentScheduledAtUtc,
  isOpen,
  onClose,
}: RescheduleModalProps) {
  // Tomorrow's date in IST as default
  const tomorrow = new Date(Date.now() + 86400000);
  const defaultDateStr = formatInIST(tomorrow, "yyyy-MM-dd");

  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await rescheduleVisitAction(prev, formData);
      if (res.success) {
        onClose();
      }
      return res;
    },
    null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Reschedule Site Visit
            </h3>
            <p className="text-xs text-slate-500">
              {leadName} &bull; {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Scheduled Time Note */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <span className="font-semibold text-slate-700 block">Current Appointment:</span>
          <span className="font-mono text-slate-900">
            {formatInIST(currentScheduledAtUtc, "EEEE, dd MMMM yyyy, hh:mm a 'IST'")}
          </span>
        </div>

        {/* Error Banner */}
        {state?.error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="visit_id" value={visitId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Date (IST) *
              </label>
              <div className="relative">
                <input
                  name="visit_date"
                  type="date"
                  required
                  defaultValue={defaultDateStr}
                  min={formatInIST(new Date(), "yyyy-MM-dd")}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {state?.fieldErrors?.visit_date && (
                <p className="text-xs text-red-500 mt-1">
                  {state.fieldErrors.visit_date[0]}
                </p>
              )}
            </div>

            {/* New Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Time (IST) *
              </label>
              <div className="relative">
                <input
                  name="visit_time"
                  type="time"
                  required
                  defaultValue="11:00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {state?.fieldErrors?.visit_time && (
                <p className="text-xs text-red-500 mt-1">
                  {state.fieldErrors.visit_time[0]}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Notes (Optional)
            </label>
            <textarea
              name="reason"
              rows={2}
              placeholder="e.g. Buyer requested afternoon slot due to office hours..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
