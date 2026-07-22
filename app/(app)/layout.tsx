import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { AppShell } from "@/components/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  const schema = parseServerEnvironment().DATABASE_SCHEMA
  const agent = (await pool.query<{
    prenom: string
    nom: string
    email: string
    role: "ADMIN" | "ENSEIGNANT" | "BIBLIOTHECAIRE" | "LECTEUR"
  }>(
    `SELECT a.prenom,a.nom,a.email,r.role_base role
       FROM "${schema}".agents a JOIN "${schema}".roles_agents r ON r.code=a.role AND r.est_actif
      WHERE a.identifiant_auth_externe = $1 AND a.statut = 'ACTIF'`,
    [user.id],
  )).rows[0]

  if (!agent) redirect("/espace-eleve")

  return (
    <AppShell user={{ name: `${agent.prenom} ${agent.nom}`, email: agent.email, role: agent.role }}>
      {children}
    </AppShell>
  )
}
