const fs=require('fs'),p=require('path'),os=require('os'),assert=require('assert/strict'),crypto=require('crypto'),cp=require('child_process');
const base='https://mta-author-notes.noraelf-mta-review.workers.dev',origin='https://noraelf-creator.github.io';
(async()=>{let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++},ids=[];
const key=fs.readFileSync(p.join(os.homedir(),'.codex/private/mta-author-notes/AUTHOR_EDIT_KEY.txt'),'utf8').trim();
async function call(route,body,token){const r=await fetch(base+route,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
eq((await call('/notes?page=index')).status,200);eq((await call('/notes',{pageId:'index',text:'no auth',requestId:crypto.randomUUID()})).status,401);
const a=await call('/auth',{key});eq(a.status,200);const token=a.data.token;
for(const pageId of ['review/10_PC1_HO-B','review/cards/C12']){
 const body={pageId,text:'[自動動作検証] ページ別追記 '+Date.now(),requestId:crypto.randomUUID()};ids.push(body.requestId);eq((await call('/notes',body,token)).status,201);eq((await call('/notes',body,token)).status,201);const rows=(await call('/notes?page='+encodeURIComponent(pageId))).data.notes;eq(rows.filter(n=>n.id===body.requestId).length,1);
}
const other=(await call('/notes?page=review/cards/C12')).data.notes;eq(other.some(n=>n.id===ids[0]),false);
const b=await call('/auth',{key});eq(b.status,200);eq((await call('/logout',{},b.data.token)).status,200);eq((await call('/notes',{pageId:'index',text:'after logout',requestId:crypto.randomUUID()},b.data.token)).status,401);
eq((await call('/logout',{},token)).status,200);
// Remove only the two records generated above; no existing notes are touched.
const statement='DELETE FROM notes WHERE id IN ('+ids.map(id=>"'"+id+"'").join(',')+')';
const result=cp.spawnSync('npx.cmd',['--yes','wrangler','d1','execute','mta-author-notes','--remote','--config','backend/wrangler.jsonc','--command',JSON.stringify(statement)],{shell:true,encoding:'utf8'});if(result.status)throw Error('Test record cleanup failed');
fs.writeFileSync(p.join(__dirname,'../NOTES_REMOTE_TEST.json'),JSON.stringify({at:new Date().toISOString(),checks,result:'PASS',backend:base,testRecordsRemoved:ids.length,secretPrinted:false},null,2));console.log(JSON.stringify({checks,result:'PASS',testRecordsRemoved:ids.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
