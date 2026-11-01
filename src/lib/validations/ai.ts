import { z } from "zod";

/**
 * Validation schema for updating buyer preferences via AI tool call
 */
export const updateBuyerPreferencesSchema = z.object({
  budget_min: z.number().positive().optional().nullable(),
  budget_max: z.number().positive().optional().nullable(),
  preferred_size_sqft: z.number().positive().optional().nullable(),
  timeline_months: z.number().int().min(0).max(60).optional().nullable(),
  loan_needed: z.boolean().optional().nullable(),
  purpose: z.enum(["end_use", "investment"]).optional().nullable(),
});

/**
 * Validation schema for scheduling a site visit via AI tool call
 */
export const scheduleSiteVisitSchema = z.object({
  project_name: z.string().min(2, "Project name required"),
  visit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "visit_date must be in YYYY-MM-DD format")
    .refine((dateStr) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(`${dateStr}T00:00:00`);
      return target >= today;
    }, "Visit date cannot be in the past"),
  visit_time: z
    .string()
    .min(2, "visit_time required (e.g. '11:00 AM' or '15:00')"),
  driver_pickup: z.boolean().default(false),
  pickup_address: z.string().optional().nullable(),
  plot_number: z.string().optional().nullable(),
});

/**
 * Validation schema for flagging a lead for human follow-up
 */
export const flagHumanFollowupSchema = z.object({
  reason: z.string().min(3, "Reason for human follow-up is required"),
  lead_notes: z.string().optional().nullable(),
});

/**
 * Validation schema for searching available plots
 */
export const searchPlotsSchema = z.object({
  project_name: z.string().optional().nullable(),
  max_budget: z.number().positive().optional().nullable(),
  preferred_size_sqft: z.number().positive().optional().nullable(),
});
