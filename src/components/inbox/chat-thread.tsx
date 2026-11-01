"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatInIST } from "@/lib/utils/date";
import { ReplyBox } from "@/components/inbox/reply-box";
import {
  Phone,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Calendar,
  Check,
  CheckCheck,
  AlertCircle,
  Bot,
} from "lucide-react";

export interface MessageItem {
  id: string;
  lead_id: string;
  direction: "inbound" | "outbound";
  sender_type: "lead" | "agent" | "ai_system";
  whatsapp_message_id: string | null;
  body: string;
  status: "sent" | "delivered" | "read" | "failed";
  created_at: string;
}

export interface ConversationLead {
  id: string;
  full_name: string;
  phone: string;
  city: string | null;
  stage: string;
  score: number;
  opted_out: boolean;
  preferred_size_sqft: number | null;
  budget_min: number | null;
  budget_max: number | null;
}

interface ChatThreadProps {
  lead: ConversationLead;
  messages: MessageItem[];
}

export function ChatThread({ lead, messages }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat on load or when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderStatusTicks = (status: MessageItem["status"]) => {
    switch (status) {
      case "read":
        return (
          <span title="Read">
            <CheckCheck className="h-3.5 w-3.5 text-blue-500 inline ml-1" />
          </span>
        );
      case "delivered":
        return (
          <span title="Delivered">
            <CheckCheck className="h-3.5 w-3.5 text-slate-400 inline ml-1" />
          </span>
        );
      case "sent":
        return (
          <span title="Sent to Meta">
            <Check className="h-3.5 w-3.5 text-slate-400 inline ml-1" />
          </span>
        );
      case "failed":
        return (
          <span title="Delivery Failed">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 inline ml-1" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-sm border border-brand-100">
            {lead.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {lead.full_name}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700 border border-slate-200">
                {lead.stage.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1 hover:text-brand-600 transition-colors"
              >
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </a>
              {lead.city && <span>&bull; {lead.city}</span>}
            </div>
          </div>
        </div>

        {/* Action Controls & DPDP Status */}
        <div className="flex items-center gap-2">
          {/* DPDP Consent Pill */}
          <div
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
              lead.opted_out
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {lead.opted_out ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Opted Out</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Consented</span>
              </>
            )}
          </div>

          {/* Book Site Visit CTA */}
          <Link
            href="/dashboard/visits"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Book Visit</span>
          </Link>

          {/* CRM Profile CTA */}
          <Link
            href={`/dashboard/leads/${lead.id}`}
            className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <span>View CRM</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Message Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-dot-grid"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400">
            No WhatsApp messages exchanged with this buyer yet.
            <br />
            Type a reply below to start the conversation via official Meta Cloud API.
          </div>
        ) : (
          messages.map((msg) => {
            const isInbound = msg.direction === "inbound";
            const isAI = msg.sender_type === "ai_system";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
              >
                {/* Bubble Container */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm space-y-1 ${
                    isInbound
                      ? "bg-white text-slate-900 border border-slate-200/80 rounded-tl-sm"
                      : isAI
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : "bg-emerald-600 text-white rounded-tr-sm"
                  }`}
                >
                  {/* Sender Tag */}
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isInbound
                        ? "text-slate-400"
                        : "text-white/80"
                    }`}
                  >
                    {isInbound ? (
                      <span>Buyer &bull; {lead.full_name}</span>
                    ) : isAI ? (
                      <>
                        <Bot className="h-3 w-3" />
                        <span>RealtyPilot AI Agent</span>
                      </>
                    ) : (
                      <span>Staff Agent (You)</span>
                    )}
                  </div>

                  {/* Body Text */}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.body}
                  </p>

                  {/* Timestamp & Status Ticks */}
                  <div
                    className={`flex items-center justify-end text-[10px] font-mono pt-1 ${
                      isInbound ? "text-slate-400" : "text-white/80"
                    }`}
                  >
                    <span>{formatInIST(msg.created_at, "hh:mm a 'IST'")}</span>
                    {!isInbound && renderStatusTicks(msg.status)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <ReplyBox
        leadId={lead.id}
        leadName={lead.full_name}
        isOptedOut={lead.opted_out}
      />
    </div>
  );
}
