"use client";

import { useState } from "react";
import { ConversationList, ConversationItem } from "@/components/inbox/conversation-list";
import { ChatThread, MessageItem } from "@/components/inbox/chat-thread";
import { ArrowLeft, MessageSquare } from "lucide-react";

interface InboxShellProps {
  initialConversations: ConversationItem[];
  allMessages: Record<string, MessageItem[]>;
}

export function InboxShell({ initialConversations, allMessages }: InboxShellProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    initialConversations[0]?.lead.id || ""
  );
  const [showMobileChat, setShowMobileChat] = useState(false);

  const activeConversation = initialConversations.find(
    (c) => c.lead.id === selectedLeadId
  );
  const activeMessages = allMessages[selectedLeadId] || [];

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setShowMobileChat(true);
  };

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[550px] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Left Pane: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full flex-shrink-0 ${
          showMobileChat ? "hidden md:block" : "block"
        }`}
      >
        <ConversationList
          conversations={initialConversations}
          selectedLeadId={selectedLeadId}
          onSelectLead={handleSelectLead}
        />
      </div>

      {/* Right Pane: Active Chat Thread */}
      <div
        className={`flex-1 h-full flex flex-col ${
          showMobileChat ? "block" : "hidden md:block"
        }`}
      >
        {activeConversation ? (
          <div className="h-full flex flex-col relative">
            {/* Mobile Back Button */}
            <div className="md:hidden bg-slate-900 text-white px-4 py-2 flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setShowMobileChat(false)}
                className="flex items-center gap-1 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>All Conversations</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <ChatThread
                lead={activeConversation.lead}
                messages={activeMessages}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <div>
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No Chat Selected</p>
              <p className="text-xs text-slate-400">
                Choose a conversation from the left to view and send WhatsApp messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
