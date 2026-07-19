import { ArrowLeftRight, BookCopy, BookOpen, GraduationCap, LayoutDashboard, Tags, UsersRound, UserCog, type LucideIcon } from "lucide-react"
export type NavItem={href:string;label:string;icon:LucideIcon}
export const NAV_ITEMS:NavItem[]=[
 {href:"/",label:"Tableau de bord",icon:LayoutDashboard},
 {href:"/matieres",label:"Matières",icon:Tags},
 {href:"/niveaux-scolaires",label:"Niveaux scolaires",icon:GraduationCap},
 {href:"/ouvrages",label:"Ouvrages",icon:BookOpen},
 {href:"/exemplaires",label:"Exemplaires",icon:BookCopy},
 {href:"/emprunteurs",label:"Emprunteurs",icon:UsersRound},
 {href:"/agents",label:"Agents",icon:UserCog},
 {href:"/emprunts",label:"Emprunts",icon:ArrowLeftRight},
]
