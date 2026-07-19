import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { listerNiveauxPublics } from "@/lib/espace-eleve"
import { InscriptionEleveForm } from "@/components/inscription-eleve-form"
import { Card } from "@/components/ui/card"
export default async function Page(){if(await getSessionUser())redirect("/");const niveaux=await listerNiveauxPublics();return <main className="flex min-h-svh items-center justify-center bg-muted p-4"><Card className="w-full max-w-xl p-6"><h1 className="text-xl font-semibold">Créer mon compte élève</h1><p className="my-3 text-sm text-muted-foreground">Consultez vos prêts et les ouvrages disponibles pour votre niveau.</p><InscriptionEleveForm niveaux={niveaux}/><p className="mt-5 text-center text-sm">Déjà inscrit ? <Link href="/sign-in" className="underline">Se connecter</Link></p></Card></main>}
