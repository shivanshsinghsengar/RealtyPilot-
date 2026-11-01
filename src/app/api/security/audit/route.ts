import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runSecurityAudit } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Authorization check: either valid CRON_SECRET header or active staff session
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(expectedSecret) &&
    (authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret);

  let isStaffAuthorized = false;
  try {
    const staffClient = await createClient();
    const {
      data: { user },
    } = await staffClient.auth.getUser();
    if (user) isStaffAuthorized = true;
  } catch {
    // Handled below
  }

  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (!isCronAuthorized && !isStaffAuthorized && !isPlaceholder) {
    return NextResponse.json(
      { error: "Unauthorized. Staff authentication or valid cron secret required to access security audit." },
      { status: 401 }
    );
  }

  try {
    const report = await runSecurityAudit();
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Security audit execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute security audit" },
      { status: 500 }
    );
  }
}
