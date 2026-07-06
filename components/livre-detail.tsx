"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { QrCode } from "@/components/qr-code"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { archiveLivre, deleteLivre, signalerLivre } from "@/app/actions/livres"
import { statutLivreColor, statutEmpruntColor } from "@/lib/constants"
import {
  Pencil,
  Archive,
  Trash2,
  AlertTriangle,
  ArrowLeftRight,
  Printer,
} from "lucide-react"

type Livre = {
  id: number
  codeLivre: string
  titre: string
  niveau: string
  matiere: string
  typeLivre: string
  edition: string | null
  etatPhysique: string
  statut: string
  localisation: string
  commentaire: string | null
}

type Emprunt = {
  id: number
  numeroEmprunt: string
  statut: string
  dateEmprunt: Date
  dateRetourPrevue: Date
  dateRetourReelle: Date | null
  nom: string | null
  prenom: string | null
  classe: string | null
}

function fmt(d: Date | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fr-FR")
}

export function LivreDetail({
  livre,
  emprunts,
  isAdmin,
}: {
  livre: Livre
  emprunts: Emprunt[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const runAction = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true)
    await fn()
    setBusy(false)
    toast.success(msg)
    router.refresh()
  }

  const info: [string, string][] = [
    ["Niveau", livre.niveau],
    ["Matière", livre.matiere],
    ["Type", livre.typeLivre],
    ["Édition", livre.edition || "—"],
    ["État physique", livre.etatPhysique],
    ["Localisation", livre.localisation],
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                {livre.codeLivre}
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground text-balance">
                {livre.titre}
              </h2>
            </div>
            <Badge variant="outline" className={statutLivreColor(livre.statut)}>
              {livre.statut}
            </Badge>
          </div>

          <Separator className="my-4" />

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {info.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {livre.commentaire && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground">Commentaire</p>
                <p className="mt-1 text-sm text-foreground">
                  {livre.commentaire}
                </p>
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {livre.statut === "Disponible" && (
              <Button
                render={
                  <Link href={`/emprunts/nouveau?code=${livre.codeLivre}`} />
                }
                size="sm"
              >
                <ArrowLeftRight className="size-4" />
                Prêter ce livre
              </Button>
            )}
            <Button
              render={<Link href={`/livres/${livre.id}/modifier`} />}
              variant="outline"
              size="sm"
            >
              <Pencil className="size-4" />
              Modifier
            </Button>

            <SignalDialog
              livreId={livre.id}
              busy={busy}
              onDone={runAction}
            />

            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                runAction(() => archiveLivre(livre.id), "Livre archivé.")
              }
            >
              <Archive className="size-4" />
              Archiver
            </Button>

            {isAdmin && (
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                    />
                  }
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Supprimer définitivement ?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Cette action supprime le livre et son historique d'emprunts.
                    Elle est irréversible.
                  </p>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Annuler
                    </DialogClose>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={async () => {
                        await deleteLivre(livre.id)
                        toast.success("Livre supprimé.")
                        router.push("/livres")
                        router.refresh()
                      }}
                    >
                      Supprimer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            Historique des emprunts
          </h3>
          {emprunts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun emprunt pour ce livre.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {emprunts.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.prenom} {e.nom}{" "}
                      <span className="text-muted-foreground">
                        · {e.classe ?? "—"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Emprunté le {fmt(e.dateEmprunt)} · Retour prévu{" "}
                      {fmt(e.dateRetourPrevue)}
                      {e.dateRetourReelle
                        ? ` · Rendu le ${fmt(e.dateRetourReelle)}`
                        : ""}
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

      <div>
        <Card className="flex flex-col items-center gap-4 p-5">
          <h3 className="text-base font-semibold text-foreground">QR code</h3>
          <div className="rounded-lg border border-border bg-white p-3">
            <QrCode value={livre.codeLivre} size={200} />
          </div>
          <p className="text-center font-mono text-xs text-muted-foreground">
            {livre.codeLivre}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>
        </Card>
      </div>
    </div>
  )
}

function SignalDialog({
  livreId,
  busy,
  onDone,
}: {
  livreId: number
  busy: boolean
  onDone: (fn: () => Promise<unknown>, msg: string) => Promise<void>
}) {
  const [comment, setComment] = useState("")
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <AlertTriangle className="size-4" />
        Signaler
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un problème</DialogTitle>
        </DialogHeader>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Commentaire (facultatif)"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {["Perdu", "Abîmé", "Retiré"].map((s) => (
            <DialogClose
              key={s}
              render={
                <Button
                  variant="outline"
                  disabled={busy}
                  className="w-full"
                  onClick={() =>
                    onDone(
                      () => signalerLivre(livreId, s, comment),
                      `Livre signalé : ${s}.`,
                    )
                  }
                />
              }
            >
              Marquer comme {s}
            </DialogClose>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
