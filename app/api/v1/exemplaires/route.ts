import { handlersRessource } from "@/lib/api/handlers-ressources"
export const runtime = "nodejs"
const h = handlersRessource("exemplaires")
export const GET = h.liste; export const POST = h.creation
