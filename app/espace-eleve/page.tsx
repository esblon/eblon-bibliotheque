import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeconnexionEleve } from "@/components/deconnexion-eleve"
import { calculerDelaiRetour } from "@/lib/delai-retour"
import { obtenirEspaceEleve } from "@/lib/espace-eleve"

export default async function Page() {
  const espace = await obtenirEspaceEleve()
  if (!espace) redirect("/sign-in")

  return (
    <main className="min-h-svh bg-muted p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Espace élève</h1>
            <p className="text-muted-foreground">
              {espace.profil.prenom} {espace.profil.nom} · {espace.profil.niveau_nom ?? "Niveau à préciser"}
            </p>
          </div>
          <DeconnexionEleve />
        </header>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Mes prêts</h2>
          {espace.emprunts.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Vous n’avez aucun prêt enregistré.</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {espace.emprunts.map((pret: Record<string, unknown>) => {
                const delai = calculerDelaiRetour(String(pret.date_echeance), String(pret.statut))
                return (
                  <Card key={String(pret.id)}>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{String(pret.titre)}</p>
                        <p className="text-sm text-muted-foreground">
                          {String(pret.code_inventaire)} · échéance {new Date(String(pret.date_echeance)).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {delai && (
                          <Badge
                            variant={delai.type === "retard" ? "destructive" : "secondary"}
                            className={delai.type === "aujourdhui" ? "bg-amber-100 text-amber-900" : undefined}
                          >
                            {delai.libelle}
                          </Badge>
                        )}
                        <Badge variant="outline">{String(pret.statut).replaceAll("_", " ")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Ouvrages pour mon niveau</h2>
          <p className="mb-3 text-sm text-muted-foreground">Inclut également les ouvrages sans niveau.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {espace.catalogue.map((ouvrage: Record<string, unknown>) => (
              <Card key={String(ouvrage.id)}>
                <CardHeader><CardTitle className="text-base">{String(ouvrage.titre)}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm">{ouvrage.niveau_nom ? String(ouvrage.niveau_nom) : "Tous niveaux"}</p>
                  <p className="mt-1 text-sm font-medium">{String(ouvrage.disponibles)} disponible(s)</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
