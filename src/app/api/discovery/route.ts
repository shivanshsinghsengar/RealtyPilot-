import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchBhopalBusinesses, OSMPlace } from "@/lib/discovery/osm-client";
import { scrapeWebsiteContacts, ScrapedContact } from "@/lib/discovery/scraper";
import { qualifyBusiness, QualificationResult } from "@/lib/discovery/qualifier";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for Vercel Pro

interface DiscoveryResult {
  success: boolean;
  timestamp: string;
  summary: {
    discovered: number;
    scraped: number;
    qualified: number;
    added_to_crm: number;
  };
  prospects: {
    name: string;
    category: string;
    score: number;
    phone?: string;
    status: "added" | "duplicate" | "skipped";
  }[];
  errors: string[];
}

/**
 * Lead Discovery API — Harvey-style autonomous prospecting
 * Discovers businesses → Scrapes contacts → AI qualification → Add to CRM
 */
export async function POST(request: Request) {
  return handleDiscovery(request);
}

export async function GET(request: Request) {
  return handleDiscovery(request);
}

async function handleDiscovery(request: Request) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(expectedSecret) &&
    (authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret);

  let isStaffAuthorized = false;
  try {
    const staffClient = await createClient();
    const { data: { user } } = await staffClient.auth.getUser();
    if (user) isStaffAuthorized = true;
  } catch {
    // Handled below
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !isCronAuthorized && !isStaffAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Valid CRON_SECRET or staff session required." },
      { status: 401 }
    );
  }

  const result: DiscoveryResult = {
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      discovered: 0,
      scraped: 0,
      qualified: 0,
      added_to_crm: 0,
    },
    prospects: [],
    errors: [],
  };

  const supabase = createAdminClient();

  try {
    // Step 1: Discover businesses from OpenStreetMap
    console.log("🔍 Discovering Bhopal businesses from OpenStreetMap...");
    
    const categories: Array<"builder" | "architect" | "real_estate" | "construction"> = [
      "builder",
      "architect", 
      "real_estate",
      "construction"
    ];

    const allPlaces: OSMPlace[] = [];

    for (const category of categories) {
      const places = await searchBhopalBusinesses(category, 15);
      allPlaces.push(...places);
      console.log(`Found ${places.length} ${category}s`);
    }

    // Remove duplicates by name
    const uniquePlaces = allPlaces.filter((place, index, self) =>
      index === self.findIndex(p => p.name.toLowerCase() === place.name.toLowerCase())
    );

    result.summary.discovered = uniquePlaces.length;
    console.log(`✅ Total unique businesses discovered: ${uniquePlaces.length}`);

    // Step 2: Scrape websites for contact info
    console.log("📧 Scraping websites for contact information...");

    for (const place of uniquePlaces) {
      let contacts: ScrapedContact = {
        phones: [],
        emails: [],
        whatsappNumbers: [],
        socialLinks: {},
      };

      if (place.website) {
        try {
          contacts = await scrapeWebsiteContacts(place.website);
          result.summary.scraped++;
        } catch (error) {
          result.errors.push(`Scrape failed for ${place.name}: ${error}`);
        }
      }

      // Merge OSM contact with scraped contacts
      if (place.phone && !contacts.phones.includes(place.phone)) {
        contacts.phones.push(place.phone);
      }

      // Step 3: AI Qualification
      console.log(`🤖 Qualifying: ${place.name}...`);
      const qualification = await qualifyBusiness(place, contacts);

      if (!qualification.qualified) {
        result.prospects.push({
          name: place.name,
          category: place.category,
          score: qualification.score,
          status: "skipped",
        });
        continue;
      }

      result.summary.qualified++;

      // Step 4: Add to CRM as lead
      const primaryPhone = contacts.phones[0] || place.phone;
      const primaryEmail = contacts.emails[0];

      if (!primaryPhone && !primaryEmail) {
        result.prospects.push({
          name: place.name,
          category: place.category,
          score: qualification.score,
          status: "skipped",
        });
        result.errors.push(`${place.name}: No contact info available`);
        continue;
      }

      // Check for duplicate
      if (primaryPhone) {
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("phone", primaryPhone)
          .maybeSingle();

        if (existing) {
          result.prospects.push({
            name: place.name,
            category: place.category,
            score: qualification.score,
            phone: primaryPhone,
            status: "duplicate",
          });
          continue;
        }
      }

      // Insert as new lead
      try {
        const { data: newLead, error: insertError } = await supabase
          .from("leads")
          .insert({
            // @ts-expect-error Supabase typing
            full_name: place.name,
            phone: primaryPhone || "+919999999999", // Placeholder if only email
            email: primaryEmail || null,
            city: "Bhopal",
            source: "osm_discovery",
            stage: "new",
            score: Math.min(qualification.score, 100),
            opted_out: false,
            needs_human_followup: false,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        const leadId = (newLead as any).id;

        // Add consent record
        await supabase.from("consents").insert({
          // @ts-expect-error Supabase typing
          lead_id: leadId,
          status: "pending",
          channel: "whatsapp",
          consent_text: "Lead discovered via OpenStreetMap. Awaiting initial opt-in confirmation.",
        });

        // Add activity log
        await supabase.from("activities").insert({
          // @ts-expect-error Supabase typing
          lead_id: leadId,
          activity_type: "lead_created",
          description: `Lead auto-discovered via OpenStreetMap. Category: ${place.category}. Qualification score: ${qualification.score}/100.`,
          metadata: {
            source: "osm_discovery",
            osm_id: place.id,
            qualification: qualification,
            website: place.website,
          },
        });

        result.summary.added_to_crm++;
        result.prospects.push({
          name: place.name,
          category: place.category,
          score: qualification.score,
          phone: primaryPhone,
          status: "added",
        });

        console.log(`✅ Added: ${place.name} (Score: ${qualification.score})`);
      } catch (error) {
        result.errors.push(`Failed to add ${place.name}: ${error}`);
      }
    }

    console.log(`\n📊 Discovery Complete:
- Discovered: ${result.summary.discovered}
- Scraped: ${result.summary.scraped}
- Qualified: ${result.summary.qualified}
- Added to CRM: ${result.summary.added_to_crm}`);

    return NextResponse.json(result);
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(result, { status: 500 });
  }
}
