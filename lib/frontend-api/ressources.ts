import { appelerApi } from "./client"
import type { Agent, Emprunt, Emprunteur, EvenementEmprunt, Exemplaire, Matiere, NiveauScolaire, Ouvrage, ParametresListe, ReponseApi } from "./types"

export const apiFrontend = {
  matieres: (p?:ParametresListe) => appelerApi<Matiere[]>("/api/v1/matieres",{},p),
  niveaux: (p?:ParametresListe) => appelerApi<NiveauScolaire[]>("/api/v1/niveaux-scolaires",{},p),
  classes: (p?:ParametresListe) => appelerApi<Array<{id:string;[key:string]:unknown}>>("/api/v1/classes-scolaires",{},p),
  etablissements: (p?:ParametresListe) => appelerApi<Array<{id:string;[key:string]:unknown}>>("/api/v1/etablissements",{},p),
  typesOuvrages: (p?:ParametresListe) => appelerApi<Array<{id:string;code:string;nom:string;description?:string;est_actif:boolean}>>("/api/v1/types-ouvrages",{},p),
  roles: (p?:ParametresListe) => appelerApi<Array<{id:string;[key:string]:unknown}>>("/api/v1/roles",{},p),
  ouvrages: (p?:ParametresListe) => appelerApi<Ouvrage[]>("/api/v1/ouvrages",{},p),
  exemplaires: (p?:ParametresListe) => appelerApi<Exemplaire[]>("/api/v1/exemplaires",{},p),
  emprunteurs: (p?:ParametresListe) => appelerApi<Emprunteur[]>("/api/v1/emprunteurs",{},p),
  agents: (p?:ParametresListe) => appelerApi<Agent[]>("/api/v1/agents",{},p),
  emprunts: (p?:ParametresListe) => appelerApi<Emprunt[]>("/api/v1/emprunts",{},p),
  evenements: (id:string) => appelerApi<EvenementEmprunt[]>(`/api/v1/emprunts/${id}/evenements`),
  detail: <T>(ressource:string,id:string) => appelerApi<T>(`/api/v1/${ressource}/${id}`),
  creer: <T>(ressource:string,donnees:unknown) => appelerApi<T>(`/api/v1/${ressource}`,{method:"POST",body:JSON.stringify(donnees)}),
  modifier: <T>(ressource:string,id:string,donnees:unknown) => appelerApi<T>(`/api/v1/${ressource}/${id}`,{method:"PATCH",body:JSON.stringify(donnees)}),
  actionEmprunt: <T>(id:string,action:string,donnees:unknown={}) => appelerApi<T>(`/api/v1/emprunts/${id}/${action}`,{method:"POST",body:JSON.stringify(donnees)}),
}

export type ResultatListe<T> = ReponseApi<T[]>
