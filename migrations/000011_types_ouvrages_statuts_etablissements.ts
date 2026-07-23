import type { MigrationBuilder } from "node-pg-migrate"

function schemaName() {
  const value = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error("DATABASE_SCHEMA is invalid")
  return value
}

export function up(pgm: MigrationBuilder): void {
  const s = `"${schemaName()}"`
  pgm.sql(`
    CREATE TABLE ${s}.types_ouvrages (
      id uuid PRIMARY KEY,
      code text NOT NULL UNIQUE,
      nom text NOT NULL UNIQUE,
      description text,
      est_actif boolean NOT NULL DEFAULT true,
      date_creation timestamptz NOT NULL DEFAULT current_timestamp,
      date_modification timestamptz NOT NULL DEFAULT current_timestamp
    );

    INSERT INTO ${s}.types_ouvrages (id, code, nom, description) VALUES
      ('25000000-0000-4000-8000-000000000001', 'ANNALE', 'Annale', 'Sujets et corrigés d’examens ou de concours'),
      ('25000000-0000-4000-8000-000000000002', 'MANUEL_SCOLAIRE', 'Manuel scolaire', 'Ouvrage principal d’enseignement associé à une discipline'),
      ('25000000-0000-4000-8000-000000000003', 'PARASCOLAIRE', 'Parascolaire', 'Cahier d’exercices, révisions et préparation scolaire'),
      ('25000000-0000-4000-8000-000000000004', 'OEUVRE_LITTERAIRE', 'Œuvre littéraire', 'Roman, conte, poésie, théâtre ou nouvelle'),
      ('25000000-0000-4000-8000-000000000005', 'OUVRAGE_REFERENCE', 'Ouvrage de référence', 'Dictionnaire, encyclopédie, atlas ou guide'),
      ('25000000-0000-4000-8000-000000000006', 'REVUE_PERIODIQUE', 'Revue et périodique', 'Revue, magazine, journal ou publication périodique'),
      ('25000000-0000-4000-8000-000000000007', 'BANDE_DESSINEE', 'Bande dessinée', 'Bande dessinée, album illustré ou manga'),
      ('25000000-0000-4000-8000-000000000008', 'AUTRE', 'Autre', 'Document ne relevant pas des catégories précédentes');

    ALTER TABLE ${s}.ouvrages
      ADD COLUMN type_ouvrage_id uuid REFERENCES ${s}.types_ouvrages(id) ON DELETE RESTRICT,
      ADD COLUMN au_programme_scolaire boolean NOT NULL DEFAULT false;

    UPDATE ${s}.ouvrages
    SET type_ouvrage_id = CASE
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(annale|sujet.{0,15}(examen|concours)|corrig.{0,10}(examen|concours))'
        THEN '25000000-0000-4000-8000-000000000001'::uuid
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(manuel|livre scolaire)'
        THEN '25000000-0000-4000-8000-000000000002'::uuid
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(cahier.{0,15}exercice|parascolaire|r.vision|pr.paration scolaire)'
        THEN '25000000-0000-4000-8000-000000000003'::uuid
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(roman|conte|po.sie|th..tre|nouvelle)'
        THEN '25000000-0000-4000-8000-000000000004'::uuid
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(dictionnaire|encyclop.die|atlas|ouvrage de r.f.rence)'
        THEN '25000000-0000-4000-8000-000000000005'::uuid
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(revue|magazine|journal|p.riodique)'
        THEN '25000000-0000-4000-8000-000000000006'::uuid
      WHEN lower(coalesce(titre, '') || ' ' || coalesce(description, '')) ~ '(bande dessin.e|manga|album illustr.)'
        THEN '25000000-0000-4000-8000-000000000007'::uuid
      ELSE '25000000-0000-4000-8000-000000000008'::uuid
    END;
    UPDATE ${s}.ouvrages
      SET au_programme_scolaire = true
      WHERE type_ouvrage_id = '25000000-0000-4000-8000-000000000002'::uuid
        AND (niveau_scolaire_id IS NOT NULL OR classe_scolaire_id IS NOT NULL);
    ALTER TABLE ${s}.ouvrages ALTER COLUMN type_ouvrage_id SET NOT NULL;
    CREATE INDEX ix_ouvrages_type_ouvrage ON ${s}.ouvrages(type_ouvrage_id);

    ALTER TABLE ${s}.etablissements
      ADD COLUMN statut text NOT NULL DEFAULT 'INITIALISATION';
    UPDATE ${s}.etablissements SET statut = CASE WHEN est_actif THEN 'ACTIF' ELSE 'INACTIF' END;
    ALTER TABLE ${s}.etablissements
      ADD CONSTRAINT ck_etablissements_statut
      CHECK (statut IN ('INITIALISATION', 'ACTIF', 'INACTIF', 'DESACTIVE'));

    CREATE FUNCTION ${s}.synchroniser_statut_etablissement() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      NEW.est_actif := NEW.statut = 'ACTIF';
      RETURN NEW;
    END $$;
    CREATE TRIGGER trg_etablissements_statut
      BEFORE INSERT OR UPDATE OF statut ON ${s}.etablissements
      FOR EACH ROW EXECUTE FUNCTION ${s}.synchroniser_statut_etablissement();
  `)
}

export function down(pgm: MigrationBuilder): void {
  const s = `"${schemaName()}"`
  pgm.sql(`
    DROP TRIGGER trg_etablissements_statut ON ${s}.etablissements;
    DROP FUNCTION ${s}.synchroniser_statut_etablissement();
    ALTER TABLE ${s}.etablissements DROP CONSTRAINT ck_etablissements_statut;
    ALTER TABLE ${s}.etablissements DROP COLUMN statut;
    DROP INDEX ${s}.ix_ouvrages_type_ouvrage;
    ALTER TABLE ${s}.ouvrages DROP COLUMN au_programme_scolaire;
    ALTER TABLE ${s}.ouvrages DROP COLUMN type_ouvrage_id;
    DROP TABLE ${s}.types_ouvrages;
  `)
}
