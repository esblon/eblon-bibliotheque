import { handlersRessource } from "@/lib/api/handlers-ressources"
export const runtime = "nodejs"
const h = handlersRessource("matieres")
export const GET = h.detail; export const PATCH = h.miseAJour
