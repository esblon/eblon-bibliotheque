import type { ErreurApiPayload } from "./types"

const messages: Record<number,string> = {
  400: "Les informations transmises sont invalides.",
  401: "Votre session a expiré. Veuillez vous reconnecter.",
  403: "Vous n’avez pas l’autorisation d’effectuer cette action.",
  404: "La ressource demandée est introuvable.",
  409: "Cette opération entre en conflit avec les données existantes.",
  500: "Une erreur interne est survenue. Réessayez ultérieurement.",
}

export class ErreurClientApi extends Error {
  constructor(public statut:number, public code:string, message:string, public details?:unknown) { super(message); this.name = "ErreurClientApi" }
}

export async function convertirErreur(reponse: Response): Promise<ErreurClientApi> {
  let payload: ErreurApiPayload | undefined
  try { payload = await reponse.json() as ErreurApiPayload } catch { /* réponse non JSON */ }
  return new ErreurClientApi(reponse.status, payload?.erreur.code ?? `HTTP_${reponse.status}`, payload?.erreur.message ?? messages[reponse.status] ?? messages[500], payload?.erreur.details)
}

export function messageErreur(error: unknown) {
  if (error instanceof ErreurClientApi || (error instanceof Error && error.name === "ErreurEnvoiEmail")) return error.message
  return "Impossible de joindre le service. Vérifiez que l’application est démarrée."
}
