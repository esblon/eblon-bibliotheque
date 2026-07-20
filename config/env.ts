import { z } from "zod"

const booleen = z.enum(["true","false"]).transform(v=>v==="true")
const baseSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  DATABASE_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/).default("eblon_bibliotheque"),
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  TRUSTED_ORIGINS: z.string().optional().transform(v=>v?.split(",").map(x=>x.trim()).filter(Boolean)??[]),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOSTNAME: z.string().min(1).default("0.0.0.0"),
  PUBLIC_SIGNUP_ENABLED: booleen.default(false),
  EMAIL_ENABLED: booleen.default(false),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
}).superRefine((env,ctx)=>{
  if(env.NODE_ENV==="production"){
    for(const key of ["BETTER_AUTH_URL","BETTER_AUTH_SECRET","NEXT_PUBLIC_APP_URL"] as const)if(!env[key])ctx.addIssue({code:"custom",path:[key],message:`${key} est obligatoire en production`})
    if(env.TRUSTED_ORIGINS.length===0)ctx.addIssue({code:"custom",path:["TRUSTED_ORIGINS"],message:"TRUSTED_ORIGINS est obligatoire en production"})
  }
  if(env.EMAIL_ENABLED){
    if(!env.RESEND_API_KEY)ctx.addIssue({code:"custom",path:["RESEND_API_KEY"],message:"RESEND_API_KEY est obligatoire lorsque EMAIL_ENABLED=true"})
    if(!env.EMAIL_FROM)ctx.addIssue({code:"custom",path:["EMAIL_FROM"],message:"EMAIL_FROM est obligatoire lorsque EMAIL_ENABLED=true"})
  }
})

export type ServerEnvironment = z.infer<typeof baseSchema>
export function parseServerEnvironment(environment:Record<string,string|undefined>=process.env):ServerEnvironment{return baseSchema.parse(environment)}
export function publicSignupEnabled(environment:Record<string,string|undefined>=process.env){return environment.PUBLIC_SIGNUP_ENABLED==="true"}
export function emailEnabled(environment:Record<string,string|undefined>=process.env){return environment.EMAIL_ENABLED==="true"}
