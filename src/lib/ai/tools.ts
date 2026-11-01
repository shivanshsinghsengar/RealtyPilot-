import "server-only";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { istDateTimeToUTC } from "@/lib/utils/date";
import {
  updateBuyerPreferencesSchema,
  scheduleSiteVisitSchema,
  flagHumanFollowupSchema,
  searchPlotsSchema,
} from "@/lib/validations/ai";
import { getNearbyAmenitiesForProject } from "@/lib/places/client";

/**
 * 1. Function Declaration: get_available_projects_and_plots
 */
export const getAvailableProjectsAndPlotsDeclaration: FunctionDeclaration = {
  name: "get_available_projects_and_plots",
  description:
    "Queries live real estate inventory for verified projects and available plots in Bhopal (Narmada Greens at Kolar Road, Bhojpal Enclave at Hoshangabad Road). NEVER quote prices or availability without calling this tool.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      project_name: {
        type: SchemaType.STRING,
        description: "Name of the project to check ('Narmada Greens' or 'Bhojpal Enclave'). Omit to search all projects.",
      },
      max_budget: {
        type: SchemaType.NUMBER,
        description: "Maximum budget in Indian Rupees (INR), e.g. 3500000 for ₹35 Lakhs.",
      },
      preferred_size_sqft: {
        type: SchemaType.NUMBER,
        description: "Desired plot size in sq.ft (e.g. 1000, 1200, 1500, 2400).",
      },
    },
  },
};

/**
 * 2. Function Declaration: update_buyer_preferences
 */
export const updateBuyerPreferencesDeclaration: FunctionDeclaration = {
  name: "update_buyer_preferences",
  description:
    "Saves or updates qualified buyer requirements (budget, plot size, timeline, loan need, end-use vs investment) into the CRM lead record. Call this whenever the buyer reveals their preferences.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      budget_min: {
        type: SchemaType.NUMBER,
        description: "Minimum budget in INR (e.g. 2500000 for ₹25L).",
      },
      budget_max: {
        type: SchemaType.NUMBER,
        description: "Maximum budget in INR (e.g. 4000000 for ₹40L).",
      },
      preferred_size_sqft: {
        type: SchemaType.NUMBER,
        description: "Preferred plot area in sq.ft (e.g. 1000, 1500).",
      },
      timeline_months: {
        type: SchemaType.INTEGER,
        description: "Expected purchase timeline in months (e.g. 1 for immediate, 3 for 3 months, 6 for 6+ months).",
      },
      loan_needed: {
        type: SchemaType.BOOLEAN,
        description: "True if the buyer needs bank loan financing; false if self-funded.",
      },
      purpose: {
        type: SchemaType.STRING,
        description: "Primary objective: 'end_use' (self construction) or 'investment' (wealth appreciation).",
      },
    },
  },
};

/**
 * 3. Function Declaration: book_site_visit
 */
export const bookSiteVisitDeclaration: FunctionDeclaration = {
  name: "book_site_visit",
  description:
    "Schedules an official on-site visit for the buyer to inspect plots in Bhopal. Prompts for date, time, and optional free Bhopal cab pickup.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      project_name: {
        type: SchemaType.STRING,
        description: "Name of the project to visit ('Narmada Greens' or 'Bhojpal Enclave').",
      },
      visit_date: {
        type: SchemaType.STRING,
        description: "Date of visit in YYYY-MM-DD format (e.g. '2026-10-31').",
      },
      visit_time: {
        type: SchemaType.STRING,
        description: "Time of visit in IST (e.g. '11:00 AM' or '15:30').",
      },
      driver_pickup: {
        type: SchemaType.BOOLEAN,
        description: "True if the buyer requests free cab pickup from their location in Bhopal.",
      },
      pickup_address: {
        type: SchemaType.STRING,
        description: "Pickup location address in Bhopal if driver_pickup is true.",
      },
      plot_number: {
        type: SchemaType.STRING,
        description: "Optional specific plot number the buyer is interested in inspecting.",
      },
    },
    required: ["project_name", "visit_date", "visit_time"],
  },
};

/**
 * 4. Function Declaration: flag_human_followup
 */
