import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db/health", () => ({ checkDatabase: vi.fn() }))
import { checkDatabase } from "@/lib/db/health"
import { GET } from "@/app/api/health/route"

describe("GET /api/health", () => {
  beforeEach(() => vi.mocked(checkDatabase).mockReset())

  it("reports a healthy migrated database", async () => {
    vi.mocked(checkDatabase).mockResolvedValue(true)
    const response = await GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ application: "ok", database: "ok" })
  })

  it("does not expose connection errors", async () => {
    vi.mocked(checkDatabase).mockResolvedValue(false)
    const response = await GET()
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ database: "migration_required" })
  })
})
