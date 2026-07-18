import type { NextRequest } from "next/server"
import { exigerIdentite } from "@/lib/api/authentification";import{reponseErreur,succes}from"@/lib/api/reponses";import{obtenirEmprunt}from"@/lib/services/emprunts";import{schemaId}from"@/lib/validation/ressources"
export const runtime="nodejs";export async function GET(_r:NextRequest,c:{params:Promise<{id:string}>}){try{await exigerIdentite();const{id}=schemaId.parse(await c.params);return succes(await obtenirEmprunt(id))}catch(e){return reponseErreur(e)}}
