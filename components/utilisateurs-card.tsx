"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { setUserRole, setUserStatut } from "@/app/actions/utilisateurs"

type Utilisateur = {
  id: string
  name: string
  email: string
  role: string
  statut: string
}

export function UtilisateursCard({
  utilisateurs,
  currentUserId,
}: {
  utilisateurs: Utilisateur[]
  currentUserId: string
}) {
  const router = useRouter()

  async function changeRole(id: string, role: string) {
    const res = await setUserRole(id, role as "admin" | "prof")
    if (res?.error) return toast.error(res.error)
    toast.success("Rôle mis à jour.")
    router.refresh()
  }

  async function toggleStatut(id: string, statut: string) {
    const next = statut === "Actif" ? "Inactif" : "Actif"
    const res = await setUserStatut(id, next)
    if (res?.error) return toast.error(res.error)
    toast.success("Statut mis à jour.")
    router.refresh()
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Utilisateurs et accès</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Les nouveaux comptes créés via la page d'inscription reçoivent le rôle « Professeur ».
          Attribuez le rôle « Administrateur » aux personnes de confiance.
        </p>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilisateurs.map((u) => {
                const isSelf = u.id === currentUserId
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">
                        {u.name} {isSelf && <span className="text-xs text-muted-foreground">(vous)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? "Administrateur" : "Professeur"}
                        </Badge>
                      ) : (
                        <Select value={u.role} onValueChange={(v) => v && changeRole(u.id, v)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="prof">Professeur</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.statut === "Actif" ? "outline" : "destructive"}>
                        {u.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && (
                        <Button variant="outline" size="sm" onClick={() => toggleStatut(u.id, u.statut)}>
                          {u.statut === "Actif" ? "Désactiver" : "Activer"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
