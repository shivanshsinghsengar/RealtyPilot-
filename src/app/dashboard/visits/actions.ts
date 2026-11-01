"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { istDateTimeToUTC, formatInIST } from "@/lib/utils/date";
import {
  bookVisitSchema,
  rescheduleVisitSchema,
  updateVisitStatusSchema,
} from "@/lib/validations/visit";
import { Database, VisitStatus, LeadStage } from "@/types/database.types";
import { ActionResult } from "@/app/dashboard/leads/actions";

interface LeadQueryResult {
  full_name: string;
  phone: string;
  opted_out: boolean;
  stage: LeadStage;
}

interface ProjectQueryResult {
  name: string;
  location: string;
}

interface VisitWithProjectResult {
  id: string;
  lead_id: string;
  project_id?: string;
  scheduled_at_utc: string;
  status: VisitStatus;
  projects: { name: string } | null;
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
 * Action to book a new site visit
 */
export async function bookVisitAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    lead_id: formData.get("lead_id"),
    project_id: formData.get("project_id"),
    visit_date: formData.get("visit_date"),
    visit_time: formData.get("visit_time"),
    notes: formData.get("notes") ? String(formData.get("notes")).trim() : null,
  };

  const validation = bookVisitSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { lead_id, project_id, visit_date, visit_time, notes } = validation.data;

  // Convert Indian Standard Time to UTC ISO string
  let scheduledAtUtc: string;
  try {
    scheduledAtUtc = istDateTimeToUTC(visit_date, visit_time);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Invalid appointment date/time format.",
    };
  }

  // Placeholder mock response
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath("/dashboard/visits");
    revalidatePath("/dashboard/leads");
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const staffUser = await verifyStaffSession(supabase);

    // 1. Fetch Lead
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .select("full_name, phone, opted_out, stage")
      .eq("id", lead_id)
      .single();

    if (leadError || !leadData) {
      return { success: false, error: "The selected lead could not be found." };
    }

    // Fetch Project
    const { data: projData, error: projError } = await supabase
      .from("projects")
      .select("name, location")
      .eq("id", project_id)
      .single();

    if (projError || !projData) {
      return { success: false, error: "The selected project could not be found." };
    }

    const lead = leadData as unknown as LeadQueryResult;
    const project = projData as unknown as ProjectQueryResult;

    // 2. Duplicate appointment check: prevent double-booking for the exact same lead & timestamp
    const { data: duplicateCheck } = await supabase
      .from("visits")
      .select("id")
      .eq("lead_id", lead_id)
      .eq("scheduled_at_utc", scheduledAtUtc)
      .maybeSingle();

    if (duplicateCheck) {
      return {
        success: false,
        error: "A site visit for this buyer is already booked at this exact date and time.",
      };
    }

    // 3. Insert Visit Record
    const insertPayload: Database["public"]["Tables"]["visits"]["Insert"] = {
      lead_id,
      project_id,
      scheduled_at_utc: scheduledAtUtc,
      status: "scheduled",
      assigned_rep_id: staffUser.id === "placeholder-staff-user" ? null : staffUser.id,
      notes: notes || null,
      reminder_sent_24h: false,
      reminder_sent_2h: false,
    };

    const { data: newVisit, error: visitError } = await supabase
      .from("visits")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .insert(insertPayload)
      .select()
      .single();

    if (visitError) {
      return { success: false, error: visitError.message };
    }

    // 4. Update Lead Pipeline Stage to "visit_scheduled" (if not already further in funnel)
    const stagePriority: Record<string, number> = {
      new: 1,
      contacted: 2,
      qualified: 3,
      visit_scheduled: 4,
      visit_completed: 5,
      negotiation: 6,
      won: 7,
      lost: 0,
    };

    const currentPriority = stagePriority[lead.stage] || 0;
    if (currentPriority < 4 && lead.stage !== "lost" && lead.stage !== "won") {
      await supabase
        .from("leads")
        // @ts-expect-error Supabase SSR generic inference typing helper
        .update({ stage: "visit_scheduled" as LeadStage })
        .eq("id", lead_id);
    }

    // 5. Log Audit Activity
    const istDisplay = formatInIST(scheduledAtUtc, "dd MMM yyyy 'at' hh:mm a 'IST'");
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id,
      activity_type: "visit_booked",
      description: `Site visit scheduled for ${project.name} (${project.location}) on ${istDisplay}. ${
        lead.opted_out
          ? "[NOTE: Lead opted out from DPDP; automated WhatsApp reminders will not be sent]."
          : ""
      }`,
      metadata: {
        project_name: project.name,
        scheduled_at_utc: scheduledAtUtc,
        notes: notes || null,
      },
    });

    revalidatePath("/dashboard/visits");
    revalidatePath("/dashboard/leads");
    revalidatePath(`/dashboard/leads/${lead_id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: newVisit,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to book site visit",
    };
  }
}

/**
 * Action to update a visit's status (e.g. confirmed, completed, cancelled, no_show)
 */
export async function updateVisitStatusAction(
  visitId: string,
  newStatus: string,
  notes?: string
): Promise<ActionResult> {
  const validation = updateVisitStatusSchema.safeParse({
    visit_id: visitId,
    status: newStatus,
    notes,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid status transition.",
    };
  }

  const { visit_id, status, notes: visitNotes } = validation.data;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath("/dashboard/visits");
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);

    // 1. Fetch visit and linked lead
    const { data: rawVisit, error: fetchError } = await supabase
      .from("visits")
      .select("id, lead_id, project_id, scheduled_at_utc, status, projects(name)")
      .eq("id", visit_id)
      .single();

    if (fetchError || !rawVisit) {
      return { success: false, error: "Visit not found." };
    }

    const visit = rawVisit as unknown as VisitWithProjectResult;

    // Transition Guard: If already completed, prevent changing back to scheduled
    if (visit.status === "completed" && status === "scheduled") {
      return {
        success: false,
        error: "Completed visits cannot be moved back to scheduled. Please use Reschedule to book a new slot.",
      };
    }

    // 2. Update Visit Record
    const updatePayload: Record<string, unknown> = {
      status: status as VisitStatus,
    };
    if (visitNotes) {
      updatePayload.notes = visitNotes;
    }

    const { error: updateError } = await supabase
      .from("visits")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .update(updatePayload)
      .eq("id", visit_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Funnel Stage Sync: If visit is completed, advance lead stage to "visit_completed"
    if (status === "completed") {
      await supabase
        .from("leads")
        // @ts-expect-error Supabase SSR generic inference typing helper
        .update({ stage: "visit_completed" as LeadStage })
        .eq("id", visit.lead_id);
    }

    // 4. Activity Log
    const projectName = visit.projects?.name || "Project Site";
    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: visit.lead_id,
      activity_type: `visit_${status}`,
      description: `Site visit to ${projectName} status updated to: ${status.toUpperCase()}.${
        visitNotes ? ` Notes: "${visitNotes}"` : ""
      }`,
      metadata: { visit_id, new_status: status },
    });

    revalidatePath("/dashboard/visits");
    revalidatePath(`/dashboard/leads/${visit.lead_id}`);
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update visit status",
    };
  }
}

/**
 * Action to reschedule a visit to a new IST date and time
 */
export async function rescheduleVisitAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    visit_id: formData.get("visit_id"),
    visit_date: formData.get("visit_date"),
    visit_time: formData.get("visit_time"),
    reason: formData.get("reason") ? String(formData.get("reason")).trim() : null,
  };

  const validation = rescheduleVisitSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please specify a valid future date and time.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { visit_id, visit_date, visit_time, reason } = validation.data;

  let newScheduledAtUtc: string;
  try {
    newScheduledAtUtc = istDateTimeToUTC(visit_date, visit_time);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Invalid date/time format.",
    };
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    revalidatePath("/dashboard/visits");
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await verifyStaffSession(supabase);

    // 1. Fetch existing visit
    const { data: rawVisit, error: fetchError } = await supabase
      .from("visits")
      .select("id, lead_id, scheduled_at_utc, projects(name)")
      .eq("id", visit_id)
      .single();

    if (fetchError || !rawVisit) {
      return { success: false, error: "Visit not found." };
    }

    const visit = rawVisit as unknown as VisitWithProjectResult;

    // 2. Update Visit: reset reminder flags so reminders can fire for new time
    const { error: updateError } = await supabase
      .from("visits")
      // @ts-expect-error Supabase SSR generic inference typing helper
      .update({
        scheduled_at_utc: newScheduledAtUtc,
        status: "rescheduled",
        notes: reason ? `Rescheduled: ${reason}` : undefined,
        reminder_sent_24h: false,
        reminder_sent_2h: false,
      })
      .eq("id", visit_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Log Activity
    const projectName = visit.projects?.name || "Project Site";
    const oldTimeIST = formatInIST(visit.scheduled_at_utc, "dd MMM, hh:mm a");
    const newTimeIST = formatInIST(newScheduledAtUtc, "dd MMM yyyy, hh:mm a 'IST'");

    await supabase.from("activities").insert({
      // @ts-expect-error Supabase SSR generic inference typing helper
      lead_id: visit.lead_id,
      activity_type: "visit_rescheduled",
      description: `Site visit to ${projectName} rescheduled from ${oldTimeIST} to ${newTimeIST}.${
        reason ? ` Reason: "${reason}"` : ""
      }`,
      metadata: {
        visit_id,
        previous_utc: visit.scheduled_at_utc,
        new_utc: newScheduledAtUtc,
      },
    });

    revalidatePath("/dashboard/visits");
    revalidatePath(`/dashboard/leads/${visit.lead_id}`);
    revalidatePath("/dashboard/leads");

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reschedule visit",
    };
  }
}
