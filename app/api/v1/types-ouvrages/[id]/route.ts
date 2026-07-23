import { handlersRessource } from "@/lib/api/handlers-ressources"
export const runtime = "nodejs"
const h = handlersRessource("types_ouvrages")
export const GET = h.detail
export const PATCH = h.miseAJour
