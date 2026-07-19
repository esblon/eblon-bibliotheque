import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only",()=>({}))
vi.mock("next/headers",()=>({headers:vi.fn(async()=>new Headers({cookie:"better-auth.session=test"}))}))
const redirectMock=vi.hoisted(()=>vi.fn())
vi.mock("next/navigation",()=>({redirect:(destination:string)=>{redirectMock(destination);throw new Error(`REDIRECT:${destination}`)}}))

describe("client API frontend",()=>{
 beforeEach(()=>{vi.resetModules();vi.clearAllMocks();vi.unstubAllGlobals();process.env.BETTER_AUTH_URL="http://localhost:3000"})
 it("transmet la session et lit une liste",async()=>{const fetchMock=vi.fn(async(_url:URL,init:RequestInit)=>{expect(new Headers(init.headers).get("cookie")).toContain("better-auth.session");return new Response(JSON.stringify({donnees:[{id:"1",code:"MATH",nom:"Mathématiques"}],meta:{total:1}}),{status:200,headers:{"Content-Type":"application/json"}})});vi.stubGlobal("fetch",fetchMock);const{appelerApi}=await import("@/lib/frontend-api/client");const r=await appelerApi<unknown[]>("/api/v1/matieres");expect(r.donnees).toHaveLength(1)})
 it.each([[401,"/sign-in"],[403,"/espace-eleve"]])("redirige le statut %s vers %s",async(statut,destination)=>{vi.stubGlobal("fetch",vi.fn(async()=>new Response(null,{status:statut})));const{appelerApi}=await import("@/lib/frontend-api/client");await expect(appelerApi("/api/v1/matieres")).rejects.toThrow(`REDIRECT:${destination}`);expect(redirectMock).toHaveBeenCalledWith(destination)})
 it("normalise le statut 409",async()=>{vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({erreur:{code:"DOUBLON",message:"Message métier"}}),{status:409,headers:{"Content-Type":"application/json"}})));const{appelerApi}=await import("@/lib/frontend-api/client");await expect(appelerApi("/api/v1/matieres")).rejects.toMatchObject({statut:409,code:"DOUBLON",message:"Message métier"})})
 it("signale une erreur réseau sans exposer de détail",async()=>{vi.stubGlobal("fetch",vi.fn(async()=>{throw new Error("ECONNREFUSED secret")}));const{appelerApi}=await import("@/lib/frontend-api/client");await expect(appelerApi("/api/v1/matieres")).rejects.toThrow("API métier indisponible")})
 it("préserve explicitement une liste vide",async()=>{vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({donnees:[],meta:{total:0}}),{status:200})));const{appelerApi}=await import("@/lib/frontend-api/client");expect((await appelerApi<unknown[]>("/api/v1/ouvrages")).donnees).toEqual([])})
})

describe("validation des formulaires frontend",()=>{
 it("valide les principales créations",async()=>{const{schemasFormulaires}=await import("@/lib/frontend-api/validation");expect(schemasFormulaires.matieres.parse({code:"MATH",nom:"Mathématiques",est_active:true}).nom).toBe("Mathématiques");expect(schemasFormulaires.ouvrages.safeParse({titre:"Annales",sous_titre:"",isbn:"",editeur:"",edition:"",annee_publication:2026,description:"",matiere_id:"11111111-1111-4111-8111-111111111111",niveau_scolaire_id:"22222222-2222-4222-8222-222222222222",est_actif:true}).success).toBe(true)})
 it("rejette un email et un identifiant invalides",async()=>{const{schemasFormulaires}=await import("@/lib/frontend-api/validation");expect(schemasFormulaires.emprunteurs.safeParse({numero_emprunteur:"E1",prenom:"A",nom:"B",email:"invalide",telephone:"",niveau_scolaire_id:"",classe:"",etablissement:"",statut:"ACTIF"}).success).toBe(false)})
})
