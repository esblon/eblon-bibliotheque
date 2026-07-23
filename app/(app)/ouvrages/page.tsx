import { GestionRessource, type ChampGestion } from "@/components/gestion-ressource"
import { autorisationsFrontend } from "@/lib/frontend-api/autorisation"
import { apiFrontend } from "@/lib/frontend-api/ressources"

export default async function Page() {
  const [ouvrages, matieres, niveaux, types, droits] = await Promise.all([
    apiFrontend.ouvrages({ limite: 100 }),
    apiFrontend.matieres({ limite: 100 }),
    apiFrontend.niveaux({ limite: 100 }),
    apiFrontend.typesOuvrages({ limite: 100 }),
    autorisationsFrontend(),
  ])
  const champs: ChampGestion[] = [
    { nom: "titre", libelle: "Titre", requis: true },
    { nom: "sous_titre", libelle: "Sous-titre" },
    { nom: "isbn", libelle: "ISBN" },
    { nom: "editeur", libelle: "Éditeur" },
    { nom: "edition", libelle: "Édition" },
    { nom: "annee_publication", libelle: "Année de publication", type: "number" },
    { nom: "type_ouvrage_id", libelle: "Type d’ouvrage", type: "select", options: types.donnees.filter((type) => type.est_actif).map((type) => ({ valeur: type.id, libelle: type.nom })) },
    { nom: "au_programme_scolaire", libelle: "Au programme scolaire", type: "checkbox", cocheParDefaut: false },
    { nom: "matiere_id", libelle: "Matière", type: "select", options: matieres.donnees.map((matiere) => ({ valeur: matiere.id, libelle: matiere.nom })) },
    { nom: "niveau_scolaire_id", libelle: "Niveau scolaire", type: "select", requis: false, options: [{ valeur: "", libelle: "Sans niveau — tous les élèves" }, ...niveaux.donnees.map((niveau) => ({ valeur: niveau.id, libelle: niveau.nom }))] },
    { nom: "description", libelle: "Description", type: "textarea" },
    { nom: "est_actif", libelle: "Actif", type: "checkbox" },
  ]
  return <GestionRessource peutModifier={droits.peutModifier} ressource="ouvrages" titre="Ouvrages" lignes={ouvrages.donnees} champs={champs} />
}
