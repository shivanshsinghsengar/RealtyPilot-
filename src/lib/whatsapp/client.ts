import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SendWhatsAppMessageParams {
  toPhone: string; // e.g. "+919826012345" or "919826012345"
  messageText: string;
  leadId: string;
  senderType?: "agent" | "ai_system";
  appendOptOutNotice?: boolean;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalizes phone number to international format required by Meta (without plus, e.g. "919826012345")
 */
function normalizeMetaPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Sends an official WhatsApp text message via Meta WhatsApp Cloud API
 * Respects DPDP Act: strictly rejects dispatch if lead has opted out.
 */
export async function sendWhatsAppTextMessage({
  toPhone,
  messageText,
  leadId,
  senderType = "agent",
  appendOptOutNotice = false,
}: SendWhatsAppMessageParams): Promise<SendWhatsAppResult> {
  const supabase = createAdminClient();

  // 1. DPDP Compliance Verification: Verify consent and opt-out status
  const { data: rawLead, error: leadFetchError } = await supabase
    .from("leads")
    .select("id, phone, full_name, opted_out")
    .eq("id", leadId)
    .single();

  const lead = rawLead as unknown as { id: string; phone: string; full_name: string; opted_out: boolean } | null;

  if (leadFetchError || !lead) {
    return { success: false, error: "Lead not found in RealtyPilot CRM." };
  }

  if (lead.opted_out) {
    return {
      success: false,
      error: "DPDP Act Violation Prevented: Lead has opted out from WhatsApp communications.",
    };
  }

  // Format final body (with opt-out notice if requested)
  let finalBody = messageText.trim().replace(/\0/g, "");
  if (appendOptOutNotice && !finalBody.toLowerCase().includes("reply stop")) {
    finalBody += "\n\nReply STOP to unsubscribe.";
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const isPlaceholderOrMissing =
    !accessToken ||
    accessToken.includes("placeholder") ||
    !phoneNumberId ||
    phoneNumberId.includes("placeholder");

  // In placeholder mock / test mode
  if (isPlaceholderOrMissing) {
    const mockMessageId = `wamid.mock.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`;

    // Store in CRM messages table
    await supabase.from("messages").insert({
      // @ts-expect-error Supabase admin client typing helper
      lead_id: leadId,
      direction: "outbound",
      sender_type: senderType,
      whatsapp_message_id: mockMessageId,
      body: finalBody,
      status: "delivered",
      payload: { mode: "simulated_mock_dispatch", to: toPhone },
    });

    // Log activity
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase admin client typing helper
      lead_id: leadId,
      activity_type: "whatsapp_message_sent",
      description: `Outbound WhatsApp message sent by ${senderType === "ai_system" ? "AI Assistant" : "Staff Agent"}: "${finalBody.substring(0, 80)}..."`,
      metadata: { mock: true, message_id: mockMessageId },
    });

    return {
      success: true,
      messageId: mockMessageId,
    };
  }

  // 2. Real Meta WhatsApp Cloud API Request
  const destinationPhone = normalizeMetaPhone(toPhone);
  const metaEndpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(metaEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: destinationPhone,
        type: "text",
        text: {
          preview_url: false,
          body: finalBody,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `Meta Cloud API error (status ${response.status})`;
      console.error("Meta WhatsApp API error:", data.error);

      // Record failed dispatch in database
      await supabase.from("messages").insert({
        // @ts-expect-error Supabase admin client typing helper
        lead_id: leadId,
        direction: "outbound",
        sender_type: senderType,
        whatsapp_message_id: null,
        body: finalBody,
        status: "failed",
        payload: { error: data.error },
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const whatsappMessageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;

    // Record successful dispatch in database
    await supabase.from("messages").insert({
      // @ts-expect-error Supabase admin client typing helper
      lead_id: leadId,
      direction: "outbound",
      sender_type: senderType,
      whatsapp_message_id: whatsappMessageId,
      body: finalBody,
      status: "sent",
      payload: data,
    });

    // Record activity
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase admin client typing helper
      lead_id: leadId,
      activity_type: "whatsapp_message_sent",
      description: `WhatsApp message sent to buyer: "${finalBody.substring(0, 80)}..."`,
      metadata: { whatsapp_message_id: whatsappMessageId },
    });

    return {
      success: true,
      messageId: whatsappMessageId,
    };
  } catch (error) {
    console.error("WhatsApp dispatch network exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Meta WhatsApp Cloud API.",
    };
  }
}
