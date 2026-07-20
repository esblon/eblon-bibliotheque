import { describe,expect,it,vi } from "vitest"
import { executerBootstrapAdmin,lireBootstrapAdmin,type BootstrapAdminDependencies } from "@/lib/bootstrap-admin"

const input={email:"admin@example.invalid",name:"Awa Admin",password:"MotDePasseTemporaire-2026!"}
function deps(existant:{id:string;email:string}|null=null){return{trouverUtilisateur:vi.fn(async()=>existant),creerUtilisateur:vi.fn(async()=>({id:"new-user",email:input.email})),garantirAdministrateur:vi.fn(async()=>undefined)} satisfies BootstrapAdminDependencies}
describe("bootstrap administrateur",()=>{
 it("rejette les variables absentes",()=>expect(()=>lireBootstrapAdmin({})).toThrow())
 it("rejette un mot de passe trop court",()=>expect(()=>lireBootstrapAdmin({BOOTSTRAP_ADMIN_EMAIL:input.email,BOOTSTRAP_ADMIN_NAME:input.name,BOOTSTRAP_ADMIN_PASSWORD:"court"})).toThrow())
 it("crée uniquement le compte ciblé",async()=>{const d=deps();await expect(executerBootstrapAdmin(input,d)).resolves.toMatchObject({created:true});expect(d.creerUtilisateur).toHaveBeenCalledOnce();expect(d.garantirAdministrateur).toHaveBeenCalledWith({id:"new-user",email:input.email},input.name)})
 it("est idempotent à la réexécution",async()=>{const user={id:"existing",email:input.email},d=deps(user);await executerBootstrapAdmin(input,d);await executerBootstrapAdmin(input,d);expect(d.creerUtilisateur).not.toHaveBeenCalled();expect(d.garantirAdministrateur).toHaveBeenCalledTimes(2)})
 it("garantit le rôle pour un utilisateur existant",async()=>{const d=deps({id:"existing",email:input.email});await expect(executerBootstrapAdmin(input,d)).resolves.toMatchObject({created:false});expect(d.garantirAdministrateur).toHaveBeenCalledOnce()})
 it("ne recherche ni ne promeut un autre utilisateur",async()=>{const d=deps();await executerBootstrapAdmin(input,d);expect(d.trouverUtilisateur).toHaveBeenCalledWith(input.email);expect(d.garantirAdministrateur).toHaveBeenCalledTimes(1)})
})
