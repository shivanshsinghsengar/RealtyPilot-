"use client";

import { useState } from "react";
import { Database } from "@/types/database.types";
import { ActivityItem } from "./lead-notes-timeline";
import { ScheduleVisitModal } from "./schedule-visit-modal";
import { LeadScoreResult } from "@/lib/scoring/engine";
import {
  Phone,
  MessageCircle,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  CalendarPlus,
} from "lucide-react";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

interface SimpleLeadDashboardProps {
  lead: LeadRow;
  scoreResult: LeadScoreResult;
  activities: ActivityItem[];
}

export function SimpleLeadDashboard({ lead, scoreResult, activities }: SimpleLeadDashboardProps) {
  const [lastCallNote, setLastCallNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);

  // Get last call note from activities
  const lastCallActivity = activities.find(
    (a) => a.activity_type === "staff_note" || a.activity_type === "whatsapp_received"
  );

  // Calculate simple stats
  const totalCalls = activities.filter(
    (a) => a.activity_type === "staff_note" || a.activity_type === "call_made"
  ).length;

  const totalMessages = activities.filter(
    (a) => a.activity_type === "whatsapp_sent" || a.activity_type === "whatsapp_received"
  ).length;

  // Simple status in English
  const getSimpleStatus = (stage: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      new: { label: "New Lead", color: "bg-blue-100 text-blue-800", icon: User },
      contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800", icon: Phone },
      qualified: { label: "Interested", color: "bg-green-100 text-green-800", icon: CheckCircle },
      visit_scheduled: { label: "Visit Scheduled", color: "bg-purple-100 text-purple-800", icon: Calendar },
      visit_completed: { label: "Visit Done", color: "bg-indigo-100 text-indigo-800", icon: CheckCircle },
      negotiation: { label: "Negotiating", color: "bg-orange-100 text-orange-800", icon: MessageCircle },
      won: { label: "Deal Won", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      lost: { label: "Deal Lost", color: "bg-red-100 text-red-800", icon: AlertCircle },
      nurture: { label: "Follow Up Later", color: "bg-gray-100 text-gray-800", icon: Clock },
    };

    return statusMap[stage] || statusMap.new;
  };

  const status = getSimpleStatus(lead.stage);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Action Buttons Row */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowScheduleVisit(true)}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <CalendarPlus className="h-5 w-5" />
          Schedule Site Visit
        </button>
        <button
          onClick={() => setShowAddNote(true)}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Add Call Note
        </button>
      </div>

      {/* Schedule Visit Modal */}
      {showScheduleVisit && (
        <ScheduleVisitModal
          leadId={lead.id}
          leadName={lead.full_name}
          onClose={() => setShowScheduleVisit(false)}
        />
      )}

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Lead Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${status.color}`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 uppercase">Lead Status</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{status.label}</p>
        </div>

        {/* Lead Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 uppercase">Lead Quality</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900">{scoreResult.score}</p>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                scoreResult.score >= 80
                  ? "bg-green-500"
                  : scoreResult.score >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${scoreResult.score}%` }}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 uppercase">Budget</span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {lead.budget_min ? `₹${(lead.budget_min / 100000).toFixed(1)}L` : "N/A"}
          </p>
          {lead.budget_max && (
            <p className="text-xs text-slate-500 mt-1">
              to ₹{(lead.budget_max / 100000).toFixed(1)}L
            </p>
          )}
        </div>

        {/* Contact Stats */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Phone className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 uppercase">Contact</span>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalCalls}</p>
              <p className="text-xs text-slate-500">Calls</p>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <p className="text-2xl font-bold text-slate-900">{totalMessages}</p>
              <p className="text-xs text-slate-500">Messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Progress Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Lead Journey Progress</h3>
        <div className="relative">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            {[
              { key: "new", label: "New" },
              { key: "contacted", label: "Contacted" },
              { key: "qualified", label: "Interested" },
              { key: "visit_scheduled", label: "Visit Set" },
              { key: "won", label: "Deal Done" },
            ].map((step, index, arr) => {
              const isActive = getStageNumber(lead.stage) >= index + 1;
              const isComplete = getStageNumber(lead.stage) > index + 1;

              return (
                <div key={step.key} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                        isComplete
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-brand-500 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {isComplete ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-xs mt-2 text-center ${
                        isActive ? "text-slate-900 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {/* Connecting Line */}
                  {index < arr.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 ${
                        isComplete ? "bg-green-500" : "bg-slate-200"
                      }`}
                      style={{ transform: "translateY(-50%)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Last Call Feedback - Most Important */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500 text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">What Did They Say Last?</h3>
              <p className="text-sm text-slate-600">Last Call Feedback</p>
            </div>
          </div>
        </div>

        {/* Add Note Form */}
        {showAddNote && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-blue-200">
            <textarea
              value={lastCallNote}
              onChange={(e) => setLastCallNote(e.target.value)}
              placeholder="What did the lead say? Write the feedback here..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  // TODO: Save note to database
                  alert("Note saved! (Backend integration needed)");
                  setLastCallNote("");
                  setShowAddNote(false);
                }}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setLastCallNote("");
                  setShowAddNote(false);
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Last Call Note Display */}
        {lastCallActivity ? (
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900 leading-relaxed mb-2">
                  {lastCallActivity.description}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(lastCallActivity.created_at).toLocaleDateString("hi-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No call notes yet</p>
            <p className="text-xs mt-1">Add your first note using "+ Add Note" button above</p>
          </div>
        )}
      </div>

      {/* Score Breakdown Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Score Breakdown (What makes the score)
        </h3>
        <div className="space-y-3">
          {scoreResult.breakdown.map((item, index) => {
            const percentage = (item.points / item.maxPoints) * 100;
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.factor}</span>
                  <span className="text-slate-900 font-bold">
                    {item.points} / {item.maxPoints}
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      percentage >= 80
                        ? "bg-green-500"
                        : percentage >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Steps Suggestion */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Next Steps (What to do now?)</h3>
        <div className="space-y-2">
          {getNextSteps(lead.stage).map((step, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>
              <p className="text-slate-700 flex-1">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert stage to number for progress
function getStageNumber(stage: string): number {
  const stageMap: Record<string, number> = {
    new: 1,
    contacted: 2,
    qualified: 3,
    visit_scheduled: 4,
    visit_completed: 4,
    negotiation: 4,
    won: 5,
    lost: 0,
    nurture: 2,
  };
  return stageMap[stage] || 1;
}

// Helper function to get next steps based on stage
function getNextSteps(stage: string): string[] {
  const stepsMap: Record<string, string[]> = {
    new: [
      "Call the lead and gather information",
      "Confirm budget and requirements",
      "Share project details",
    ],
    contacted: [
      "Schedule a project visit",
      "Send property photos on WhatsApp",
      "Set a follow-up reminder",
    ],
    qualified: [
      "Fix a site visit date",
      "Finalize plot location and size",
      "Discuss bank loan (if needed)",
    ],
    visit_scheduled: [
      "Confirm visit one day before",
      "Keep project documents ready",
      "Prepare discount offers",
    ],
    visit_completed: [
      "Take feedback after visit",
      "Start price negotiation",
      "Discuss token amount",
    ],
    negotiation: [
      "Lock final price",
      "Discuss payment terms",
      "Prepare agreement draft",
    ],
    won: [
      "Follow payment schedule",
      "Start registry process",
      "Send thank you message to customer",
    ],
    lost: [
      "Note the reason for losing",
      "Keep in database for future",
      "Ask for referrals",
    ],
    nurture: [
      "Follow up once a month",
      "Send updates about new projects",
      "Share festival offers",
    ],
  };

  return stepsMap[stage] || stepsMap.new;
}