export const flagHumanFollowupDeclaration: FunctionDeclaration = {
  name: "flag_human_followup",
  description:
    "Flags the lead for human staff follow-up when a buyer asks an unverified question, requests unauthorized price discounts, has complex legal/registry queries, or asks for facts not present in the verified database. Always call this and reply: 'Main team se confirm karke batata hu.'",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      reason: {
        type: SchemaType.STRING,
        description: "Detailed reason why human sales staff must follow up with this buyer.",
      },
      lead_notes: {
        type: SchemaType.STRING,
        description: "Optional additional context or customer verbatim notes.",
      },
    },
    required: ["reason"],
  },
};

/**
 * 5. Function Declaration: get_nearby_amenities
 */
export const getNearbyAmenitiesDeclaration: FunctionDeclaration = {
  name: "get_nearby_amenities",
  description:
    "Queries verified nearby schools, hospitals, railway stations, airport, and shopping centers in Bhopal for a given project (Narmada Greens at Kolar Road or Bhojpal Enclave at Hoshangabad Road). Returns exact distance in km, driving time in minutes, and key highlights. Always call this when a buyer asks about connectivity, schools, hospitals, or metro/railway station proximity.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      project_name: {
        type: SchemaType.STRING,
        description: "Name of the project ('Narmada Greens' or 'Bhojpal Enclave').",
      },
      category: {
        type: SchemaType.STRING,
        description: "Amenity category filter: 'school', 'hospital', 'transit', 'shopping', or 'all'.",
      },
      max_distance_km: {
        type: SchemaType.NUMBER,
        description: "Optional maximum distance in kilometers.",
      },
    },
    required: ["project_name"],
  },
};

/**
 * Aggregated Gemini Tool Definitions
 */
export const geminiToolDeclarations = [
  getAvailableProjectsAndPlotsDeclaration,
  updateBuyerPreferencesDeclaration,
  bookSiteVisitDeclaration,
  flagHumanFollowupDeclaration,
  getNearbyAmenitiesDeclaration,
];

// ============================================================================
// TOOL EXECUTORS (Connected to Supabase)
// ============================================================================

/**
 * Normalizes user time string to HH:mm format (e.g. "11:00 AM" -> "11:00", "4:30 PM" -> "16:30")
 */
function normalizeTimeTo24Hr(timeStr: string): string {
  const trimmed = timeStr.trim().toLowerCase();
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!ampmMatch) {
    return "11:00"; // default 11 AM if unparseable
  }

  let hours = parseInt(ampmMatch[1], 10);
  const minutes = ampmMatch[2] ? ampmMatch[2] : "00";
  const modifier = ampmMatch[3];

  if (modifier === "pm" && hours < 12) {
    hours += 12;
  }
  if (modifier === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

/**
 * Executor: get_available_projects_and_plots
 */
export async function executeGetAvailableProjectsAndPlots(args: any) {
  const parsed = searchPlotsSchema.safeParse(args);
  const { project_name, max_budget, preferred_size_sqft } = parsed.success
    ? parsed.data
    : { project_name: null, max_budget: null, preferred_size_sqft: null };

  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    // Return verified static data for Bhopal projects
    const allProjects = [
      {
        id: "p1000000-0000-0000-0000-000000000001",
        name: "Narmada Greens",
        location: "Kolar Road, Bhopal",
        rera_number: "P-BHP-23-4102",
        possession: "Ready for Registry & Immediate Construction",
        price_range: "₹25 Lakhs - ₹60 Lakhs (approx. ₹2,500/sq.ft)",
        available_plots: [
          { plot_number: "A-12", size_sqft: 1000, facing: "East", price: 2500000, status: "available" },
          { plot_number: "A-14", size_sqft: 1200, facing: "North", price: 3000000, status: "available" },
          { plot_number: "B-05", size_sqft: 1500, facing: "East", price: 3750000, status: "available" },
          { plot_number: "C-01", size_sqft: 2400, facing: "Corner / North-East", price: 6000000, status: "available" },
        ],
      },
      {
        id: "p1000000-0000-0000-0000-000000000002",
        name: "Bhojpal Enclave",
        location: "Hoshangabad Road (NH-46), Bhopal",
        rera_number: "P-BHP-24-4890",
        possession: "6 Months (Dec 2026)",
        price_range: "₹32 Lakhs - ₹65 Lakhs (approx. ₹2,650/sq.ft)",
        available_plots: [
          { plot_number: "E-04", size_sqft: 1200, facing: "East", price: 3200000, status: "available" },
          { plot_number: "E-09", size_sqft: 1500, facing: "West", price: 4000000, status: "available" },
          { plot_number: "F-02", size_sqft: 2000, facing: "North", price: 5300000, status: "available" },
        ],
      },
    ];

    if (project_name) {
      const match = allProjects.filter((p) =>
        p.name.toLowerCase().includes(project_name.toLowerCase())
      );
      return match.length > 0 ? match : allProjects;
    }

    return allProjects;
  }

  const supabase = createAdminClient();

  // Real Database Query
  let query = supabase.from("projects").select(`
    id,
    name,
    location_area,
    city,
    rera_number,
    possession_date,
    min_budget,
    max_budget,
    description,
    plots (
      id,
      plot_number,
      size_sqft,
      facing,
      price_total,
      status
    )
  `);

  if (project_name) {
    query = query.ilike("name", `%${project_name}%`);
  }

  const { data: projects, error } = await query;

  if (error || !projects) {
    return { error: "Failed to retrieve verified project catalog from database." };
  }

  // Filter available plots based on criteria
  const formatted = projects.map((p: any) => {
    let availablePlots = (p.plots || []).filter((plt: any) => plt.status === "available");

    if (max_budget) {
      availablePlots = availablePlots.filter((plt: any) => plt.price_total <= max_budget);
    }
    if (preferred_size_sqft) {
      availablePlots = availablePlots.filter(
        (plt: any) => Math.abs(plt.size_sqft - preferred_size_sqft) <= 300
      );
    }

    return {
      id: p.id,
      name: p.name,
      location: `${p.location_area}, ${p.city}`,
      rera_number: p.rera_number,
      possession_date: p.possession_date || "Ready for Registry",
      price_range: `₹${(p.min_budget / 100000).toFixed(1)}L - ₹${(p.max_budget / 100000).toFixed(1)}L`,
      available_plots_count: availablePlots.length,
      sample_available_plots: availablePlots.slice(0, 5),
    };
  });

  return formatted;
}

