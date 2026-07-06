export const NIVEAUX = ["3e", "Terminale", "Autre"] as const

export const MATIERES = [
  "Mathématiques",
  "Français",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géographie",
  "Anglais",
  "Philosophie",
  "Autre",
] as const

export const TYPES_LIVRE = ["Annale", "Manuel", "BD", "Sciences", "Autre"] as const

export const ETATS_PHYSIQUES = ["Neuf", "Bon", "Moyen", "Abîmé"] as const

export const STATUTS_LIVRE = [
  "Prévu",
  "Acheté",
  "À étiqueter",
  "Étiqueté",
  "Disponible",
  "Emprunté",
  "Perdu",
  "Abîmé",
  "Retiré",
] as const

export const LOCALISATIONS = ["Abidjan", "Facobly", "Armoire", "Salle", "Autre"] as const

export const STATUTS_EMPRUNT = [
  "En cours",
  "Retourné",
  "En retard",
  "Perdu",
  "Abîmé",
] as const

export const STATUTS_ELEVE = ["Actif", "Inactif"] as const

// Short codes used to build the code_livre: FAC-[NIVEAU]-[MATIERE]-[NUMERO]
export const NIVEAU_CODES: Record<string, string> = {
  "3e": "3E",
  Terminale: "TLE",
  Autre: "AUT",
}

export const MATIERE_CODES: Record<string, string> = {
  Mathématiques: "MATH",
  Français: "FR",
  "Physique-Chimie": "PC",
  SVT: "SVT",
  "Histoire-Géographie": "HG",
  Anglais: "ANG",
  Philosophie: "PHILO",
  Autre: "AUT",
}

// Color mapping for status badges (Tailwind classes)
export function statutLivreColor(statut: string): string {
  switch (statut) {
    case "Disponible":
      return "bg-accent/15 text-accent-foreground border-accent/30"
    case "Emprunté":
      return "bg-primary/15 text-primary border-primary/30"
    case "Perdu":
    case "Retiré":
      return "bg-destructive/15 text-destructive border-destructive/30"
    case "Abîmé":
      return "bg-orange-100 text-orange-700 border-orange-300"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function statutEmpruntColor(statut: string): string {
  switch (statut) {
    case "En cours":
      return "bg-primary/15 text-primary border-primary/30"
    case "Retourné":
      return "bg-accent/15 text-accent-foreground border-accent/30"
    case "En retard":
      return "bg-destructive/15 text-destructive border-destructive/30"
    case "Perdu":
      return "bg-destructive/15 text-destructive border-destructive/30"
    case "Abîmé":
      return "bg-orange-100 text-orange-700 border-orange-300"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}
