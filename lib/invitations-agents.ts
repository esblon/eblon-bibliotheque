import "server-only"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { sendAgentInvitationEmail } from "@/lib/email"

const empreinte=(jeton:string)=>createHash("sha256").update(jeton).digest("hex")
const schema=()=>`"${parseServerEnvironment().DATABASE_SCHEMA}"`

export async function inviterAgent(agent:{id:string;email:string;prenom:string}){
 const jeton=randomBytes(32).toString("base64url"),expiration=new Date(Date.now()+24*60*60*1000)
 const client=await pool.connect();await client.query("BEGIN")
 try{
  await client.query(`DELETE FROM ${schema()}.invitations_agents WHERE agent_id=$1 AND date_utilisation IS NULL`,[agent.id])
  await client.query(`INSERT INTO ${schema()}.invitations_agents(id,agent_id,empreinte_jeton,date_expiration) VALUES($1,$2,$3,$4)`,[randomUUID(),agent.id,empreinte(jeton),expiration])
  await client.query("COMMIT")
 }catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}
 const base=process.env.BETTER_AUTH_URL??"http://localhost:3000"
 await sendAgentInvitationEmail(agent.email,agent.prenom,`${base}/activation-agent?jeton=${encodeURIComponent(jeton)}`)
 await pool.query(`UPDATE ${schema()}.invitations_agents SET date_envoi=current_timestamp WHERE empreinte_jeton=$1`,[empreinte(jeton)])
}

export async function verifierInvitation(jeton:string){
 const r=await pool.query<{id:string;agent_id:string;email:string;prenom:string;nom:string}>(`SELECT i.id,i.agent_id,a.email,a.prenom,a.nom FROM ${schema()}.invitations_agents i JOIN ${schema()}.agents a ON a.id=i.agent_id WHERE i.empreinte_jeton=$1 AND i.date_utilisation IS NULL AND i.date_expiration>current_timestamp AND a.statut='ACTIF'`,[empreinte(jeton)])
 return r.rows[0]??null
}

export async function utiliserInvitation(id:string){await pool.query(`UPDATE ${schema()}.invitations_agents SET date_utilisation=current_timestamp WHERE id=$1 AND date_utilisation IS NULL`,[id])}
