import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env.server";
import { formatInIST, toUTCString } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const utcTime = toUTCString(now);
  const istTime = formatInIST(now, "dd MMMM yyyy, hh:mm:ss a 'IST'");

  const envCheck = getServerEnv();

  let supabaseStatus: "connected" | "placeholder" | "error" = "placeholder";
  let supabaseMessage = "Using mock/placeholder Supabase credentials for Phase 0 bootstrap.";

  if (envCheck.isSupabaseReal && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (response.ok || response.status === 200 || response.status === 404) {
        supabaseStatus = "connected";
        supabaseMessage = "Successfully connected to Supabase REST endpoint.";
      } else {
        supabaseStatus = "error";
        supabaseMessage = `Supabase responded with status code ${response.status}`;
      }
    } catch (err: unknown) {
      supabaseStatus = "error";
      supabaseMessage =
        err instanceof Error ? err.message : "Failed to connect to Supabase endpoint";
    }
  }

  return NextResponse.json(
    {
      status: "healthy",
      service: "RealtyPilot Core Engine",
      phase: 0,
      timestamp: {
        utc: utcTime,
        ist: istTime,
        timezone: "Asia/Kolkata",
      },
      supabase: {
        status: supabaseStatus,
        message: supabaseMessage,
        url_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        anon_key_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        service_role_configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
      environment: {
        node_env: process.env.NODE_ENV,
        configured: envCheck.isConfigured,
      },
    },
    { status: 200 }
  );
}
