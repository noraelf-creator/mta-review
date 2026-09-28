// The key is generated outside the repository and sent via stdin, never printed.
const fs=require('fs'),p=require('path'),os=require('os'),cp=require('child_process'),crypto=require('crypto');
const dir=p.join(os.homedir(),'.codex','private','mta-author-notes'),file=p.join(dir,'AUTHOR_EDIT_KEY.txt');
fs.mkdirSync(dir,{recursive:true});
if(!fs.existsSync(file))fs.writeFileSync(file,crypto.randomBytes(32).toString('base64url'),{mode:0o600,flag:'wx'});
const secret=fs.readFileSync(file,'utf8').trim();
const r=cp.spawnSync('npx.cmd',['--yes','wrangler','secret','put','AUTHOR_EDIT_KEY','--config',p.join(__dirname,'wrangler.jsonc')],{shell:true,input:secret,encoding:'utf8'});
process.stdout.write((r.stdout||'').replaceAll(secret,'[redacted]'));process.stderr.write((r.stderr||'').replaceAll(secret,'[redacted]'));
if(r.status)process.exit(r.status);console.log('Private key location: '+file);
