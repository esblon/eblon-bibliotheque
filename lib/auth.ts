import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { randomUUID } from "node:crypto"
import { sendResetPasswordEmail } from "@/lib/email"

const schemaAuth = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
const authPool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schemaAuth}` })

function separerNom(nomComplet: string) {
  const parties = nomComplet.trim().split(/\s+/).filter(Boolean)
  return { prenom: parties.shift() ?? "Utilisateur", nom: parties.join(" ") || "EBLON" }
}

export const auth = betterAuth({
  database: authPool,
  onAPIError: {
    onError: (error) => {
      console.error(JSON.stringify({ niveau: "error", evenement: "erreur_authentification", correlation_id: randomUUID(), type: error instanceof Error ? error.name : "inconnu" }))
    },
  },
  databaseHooks: {
    user: {
      create: {
        // First account created becomes the administrator, everyone else is
        // a "prof" (professeur référent) by default.
        before: async (userData) => {
          const result = await authPool.query<{ count: number }>('SELECT count(*)::int AS count FROM "user"')
          const role = Number(result.rows[0]?.count) === 0 ? "admin" : "prof"
          return { data: { ...userData, role, statut: "Actif" } }
        },
        after: async (user) => {
          const premierCompte = user.role === "admin"
          const nom = separerNom(user.name)
          await authPool.query(
            `INSERT INTO "${schemaAuth}".agents
              (id,identifiant_auth_externe,prenom,nom,email,role,statut)
             VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,'ACTIF')
             ON CONFLICT (email) DO UPDATE SET
               identifiant_auth_externe=EXCLUDED.identifiant_auth_externe,
               prenom=EXCLUDED.prenom,nom=EXCLUDED.nom,
               role=CASE WHEN $6 THEN 'ADMIN' ELSE "${schemaAuth}".agents.role END,
               statut='ACTIF',date_modification=current_timestamp`,
            [user.id, nom.prenom, nom.nom, user.email, premierCompte ? "ADMIN" : "LECTEUR", premierCompte],
          )
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
        input: false,
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
})
