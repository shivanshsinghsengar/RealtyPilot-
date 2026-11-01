import { z } from "zod";

export const visitStatusEnum = z.enum([
  "scheduled",
  "confirmed",
  "completed",
  "rescheduled",
  "cancelled",
  "no_show",
]);

/**
 * Validates that YYYY-MM-DD corresponds to a real calendar date without rollover
 */
function isValidCalendarDate(dateStr: string): boolean {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

/**
 * Zod schema for booking a site visit to a Bhopal project (e.g. Narmada Greens / Bhojpal Enclave)
 */
export const bookVisitSchema = z
  .object({
    lead_id: z.string().uuid("Invalid lead ID specified"),
    project_id: z.string().uuid("Please select a Bhopal project"),
    visit_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine(isValidCalendarDate, "Specified date is not a valid calendar day"),
    visit_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm (24-hour format)")
      .refine((time) => {
        const [hours] = time.split(":").map(Number);
        // Bhopal site visits are conducted during daylight/business hours: 07:00 to 19:30 IST
        return hours >= 7 && hours <= 19;
      }, "Site visits must be scheduled between 07:00 AM and 07:30 PM IST (daylight hours)"),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      try {
        const isoString = `${data.visit_date}T${data.visit_time}:00+05:30`;
        const visitTimeMs = new Date(isoString).getTime();
        if (isNaN(visitTimeMs)) return false;

        const now = Date.now();
        // Must be in the future (allowing 5 min clock skew)
        const isFuture = visitTimeMs > now - 1000 * 60 * 5;
        // Cannot be scheduled more than 90 days in advance
        const within90Days = visitTimeMs < now + 1000 * 60 * 60 * 24 * 90;

        return isFuture && within90Days;
      } catch {
        return false;
      }
    },
    {
      message: "Site visit must be in the future and scheduled within 90 days",
      path: ["visit_date"],
    }
  );

/**
 * Zod schema for rescheduling an existing visit
 */
export const rescheduleVisitSchema = z
  .object({
    visit_id: z.string().uuid("Invalid visit ID specified"),
    visit_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine(isValidCalendarDate, "Specified date is not a valid calendar day"),
    visit_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm (24-hour format)")
      .refine((time) => {
        const [hours] = time.split(":").map(Number);
        return hours >= 7 && hours <= 19;
      }, "Site visits must be scheduled between 07:00 AM and 07:30 PM IST (daylight hours)"),
    reason: z
      .string()
      .trim()
      .max(500, "Reschedule reason cannot exceed 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      try {
        const isoString = `${data.visit_date}T${data.visit_time}:00+05:30`;
        const visitTimeMs = new Date(isoString).getTime();
        const now = Date.now();
        return !isNaN(visitTimeMs) && visitTimeMs > now - 1000 * 60 * 5 && visitTimeMs < now + 1000 * 60 * 60 * 24 * 90;
      } catch {
        return false;
      }
    },
    {
      message: "New visit date must be in the future and within 90 days",
      path: ["visit_date"],
    }
  );

/**
 * Zod schema for updating a visit status
 */
export const updateVisitStatusSchema = z.object({
  visit_id: z.string().uuid("Invalid visit ID format"),
  status: visitStatusEnum,
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
});
