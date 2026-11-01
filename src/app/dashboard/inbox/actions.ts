"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { staffReplySchema } from "@/lib/validations/whatsapp";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/client";
import { ActionResult } from "@/app/dashboard/leads/actions";

interface LeadInboxRecipient {
  id: string;
  phone: string;
  full_name: string;
  opted_out: boolean;
}

/**
 * Verify staff authentication session
 */
async function verifyStaffSession(supabase: Awaited<ReturnType<typeof createClient>>) {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    return { id: "placeholder-staff-user", email: "staff@realtypilot.in" };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized. Active staff session required.");
  }

  return user;
}

/**
 * Server action for CRM staff to send an outbound WhatsApp message to a lead
 */
export async function sendStaffReplyAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    lead_id: formData.get("lead_id"),
    message: formData.get("message"),
  };

  const validation = staffReplySchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Validation failed.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { lead_id, message } = validation.data;

  // In placeholder mock mode
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath("/dashboard/inbox");
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);

    // 1. Fetch Lead phone & DPDP opt-out status
    const { data: rawLead, error: leadError } = await supabase
      .from("leads")
      .select("id, phone, full_name, opted_out")
      .eq("id", lead_id)
      .single();

    if (leadError || !rawLead) {
      return { success: false, error: "Lead not found in CRM." };
    }

    const lead = rawLead as unknown as LeadInboxRecipient;

    // 2. Strict DPDP Act enforcement: Never message an opted-out lead
    if (lead.opted_out) {
      return {
        success: false,
        error: "DPDP Compliance: This buyer has revoked consent for WhatsApp messaging. Outbound messages are blocked.",
      };
    }

    // 3. Dispatch official WhatsApp message via Meta Cloud API client
    const dispatchResult = await sendWhatsAppTextMessage({
      toPhone: lead.phone,
      messageText: message,
      leadId: lead.id,
      senderType: "agent",
      appendOptOutNotice: false, // staff reply within active 24h conversation window
    });

    if (!dispatchResult.success) {
      return {
        success: false,
        error: dispatchResult.error || "Failed to deliver message via WhatsApp Cloud API.",
      };
    }

    revalidatePath("/dashboard/inbox");
    revalidatePath(`/dashboard/leads/${lead_id}`);

    return {
      success: true,
      data: { messageId: dispatchResult.messageId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send WhatsApp reply.",
    };
  }
}
