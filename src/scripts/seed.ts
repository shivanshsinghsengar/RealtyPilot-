import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

// Load .env.local without external dependencies
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSeed() {
  console.log("==================================================");
  console.log(" RealtyPilot - Phase 1 Database Seed Runner");
  console.log("==================================================");

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("placeholder") ||
    serviceRoleKey.includes("placeholder")
  ) {
    console.log("ℹ️  Notice: Placeholder Supabase credentials detected in .env.local.");
    console.log("\n📋 To seed your live Supabase project:");
    console.log("   1. Go to your Supabase Project: https://supabase.com/dashboard");
    console.log("   2. Click 'SQL Editor' in the left sidebar.");
    console.log("   3. Run: supabase/migrations/20261027000000_phase1_schema.sql");
    console.log("   4. Run: supabase/seed.sql");
    console.log("   5. Update NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    console.log("==================================================");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Connecting to: ${supabaseUrl}`);

  // Test connection to projects table
  const { error: pingError } = await supabase.from("projects").select("id").limit(1);

  if (pingError && pingError.code === "42P01") {
    console.error("❌ Tables do not exist yet in Supabase!");
    console.log("👉 Please run the migration script in Supabase SQL Editor first:");
    console.log("   supabase/migrations/20261027000000_phase1_schema.sql\n");
    process.exit(1);
  }

  console.log("✅ Database schema verified. Seeding projects, plots, and leads...");

  // 1. Projects Upsert
  const { error: projErr } = await supabase.from("projects").upsert(
    [
      {
        id: "a1000000-0000-0000-0000-000000000001",
        name: "Narmada Greens",
        location_area: "Kolar Road",
        city: "Bhopal",
        rera_number: "P-BPL-22-3841",
        possession_date: "2026-12-31",
        min_budget: 2800000,
        max_budget: 5500000,
        description:
          "Premium gated plotted development on Kolar Road with 40ft wide roads, underground electricity, club house, and 24x7 security.",
      },
      {
        id: "a2000000-0000-0000-0000-000000000002",
        name: "Bhojpal Enclave",
        location_area: "Hoshangabad Road",
        city: "Bhopal",
        rera_number: "P-BPL-23-4190",
        possession_date: "2027-06-30",
        min_budget: 4200000,
        max_budget: 8500000,
        description:
          "Luxury plotted campus & modern 3BHK/4BHK duplex community near Misrod, Hoshangabad Road.",
      },
    ],
    { onConflict: "rera_number" }
  );

  if (projErr) {
    console.error("Error upserting projects:", projErr.message);
  } else {
    console.log("✓ 2 Bhopal Projects verified (Narmada Greens & Bhojpal Enclave)");
  }

  // 2. Leads Upsert
  const sampleLeads = [
    {
      id: "c1000000-0000-0000-0000-000000000001",
      full_name: "Rohit Sharma",
      phone: "+919826011111",
      email: "rohit.sharma@example.com",
      city: "Bhopal",
      budget_min: 2500000,
      budget_max: 3500000,
      preferred_size_sqft: 1000,
      timeline_months: 1,
      loan_needed: true,
      purpose: "end_use",
      stage: "qualified",
      score: 75,
      source: "website_form",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000002",
      full_name: "Priya Verma",
      phone: "+919826022222",
      email: "priya.verma@example.com",
      city: "Bhopal",
      budget_min: 3500000,
      budget_max: 5000000,
      preferred_size_sqft: 1500,
      timeline_months: 3,
      loan_needed: false,
      purpose: "end_use",
      stage: "visit_scheduled",
      score: 85,
      source: "meta_ad",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000003",
      full_name: "Amit Tiwari",
      phone: "+919826033333",
      email: "amit.tiwari@example.com",
      city: "Bhopal",
      budget_min: 4000000,
      budget_max: 6000000,
      preferred_size_sqft: 1800,
      timeline_months: 6,
      loan_needed: true,
      purpose: "investment",
      stage: "contacted",
      score: 50,
      source: "google_places",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000004",
      full_name: "Neha Saxena",
      phone: "+919826044444",
      email: "neha.saxena@example.com",
      city: "Bhopal",
      budget_min: 6000000,
      budget_max: 8500000,
      preferred_size_sqft: 2400,
      timeline_months: 2,
      loan_needed: false,
      purpose: "end_use",
      stage: "visit_completed",
      score: 90,
      source: "referral",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000005",
      full_name: "Vikram Singh Patel",
      phone: "+919826055555",
      email: "vikram.patel@example.com",
      city: "Bhopal",
      budget_min: 2800000,
      budget_max: 4000000,
      preferred_size_sqft: 1200,
      timeline_months: 1,
      loan_needed: true,
      purpose: "end_use",
      stage: "negotiation",
      score: 95,
      source: "website_form",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000006",
      full_name: "Sunita Chouhan",
      phone: "+919826066666",
      email: "sunita.c@example.com",
      city: "Bhopal",
      budget_min: 3000000,
      budget_max: 4500000,
      preferred_size_sqft: 1200,
      timeline_months: 12,
      loan_needed: false,
      purpose: "investment",
      stage: "new",
      score: 30,
      source: "rera_public",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000007",
      full_name: "Rajesh Mishra",
      phone: "+919826077777",
      email: "rajesh.mishra@example.com",
      city: "Bhopal",
      budget_min: 7000000,
      budget_max: 9000000,
      preferred_size_sqft: 2000,
      timeline_months: 1,
      loan_needed: false,
      purpose: "end_use",
      stage: "won",
      score: 100,
      source: "direct_call",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000008",
      full_name: "Deepak Malviya",
      phone: "+919826088888",
      email: "deepak.m@example.com",
      city: "Bhopal",
      budget_min: 2000000,
      budget_max: 2500000,
      preferred_size_sqft: 800,
      timeline_months: null,
      loan_needed: true,
      purpose: "end_use",
      stage: "lost",
      score: 15,
      source: "meta_ad",
      opted_out: false,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000009",
      full_name: "Kavita Jain (Opted Out)",
      phone: "+919826099999",
      email: "kavita.jain@example.com",
      city: "Bhopal",
      budget_min: 3500000,
      budget_max: 5000000,
      preferred_size_sqft: 1500,
      timeline_months: null,
      loan_needed: false,
      purpose: "end_use",
      stage: "contacted",
      score: 10,
      source: "website_form",
      opted_out: true,
      needs_human_followup: false,
    },
    {
      id: "c1000000-0000-0000-0000-000000000010",
      full_name: "Suresh Yadav (Special Request)",
      phone: "+919826012345",
      email: "suresh.yadav@example.com",
      city: "Bhopal",
      budget_min: 5000000,
      budget_max: 7500000,
      preferred_size_sqft: 2000,
      timeline_months: 2,
      loan_needed: true,
      purpose: "end_use",
      stage: "qualified",
      score: 70,
      source: "website_form",
      opted_out: false,
      needs_human_followup: true,
    },
  ];

  const { error: leadErr } = await supabase.from("leads").upsert(sampleLeads, { onConflict: "phone" });
  if (leadErr) {
    console.error("Error upserting leads:", leadErr.message);
  } else {
    console.log("✓ 10 Leads seeded successfully.");
  }

  // Count leads
  const { count, error: leadCountErr } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  if (leadCountErr) {
    console.error("Error checking leads count:", leadCountErr.message);
  } else {
    console.log(`✓ Total leads currently in database: ${count ?? 0}`);
  }

  console.log("==================================================");
  console.log("✅ Phase 1 database seed completed successfully.");
  console.log("==================================================");
}

runSeed().catch((err) => {
  console.error("Fatal error running seed:", err);
  process.exit(1);
});
