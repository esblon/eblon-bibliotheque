import type { MigrationBuilder } from "node-pg-migrate"

function schemaName(){const value=process.env.DATABASE_SCHEMA??"eblon_bibliotheque";if(!/^[a-z_][a-z0-9_]*$/.test(value))throw new Error("DATABASE_SCHEMA is invalid");return value}

export function up(pgm:MigrationBuilder):void{
 const s=`"${schemaName()}"`
 pgm.sql(`
  CREATE TABLE ${s}.roles_agents(
   id uuid PRIMARY KEY,code text NOT NULL UNIQUE,nom text NOT NULL UNIQUE,description text,role_base text NOT NULL,
   est_actif boolean NOT NULL DEFAULT true,date_creation timestamptz NOT NULL DEFAULT current_timestamp,
   date_modification timestamptz NOT NULL DEFAULT current_timestamp
  );
  INSERT INTO ${s}.roles_agents(id,code,nom,description,role_base) VALUES
   ('24000000-0000-4000-8000-000000000001','ADMIN','Administrateur','Accès complet à la configuration et aux opérations','ADMIN'),
   ('24000000-0000-4000-8000-000000000002','BIBLIOTHECAIRE','Bibliothécaire','Gestion du catalogue, des élèves et des prêts','BIBLIOTHECAIRE'),
   ('24000000-0000-4000-8000-000000000003','ENSEIGNANT','Enseignant','Consultation et gestion des prêts autorisés','ENSEIGNANT'),
   ('24000000-0000-4000-8000-000000000004','LECTEUR','Lecture seule','Consultation sans modification','LECTEUR');
  ALTER TABLE ${s}.roles_agents ADD CONSTRAINT ck_roles_agents_base CHECK(role_base IN('ADMIN','BIBLIOTHECAIRE','ENSEIGNANT','LECTEUR'));
  ALTER TABLE ${s}.agents DROP CONSTRAINT ck_agents_role;
  ALTER TABLE ${s}.agents ADD CONSTRAINT fk_agents_role_configuration FOREIGN KEY(role) REFERENCES ${s}.roles_agents(code) ON UPDATE CASCADE;

  ALTER TABLE ${s}.etablissements ADD COLUMN type_etablissement text;
  UPDATE ${s}.etablissements SET type_etablissement='SECONDAIRE' WHERE type_etablissement IS NULL;
  ALTER TABLE ${s}.etablissements ALTER COLUMN type_etablissement SET NOT NULL;
  ALTER TABLE ${s}.etablissements ADD CONSTRAINT ck_etablissements_type CHECK(type_etablissement IN ('PERISCOLAIRE','PRIMAIRE','SECONDAIRE'));
  INSERT INTO ${s}.etablissements(id,code,nom,type_etablissement) VALUES
   ('23000000-0000-4000-8000-000000000002','CPK','Collège Privé Kalomah','SECONDAIRE'),
   ('23000000-0000-4000-8000-000000000003','EPC','École Primaire Catholique','PRIMAIRE'),
   ('23000000-0000-4000-8000-000000000004','EPPR','École Primaire Protestante','PRIMAIRE'),
   ('23000000-0000-4000-8000-000000000005','EPP_AKA_1','EPP AKA 1','PRIMAIRE'),
   ('23000000-0000-4000-8000-000000000006','JEF','Jardin Enfants Facobly','PERISCOLAIRE')
  ON CONFLICT(code) DO UPDATE SET nom=EXCLUDED.nom,type_etablissement=EXCLUDED.type_etablissement,est_actif=true,date_modification=current_timestamp;

  INSERT INTO ${s}.niveaux_scolaires(id,code,nom,est_actif) VALUES
   ('21000000-0000-4000-8000-000000000003','PRIMAIRE','Primaire',true)
  ON CONFLICT(code) DO UPDATE SET nom=EXCLUDED.nom,est_actif=true,date_modification=current_timestamp;
  INSERT INTO ${s}.classes_scolaires(id,niveau_scolaire_id,code,nom,ordre) VALUES
   ('22000000-0000-4000-8000-000000000007','21000000-0000-4000-8000-000000000002','1ERE_D','1ère D',30),
   ('22000000-0000-4000-8000-000000000008','21000000-0000-4000-8000-000000000002','1ERE_A2','1ère A2',40),
   ('22000000-0000-4000-8000-000000000009','21000000-0000-4000-8000-000000000002','1ERE_C','1ère C',50),
   ('22000000-0000-4000-8000-000000000010','21000000-0000-4000-8000-000000000002','TLE_D','Tle D',60),
   ('22000000-0000-4000-8000-000000000011','21000000-0000-4000-8000-000000000002','TLE_A2','Tle A2',70),
   ('22000000-0000-4000-8000-000000000012','21000000-0000-4000-8000-000000000002','TLE_C','Tle C',80),
   ('22000000-0000-4000-8000-000000000013','21000000-0000-4000-8000-000000000003','CP1','CP1',10),
   ('22000000-0000-4000-8000-000000000014','21000000-0000-4000-8000-000000000003','CP2','CP2',20),
   ('22000000-0000-4000-8000-000000000015','21000000-0000-4000-8000-000000000003','CE1','CE1',30),
   ('22000000-0000-4000-8000-000000000016','21000000-0000-4000-8000-000000000003','CE2','CE2',40),
   ('22000000-0000-4000-8000-000000000017','21000000-0000-4000-8000-000000000003','CM1','CM1',50),
   ('22000000-0000-4000-8000-000000000018','21000000-0000-4000-8000-000000000003','CM2','CM2',60)
  ON CONFLICT(code) DO UPDATE SET niveau_scolaire_id=EXCLUDED.niveau_scolaire_id,nom=EXCLUDED.nom,ordre=EXCLUDED.ordre,est_active=true,date_modification=current_timestamp;

  ALTER TABLE ${s}.ouvrages ADD COLUMN classe_scolaire_id uuid REFERENCES ${s}.classes_scolaires(id) ON DELETE RESTRICT;
  CREATE INDEX ix_ouvrages_classe_scolaire ON ${s}.ouvrages(classe_scolaire_id);
  INSERT INTO ${s}.matieres(id,code,nom) VALUES
   ('10000000-0000-4000-8000-000000000001','MATH','Mathématiques'),
   ('10000000-0000-4000-8000-000000000002','FR','Français'),
   ('10000000-0000-4000-8000-000000000003','EN','Anglais'),
   ('10000000-0000-4000-8000-000000000004','PHYS','Physique-Chimie'),
   ('10000000-0000-4000-8000-000000000005','SVT','Sciences de la vie et de la Terre'),
   ('10000000-0000-4000-8000-000000000006','HISTGEO','Histoire-Géographie'),
   ('10000000-0000-4000-8000-000000000007','EDHC','Éducation aux droits de l’homme et à la citoyenneté'),
   ('10000000-0000-4000-8000-000000000008','EPS','Éducation physique et sportive'),
   ('10000000-0000-4000-8000-000000000009','AEC','Activités d’expression et de création'),
   ('10000000-0000-4000-8000-000000000010','SCI_TECH','Sciences et technologie'),
   ('10000000-0000-4000-8000-000000000011','PHILO','Philosophie'),
   ('10000000-0000-4000-8000-000000000012','ESP','Espagnol')
  ON CONFLICT(code) DO UPDATE SET nom=EXCLUDED.nom,est_active=true,date_modification=current_timestamp;

  INSERT INTO ${s}.agents(id,prenom,nom,email,role,statut) VALUES
   ('60000000-0000-4000-8000-000000000005','Bibliothécaire','UAT','bibliothecaire.uat@example.invalid','BIBLIOTHECAIRE','ACTIF')
  ON CONFLICT(email) DO UPDATE SET role='BIBLIOTHECAIRE',statut='ACTIF',date_modification=current_timestamp;

  DO $$
  DECLARE c record;m record;i integer;j integer;ouvrage_id uuid;eleve_id uuid;exemplaire_id uuid;
   prenoms text[]:=ARRAY['Awa','Koffi','Aïcha','Yannick','Mariam','Kevin','Fatou','Arnaud','Clarisse','Moussa','Esther','Aminata','Emmanuel','Rokia','Wilfried','Prisca','Souleymane','Christelle'];
   noms text[]:=ARRAY['Koné','Kouassi','Yao','Traoré','N’Guessan','Ouattara','Amani','Bamba','Koffi','Assi','Coulibaly','Ahoua','Fofana','Diabaté','Zadi','Adou','Bakayoko','N’Dri'];
  BEGIN
   FOR c IN SELECT cls.*,n.code niveau_code FROM ${s}.classes_scolaires cls JOIN ${s}.niveaux_scolaires n ON n.id=cls.niveau_scolaire_id WHERE n.code IN('PRIMAIRE','CYCLE_1','CYCLE_2') ORDER BY n.code,cls.ordre LOOP
    FOR m IN SELECT * FROM ${s}.matieres WHERE
     (c.niveau_code='PRIMAIRE' AND code IN('FR','MATH','EDHC','EPS','AEC','SCI_TECH')) OR
     (c.niveau_code<>'PRIMAIRE' AND code IN('FR','MATH','EDHC','EPS','EN','HISTGEO','PHYS','SVT','ESP')) OR
     (c.code LIKE 'TLE_%' AND code='PHILO')
    LOOP
     ouvrage_id:=md5('manuel-'||c.code||'-'||m.code)::uuid;
     INSERT INTO ${s}.ouvrages(id,titre,editeur,edition,annee_publication,description,matiere_id,niveau_scolaire_id,classe_scolaire_id,est_actif)
      VALUES(ouvrage_id,'Manuel de '||m.nom||' — '||c.nom,'Collection École Ivoirienne','UAT 2026',2026,'Jeu de données UAT fondé sur les disciplines des programmes de la DPFC.',m.id,c.niveau_scolaire_id,c.id,true)
      ON CONFLICT(id) DO UPDATE SET titre=EXCLUDED.titre,matiere_id=EXCLUDED.matiere_id,niveau_scolaire_id=EXCLUDED.niveau_scolaire_id,classe_scolaire_id=EXCLUDED.classe_scolaire_id,est_actif=true;
     FOR j IN 1..10 LOOP
      exemplaire_id:=md5('exemplaire-'||c.code||'-'||m.code||'-'||j)::uuid;
      INSERT INTO ${s}.exemplaires(id,ouvrage_id,code_inventaire,code_qr,statut,date_acquisition,observations)
       VALUES(exemplaire_id,ouvrage_id,'UAT-'||c.code||'-'||m.code||'-'||lpad(j::text,2,'0'),'UAT-QR-'||c.code||'-'||m.code||'-'||lpad(j::text,2,'0'),'DISPONIBLE',current_date,'Exemplaire de recette UAT')
       ON CONFLICT(id) DO UPDATE SET ouvrage_id=EXCLUDED.ouvrage_id,code_inventaire=EXCLUDED.code_inventaire,code_qr=EXCLUDED.code_qr;
     END LOOP;
    END LOOP;
    FOR i IN 1..10 LOOP
     eleve_id:=md5('eleve-'||c.code||'-'||i)::uuid;
     INSERT INTO ${s}.emprunteurs(id,numero_emprunteur,prenom,nom,niveau_scolaire_id,classe_scolaire_id,classe,etablissement_id,etablissement,statut)
      VALUES(eleve_id,'UAT-'||c.code||'-ELV-'||lpad(i::text,2,'0'),prenoms[((i+c.ordre)%array_length(prenoms,1))+1],noms[((i*2+c.ordre)%array_length(noms,1))+1],c.niveau_scolaire_id,c.id,c.nom,
       CASE WHEN c.niveau_code='PRIMAIRE' THEN '23000000-0000-4000-8000-000000000003'::uuid ELSE '23000000-0000-4000-8000-000000000001'::uuid END,
       CASE WHEN c.niveau_code='PRIMAIRE' THEN 'École Primaire Catholique' ELSE 'Lycée Moderne Facobly' END,'ACTIF')
      ON CONFLICT(id) DO UPDATE SET prenom=EXCLUDED.prenom,nom=EXCLUDED.nom,niveau_scolaire_id=EXCLUDED.niveau_scolaire_id,classe_scolaire_id=EXCLUDED.classe_scolaire_id,classe=EXCLUDED.classe,etablissement_id=EXCLUDED.etablissement_id,etablissement=EXCLUDED.etablissement,statut='ACTIF';
    END LOOP;
   END LOOP;
   FOR i IN 1..24 LOOP
    INSERT INTO ${s}.emprunts(id,exemplaire_id,emprunteur_id,agent_preteur_id,agent_recepteur_id,date_emprunt,date_echeance,date_retour,statut,observations)
    SELECT md5('pret-uat-'||i)::uuid,x.id,e.id,'60000000-0000-4000-8000-000000000005',CASE WHEN i%6<>0 AND i%4=0 THEN '60000000-0000-4000-8000-000000000005'::uuid ELSE NULL END,current_timestamp-(i||' days')::interval,current_timestamp-((i-7)||' days')::interval,
     CASE WHEN i%6<>0 AND i%4=0 THEN current_timestamp-(i%3||' days')::interval ELSE NULL END,
     CASE WHEN i%6=0 THEN 'PERDU' WHEN i%4=0 THEN 'RETOURNE' WHEN i%3=0 THEN 'EN_RETARD' ELSE 'ACTIF' END,'Prêt de recette UAT'
    FROM (SELECT id,row_number() over(order by code_inventaire) rn FROM ${s}.exemplaires WHERE code_inventaire LIKE 'UAT-%') x
    JOIN (SELECT id,row_number() over(order by numero_emprunteur) rn FROM ${s}.emprunteurs WHERE numero_emprunteur LIKE 'UAT-%') e ON e.rn=x.rn
    WHERE x.rn=i ON CONFLICT(id) DO NOTHING;
   END LOOP;
   UPDATE ${s}.exemplaires x SET statut='EMPRUNTE' FROM ${s}.emprunts p WHERE p.exemplaire_id=x.id AND p.statut IN('ACTIF','EN_RETARD');
  END $$;
 `)
}

export function down(pgm:MigrationBuilder):void{const s=`"${schemaName()}"`;pgm.sql(`DROP INDEX ${s}.ix_ouvrages_classe_scolaire;ALTER TABLE ${s}.ouvrages DROP COLUMN classe_scolaire_id;ALTER TABLE ${s}.etablissements DROP CONSTRAINT ck_etablissements_type;ALTER TABLE ${s}.etablissements DROP COLUMN type_etablissement;DROP TABLE ${s}.roles_agents;`)}
