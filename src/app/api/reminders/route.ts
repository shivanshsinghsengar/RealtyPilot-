import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatInIST } from "@/lib/utils/date";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";

interface ReminderResult {
  visit_id: string;
  lead_name: string;
  phone: string;
  project_name: string;
  scheduled_ist: string;
  type: "24_hour" | "2_hour";
  status: "dispatched" | "skipped_opted_out" | "error";
  reason?: string;
}

interface VisitCandidate {
  id: string;
  lead_id: string;
  project_id: string;
  scheduled_at_utc: string;
  status: string;
  reminder_sent_24h: boolean;
  reminder_sent_2h: boolean;
  lead: {
    id: string;
    full_name: string;
    phone: string;
    opted_out: boolean;
  } | null;
  project: {
    id: string;
    name: string;
    location_area: string;
  } | null;
}

export async function GET(request: Request) {
  return handleReminders(request);
}

export async function POST(request: Request) {
  return handleReminders(request);
}

async function handleReminders(request: Request) {
  // Authorization check: either valid CRON_SECRET header or active staff session
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(expectedSecret) &&
    (authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret);

  let isStaffAuthorized = false;
  try {
    const staffClient = await createClient();
    const {
      data: { user },
    } = await staffClient.auth.getUser();
    if (user) isStaffAuthorized = true;
  } catch {
    // Handled below
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // In production, unauthenticated calls are strictly rejected with 401
  if (isProduction && !isCronAuthorized && !isStaffAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Valid CRON_SECRET or staff authentication required." },
      { status: 401 }
    );
  }

  // Placeholder mock response for local testing
  if (isPlaceholder) {
    return NextResponse.json({
      success: true,
      mode: "placeholder_mock",
      timestamp: new Date().toISOString(),
      summary: {
        total_scanned: 2,
        dispatched: 1,
        skipped_opted_out: 1,
      },
      results: [
        {
          visit_id: "v1000000-0000-0000-0000-000000000001",
          lead_name: "Priya Verma",
          phone: "+919826022222",
          project_name: "Narmada Greens",
          scheduled_ist: formatInIST(new Date(Date.now() + 7200000).toISOString()),
          type: "2_hour",
          status: "dispatched",
        },
        {
          visit_id: "v1000000-0000-0000-0000-000000000009",
          lead_name: "Kavita Jain (Opted Out)",
          phone: "+919826099999",
          project_name: "Bhojpal Enclave",
          scheduled_ist: formatInIST(new Date(Date.now() + 86400000).toISOString()),
          type: "24_hour",
          status: "skipped_opted_out",
          reason: "Lead revoked DPDP consent. Outbound message blocked.",
        },
      ],
    });
  }

  try {
    const supabase = createAdminClient();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // 24-hour window: visits scheduled between (now + 23h) and (now + 25h)
    const window24hStart = new Date(nowMs + 23 * 3600000).toISOString();
    const window24hEnd = new Date(nowMs + 25 * 3600000).toISOString();

    // 2-hour window: visits scheduled between now and (now + 2h15m)
    const window2hStart = nowIso;
    const window2hEnd = new Date(nowMs + 2.25 * 3600000).toISOString();

    // Query candidates
    const { data: visits, error: fetchError } = await supabase
      .from("visits")
      .select(
        `id, lead_id, project_id, scheduled_at_utc, status, reminder_sent_24h, reminder_sent_2h,
         lead:leads(id, full_name, phone, opted_out),
         project:projects(id, name, location_area)`
      )
      .in("status", ["scheduled", "confirmed", "rescheduled"]);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const candidateVisits = (visits as unknown as VisitCandidate[]) || [];
    const results: ReminderResult[] = [];

    for (const v of candidateVisits) {
      const scheduledMs = new Date(v.scheduled_at_utc).getTime();
      const lead = v.lead;
      const project = v.project;

      if (!lead || !project) continue;

      const istFormatted = formatInIST(v.scheduled_at_utc, "dd MMM yyyy, hh:mm a 'IST'");

      // Check 24-Hour Reminder
      if (
        !v.reminder_sent_24h &&
        scheduledMs >= new Date(window24hStart).getTime() &&
        scheduledMs <= new Date(window24hEnd).getTime()
      ) {
        if (lead.opted_out) {
          // DPDP Compliance: Skip message
          await supabase
            .from("visits")
            // @ts-expect-error Supabase admin client typing helper
            .update({ reminder_sent_24h: true })
            .eq("id", v.id);

          await supabase.from("activities").insert({
            // @ts-expect-error Supabase admin client typing helper
            lead_id: lead.id,
            activity_type: "reminder_skipped_opt_out",
            description: `24-hour visit reminder for ${project.name} skipped. Reason: DPDP Act opt-out consent revoked.`,
            metadata: { visit_id: v.id },
          });

          results.push({
            visit_id: v.id,
            lead_name: lead.full_name,
            phone: lead.phone,
            project_name: project.name,
            scheduled_ist: istFormatted,
            type: "24_hour",
            status: "skipped_opted_out",
            reason: "DPDP opt-out active",
          });
        } else {
          // Send 24-hour WhatsApp reminder
          const message24h = `🏡 *Site Visit Reminder - RealtyPilot*

Namaste ${lead.full_name} ji!

Kal aapki site visit scheduled hai:
📍 *${project.name}* (${project.location_area || "Bhopal"})
🕐 *${istFormatted}*

Kya aapko pickup ki zaroorat hai? Reply karein ya (0755) 123-4567 par call karein.

*RealtyPilot - RERA Verified Properties*`;

          const whatsappResult = await sendWhatsAppTextMessage({
            toPhone: lead.phone,
            messageText: message24h,
            leadId: lead.id,
            senderType: "ai_system",
            appendOptOutNotice: false,
          });

          // Mark sent & log activity
          await supabase
            .from("visits")
            // @ts-expect-error Supabase admin client typing helper
            .update({ reminder_sent_24h: true })
            .eq("id", v.id);

          await supabase.from("activities").insert({
            // @ts-expect-error Supabase admin client typing helper
            lead_id: lead.id,
            activity_type: "reminder_dispatched",
            description: `24-hour visit reminder sent via WhatsApp for ${project.name} on ${istFormatted}.`,
            metadata: {
              visit_id: v.id,
              type: "24_hour",
              channel: "whatsapp",
              whatsapp_success: whatsappResult.success,
              message_id: whatsappResult.messageId,
            },
          });

          results.push({
            visit_id: v.id,
            lead_name: lead.full_name,
            phone: lead.phone,
            project_name: project.name,
            scheduled_ist: istFormatted,
            type: "24_hour",
            status: whatsappResult.success ? "dispatched" : "error",
            reason: whatsappResult.success ? undefined : whatsappResult.error,
          });
        }
      }

      // Check 2-Hour Reminder
      if (
        !v.reminder_sent_2h &&
        scheduledMs >= new Date(window2hStart).getTime() &&
        scheduledMs <= new Date(window2hEnd).getTime()
      ) {
        if (lead.opted_out) {
          await supabase
            .from("visits")
            // @ts-expect-error Supabase admin client typing helper
            .update({ reminder_sent_2h: true })
            .eq("id", v.id);

          await supabase.from("activities").insert({
            // @ts-expect-error Supabase admin client typing helper
            lead_id: lead.id,
            activity_type: "reminder_skipped_opt_out",
            description: `2-hour immediate visit reminder for ${project.name} skipped. Reason: DPDP Act opt-out consent revoked.`,
            metadata: { visit_id: v.id },
          });

          results.push({
            visit_id: v.id,
            lead_name: lead.full_name,
            phone: lead.phone,
            project_name: project.name,
            scheduled_ist: istFormatted,
            type: "2_hour",
            status: "skipped_opted_out",
            reason: "DPDP opt-out active",
          });
        } else {
          // Send 2-hour immediate WhatsApp reminder
          const message2h = `⏰ *Urgent: Site Visit in 2 Hours!*

${lead.full_name} ji, aapki visit aaj hai:

📍 *${project.name}* (${project.location_area || "Bhopal"})
🕐 *${istFormatted}*

Humari team aapka intezaar kar rahi hai. Koi problem ho to turant call karein: (0755) 123-4567

*RealtyPilot - Bhopal's Trusted Real Estate Partner*`;

          const whatsappResult = await sendWhatsAppTextMessage({
            toPhone: lead.phone,
            messageText: message2h,
            leadId: lead.id,
            senderType: "ai_system",
            appendOptOutNotice: false,
          });

          await supabase
            .from("visits")
            // @ts-expect-error Supabase admin client typing helper
            .update({ reminder_sent_2h: true })
            .eq("id", v.id);

          await supabase.from("activities").insert({
            // @ts-expect-error Supabase admin client typing helper
            lead_id: lead.id,
            activity_type: "reminder_dispatched",
            description: `2-hour immediate visit reminder sent via WhatsApp for ${project.name} on ${istFormatted}.`,
            metadata: {
              visit_id: v.id,
              type: "2_hour",
              channel: "whatsapp",
              whatsapp_success: whatsappResult.success,
              message_id: whatsappResult.messageId,
            },
          });

          results.push({
            visit_id: v.id,
            lead_name: lead.full_name,
            phone: lead.phone,
            project_name: project.name,
            scheduled_ist: istFormatted,
            type: "2_hour",
            status: whatsappResult.success ? "dispatched" : "error",
            reason: whatsappResult.success ? undefined : whatsappResult.error,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_scanned: candidateVisits.length,
        actions_taken: results.length,
        dispatched: results.filter((r) => r.status === "dispatched").length,
        skipped_opted_out: results.filter((r) => r.status === "skipped_opted_out").length,
      },
      results,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to execute reminders scan",
      },
      { status: 500 }
    );
  }
}
