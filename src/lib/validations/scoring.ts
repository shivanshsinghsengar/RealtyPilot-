import { z } from "zod";

export const scoreRecalculateSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID specified").optional(),
  dry_run: z.boolean().default(false),
});
