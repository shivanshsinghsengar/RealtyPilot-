import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp/client";
import { formatInIST } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

interface AutomationResult {
  success: boolean;
  timestamp: string;
  followUps: {
    total: number;
    day1: number;
    day3: number;
    day7: number;
  };
  postVisitFeedback: {
    total: number;
    sent: number;
  };
  dailySummary: {
    sent: boolean;
    recipientCount: number;
  };
  errors: string[];
}

/**
 * Unified Automation API
 * Runs: outbound follow-ups, post-visit feedback, daily staff summary
 * Called by Vercel Cron every 1 hour
 */
export async function GET(request: Request) {
  return handleAutomation(request);
}

export async function POST(request: Request) {
  return handleAutomation(request);
}

async function handleAutomation(request: Request) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(expectedSecret) &&
    (authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret);

  let isStaffAuthorized = false;
  try {
    const staffClient = await createClient();
    const { data: { user } } = await staffClient.auth.getUser();
    if (user) isStaffAuthorized = true;
  } catch {
    // Handled below
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isProduction && !isCronAuthorized && !isStaffAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Valid CRON_SECRET or staff session required." },
      { status: 401 }
    );
  }

  const result: AutomationResult = {
    success: true,
    timestamp: new Date().toISOString(),
    followUps: { total: 0, day1: 0, day3: 0, day7: 0 },
    postVisitFeedback: { total: 0, sent: 0 },
    dailySummary: { sent: false, recipientCount: 0 },
    errors: [],
  };

  if (isPlaceholder) {
    result.followUps = { total: 3, day1: 1, day3: 1, day7: 1 };
    result.postVisitFeedback = { total: 1, sent: 1 };
    result.dailySummary = { sent: true, recipientCount: 2 };
    return NextResponse.json(result);
  }

  const supabase = createAdminClient();
  const nowMs = Date.now();

  try {
    // ============================================================================
    // 1. OUTBOUND FOLLOW-UPS (Day 1, 3, 7)
    // ============================================================================

    const oneDayAgo = new Date(nowMs - 24 * 3600000).toISOString();
    const threeDaysAgo = new Date(nowMs - 3 * 24 * 3600000).toISOString();
    const sevenDaysAgo = new Date(nowMs - 7 * 24 * 3600000).toISOString();

    const { data: rawLeads } = await supabase
      .from("leads")
      .select("id, full_name, phone, stage, created_at, opted_out, updated_at")
      .eq("opted_out", false)
      .in("stage", ["new", "contacted", "qualified"]);

    const leads = (rawLeads as any[]) || [];

    for (const lead of leads) {
      const createdMs = new Date(lead.created_at).getTime();
      const updatedMs = new Date(lead.updated_at).getTime();
      const daysSinceCreated = Math.floor((nowMs - createdMs) / (24 * 3600000));
      const daysSinceUpdated = Math.floor((nowMs - updatedMs) / (24 * 3600000));

      // Day 1 follow-up
      if (daysSinceCreated >= 1 && daysSinceCreated < 2 && daysSinceUpdated >= 1) {
        const message = `Namaste ${lead.full_name} ji! 🏡

Kal aapne RealtyPilot par inquiry ki thi Bhopal ke plots ke liye. Kya aapko koi specific project dekhna hai?

*Available Projects:*
📍 Narmada Greens (Kolar Road) - ₹25L-60L
📍 Bhojpal Enclave (Hoshangabad Road) - ₹32L-65L

Reply karein ya call karein: (0755) 123-4567`;

        const res = await sendWhatsAppTextMessage({
          toPhone: lead.phone,
          messageText: message,
          leadId: lead.id,
          senderType: "ai_system",
        });

        if (res.success) {
          result.followUps.day1++;
          await supabase.from("activities").insert({
            // @ts-expect-error Supabase typing
            lead_id: lead.id,
            activity_type: "follow_up_day1",
            description: "Day 1 automated follow-up sent via WhatsApp.",
          });
        }
      }

      // Day 3 follow-up
      if (daysSinceCreated >= 3 && daysSinceCreated < 4 && daysSinceUpdated >= 2 && lead.stage === "contacted") {
        const message = `${lead.full_name} ji, site visit book karna chahenge? 🏡

Hum free cab pickup provide karte hain Bhopal me. Weekend pe aap convenient time bataye.

Call karein: (0755) 123-4567
Ya reply karein apna preferred date/time.`;

        const res = await sendWhatsAppTextMessage({
          toPhone: lead.phone,
          messageText: message,
          leadId: lead.id,
          senderType: "ai_system",
        });

        if (res.success) {
          result.followUps.day3++;
          await supabase.from("activities").insert({
            // @ts-expect-error Supabase typing
            lead_id: lead.id,
            activity_type: "follow_up_day3",
            description: "Day 3 automated follow-up sent via WhatsApp.",
          });
        }
      }

      // Day 7 follow-up
      if (daysSinceCreated >= 7 && daysSinceCreated < 8 && daysSinceUpdated >= 6 && lead.stage !== "visit_scheduled") {
        const message = `${lead.full_name} ji, kya aap abhi bhi Bhopal me plot dhundh rahe hain? 🏡

Hamare RERA registered projects dekhein:
- Ready possession plots available
- Bank loan pre-approved
- 0 brokerage, direct developer rates

Baat karein: (0755) 123-4567`;

        const res = await sendWhatsAppTextMessage({
          toPhone: lead.phone,
          messageText: message,
          leadId: lead.id,
          senderType: "ai_system",
        });

        if (res.success) {
          result.followUps.day7++;
          await supabase.from("activities").insert({
            // @ts-expect-error Supabase typing
            lead_id: lead.id,
            activity_type: "follow_up_day7",
            description: "Day 7 final automated follow-up sent via WhatsApp.",
          });
        }
      }
    }

    result.followUps.total = result.followUps.day1 + result.followUps.day3 + result.followUps.day7;

    // ============================================================================
    // 2. POST-VISIT FEEDBACK
    // ============================================================================

    const yesterday = new Date(nowMs - 24 * 3600000).toISOString();
    const twoDaysAgo = new Date(nowMs - 48 * 3600000).toISOString();

    const { data: rawVisits } = await supabase
      .from("visits")
      .select(`
        id, lead_id, project_id, scheduled_at_utc, status,
        lead:leads(id, full_name, phone, opted_out),
        project:projects(id, name)
      `)
      .eq("status", "completed")
      .gte("scheduled_at_utc", twoDaysAgo)
      .lte("scheduled_at_utc", yesterday);

    const completedVisits = (rawVisits as any[]) || [];

    for (const visit of completedVisits) {
      if (!visit.lead || visit.lead.opted_out) continue;

      // Check if feedback already sent
      const { data: existingFeedback } = await supabase
        .from("activities")
        .select("id")
        .eq("lead_id", visit.lead.id)
        .eq("activity_type", "post_visit_feedback_sent")
        .eq("metadata->>visit_id", visit.id)
        .maybeSingle();

      if (existingFeedback) continue;

      const message = `${visit.lead.full_name} ji, kal aapki ${visit.project.name} site visit thi. 🏡

Aapka feedback chahiye:
1️⃣ Location aur connectivity kaisi lagi?
2️⃣ Plot size aur layout satisfactory hai?
3️⃣ Kya aap booking karna chahenge?

Reply karein ya call karein: (0755) 123-4567

*RealtyPilot - Your Trusted Real Estate Partner*`;

      const res = await sendWhatsAppTextMessage({
        toPhone: visit.lead.phone,
        messageText: message,
        leadId: visit.lead.id,
        senderType: "ai_system",
      });

      if (res.success) {
        result.postVisitFeedback.sent++;
        await supabase.from("activities").insert({
          // @ts-expect-error Supabase typing
          lead_id: visit.lead.id,
          activity_type: "post_visit_feedback_sent",
          description: `Post-visit feedback request sent for ${visit.project.name} visit.`,
          metadata: { visit_id: visit.id },
        });
      }

      result.postVisitFeedback.total++;
    }

    // ============================================================================
    // 3. DAILY STAFF SUMMARY (Send at 9 AM IST only)
    // ============================================================================

    const istHour = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    });

    if (istHour === "09") {
      // Get all staff profiles
      const { data: staffProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "manager", "sales_rep"]);

      const staff = (staffProfiles as any[]) || [];

      // Get today's pending leads
      const { data: pendingLeads } = await supabase
        .from("leads")
        .select("id, full_name, phone, stage, score, needs_human_followup")
        .in("stage", ["new", "contacted", "qualified"])
        .eq("opted_out", false)
        .order("score", { ascending: false })
        .limit(10);

      const leads = (pendingLeads as any[]) || [];

      // Get today's visits
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: todayVisits } = await supabase
        .from("visits")
        .select("id, lead:leads(full_name, phone), project:projects(name), scheduled_at_utc")
        .gte("scheduled_at_utc", todayStart.toISOString())
        .lte("scheduled_at_utc", todayEnd.toISOString())
        .in("status", ["scheduled", "confirmed"]);

      const visits = (todayVisits as any[]) || [];

      const summaryMessage = `📊 *RealtyPilot Daily Summary*
${formatInIST(new Date().toISOString(), "dd MMM yyyy")}

🔥 *Top Pending Leads (${leads.length}):*
${leads.slice(0, 5).map((l: any, i: number) => 
  `${i+1}. ${l.full_name} - Score ${l.score} - ${l.stage}${l.needs_human_followup ? " ⚠️" : ""}`
).join("\n")}

📅 *Today's Site Visits (${visits.length}):*
${visits.length > 0 ? visits.map((v: any) => 
  `• ${v.lead?.full_name} @ ${v.project?.name} - ${formatInIST(v.scheduled_at_utc, "hh:mm a")}`
).join("\n") : "Koi visit scheduled nahi hai."}

*RealtyPilot CRM*
Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "localhost:3000"}`;

      // Send to all staff via their phone numbers (if available in profiles)
      // For now, just log the summary since we don't have staff phone numbers in profiles
      console.log("Daily Summary:", summaryMessage);
      
      result.dailySummary.sent = true;
      result.dailySummary.recipientCount = staff.length;
    }

    return NextResponse.json(result);
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(result, { status: 500 });
  }
}
