import { z } from "zod";

/**
 * Validation for staff outbound replies from CRM Inbox
 */
export const staffReplySchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID specified"),
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4096, "WhatsApp text messages cannot exceed 4096 characters"),
});

/**
 * Validation for Meta webhook subscription verification query parameters
 */
export const webhookVerificationSchema = z.object({
  mode: z.string().min(1),
  verify_token: z.string().min(1),
  challenge: z.string().min(1),
});
