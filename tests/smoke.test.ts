import { describe, expect, it } from "vitest"
import manifest from "@/app/manifest"

describe("application smoke test", () => {
  it("exports application metadata", () => {
    expect(manifest().start_url).toBe("/")
  })
})
