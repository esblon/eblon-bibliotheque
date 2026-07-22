import { z } from "zod"

const texte = (max = 255) => z.string().trim().min(1).max(max)
const optionnel = (max = 255) => z.string().trim().max(max).nullable().optional()
export const uuid = z.string().uuid()
export const schemaId = z.object({ id: uuid })

export const validationsRessources = {
  matieres: z.object({ code: texte(30).transform((v) => v.toUpperCase()), nom: texte(150), est_active: z.boolean().optional() }),
  niveaux_scolaires: z.object({ code: texte(30).transform((v) => v.toUpperCase()), nom: texte(150), est_actif: z.boolean().optional() }),
  classes_scolaires: z.object({ niveau_scolaire_id: uuid, code: texte(30).transform((v) => v.toUpperCase()), nom: texte(150), ordre: z.number().int().nonnegative(), est_active: z.boolean().optional() }),
  etablissements: z.object({ code: texte(30).transform((v) => v.toUpperCase()), nom: texte(255), type_etablissement: z.enum(["PERISCOLAIRE","PRIMAIRE","SECONDAIRE"]), est_actif: z.boolean().optional() }),
  roles_agents: z.object({ code: texte(30).transform(v=>v.toUpperCase()), nom: texte(100), description: optionnel(500), role_base:z.enum(["ADMIN","BIBLIOTHECAIRE","ENSEIGNANT","LECTEUR"]), est_actif: z.boolean().optional() }),
  ouvrages: z.object({ titre: texte(300), sous_titre: optionnel(300), isbn: optionnel(30), editeur: optionnel(150), edition: optionnel(100), annee_publication: z.number().int().min(1000).max(9999).nullable().optional(), description: optionnel(5000), matiere_id: uuid, niveau_scolaire_id: uuid.nullable().optional(), cle_image_couverture: optionnel(500), est_actif: z.boolean().optional() }),
  exemplaires: z.object({ ouvrage_id: uuid, code_inventaire: texte(100).transform((v) => v.toUpperCase()), code_qr: optionnel(200), statut: z.enum(["PREVU","ACHETE","A_ETIQUETER","ETIQUETE","DISPONIBLE","EMPRUNTE","PERDU","ABIME","RETIRE"]).optional(), date_acquisition: z.string().date().nullable().optional(), prix_acquisition: z.number().nonnegative().nullable().optional(), devise: z.string().length(3).toUpperCase().nullable().optional(), observations: optionnel(2000) }),
  emprunteurs: z.object({ numero_emprunteur: texte(100).transform((v) => v.toUpperCase()), prenom: texte(150), nom: texte(150), email: z.string().email().max(255).nullable().optional(), telephone: optionnel(50), niveau_scolaire_id: uuid.nullable().optional(), classe: optionnel(100), etablissement: optionnel(255), statut: z.enum(["EN_ATTENTE","ACTIF","SUSPENDU","ARCHIVE"]).optional() }),
  agents: z.object({ identifiant_auth_externe: optionnel(255), prenom: texte(150), nom: texte(150), email: z.string().email().max(255), role: texte(30).transform(v=>v.toUpperCase()), statut: z.enum(["ACTIF","DESACTIVE"]).optional() }),
}
export type NomRessource = keyof typeof validationsRessources

export function validationMiseAJour(nom: NomRessource): z.ZodType<Record<string, unknown>> {
  const schema = validationsRessources[nom] as z.ZodObject<z.ZodRawShape>
  return schema.partial().refine((v) => Object.keys(v).length > 0, "Au moins un champ est requis")
}

export const transitionsExemplaire: Record<string, readonly string[]> = {
  PREVU: ["ACHETE", "RETIRE"], ACHETE: ["A_ETIQUETER", "RETIRE"], A_ETIQUETER: ["ETIQUETE", "RETIRE"],
  ETIQUETE: ["DISPONIBLE", "ABIME", "RETIRE"], DISPONIBLE: ["ABIME", "PERDU", "RETIRE"],
  EMPRUNTE: ["DISPONIBLE", "ABIME", "PERDU"], ABIME: ["DISPONIBLE", "RETIRE"], PERDU: ["DISPONIBLE", "RETIRE"], RETIRE: [],
}