/**
 * Executor: update_buyer_preferences
 */
export async function executeUpdateBuyerPreferences(leadId: string, args: any) {
  const parsed = updateBuyerPreferencesSchema.safeParse(args);
  if (!parsed.success) {
    return { success: false, error: "Invalid preference parameters" };
  }

  const data = parsed.data;
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    return {
      success: true,
      message: "Lead preferences updated in demo mode.",
      updated_fields: data,
    };
  }

  const supabase = createAdminClient();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.budget_min !== undefined) updatePayload.budget_min = data.budget_min;
  if (data.budget_max !== undefined) updatePayload.budget_max = data.budget_max;
  if (data.preferred_size_sqft !== undefined)
    updatePayload.preferred_size_sqft = data.preferred_size_sqft;
  if (data.timeline_months !== undefined)
    updatePayload.timeline_months = data.timeline_months;
  if (data.loan_needed !== undefined) updatePayload.loan_needed = data.loan_needed;
  if (data.purpose !== undefined) updatePayload.purpose = data.purpose;

  // Advance stage to qualified if budget or size is captured
  if (data.budget_max || data.preferred_size_sqft) {
    updatePayload.stage = "qualified";
    updatePayload.score = 70;
  }

  const { error } = await supabase
    .from("leads")
    // @ts-expect-error Supabase admin client typing helper
    .update(updatePayload)
    .eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await supabase.from("activities").insert({
    // @ts-expect-error Supabase admin client typing helper
    lead_id: leadId,
    activity_type: "qualification_completed",
    description: `Buyer requirements captured by AI Agent: Size ${data.preferred_size_sqft || "N/A"} sqft, Budget ₹${data.budget_max ? (data.budget_max / 100000).toFixed(1) + "L" : "N/A"}, Purpose: ${data.purpose || "N/A"}.`,
  });

  return { success: true, message: "Buyer profile updated successfully." };
}

/**
 * Executor: book_site_visit
 */
