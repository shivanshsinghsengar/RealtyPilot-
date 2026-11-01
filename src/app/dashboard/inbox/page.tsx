import { createClient } from "@/lib/supabase/server";
import { InboxShell } from "@/components/inbox/inbox-shell";
import { ConversationItem } from "@/components/inbox/conversation-list";
import { MessageItem, ConversationLead } from "@/components/inbox/chat-thread";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let conversations: ConversationItem[] = [];
  let allMessages: Record<string, MessageItem[]> = {};

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();

      // 1. Fetch leads
      const { data: rawLeads, error: leadsError } = await supabase
        .from("leads")
        .select(
          "id, full_name, phone, city, stage, score, opted_out, preferred_size_sqft, budget_min, budget_max"
        )
        .order("created_at", { ascending: false });

      // 2. Fetch messages
      const { data: rawMsgs, error: msgsError } = await supabase
        .from("messages")
        .select("id, lead_id, direction, sender_type, whatsapp_message_id, body, status, created_at")
        .order("created_at", { ascending: true });

      if (!leadsError && rawLeads) {
        const leads = rawLeads as unknown as ConversationLead[];
        const msgs = (rawMsgs as unknown as MessageItem[]) || [];

        const msgsByLead: Record<string, MessageItem[]> = {};
        for (const m of msgs) {
          if (!msgsByLead[m.lead_id]) {
            msgsByLead[m.lead_id] = [];
          }
          msgsByLead[m.lead_id].push(m);
        }

        allMessages = msgsByLead;

        conversations = leads.map((lead) => {
          const leadMsgs = msgsByLead[lead.id] || [];
          const lastMsg = leadMsgs.length > 0 ? leadMsgs[leadMsgs.length - 1] : null;

          return {
            lead,
            lastMessage: lastMsg
              ? {
                  body: lastMsg.body,
                  direction: lastMsg.direction,
                  created_at: lastMsg.created_at,
                }
              : null,
          };
        });

        // Sort conversations: those with messages first, ordered by latest message
        conversations.sort((a, b) => {
          if (a.lastMessage && b.lastMessage) {
            return (
              new Date(b.lastMessage.created_at).getTime() -
              new Date(a.lastMessage.created_at).getTime()
            );
          }
          if (a.lastMessage) return -1;
          if (b.lastMessage) return 1;
          return 0;
        });
      }
    } catch {
      // Fallback handled below
    }
  }

  // Fallback demo conversations in placeholder mode
  if (isPlaceholder && conversations.length === 0) {
    const now = Date.now();

    const mockLeads: ConversationLead[] = [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        full_name: "Rohit Sharma",
        phone: "+919826011111",
        city: "Bhopal",
        stage: "qualified",
        score: 75,
        opted_out: false,
        preferred_size_sqft: 1000,
        budget_min: 2500000,
        budget_max: 3500000,
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        full_name: "Priya Verma",
        phone: "+919826022222",
        city: "Bhopal",
        stage: "visit_scheduled",
        score: 85,
        opted_out: false,
        preferred_size_sqft: 1500,
        budget_min: 3500000,
        budget_max: 5000000,
      },
      {
        id: "c1000000-0000-0000-0000-000000000009",
        full_name: "Kavita Jain (Opted Out)",
        phone: "+919826099999",
        city: "Bhopal",
        stage: "contacted",
        score: 10,
        opted_out: true,
        preferred_size_sqft: 1500,
        budget_min: 3500000,
        budget_max: 5000000,
      },
    ];

    allMessages = {
      "c1000000-0000-0000-0000-000000000001": [
        {
          id: "m1",
          lead_id: "c1000000-0000-0000-0000-000000000001",
          direction: "inbound",
          sender_type: "lead",
          whatsapp_message_id: "wamid.1",
          body: "Hello, I am interested in residential plots in Narmada Greens (Kolar Road). What is the price for 1000 sqft?",
          status: "delivered",
          created_at: new Date(now - 3600000 * 2).toISOString(),
        },
        {
          id: "m2",
          lead_id: "c1000000-0000-0000-0000-000000000001",
          direction: "outbound",
          sender_type: "agent",
          whatsapp_message_id: "wamid.2",
          body: "Namaste Rohit ji! In Narmada Greens, 1000 sq.ft east-facing plots start from ₹25 Lakhs with bank loan approvals from SBI & HDFC. Would you like to schedule an on-site visit?",
          status: "read",
          created_at: new Date(now - 3600000 * 1.5).toISOString(),
        },
        {
          id: "m3",
          lead_id: "c1000000-0000-0000-0000-000000000001",
          direction: "inbound",
          sender_type: "lead",
          whatsapp_message_id: "wamid.3",
          body: "Yes, this Sunday 11 AM works for me. Please confirm the exact location.",
          status: "delivered",
          created_at: new Date(now - 3600000 * 0.5).toISOString(),
        },
      ],
      "c1000000-0000-0000-0000-000000000002": [
        {
          id: "m4",
          lead_id: "c1000000-0000-0000-0000-000000000002",
          direction: "inbound",
          sender_type: "lead",
          whatsapp_message_id: "wamid.4",
          body: "Looking for 1500 sqft duplex plot in Bhojpal Enclave.",
          status: "delivered",
          created_at: new Date(now - 86400000).toISOString(),
        },
        {
          id: "m5",
          lead_id: "c1000000-0000-0000-0000-000000000002",
          direction: "outbound",
          sender_type: "agent",
          whatsapp_message_id: "wamid.5",
          body: "Namaste Priya ji! We have scheduled your site visit for Bhojpal Enclave. Our sales rep will welcome you at the site gate.",
          status: "read",
          created_at: new Date(now - 43200000).toISOString(),
        },
      ],
      "c1000000-0000-0000-0000-000000000009": [
        {
          id: "m6",
          lead_id: "c1000000-0000-0000-0000-000000000009",
          direction: "inbound",
          sender_type: "lead",
          whatsapp_message_id: "wamid.6",
          body: "STOP",
          status: "delivered",
          created_at: new Date(now - 86400000 * 2).toISOString(),
        },
        {
          id: "m7",
          lead_id: "c1000000-0000-0000-0000-000000000009",
          direction: "outbound",
          sender_type: "ai_system",
          whatsapp_message_id: "wamid.7",
          body: "Aapko RealtyPilot ke WhatsApp updates se unsubscribe kar diya gaya hai. Agar aap dobara notifications chahte hain, to 'START' reply karein.",
          status: "read",
          created_at: new Date(now - 86400000 * 2 + 10000).toISOString(),
        },
      ],
    };

    conversations = mockLeads.map((lead) => {
      const leadMsgs = allMessages[lead.id] || [];
      const lastMsg = leadMsgs.length > 0 ? leadMsgs[leadMsgs.length - 1] : null;
      return {
        lead,
        lastMessage: lastMsg
          ? {
              body: lastMsg.body,
              direction: lastMsg.direction,
              created_at: lastMsg.created_at,
            }
          : null,
      };
    });
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            WhatsApp Sales Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official Meta WhatsApp Cloud API &bull; Live messaging, webhook events, and DPDP compliance
          </p>
        </div>
      </div>

      {/* Main Inbox Shell */}
      <InboxShell
        initialConversations={conversations}
        allMessages={allMessages}
      />
    </div>
  );
}
