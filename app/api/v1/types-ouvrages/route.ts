import { handlersRessource } from "@/lib/api/handlers-ressources"
export const runtime = "nodejs"
const h = handlersRessource("types_ouvrages")
export const GET = h.liste
export const POST = h.creation
