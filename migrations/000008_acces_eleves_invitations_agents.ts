import type { MigrationBuilder } from "node-pg-migrate"

function schemaName(){const value=process.env.DATABASE_SCHEMA??"eblon_bibliotheque";if(!/^[a-z_][a-z0-9_]*$/.test(value))throw new Error("DATABASE_SCHEMA is invalid");return value}

export function up(pgm:MigrationBuilder):void{
 const s=`"${schemaName()}"`
 pgm.sql(`
  ALTER TABLE ${s}.ouvrages ALTER COLUMN niveau_scolaire_id DROP NOT NULL;
  ALTER TABLE ${s}.emprunteurs ADD COLUMN identifiant_auth_externe text;
  CREATE UNIQUE INDEX uq_emprunteurs_identifiant_auth_externe ON ${s}.emprunteurs(identifiant_auth_externe) WHERE identifiant_auth_externe IS NOT NULL;
  CREATE UNIQUE INDEX uq_emprunteurs_email_normalise ON ${s}.emprunteurs(lower(email)) WHERE email IS NOT NULL;
  ALTER TABLE ${s}.emprunteurs DROP CONSTRAINT ck_emprunteurs_statut;
  ALTER TABLE ${s}.emprunteurs ADD CONSTRAINT ck_emprunteurs_statut CHECK(statut IN ('EN_ATTENTE','ACTIF','SUSPENDU','ARCHIVE'));

  CREATE TABLE ${s}.invitations_agents(
   id uuid PRIMARY KEY,
   agent_id uuid NOT NULL REFERENCES ${s}.agents(id) ON DELETE CASCADE,
   empreinte_jeton text NOT NULL UNIQUE,
   date_expiration timestamptz NOT NULL,
   date_utilisation timestamptz,
   date_envoi timestamptz,
   date_creation timestamptz NOT NULL DEFAULT current_timestamp,
   CONSTRAINT ck_invitations_agents_expiration CHECK(date_expiration>date_creation)
  );
  CREATE INDEX ix_invitations_agents_agent ON ${s}.invitations_agents(agent_id);
  COMMENT ON TABLE ${s}.invitations_agents IS 'Invitations a usage unique permettant aux agents de definir leur mot de passe';
  COMMENT ON COLUMN ${s}.emprunteurs.identifiant_auth_externe IS 'Identifiant Better Auth du compte eleve associe';
  COMMENT ON COLUMN ${s}.ouvrages.niveau_scolaire_id IS 'NULL designe un ouvrage accessible a tous les niveaux';
 `)
}

export function down(pgm:MigrationBuilder):void{
 const s=`"${schemaName()}"`
 pgm.sql(`
  DROP TABLE ${s}.invitations_agents;
  UPDATE ${s}.emprunteurs SET statut='SUSPENDU' WHERE statut='EN_ATTENTE';
  ALTER TABLE ${s}.emprunteurs DROP CONSTRAINT ck_emprunteurs_statut;
  ALTER TABLE ${s}.emprunteurs ADD CONSTRAINT ck_emprunteurs_statut CHECK(statut IN ('ACTIF','SUSPENDU','ARCHIVE'));
  DROP INDEX ${s}.uq_emprunteurs_email_normalise;
  DROP INDEX ${s}.uq_emprunteurs_identifiant_auth_externe;
  ALTER TABLE ${s}.emprunteurs DROP COLUMN identifiant_auth_externe;
  UPDATE ${s}.ouvrages SET niveau_scolaire_id=(SELECT id FROM ${s}.niveaux_scolaires WHERE est_actif ORDER BY code LIMIT 1) WHERE niveau_scolaire_id IS NULL;
  ALTER TABLE ${s}.ouvrages ALTER COLUMN niveau_scolaire_id SET NOT NULL;
 `)
}
