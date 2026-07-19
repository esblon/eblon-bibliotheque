"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { activerCompteAgent } from "@/app/actions/parcours-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export function ActivationAgentForm({jeton,email}:{jeton:string;email:string}){const router=useRouter();const[pending,setPending]=useState(false);const[erreur,setErreur]=useState("");async function action(fd:FormData){setPending(true);setErreur("");const mot=String(fd.get("mot_de_passe")??""),confirmation=String(fd.get("confirmation")??"");if(mot!==confirmation){setErreur("Les mots de passe ne correspondent pas.");setPending(false);return}const fin=await activerCompteAgent(jeton,mot);if(!fin.succes){setErreur(fin.message);setPending(false);return}router.push("/sign-in");router.refresh()}return <form action={action} className="space-y-4"><div><Label>Email</Label><Input value={email} disabled/></div><div><Label htmlFor="mot_de_passe">Nouveau mot de passe</Label><Input id="mot_de_passe" name="mot_de_passe" type="password" minLength={8} required autoComplete="new-password"/></div><div><Label htmlFor="confirmation">Confirmer le mot de passe</Label><Input id="confirmation" name="confirmation" type="password" minLength={8} required autoComplete="new-password"/></div>{erreur&&<p role="alert" className="text-sm text-destructive">{erreur}</p>}<Button type="submit" disabled={pending} className="w-full">{pending?"Activation…":"Activer mon accès"}</Button></form>}
