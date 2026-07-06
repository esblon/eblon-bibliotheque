import {
  LayoutDashboard,
  BookMarked,
  Users,
  ArrowLeftRight,
  Clock,
  BarChart3,
  Settings,
  ScanLine,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/livres", label: "Livres", icon: BookMarked },
  { href: "/eleves", label: "Élèves", icon: Users },
  { href: "/emprunts", label: "Emprunts", icon: ArrowLeftRight },
  { href: "/scan", label: "Scanner", icon: ScanLine },
  { href: "/retards", label: "Retards", icon: Clock },
  { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
]
