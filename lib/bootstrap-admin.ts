import { z } from "zod"

export const bootstrapAdminSchema=z.object({email:z.string().email(),name:z.string().trim().min(2).max(200),password:z.string().min(8).max(200)})
export type BootstrapAdminInput=z.infer<typeof bootstrapAdminSchema>
export type BootstrapAdminDependencies={trouverUtilisateur:(email:string)=>Promise<{id:string;email:string}|null>;creerUtilisateur:(input:BootstrapAdminInput)=>Promise<{id:string;email:string}>;garantirAdministrateur:(user:{id:string;email:string},name:string)=>Promise<void>}

export function lireBootstrapAdmin(environment:Record<string,string|undefined>=process.env):BootstrapAdminInput{
 return bootstrapAdminSchema.parse({email:environment.BOOTSTRAP_ADMIN_EMAIL,name:environment.BOOTSTRAP_ADMIN_NAME,password:environment.BOOTSTRAP_ADMIN_PASSWORD})
}
export async function executerBootstrapAdmin(input:BootstrapAdminInput,deps:BootstrapAdminDependencies){const valide=bootstrapAdminSchema.parse(input);const existant=await deps.trouverUtilisateur(valide.email);const user=existant??await deps.creerUtilisateur(valide);await deps.garantirAdministrateur(user,valide.name);return{created:!existant,email:user.email}}
