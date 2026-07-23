import { z } from "zod"

const texte = (max=255) => z.string().trim().min(1,"Ce champ est requis").max(max)
const optionnel = (max=255) => z.string().trim().max(max).optional().transform(v => v || null)
export const schemasFormulaires = {
  matieres: z.object({ code:texte(30), nom:texte(150), est_active:z.boolean() }),
  "niveaux-scolaires": z.object({ code:texte(30), nom:texte(150), est_actif:z.boolean() }),
  "classes-scolaires": z.object({ niveau_scolaire_id:z.string().uuid(), code:texte(30), nom:texte(150), ordre:z.coerce.number().int().nonnegative(), est_active:z.boolean() }),
  etablissements: z.object({ code:texte(30), nom:texte(255), type_etablissement:z.enum(["PERISCOLAIRE","PRIMAIRE","SECONDAIRE"]), statut:z.enum(["INITIALISATION","ACTIF","INACTIF","DESACTIVE"]) }),
  "types-ouvrages": z.object({ code:texte(50), nom:texte(150), description:optionnel(500), est_actif:z.boolean() }),
  roles: z.object({ code:texte(30), nom:texte(100), description:optionnel(500), role_base:z.enum(["ADMIN","BIBLIOTHECAIRE","ENSEIGNANT","LECTEUR"]), est_actif:z.boolean() }),
  ouvrages: z.object({ titre:texte(300), sous_titre:optionnel(300), isbn:optionnel(30), editeur:optionnel(150), edition:optionnel(100), annee_publication:z.union([z.coerce.number().int().min(1000).max(9999),z.literal("")]).transform(v=>v===""?null:v), description:optionnel(5000), matiere_id:z.string().uuid(), niveau_scolaire_id:z.union([z.string().uuid(),z.literal("")]).transform(v=>v||null), type_ouvrage_id:z.string().uuid(), au_programme_scolaire:z.boolean(), est_actif:z.boolean() }),
  exemplaires: z.object({ ouvrage_id:z.string().uuid(), code_inventaire:texte(100), code_qr:optionnel(200), statut:z.enum(["PREVU","ACHETE","A_ETIQUETER","ETIQUETE","DISPONIBLE","EMPRUNTE","PERDU","ABIME","RETIRE"]), date_acquisition:z.string().optional().transform(v=>v||null), prix_acquisition:z.union([z.coerce.number().nonnegative(),z.literal("")]).transform(v=>v===""?null:v), devise:z.string().trim().length(3).optional().or(z.literal("")).transform(v=>v?v.toUpperCase():null), observations:optionnel(2000) }),
  emprunteurs: z.object({ numero_emprunteur:texte(100), prenom:texte(150), nom:texte(150), email:z.union([z.string().email("Email invalide"),z.literal("")]).transform(v=>v||null), telephone:optionnel(50), niveau_scolaire_id:z.union([z.string().uuid(),z.literal("")]).transform(v=>v||null), classe:optionnel(100), etablissement:optionnel(255), statut:z.enum(["EN_ATTENTE","ACTIF","SUSPENDU","ARCHIVE"]) }),
  agents: z.object({ identifiant_auth_externe:optionnel(255), prenom:texte(150), nom:texte(150), email:z.string().email("Email invalide"), role:texte(30), statut:z.enum(["ACTIF","DESACTIVE"]) }),
}

export type RessourceEditable = keyof typeof schemasFormulaires
