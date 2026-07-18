import type { MigrationBuilder } from "node-pg-migrate"

function schemaName(): string {
  const value = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error("DATABASE_SCHEMA is invalid")
  }
  return value
}

export function up(pgm: MigrationBuilder): void {
  const s = `"${schemaName()}"`

  pgm.sql(`
    ALTER TABLE ${s}.book_copies DROP CONSTRAINT book_copies_status_valid;
    ALTER TABLE ${s}.borrowers DROP CONSTRAINT borrowers_status_valid;
    ALTER TABLE ${s}.staff_members DROP CONSTRAINT staff_members_role_valid;
    ALTER TABLE ${s}.staff_members DROP CONSTRAINT staff_members_status_valid;
    ALTER TABLE ${s}.loans DROP CONSTRAINT loans_status_valid;
    ALTER TABLE ${s}.loans DROP CONSTRAINT loans_return_status_consistent;
    ALTER TABLE ${s}.loan_events DROP CONSTRAINT loan_events_type_valid;
    DROP INDEX ${s}.loans_one_open_per_copy_idx;

    UPDATE ${s}.book_copies SET status = CASE status
      WHEN 'PLANNED' THEN 'PREVU' WHEN 'PURCHASED' THEN 'ACHETE'
      WHEN 'TO_LABEL' THEN 'A_ETIQUETER' WHEN 'LABELED' THEN 'ETIQUETE'
      WHEN 'AVAILABLE' THEN 'DISPONIBLE' WHEN 'BORROWED' THEN 'EMPRUNTE'
      WHEN 'LOST' THEN 'PERDU' WHEN 'DAMAGED' THEN 'ABIME'
      WHEN 'RETIRED' THEN 'RETIRE' ELSE status END;
    UPDATE ${s}.borrowers SET status = CASE status
      WHEN 'ACTIVE' THEN 'ACTIF' WHEN 'SUSPENDED' THEN 'SUSPENDU'
      WHEN 'ARCHIVED' THEN 'ARCHIVE' ELSE status END;
    UPDATE ${s}.staff_members SET role = CASE role
      WHEN 'TEACHER' THEN 'ENSEIGNANT' WHEN 'LIBRARIAN' THEN 'BIBLIOTHECAIRE'
      WHEN 'VIEWER' THEN 'LECTEUR' ELSE role END;
    UPDATE ${s}.staff_members SET status = CASE status
      WHEN 'ACTIVE' THEN 'ACTIF' WHEN 'DISABLED' THEN 'DESACTIVE' ELSE status END;
    UPDATE ${s}.loans SET status = CASE status
      WHEN 'ACTIVE' THEN 'ACTIF' WHEN 'RETURNED' THEN 'RETOURNE'
      WHEN 'OVERDUE' THEN 'EN_RETARD' WHEN 'LOST' THEN 'PERDU'
      WHEN 'CANCELLED' THEN 'ANNULE' ELSE status END;
    UPDATE ${s}.loan_events SET event_type = CASE event_type
      WHEN 'CREATED' THEN 'CREE' WHEN 'EXTENDED' THEN 'PROLONGE'
      WHEN 'RETURNED' THEN 'RETOURNE' WHEN 'MARKED_OVERDUE' THEN 'MARQUE_EN_RETARD'
      WHEN 'MARKED_LOST' THEN 'MARQUE_PERDU' WHEN 'CANCELLED' THEN 'ANNULE'
      WHEN 'NOTE_ADDED' THEN 'NOTE_AJOUTEE' ELSE event_type END;

    ALTER TABLE ${s}.book_copies ALTER COLUMN status SET DEFAULT 'PREVU';
    ALTER TABLE ${s}.borrowers ALTER COLUMN status SET DEFAULT 'ACTIF';
    ALTER TABLE ${s}.staff_members ALTER COLUMN status SET DEFAULT 'ACTIF';
    ALTER TABLE ${s}.loans ALTER COLUMN status SET DEFAULT 'ACTIF';

    ALTER TABLE ${s}.subjects RENAME TO matieres;
    ALTER TABLE ${s}.education_levels RENAME TO niveaux_scolaires;
    ALTER TABLE ${s}.books RENAME TO ouvrages;
    ALTER TABLE ${s}.book_copies RENAME TO exemplaires;
    ALTER TABLE ${s}.borrowers RENAME TO emprunteurs;
    ALTER TABLE ${s}.staff_members RENAME TO agents;
    ALTER TABLE ${s}.loans RENAME TO emprunts;
    ALTER TABLE ${s}.loan_events RENAME TO evenements_emprunt;
    ALTER TABLE ${s}.foundation_status RENAME TO statut_fondation;

    ALTER TABLE ${s}.matieres RENAME COLUMN name TO nom;
    ALTER TABLE ${s}.matieres RENAME COLUMN is_active TO est_active;
    ALTER TABLE ${s}.matieres RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.matieres RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN name TO nom;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN is_active TO est_actif;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.ouvrages RENAME COLUMN title TO titre;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN subtitle TO sous_titre;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN publisher TO editeur;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN publication_year TO annee_publication;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN subject_id TO matiere_id;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN education_level_id TO niveau_scolaire_id;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN cover_image_key TO cle_image_couverture;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN is_active TO est_actif;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.exemplaires RENAME COLUMN book_id TO ouvrage_id;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN inventory_code TO code_inventaire;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN qr_code TO code_qr;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN status TO statut;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN acquisition_date TO date_acquisition;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN acquisition_price TO prix_acquisition;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN currency TO devise;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN notes TO observations;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.emprunteurs RENAME COLUMN borrower_number TO numero_emprunteur;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN first_name TO prenom;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN last_name TO nom;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN phone TO telephone;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN education_level_id TO niveau_scolaire_id;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN class_name TO classe;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN school_name TO etablissement;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN status TO statut;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.agents RENAME COLUMN external_auth_id TO identifiant_auth_externe;
    ALTER TABLE ${s}.agents RENAME COLUMN first_name TO prenom;
    ALTER TABLE ${s}.agents RENAME COLUMN last_name TO nom;
    ALTER TABLE ${s}.agents RENAME COLUMN status TO statut;
    ALTER TABLE ${s}.agents RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.agents RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.emprunts RENAME COLUMN book_copy_id TO exemplaire_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN borrower_id TO emprunteur_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN issued_by_staff_id TO agent_preteur_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN returned_to_staff_id TO agent_recepteur_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN loaned_at TO date_emprunt;
    ALTER TABLE ${s}.emprunts RENAME COLUMN due_at TO date_echeance;
    ALTER TABLE ${s}.emprunts RENAME COLUMN returned_at TO date_retour;
    ALTER TABLE ${s}.emprunts RENAME COLUMN status TO statut;
    ALTER TABLE ${s}.emprunts RENAME COLUMN return_condition TO etat_retour;
    ALTER TABLE ${s}.emprunts RENAME COLUMN notes TO observations;
    ALTER TABLE ${s}.emprunts RENAME COLUMN created_at TO date_creation;
    ALTER TABLE ${s}.emprunts RENAME COLUMN updated_at TO date_modification;

    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN loan_id TO emprunt_id;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN event_type TO type_evenement;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN performed_by_staff_id TO agent_id;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN event_at TO date_evenement;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN created_at TO date_creation;

    ALTER TABLE ${s}.statut_fondation RENAME COLUMN migrated_at TO date_migration;

    ALTER TABLE ${s}.matieres RENAME CONSTRAINT subjects_pkey TO pk_matieres;
    ALTER TABLE ${s}.matieres RENAME CONSTRAINT subjects_code_key TO uq_matieres_code;
    ALTER TABLE ${s}.matieres RENAME CONSTRAINT subjects_code_not_blank TO ck_matieres_code_non_vide;
    ALTER TABLE ${s}.matieres RENAME CONSTRAINT subjects_name_not_blank TO ck_matieres_nom_non_vide;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT education_levels_pkey TO pk_niveaux_scolaires;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT education_levels_code_key TO uq_niveaux_scolaires_code;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT education_levels_code_not_blank TO ck_niveaux_scolaires_code_non_vide;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT education_levels_name_not_blank TO ck_niveaux_scolaires_nom_non_vide;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT books_pkey TO pk_ouvrages;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT books_title_not_blank TO ck_ouvrages_titre_non_vide;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT books_publication_year_valid TO ck_ouvrages_annee_publication;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT books_subject_id_fkey TO fk_ouvrages_matiere;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT books_education_level_id_fkey TO fk_ouvrages_niveau_scolaire;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT book_copies_pkey TO pk_exemplaires;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT book_copies_inventory_code_key TO uq_exemplaires_code_inventaire;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT book_copies_inventory_code_not_blank TO ck_exemplaires_code_inventaire_non_vide;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT book_copies_acquisition_price_valid TO ck_exemplaires_prix_acquisition;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT book_copies_price_currency_consistent TO ck_exemplaires_prix_devise;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT book_copies_book_id_fkey TO fk_exemplaires_ouvrage;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT borrowers_pkey TO pk_emprunteurs;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT borrowers_borrower_number_key TO uq_emprunteurs_numero;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT borrowers_number_not_blank TO ck_emprunteurs_numero_non_vide;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT borrowers_names_not_blank TO ck_emprunteurs_noms_non_vides;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT borrowers_education_level_id_fkey TO fk_emprunteurs_niveau_scolaire;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT staff_members_pkey TO pk_agents;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT staff_members_email_key TO uq_agents_email;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT staff_members_external_auth_id_key TO uq_agents_identifiant_auth_externe;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT staff_members_names_not_blank TO ck_agents_noms_non_vides;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT staff_members_email_not_blank TO ck_agents_email_non_vide;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_pkey TO pk_emprunts;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_book_copy_id_fkey TO fk_emprunts_exemplaire;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_borrower_id_fkey TO fk_emprunts_emprunteur;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_issued_by_staff_id_fkey TO fk_emprunts_agent_preteur;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_returned_to_staff_id_fkey TO fk_emprunts_agent_recepteur;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_due_after_loaned TO ck_emprunts_date_echeance;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT loans_returned_after_loaned TO ck_emprunts_date_retour;
    ALTER TABLE ${s}.evenements_emprunt RENAME CONSTRAINT loan_events_pkey TO pk_evenements_emprunt;
    ALTER TABLE ${s}.evenements_emprunt RENAME CONSTRAINT loan_events_loan_id_fkey TO fk_evenements_emprunt;
    ALTER TABLE ${s}.evenements_emprunt RENAME CONSTRAINT loan_events_performed_by_staff_id_fkey TO fk_evenements_agent;
    ALTER TABLE ${s}.statut_fondation RENAME CONSTRAINT foundation_status_pkey TO pk_statut_fondation;

    ALTER INDEX ${s}.books_subject_id_index RENAME TO ix_ouvrages_matiere;
    ALTER INDEX ${s}.books_education_level_id_index RENAME TO ix_ouvrages_niveau_scolaire;
    ALTER INDEX ${s}.books_isbn_unique_index RENAME TO uq_ouvrages_isbn;
    ALTER INDEX ${s}.book_copies_book_id_index RENAME TO ix_exemplaires_ouvrage;
    ALTER INDEX ${s}.book_copies_qr_code_unique_index RENAME TO uq_exemplaires_code_qr;
    ALTER INDEX ${s}.book_copies_status_index RENAME TO ix_exemplaires_statut;
    ALTER INDEX ${s}.borrowers_education_level_id_index RENAME TO ix_emprunteurs_niveau_scolaire;
    ALTER INDEX ${s}.borrowers_status_index RENAME TO ix_emprunteurs_statut;
    ALTER INDEX ${s}.loans_borrower_id_index RENAME TO ix_emprunts_emprunteur;
    ALTER INDEX ${s}.loans_issued_by_staff_id_index RENAME TO ix_emprunts_agent_preteur;
    ALTER INDEX ${s}.loans_returned_to_staff_id_index RENAME TO ix_emprunts_agent_recepteur;
    ALTER INDEX ${s}.loans_status_due_at_index RENAME TO ix_emprunts_statut_echeance;
    ALTER INDEX ${s}.loan_events_loan_id_event_at_index RENAME TO ix_evenements_emprunt_date;
    ALTER INDEX ${s}.loan_events_performed_by_staff_id_index RENAME TO ix_evenements_agent;

    ALTER TABLE ${s}.exemplaires ADD CONSTRAINT ck_exemplaires_statut
      CHECK (statut IN ('PREVU','ACHETE','A_ETIQUETER','ETIQUETE','DISPONIBLE','EMPRUNTE','PERDU','ABIME','RETIRE'));
    ALTER TABLE ${s}.emprunteurs ADD CONSTRAINT ck_emprunteurs_statut
      CHECK (statut IN ('ACTIF','SUSPENDU','ARCHIVE'));
    ALTER TABLE ${s}.agents ADD CONSTRAINT ck_agents_role
      CHECK (role IN ('ADMIN','ENSEIGNANT','BIBLIOTHECAIRE','LECTEUR'));
    ALTER TABLE ${s}.agents ADD CONSTRAINT ck_agents_statut
      CHECK (statut IN ('ACTIF','DESACTIVE'));
    ALTER TABLE ${s}.emprunts ADD CONSTRAINT ck_emprunts_statut
      CHECK (statut IN ('ACTIF','RETOURNE','EN_RETARD','PERDU','ANNULE'));
    ALTER TABLE ${s}.emprunts ADD CONSTRAINT ck_emprunts_coherence_retour
      CHECK ((statut = 'RETOURNE' AND date_retour IS NOT NULL AND agent_recepteur_id IS NOT NULL)
        OR (statut IN ('ACTIF','EN_RETARD','PERDU','ANNULE') AND date_retour IS NULL));
    ALTER TABLE ${s}.evenements_emprunt ADD CONSTRAINT ck_evenements_emprunt_type
      CHECK (type_evenement IN ('CREE','PROLONGE','RETOURNE','MARQUE_EN_RETARD','MARQUE_PERDU','ANNULE','NOTE_AJOUTEE'));
    CREATE UNIQUE INDEX uq_emprunts_exemplaire_actif ON ${s}.emprunts (exemplaire_id)
      WHERE statut IN ('ACTIF','EN_RETARD');

    ALTER TRIGGER loan_events_immutable ON ${s}.evenements_emprunt
      RENAME TO evenements_emprunt_immuables;
    ALTER FUNCTION ${s}.prevent_loan_event_mutation()
      RENAME TO empecher_modification_evenement_emprunt;

    COMMENT ON TABLE ${s}.ouvrages IS 'Ouvrages intellectuels, independants des exemplaires physiques';
    COMMENT ON TABLE ${s}.exemplaires IS 'Exemplaires physiques identifies par un code inventaire et eventuellement un QR code';
    COMMENT ON TABLE ${s}.emprunts IS 'Emprunts actifs et historique des retours';
    COMMENT ON TABLE ${s}.evenements_emprunt IS 'Journal immuable des evenements du cycle de vie des emprunts';
    COMMENT ON COLUMN ${s}.agents.identifiant_auth_externe IS 'Identifiant futur du fournisseur identite, par exemple Amazon Cognito sub';
    COMMENT ON COLUMN ${s}.ouvrages.cle_image_couverture IS 'Cle portable de stockage objet, sans URL specifique a un fournisseur';
  `)
}

