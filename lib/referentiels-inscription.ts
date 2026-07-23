export type ClasseInscription = { id: string; niveau_scolaire_id: string; nom: string }
export type NiveauInscription = { id: string; code: string; nom: string; classes: ClasseInscription[] }
export type EtablissementInscription = { id: string; nom: string; type_etablissement: "PERISCOLAIRE" | "PRIMAIRE" | "SECONDAIRE" }

export function classesPourNiveau(niveaux: NiveauInscription[], niveauId: string) {
  return niveaux.find(({ id }) => id === niveauId)?.classes ?? []
}

export function niveauxPourEtablissement(niveaux: NiveauInscription[], etablissement?: EtablissementInscription) {
  if (!etablissement) return []
  if (etablissement.type_etablissement === "SECONDAIRE") return niveaux
  return niveaux.filter(({ code }) => !["CYCLE_1", "CYCLE_2"].includes(code))
}
