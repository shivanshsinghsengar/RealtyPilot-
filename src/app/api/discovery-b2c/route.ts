import { NextResponse } from "next/server";

/**
 * B2C Discovery endpoints disabled
 * Uncomment the entire original file content when needed
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "B2C Discovery endpoint is currently disabled",
    status: "inactive"
  }, { status: 503 });
}
