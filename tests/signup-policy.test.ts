import { describe,expect,it } from "vitest"
import { assertSignupAllowed } from "@/lib/signup-policy"
describe("inscription publique",()=>{
 it("la bloque lorsque désactivée",()=>expect(()=>assertSignupAllowed({email:"eleve@example.invalid",publicSignupEnabled:false})).toThrow("désactivée"))
 it("la permet lorsqu’activée explicitement",()=>expect(assertSignupAllowed({email:"eleve@example.invalid",publicSignupEnabled:true}).internal).toBe(false))
 it("conserve l’activation agent interne",()=>expect(assertSignupAllowed({email:"agent@example.invalid",publicSignupEnabled:false,activationEmail:"AGENT@example.invalid"}).internal).toBe(true))
 it("conserve le bootstrap interne",()=>expect(assertSignupAllowed({email:"admin@example.invalid",publicSignupEnabled:false,bootstrapEmail:"admin@example.invalid"}).internal).toBe(true))
})
