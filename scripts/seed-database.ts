import { Client } from "pg"
import { parseServerEnvironment } from "../config/env"

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()
  const client = new Client({ connectionString: DATABASE_URL })
  const schema = `"${DATABASE_SCHEMA}"`

  try {
    await client.connect()
    await client.query("BEGIN")

    await client.query(`
      INSERT INTO ${schema}.matieres (id, code, nom) VALUES
        ('10000000-0000-4000-8000-000000000001', 'MATH', 'Mathématiques'),
        ('10000000-0000-4000-8000-000000000002', 'FR', 'Français'),
        ('10000000-0000-4000-8000-000000000003', 'EN', 'Anglais'),
        ('10000000-0000-4000-8000-000000000004', 'PHYS', 'Sciences physiques'),
        ('10000000-0000-4000-8000-000000000005', 'SVT', 'SVT'),
        ('10000000-0000-4000-8000-000000000006', 'HISTGEO', 'Histoire-Géographie')
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        nom = EXCLUDED.nom,
        est_active = true,
        date_modification = current_timestamp;

      INSERT INTO ${schema}.niveaux_scolaires (id, code, nom) VALUES
        ('20000000-0000-4000-8000-000000000001', '3E', '3e'),
        ('20000000-0000-4000-8000-000000000002', 'TERM_A', 'Terminale A'),
        ('20000000-0000-4000-8000-000000000003', 'TERM_C', 'Terminale C'),
        ('20000000-0000-4000-8000-000000000004', 'TERM_D', 'Terminale D')
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        nom = EXCLUDED.nom,
        est_actif = true,
        date_modification = current_timestamp;

      INSERT INTO ${schema}.ouvrages (
        id, titre, sous_titre, editeur, edition, annee_publication,
        description, matiere_id, niveau_scolaire_id
      ) VALUES
        (
          '30000000-0000-4000-8000-000000000001',
          'Annales de mathématiques 3e', NULL, 'Éditions Démo', '2026', 2026,
          'Ouvrage fictif pour le développement local.',
          '10000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000001'
        ),
        (
          '30000000-0000-4000-8000-000000000002',
          'Préparation au français Terminale', NULL, 'Éditions Démo', '2026', 2026,
          'Ouvrage fictif pour le développement local.',
          '10000000-0000-4000-8000-000000000002',
          '20000000-0000-4000-8000-000000000002'
        ),
        (
          '30000000-0000-4000-8000-000000000003',
          'Sciences physiques Terminale C', NULL, 'Éditions Démo', '2026', 2026,
          'Ouvrage fictif pour le développement local.',
          '10000000-0000-4000-8000-000000000004',
          '20000000-0000-4000-8000-000000000003'
        )
      ON CONFLICT (id) DO UPDATE SET
        titre = EXCLUDED.titre,
        editeur = EXCLUDED.editeur,
        edition = EXCLUDED.edition,
        annee_publication = EXCLUDED.annee_publication,
        description = EXCLUDED.description,
        matiere_id = EXCLUDED.matiere_id,
        niveau_scolaire_id = EXCLUDED.niveau_scolaire_id,
        est_actif = true,
        date_modification = current_timestamp;

      INSERT INTO ${schema}.exemplaires (
        id, ouvrage_id, code_inventaire, code_qr, statut, date_acquisition, observations
      ) VALUES
        ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'DEV-MATH-001', 'DEV-QR-MATH-001', 'DISPONIBLE', current_date, 'Donnée fictive'),
        ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'DEV-MATH-002', 'DEV-QR-MATH-002', 'DISPONIBLE', current_date, 'Donnée fictive'),
        ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'DEV-FR-001', 'DEV-QR-FR-001', 'DISPONIBLE', current_date, 'Donnée fictive'),
        ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', 'DEV-PHYS-001', 'DEV-QR-PHYS-001', 'ETIQUETE', current_date, 'Donnée fictive')
      ON CONFLICT (id) DO UPDATE SET
        ouvrage_id = EXCLUDED.ouvrage_id,
        code_inventaire = EXCLUDED.code_inventaire,
        code_qr = EXCLUDED.code_qr,
        statut = EXCLUDED.statut,
        date_acquisition = EXCLUDED.date_acquisition,
        observations = EXCLUDED.observations,
        date_modification = current_timestamp;

      INSERT INTO ${schema}.emprunteurs (
        id, numero_emprunteur, prenom, nom, niveau_scolaire_id,
        classe, etablissement, statut
      ) VALUES
        ('50000000-0000-4000-8000-000000000001', 'DEV-ELV-001', 'Awa', 'Exemple', '20000000-0000-4000-8000-000000000001', '3e Démo', 'Établissement fictif', 'ACTIF'),
        ('50000000-0000-4000-8000-000000000002', 'DEV-ELV-002', 'Koffi', 'Exemple', '20000000-0000-4000-8000-000000000003', 'Terminale C Démo', 'Établissement fictif', 'ACTIF')
      ON CONFLICT (id) DO UPDATE SET
        numero_emprunteur = EXCLUDED.numero_emprunteur,
        prenom = EXCLUDED.prenom,
        nom = EXCLUDED.nom,
        niveau_scolaire_id = EXCLUDED.niveau_scolaire_id,
        classe = EXCLUDED.classe,
        etablissement = EXCLUDED.etablissement,
        statut = EXCLUDED.statut,
        date_modification = current_timestamp;

      INSERT INTO ${schema}.agents (
        id, identifiant_auth_externe, prenom, nom, email, role, statut
      ) VALUES (
        '60000000-0000-4000-8000-000000000001',
        'dev-staff-001', 'Responsable', 'Exemple',
        'responsable@example.invalid', 'BIBLIOTHECAIRE', 'ACTIF'
      )
      ON CONFLICT (id) DO UPDATE SET
        identifiant_auth_externe = EXCLUDED.identifiant_auth_externe,
        prenom = EXCLUDED.prenom,
        nom = EXCLUDED.nom,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        statut = EXCLUDED.statut,
        date_modification = current_timestamp;
    `)

    await client.query("COMMIT")
    console.log("Development seed data: OK")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Database seed failed")
  process.exitCode = 1
})
