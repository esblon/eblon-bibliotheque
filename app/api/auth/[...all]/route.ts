import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { publicSignupEnabled } from "@/config/env"

const handlers=toNextJsHandler(auth.handler)
export const GET=handlers.GET
export async function POST(request:Request){if(new URL(request.url).pathname.endsWith("/sign-up/email")&&!publicSignupEnabled())return Response.json({code:"PUBLIC_SIGNUP_DISABLED",message:"L’inscription publique est désactivée."},{status:403});return handlers.POST(request)}
