import { randomUUID } from "node:crypto"
import { Client } from "pg"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { parseServerEnvironment } from "@/config/env"

const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()
const schema = `"${DATABASE_SCHEMA}"`
const client = new Client({ connectionString: DATABASE_URL })

type DonneesTest = {
  matiereId: string
  niveauId: string
  ouvrageId: string
  exemplaireId: string
  emprunteurId: string
  agentId: string
}

let donnees: DonneesTest

async function creerDonneesTest(): Promise<DonneesTest> {
  const values: DonneesTest = {
    matiereId: randomUUID(), niveauId: randomUUID(), ouvrageId: randomUUID(),
    exemplaireId: randomUUID(), emprunteurId: randomUUID(), agentId: randomUUID(),
  }

  await client.query(
    `INSERT INTO ${schema}.matieres (id, code, nom) VALUES ($1, $2, 'Matiere test')`,
    [values.matiereId, `TEST-${values.matiereId}`],
  )
  await client.query(
    `INSERT INTO ${schema}.niveaux_scolaires (id, code, nom) VALUES ($1, $2, 'Niveau test')`,
    [values.niveauId, `TEST-${values.niveauId}`],
  )
  await client.query(
    `INSERT INTO ${schema}.ouvrages (id, titre, matiere_id, niveau_scolaire_id) VALUES ($1, 'Ouvrage test', $2, $3)`,
    [values.ouvrageId, values.matiereId, values.niveauId],
  )
  await client.query(
    `INSERT INTO ${schema}.exemplaires (id, ouvrage_id, code_inventaire, statut) VALUES ($1, $2, $3, 'DISPONIBLE')`,
    [values.exemplaireId, values.ouvrageId, `TEST-EX-${values.exemplaireId}`],
  )
  await client.query(
    `INSERT INTO ${schema}.emprunteurs (id, numero_emprunteur, prenom, nom) VALUES ($1, $2, 'Test', 'Emprunteur')`,
    [values.emprunteurId, `TEST-EMP-${values.emprunteurId}`],
  )
  await client.query(
    `INSERT INTO ${schema}.agents (id, prenom, nom, email, role) VALUES ($1, 'Test', 'Agent', $2, 'BIBLIOTHECAIRE')`,
    [values.agentId, `test-${values.agentId}@example.invalid`],
  )

  return values
}

async function creerEmpruntActif(exemplaireId = donnees.exemplaireId): Promise<string> {
  const empruntId = randomUUID()
  await client.query(
    `INSERT INTO ${schema}.emprunts (
      id, exemplaire_id, emprunteur_id, agent_preteur_id,
      date_emprunt, date_echeance, statut
    ) VALUES ($1, $2, $3, $4, current_timestamp, current_timestamp + interval '7 days', 'ACTIF')`,
    [empruntId, exemplaireId, donnees.emprunteurId, donnees.agentId],
  )
  return empruntId
}

