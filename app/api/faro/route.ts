import {env} from 'cloudflare:workers';
import {analyze,runAgent,FaroError,LIMIT_MICRO,RESERVE_MICRO} from '../../../lib/faro.mjs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function json(data:unknown,status=200){return Response.json(data,{status,headers});}
export async function GET(request:Request){try{const baseline=Number(env.BUDGET_BASELINE_MICRO??0);if(!Number.isSafeInteger(baseline)||baseline<0||baseline>LIMIT_MICRO)throw Error();const ledger=env.DB?await env.DB.prepare('SELECT spent,reserved FROM faro_budget WHERE id=?').bind('project').first():null;return json({...analyze(new URL(request.url).searchParams.get('date')??'2026-10-14'),connected:Boolean(env.DEEPSEEK_API_KEY),budget:{limit:LIMIT_MICRO,...(ledger??{spent:baseline,reserved:0})}});}catch{return json({error:'No se pudo consultar el estado. Verifica fecha y migraciones.'},503);}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'Origen o formato no autorizado.'},403);
 if(!request.headers.get('oai-authenticated-user-id'))return json({error:'Inicia sesión con ChatGPT para utilizar la API.'},401);
 if(!env.DB)return json({error:'Base de control de presupuesto no disponible.'},503);
 if(Number(request.headers.get('content-length')??0)>3000)return json({error:'Solicitud demasiado grande.'},413);
 try{const raw=await request.text();if(raw.length>3000)return json({error:'Solicitud demasiado grande.'},413);const input=JSON.parse(raw),db=env.DB;
 const baseline=Number(env.BUDGET_BASELINE_MICRO??0);
 if(!Number.isSafeInteger(baseline)||baseline<0||baseline>LIMIT_MICRO)return json({error:'Configuración de presupuesto inválida.'},503);
 await db.prepare('INSERT OR IGNORE INTO faro_budget(id,spent,reserved) VALUES(?,?,0)').bind('project',baseline).run();
 const reserve=async(id:string)=>{const r=await db.prepare('UPDATE faro_budget SET reserved=reserved+? WHERE id=? AND spent+reserved+?<=?').bind(RESERVE_MICRO,'project',RESERVE_MICRO,LIMIT_MICRO).run();if(r.meta.changes!==1)return false;await db.prepare('INSERT INTO faro_runs(id,created,status,charge) VALUES(?,?,?,?)').bind(id,new Date().toISOString(),'reserved',RESERVE_MICRO).run();return true;};
 const settle=async(id:string,charge:number)=>{await db.batch([db.prepare('UPDATE faro_budget SET reserved=reserved-?,spent=spent+? WHERE id=?').bind(RESERVE_MICRO,charge,'project'),db.prepare('UPDATE faro_runs SET status=?,charge=? WHERE id=?').bind('settled',charge,id)]);};
 return json(await runAgent({prompt:input.prompt,asOf:input.asOf,key:env.DEEPSEEK_API_KEY,reserve,settle}));
 }catch(error){if(!(error instanceof FaroError))console.warn('faro_failure',{type:error instanceof Error?error.name:'Unknown',detail:error instanceof Error?error.message.replaceAll(env.DEEPSEEK_API_KEY??'__unset__','[redacted]').slice(0,160):''});return json({error:error instanceof FaroError?error.message:'No se completó la ejecución. No se reintentó ni se modificó inventario.'},error instanceof FaroError?error.status:400);}
}
