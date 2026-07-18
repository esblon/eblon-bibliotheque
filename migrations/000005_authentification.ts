import type { MigrationBuilder, Name } from "node-pg-migrate"

function authSchema(): string {
  const base = process.env.DATABASE_SCHEMA ?? "eblon_bibliotheque"
  if (!/^[a-z_][a-z0-9_]*$/.test(base)) throw new Error("DATABASE_SCHEMA is invalid")
  return `${base}_auth`
}
const table = (schema: string, name: string): Name => ({ schema, name })

export function up(pgm: MigrationBuilder): void {
  const schema = authSchema(); pgm.createSchema(schema, { ifNotExists: true })
  pgm.createTable(table(schema,"user"),{
    id:{type:"text",primaryKey:true},name:{type:"text",notNull:true},email:{type:"text",notNull:true,unique:true},
    emailVerified:{type:"boolean",notNull:true,default:false},image:{type:"text"},role:{type:"text",notNull:true,default:"prof"},
    statut:{type:"text",notNull:true,default:"Actif"},createdAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},updatedAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},
  })
  pgm.createTable(table(schema,"session"),{
    id:{type:"text",primaryKey:true},expiresAt:{type:"timestamptz",notNull:true},token:{type:"text",notNull:true,unique:true},
    createdAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},updatedAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},
    ipAddress:{type:"text"},userAgent:{type:"text"},userId:{type:"text",notNull:true,references:table(schema,"user"),onDelete:"CASCADE"},
  });pgm.createIndex(table(schema,"session"),"userId")
  pgm.createTable(table(schema,"account"),{
    id:{type:"text",primaryKey:true},accountId:{type:"text",notNull:true},providerId:{type:"text",notNull:true},userId:{type:"text",notNull:true,references:table(schema,"user"),onDelete:"CASCADE"},
    accessToken:{type:"text"},refreshToken:{type:"text"},idToken:{type:"text"},accessTokenExpiresAt:{type:"timestamptz"},refreshTokenExpiresAt:{type:"timestamptz"},scope:{type:"text"},password:{type:"text"},
    createdAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},updatedAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},
  });pgm.createIndex(table(schema,"account"),"userId")
  pgm.createTable(table(schema,"verification"),{
    id:{type:"text",primaryKey:true},identifier:{type:"text",notNull:true},value:{type:"text",notNull:true},expiresAt:{type:"timestamptz",notNull:true},
    createdAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},updatedAt:{type:"timestamptz",notNull:true,default:pgm.func("current_timestamp")},
  });pgm.createIndex(table(schema,"verification"),"identifier")
}
export function down(pgm: MigrationBuilder): void { pgm.dropSchema(authSchema(), { cascade: true, ifExists: true }) }
