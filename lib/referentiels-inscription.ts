export type ClasseInscription = { id: string; niveau_scolaire_id: string; nom: string }
export type NiveauInscription = { id: string; nom: string; classes: ClasseInscription[] }
export type EtablissementInscription = { id: string; nom: string }

export function classesPourNiveau(niveaux: NiveauInscription[], niveauId: string) {
  return niveaux.find(({ id }) => id === niveauId)?.classes ?? []
}
