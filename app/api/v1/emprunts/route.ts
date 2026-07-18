import type { NextRequest } from "next/server"
import { exigerIdentite } from "@/lib/api/authentification"
import { lirePagination, metaPagination } from "@/lib/api/pagination"
import { reponseErreur, succes } from "@/lib/api/reponses"
import { creerEmprunt, listerEmprunts } from "@/lib/services/emprunts"
import { creerEmpruntSchema } from "@/lib/validation/emprunts"
export const runtime="nodejs"
export async function GET(r:NextRequest){try{await exigerIdentite();const p=lirePagination(r.nextUrl);const x=await listerEmprunts(p,r.nextUrl.searchParams);return succes(x.donnees,metaPagination(p.page,p.limite,x.total))}catch(e){return reponseErreur(e)}}
export async function POST(r:NextRequest){try{await exigerIdentite(["ADMIN","BIBLIOTHECAIRE","ENSEIGNANT"]);return succes(await creerEmprunt(creerEmpruntSchema.parse(await r.json())),{},201)}catch(e){return reponseErreur(e)}}
