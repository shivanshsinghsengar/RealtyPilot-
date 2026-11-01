import { z } from "zod";

/**
 * Standard Indian Mobile Phone Number Regex
 * Requires +91 prefix followed by 10 digits starting with 6, 7, 8, or 9
 */
export const INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;

/**
 * Robust Indian Phone Number Sanitizer
 * Strips formatting, extracts the 10-digit subscriber number, and prefixes +91
 */
export function sanitizeIndianPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If starts with 0 (e.g. 09826012345), strip the leading zero
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If starts with country code 91 and has 12 digits (e.g. 919826012345)
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }

  // If exactly 10 digits starting with 6-9
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  // Return formatted or original for regex validation to reject gracefully
  return digits.length > 0 ? `+${digits}` : phone;
}

export const leadStageEnum = z.enum([
  "new",
  "contacted",
  "qualified",
  "visit_scheduled",
  "visit_completed",
  "negotiation",
  "won",
  "lost",
]);

export const leadSourceEnum = z.enum([
  "website_form",
  "meta_ad",
  "rera_public",
  "google_places",
  "referral",
  "direct_call",
  "walk_in",
]);

export const leadPurposeEnum = z.enum(["end_use", "investment"]);

/**
 * Base lead object schema without effects to allow .partial() extension
 */
export const leadBaseSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .transform(sanitizeIndianPhoneNumber)
    .refine(
      (val) => INDIAN_PHONE_REGEX.test(val),
      "Invalid Indian mobile number. Must be a valid 10-digit number starting with 6-9 (e.g. +91 98260 12345)"
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address format")
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  city: z.string().trim().default("Bhopal"),
  budget_min: z
    .number()
    .min(0, "Minimum budget cannot be negative")
    .max(1000000000, "Budget exceeds maximum allowed limit (₹100 Cr)")
    .optional()
    .nullable(),
  budget_max: z
    .number()
    .min(0, "Maximum budget cannot be negative")
    .max(1000000000, "Budget exceeds maximum allowed limit (₹100 Cr)")
    .optional()
    .nullable(),
  preferred_size_sqft: z
    .number()
    .min(100, "Plot size must be at least 100 sq.ft.")
    .max(100000, "Plot size cannot exceed 1,00,000 sq.ft.")
    .optional()
    .nullable(),
  timeline_months: z
    .number()
    .int("Timeline must be an integer number of months")
    .min(1, "Timeline must be at least 1 month")
    .max(120, "Timeline cannot exceed 10 years (120 months)")
    .optional()
    .nullable(),
  loan_needed: z.boolean().default(false),
  purpose: leadPurposeEnum.default("end_use"),
  stage: leadStageEnum.default("new"),
  source: leadSourceEnum.default("website_form"),
  opted_out: z.boolean().default(false),
  consent_given: z.boolean().refine((val) => val === true, {
    message: "Explicit opt-in consent is mandatory under the DPDP Act for real estate communications",
  }),
});

/**
 * Zod validation schema for creating a Real Estate Lead in Bhopal with cross-field refinement
 */
export const leadCreateSchema = leadBaseSchema.refine(
  (data) => {
    if (data.budget_min !== null && data.budget_min !== undefined &&
        data.budget_max !== null && data.budget_max !== undefined) {
      return data.budget_max >= data.budget_min;
    }
    return true;
  },
  {
    message: "Maximum budget cannot be less than minimum budget",
    path: ["budget_max"],
  }
);

/**
 * Partial update schema for lead edits
 */
export const leadUpdateSchema = leadBaseSchema.partial();
