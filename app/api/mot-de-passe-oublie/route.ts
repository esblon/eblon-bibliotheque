import { z } from "zod"
import { auth, compteAuthExiste } from "@/lib/auth"
import { demanderReinitialisation } from "@/lib/demande-reinitialisation"

const requeteSchema = z.object({
  email: z.email(),
  redirectTo: z.string().startsWith("/"),
})

export async function POST(request: Request) {
  const resultat = requeteSchema.safeParse(await request.json())

  if (!resultat.success) {
    return Response.json({ message: "Requête invalide" }, { status: 400 })
  }

  const reponse = await demanderReinitialisation(
    resultat.data.email,
    resultat.data.redirectTo,
    {
      compteExiste: compteAuthExiste,
      envoyerLien: async (email, redirectTo) => {
        await auth.api.requestPasswordReset({ body: { email, redirectTo } })
      },
    },
  )

  return Response.json(reponse)
}
