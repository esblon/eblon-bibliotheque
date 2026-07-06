"use client"

import { QrCode } from "@/components/qr-code"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Printer } from "lucide-react"

type Item = {
  id: number
  codeLivre: string
  titre: string
}

export function QrCodesSheet({ livres }: { livres: Item[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimer les étiquettes
        </Button>
      </div>

      {livres.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Aucun livre à afficher.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
          {livres.map((l) => (
            <div
              key={l.id}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center"
            >
              <div className="rounded bg-white p-2">
                <QrCode value={l.codeLivre} size={130} />
              </div>
              <p className="font-mono text-xs font-semibold text-foreground">
                {l.codeLivre}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {l.titre}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
