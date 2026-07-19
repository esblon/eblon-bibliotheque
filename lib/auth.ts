import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { randomUUID } from "node:crypto"
import { sendResetPasswordEmail } from "@/lib/email"
import { contexteActivationAgent } from "@/lib/contexte-activation-agent"

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
          if(role!=="admin"){
            const agent=await authPool.query(`SELECT 1 FROM "${schemaAuth}".agents WHERE lower(email)=lower($1)`,[userData.email])
            if(agent.rowCount&&contexteActivationAgent.getStore()?.toLowerCase()!==userData.email.toLowerCase())throw new Error("Activation agent requise")
          }
          return { data: { ...userData, role, statut: "Actif" } }
        },
        after: async (user) => {
          const premierCompte = user.role === "admin"
          const nom = separerNom(user.name)
          const agent=await authPool.query(`SELECT id FROM "${schemaAuth}".agents WHERE lower(email)=lower($1)`,[user.email])
          if(agent.rowCount){
            await authPool.query(`UPDATE "${schemaAuth}".agents SET identifiant_auth_externe=$1,role=CASE WHEN $3 THEN 'ADMIN' ELSE role END,statut='ACTIF',date_modification=current_timestamp WHERE lower(email)=lower($2)`,[user.id,user.email,premierCompte])
          }else if(premierCompte){
            await authPool.query(`INSERT INTO "${schemaAuth}".agents(id,identifiant_auth_externe,prenom,nom,email,role,statut) VALUES(gen_random_uuid(),$1,$2,$3,$4,'ADMIN','ACTIF')`,[user.id,nom.prenom,nom.nom,user.email])
          }else{
            const emprunteur=await authPool.query(`SELECT id FROM "${schemaAuth}".emprunteurs WHERE lower(email)=lower($1)`,[user.email])
            if(emprunteur.rowCount)await authPool.query(`UPDATE "${schemaAuth}".emprunteurs SET identifiant_auth_externe=$1,date_modification=current_timestamp WHERE id=$2`,[user.id,emprunteur.rows[0].id])
            else await authPool.query(`INSERT INTO "${schemaAuth}".emprunteurs(id,numero_emprunteur,prenom,nom,email,identifiant_auth_externe,statut) VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,'EN_ATTENTE')`,[`AUTO-${user.id.slice(0,12).toUpperCase()}`,nom.prenom,nom.nom,user.email,user.id])
          }
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
