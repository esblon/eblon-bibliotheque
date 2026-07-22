import type { MigrationBuilder } from "node-pg-migrate"

function schemaName() {
  const value = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error("DATABASE_SCHEMA is invalid")
  return value
}

export function up(pgm: MigrationBuilder): void {
  const s = `"${schemaName()}"`
  pgm.sql(`
    INSERT INTO ${s}.niveaux_scolaires(id,code,nom,est_actif)
    VALUES
      ('21000000-0000-4000-8000-000000000001','CYCLE_1','1er Cycle',true),
      ('21000000-0000-4000-8000-000000000002','CYCLE_2','2nd Cycle',true)
    ON CONFLICT(code) DO UPDATE SET nom=EXCLUDED.nom,est_actif=true,date_modification=current_timestamp;

    CREATE TABLE ${s}.classes_scolaires(
      id uuid PRIMARY KEY,
      niveau_scolaire_id uuid NOT NULL REFERENCES ${s}.niveaux_scolaires(id) ON DELETE RESTRICT,
      code text NOT NULL UNIQUE,
      nom text NOT NULL,
      ordre integer NOT NULL,
      est_active boolean NOT NULL DEFAULT true,
      date_creation timestamptz NOT NULL DEFAULT current_timestamp,
      date_modification timestamptz NOT NULL DEFAULT current_timestamp,
      CONSTRAINT ck_classes_scolaires_code_non_vide CHECK(btrim(code)<>''),
      CONSTRAINT ck_classes_scolaires_nom_non_vide CHECK(btrim(nom)<>'')
    );
    CREATE INDEX ix_classes_scolaires_niveau ON ${s}.classes_scolaires(niveau_scolaire_id);

    INSERT INTO ${s}.classes_scolaires(id,niveau_scolaire_id,code,nom,ordre)
    VALUES
      ('22000000-0000-4000-8000-000000000001','21000000-0000-4000-8000-000000000001','6E','6e',10),
      ('22000000-0000-4000-8000-000000000002','21000000-0000-4000-8000-000000000001','5E','5e',20),
      ('22000000-0000-4000-8000-000000000003','21000000-0000-4000-8000-000000000001','4E','4e',30),
      ('22000000-0000-4000-8000-000000000004','21000000-0000-4000-8000-000000000001','3E','3e',40),
      ('22000000-0000-4000-8000-000000000005','21000000-0000-4000-8000-000000000002','2ND_A2','2ndA2',10),
      ('22000000-0000-4000-8000-000000000006','21000000-0000-4000-8000-000000000002','2ND_C','2ndC',20);

    CREATE TABLE ${s}.etablissements(
      id uuid PRIMARY KEY,
      code text NOT NULL UNIQUE,
      nom text NOT NULL UNIQUE,
      est_actif boolean NOT NULL DEFAULT true,
      date_creation timestamptz NOT NULL DEFAULT current_timestamp,
      date_modification timestamptz NOT NULL DEFAULT current_timestamp,
      CONSTRAINT ck_etablissements_code_non_vide CHECK(btrim(code)<>''),
      CONSTRAINT ck_etablissements_nom_non_vide CHECK(btrim(nom)<>'')
    );
    INSERT INTO ${s}.etablissements(id,code,nom)
    VALUES ('23000000-0000-4000-8000-000000000001','LMF','Lycée Moderne Facobly');

    ALTER TABLE ${s}.emprunteurs
      ADD COLUMN classe_scolaire_id uuid REFERENCES ${s}.classes_scolaires(id) ON DELETE RESTRICT,
      ADD COLUMN etablissement_id uuid REFERENCES ${s}.etablissements(id) ON DELETE RESTRICT;
    CREATE INDEX ix_emprunteurs_classe_scolaire ON ${s}.emprunteurs(classe_scolaire_id);
    CREATE INDEX ix_emprunteurs_etablissement ON ${s}.emprunteurs(etablissement_id);
  `)
}

export function down(pgm: MigrationBuilder): void {
  const s = `"${schemaName()}"`
  pgm.sql(`
    DROP INDEX ${s}.ix_emprunteurs_etablissement;
    DROP INDEX ${s}.ix_emprunteurs_classe_scolaire;
    ALTER TABLE ${s}.emprunteurs DROP COLUMN etablissement_id,DROP COLUMN classe_scolaire_id;
    DROP TABLE ${s}.etablissements;
    DROP TABLE ${s}.classes_scolaires;
  `)
}
