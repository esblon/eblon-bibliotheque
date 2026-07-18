import type { NextRequest } from "next/server"
import { exigerIdentite, type RoleAgent } from "./authentification"
import { lirePagination, metaPagination } from "./pagination"
import { reponseErreur, succes } from "./reponses"
import { creer, listerRessources, modifier, obtenirRessource } from "@/lib/services/ressources"
import { validationMiseAJour, schemaId, validationsRessources, type NomRessource } from "@/lib/validation/ressources"

const EDITEURS: RoleAgent[] = ["ADMIN", "BIBLIOTHECAIRE"]
export function handlersRessource(nom: NomRessource) {
  return {
    async liste(request: NextRequest) { try { await exigerIdentite(); const p = lirePagination(request.nextUrl); const r = await listerRessources(nom, p, request.nextUrl.searchParams); return succes(r.donnees, metaPagination(p.page, p.limite, r.total)) } catch (e) { return reponseErreur(e) } },
    async creation(request: NextRequest) { try { await exigerIdentite(EDITEURS); const body = validationsRessources[nom].parse(await request.json()) as Record<string, unknown>; return succes(await creer(nom, body), {}, 201) } catch (e) { return reponseErreur(e) } },
    async detail(_request: NextRequest, contexte: { params: Promise<{ id: string }> }) { try { await exigerIdentite(); const { id } = schemaId.parse(await contexte.params); return succes(await obtenirRessource(nom, id)) } catch (e) { return reponseErreur(e) } },
    async miseAJour(request: NextRequest, contexte: { params: Promise<{ id: string }> }) { try { await exigerIdentite(EDITEURS); const { id } = schemaId.parse(await contexte.params); const body = validationMiseAJour(nom).parse(await request.json()); return succes(await modifier(nom, id, body)) } catch (e) { return reponseErreur(e) } },
  }
}
