/**
 * RealtyPilot Automated Test Suite
 * Validates Lead Scoring Engine, Webhook Security, AI Guardrails, DPDP Compliance, and IST Utilities.
 */
import crypto from "crypto";
import { calculateLeadScore } from "../lib/scoring/engine";
import { verifyWhatsAppWebhookSignature } from "../lib/whatsapp/signature";
import { formatInIST } from "../lib/utils/date";
import { BHOPAL_PROJECTS_LOCALITY } from "../lib/places/bhopal-data";
import { scoreRecalculateSchema } from "../lib/validations/scoring";
import { leadCreateSchema } from "../lib/validations/lead";
import { REALTYPILOT_SYSTEM_PROMPT } from "../lib/ai/prompts";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${errorMsg}`);
  }
}

console.log("\n=======================================================");
console.log("  RealtyPilot Test Suite (Phase 9 Quality & Security)  ");
console.log("=======================================================\n");

// -----------------------------------------------------------------------------
// 1. LEAD SCORING ENGINE TESTS
// -----------------------------------------------------------------------------
console.log("▶ Running Lead Scoring Engine Tests...");

runTest("Score: Target budget (₹35L) receives max 25 points", () => {
  const result = calculateLeadScore({
    id: "test-1",
    stage: "qualified",
    budget_max: 3500000,
    opted_out: false,
  });
  const budgetFactor = result.breakdown.find((f) => f.id === "budget");
  assert(budgetFactor?.points === 25, `Expected 25 points, got ${budgetFactor?.points}`);
  assert(budgetFactor?.status === "achieved", "Expected status achieved");
});

runTest("Score: 1000 sq.ft standard plot receives 15 points", () => {
  const result = calculateLeadScore({
    id: "test-2",
    stage: "qualified",
    preferred_size_sqft: 1000,
    opted_out: false,
  });
  const sizeFactor = result.breakdown.find((f) => f.id === "plot_size");
  assert(sizeFactor?.points === 15, `Expected 15 points, got ${sizeFactor?.points}`);
});

runTest("Score: Negative budget & timeline do not award unearned points", () => {
  const result = calculateLeadScore({
    id: "test-3",
    stage: "new",
    budget_max: -500000,
    timeline_months: -2,
    preferred_size_sqft: -1200,
    opted_out: false,
  });
  const budgetFactor = result.breakdown.find((f) => f.id === "budget");
  const sizeFactor = result.breakdown.find((f) => f.id === "plot_size");
  assert(budgetFactor?.points === 0, `Negative budget should give 0 pts, got ${budgetFactor?.points}`);
  assert(sizeFactor?.points === 0, `Negative size should give 0 pts, got ${sizeFactor?.points}`);
});

runTest("Score: DPDP Opt-out caps score at 20 points and updates nextBestAction", () => {
  const result = calculateLeadScore({
    id: "test-4",
    stage: "visit_completed",
    budget_max: 5000000,
    preferred_size_sqft: 1500,
    timeline_months: 1,
    loan_needed: false,
    opted_out: true,
  }, {
    hasCompletedVisit: true,
  });
  assert(result.score <= 20, `Opted out lead score must be <= 20, got ${result.score}`);
  assert(result.tier === "cold", `Opted out tier must be cold, got ${result.tier}`);
  assert(result.nextBestAction.includes("DPDP Notice"), "Next action must include DPDP Notice");
});

runTest("Score: Completed visit promotes to Hot tier (80+)", () => {
  const result = calculateLeadScore({
    id: "test-5",
    stage: "visit_completed",
    budget_max: 4500000,
    preferred_size_sqft: 1500,
    timeline_months: 1,
    loan_needed: false,
    source: "direct_call",
    purpose: "end_use",
    opted_out: false,
  }, {
    hasCompletedVisit: true,
  });
  assert(result.score >= 80, `Expected Hot score (>=80), got ${result.score}`);
  assert(result.tier === "hot", `Expected tier hot, got ${result.tier}`);
});

// -----------------------------------------------------------------------------
// 2. WHATSAPP WEBHOOK HMAC SHA-256 SIGNATURE TESTS
// -----------------------------------------------------------------------------
console.log("\n▶ Running WhatsApp Webhook Security Tests...");

runTest("Webhook Security: Valid SHA-256 signature passes verification", () => {
  const secret = "test_meta_app_secret_123456789";
  process.env.WHATSAPP_APP_SECRET = secret;
  const rawBody = JSON.stringify({ event: "messages", from: "+919826011111" });

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const signature = `sha256=${hmac.digest("hex")}`;

  const isValid = verifyWhatsAppWebhookSignature(rawBody, signature);
  assert(isValid === true, "Valid HMAC signature should pass verification");
});

runTest("Webhook Security: Tampered payload fails verification", () => {
  const secret = "test_meta_app_secret_123456789";
  process.env.WHATSAPP_APP_SECRET = secret;
  const rawBody = JSON.stringify({ event: "messages", from: "+919826011111" });
  const tamperedBody = JSON.stringify({ event: "messages", from: "+919826099999" });

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const signature = `sha256=${hmac.digest("hex")}`;

  const isValid = verifyWhatsAppWebhookSignature(tamperedBody, signature);
  assert(isValid === false, "Tampered payload should be rejected");
});

runTest("Webhook Security: Missing signature header is rejected", () => {
  const isValid = verifyWhatsAppWebhookSignature("{}", null);
  assert(isValid === false, "Null signature header must be rejected");
});

// -----------------------------------------------------------------------------
// 3. ZERO-HALLUCINATION AI GUARDRAILS TESTS
// -----------------------------------------------------------------------------
console.log("\n▶ Running Zero-Hallucination AI Guardrails Tests...");

runTest("AI Rules: System prompt mandates fallback phrase 'Main team se confirm karke batata hu'", () => {
  assert(
    REALTYPILOT_SYSTEM_PROMPT.includes("Main team se confirm karke batata hu"),
    "AI prompt must strictly specify the required fallback Hindi phrase"
  );
});

runTest("AI Rules: System prompt forbids inventing prices, dates, or RERA IDs", () => {
  assert(
    REALTYPILOT_SYSTEM_PROMPT.toUpperCase().includes("NEVER INVENT"),
    "AI prompt must contain strict NEVER INVENT directive"
  );
  assert(
    REALTYPILOT_SYSTEM_PROMPT.includes("flag_human_followup"),
    "AI prompt must specify flag_human_followup tool calling"
  );
});

// -----------------------------------------------------------------------------
// 4. DATE & IST TIMEZONE TESTS
// -----------------------------------------------------------------------------
console.log("\n▶ Running IST Timezone & Date Utility Tests...");

runTest("Date Utility: Correctly formats UTC timestamp to IST", () => {
  const utcIso = "2026-10-27T04:30:00.000Z"; // 10:00 AM IST
  const formatted = formatInIST(utcIso, "hh:mm a 'IST'");
  assert(formatted.includes("10:00 AM IST"), `Expected 10:00 AM IST, got ${formatted}`);
});

runTest("Date Utility: Handles invalid dates gracefully without throwing", () => {
  const formatted = formatInIST("invalid-date-string");
  assert(typeof formatted === "string", "Invalid date should return fallback string");
});

// -----------------------------------------------------------------------------
// 5. LOCALITY INTELLIGENCE TESTS
// -----------------------------------------------------------------------------
console.log("\n▶ Running Locality Intelligence Tests...");

runTest("Locality Intelligence: Narmada Greens and Bhojpal Enclave are defined in Bhopal dataset", () => {
  const narmada = BHOPAL_PROJECTS_LOCALITY["narmada-greens"];
  const bhojpal = BHOPAL_PROJECTS_LOCALITY["bhojpal-enclave"];
  assert(Boolean(narmada), "Narmada Greens project locality must exist in dataset");
  assert(Boolean(bhojpal), "Bhojpal Enclave project locality must exist in dataset");
  assert(narmada.landmarks.length > 0, "Narmada Greens must have verified landmarks");
  assert(bhojpal.landmarks.length > 0, "Bhojpal Enclave must have verified landmarks");
});

// -----------------------------------------------------------------------------
// 6. ZOD SCHEMA VALIDATION TESTS
// -----------------------------------------------------------------------------
console.log("\n▶ Running Zod Input Validation Tests...");

runTest("Zod: Score recalculate schema validates optional UUID", () => {
  const valid = scoreRecalculateSchema.safeParse({
    lead_id: "c1000000-0000-0000-0000-000000000001",
    dry_run: true,
  });
  assert(valid.success === true, "Valid UUID must pass validation");

  const invalid = scoreRecalculateSchema.safeParse({
    lead_id: "not-a-valid-uuid",
  });
  assert(invalid.success === false, "Invalid UUID must fail validation");
});

runTest("Zod: Lead creation schema requires DPDP consent and validates Indian phone numbers", () => {
  const valid = leadCreateSchema.safeParse({
    full_name: "Test Buyer",
    phone: "+919826012345",
    budget_min: 2500000,
    budget_max: 3500000,
    source: "website_form",
    consent_given: true,
  });
  assert(valid.success === true, "Valid lead with consent must pass validation");

  const missingConsent = leadCreateSchema.safeParse({
    full_name: "Test Buyer",
    phone: "+919826012345",
    consent_given: false,
  });
  assert(missingConsent.success === false, "Lead without DPDP consent must fail validation");

  const invalidPhone = leadCreateSchema.safeParse({
    full_name: "Test Buyer",
    phone: "12345", // too short
    consent_given: true,
  });
  assert(invalidPhone.success === false, "Short invalid phone number must fail validation");
});

// -----------------------------------------------------------------------------
// TEST SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log("\n-------------------------------------------------------");
const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;

console.log(`Results: ${passedCount} passed, ${failedCount} failed of ${results.length} tests`);
console.log("-------------------------------------------------------\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 All automated tests passed successfully!\n");
  process.exit(0);
}