export function down(pgm: MigrationBuilder): void {
  const s = `"${schemaName()}"`

  pgm.sql(`
    ALTER TABLE ${s}.exemplaires DROP CONSTRAINT ck_exemplaires_statut;
    ALTER TABLE ${s}.emprunteurs DROP CONSTRAINT ck_emprunteurs_statut;
    ALTER TABLE ${s}.agents DROP CONSTRAINT ck_agents_role;
    ALTER TABLE ${s}.agents DROP CONSTRAINT ck_agents_statut;
    ALTER TABLE ${s}.emprunts DROP CONSTRAINT ck_emprunts_statut;
    ALTER TABLE ${s}.emprunts DROP CONSTRAINT ck_emprunts_coherence_retour;
    ALTER TABLE ${s}.evenements_emprunt DROP CONSTRAINT ck_evenements_emprunt_type;
    DROP INDEX ${s}.uq_emprunts_exemplaire_actif;

    UPDATE ${s}.exemplaires SET statut = CASE statut
      WHEN 'PREVU' THEN 'PLANNED' WHEN 'ACHETE' THEN 'PURCHASED'
      WHEN 'A_ETIQUETER' THEN 'TO_LABEL' WHEN 'ETIQUETE' THEN 'LABELED'
      WHEN 'DISPONIBLE' THEN 'AVAILABLE' WHEN 'EMPRUNTE' THEN 'BORROWED'
      WHEN 'PERDU' THEN 'LOST' WHEN 'ABIME' THEN 'DAMAGED'
      WHEN 'RETIRE' THEN 'RETIRED' ELSE statut END;
    UPDATE ${s}.emprunteurs SET statut = CASE statut
      WHEN 'ACTIF' THEN 'ACTIVE' WHEN 'SUSPENDU' THEN 'SUSPENDED'
      WHEN 'ARCHIVE' THEN 'ARCHIVED' ELSE statut END;
    UPDATE ${s}.agents SET role = CASE role
      WHEN 'ENSEIGNANT' THEN 'TEACHER' WHEN 'BIBLIOTHECAIRE' THEN 'LIBRARIAN'
      WHEN 'LECTEUR' THEN 'VIEWER' ELSE role END;
    UPDATE ${s}.agents SET statut = CASE statut
      WHEN 'ACTIF' THEN 'ACTIVE' WHEN 'DESACTIVE' THEN 'DISABLED' ELSE statut END;
    UPDATE ${s}.emprunts SET statut = CASE statut
      WHEN 'ACTIF' THEN 'ACTIVE' WHEN 'RETOURNE' THEN 'RETURNED'
      WHEN 'EN_RETARD' THEN 'OVERDUE' WHEN 'PERDU' THEN 'LOST'
      WHEN 'ANNULE' THEN 'CANCELLED' ELSE statut END;
    UPDATE ${s}.evenements_emprunt SET type_evenement = CASE type_evenement
      WHEN 'CREE' THEN 'CREATED' WHEN 'PROLONGE' THEN 'EXTENDED'
      WHEN 'RETOURNE' THEN 'RETURNED' WHEN 'MARQUE_EN_RETARD' THEN 'MARKED_OVERDUE'
      WHEN 'MARQUE_PERDU' THEN 'MARKED_LOST' WHEN 'ANNULE' THEN 'CANCELLED'
      WHEN 'NOTE_AJOUTEE' THEN 'NOTE_ADDED' ELSE type_evenement END;

    ALTER TABLE ${s}.exemplaires ALTER COLUMN statut SET DEFAULT 'PLANNED';
    ALTER TABLE ${s}.emprunteurs ALTER COLUMN statut SET DEFAULT 'ACTIVE';
    ALTER TABLE ${s}.agents ALTER COLUMN statut SET DEFAULT 'ACTIVE';
    ALTER TABLE ${s}.emprunts ALTER COLUMN statut SET DEFAULT 'ACTIVE';

    ALTER TRIGGER evenements_emprunt_immuables ON ${s}.evenements_emprunt
      RENAME TO loan_events_immutable;
    ALTER FUNCTION ${s}.empecher_modification_evenement_emprunt()
      RENAME TO prevent_loan_event_mutation;

    ALTER INDEX ${s}.ix_ouvrages_matiere RENAME TO books_subject_id_index;
    ALTER INDEX ${s}.ix_ouvrages_niveau_scolaire RENAME TO books_education_level_id_index;
    ALTER INDEX ${s}.uq_ouvrages_isbn RENAME TO books_isbn_unique_index;
    ALTER INDEX ${s}.ix_exemplaires_ouvrage RENAME TO book_copies_book_id_index;
    ALTER INDEX ${s}.uq_exemplaires_code_qr RENAME TO book_copies_qr_code_unique_index;
    ALTER INDEX ${s}.ix_exemplaires_statut RENAME TO book_copies_status_index;
    ALTER INDEX ${s}.ix_emprunteurs_niveau_scolaire RENAME TO borrowers_education_level_id_index;
    ALTER INDEX ${s}.ix_emprunteurs_statut RENAME TO borrowers_status_index;
    ALTER INDEX ${s}.ix_emprunts_emprunteur RENAME TO loans_borrower_id_index;
    ALTER INDEX ${s}.ix_emprunts_agent_preteur RENAME TO loans_issued_by_staff_id_index;
    ALTER INDEX ${s}.ix_emprunts_agent_recepteur RENAME TO loans_returned_to_staff_id_index;
    ALTER INDEX ${s}.ix_emprunts_statut_echeance RENAME TO loans_status_due_at_index;
    ALTER INDEX ${s}.ix_evenements_emprunt_date RENAME TO loan_events_loan_id_event_at_index;
    ALTER INDEX ${s}.ix_evenements_agent RENAME TO loan_events_performed_by_staff_id_index;

    ALTER TABLE ${s}.matieres RENAME CONSTRAINT pk_matieres TO subjects_pkey;
    ALTER TABLE ${s}.matieres RENAME CONSTRAINT uq_matieres_code TO subjects_code_key;
    ALTER TABLE ${s}.matieres RENAME CONSTRAINT ck_matieres_code_non_vide TO subjects_code_not_blank;
    ALTER TABLE ${s}.matieres RENAME CONSTRAINT ck_matieres_nom_non_vide TO subjects_name_not_blank;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT pk_niveaux_scolaires TO education_levels_pkey;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT uq_niveaux_scolaires_code TO education_levels_code_key;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT ck_niveaux_scolaires_code_non_vide TO education_levels_code_not_blank;
    ALTER TABLE ${s}.niveaux_scolaires RENAME CONSTRAINT ck_niveaux_scolaires_nom_non_vide TO education_levels_name_not_blank;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT pk_ouvrages TO books_pkey;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT ck_ouvrages_titre_non_vide TO books_title_not_blank;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT ck_ouvrages_annee_publication TO books_publication_year_valid;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT fk_ouvrages_matiere TO books_subject_id_fkey;
    ALTER TABLE ${s}.ouvrages RENAME CONSTRAINT fk_ouvrages_niveau_scolaire TO books_education_level_id_fkey;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT pk_exemplaires TO book_copies_pkey;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT uq_exemplaires_code_inventaire TO book_copies_inventory_code_key;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT ck_exemplaires_code_inventaire_non_vide TO book_copies_inventory_code_not_blank;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT ck_exemplaires_prix_acquisition TO book_copies_acquisition_price_valid;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT ck_exemplaires_prix_devise TO book_copies_price_currency_consistent;
    ALTER TABLE ${s}.exemplaires RENAME CONSTRAINT fk_exemplaires_ouvrage TO book_copies_book_id_fkey;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT pk_emprunteurs TO borrowers_pkey;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT uq_emprunteurs_numero TO borrowers_borrower_number_key;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT ck_emprunteurs_numero_non_vide TO borrowers_number_not_blank;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT ck_emprunteurs_noms_non_vides TO borrowers_names_not_blank;
    ALTER TABLE ${s}.emprunteurs RENAME CONSTRAINT fk_emprunteurs_niveau_scolaire TO borrowers_education_level_id_fkey;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT pk_agents TO staff_members_pkey;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT uq_agents_email TO staff_members_email_key;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT uq_agents_identifiant_auth_externe TO staff_members_external_auth_id_key;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT ck_agents_noms_non_vides TO staff_members_names_not_blank;
    ALTER TABLE ${s}.agents RENAME CONSTRAINT ck_agents_email_non_vide TO staff_members_email_not_blank;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT pk_emprunts TO loans_pkey;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT fk_emprunts_exemplaire TO loans_book_copy_id_fkey;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT fk_emprunts_emprunteur TO loans_borrower_id_fkey;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT fk_emprunts_agent_preteur TO loans_issued_by_staff_id_fkey;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT fk_emprunts_agent_recepteur TO loans_returned_to_staff_id_fkey;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT ck_emprunts_date_echeance TO loans_due_after_loaned;
    ALTER TABLE ${s}.emprunts RENAME CONSTRAINT ck_emprunts_date_retour TO loans_returned_after_loaned;
    ALTER TABLE ${s}.evenements_emprunt RENAME CONSTRAINT pk_evenements_emprunt TO loan_events_pkey;
    ALTER TABLE ${s}.evenements_emprunt RENAME CONSTRAINT fk_evenements_emprunt TO loan_events_loan_id_fkey;
    ALTER TABLE ${s}.evenements_emprunt RENAME CONSTRAINT fk_evenements_agent TO loan_events_performed_by_staff_id_fkey;
    ALTER TABLE ${s}.statut_fondation RENAME CONSTRAINT pk_statut_fondation TO foundation_status_pkey;

    ALTER TABLE ${s}.matieres RENAME COLUMN nom TO name;
    ALTER TABLE ${s}.matieres RENAME COLUMN est_active TO is_active;
    ALTER TABLE ${s}.matieres RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.matieres RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN nom TO name;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN est_actif TO is_active;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.niveaux_scolaires RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN titre TO title;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN sous_titre TO subtitle;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN editeur TO publisher;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN annee_publication TO publication_year;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN matiere_id TO subject_id;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN niveau_scolaire_id TO education_level_id;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN cle_image_couverture TO cover_image_key;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN est_actif TO is_active;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.ouvrages RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN ouvrage_id TO book_id;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN code_inventaire TO inventory_code;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN code_qr TO qr_code;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN statut TO status;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN date_acquisition TO acquisition_date;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN prix_acquisition TO acquisition_price;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN devise TO currency;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN observations TO notes;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.exemplaires RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN numero_emprunteur TO borrower_number;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN prenom TO first_name;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN nom TO last_name;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN telephone TO phone;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN niveau_scolaire_id TO education_level_id;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN classe TO class_name;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN etablissement TO school_name;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN statut TO status;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.emprunteurs RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.agents RENAME COLUMN identifiant_auth_externe TO external_auth_id;
    ALTER TABLE ${s}.agents RENAME COLUMN prenom TO first_name;
    ALTER TABLE ${s}.agents RENAME COLUMN nom TO last_name;
    ALTER TABLE ${s}.agents RENAME COLUMN statut TO status;
    ALTER TABLE ${s}.agents RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.agents RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.emprunts RENAME COLUMN exemplaire_id TO book_copy_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN emprunteur_id TO borrower_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN agent_preteur_id TO issued_by_staff_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN agent_recepteur_id TO returned_to_staff_id;
    ALTER TABLE ${s}.emprunts RENAME COLUMN date_emprunt TO loaned_at;
    ALTER TABLE ${s}.emprunts RENAME COLUMN date_echeance TO due_at;
    ALTER TABLE ${s}.emprunts RENAME COLUMN date_retour TO returned_at;
    ALTER TABLE ${s}.emprunts RENAME COLUMN statut TO status;
    ALTER TABLE ${s}.emprunts RENAME COLUMN etat_retour TO return_condition;
    ALTER TABLE ${s}.emprunts RENAME COLUMN observations TO notes;
    ALTER TABLE ${s}.emprunts RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.emprunts RENAME COLUMN date_modification TO updated_at;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN emprunt_id TO loan_id;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN type_evenement TO event_type;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN agent_id TO performed_by_staff_id;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN date_evenement TO event_at;
    ALTER TABLE ${s}.evenements_emprunt RENAME COLUMN date_creation TO created_at;
    ALTER TABLE ${s}.statut_fondation RENAME COLUMN date_migration TO migrated_at;

    ALTER TABLE ${s}.matieres RENAME TO subjects;
    ALTER TABLE ${s}.niveaux_scolaires RENAME TO education_levels;
    ALTER TABLE ${s}.ouvrages RENAME TO books;
    ALTER TABLE ${s}.exemplaires RENAME TO book_copies;
    ALTER TABLE ${s}.emprunteurs RENAME TO borrowers;
    ALTER TABLE ${s}.agents RENAME TO staff_members;
    ALTER TABLE ${s}.emprunts RENAME TO loans;
    ALTER TABLE ${s}.evenements_emprunt RENAME TO loan_events;
    ALTER TABLE ${s}.statut_fondation RENAME TO foundation_status;

    ALTER TABLE ${s}.book_copies ADD CONSTRAINT book_copies_status_valid
      CHECK (status IN ('PLANNED','PURCHASED','TO_LABEL','LABELED','AVAILABLE','BORROWED','LOST','DAMAGED','RETIRED'));
    ALTER TABLE ${s}.borrowers ADD CONSTRAINT borrowers_status_valid
      CHECK (status IN ('ACTIVE','SUSPENDED','ARCHIVED'));
    ALTER TABLE ${s}.staff_members ADD CONSTRAINT staff_members_role_valid
      CHECK (role IN ('ADMIN','TEACHER','LIBRARIAN','VIEWER'));
    ALTER TABLE ${s}.staff_members ADD CONSTRAINT staff_members_status_valid
      CHECK (status IN ('ACTIVE','DISABLED'));
    ALTER TABLE ${s}.loans ADD CONSTRAINT loans_status_valid
      CHECK (status IN ('ACTIVE','RETURNED','OVERDUE','LOST','CANCELLED'));
    ALTER TABLE ${s}.loans ADD CONSTRAINT loans_return_status_consistent
      CHECK ((status = 'RETURNED' AND returned_at IS NOT NULL AND returned_to_staff_id IS NOT NULL)
        OR (status IN ('ACTIVE','OVERDUE','LOST','CANCELLED') AND returned_at IS NULL));
    ALTER TABLE ${s}.loan_events ADD CONSTRAINT loan_events_type_valid
      CHECK (event_type IN ('CREATED','EXTENDED','RETURNED','MARKED_OVERDUE','MARKED_LOST','CANCELLED','NOTE_ADDED'));
    CREATE UNIQUE INDEX loans_one_open_per_copy_idx ON ${s}.loans (book_copy_id)
      WHERE status IN ('ACTIVE','OVERDUE');
  `)
}
