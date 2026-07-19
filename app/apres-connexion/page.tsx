import { redirect } from "next/navigation"
import { destinationApresConnexion } from "@/app/actions/parcours-auth"

export default async function ApresConnexionPage() {
  redirect(await destinationApresConnexion())
}
