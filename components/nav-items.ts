import { ArrowLeftRight, BookCopy, BookOpen, Building2, GraduationCap, LayoutDashboard, ShieldCheck, Tags, UsersRound, UserCog, type LucideIcon } from "lucide-react"
export type NavItem={href:string;label:string;icon:LucideIcon}
export const NAV_ITEMS:NavItem[]=[
 {href:"/",label:"Tableau de bord",icon:LayoutDashboard},
 {href:"/matieres",label:"Matières",icon:Tags},
 {href:"/niveaux-scolaires",label:"Niveaux scolaires",icon:GraduationCap},
 {href:"/classes-scolaires",label:"Classes",icon:GraduationCap},
 {href:"/etablissements",label:"Établissements",icon:Building2},
 {href:"/ouvrages",label:"Ouvrages",icon:BookOpen},
 {href:"/exemplaires",label:"Exemplaires",icon:BookCopy},
 {href:"/emprunteurs",label:"Emprunteurs",icon:UsersRound},
 {href:"/agents",label:"Agents",icon:UserCog},
 {href:"/roles",label:"Rôles",icon:ShieldCheck},
 {href:"/emprunts",label:"Emprunts",icon:ArrowLeftRight},
]
