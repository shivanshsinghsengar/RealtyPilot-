import { NextResponse } from "next/server";
import { verifyWhatsAppWebhookSignature } from "@/lib/whatsapp/signature";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeIndianPhoneNumber } from "@/lib/validations/lead";
import { webhookVerificationSchema } from "@/lib/validations/whatsapp";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/client";
import { generateAgentResponse, ConversationHistoryMessage } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

interface LeadLookupRecord {
  id: string;
  full_name: string;
  opted_out: boolean;
  stage: string;
}

/**
 * GET Handler: Meta Webhook Subscription Verification Challenge
 * Meta calls this endpoint with hub.mode, hub.verify_token, and hub.challenge
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawParams = {
    mode: searchParams.get("hub.mode") || "",
    verify_token: searchParams.get("hub.verify_token") || "",
    challenge: searchParams.get("hub.challenge") || "",
  };

  const validation = webhookVerificationSchema.safeParse(rawParams);
  if (!validation.success) {
    return new Response("Bad Request: Missing or invalid verification parameters.", { status: 400 });
  }

  const { mode, verify_token: token, challenge } = validation.data;
  const configuredToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // In development placeholder mode
  if (!configuredToken || configuredToken.includes("placeholder")) {
    if (mode === "subscribe" && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  if (mode === "subscribe" && token === configuredToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden: Invalid verification token.", { status: 403 });
}

/**
 * POST Handler: Inbound WhatsApp Messages & Delivery Status Updates
 * Verifies SHA-256 HMAC signature from Meta before processing.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
  }

  // 1. SHA-256 HMAC Signature Verification
  const isSignatureValid = verifyWhatsAppWebhookSignature(rawBody, signature);
  if (!isSignatureValid) {
    console.error("WhatsApp webhook rejected: Invalid SHA-256 signature.");
    return NextResponse.json({ error: "Invalid signature verification." }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
  }

  // Acknowledge non-WhatsApp events immediately
  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const supabase = createAdminClient();

  try {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // A. Process Inbound Messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const msg of value.messages) {
            const wamid = msg.id;
            const fromRaw = msg.from; // e.g. "919826012345"
            const formattedPhone = sanitizeIndianPhoneNumber(fromRaw);

            const contacts = value.contacts || [];
            const senderProfile = contacts.find((c: any) => c.wa_id === fromRaw);
            const contactName = senderProfile?.profile?.name || "WhatsApp Inquirer";

            // Extract message text (handles text, button reply, or interactive list reply)
            let messageText = "";
            if (msg.type === "text" && msg.text?.body) {
              messageText = msg.text.body.trim();
            } else if (msg.type === "button" && msg.button?.text) {
              messageText = msg.button.text.trim();
            } else if (msg.type === "interactive") {
              messageText =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                "[Interactive Response]";
            } else {
              messageText = `[${msg.type?.toUpperCase() || "MEDIA"} ATTACHMENT]`;
            }

            if (!messageText) continue;

            // 1. Check for DPDP STOP / OPT-OUT keywords
            const isOptOutCommand = /^(stop|unsubscribe|cancel|opt\s*out|roko|band\s*karo)$/i.test(
              messageText.toLowerCase()
            );
            const isOptInCommand = /^(start|unstop|subscribe|chalu\s*karo)$/i.test(
              messageText.toLowerCase()
            );

            // 2. Find or Auto-Create Lead (handles multiple phone formats)
            let leadId: string;
            let { data: rawExistingLead } = await supabase
              .from("leads")
              .select("id, full_name, opted_out, stage")
              .eq("phone", formattedPhone)
              .maybeSingle();

            // Fallback match without leading +91 or with local digits
            if (!rawExistingLead && formattedPhone.startsWith("+91")) {
              const localDigits = formattedPhone.slice(3);
              const retry = await supabase
                .from("leads")
                .select("id, full_name, opted_out, stage")
                .or(`phone.eq.${localDigits},phone.eq.0${localDigits}`)
                .maybeSingle();
              rawExistingLead = retry.data;
            }

            const existingLead = rawExistingLead as unknown as LeadLookupRecord | null;

            if (existingLead) {
              leadId = existingLead.id;

              if (isOptOutCommand && !existingLead.opted_out) {
                // Record opt-out
                await supabase
                  .from("leads")
                  // @ts-expect-error Supabase admin client typing helper
                  .update({ opted_out: true })
                  .eq("id", leadId);

                await supabase.from("consents").insert({
                  // @ts-expect-error Supabase admin client typing helper
                  lead_id: leadId,
                  status: "revoked",
                  channel: "whatsapp",
                  consent_text: `Buyer texted "${messageText}" via WhatsApp. Opt-out recorded per DPDP Act.`,
                });

                await supabase.from("activities").insert({
                  // @ts-expect-error Supabase admin client typing helper
                  lead_id: leadId,
                  activity_type: "opt_out_received",
                  description: `Buyer opted out via WhatsApp text ("${messageText}"). Automated outbound messages blocked per DPDP Act.`,
                });
              } else if (isOptInCommand && existingLead.opted_out) {
                // Restore consent
                await supabase
                  .from("leads")
                  // @ts-expect-error Supabase admin client typing helper
                  .update({ opted_out: false })
                  .eq("id", leadId);

                await supabase.from("consents").insert({
                  // @ts-expect-error Supabase admin client typing helper
                  lead_id: leadId,
                  status: "granted",
                  channel: "whatsapp",
                  consent_text: `Buyer re-enabled consent via WhatsApp text "${messageText}".`,
                });

                await supabase.from("activities").insert({
                  // @ts-expect-error Supabase admin client typing helper
                  lead_id: leadId,
                  activity_type: "opt_in_received",
                  description: `Buyer restored consent via WhatsApp text ("${messageText}").`,
                });
              }
            } else {
              // Auto-create new lead from inbound WhatsApp conversation
              const { data: newLead } = await supabase
                .from("leads")
                .insert({
                  // @ts-expect-error Supabase admin client typing helper
                  full_name: contactName,
                  phone: formattedPhone,
                  city: "Bhopal",
                  source: "direct_call", // inbound conversation
                  stage: "new",
                  score: 40,
                  opted_out: isOptOutCommand,
                  needs_human_followup: false,
                })
                .select("id")
                .single();

              const createdRecord = newLead as unknown as { id: string } | null;
              leadId = createdRecord?.id || `temp-${Date.now()}`;

              // Record initial consent
              await supabase.from("consents").insert({
                // @ts-expect-error Supabase admin client typing helper
                lead_id: leadId,
                status: isOptOutCommand ? "revoked" : "granted",
                channel: "whatsapp",
                consent_text: `Inbound WhatsApp conversation initiated by buyer.`,
              });

              await supabase.from("activities").insert({
                // @ts-expect-error Supabase admin client typing helper
                lead_id: leadId,
                activity_type: "lead_created",
                description: `New lead created automatically from inbound WhatsApp inquiry by ${contactName} (${formattedPhone}).`,
              });
            }

            // 3. Store message record & trigger responses (strictly deduplicated by wamid)
            const { data: existingMsg } = await supabase
              .from("messages")
              .select("id")
              .eq("whatsapp_message_id", wamid)
              .maybeSingle();

            if (!existingMsg) {
              const cappedMessageText = messageText.slice(0, 2048);

              await supabase.from("messages").insert({
                // @ts-expect-error Supabase admin client typing helper
                lead_id: leadId,
                direction: "inbound",
                sender_type: "lead",
                whatsapp_message_id: wamid,
                body: cappedMessageText,
                status: "delivered",
                payload: msg,
              });

              await supabase.from("activities").insert({
                // @ts-expect-error Supabase admin client typing helper
                lead_id: leadId,
                activity_type: "whatsapp_message_received",
                description: `Received WhatsApp message from buyer: "${cappedMessageText.substring(0, 100)}"`,
                metadata: { wamid },
              });

              // 4. Send DPDP Opt-out Confirmation if buyer texted STOP
              if (isOptOutCommand) {
                await sendWhatsAppTextMessage({
                  toPhone: formattedPhone,
                  messageText:
                    "Aapko RealtyPilot ke updates se unsubscribe kar diya gaya hai. Agar aap dobara plots aur duplexes ke updates chahte hain, to 'START' reply karein.",
                  leadId,
                  senderType: "ai_system",
                  appendOptOutNotice: false,
                });
              } else {
                // 5. Trigger RealtyPilot AI Sales Agent (Gemini 1.5) for consented buyers
                const isLeadOptedOut = existingLead ? existingLead.opted_out : false;

                if (!isLeadOptedOut) {
                  try {
                    // Fetch last 8 messages for context
                    const { data: rawHistory } = await supabase
                      .from("messages")
                      .select("direction, sender_type, body")
                      .eq("lead_id", leadId)
                      .order("created_at", { ascending: true })
                      .limit(8);

                    const history =
                      (rawHistory as unknown as ConversationHistoryMessage[]) || [];

                    // Generate response from AI Sales Agent with function calling & guardrails
                    const agentResult = await generateAgentResponse(
                      leadId,
                      cappedMessageText,
                      history
                    );

                    if (agentResult.replyText) {
                      await sendWhatsAppTextMessage({
                        toPhone: formattedPhone,
                        messageText: agentResult.replyText,
                        leadId,
                        senderType: "ai_system",
                        appendOptOutNotice: false,
                      });
                    }
                  } catch (aiError) {
                    console.error("AI Sales Agent invocation failed:", aiError);
                  }
                }
              }
            }
          }
        }

        // B. Process Message Delivery Status Receipts (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const wamid = statusObj.id;
            const newStatus = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'

            if (["sent", "delivered", "read", "failed"].includes(newStatus)) {
              await supabase
                .from("messages")
                // @ts-expect-error Supabase admin client typing helper
                .update({ status: newStatus })
                .eq("whatsapp_message_id", wamid);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook event processing error." },
      { status: 500 }
    );
  }
}
