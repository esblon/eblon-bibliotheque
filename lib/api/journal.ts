export function journaliser(evenement: string, contexte: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ niveau: "info", evenement, horodatage: new Date().toISOString(), ...contexte }))
}
