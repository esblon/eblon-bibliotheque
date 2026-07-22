"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { completerInscriptionEleve } from "@/app/actions/parcours-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { classesPourNiveau, type EtablissementInscription, type NiveauInscription } from "@/lib/referentiels-inscription"

export function InscriptionEleveForm({niveaux,etablissements}:{niveaux:NiveauInscription[];etablissements:EtablissementInscription[]}){
 const router=useRouter(),[pending,setPending]=useState(false),[erreur,setErreur]=useState(""),[niveauId,setNiveauId]=useState("")
 const classes=classesPourNiveau(niveaux,niveauId)
 async function action(fd:FormData){setPending(true);setErreur("");const nomComplet=`${fd.get("prenom")} ${fd.get("nom")}`.trim(),email=String(fd.get("email")),password=String(fd.get("password"));const r=await authClient.signUp.email({name:nomComplet,email,password});if(r.error){setErreur(r.error.message??"Inscription impossible.");setPending(false);return}const profil=await completerInscriptionEleve({niveau_scolaire_id:String(fd.get("niveau_scolaire_id")),classe_scolaire_id:String(fd.get("classe_scolaire_id")),etablissement_id:String(fd.get("etablissement_id"))});if(!profil.succes){setErreur(profil.message);setPending(false);return}router.push("/espace-eleve");router.refresh()}
 return <form action={action} className="grid gap-4 sm:grid-cols-2">
  <div><Label htmlFor="prenom">Prénom</Label><Input id="prenom" name="prenom" required/></div><div><Label htmlFor="nom">Nom</Label><Input id="nom" name="nom" required/></div>
  <div className="sm:col-span-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email"/></div>
  <div className="sm:col-span-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password"/></div>
  <div><Label htmlFor="niveau_scolaire_id">Niveau scolaire</Label><select id="niveau_scolaire_id" name="niveau_scolaire_id" required value={niveauId} onChange={e=>setNiveauId(e.target.value)} className="h-9 w-full rounded-md border bg-transparent px-3"><option value="">Sélectionner un niveau</option>{niveaux.map(n=><option key={n.id} value={n.id}>{n.nom}</option>)}</select></div>
  <div><Label htmlFor="classe_scolaire_id">Classe</Label><select key={niveauId} id="classe_scolaire_id" name="classe_scolaire_id" required disabled={!niveauId} defaultValue="" className="h-9 w-full rounded-md border bg-transparent px-3 disabled:opacity-50"><option value="">{niveauId?"Sélectionner une classe":"Choisir d’abord le niveau"}</option>{classes.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
  <div className="sm:col-span-2"><Label htmlFor="etablissement_id">Établissement</Label><select id="etablissement_id" name="etablissement_id" required defaultValue={etablissements[0]?.id??""} className="h-9 w-full rounded-md border bg-transparent px-3"><option value="" disabled>Sélectionner un établissement</option>{etablissements.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}</select></div>
  {erreur&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{erreur}</p>}<Button type="submit" disabled={pending||!niveaux.length||!etablissements.length} className="sm:col-span-2">{pending?"Inscription…":"Créer mon compte élève"}</Button>
 </form>
}
