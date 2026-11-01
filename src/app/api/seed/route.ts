import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // In production, prevent unauthorized public inspection of table counts
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("x-seed-verify-token");
    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (!expectedToken || authHeader !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized access in production environment." },
        { status: 401 }
      );
    }
  }

  const envCheck = getServerEnv();

  if (!envCheck.isSupabaseReal) {
    return NextResponse.json(
      {
        status: "placeholder_mode",
        message:
          "Supabase credentials are placeholder. To seed your live database, execute supabase/migrations/20261027000000_phase1_schema.sql and supabase/seed.sql in your Supabase SQL Editor.",
        tables_expected: [
          "profiles",
          "projects",
          "plots",
          "leads",
          "messages",
          "visits",
          "activities",
          "consents",
        ],
        seed_leads_count: 10,
        projects_count: 2,
      },
      { status: 200 }
    );
  }

  try {
    const admin = createAdminClient();
    const [leadsRes, projectsRes, plotsRes, visitsRes, consentsRes] = await Promise.all([
      admin.from("leads").select("*", { count: "exact", head: true }),
      admin.from("projects").select("*", { count: "exact", head: true }),
      admin.from("plots").select("*", { count: "exact", head: true }),
      admin.from("visits").select("*", { count: "exact", head: true }),
      admin.from("consents").select("*", { count: "exact", head: true }),
    ]);

    const isMissingTables =
      leadsRes.error?.code === "42P01" ||
      projectsRes.error?.code === "42P01" ||
      plotsRes.error?.code === "42P01";

    if (isMissingTables) {
      return NextResponse.json(
        {
          status: "migration_required",
          error: "Database tables not found. Run supabase/migrations/20261027000000_phase1_schema.sql first.",
        },
        { status: 404 }
      );
    }

    const counts = {
      leads: leadsRes.count ?? 0,
      projects: projectsRes.count ?? 0,
      plots: plotsRes.count ?? 0,
      visits: visitsRes.count ?? 0,
      consents: consentsRes.count ?? 0,
    };

    return NextResponse.json(
      {
        status: "success",
        database: "connected",
        is_empty: counts.leads === 0 && counts.projects === 0,
        counts,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Database query failed",
      },
      { status: 500 }
    );
  }
}
