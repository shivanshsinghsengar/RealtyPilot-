import { NextResponse } from "next/server";

/**
 * Discovery endpoints disabled
 * Uncomment the entire original file content when needed
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "Discovery endpoint is currently disabled",
    status: "inactive"
  }, { status: 503 });
}

export async function POST() {
  return NextResponse.json({
    message: "Discovery endpoint is currently disabled",
    status: "inactive"
  }, { status: 503 });
}
