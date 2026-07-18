import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
import { sendResetPasswordEmail } from "@/lib/email"

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
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url)
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 heure
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
    "http://localhost:3000",
    ...(process.env.TRUSTED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []),
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
