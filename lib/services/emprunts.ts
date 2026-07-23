import { randomUUID } from "node:crypto"
import type { PoolClient } from "pg"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { ErreurApi } from "@/lib/api/erreurs"
import { journaliser } from "@/lib/api/journal"
import type { Pagination } from "@/lib/api/pagination"

const schema = () => `"${parseServerEnvironment().DATABASE_SCHEMA}"`
async function transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> { const c = await pool.connect(); try { await c.query("BEGIN"); const r = await operation(c); await c.query("COMMIT"); return r } catch (e) { await c.query("ROLLBACK"); throw e } finally { c.release() } }
async function evenement(c: PoolClient, empruntId: string, type: string, agentId?: string, details?: unknown) { await c.query(`INSERT INTO ${schema()}.evenements_emprunt(id,emprunt_id,type_evenement,agent_id,details) VALUES($1,$2,$3,$4,$5)`, [randomUUID(), empruntId, type, agentId ?? null, details ? JSON.stringify(details) : null]) }

export async function creerEmprunt(d: { exemplaire_id:string; emprunteur_id:string; agent_preteur_id:string; date_emprunt?:string; date_echeance:string; observations?:string|null }) {
  return transaction(async (c) => {
    const ex = (await c.query(`SELECT statut FROM ${schema()}.exemplaires WHERE id=$1 FOR UPDATE`, [d.exemplaire_id])).rows[0]
    if (!ex) throw new ErreurApi("RESSOURCE_INTROUVABLE", "Exemplaire introuvable", 404)
    if (ex.statut !== "DISPONIBLE") throw new ErreurApi("EXEMPLAIRE_INDISPONIBLE", "Exemplaire indisponible", 409)
    const emp = (await c.query(`SELECT statut FROM ${schema()}.emprunteurs WHERE id=$1`, [d.emprunteur_id])).rows[0]
    if (!emp) throw new ErreurApi("RESSOURCE_INTROUVABLE", "Emprunteur introuvable", 404)
    if (emp.statut !== "ACTIF") throw new ErreurApi("EMPRUNTEUR_INACTIF", "Emprunteur inactif", 409)
    const agent = (await c.query(`SELECT statut FROM ${schema()}.agents WHERE id=$1`, [d.agent_preteur_id])).rows[0]
    if (!agent || agent.statut !== "ACTIF") throw new ErreurApi("CONFLIT_METIER", "Agent prêteur invalide", 409)
    const debut = d.date_emprunt ? new Date(d.date_emprunt) : new Date(), echeance = new Date(d.date_echeance)
    if (echeance <= debut) throw new ErreurApi("DONNEES_INVALIDES", "La date d’échéance doit être postérieure", 400)
    const id = randomUUID()
    let r
    try { r = await c.query(`INSERT INTO ${schema()}.emprunts(id,exemplaire_id,emprunteur_id,agent_preteur_id,date_emprunt,date_echeance,statut,observations) VALUES($1,$2,$3,$4,$5,$6,'ACTIF',$7) RETURNING *`, [id,d.exemplaire_id,d.emprunteur_id,d.agent_preteur_id,debut,echeance,d.observations ?? null]) }
    catch (e) { if (typeof e === "object" && e && "code" in e && e.code === "23505") throw new ErreurApi("EMPRUNT_ACTIF_EXISTANT", "Un emprunt actif existe déjà", 409); throw e }
    await c.query(`UPDATE ${schema()}.exemplaires SET statut='EMPRUNTE',date_modification=current_timestamp WHERE id=$1`, [d.exemplaire_id])
    await evenement(c,id,"CREE",d.agent_preteur_id); journaliser("creation_emprunt",{ emprunt_id:id }); return r.rows[0]
  })
}
export async function retournerEmprunt(id:string,d:{agent_recepteur_id:string;date_retour?:string;etat_retour:string;observations?:string|null}) { return transaction(async(c)=>{
  const e=(await c.query(`SELECT * FROM ${schema()}.emprunts WHERE id=$1 FOR UPDATE`,[id])).rows[0]; if(!e)throw new ErreurApi("RESSOURCE_INTROUVABLE","Emprunt introuvable",404); if(e.statut==="RETOURNE")throw new ErreurApi("EMPRUNT_DEJA_CLOTURE","Emprunt déjà retourné",409)
  const a=(await c.query(`SELECT statut FROM ${schema()}.agents WHERE id=$1`,[d.agent_recepteur_id])).rows[0]; if(!a||a.statut!=="ACTIF")throw new ErreurApi("CONFLIT_METIER","Agent récepteur invalide",409)
  const retour=d.date_retour?new Date(d.date_retour):new Date(); if(retour<new Date(e.date_emprunt))throw new ErreurApi("DONNEES_INVALIDES","Date de retour invalide",400)
  const statutEx=d.etat_retour==="ABIME"?"ABIME":d.etat_retour==="PERDU"?"PERDU":"DISPONIBLE"
  const r=await c.query(`UPDATE ${schema()}.emprunts SET statut='RETOURNE',date_retour=$2,agent_recepteur_id=$3,etat_retour=$4,observations=coalesce($5,observations),date_modification=current_timestamp WHERE id=$1 RETURNING *`,[id,retour,d.agent_recepteur_id,d.etat_retour,d.observations??null]); await c.query(`UPDATE ${schema()}.exemplaires SET statut=$2,date_modification=current_timestamp WHERE id=$1`,[e.exemplaire_id,statutEx]); await evenement(c,id,"RETOURNE",d.agent_recepteur_id,{etat_retour:d.etat_retour}); journaliser("retour_emprunt",{emprunt_id:id}); return r.rows[0]
})}
export async function prolongerEmprunt(id:string,nouvelle:string,agentId?:string){return transaction(async(c)=>{const e=(await c.query(`SELECT * FROM ${schema()}.emprunts WHERE id=$1 FOR UPDATE`,[id])).rows[0];if(!e)throw new ErreurApi("RESSOURCE_INTROUVABLE","Emprunt introuvable",404);if(!["ACTIF","EN_RETARD"].includes(e.statut)||new Date(nouvelle)<=new Date(e.date_echeance))throw new ErreurApi("CONFLIT_METIER","Prolongation interdite",409);const r=await c.query(`UPDATE ${schema()}.emprunts SET date_echeance=$2,date_modification=current_timestamp WHERE id=$1 RETURNING *`,[id,nouvelle]);await evenement(c,id,"PROLONGE",agentId,{ancienne_date:e.date_echeance,nouvelle_date:nouvelle});journaliser("prolongation_emprunt",{emprunt_id:id});return r.rows[0]})}
export async function changerEtatEmprunt(id:string,action:"RETARD"|"PERTE"|"ANNULATION",agentId?:string){return transaction(async(c)=>{const e=(await c.query(`SELECT * FROM ${schema()}.emprunts WHERE id=$1 FOR UPDATE`,[id])).rows[0];if(!e)throw new ErreurApi("RESSOURCE_INTROUVABLE","Emprunt introuvable",404);if(action==="RETARD"&&e.statut!=="ACTIF")throw new ErreurApi("CONFLIT_METIER","Retard interdit",409);if(action!=="RETARD"&&["RETOURNE","PERDU","ANNULE"].includes(e.statut))throw new ErreurApi("EMPRUNT_DEJA_CLOTURE","Emprunt déjà clôturé",409);const statut=action==="RETARD"?"EN_RETARD":action==="PERTE"?"PERDU":"ANNULE",type=action==="RETARD"?"MARQUE_EN_RETARD":action==="PERTE"?"MARQUE_PERDU":"ANNULE";const r=await c.query(`UPDATE ${schema()}.emprunts SET statut=$2,date_modification=current_timestamp WHERE id=$1 RETURNING *`,[id,statut]);if(action!=="RETARD")await c.query(`UPDATE ${schema()}.exemplaires SET statut=$2,date_modification=current_timestamp WHERE id=$1`,[e.exemplaire_id,action==="PERTE"?"PERDU":"DISPONIBLE"]);await evenement(c,id,type,agentId);journaliser(action.toLowerCase()+"_emprunt",{emprunt_id:id});return r.rows[0]})}
export async function obtenirEmprunt(id:string){const r=(await pool.query(`SELECT * FROM ${schema()}.emprunts WHERE id=$1`,[id])).rows[0];if(!r)throw new ErreurApi("RESSOURCE_INTROUVABLE","Emprunt introuvable",404);return r}
export async function evenementsEmprunt(id:string){await obtenirEmprunt(id);return (await pool.query(`SELECT * FROM ${schema()}.evenements_emprunt WHERE emprunt_id=$1 ORDER BY date_evenement`,[id])).rows}
export async function listerEmprunts(p:Pagination,params:URLSearchParams){
  const vals:unknown[]=[],cond:string[]=[]
  for(const f of ["statut","emprunteur_id","exemplaire_id"]){const v=params.get(f);if(v){vals.push(v);cond.push(`p.${f}=$${vals.length}`)}}
  for(const f of ["date_emprunt","date_echeance"]){const v=params.get(f);if(v){const date=new Date(v);if(Number.isNaN(date.valueOf()))throw new ErreurApi("DONNEES_INVALIDES",`Filtre ${f} invalide`,400);vals.push(date);cond.push(`p.${f}::date=$${vals.length}::date`)}}
  if(params.get("en_retard")==="true")cond.push(`p.statut IN ('ACTIF','EN_RETARD') AND p.date_echeance<current_timestamp`)
  const w=cond.length?`WHERE ${cond.join(" AND ")}`:""
  const t=(await pool.query<{total:number}>(`SELECT count(*)::int total FROM ${schema()}.emprunts p ${w}`,vals)).rows[0]?.total??0
  vals.push(p.limite,(p.page-1)*p.limite)
  const r=await pool.query(`SELECT p.*,coalesce(ev.evenements,'[]'::jsonb) evenements
    FROM ${schema()}.emprunts p
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(to_jsonb(e) ORDER BY e.date_evenement) evenements
      FROM ${schema()}.evenements_emprunt e WHERE e.emprunt_id=p.id
    ) ev ON true
    ${w} ORDER BY p.date_emprunt ${p.ordre==="desc"?"DESC":"ASC"}
    LIMIT $${vals.length-1} OFFSET $${vals.length}`,vals)
  return{donnees:r.rows,total:t}
}
