import { describe,expect,it } from "vitest"
import { parseServerEnvironment,publicSignupEnabled } from "@/config/env"

const base={DATABASE_URL:"postgresql://user:password@127.0.0.1:5432/eblon",DATABASE_SCHEMA:"eblon_bibliotheque"}
describe("server environment",()=>{
 it("applique des valeurs locales sûres",()=>{const env=parseServerEnvironment(base);expect(env.PUBLIC_SIGNUP_ENABLED).toBe(false);expect(env.EMAIL_ENABLED).toBe(false)})
 it("rejette un schéma dangereux",()=>expect(()=>parseServerEnvironment({...base,DATABASE_SCHEMA:"public; drop schema public"})).toThrow())
 it("exige la configuration UAT en production",()=>expect(()=>parseServerEnvironment({...base,NODE_ENV:"production"})).toThrow())
 it("accepte une configuration UAT complète",()=>expect(parseServerEnvironment({...base,NODE_ENV:"production",BETTER_AUTH_URL:"https://uat.example.invalid",BETTER_AUTH_SECRET:"a".repeat(32),TRUSTED_ORIGINS:"https://uat.example.invalid, https://admin.example.invalid",NEXT_PUBLIC_APP_URL:"https://uat.example.invalid",PUBLIC_SIGNUP_ENABLED:"false",EMAIL_ENABLED:"false"}).TRUSTED_ORIGINS).toHaveLength(2))
 it("exige Resend uniquement lorsque les e-mails sont activés",()=>{expect(()=>parseServerEnvironment({...base,EMAIL_ENABLED:"true"})).toThrow();expect(parseServerEnvironment({...base,EMAIL_ENABLED:"true",RESEND_API_KEY:"fake-key",EMAIL_FROM:"Test <test@example.invalid>"}).EMAIL_ENABLED).toBe(true)})
 it("active l’inscription uniquement sur true explicite",()=>{expect(publicSignupEnabled({})).toBe(false);expect(publicSignupEnabled({PUBLIC_SIGNUP_ENABLED:"true"})).toBe(true)})
})
