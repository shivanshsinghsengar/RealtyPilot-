import "server-only";

/**
 * B2C Lead Discovery - Scrapes Justdial, Sulekha, IndiaMART for plot buyers
 * Target: People searching "plot in Bhopal", "residential land Bhopal"
 */

export interface B2CProspect {
  name: string;
  phone?: string;
  email?: string;
  source: "justdial" | "sulekha" | "indiamart" | "magicbricks" | "99acres";
  query: string; // What they searched for
  location?: string;
  scrapedAt: Date;
}

/**
 * Search Justdial for "plot in Bhopal" listings and extract contact info
 */
export async function scrapeJustdial(query: string = "plot in bhopal"): Promise<B2CProspect[]> {
  const prospects: B2CProspect[] = [];
  
  try {
    const searchUrl = `https://www.justdial.com/Bhopal/${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`Justdial returned ${response.status}`);
      return prospects;
    }

    const html = await response.text();

    // Extract phone numbers (Indian format)
    const phoneRegex = /(\+91[\s-]?)?[6-9]\d{9}/g;
    const phones = html.match(phoneRegex) || [];

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];

    // Extract names (common patterns in Justdial)
    const nameRegex = /(?:Contact Person|Owner|Name)[\s:]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g;
    const names: string[] = [];
    let match;
    while ((match = nameRegex.exec(html)) !== null) {
      if (match[1]) names.push(match[1]);
    }

    // Create prospects from extracted data
    const maxProspects = Math.max(phones.length, emails.length, names.length);
    for (let i = 0; i < maxProspects; i++) {
      if (phones[i] || emails[i]) {
        prospects.push({
          name: names[i] || `Justdial Lead ${i + 1}`,
          phone: phones[i]?.replace(/\s|-/g, ""),
          email: emails[i],
          source: "justdial",
          query,
          location: "Bhopal",
          scrapedAt: new Date(),
        });
      }
    }

    // Deduplicate by phone
    const uniqueProspects = prospects.filter((p, index, self) =>
      index === self.findIndex(t => t.phone === p.phone)
    );

    return uniqueProspects.slice(0, 20); // Max 20 per search
  } catch (error) {
    console.error("Justdial scrape error:", error);
    return [];
  }
}

/**
 * Search 99acres for plot buyers/enquiries
 */
export async function scrape99acres(city: string = "bhopal"): Promise<B2CProspect[]> {
  const prospects: B2CProspect[] = [];

  try {
    const searchUrl = `https://www.99acres.com/search/property/buy/residential-plot-${city}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return prospects;

    const html = await response.text();

    // Extract contact info
    const phoneRegex = /[6-9]\d{9}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const phones = Array.from(new Set(html.match(phoneRegex) || []));
    const emails = Array.from(new Set(html.match(emailRegex) || []));

    for (let i = 0; i < Math.min(phones.length, 15); i++) {
      prospects.push({
        name: `99acres Lead ${i + 1}`,
        phone: "+91" + phones[i],
        email: emails[i],
        source: "99acres",
        query: "residential plot",
        location: city,
        scrapedAt: new Date(),
      });
    }

    return prospects;
  } catch (error) {
    console.error("99acres scrape error:", error);
    return [];
  }
}

/**
 * Search MagicBricks for plot enquiries
 */
export async function scrapeMagicBricks(city: string = "bhopal"): Promise<B2CProspect[]> {
  const prospects: B2CProspect[] = [];

  try {
    const searchUrl = `https://www.magicbricks.com/property-for-sale/residential-real-estate?proptype=Residential-Plot&cityName=${city}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return prospects;

    const html = await response.text();

    const phoneRegex = /[6-9]\d{9}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const phones = Array.from(new Set(html.match(phoneRegex) || []));
    const emails = Array.from(new Set(html.match(emailRegex) || []));

    for (let i = 0; i < Math.min(phones.length, 15); i++) {
      prospects.push({
        name: `MagicBricks Lead ${i + 1}`,
        phone: "+91" + phones[i],
        email: emails[i],
        source: "magicbricks",
        query: "residential plot",
        location: city,
        scrapedAt: new Date(),
      });
    }

    return prospects;
  } catch (error) {
    console.error("MagicBricks scrape error:", error);
    return [];
  }
}

/**
 * Qualify B2C prospect using Gemini AI
 */
export async function qualifyB2CProspect(prospect: B2CProspect): Promise<{
  qualified: boolean;
  score: number;
  reason: string;
  estimatedBudget?: string;
  intent: "hot" | "warm" | "cold";
}> {
  // Rule-based qualification (no AI needed for now)
  let score = 50; // Base score
  let intent: "hot" | "warm" | "cold" = "warm";
  const reasons: string[] = [];

  // Phone number present
  if (prospect.phone) {
    score += 25;
    reasons.push("Contact available");
  }

  // Email present
  if (prospect.email) {
    score += 10;
    reasons.push("Email available");
  }

  // Source quality (99acres/MagicBricks = higher intent)
  if (prospect.source === "99acres" || prospect.source === "magicbricks") {
    score += 15;
    intent = "hot";
    reasons.push("High-intent property portal");
  }

  // Qualified if score > 60
  const qualified = score >= 60;

  if (qualified && score >= 80) {
    intent = "hot";
  } else if (qualified && score >= 65) {
    intent = "warm";
  } else {
    intent = "cold";
  }

  return {
    qualified,
    score,
    reason: reasons.join("; ") || "Insufficient data",
    estimatedBudget: "₹25L - ₹60L", // Default range for Bhopal plots
    intent,
  };
}
