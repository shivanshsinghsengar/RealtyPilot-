"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { bookVisitAction } from "@/app/dashboard/visits/actions";
import { X, Calendar, Clock, MapPin, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface ScheduleVisitModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
}

export function ScheduleVisitModal({ leadId, leadName, onClose }: ScheduleVisitModalProps) {
  const [state, formAction] = useFormState(bookVisitAction, null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  // Default time to 10:00 AM
  const defaultTime = "10:00";

  useEffect(() => {
    if (state?.success) {
      alert("✅ Visit scheduled successfully!");
      onClose();
    }
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Schedule Site Visit</h2>
                <p className="text-white/80 text-sm mt-1">
                  Book a property visit for <span className="font-semibold">{leadName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form action={formAction} className="p-6 space-y-6">
          {/* Hidden lead_id */}
          <input type="hidden" name="lead_id" value={leadId} />

          {/* Success/Error Messages */}
          {state?.error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            </div>
          )}

          {state?.success && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Success!</p>
                <p className="text-sm text-green-600">Visit scheduled successfully</p>
              </div>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Select Project
            </label>
            <select
              name="project_id"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose a project...</option>
              <option value="p1000000-0000-0000-0000-000000000001">Narmada Greens (Kolar Road)</option>
              <option value="p1000000-0000-0000-0000-000000000002">Bhojpal Enclave (Hoshangabad Road)</option>
            </select>
            {state?.fieldErrors?.project_id && (
              <p className="text-xs text-red-500 mt-1">{state.fieldErrors.project_id[0]}</p>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visit Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Visit Date
              </label>
              <input
                type="date"
                name="visit_date"
                required
                min={today}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {state?.fieldErrors?.visit_date && (
                <p className="text-xs text-red-500 mt-1">{state.fieldErrors.visit_date[0]}</p>
              )}
            </div>

            {/* Visit Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Visit Time
              </label>
              <input
                type="time"
                name="visit_time"
                required
                defaultValue={defaultTime}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {state?.fieldErrors?.visit_time && (
                <p className="text-xs text-red-500 mt-1">{state.fieldErrors.visit_time[0]}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any special requirements or notes about this visit..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            {state?.fieldErrors?.notes && (
              <p className="text-xs text-red-500 mt-1">{state.fieldErrors.notes[0]}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The lead will receive a WhatsApp confirmation message with the visit details. 
              Make sure to call them before the visit to confirm.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Scheduling..." : "Confirm & Schedule Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
