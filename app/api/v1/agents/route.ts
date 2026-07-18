import { handlersRessource } from "@/lib/api/handlers-ressources"
export const runtime = "nodejs"
const h = handlersRessource("agents")
export const GET = h.liste; export const POST = h.creation
