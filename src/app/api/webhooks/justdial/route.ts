import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * JustDial Email Webhook Handler
 * 
 * Receives forwarded JustDial enquiry emails, extracts lead info, adds to CRM
 * 
 * Email format from JustDial:
 * From: enquiries@justdial.com
 * Subject: New Enquiry for RealtyPilot
 * 
 * Body:
 * Name: Rahul Sharma
 * Phone: +919876543210
 * Email: rahul@example.com
 * Message: Interested in plot...
 */

interface JustDialLead {
  name: string;
  phone: string;
  email?: string;
  message?: string;
}

/**
 * Parse JustDial email body to extract lead information
 */
function parseJustDialEmail(emailBody: string): JustDialLead | null {
  try {
    const nameMatch = emailBody.match(/Name:\s*(.+)/i);
    const phoneMatch = emailBody.match(/Phone:\s*(\+?\d{10,13})/i);
    const emailMatch = emailBody.match(/Email:\s*([^\s]+@[^\s]+)/i);
    const messageMatch = emailBody.match(/Message:\s*(.+?)(?:\n|$)/is);

    if (!nameMatch || !phoneMatch) {
      return null; // Must have at least name and phone
    }

    return {
      name: nameMatch[1].trim(),
      phone: phoneMatch[1].trim().replace(/\s|-/g, ""),
      email: emailMatch ? emailMatch[1].trim() : undefined,
      message: messageMatch ? messageMatch[1].trim() : undefined,
    };
  } catch (error) {
    console.error("Email parsing error:", error);
    return null;
  }
}

/**
 * POST /api/webhooks/justdial
 * 
 * Accepts email forwarding or webhook from email services like:
 * - Zapier (Email Parser → HTTP POST)
 * - Make.com (Email → Webhook)
 * - Cloudflare Email Workers
 * 
 * Payload format:
 * {
 *   "from": "enquiries@justdial.com",
 *   "subject": "New Enquiry for RealtyPilot",
 *   "body": "Name: Rahul\nPhone: +919876543210\n..."
 * }
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { body, from, subject } = payload;

    // Verify it's from JustDial
    if (!from || !from.includes("justdial")) {
      return NextResponse.json(
        { error: "Not a JustDial email" },
        { status: 400 }
      );
    }

    // Parse email body
    const leadData = parseJustDialEmail(body);

    if (!leadData) {
      return NextResponse.json(
        { error: "Could not parse email" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Normalize phone number
    let phone = leadData.phone;
    if (!phone.startsWith("+91")) {
      phone = "+91" + phone.replace(/^0/, ""); // Remove leading 0 if present
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      // Update existing lead with new enquiry
      await supabase
        .from("activities")
        .insert({
          // @ts-expect-error Supabase typing
          lead_id: existing.id,
          activity_type: "note_added",
          description: `New JustDial enquiry: ${leadData.message || "No message"}`,
          metadata: {
            source: "justdial_webhook",
            email_subject: subject,
          },
        });

      return NextResponse.json({
        success: true,
        leadId: existing.id,
        status: "updated",
        message: "Existing lead updated with new enquiry",
      });
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        // @ts-expect-error Supabase typing
        full_name: leadData.name,
        phone: phone,
        email: leadData.email || null,
        city: "Bhopal",
        source: "justdial",
        stage: "qualified", // JustDial leads are high intent
        score: 75, // Default high score for JustDial enquiries
        budget_min: 2500000, // ₹25L default
        budget_max: 6000000, // ₹60L default
        opted_out: false,
        needs_human_followup: true, // High priority - flag for immediate follow-up
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Lead insert error:", insertError);
      throw insertError;
    }

    const leadId = (newLead as any).id;

    // Add consent record
    await supabase.from("consents").insert({
      // @ts-expect-error Supabase typing
      lead_id: leadId,
      status: "pending",
      channel: "whatsapp",
      consent_text: "Lead from JustDial enquiry. Awaiting opt-in confirmation.",
    });

    // Add initial activity with enquiry message
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase typing
      lead_id: leadId,
      activity_type: "lead_created",
      description: `JustDial enquiry received: ${leadData.message || "No message provided"}`,
      metadata: {
        source: "justdial_webhook",
        email_subject: subject,
        raw_message: leadData.message,
      },
    });

    console.log(`✅ JustDial lead added: ${leadData.name} (${phone})`);

    return NextResponse.json({
      success: true,
      leadId,
      status: "created",
      message: "Lead successfully added to CRM",
    });
  } catch (error) {
    console.error("JustDial webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/justdial (for testing)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/webhooks/justdial",
    method: "POST",
    description: "Receives JustDial email webhooks from Zapier/Make.com",
    example: {
      from: "enquiries@justdial.com",
      subject: "New Enquiry for RealtyPilot",
      body: "Name: Rahul Sharma\nPhone: +919876543210\nEmail: rahul@example.com\nMessage: Interested in plot near Kolar Road",
    },
  });
}
