import { Database } from "@/types/database.types";

export interface ScoreFactor {
  id: string;
  factor: string;
  points: number;
  maxPoints: number;
  status: "achieved" | "partial" | "missing";
  description: string;
}

export interface LeadScoreResult {
  score: number;
  tier: "hot" | "warm" | "cold";
  tierLabel: string;
  breakdown: ScoreFactor[];
  nextBestAction: string;
}

export interface LeadScoreInput {
  id: string;
  stage: string;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_size_sqft?: number | null;
  timeline_months?: number | null;
  loan_needed?: boolean | null;
  purpose?: string | null;
  source?: string;
  opted_out: boolean;
  needs_human_followup?: boolean;
}

/**
 * Real Estate Lead Scoring Engine for Bhopal Plotted Developments
 * Evaluates budget, plot size, timeline, visit status, loan readiness, and DPDP compliance.
 */
export function calculateLeadScore(
  lead: LeadScoreInput,
  context: {
    siteVisitsCount?: number;
    hasScheduledVisit?: boolean;
    hasCompletedVisit?: boolean;
    hasCancelledVisit?: boolean;
    inboundMessagesCount?: number;
  } = {}
): LeadScoreResult {
  const breakdown: ScoreFactor[] = [];
  let rawScore = 0;

  // 1. Budget Alignment with Bhopal Projects (Max 25 pts)
  // Narmada Greens: ₹25L-60L, Bhojpal Enclave: ₹32L-65L
  let budgetPoints = 0;
  let budgetStatus: ScoreFactor["status"] = "missing";
  let budgetDesc = "Budget requirement not yet captured from buyer.";

  if (typeof lead.budget_max === "number" && lead.budget_max > 0) {
    if (lead.budget_max >= 2500000 && lead.budget_max <= 7500000) {
      budgetPoints = 25;
      budgetStatus = "achieved";
      budgetDesc = `Target budget ₹${(lead.budget_max / 100000).toFixed(0)}L perfectly matches Narmada Greens & Bhojpal Enclave price points.`;
    } else if (lead.budget_max > 7500000) {
      budgetPoints = 20;
      budgetStatus = "achieved";
      budgetDesc = `High budget (₹${(lead.budget_max / 100000).toFixed(0)}L+) qualifies for premium corner plots or double units.`;
    } else {
      budgetPoints = 12;
      budgetStatus = "partial";
      budgetDesc = `Budget ₹${(lead.budget_max / 100000).toFixed(0)}L is slightly below base plot price (₹25L); bank loan subsidy required.`;
    }
  } else if (typeof lead.budget_min === "number" && lead.budget_min >= 2500000) {
    budgetPoints = 20;
    budgetStatus = "achieved";
    budgetDesc = `Minimum budget ₹${(lead.budget_min / 100000).toFixed(0)}L meets entry criteria.`;
  }
  rawScore += budgetPoints;
  breakdown.push({
    id: "budget",
    factor: "Budget Alignment",
    points: budgetPoints,
    maxPoints: 25,
    status: budgetStatus,
    description: budgetDesc,
  });

  // 2. Preferred Plot Size Clarity (Max 15 pts)
  // Available: 1000, 1200, 1500, 1800, 2000, 2400 sq.ft
  let sizePoints = 0;
  let sizeStatus: ScoreFactor["status"] = "missing";
  let sizeDesc = "Plot size requirement flexible or unspecified.";

  if (typeof lead.preferred_size_sqft === "number" && lead.preferred_size_sqft > 0) {
    if (lead.preferred_size_sqft >= 1000 && lead.preferred_size_sqft <= 2400) {
      sizePoints = 15;
      sizeStatus = "achieved";
      sizeDesc = `${lead.preferred_size_sqft} sq.ft directly matches standard layout inventory.`;
    } else {
      sizePoints = 10;
      sizeStatus = "partial";
      sizeDesc = `Custom size ${lead.preferred_size_sqft} sq.ft requires plot combination.`;
    }
  }
  rawScore += sizePoints;
  breakdown.push({
    id: "plot_size",
    factor: "Plot Size Clarity",
    points: sizePoints,
    maxPoints: 15,
    status: sizeStatus,
    description: sizeDesc,
  });

  // 3. Purchase Urgency & Timeline (Max 20 pts)
  let timelinePoints = 5; // baseline interest
  let timelineStatus: ScoreFactor["status"] = "missing";
  let timelineDesc = "Purchase timeline not yet specified by buyer.";

  if (
    typeof lead.timeline_months === "number" &&
    !isNaN(lead.timeline_months) &&
    lead.timeline_months >= 0
  ) {
    if (lead.timeline_months <= 1) {
      timelinePoints = 20;
      timelineStatus = "achieved";
      timelineDesc = "High Urgency: Looking to buy and register plot within 30 days.";
    } else if (lead.timeline_months <= 3) {
      timelinePoints = 16;
      timelineStatus = "achieved";
      timelineDesc = "Medium Urgency: Target purchase within 1 to 3 months.";
    } else if (lead.timeline_months <= 6) {
      timelinePoints = 10;
      timelineStatus = "partial";
      timelineDesc = "Moderate Urgency: Target purchase within 6 months.";
    } else {
      timelinePoints = 6;
      timelineStatus = "partial";
      timelineDesc = "Long-term horizon (> 6 months).";
    }
  }
  rawScore += timelinePoints;
  breakdown.push({
    id: "timeline",
    factor: "Purchase Urgency",
    points: timelinePoints,
    maxPoints: 20,
    status: timelineStatus,
    description: timelineDesc,
  });

  // 4. Site Visit Engagement (Max 25 pts)
  let visitPoints = 0;
  let visitStatus: ScoreFactor["status"] = "missing";
  let visitDesc = "No site visit scheduled yet.";

  const hasScheduled = context.hasScheduledVisit || lead.stage === "visit_scheduled";
  const hasCompleted = context.hasCompletedVisit || lead.stage === "visit_completed" || lead.stage === "negotiation" || lead.stage === "won";

  if (hasCompleted) {
    visitPoints = 25;
    visitStatus = "achieved";
    visitDesc = "On-site visit completed! Buyer has physically inspected plots in Bhopal.";
  } else if (hasScheduled) {
    visitPoints = 20;
    visitStatus = "achieved";
    visitDesc = "Official on-site visit is scheduled on calendar.";
  } else if (context.hasCancelledVisit) {
    visitPoints = 5;
    visitStatus = "partial";
    visitDesc = "Previous visit was rescheduled or cancelled; needs rebooking.";
  }
  rawScore += visitPoints;
  breakdown.push({
    id: "site_visit",
    factor: "Site Visit Activity",
    points: visitPoints,
    maxPoints: 25,
    status: visitStatus,
    description: visitDesc,
  });

  // 5. Funding & Bank Loan Readiness (Max 10 pts)
  let loanPoints = 4;
  let loanStatus: ScoreFactor["status"] = "missing";
  let loanDesc = "Financing preference not yet declared.";

  if (lead.loan_needed === false) {
    loanPoints = 10;
    loanStatus = "achieved";
    loanDesc = "Self-funded buyer with ready cash capital for immediate registry.";
  } else if (lead.loan_needed === true) {
    loanPoints = 8;
    loanStatus = "achieved";
    loanDesc = "Bank loan required (Pre-eligible for SBI/HDFC/ICICI approvals).";
  }
  rawScore += loanPoints;
  breakdown.push({
    id: "loan_readiness",
    factor: "Financing Readiness",
    points: loanPoints,
    maxPoints: 10,
    status: loanStatus,
    description: loanDesc,
  });

  // 6. Channel Engagement & Purpose (Max 5 pts)
  let engPoints = 3;
  if (lead.source === "website_form" || lead.source === "direct_call") {
    engPoints = 5;
  }
  if (lead.purpose === "end_use") {
    engPoints = Math.min(5, engPoints + 1);
  }
  rawScore += engPoints;
  breakdown.push({
    id: "engagement",
    factor: "Channel & Purpose",
    points: engPoints,
    maxPoints: 5,
    status: engPoints >= 4 ? "achieved" : "partial",
    description: `${lead.purpose === "end_use" ? "End-use self construction" : lead.purpose === "investment" ? "Capital appreciation investment" : "Active inquiry"} via ${lead.source}.`,
  });

  // Cap raw score between 0 and 100
  let finalScore = Math.min(100, Math.max(0, rawScore));

  // 🚨 DPDP Compliance Override:
  // If the lead has opted out, outbound messaging is blocked, capping actionable score
  if (lead.opted_out) {
    finalScore = Math.min(20, finalScore);
  }

  // Determine Priority Tier
  let tier: LeadScoreResult["tier"] = "cold";
  let tierLabel = "Cold Lead (Low Engagement)";

  if (finalScore >= 80) {
    tier = "hot";
    tierLabel = "Hot Lead (High Conversion Probability)";
  } else if (finalScore >= 50) {
    tier = "warm";
    tierLabel = "Warm Lead (Active Follow-up Required)";
  }

  // Generate Next Best Action Recommendation for Staff
  let nextBestAction = "Send introductory WhatsApp brochure with available plot inventory.";

  if (lead.opted_out) {
    nextBestAction = "DPDP Notice: Buyer opted out. Outbound messaging is blocked. Do not contact unless buyer texts START.";
  } else if (lead.needs_human_followup) {
    nextBestAction = "Urgent: AI flagged for senior sales advisor call (custom inquiry/negotiation pending).";
  } else if (hasCompleted) {
    nextBestAction = "Follow up on post-visit feedback, share exact payment schedule, and discuss token deposit.";
  } else if (hasScheduled) {
    nextBestAction = "Confirm driver pickup details and send project location pin on WhatsApp.";
  } else if (budgetStatus === "achieved" && sizeStatus === "achieved") {
    nextBestAction = "Propose Saturday/Sunday site visit with free Bhopal cab pickup.";
  } else if (budgetStatus === "missing") {
    nextBestAction = "Clarify target budget range (₹25L to ₹60L) to match appropriate project.";
  }

  return {
    score: finalScore,
    tier,
    tierLabel,
    breakdown,
    nextBestAction,
  };
}
