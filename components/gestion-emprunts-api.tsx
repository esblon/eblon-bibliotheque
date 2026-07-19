"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { actionPret, creerPret } from "@/app/actions/frontend-api"
import type { Agent, Emprunt, Emprunteur, EvenementEmprunt, Exemplaire, Ouvrage } from "@/lib/frontend-api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ResultatAction = { succes:boolean; message:string }

export function GestionEmpruntsApi({emprunts,exemplaires,emprunteurs,agents,ouvrages,evenements,peutModifier}:{emprunts:Emprunt[];exemplaires:Exemplaire[];emprunteurs:Emprunteur[];agents:Agent[];ouvrages:Ouvrage[];evenements:Record<string,EvenementEmprunt[]>;peutModifier:boolean}){
  const [ouvert,setOuvert]=useState(false)
  const [pending,startTransition]=useTransition()
  const [message,setMessage]=useState<ResultatAction|null>(null)
  const actifs=agents.filter(a=>a.statut==="ACTIF")

  function afficherResultat(resultat:ResultatAction){
    setMessage(resultat)
    if(resultat.succes){toast.success(resultat.message);setOuvert(false)}
    else toast.error(resultat.message)
  }

  function soumettrePret(formData:FormData){
    setMessage(null)
    const valeurDate=String(formData.get("date_echeance")??"")
    const date=new Date(valeurDate)
    if(!valeurDate||Number.isNaN(date.valueOf())){
      afficherResultat({succes:false,message:"Renseignez une date d’échéance valide."})
      return
    }
    startTransition(async()=>{
      try{
        afficherResultat(await creerPret({
          exemplaire_id:String(formData.get("exemplaire_id")??""),
          emprunteur_id:String(formData.get("emprunteur_id")??""),
          agent_preteur_id:String(formData.get("agent_preteur_id")??""),
          date_echeance:date.toISOString(),
          observations:String(formData.get("observations")??"").trim()||null,
        }))
      }catch{
        afficherResultat({succes:false,message:"La création du prêt a échoué. Réessayez."})
      }
    })
  }

  function executer(action:()=>Promise<ResultatAction>){
    setMessage(null)
    startTransition(async()=>{try{afficherResultat(await action())}catch{afficherResultat({succes:false,message:"L’opération a échoué. Réessayez."})}})
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-semibold">Emprunts</h1><p className="text-sm text-muted-foreground">Prêts, retours et historique issus de l’API métier.</p></div>
      {peutModifier&&<Button type="button" onClick={()=>{setMessage(null);setOuvert(v=>!v)}}>Nouveau prêt</Button>}
    </div>
    {message&&<p role="status" aria-live="polite" className={message.succes?"rounded-md bg-green-50 p-3 text-sm text-green-800":"rounded-md bg-destructive/10 p-3 text-sm text-destructive"}>{message.message}</p>}
    {peutModifier&&ouvert&&<Card>
      <CardHeader><CardTitle>Créer un prêt</CardTitle></CardHeader>
      <CardContent><form action={soumettrePret} className="grid gap-4 md:grid-cols-2">
        <SelectHtml nom="exemplaire_id" libelle="Exemplaire disponible" options={exemplaires.filter(e=>e.statut==="DISPONIBLE").map(e=>({v:e.id,l:`${e.code_inventaire} — ${ouvrages.find(o=>o.id===e.ouvrage_id)?.titre??"Ouvrage"}`}))}/>
        <SelectHtml nom="emprunteur_id" libelle="Emprunteur actif" options={emprunteurs.filter(e=>e.statut==="ACTIF").map(e=>({v:e.id,l:`${e.prenom} ${e.nom}`}))}/>
        <SelectHtml nom="agent_preteur_id" libelle="Agent prêteur" options={actifs.map(e=>({v:e.id,l:`${e.prenom} ${e.nom}`}))}/>
        <div><Label htmlFor="date_echeance">Échéance</Label><Input id="date_echeance" name="date_echeance" type="datetime-local" required/></div>
        <div className="md:col-span-2"><Label htmlFor="observations">Observations</Label><Input id="observations" name="observations"/></div>
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending?"Enregistrement…":"Confirmer le prêt"}</Button>
      </form></CardContent>
    </Card>}
    {emprunts.length===0?<Card><CardContent className="py-10 text-center text-muted-foreground">Aucun emprunt enregistré.</CardContent></Card>:<div className="grid gap-4">{emprunts.map(e=>{
      const ex=exemplaires.find(x=>x.id===e.exemplaire_id), emp=emprunteurs.find(x=>x.id===e.emprunteur_id)
      return <Card key={e.id}><CardHeader><CardTitle className="text-base">{ex?.code_inventaire??e.exemplaire_id} — {emp?`${emp.prenom} ${emp.nom}`:e.emprunteur_id}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-1 text-sm sm:grid-cols-3"><span>Statut : <strong>{e.statut.replaceAll("_"," ")}</strong></span><span>Prêt : {new Date(e.date_emprunt).toLocaleDateString("fr-FR")}</span><span>Échéance : {new Date(e.date_echeance).toLocaleDateString("fr-FR")}</span></div>
        {peutModifier&&["ACTIF","EN_RETARD"].includes(e.statut)&&<div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={()=>{const a=actifs[0];if(a&&confirm("Confirmer le retour ?"))executer(()=>actionPret(e.id,"retour",{agent_recepteur_id:a.id,etat_retour:"NORMAL"}))}}>Retour normal</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={()=>{const date=new Date(e.date_echeance);date.setDate(date.getDate()+7);executer(()=>actionPret(e.id,"prolongation",{nouvelle_date_echeance:date.toISOString(),agent_id:actifs[0]?.id}))}}>Prolonger de 7 jours</Button>
          {e.statut==="ACTIF"&&<Button size="sm" variant="outline" onClick={()=>executer(()=>actionPret(e.id,"marquer-en-retard",{agent_id:actifs[0]?.id}))}>Marquer en retard</Button>}
          <Button size="sm" variant="outline" onClick={()=>{if(confirm("Déclarer cet exemplaire perdu ?"))executer(()=>actionPret(e.id,"marquer-perdu",{agent_id:actifs[0]?.id}))}}>Marquer perdu</Button>
          <Button size="sm" variant="outline" onClick={()=>{if(confirm("Annuler ce prêt ?"))executer(()=>actionPret(e.id,"annulation",{agent_id:actifs[0]?.id}))}}>Annuler</Button>
        </div>}
        <div><h3 className="text-sm font-medium">Historique</h3><ol className="mt-2 border-l pl-4 text-sm text-muted-foreground">{(evenements[e.id]??[]).map(ev=><li key={ev.id} className="mb-2"><span className="font-medium text-foreground">{ev.type_evenement.replaceAll("_"," ")}</span> — {new Date(ev.date_evenement).toLocaleString("fr-FR")}</li>)}</ol></div>
      </CardContent></Card>
    })}</div>}
  </div>
}

function SelectHtml({nom,libelle,options}:{nom:string;libelle:string;options:{v:string;l:string}[]}){
  return <div><Label htmlFor={nom}>{libelle}</Label><select id={nom} name={nom} required className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Sélectionner…</option>{options.map(o=><option value={o.v} key={o.v}>{o.l}</option>)}</select></div>
}