describe.sequential("PostgreSQL domain model", () => {
  beforeAll(async () => client.connect())
  afterAll(async () => client.end())

  beforeEach(async () => {
    await client.query("BEGIN")
    donnees = await creerDonneesTest()
  })

  afterEach(async () => {
    await client.query("ROLLBACK")
  })

  it("expose uniquement les tables métier françaises", async () => {
    const attendues = ["matieres", "niveaux_scolaires", "classes_scolaires", "etablissements", "ouvrages", "exemplaires", "emprunteurs", "agents", "emprunts", "evenements_emprunt"]
    const anciennes = ["subjects", "education_levels", "books", "book_copies", "borrowers", "staff_members", "loans", "loan_events"]
    const result = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name = ANY($2::text[])`,
      [DATABASE_SCHEMA, [...attendues, ...anciennes]],
    )
    const presentes = result.rows.map(({ table_name }) => table_name)
    expect(attendues.every((nom) => presentes.includes(nom))).toBe(true)
    expect(anciennes.some((nom) => presentes.includes(nom))).toBe(false)
  })

  it("conserve les UUID de seed et les colonnes françaises", async () => {
    const ouvrage = await client.query<{ id: string; titre: string; matiere_id: string }>(
      `SELECT id, titre, matiere_id FROM ${schema}.ouvrages WHERE id='30000000-0000-4000-8000-000000000001'`,
    )
    expect(ouvrage.rows[0]?.id).toBe("30000000-0000-4000-8000-000000000001")
    expect(ouvrage.rows[0]?.matiere_id).toBe("10000000-0000-4000-8000-000000000001")
    expect(ouvrage.rows[0]?.titre).toBeTruthy()
  })

  it("creates a book", async () => {
    const id = randomUUID()
    const result = await client.query<{ id: string }>(
      `INSERT INTO ${schema}.ouvrages (id, titre, matiere_id, niveau_scolaire_id)
       VALUES ($1, 'Autre ouvrage test', $2, $3) RETURNING id`,
      [id, donnees.matiereId, donnees.niveauId],
    )
    expect(result.rows[0]?.id).toBe(id)
  })

  it("creates a physical book copy", async () => {
    const id = randomUUID()
    const result = await client.query<{ statut: string }>(
      `INSERT INTO ${schema}.exemplaires (id, ouvrage_id, code_inventaire, statut)
       VALUES ($1, $2, $3, 'PREVU') RETURNING statut`,
      [id, donnees.ouvrageId, `TEST-NEW-${id}`],
    )
    expect(result.rows[0]?.statut).toBe("PREVU")
  })

  it("enforces inventory code uniqueness", async () => {
    const inventoryCode = `TEST-UNIQUE-${randomUUID()}`
    await client.query(
      `INSERT INTO ${schema}.exemplaires (id, ouvrage_id, code_inventaire) VALUES ($1, $2, $3)`,
      [randomUUID(), donnees.ouvrageId, inventoryCode],
    )
    await expect(
      client.query(
        `INSERT INTO ${schema}.exemplaires (id, ouvrage_id, code_inventaire) VALUES ($1, $2, $3)`,
        [randomUUID(), donnees.ouvrageId, inventoryCode],
      ),
    ).rejects.toMatchObject({ code: "23505" })
  })

  it("creates a borrower", async () => {
    const id = randomUUID()
    const result = await client.query<{ statut: string }>(
      `INSERT INTO ${schema}.emprunteurs
       (id, numero_emprunteur, prenom, nom)
       VALUES ($1, $2, 'Autre', 'Emprunteur') RETURNING statut`,
      [id, `TEST-B-${id}`],
    )
    expect(result.rows[0]?.statut).toBe("ACTIF")
  })

  it("creates an active loan", async () => {
    const empruntId = await creerEmpruntActif()
    const result = await client.query<{ statut: string }>(
      `SELECT statut FROM ${schema}.emprunts WHERE id = $1`,
      [empruntId],
    )
    expect(result.rows[0]?.statut).toBe("ACTIF")
  })

  it("prevents two open loans for the same copy", async () => {
    await creerEmpruntActif()
    await expect(creerEmpruntActif()).rejects.toMatchObject({ code: "23505" })
  })

  it("records the return of a copy", async () => {
    const empruntId = await creerEmpruntActif()
    const result = await client.query<{ statut: string; date_retour: Date }>(
      `UPDATE ${schema}.emprunts
       SET statut = 'RETOURNE', date_retour = current_timestamp,
           agent_recepteur_id = $2, date_modification = current_timestamp
       WHERE id = $1
       RETURNING statut, date_retour`,
      [empruntId, donnees.agentId],
    )
    expect(result.rows[0]?.statut).toBe("RETOURNE")
    expect(result.rows[0]?.date_retour).toBeInstanceOf(Date)
  })

  it("creates a loan event", async () => {
    const empruntId = await creerEmpruntActif()
    const eventId = randomUUID()
    const result = await client.query<{ type_evenement: string }>(
      `INSERT INTO ${schema}.evenements_emprunt
       (id, emprunt_id, type_evenement, agent_id, details)
       VALUES ($1, $2, 'CREE', $3, $4::jsonb)
       RETURNING type_evenement`,
      [eventId, empruntId, donnees.agentId, JSON.stringify({ source: "test" })],
    )
    expect(result.rows[0]?.type_evenement).toBe("CREE")
  })

  it("prevents mutation of a loan event", async () => {
    const empruntId = await creerEmpruntActif()
    const eventId = randomUUID()
    await client.query(
      `INSERT INTO ${schema}.evenements_emprunt (id, emprunt_id, type_evenement)
       VALUES ($1, $2, 'CREE')`,
      [eventId, empruntId],
    )
    await expect(
      client.query(
        `UPDATE ${schema}.evenements_emprunt SET type_evenement = 'NOTE_AJOUTEE' WHERE id = $1`,
        [eventId],
      ),
    ).rejects.toThrow("append-only")
  })

  it("rejects a due date that is not after the loan date", async () => {
    await expect(
      client.query(
        `INSERT INTO ${schema}.emprunts (
          id, exemplaire_id, emprunteur_id, agent_preteur_id,
          date_emprunt, date_echeance, statut
        ) VALUES ($1, $2, $3, $4, current_timestamp, current_timestamp, 'ACTIF')`,
        [randomUUID(), donnees.exemplaireId, donnees.emprunteurId, donnees.agentId],
      ),
    ).rejects.toMatchObject({ code: "23514" })
  })

  it("rejects a return date before the loan date", async () => {
    await expect(
      client.query(
        `INSERT INTO ${schema}.emprunts (
          id, exemplaire_id, emprunteur_id, agent_preteur_id,
          agent_recepteur_id, date_emprunt, date_echeance, date_retour, statut
        ) VALUES (
          $1, $2, $3, $4, $4,
          current_timestamp, current_timestamp + interval '7 days',
          current_timestamp - interval '1 day', 'RETOURNE'
        )`,
        [randomUUID(), donnees.exemplaireId, donnees.emprunteurId, donnees.agentId],
      ),
    ).rejects.toMatchObject({ code: "23514" })
  })

  it("keeps all domain tables outside public", async () => {
    const names = [
      "matieres", "niveaux_scolaires", "ouvrages", "exemplaires",
      "emprunteurs", "agents", "emprunts", "evenements_emprunt",
    ]
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [names],
    )
    expect(result.rows).toEqual([])
  })
})
