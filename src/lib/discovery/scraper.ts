import "server-only";

/**
 * Website scraper — extracts contact info from business websites
 * Finds: phone numbers, email addresses, WhatsApp links
 */

export interface ScrapedContact {
  phones: string[];
  emails: string[];
  whatsappNumbers: string[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

/**
 * Scrape a website to extract contact information
 * Uses simple regex patterns — no heavy parsing
 */
export async function scrapeWebsiteContacts(url: string): Promise<ScrapedContact> {
  const result: ScrapedContact = {
    phones: [],
    emails: [],
    whatsappNumbers: [],
    socialLinks: {},
  };

  if (!url || url.includes("placeholder")) {
    return result;
  }

  try {
    // Normalize URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RealtyPilot/1.0; +https://realtypilot.in)",
      },
      signal: AbortSignal.timeout(10000), // 10 sec timeout
    });

    if (!response.ok) return result;

    const html = await response.text();
    const lowercaseHtml = html.toLowerCase();

    // Extract phone numbers — Indian format
    const phonePattern = /(\+91[\s-]?)?[6-9]\d{9}/g;
    const phoneMatches = html.match(phonePattern) || [];
    result.phones = Array.from(new Set(phoneMatches.map(p => p.replace(/\s|-/g, ""))));

    // Extract emails
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = html.match(emailPattern) || [];
    result.emails = Array.from(new Set(emailMatches.filter(e => 
      !e.includes("example.com") && 
      !e.includes("sentry") &&
      !e.includes("wix.com")
    )));

    // Extract WhatsApp numbers
    const whatsappPattern = /wa\.me\/(\d+)|whatsapp.*?(\+91[\s-]?[6-9]\d{9}|[6-9]\d{9})/gi;
    const waMatches = html.match(whatsappPattern) || [];
    waMatches.forEach(match => {
      const numMatch = match.match(/\d{10,}/);
      if (numMatch) result.whatsappNumbers.push(numMatch[0]);
    });
    result.whatsappNumbers = Array.from(new Set(result.whatsappNumbers));

    // Extract social links
    if (lowercaseHtml.includes("facebook.com/")) {
      const fbMatch = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/i);
      if (fbMatch) result.socialLinks.facebook = `https://${fbMatch[0]}`;
    }
    if (lowercaseHtml.includes("instagram.com/")) {
      const igMatch = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/i);
      if (igMatch) result.socialLinks.instagram = `https://${igMatch[0]}`;
    }
    if (lowercaseHtml.includes("linkedin.com/")) {
      const liMatch = html.match(/linkedin\.com\/(company|in)\/[a-zA-Z0-9._-]+/i);
      if (liMatch) result.socialLinks.linkedin = `https://${liMatch[0]}`;
    }

    return result;
  } catch (error) {
    console.error(`Scrape error for ${url}:`, error);
    return result;
  }
}

/**
 * Batch scrape multiple websites with concurrency limit
 */
export async function batchScrapeWebsites(
  urls: string[],
  concurrency: number = 5
): Promise<Map<string, ScrapedContact>> {
  const results = new Map<string, ScrapedContact>();
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const promises = batch.map(async url => {
      const contacts = await scrapeWebsiteContacts(url);
      return { url, contacts };
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ url, contacts }) => {
      results.set(url, contacts);
    });
  }
  
  return results;
}
