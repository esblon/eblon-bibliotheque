import { z } from "zod"
import { uuid } from "./ressources"
export const creerEmpruntSchema = z.object({ exemplaire_id: uuid, emprunteur_id: uuid, agent_preteur_id: uuid, date_emprunt: z.string().datetime().optional(), date_echeance: z.string().datetime(), observations: z.string().max(2000).nullable().optional() })
export const retourSchema = z.object({ agent_recepteur_id: uuid, date_retour: z.string().datetime().optional(), etat_retour: z.enum(["NORMAL","ABIME","PERDU"]).default("NORMAL"), observations: z.string().max(2000).nullable().optional() })
export const prolongationSchema = z.object({ nouvelle_date_echeance: z.string().datetime(), agent_id: uuid.optional() })
export const actionSchema = z.object({ agent_id: uuid.optional() })
