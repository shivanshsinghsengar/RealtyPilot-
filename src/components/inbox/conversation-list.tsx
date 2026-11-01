"use client";

import { useState } from "react";
import { formatInIST } from "@/lib/utils/date";
import { Search, ShieldAlert, MessageSquare } from "lucide-react";
import { ConversationLead } from "@/components/inbox/chat-thread";

export interface ConversationItem {
  lead: ConversationLead;
  lastMessage: {
    body: string;
    direction: "inbound" | "outbound";
    created_at: string;
  } | null;
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedLeadId: string;
  onSelectLead: (leadId: string) => void;
}

export function ConversationList({
  conversations,
  selectedLeadId,
  onSelectLead,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      c.lead.full_name.toLowerCase().includes(term) ||
      c.lead.phone.includes(term) ||
      (c.lastMessage && c.lastMessage.body.toLowerCase().includes(term))
    );
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Top Search Bar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              WhatsApp Inbox
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {conversations.length} Threads
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyers or chats..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No conversations found</p>
            <p>Try searching with another name or phone number.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.lead.id === selectedLeadId;

            return (
              <button
                key={item.lead.id}
                onClick={() => onSelectLead(item.lead.id)}
                className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                  isSelected ? "bg-brand-50/70 border-l-4 border-brand-600" : ""
                }`}
              >
                {/* Initials Avatar */}
                <div
                  className={`h-10 w-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.lead.full_name.slice(0, 2).toUpperCase()}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-brand-900" : "text-slate-900"
                      }`}
                    >
                      {item.lead.full_name}
                    </span>
                    {item.lastMessage && (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {formatInIST(item.lastMessage.created_at, "hh:mm a")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>{item.lead.phone}</span>
                    {item.lead.opted_out && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        Opted Out
                      </span>
                    )}
                  </div>

                  {item.lastMessage && (
                    <p className="text-xs text-slate-500 truncate line-clamp-1 font-sans">
                      {item.lastMessage.direction === "outbound" && (
                        <span className="text-slate-400 font-semibold">You: </span>
                      )}
                      {item.lastMessage.body}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
