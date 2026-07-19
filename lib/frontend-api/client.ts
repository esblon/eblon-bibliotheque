import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { convertirErreur } from "./erreurs"
import type { ParametresListe, ReponseApi } from "./types"

function urlApi(chemin:string, parametres?:ParametresListe) {
  const base = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const url = new URL(chemin, base)
  for (const [cle,valeur] of Object.entries(parametres ?? {})) if (valeur !== undefined && valeur !== null && valeur !== "") url.searchParams.set(cle, String(valeur))
  return url
}

export async function appelerApi<T>(chemin:string, options:RequestInit = {}, parametres?:ParametresListe): Promise<ReponseApi<T>> {
  const entetes = await headers()
  let reponse: Response
  try {
    reponse = await fetch(urlApi(chemin,parametres), { ...options, cache:"no-store", headers:{ Accept:"application/json", "Content-Type":"application/json", cookie:entetes.get("cookie") ?? "", ...options.headers } })
  } catch (cause) {
    throw new Error("API métier indisponible", { cause })
  }
  if (reponse.status === 401) redirect("/sign-in")
  if (reponse.status === 403) redirect("/espace-eleve")
  if (!reponse.ok) throw await convertirErreur(reponse)
  return reponse.json() as Promise<ReponseApi<T>>
}
