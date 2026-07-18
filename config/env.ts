import { z } from "zod"

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  DATABASE_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/).default("eblon_bibliotheque"),
})

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

export function parseServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment)
}
