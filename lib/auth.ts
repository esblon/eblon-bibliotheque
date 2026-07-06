import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export const auth = betterAuth({
  database: pool,
  databaseHooks: {
    user: {
      create: {
        // First account created becomes the administrator, everyone else is
        // a "prof" (professeur référent) by default.
        before: async (userData) => {
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(userTable)
          const role = Number(count) === 0 ? "admin" : "prof"
          return { data: { ...userData, role, statut: "Actif" } }
        },
      },
    },
  },
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "prof",
        input: true,
      },
      statut: {
        type: "string",
        required: false,
        defaultValue: "Actif",
        input: false,
      },
    },
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
