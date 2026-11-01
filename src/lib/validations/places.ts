import { z } from "zod";

export const rawCategoryEnum = z.enum([
  "all",
  "school",
  "hospital",
  "transit",
  "shopping",
  "landmark",
]);

export const amenityCategoryEnum = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase().trim() : "all"),
  rawCategoryEnum
);

export const nearbyAmenitiesQuerySchema = z.object({
  project_name: z.string().trim().min(2, "Project name is required"),
  category: amenityCategoryEnum.default("all"),
  max_distance_km: z.number().positive().max(50).optional().nullable(),
});
