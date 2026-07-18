import { NextResponse } from "next/server"
import { checkDatabase } from "@/lib/db/health"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const migrated = await checkDatabase()
    return NextResponse.json(
      {
        application: "ok",
        database: migrated ? "ok" : "migration_required",
        timestamp: new Date().toISOString(),
      },
      { status: migrated ? 200 : 503 },
    )
  } catch {
    return NextResponse.json(
      {
        application: "ok",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
