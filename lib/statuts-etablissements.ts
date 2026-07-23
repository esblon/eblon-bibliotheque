export const transitionsStatutEtablissement: Record<string, readonly string[]> = {
  INITIALISATION: ["ACTIF"],
  ACTIF: ["INACTIF"],
  INACTIF: ["DESACTIVE", "ACTIF"],
  DESACTIVE: [],
}

export function transitionStatutEtablissementAutorisee(source: string, cible: string): boolean {
  return source === cible || Boolean(transitionsStatutEtablissement[source]?.includes(cible))
}
