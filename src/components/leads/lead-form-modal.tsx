"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createLeadAction, ActionResult } from "@/app/dashboard/leads/actions";
import { X, Plus, AlertCircle, CheckCircle2, ShieldCheck, IndianRupee } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Saving Lead...</span>
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          <span>Save New Lead</span>
        </>
      )}
    </button>
  );
}

export function LeadFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await createLeadAction(prev, formData);
      if (res.success) {
        setIsOpen(false);
      }
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
      >
        <Plus className="h-4 w-4" />
        <span>Create Pipeline</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Add New Real Estate Lead
                </h3>
                <p className="text-xs text-slate-500">
                  Residential plots & duplex inquiry &bull; Bhopal, M.P.
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
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Validation Error</p>
                  <p className="text-xs text-red-600 mt-0.5">{state.error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    placeholder="e.g. Vikas Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {state?.fieldErrors?.full_name && (
                    <p className="text-xs text-red-500 mt-1">
                      {state.fieldErrors.full_name[0]}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number * (Indian +91)
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98260 12345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {state?.fieldErrors?.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {state.fieldErrors.phone[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="buyer@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target City
                  </label>
                  <input
                    name="city"
                    type="text"
                    defaultValue="Bhopal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Budget Range (INR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Min Budget (₹)
                  </label>
                  <div className="relative">
                    <input
                      name="budget_min"
                      type="number"
                      step="50000"
                      placeholder="e.g. 2500000 (25 Lakh)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Max Budget (₹)
                  </label>
                  <div className="relative">
                    <input
                      name="budget_max"
                      type="number"
                      step="50000"
                      placeholder="e.g. 4500000 (45 Lakh)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Plot preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plot Size (Sq. Ft.)
                  </label>
                  <input
                    name="preferred_size_sqft"
                    type="number"
                    placeholder="e.g. 1200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Purpose
                  </label>
                  <select
                    name="purpose"
                    defaultValue="end_use"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="end_use">End Use (Self Residence)</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lead Source
                  </label>
                  <select
                    name="source"
                    defaultValue="website_form"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="website_form">Website Form</option>
                    <option value="meta_ad">Meta / Facebook Ad</option>
                    <option value="google_places">Google Places Listing</option>
                    <option value="direct_call">Direct Call / Walk-in</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              </div>

              {/* Loan Requirement */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="loan_needed"
                  name="loan_needed"
                  type="checkbox"
                  value="true"
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <label htmlFor="loan_needed" className="text-xs font-medium text-slate-700">
                  Buyer requires home / plot loan assistance (SBI / HDFC / Bank of Baroda)
                </label>
              </div>

              {/* DPDP Compliance Mandatory Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-start gap-2">
                  <input
                    id="consent_given"
                    name="consent_given"
                    type="checkbox"
                    value="true"
                    required
                    className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 mt-0.5"
                  />
                  <label htmlFor="consent_given" className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">DPDP Act Compliance:</span> Buyer has granted explicit opt-in consent to receive real estate updates and WhatsApp site visit alerts.
                  </label>
                </div>
                {state?.fieldErrors?.consent_given && (
                  <p className="text-xs text-red-500">
                    {state.fieldErrors.consent_given[0]}
                  </p>
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
          </div>
        </div>
      )}
    </>
  );
}
