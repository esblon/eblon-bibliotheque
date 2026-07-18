import{describe,expect,it}from"vitest";import{schemaPagination,metaPagination}from"@/lib/api/pagination";import{normaliserErreur,ErreurApi}from"@/lib/api/erreurs";import{validationsRessources,transitionsExemplaire}from"@/lib/validation/ressources";import{creerEmpruntSchema}from"@/lib/validation/emprunts"
import{roleAutorise}from"@/lib/api/authentification"
describe("socle API",()=>{
 it("normalise et borne la pagination",()=>{expect(schemaPagination.parse({}).limite).toBe(20);expect(()=>schemaPagination.parse({limite:101})).toThrow();expect(metaPagination(2,20,41).nombre_pages).toBe(3)})
 it("normalise les codes métier",()=>{expect(validationsRessources.matieres.parse({code:" math ",nom:"Mathématiques"}).code).toBe("MATH")})
 it("rejette les UUID et dates invalides",()=>{expect(()=>creerEmpruntSchema.parse({exemplaire_id:"x",emprunteur_id:"x",agent_preteur_id:"x",date_echeance:"demain"})).toThrow()})
 it("définit les transitions d'exemplaire",()=>{expect(transitionsExemplaire.DISPONIBLE).toContain("ABIME");expect(transitionsExemplaire.RETIRE).toEqual([])})
 it("applique les autorisations par rôle",()=>{expect(roleAutorise("ADMIN",["ADMIN","BIBLIOTHECAIRE"])).toBe(true);expect(roleAutorise("LECTEUR",["ADMIN","BIBLIOTHECAIRE"])).toBe(false);expect(roleAutorise("LECTEUR")).toBe(true)})
 it("conserve les erreurs métier et masque les erreurs internes",()=>{const e=new ErreurApi("ACCES_INTERDIT","Accès interdit",403);expect(normaliserErreur(e)).toBe(e);expect(normaliserErreur(new Error("secret SQL")).message).toBe("Une erreur interne est survenue")})
})
