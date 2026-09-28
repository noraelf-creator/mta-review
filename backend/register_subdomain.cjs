const cp=require('child_process');
(async()=>{const r=cp.spawnSync('npx.cmd',['--yes','wrangler','auth','token','--json'],{shell:true,encoding:'utf8'});if(r.status)throw Error('Authentication unavailable');const creds=JSON.parse(r.stdout);const token=creds.token;if(!token)throw Error('Unexpected credential shape: '+Object.keys(creds).join(','));
const url='https://api.cloudflare.com/client/v4/accounts/a80345975fefb158b248ccec2225245b/workers/subdomain';const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
const existing=await (await fetch(url,{headers})).json();if(existing.success&&existing.result?.subdomain){console.log('Existing subdomain: '+existing.result.subdomain);return;}
const response=await fetch(url,{method:'PUT',headers,body:JSON.stringify({subdomain:'noraelf-mta-review'})});const result=await response.json();if(!result.success)throw Error(JSON.stringify(result.errors));console.log('Registered: '+result.result.subdomain);
})().catch(e=>{console.error(e.message);process.exitCode=1});
