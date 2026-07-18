import { describe, expect, it } from "vitest"
import { parseServerEnvironment } from "@/config/env"

describe("server environment", () => {
  it("accepts a valid local configuration", () => {
    expect(parseServerEnvironment({
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/eblon",
      DATABASE_SCHEMA: "eblon_bibliotheque",
    })).toEqual({
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/eblon",
      DATABASE_SCHEMA: "eblon_bibliotheque",
    })
  })

  it("rejects an unsafe schema name", () => {
    expect(() => parseServerEnvironment({
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/eblon",
      DATABASE_SCHEMA: "public; drop schema public",
    })).toThrow()
  })
})
