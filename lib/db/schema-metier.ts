import { relations } from "drizzle-orm"
import { boolean, date, integer, jsonb, numeric, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core"

const nomSchema = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
export const schemaMetier = pgSchema(nomSchema)
const datesModifiables = {
  dateCreation: timestamp("date_creation", { withTimezone: true }).notNull().defaultNow(),
  dateModification: timestamp("date_modification", { withTimezone: true }).notNull().defaultNow(),
}

export const matieres = schemaMetier.table("matieres", {
  id: uuid("id").primaryKey(), code: text("code").notNull().unique(), nom: text("nom").notNull(),
  estActive: boolean("est_active").notNull().default(true), ...datesModifiables,
})
export const niveauxScolaires = schemaMetier.table("niveaux_scolaires", {
  id: uuid("id").primaryKey(), code: text("code").notNull().unique(), nom: text("nom").notNull(),
  estActif: boolean("est_actif").notNull().default(true), ...datesModifiables,
})
export const classesScolaires = schemaMetier.table("classes_scolaires", {
  id: uuid("id").primaryKey(), niveauScolaireId: uuid("niveau_scolaire_id").notNull().references(() => niveauxScolaires.id),
  code: text("code").notNull().unique(), nom: text("nom").notNull(), ordre: integer("ordre").notNull(),
  estActive: boolean("est_active").notNull().default(true), ...datesModifiables,
})
export const etablissements = schemaMetier.table("etablissements", {
  id: uuid("id").primaryKey(), code: text("code").notNull().unique(), nom: text("nom").notNull().unique(),
  estActif: boolean("est_actif").notNull().default(true), ...datesModifiables,
})
export const ouvrages = schemaMetier.table("ouvrages", {
  id: uuid("id").primaryKey(), titre: text("titre").notNull(), sousTitre: text("sous_titre"), isbn: text("isbn"),
  editeur: text("editeur"), edition: text("edition"), anneePublication: integer("annee_publication"),
  description: text("description"), matiereId: uuid("matiere_id").notNull().references(() => matieres.id),
  niveauScolaireId: uuid("niveau_scolaire_id").references(() => niveauxScolaires.id),
  cleImageCouverture: text("cle_image_couverture"), estActif: boolean("est_actif").notNull().default(true), ...datesModifiables,
})
export const exemplaires = schemaMetier.table("exemplaires", {
  id: uuid("id").primaryKey(), ouvrageId: uuid("ouvrage_id").notNull().references(() => ouvrages.id),
  codeInventaire: text("code_inventaire").notNull().unique(), codeQr: text("code_qr"), statut: text("statut").notNull().default("PREVU"),
  dateAcquisition: date("date_acquisition"), prixAcquisition: numeric("prix_acquisition", { precision: 12, scale: 2 }),
  devise: text("devise"), observations: text("observations"), ...datesModifiables,
})
export const emprunteurs = schemaMetier.table("emprunteurs", {
  id: uuid("id").primaryKey(), numeroEmprunteur: text("numero_emprunteur").notNull().unique(), prenom: text("prenom").notNull(),
  nom: text("nom").notNull(), email: text("email"), telephone: text("telephone"), identifiantAuthExterne: text("identifiant_auth_externe"),
  niveauScolaireId: uuid("niveau_scolaire_id").references(() => niveauxScolaires.id), classeScolaireId: uuid("classe_scolaire_id").references(() => classesScolaires.id), classe: text("classe"),
  etablissementId: uuid("etablissement_id").references(() => etablissements.id), etablissement: text("etablissement"), statut: text("statut").notNull().default("ACTIF"), ...datesModifiables,
})
export const agents = schemaMetier.table("agents", {
  id: uuid("id").primaryKey(), identifiantAuthExterne: text("identifiant_auth_externe").unique(),
  prenom: text("prenom").notNull(), nom: text("nom").notNull(), email: text("email").notNull().unique(),
  role: text("role").notNull(), statut: text("statut").notNull().default("ACTIF"), ...datesModifiables,
})
export const emprunts = schemaMetier.table("emprunts", {
  id: uuid("id").primaryKey(), exemplaireId: uuid("exemplaire_id").notNull().references(() => exemplaires.id),
  emprunteurId: uuid("emprunteur_id").notNull().references(() => emprunteurs.id),
  agentPreteurId: uuid("agent_preteur_id").notNull().references(() => agents.id),
  agentRecepteurId: uuid("agent_recepteur_id").references(() => agents.id),
  dateEmprunt: timestamp("date_emprunt", { withTimezone: true }).notNull(),
  dateEcheance: timestamp("date_echeance", { withTimezone: true }).notNull(),
  dateRetour: timestamp("date_retour", { withTimezone: true }), statut: text("statut").notNull().default("ACTIF"),
  etatRetour: text("etat_retour"), observations: text("observations"), ...datesModifiables,
})
export const evenementsEmprunt = schemaMetier.table("evenements_emprunt", {
  id: uuid("id").primaryKey(), empruntId: uuid("emprunt_id").notNull().references(() => emprunts.id),
  typeEvenement: text("type_evenement").notNull(), agentId: uuid("agent_id").references(() => agents.id),
  dateEvenement: timestamp("date_evenement", { withTimezone: true }).notNull().defaultNow(), details: jsonb("details"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).notNull().defaultNow(),
})

export type Ouvrage = typeof ouvrages.$inferSelect
export type Exemplaire = typeof exemplaires.$inferSelect
export type Emprunteur = typeof emprunteurs.$inferSelect
export type Emprunt = typeof emprunts.$inferSelect
export type EvenementEmprunt = typeof evenementsEmprunt.$inferSelect

export const relationsOuvrages = relations(ouvrages, ({ one, many }) => ({
  matiere: one(matieres, { fields: [ouvrages.matiereId], references: [matieres.id] }),
  niveauScolaire: one(niveauxScolaires, { fields: [ouvrages.niveauScolaireId], references: [niveauxScolaires.id] }),
  exemplaires: many(exemplaires),
}))
