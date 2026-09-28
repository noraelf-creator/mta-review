import pages from './pages.json' with {type:'json'};
const validPages=new Set(pages);
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
function equal(a,b){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
async function jsonBody(req){if(!req.headers.get('content-type')?.startsWith('application/json'))throw {status:415};const reader=req.body?.getReader();if(!reader)throw {status:400};let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>48000){await reader.cancel();throw {status:413}}chunks.push(value)}const bytes=new Uint8Array(size);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length}try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw {status:400}}}
async function limit(env,key,max){const now=Date.now(),bucket=await hash(key)+':'+Math.floor(now/60000);const row=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,until_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+120000).first();if(row.count>max)throw {status:429};}
async function session(req,env){const bearer=req.headers.get('authorization')||'';if(!/^Bearer [a-f0-9]{64}$/.test(bearer))throw {status:401};const h=await hash(bearer.slice(7)),row=await env.DB.prepare('SELECT * FROM sessions WHERE hash=?').bind(h).first();if(!row||row.expires_at<Date.now()||row.version!==await hash(env.AUTHOR_EDIT_KEY))throw {status:401};return h;}
export default {async fetch(req,env,ctx){
 const origin=req.headers.get('origin'),allowed=env.ALLOWED_ORIGIN||'https://noraelf-creator.github.io';
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin===allowed){headers['Access-Control-Allow-Origin']=allowed;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, Authorization';}
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==='OPTIONS')return origin===allowed?new Response(null,{status:204,headers}):reply({error:'forbidden'},403);
 if(origin&&origin!==allowed||req.method==='POST'&&origin!==allowed)return reply({error:'forbidden'},403);
 try{
  if(!env.DB||!env.AUTHOR_EDIT_KEY||env.AUTHOR_EDIT_KEY.length<24)return reply({error:'not_configured'},503);
  const url=new URL(req.url);
  if(url.pathname==='/auth'&&req.method==='POST'){
   await limit(env,'auth:'+req.headers.get('CF-Connecting-IP'),5);const body=await jsonBody(req);if(typeof body.key!=='string'||body.key.length>512||!equal(await hash(body.key),await hash(env.AUTHOR_EDIT_KEY)))throw {status:401};
   const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''),expiresAt=Date.now()+365*86400000;
   await env.DB.prepare('INSERT INTO sessions(hash,version,created_at,expires_at) VALUES(?,?,?,?)').bind(await hash(token),await hash(env.AUTHOR_EDIT_KEY),Date.now(),expiresAt).run();
   ctx?.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE until_at < ?').bind(Date.now()).run());return reply({token,expiresAt});
  }
  if(url.pathname==='/logout'&&req.method==='POST'){const h=await session(req,env);await env.DB.prepare('DELETE FROM sessions WHERE hash=?').bind(h).run();return reply({ok:true});}
  if(url.pathname==='/notes'&&req.method==='GET'){
   const page=url.searchParams.get('page'),before=url.searchParams.get('before');if(!validPages.has(page)||before&&!/^\d{1,16}$/.test(before))throw {status:400};
   const {results}=await env.DB.prepare('SELECT seq,id,text,created_at AS createdAt FROM notes WHERE page_id=? AND seq<? ORDER BY seq DESC LIMIT 100').bind(page,before?Number(before):Number.MAX_SAFE_INTEGER).all();
   return reply({notes:results.map(({seq,...n})=>n),nextCursor:results.length===100?String(results.at(-1).seq):null});
  }
  if(url.pathname==='/notes'&&req.method==='POST'){
   const h=await session(req,env);await limit(env,'write:'+h,60);const b=await jsonBody(req);
   if(!validPages.has(b.pageId)||typeof b.text!=='string'||!b.text.trim()||b.text.length>10000||typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(b.requestId))throw {status:400};
   await env.DB.prepare('INSERT INTO notes(id,page_id,text,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(b.requestId,b.pageId,b.text.trim(),new Date().toISOString()).run();
   const n=await env.DB.prepare('SELECT id,page_id,text,created_at AS createdAt FROM notes WHERE id=?').bind(b.requestId).first();if(n.page_id!==b.pageId||n.text!==b.text.trim())throw {status:409};const {page_id,...note}=n;return reply(note,201);
  }
  return reply({error:'not_found'},404);
 }catch(e){return reply({error:({400:'invalid_input',401:'unauthorized',409:'request_conflict',413:'too_large',415:'json_required',429:'rate_limited'})[e.status]||'server_error'},e.status||500);}
}};
