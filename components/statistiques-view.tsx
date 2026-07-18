"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"

type Stats = {
  parMois: { mois: string; total: number }[]
  livresPopulaires: { titre: string | null; codeLivre: string | null; total: number }[]
  matieresPopulaires: { matiere: string | null; total: number }[]
  elevesActifs: { nom: string | null; prenom: string | null; classe: string | null; total: number }[]
  taux: { disponibles: number; empruntes: number; perdus: number; abimes: number }
  retards: number
  mouvements: {
    id: number | string
    action: string
    utilisateurNom: string | null
    cible: string | null
    details: string | null
    dateAction: Date | string
  }[]
}

const moisLabels: Record<string, string> = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mar",
  "04": "Avr",
  "05": "Mai",
  "06": "Juin",
  "07": "Juil",
  "08": "Août",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc",
}

function formatMois(m: string) {
  const [y, mm] = m.split("-")
  return `${moisLabels[mm] ?? mm} ${y.slice(2)}`
}

const chartConfig = {
  total: { label: "Prêts", color: "var(--chart-1)" },
} satisfies ChartConfig

export function StatistiquesView({ stats }: { stats: Stats }) {
  const moisData = stats.parMois.map((r) => ({ mois: formatMois(r.mois), total: r.total }))
  const matiereData = stats.matieresPopulaires
    .filter((r) => r.matiere)
    .map((r) => ({ matiere: r.matiere as string, total: r.total }))

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TauxCard label="Livres disponibles" value={stats.taux.disponibles} tone="accent" />
        <TauxCard label="Livres empruntés" value={stats.taux.empruntes} tone="primary" />
        <TauxCard label="Livres perdus" value={stats.taux.perdus} tone="destructive" />
        <TauxCard label="Livres abîmés" value={stats.taux.abimes} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prêts par mois</CardTitle>
          </CardHeader>
          <CardContent>
            {moisData.length === 0 ? (
              <Empty />
            ) : (
              <ChartContainer config={chartConfig} className="max-h-64 w-full">
                <BarChart data={moisData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matières les plus demandées</CardTitle>
          </CardHeader>
          <CardContent>
            {matiereData.length === 0 ? (
              <Empty />
            ) : (
              <ChartContainer config={chartConfig} className="max-h-64 w-full">
                <BarChart data={matiereData} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="matiere"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Livres les plus empruntés</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {stats.livresPopulaires.length === 0 && <Empty />}
            {stats.livresPopulaires.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{l.titre}</div>
                  <div className="font-mono text-xs text-muted-foreground">{l.codeLivre}</div>
                </div>
                <Badge variant="secondary">{l.total} prêt(s)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Élèves les plus actifs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {stats.elevesActifs.length === 0 && <Empty />}
            {stats.elevesActifs.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {e.nom} {e.prenom}
                  </div>
                  <div className="text-xs text-muted-foreground">{e.classe}</div>
                </div>
                <Badge variant="secondary">{e.total} emprunt(s)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des mouvements</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {stats.mouvements.length === 0 && <Empty />}
          {stats.mouvements.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0"
            >
              <div>
                <span className="font-medium">{m.action}</span>
                {m.details && <span className="text-muted-foreground"> — {m.details}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {m.utilisateurNom ? `${m.utilisateurNom} · ` : ""}
                {formatDateTime(m.dateAction)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TauxCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "accent" | "primary" | "destructive" | "warning"
}) {
  const color =
    tone === "accent"
      ? "text-accent"
      : tone === "primary"
        ? "text-primary"
        : tone === "destructive"
          ? "text-destructive"
          : "text-orange-600"
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-3xl font-semibold ${color}`}>{value}%</p>
      </CardContent>
    </Card>
  )
}

function Empty() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Pas encore de données.</p>
}
