import { GestionRessource } from "@/components/gestion-ressource"
import { apiFrontend } from "@/lib/frontend-api/ressources"
import { autorisationsFrontend } from "@/lib/frontend-api/autorisation"

export default async function Page() {
  const [types, droits] = await Promise.all([apiFrontend.typesOuvrages({ limite: 100 }), autorisationsFrontend()])
  return <GestionRessource
    peutModifier={droits.agent?.role === "ADMIN"}
    ressource="types-ouvrages"
    titre="Types d’ouvrages"
    lignes={types.donnees}
    champs={[
      { nom: "code", libelle: "Code", requis: true },
      { nom: "nom", libelle: "Nom", requis: true },
      { nom: "description", libelle: "Description", type: "textarea" },
      { nom: "est_actif", libelle: "Actif", type: "checkbox" },
    ]}
  />
}
