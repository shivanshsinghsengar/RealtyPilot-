import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OSMPlace } from "./osm-client";
import { ScrapedContact } from "./scraper";

export interface QualificationResult {
  qualified: boolean;
  score: number; // 0-100
  reason: string;
  icp_match: {
    business_type_match: boolean;
    location_match: boolean;
    contact_availability: boolean;
    website_quality: boolean;
  };
  next_action: string;
}

/**
 * ICP (Ideal Customer Profile) for RealtyPilot Bhopal
 */
const REALTY_PILOT_ICP = `
You are qualifying potential B2B customers for RealtyPilot — a real estate CRM and plot sales platform in Bhopal, Madhya Pradesh.

IDEAL CUSTOMER PROFILE:
- Real estate developers with plotted projects in Bhopal
- Builders doing residential construction (duplexes, villas)
- Architecture firms designing residential projects
- Construction companies working on housing projects
- Property dealers with land/plot inventory

MUST HAVE:
- Active business in Bhopal or Madhya Pradesh
- Residential real estate focus (NOT commercial/industrial)
- Contactable (phone or website available)

DISQUALIFY:
- Retail shops, restaurants, services (unless property-related)
- Government offices
- Individual contractors (too small)
- Businesses outside real estate/construction

SCORING:
- 80-100: Perfect ICP match — immediate outreach
- 50-79: Potential fit — needs research
- 0-49: Poor fit — skip

Return JSON:
{
  "qualified": true/false,
  "score": 0-100,
  "reason": "brief explanation",
  "icp_match": {
    "business_type_match": true/false,
    "location_match": true/false,
    "contact_availability": true/false,
    "website_quality": true/false
  },
  "next_action": "recommended next step"
}
`;

/**
 * Qualify a discovered business using Gemini AI
 */
export async function qualifyBusiness(
  place: OSMPlace,
  contacts: ScrapedContact
): Promise<QualificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback rule-based qualification if no API key
  if (!apiKey || apiKey.includes("placeholder")) {
    return ruleBasedQualification(place, contacts);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const prompt = `${REALTY_PILOT_ICP}

BUSINESS TO QUALIFY:
Name: ${place.name}
Category: ${place.category}
Location: ${place.address || place.city}
Phone: ${place.phone || contacts.phones[0] || "Not available"}
Website: ${place.website || "Not available"}
Emails: ${contacts.emails.join(", ") || "Not available"}
WhatsApp: ${contacts.whatsappNumbers.length > 0 ? "Available" : "Not available"}

Qualify this business against RealtyPilot's ICP.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as QualificationResult;

    return parsed;
  } catch (error) {
    console.error("AI qualification error:", error);
    return ruleBasedQualification(place, contacts);
  }
}

/**
 * Rule-based qualification fallback (when AI unavailable)
 */
function ruleBasedQualification(
  place: OSMPlace,
  contacts: ScrapedContact
): QualificationResult {
  let score = 0;
  const reasons: string[] = [];

  // Business type match
  const goodCategories = ["builder", "architect", "real estate", "construction"];
  const categoryMatch = goodCategories.some(c => 
    place.category.toLowerCase().includes(c) || 
    place.name.toLowerCase().includes(c)
  );

  if (categoryMatch) {
    score += 40;
    reasons.push("Relevant business category");
  }

  // Location match
  const locationMatch = place.city.toLowerCase().includes("bhopal");
  if (locationMatch) {
    score += 20;
    reasons.push("Located in Bhopal");
  }

  // Contact availability
  const hasContactRaw = 
    place.phone || 
    place.website || 
    contacts.phones.length > 0 || 
    contacts.emails.length > 0;
  
  const hasContact = Boolean(hasContactRaw);

  if (hasContact) {
    score += 25;
    reasons.push("Contact info available");
  }

  const hasWebsite = Boolean(place.website);
  if (hasWebsite) {
    score += 15;
    reasons.push("Professional web presence");
  }

  const qualified = score >= 50;

  return {
    qualified,
    score,
    reason: reasons.join("; ") || "Insufficient data",
    icp_match: {
      business_type_match: categoryMatch,
      location_match: locationMatch,
      contact_availability: hasContact,
      website_quality: hasWebsite,
    },
    next_action: qualified 
      ? "Add to CRM and initiate outreach" 
      : "Skip — does not match ICP",
  };
}
