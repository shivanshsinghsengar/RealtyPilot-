import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  scrapeJustdial,
  scrape99acres,
  scrapeMagicBricks,
  qualifyB2CProspect,
  B2CProspect,
} from "@/lib/discovery/b2c-scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface B2CDiscoveryResult {
  success: boolean;
  timestamp: string;
  summary: {
    discovered: number;
    qualified: number;
    added_to_crm: number;
    hot_leads: number;
    warm_leads: number;
  };
  prospects: {
    name: string;
    phone?: string;
    source: string;
    score: number;
    intent: string;
    status: "added" | "duplicate" | "skipped";
  }[];
  errors: string[];
}

/**
 * B2C Lead Discovery API
 * Discovers DIRECT PLOT BUYERS from Justdial, 99acres, MagicBricks
 * 
 * GET /api/discovery-b2c
 * 
 * This runs daily via Vercel Cron to discover real buyers actively searching for plots
 */
// B2C Discovery endpoints disabled - uncomment when needed
/*
export async function GET(request: Request) {
  const result: B2CDiscoveryResult = {
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      discovered: 0,
      qualified: 0,
      added_to_crm: 0,
      hot_leads: 0,
      warm_leads: 0,
    },
    prospects: [],
    errors: [],
  };

  const supabase = createAdminClient();

  try {
    console.log("🔍 Discovering direct plot buyers from property portals...");

    // Search queries for different platforms
    const queries = [
      "plot in bhopal",
      "residential land bhopal",
      "plot near kolar road",
      "plot hoshangabad road",
    ];

    const allProspects: B2CProspect[] = [];

    // Scrape Justdial
    console.log("📋 Scraping Justdial...");
    for (const query of queries.slice(0, 2)) {
      try {
        const prospects = await scrapeJustdial(query);
        allProspects.push(...prospects);
        console.log(`Found ${prospects.length} prospects from Justdial (${query})`);
      } catch (error) {
        result.errors.push(`Justdial error for "${query}": ${error}`);
      }
    }

    // Scrape 99acres
    console.log("🏘️ Scraping 99acres...");
    try {
      const prospects = await scrape99acres("bhopal");
      allProspects.push(...prospects);
      console.log(`Found ${prospects.length} prospects from 99acres`);
    } catch (error) {
      result.errors.push(`99acres error: ${error}`);
    }

    // Scrape MagicBricks
    console.log("🏠 Scraping MagicBricks...");
    try {
      const prospects = await scrapeMagicBricks("bhopal");
      allProspects.push(...prospects);
      console.log(`Found ${prospects.length} prospects from MagicBricks`);
    } catch (error) {
      result.errors.push(`MagicBricks error: ${error}`);
    }

    // Deduplicate by phone
    const uniqueProspects = allProspects.filter((p, index, self) =>
      index === self.findIndex(t => t.phone === p.phone && p.phone)
    );

    result.summary.discovered = uniqueProspects.length;
    console.log(`✅ Total unique prospects: ${uniqueProspects.length}`);

    // Qualify and add to CRM
    console.log("🤖 Qualifying prospects...");

    for (const prospect of uniqueProspects) {
      try {
        const qualification = await qualifyB2CProspect(prospect);

        if (!qualification.qualified) {
          result.prospects.push({
            name: prospect.name,
            phone: prospect.phone,
            source: prospect.source,
            score: qualification.score,
            intent: qualification.intent,
            status: "skipped",
          });
          continue;
        }

        result.summary.qualified++;

        if (qualification.intent === "hot") {
          result.summary.hot_leads++;
        } else if (qualification.intent === "warm") {
          result.summary.warm_leads++;
        }

        const phone = prospect.phone || prospect.email || "+919999999999";

        // Check for duplicate
        if (prospect.phone) {
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("phone", prospect.phone)
            .maybeSingle();

          if (existing) {
            result.prospects.push({
              name: prospect.name,
              phone: prospect.phone,
              source: prospect.source,
              score: qualification.score,
              intent: qualification.intent,
              status: "duplicate",
            });
            continue;
          }
        }

        // Insert as new lead
        const { data: newLead, error: insertError } = await supabase
          .from("leads")
          .insert({
            // @ts-expect-error Supabase typing
            full_name: prospect.name,
            phone: phone,
            email: prospect.email || null,
            city: prospect.location || "Bhopal",
            source: "web_discovery",
            stage: qualification.intent === "hot" ? "qualified" : "new",
            score: Math.min(qualification.score, 100),
            budget_min: 2500000, // ₹25L default
            budget_max: 6000000, // ₹60L default
            opted_out: false,
            needs_human_followup: qualification.intent === "hot", // Hot leads flagged immediately
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("DB Insert Error:", insertError);
          throw insertError;
        }

        const leadId = (newLead as any).id;

        // Add consent
        await supabase.from("consents").insert({
          // @ts-expect-error Supabase typing
          lead_id: leadId,
          status: "pending",
          channel: "whatsapp",
          consent_text: `Lead discovered from ${prospect.source}. Awaiting opt-in confirmation.`,
        });

        // Add activity log
        await supabase.from("activities").insert({
          // @ts-expect-error Supabase typing
          lead_id: leadId,
          activity_type: "lead_created",
          description: `Direct buyer discovered from ${prospect.source}. Intent: ${qualification.intent}. Score: ${qualification.score}/100.`,
          metadata: {
            source: prospect.source,
            query: prospect.query,
            qualification,
            discovered_at: prospect.scrapedAt,
          },
        });

        result.summary.added_to_crm++;
        result.prospects.push({
          name: prospect.name,
          phone: prospect.phone,
          source: prospect.source,
          score: qualification.score,
          intent: qualification.intent,
          status: "added",
        });

        console.log(`✅ Added: ${prospect.name} (${qualification.intent.toUpperCase()} lead, Score: ${qualification.score})`);
      } catch (error) {
        console.error(`Add prospect error for ${prospect.name}:`, error);
        result.errors.push(`Failed to add ${prospect.name}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      }
    }

    console.log(`\n📊 B2C Discovery Complete:
- Discovered: ${result.summary.discovered}
- Qualified: ${result.summary.qualified}
- Added to CRM: ${result.summary.added_to_crm}
- Hot Leads: ${result.summary.hot_leads}
- Warm Leads: ${result.summary.warm_leads}`);

    return NextResponse.json(result);
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(result, { status: 500 });
  }
}
*/
