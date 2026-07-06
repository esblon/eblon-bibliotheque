import Link from "next/link"
import { getDashboardStats, getRecentEmprunts } from "@/app/actions/stats"
import { getSessionUser } from "@/lib/session"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RepartitionBar } from "@/components/repartition-bar"
import { statutEmpruntColor } from "@/lib/constants"
import {
  BookMarked,
  BookCheck,
  BookX,
  Users,
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  Wrench,
  Plus,
  ScanLine,
} from "lucide-react"

export default async function DashboardPage() {
  const [stats, recent, user] = await Promise.all([
    getDashboardStats(),
    getRecentEmprunts(6),
    getSessionUser(),
  ])

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Vue d'ensemble de la mini-bibliothèque Annales Facobly."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/scan">
                <ScanLine className="size-4" />
                Scanner
              </Link>
            </Button>
            <Button asChild>
              <Link href="/emprunts/nouveau">
                <Plus className="size-4" />
                Nouveau prêt
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total livres"
          value={stats.totalLivres}
          icon={BookMarked}
          tone="primary"
        />
        <StatCard
          label="Disponibles"
          value={stats.disponibles}
          icon={BookCheck}
          tone="accent"
        />
        <StatCard
          label="Empruntés"
          value={stats.empruntesLivres}
          icon={ArrowLeftRight}
          tone="primary"
        />
        <StatCard
          label="Élèves inscrits"
          value={stats.totalEleves}
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Prêts en cours"
          value={stats.empruntsEnCours}
          icon={ArrowLeftRight}
          tone="primary"
        />
        <StatCard
          label="En retard"
          value={stats.retards}
          icon={Clock}
          tone="danger"
        />
        <StatCard
          label="Perdus"
          value={stats.perdus}
          icon={BookX}
          tone="danger"
        />
        <StatCard
          label="Abîmés"
          value={stats.abimes}
          icon={Wrench}
          tone="warning"
        />
      </section>

      {stats.retards > 0 && (
        <Card className="mt-4 flex items-center gap-3 border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{stats.retards}</span> emprunt(s) en
            retard nécessitent une relance.{" "}
            <Link
              href="/retards"
              className="font-medium text-destructive underline underline-offset-4"
            >
              Voir les retards
            </Link>
          </p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Répartition par niveau
          </h2>
          <RepartitionBar data={stats.parNiveau} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Répartition par matière
          </h2>
          <RepartitionBar data={stats.parMatiere} />
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Derniers mouvements
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/emprunts">Tout voir</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun emprunt enregistré pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.titre ?? "Livre supprimé"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.prenom} {e.nom} · {e.classe ?? "—"} · {e.codeLivre}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={statutEmpruntColor(e.statut)}
                >
                  {e.statut}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
