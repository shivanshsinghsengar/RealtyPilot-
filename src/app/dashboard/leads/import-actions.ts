"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeIndianPhoneNumber, INDIAN_PHONE_REGEX } from "@/lib/validations/lead";
import { Database, LeadSource, LeadStage } from "@/types/database.types";

export interface CSVImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; name: string; phone: string; reason: string }[];
}

// Valid sources aur stages jo CSV mein accept honge
const VALID_SOURCES: LeadSource[] = [
  "website_form", "meta_ad", "rera_public", "google_places",
  "referral", "direct_call", "walk_in",
];

/**
 * CSV text parse karta hai — header row detect karta hai automatically
 * Expected columns: name, phone, email (optional), budget (optional),
 *                   city (optional), source (optional), notes (optional)
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Header row — lowercase + trim
  const headers = lines[0].split(",").map((h) =>
    h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
  );

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted commas inside fields
    const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim().replace(/^"|"$/g, "");
    });
    rows.push(row);
  }

  return rows;
}

/**
 * CSV row se budget amount nikalta hai — handles "35L", "35 lakh", "3500000"
 */
function parseBudget(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const clean = val.toLowerCase().replace(/[₹,\s]/g, "");
  // "35l" or "35lakh" or "35 lakh"
  const lakhMatch = clean.match(/^(\d+(?:\.\d+)?)\s*l(?:akh)?/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
  // Plain number
  const num = parseFloat(clean);
  return isNaN(num) ? null : Math.round(num);
}

/**
 * CSV se leads bulk import karne ka Server Action
 * FormData mein "csv" key ke andar CSV text hona chahiye
 */
export async function importLeadsFromCSV(
  _prevState: CSVImportResult | null,
  formData: FormData
): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    success: false,
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // Auth check
  if (!isPlaceholder) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ...result, success: false, errors: [{ row: 0, name: "", phone: "", reason: "Unauthorized" }] };
    }
  }

  const csvFile = formData.get("csv");
  if (!csvFile) {
    return { ...result, errors: [{ row: 0, name: "", phone: "", reason: "Koi file select nahi ki" }] };
  }

  let csvText = "";
  if (csvFile instanceof File) {
    csvText = await csvFile.text();
  } else if (typeof csvFile === "string") {
    csvText = csvFile;
  }

  if (!csvText.trim()) {
    return { ...result, errors: [{ row: 0, name: "", phone: "", reason: "File empty hai" }] };
  }

  const rows = parseCSV(csvText);
  result.total = rows.length;

  if (rows.length === 0) {
    return { ...result, errors: [{ row: 0, name: "", phone: "", reason: "CSV mein koi data nahi mila" }] };
  }

  // Placeholder mode mein sirf simulate karo
  if (isPlaceholder) {
    result.success = true;
    result.imported = rows.length;
    revalidatePath("/dashboard/leads");
    return result;
  }

  const supabase = createAdminClient();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 is header

    // Name nikalo — multiple possible column names handle karo
    const rawName =
      row["name"] || row["full_name"] || row["naam"] || row["customer_name"] || "";
    const fullName = rawName.trim();

    // Phone nikalo
    const rawPhone =
      row["phone"] || row["mobile"] || row["contact"] || row["phone_number"] ||
      row["mobile_number"] || row["number"] || "";
    const phone = sanitizeIndianPhoneNumber(rawPhone.trim());

    if (!fullName) {
      result.errors.push({ row: rowNum, name: "", phone: rawPhone, reason: "Name missing hai" });
      result.skipped++;
      continue;
    }

    if (!phone || !INDIAN_PHONE_REGEX.test(phone)) {
      result.errors.push({
        row: rowNum,
        name: fullName,
        phone: rawPhone,
        reason: `Invalid Indian phone number: "${rawPhone}"`,
      });
      result.skipped++;
      continue;
    }

    // Optional fields
    const email = row["email"]?.trim() || null;
    const city = row["city"]?.trim() || "Bhopal";

    // Budget — "budget", "budget_max", "max_budget" column names handle karo
    const budgetRaw = row["budget"] || row["budget_max"] || row["max_budget"] || row["baje"] || "";
    const budgetMinRaw = row["budget_min"] || row["min_budget"] || "";
    const budgetMax = parseBudget(budgetRaw);
    const budgetMin = parseBudget(budgetMinRaw);

    // Source — validate karo
    const rawSource = (row["source"] || row["lead_source"] || "direct_call")
      .toLowerCase().trim().replace(/\s+/g, "_") as LeadSource;
    const source: LeadSource = VALID_SOURCES.includes(rawSource) ? rawSource : "direct_call";

    // Size
    const sizeRaw = row["size"] || row["plot_size"] || row["preferred_size"] || row["size_sqft"] || "";
    const preferredSize = sizeRaw ? parseFloat(sizeRaw) : null;

    // Timeline
    const timelineRaw = row["timeline"] || row["timeline_months"] || row["months"] || "";
    const timeline = timelineRaw ? parseInt(timelineRaw) : null;

    try {
      const insertPayload: Database["public"]["Tables"]["leads"]["Insert"] = {
        full_name: fullName,
        phone,
        email: email || null,
        city,
        budget_min: budgetMin,
        budget_max: budgetMax,
        preferred_size_sqft: preferredSize && !isNaN(preferredSize) ? preferredSize : null,
        timeline_months: timeline && !isNaN(timeline) ? timeline : null,
        loan_needed: false,
        purpose: "end_use",
        stage: "new" as LeadStage,
        source,
        score: 30,
        opted_out: false,
        needs_human_followup: false,
      };

      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        // @ts-expect-error Supabase admin client typing helper
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertError) {
        // Duplicate phone — skip silently
        if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique")) {
          result.errors.push({
            row: rowNum,
            name: fullName,
            phone,
            reason: "Yeh phone number already exist karta hai",
          });
          result.skipped++;
          continue;
        }
        result.errors.push({ row: rowNum, name: fullName, phone, reason: insertError.message });
        result.skipped++;
        continue;
      }

      const createdLead = newLead as unknown as { id: string };

      // DPDP Consent record
      await supabase.from("consents").insert({
        // @ts-expect-error Supabase admin client typing helper
        lead_id: createdLead.id,
        status: "granted",
        channel: "whatsapp",
        consent_text: "Bulk CSV import se add kiya gaya. Staff ne consent confirm kiya.",
      });

      // Activity log
      await supabase.from("activities").insert({
        // @ts-expect-error Supabase admin client typing helper
        lead_id: createdLead.id,
        activity_type: "lead_created",
        description: `Lead CSV import se add kiya gaya (Row ${rowNum}).`,
        metadata: { source: "csv_import", row: rowNum },
      });

      result.imported++;
    } catch (err) {
      result.errors.push({
        row: rowNum,
        name: fullName,
        phone,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
      result.skipped++;
    }
  }

  result.success = result.imported > 0;
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  return result;
}
