import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Better Auth tables (column names must stay camelCase to match Better Auth)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("prof"), // 'admin' | 'prof'
  statut: text("statut").notNull().default("Actif"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Application tables (shared library — data is not scoped per user)
// ---------------------------------------------------------------------------
export const livres = pgTable("livres", {
  id: serial("id").primaryKey(),
  codeLivre: text("code_livre").notNull().unique(),
  titre: text("titre").notNull(),
  niveau: text("niveau").notNull().default("Autre"),
  matiere: text("matiere").notNull().default("Autre"),
  typeLivre: text("type_livre").notNull().default("Annale"),
  edition: text("edition"),
  etatPhysique: text("etat_physique").notNull().default("Bon"),
  statut: text("statut").notNull().default("Disponible"),
  localisation: text("localisation").notNull().default("Facobly"),
  qrCodeUrl: text("qr_code_url"),
  commentaire: text("commentaire"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const eleves = pgTable("eleves", {
  id: serial("id").primaryKey(),
  identifiantEleve: text("identifiant_eleve").notNull().unique(),
  nom: text("nom").notNull(),
  prenom: text("prenom").notNull(),
  classe: text("classe"),
  niveau: text("niveau").notNull().default("Autre"),
  etablissement: text("etablissement"),
  telephoneParent: text("telephone_parent"),
  statut: text("statut").notNull().default("Actif"),
  commentaire: text("commentaire"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const emprunts = pgTable("emprunts", {
  id: serial("id").primaryKey(),
  numeroEmprunt: text("numero_emprunt").notNull().unique(),
  livreId: integer("livre_id").notNull(),
  eleveId: integer("eleve_id").notNull(),
  dateEmprunt: timestamp("date_emprunt").notNull().defaultNow(),
  dateRetourPrevue: timestamp("date_retour_prevue").notNull(),
  dateRetourReelle: timestamp("date_retour_reelle"),
  statut: text("statut").notNull().default("En cours"),
  commentaire: text("commentaire"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const parametres = pgTable("parametres", {
  id: serial("id").primaryKey(),
  cle: text("cle").notNull().unique(),
  valeur: text("valeur"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const historiqueActions = pgTable("historique_actions", {
  id: serial("id").primaryKey(),
  utilisateurId: text("utilisateur_id"),
  utilisateurNom: text("utilisateur_nom"),
  action: text("action").notNull(),
  cible: text("cible"),
  cibleId: text("cible_id"),
  details: text("details"),
  dateAction: timestamp("date_action").notNull().defaultNow(),
})
