"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { enregistrerRessource, envoyerInvitationAgent, type EtatAction } from "@/app/actions/frontend-api"
import type { RessourceEditable } from "@/lib/frontend-api/validation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ChampGestion={nom:string;libelle:string;type?:"text"|"email"|"number"|"date"|"textarea"|"select"|"checkbox";options?:{valeur:string;libelle:string}[];requis?:boolean}
type Ligne=Record<string,unknown>&{id:string}

function libelleLigne(ligne:Ligne){return String(ligne.titre??(ligne.prenom?`${ligne.prenom} ${ligne.nom??""}`:ligne.nom??"Sans nom"))}

export function GestionRessource({ressource,titre,lignes,champs,peutModifier=true}:{ressource:RessourceEditable;titre:string;lignes:Ligne[];champs:ChampGestion[];peutModifier?:boolean}){
  const [recherche,setRecherche]=useState("")
  const [niveau,setNiveau]=useState("")
  const [matiere,setMatiere]=useState("")
  const [edition,setEdition]=useState<Ligne|null>(null)
  const [ouvert,setOuvert]=useState(false)
  const [pending,setPending]=useState(false)
  const [resultat,setResultat]=useState<EtatAction|null>(null)
  const niveaux=useMemo(()=>[...new Set(lignes.map(l=>String(l.groupe_niveau??"")).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr")),[lignes])
  const matieres=useMemo(()=>[...new Set(lignes.map(l=>String(l.groupe_matiere??"")).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr")),[lignes])
  const filtrees=useMemo(()=>lignes.filter(l=>JSON.stringify(l).toLowerCase().includes(recherche.toLowerCase())&&(!niveau||l.groupe_niveau===niveau)&&(!matiere||l.groupe_matiere===matiere)).sort((a,b)=>String(a.groupe_niveau??"").localeCompare(String(b.groupe_niveau??""),"fr")||String(a.groupe_matiere??"").localeCompare(String(b.groupe_matiere??""),"fr")||libelleLigne(a).localeCompare(libelleLigne(b),"fr")),[lignes,recherche,niveau,matiere])

  async function soumettre(formData:FormData){
    if(pending)return
    setPending(true);setResultat(null)
    const valeurs:Record<string,unknown>={}
    for(const champ of champs) valeurs[champ.nom]=champ.type==="checkbox"?formData.get(champ.nom)==="on":String(formData.get(champ.nom)??"")
    try{
      const reponse=await enregistrerRessource(ressource,edition?.id??null,valeurs)
      setResultat(reponse)
      if(reponse.succes){toast.success(reponse.message);setOuvert(false);setEdition(null)}
      else toast.error(reponse.message)
    }catch{
      const reponse={succes:false,message:"L’enregistrement a échoué. Réessayez."}
      setResultat(reponse);toast.error(reponse.message)
    }finally{setPending(false)}
  }

  function ouvrirEdition(ligne:Ligne|null){setResultat(null);setEdition(ligne);setOuvert(true)}
  async function inviter(id:string){setPending(true);const reponse=await envoyerInvitationAgent(id);setResultat(reponse);if(reponse.succes)toast.success(reponse.message);else toast.error(reponse.message);setPending(false)}

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold">{titre}</h1><p className="text-sm text-muted-foreground">Données synchronisées avec l’API métier.</p></div>{peutModifier&&<Button type="button" onClick={()=>ouvrirEdition(null)}>Créer</Button>}</div>
    {resultat&&<p role={resultat.succes?"status":"alert"} aria-live="polite" className={resultat.succes?"rounded-md bg-green-50 p-3 text-sm text-green-800":"rounded-md bg-destructive/10 p-3 text-sm text-destructive"}>{resultat.message}</p>}
    <div className="grid gap-3 md:grid-cols-3">
      <div><Label htmlFor={`${ressource}-recherche`} className="sr-only">Rechercher</Label><Input id={`${ressource}-recherche`} placeholder="Rechercher…" value={recherche} onChange={e=>setRecherche(e.target.value)}/></div>
      {niveaux.length>0&&<div><Label htmlFor={`${ressource}-niveau`} className="sr-only">Filtrer par niveau</Label><select id={`${ressource}-niveau`} value={niveau} onChange={e=>setNiveau(e.target.value)} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Tous les niveaux</option>{niveaux.map(v=><option key={v} value={v}>{v}</option>)}</select></div>}
      {matieres.length>0&&<div><Label htmlFor={`${ressource}-matiere`} className="sr-only">Filtrer par matière</Label><select id={`${ressource}-matiere`} value={matiere} onChange={e=>setMatiere(e.target.value)} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Toutes les matières</option>{matieres.map(v=><option key={v} value={v}>{v}</option>)}</select></div>}
    </div>
    {ouvert&&<Card><CardHeader><CardTitle>{edition?"Modifier":"Créer"}</CardTitle></CardHeader><CardContent>
      <form action={soumettre} className="grid gap-4 md:grid-cols-2">
        {champs.map(champ=><div key={champ.nom} className={champ.type==="textarea"?"md:col-span-2":""}>
          <Label htmlFor={champ.nom}>{champ.libelle}</Label>
          {champ.type==="select"?<select id={champ.nom} name={champ.nom} required={champ.requis!==false} defaultValue={String(edition?.[champ.nom]??champ.options?.[0]?.valeur??"")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">{champ.options?.map(option=><option key={option.valeur} value={option.valeur}>{option.libelle}</option>)}</select>
          :champ.type==="checkbox"?<input id={champ.nom} name={champ.nom} type="checkbox" defaultChecked={edition?Boolean(edition[champ.nom]):true} className="ml-3 size-4"/>
          :<Input id={champ.nom} name={champ.nom} type={champ.type??"text"} required={champ.requis} defaultValue={String(edition?.[champ.nom]??"")}/>}
          {resultat?.erreurs?.[champ.nom]?.map(message=><p key={message} className="mt-1 text-xs text-destructive">{message}</p>)}
        </div>)}
        <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={pending}>{pending?"Enregistrement…":"Enregistrer"}</Button><Button type="button" variant="outline" disabled={pending} onClick={()=>setOuvert(false)}>Annuler</Button></div>
      </form>
    </CardContent></Card>}
    {filtrees.length===0?<Card><CardContent className="py-10 text-center text-muted-foreground">Aucune donnée ne correspond à votre recherche.</CardContent></Card>:<div className="grid gap-3">{filtrees.map((ligne,index)=>{const precedent=filtrees[index-1];const nouveauNiveau=Boolean(ligne.groupe_niveau&&ligne.groupe_niveau!==precedent?.groupe_niveau);const nouvelleMatiere=Boolean(ligne.groupe_matiere&&(nouveauNiveau||ligne.groupe_matiere!==precedent?.groupe_matiere));return <div key={ligne.id} className="contents">{nouveauNiveau&&<h2 className="mt-4 text-xl font-semibold">{String(ligne.groupe_niveau)}</h2>}{nouvelleMatiere&&<h3 className="mt-2 text-base font-semibold text-muted-foreground">{String(ligne.groupe_matiere)}</h3>}<Card><CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{libelleLigne(ligne)}</p><p className="text-sm text-muted-foreground">{String(ligne.resume_affichage??ligne.code??ligne.email??ligne.code_inventaire??ligne.numero_emprunteur??"")}</p></div>{peutModifier&&<div className="flex gap-2">{ressource==="agents"&&!ligne.identifiant_auth_externe&&<Button type="button" size="sm" disabled={pending} onClick={()=>inviter(ligne.id)}>Envoyer l’invitation</Button>}<Button type="button" size="sm" variant="outline" onClick={()=>ouvrirEdition(ligne)}>Modifier</Button></div>}</CardContent></Card></div>})}</div>}
  </div>
}