export async function executeBookSiteVisit(leadId: string, args: any) {
  const parsed = scheduleSiteVisitSchema.safeParse(args);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid site visit parameters.",
    };
  }

  const {
    project_name,
    visit_date,
    visit_time,
    driver_pickup,
    pickup_address,
    plot_number,
  } = parsed.data;

  // Convert IST date & time to UTC
  const time24 = normalizeTimeTo24Hr(visit_time);
  let scheduledAtUtc: string;
  try {
    scheduledAtUtc = istDateTimeToUTC(visit_date, time24);
  } catch {
    scheduledAtUtc = new Date(`${visit_date}T11:00:00+05:30`).toISOString();
  }

  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    return {
      success: true,
      visit_id: `visit-mock-${Date.now()}`,
      project_name,
      scheduled_at_ist: `${visit_date} at ${visit_time}`,
      driver_pickup,
      pickup_address: pickup_address || "Bhopal (To be confirmed)",
      message: "Site visit confirmed and registered in CRM.",
    };
  }

  const supabase = createAdminClient();

  // Find project id
  const { data: rawProject } = await supabase
    .from("projects")
    .select("id, name")
    .ilike("name", `%${project_name}%`)
    .limit(1)
    .maybeSingle();

  const project = rawProject as unknown as { id: string; name: string } | null;

  const projectId =
    project?.id || "p1000000-0000-0000-0000-000000000001"; // Fallback to Narmada Greens

  // Optional: Find plot id if specified
  let plotId: string | null = null;
  if (plot_number) {
    const { data: plot } = await supabase
      .from("plots")
      .select("id")
      .eq("project_id", projectId)
      .eq("plot_number", plot_number)
      .maybeSingle();
    plotId = (plot as unknown as { id: string } | null)?.id || null;
  }

  // Insert site visit record
  const { data: newVisit, error: visitError } = await supabase
    .from("visits")
    .insert({
      // @ts-expect-error Supabase admin client typing helper
      lead_id: leadId,
      project_id: projectId,
      scheduled_at_utc: scheduledAtUtc,
      status: "scheduled",
      notes: `Auto-booked via WhatsApp AI Agent.${driver_pickup ? ` Pickup requested: ${pickup_address || "Bhopal"}` : ""}${plot_number ? ` Plot interest: ${plot_number}` : ""}`,
    })
    .select("id")
    .single();

  if (visitError) {
    return { success: false, error: visitError.message };
  }

  // Update lead stage to visit_scheduled & score to 85
  await supabase
    .from("leads")
    // @ts-expect-error Supabase admin client typing helper
    .update({
      stage: "visit_scheduled",
      score: 85,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  // Log activity
  await supabase.from("activities").insert({
    // @ts-expect-error Supabase admin client typing helper
    lead_id: leadId,
    activity_type: "site_visit_scheduled",
    description: `Site visit auto-booked by AI Agent for ${project_name} on ${visit_date} at ${visit_time} IST. Pickup: ${driver_pickup ? "Requested (" + (pickup_address || "Bhopal") + ")" : "Self-transport"}.`,
  });

  return {
    success: true,
    visit_id: (newVisit as unknown as { id: string })?.id,
    project_name: project?.name || project_name,
    scheduled_at_ist: `${visit_date} at ${visit_time}`,
    driver_pickup,
    pickup_address: pickup_address || null,
    message: "Site visit successfully booked.",
  };
}

/**
 * Executor: flag_human_followup
 */
export async function executeFlagHumanFollowup(leadId: string, args: any) {
  const parsed = flagHumanFollowupSchema.safeParse(args);
  const reason = parsed.success ? parsed.data.reason : "Buyer asked complex query requiring staff attention";
  const notes = parsed.success ? parsed.data.lead_notes : "";

  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    return {
      success: true,
      message: "Human follow-up flag set in demo mode.",
      reason,
    };
  }

  const supabase = createAdminClient();

  // Flag lead in CRM
  await supabase
    .from("leads")
    // @ts-expect-error Supabase admin client typing helper
    .update({
      needs_human_followup: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  // Log activity
  await supabase.from("activities").insert({
    // @ts-expect-error Supabase admin client typing helper
    lead_id: leadId,
    activity_type: "human_followup_requested",
    description: `AI Agent flagged buyer for human follow-up: "${reason}". ${notes ? "Notes: " + notes : ""}`,
  });

  return {
    success: true,
    message: "Lead flagged for human follow-up.",
    confirmed_message_to_buyer: "Main team se confirm karke batata hu.",
  };
}

/**
 * Executor: get_nearby_amenities
 */
export async function executeGetNearbyAmenities(args: any) {
  try {
    const result = await getNearbyAmenitiesForProject({
      project_name: args.project_name || "Narmada Greens",
      category: args.category || "all",
      max_distance_km: args.max_distance_km,
    });
    return result;
  } catch (error) {
    console.error("Locality intelligence lookup error:", error);
    return {
      error: "Unable to retrieve nearby amenities at this moment.",
    };
  }
}
