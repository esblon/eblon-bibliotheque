export type MetaPagination = { page: number; limite: number; total: number; nombre_pages: number }

export type ReponseApi<T> = { donnees: T; meta: Partial<MetaPagination> }
export type ErreurApiPayload = { erreur: { code: string; message: string; details?: unknown } }

export type Matiere = { id:string; code:string; nom:string; est_active:boolean; date_creation:string; date_modification:string }
export type NiveauScolaire = { id:string; code:string; nom:string; est_actif:boolean; date_creation:string; date_modification:string }
export type Ouvrage = { id:string; titre:string; sous_titre:string|null; isbn:string|null; editeur:string|null; edition:string|null; annee_publication:number|null; description:string|null; matiere_id:string; niveau_scolaire_id:string|null; type_ouvrage_id:string; au_programme_scolaire:boolean; cle_image_couverture:string|null; est_actif:boolean; date_creation:string; date_modification:string; nombre_total_exemplaires?:number; exemplaires_par_statut?:Record<string,number> }
export type StatutExemplaire = "PREVU"|"ACHETE"|"A_ETIQUETER"|"ETIQUETE"|"DISPONIBLE"|"EMPRUNTE"|"PERDU"|"ABIME"|"RETIRE"
export type Exemplaire = { id:string; ouvrage_id:string; code_inventaire:string; code_qr:string|null; statut:StatutExemplaire; date_acquisition:string|null; prix_acquisition:string|null; devise:string|null; observations:string|null; date_creation:string; date_modification:string }
export type Emprunteur = { id:string; numero_emprunteur:string; prenom:string; nom:string; email:string|null; telephone:string|null; niveau_scolaire_id:string|null; classe:string|null; etablissement:string|null; identifiant_auth_externe?:string|null; statut:"EN_ATTENTE"|"ACTIF"|"SUSPENDU"|"ARCHIVE"; date_creation:string; date_modification:string }
export type Agent = { id:string; identifiant_auth_externe:string|null; prenom:string; nom:string; email:string; role:"ADMIN"|"ENSEIGNANT"|"BIBLIOTHECAIRE"|"LECTEUR"; statut:"ACTIF"|"DESACTIVE"; date_creation:string; date_modification:string }
export type Emprunt = { id:string; exemplaire_id:string; emprunteur_id:string; agent_preteur_id:string; agent_recepteur_id:string|null; date_emprunt:string; date_echeance:string; date_retour:string|null; statut:"ACTIF"|"RETOURNE"|"EN_RETARD"|"PERDU"|"ANNULE"; etat_retour:string|null; observations:string|null; date_creation:string; date_modification:string; evenements?:EvenementEmprunt[] }
export type EvenementEmprunt = { id:string; emprunt_id:string; type_evenement:string; agent_id:string|null; date_evenement:string; details:unknown; date_creation:string }

export type ParametresListe = Record<string, string | number | boolean | null | undefined>
