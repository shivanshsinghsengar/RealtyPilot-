"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { leadCreateSchema, leadStageEnum } from "@/lib/validations/lead";
import { Database, LeadStage, LeadSource } from "@/types/database.types";
import { z } from "zod";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const uuidSchema = z.string().uuid("Invalid lead identifier format.");
const booleanSchema = z.boolean();
const noteSchema = z
  .string()
  .trim()
  .min(2, "Note must be at least 2 characters")
  .max(2000, "Note cannot exceed 2000 characters");

function getClientIP(): string {
  try {
    const headersList = headers();
    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    return headersList.get("x-real-ip") || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
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

export async function createLeadAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const budgetMinRaw = formData.get("budget_min");
  const budgetMaxRaw = formData.get("budget_max");
  const sizeRaw = formData.get("preferred_size_sqft");
  const timelineRaw = formData.get("timeline_months");
  const emailRaw = formData.get("email");

  const rawData = {
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: emailRaw && String(emailRaw).trim() !== "" ? String(emailRaw).trim() : null,
    city: formData.get("city") ? String(formData.get("city")).trim() : "Bhopal",
    budget_min: budgetMinRaw && String(budgetMinRaw).trim() !== "" ? Number(budgetMinRaw) : null,
    budget_max: budgetMaxRaw && String(budgetMaxRaw).trim() !== "" ? Number(budgetMaxRaw) : null,
    preferred_size_sqft: sizeRaw && String(sizeRaw).trim() !== "" ? Number(sizeRaw) : null,
    timeline_months: timelineRaw && String(timelineRaw).trim() !== "" ? Number(timelineRaw) : null,
    loan_needed: formData.get("loan_needed") === "true" || formData.get("loan_needed") === "on",
    purpose: formData.get("purpose") || "end_use",
    stage: formData.get("stage") || "new",
    source: formData.get("source") || "website_form",
    opted_out: false,
    consent_given: formData.get("consent_given") === "true" || formData.get("consent_given") === "on",
  };

  const validation = leadCreateSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { consent_given, ...leadData } = validation.data;

  // In placeholder mock mode
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath("/dashboard/leads");
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);
    const clientIP = getClientIP();

    const insertPayload: Database["public"]["Tables"]["leads"]["Insert"] = {
      full_name: leadData.full_name,
      phone: leadData.phone,
      email: leadData.email,
      city: leadData.city,
      budget_min: leadData.budget_min,
      budget_max: leadData.budget_max,
      preferred_size_sqft: leadData.preferred_size_sqft,
      timeline_months: leadData.timeline_months,
      loan_needed: leadData.loan_needed,
      purpose: leadData.purpose as "end_use" | "investment",
      stage: leadData.stage as LeadStage,
      source: leadData.source as LeadSource,
      score: 30, // Initial base score for manual CRM creation
      opted_out: false,
      needs_human_followup: false,
    };

    // 1. Insert Lead
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique")) {
        return {
          success: false,
          error: "A lead with this phone number already exists in RealtyPilot.",
        };
      }
      return { success: false, error: insertError.message };
    }

    const createdLead = newLead as unknown as Database["public"]["Tables"]["leads"]["Row"];

    // 2. Insert DPDP Consent record with audit IP
    await supabase.from("consents").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: createdLead.id,
      status: "granted",
      channel: "whatsapp",
      consent_text: "Explicit opt-in recorded by staff via CRM Lead Entry Modal.",
      recorded_ip: clientIP,
    });

    // 3. Insert Activity Log
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: createdLead.id,
      activity_type: "lead_created",
      description: `Lead created manually in CRM by staff.`,
      metadata: { source: leadData.source, ip: clientIP },
    });

    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard");
    return { success: true, data: createdLead };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create lead",
    };
  }
}

export async function updateLeadStageAction(
  leadId: string,
  newStage: string
): Promise<ActionResult> {
  const idValidation = uuidSchema.safeParse(leadId);
  if (!idValidation.success) {
    return { success: false, error: "Invalid lead ID format." };
  }

  const stageValidation = leadStageEnum.safeParse(newStage);
  if (!stageValidation.success) {
    return { success: false, error: "Invalid pipeline stage specified." };
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath("/dashboard/leads");
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);

    const { error: updateError } = await supabase
      .from("leads")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .update({ stage: stageValidation.data as LeadStage })
      .eq("id", idValidation.data);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log stage change activity
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: idValidation.data,
      activity_type: "stage_changed",
      description: `Pipeline stage updated to: ${newStage.replace(/_/g, " ").toUpperCase()}`,
      metadata: { new_stage: newStage },
    });

    revalidatePath("/dashboard/leads");
    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update pipeline stage",
    };
  }
}

export async function addLeadNoteAction(
  leadId: string,
  noteText: string
): Promise<ActionResult> {
  const idValidation = uuidSchema.safeParse(leadId);
  if (!idValidation.success) {
    return { success: false, error: "Invalid lead ID format." };
  }

  const validation = noteSchema.safeParse(noteText);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);

    const { error } = await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: idValidation.data,
      activity_type: "staff_note",
      description: validation.data,
      metadata: { channel: "crm_note" },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save note",
    };
  }
}

export async function toggleLeadOptOutAction(
  leadId: string,
  optedOut: boolean
): Promise<ActionResult> {
  const idValidation = uuidSchema.safeParse(leadId);
  if (!idValidation.success) {
    return { success: false, error: "Invalid lead ID format." };
  }

  const optOutValidation = booleanSchema.safeParse(optedOut);
  if (!optOutValidation.success) {
    return { success: false, error: "Invalid opt-out boolean flag." };
  }

  const isOptedOut = optOutValidation.data;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);
    const clientIP = getClientIP();

    const { error } = await supabase
      .from("leads")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .update({ opted_out: isOptedOut })
      .eq("id", idValidation.data);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update consent audit status
    await supabase.from("consents").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: idValidation.data,
      status: isOptedOut ? "revoked" : "granted",
      channel: "whatsapp",
      consent_text: isOptedOut
        ? "DPDP opt-out triggered manually in CRM by staff."
        : "Consent re-enabled manually in CRM by staff.",
      recorded_ip: clientIP,
    });

    // Log activity
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: idValidation.data,
      activity_type: isOptedOut ? "opt_out_recorded" : "opt_in_recorded",
      description: isOptedOut
        ? "Lead opted out. Outbound automated WhatsApp messages blocked per DPDP Act."
        : "Lead consent restored.",
    });

    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update opt-out status",
    };
  }
}

export async function toggleHumanFollowupAction(
  leadId: string,
  needsFollowup: boolean
): Promise<ActionResult> {
  const idValidation = uuidSchema.safeParse(leadId);
  if (!idValidation.success) {
    return { success: false, error: "Invalid lead ID format." };
  }

  const followupValidation = booleanSchema.safeParse(needsFollowup);
  if (!followupValidation.success) {
    return { success: false, error: "Invalid follow-up boolean flag." };
  }

  const isNeeded = followupValidation.data;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);

    const { error } = await supabase
      .from("leads")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .update({ needs_human_followup: isNeeded })
      .eq("id", idValidation.data);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: idValidation.data,
      activity_type: isNeeded ? "human_followup_flagged" : "human_followup_cleared",
      description: isNeeded
        ? "Flagged for immediate human follow-up by staff."
        : "Human follow-up flag cleared by staff.",
    });

    revalidatePath(`/dashboard/leads/${idValidation.data}`);
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update follow-up flag",
    };
  }
}
