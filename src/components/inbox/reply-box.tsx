"use client";

import { useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { sendStaffReplyAction } from "@/app/dashboard/inbox/actions";
import { ActionResult } from "@/app/dashboard/leads/actions";
import { Send, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

interface ReplyBoxProps {
  leadId: string;
  leadName: string;
  isOptedOut: boolean;
}

const QUICK_TEMPLATES = [
  {
    label: "Narmada Greens Info",
    text: "Namaste! Narmada Greens (Kolar Road, Bhopal) offers 1000 - 2400 sq.ft residential plots starting from ₹25 Lakhs. RERA registered with bank loan approval. Would you like a brochure?",
  },
  {
    label: "Bhojpal Enclave Info",
    text: "Namaste! Bhojpal Enclave (Hoshangabad Road, Bhopal) offers premium plots & duplexes with 30ft wide roads, club house & underground cabling. Possession within 6 months.",
  },
  {
    label: "Site Visit Invite",
    text: "Would you like to schedule an on-site visit to inspect available plots this Saturday or Sunday? Our team can pick you up from Bhopal.",
  },
];

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Sending...</span>
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          <span>Send</span>
        </>
      )}
    </button>
  );
}

export function ReplyBox({ leadId, leadName, isOptedOut }: ReplyBoxProps) {
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await sendStaffReplyAction(prev, formData);
      if (res.success) {
        setMessage("");
        formRef.current?.reset();
      }
      return res;
    },
    null
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isOptedOut && message.trim().length > 0) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const handleTemplateClick = (text: string) => {
    setMessage(text);
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 space-y-3">
      {/* DPDP Opt-out Banner if lead opted out */}
      {isOptedOut && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">DPDP Act Compliance Lockdown:</span> {leadName} has revoked consent for WhatsApp messages. Outbound messages are blocked to comply with data privacy regulations.
          </div>
        </div>
      )}

      {/* Error Banner */}
      {state?.error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Quick Templates Shortcuts (Only if consented) */}
      {!isOptedOut && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Quick:
          </span>
          {QUICK_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleTemplateClick(tmpl.text)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="lead_id" value={leadId} />

        <div className="relative">
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isOptedOut}
            rows={3}
            placeholder={
              isOptedOut
                ? "Messaging disabled (buyer opted out under DPDP Act)"
                : `Reply to ${leadName} via official WhatsApp Cloud API... (Ctrl+Enter to send)`
            }
            className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {message.length} / 4096 characters &bull; Press Ctrl+Enter to send
          </span>
          <SubmitButton disabled={isOptedOut || message.trim().length === 0} />
        </div>
      </form>
    </div>
  );
}
