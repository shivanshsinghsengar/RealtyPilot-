"use client";

import { useState } from "react";
import { addLeadNoteAction } from "@/app/dashboard/leads/actions";
import { formatInIST } from "@/lib/utils/date";
import { MessageSquare, FileText, Clock, Send, ShieldCheck, CalendarCheck, AlertTriangle } from "lucide-react";

export interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface LeadNotesTimelineProps {
  leadId: string;
  initialActivities: ActivityItem[];
}

export function LeadNotesTimeline({ leadId, initialActivities }: LeadNotesTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await addLeadNoteAction(leadId, noteText);

    if (res.success) {
      // Optimistic update
      const newActivity: ActivityItem = {
        id: `temp-${Date.now()}`,
        activity_type: "staff_note",
        description: noteText.trim(),
        metadata: { channel: "crm_note" },
        created_at: new Date().toISOString(),
      };
      setActivities([newActivity, ...activities]);
      setNoteText("");
    } else {
      setError(res.error || "Failed to add note.");
    }

    setIsSubmitting(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "staff_note":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "visit_booked":
      case "visit_scheduled":
        return <CalendarCheck className="h-4 w-4 text-purple-600" />;
      case "opt_out_received":
      case "opt_out_recorded":
        return <ShieldCheck className="h-4 w-4 text-red-600" />;
      case "human_handoff_flagged":
      case "human_followup_flagged":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-brand-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Internal Notes & Activity Audit Log
          </h2>
          <p className="text-xs text-slate-500">
            Chronological CRM log and staff follow-up history (stored in UTC, displayed in IST)
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {activities.length} Records
        </span>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-3">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {error}
          </p>
        )}
        <div className="relative">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add internal note (e.g. Buyer visited Kolar Road site; interested in East facing 1200 sqft plot NG-102)..."
            rows={3}
            className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !noteText.trim()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? "Saving..." : "Add Note"}</span>
          </button>
        </div>
      </form>

      {/* Timeline Stream */}
      <div className="space-y-4 pt-2">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
            No notes or activity logged yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Node Dot */}
                <div className="absolute -left-[27px] top-1 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  {getActivityIcon(act.activity_type)}
                </div>

                {/* Content Box */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-1 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-slate-600">
                      {act.activity_type.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {formatInIST(act.created_at, "dd MMM yyyy, hh:mm a 'IST'")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
