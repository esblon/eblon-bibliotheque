"use client"
import { Button } from "@/components/ui/button"
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <div role="alert" className="rounded-lg border p-8 text-center"><h2 className="text-xl font-semibold">Impossible de charger les données</h2><p className="mt-2 text-muted-foreground">Le service est momentanément indisponible ou votre session a expiré.</p><Button className="mt-4" onClick={reset}>Réessayer</Button></div>}
