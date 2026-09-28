const fs=require('fs'),p=require('path');const root=__dirname;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>['.git','node_modules','.wrangler'].includes(e.name)?[]:e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const all=walk(root).filter(f=>f.endsWith('.html')).map(f=>p.relative(root,f).replaceAll('\\','/'));
const groupNames=['TOP','現在確認','HO','事件','タイムライン','調査カード C01〜C10','調査カード C11〜C20','調査カード C21〜C30','調査カード C31〜C40','調査運用・追加資料','人物','台本','地図','テスト','盤面','その他資料'];
const groups=groupNames.map(name=>({name,items:[]}));
function add(g,path,label){if(!fs.existsSync(p.join(root,path)))throw Error(path);groups.find(x=>x.name===g).items.push({path,label});}
add('TOP','index.html','総合INDEX');add('現在確認','board/MTA_画像修正版/review/index.html','最新盤面');
for(const [r,l] of [['00_CHATGPT_HANDOFF.html','HANDOFF'],['01_CHANGELOG.html','CHANGELOG'],['00_LOCKED_SPEC_疑似テスト前正本.html','LOCKED SPEC']])add('現在確認',r,l);
for(const r of all){if(groups.some(g=>g.items.some(x=>x.path===r)))continue;
 const html=fs.readFileSync(p.join(root,r),'utf8');let label=(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||p.basename(r)).replace(/<[^>]*>/g,' ').replace(/\.html$/,'').trim();let g;
 const card=r.match(/cards\/C(\d+)\.html$/);
 if(card)g=groupNames[5+Math.floor((Number(card[1])-1)/10)];else if(/HO-[AB]/.test(r))g='HO';else if(/事件真相|崩落事故真相|犯人参照|推理導線/.test(r))g='事件';else if(/TL|進行表/.test(r))g='タイムライン';else if(/メモ|カード|数字札/.test(r))g='調査運用・追加資料';else if(/characters|人物|PC目標|人間関係|トランプ/.test(r))g='人物';else if(/scripts|台本/.test(r))g='台本';else if(/maps\//.test(r))g='地図';else if(/testplay|テスト|検証/.test(r))g='テスト';else if(r.startsWith('board/'))g='盤面';else g='その他資料';add(g,r,label);
 }
for(const g of groups)g.items.sort((a,b)=>a.path.localeCompare(b.path,'ja',{numeric:true}));
fs.writeFileSync(p.join(root,'assets/navigation.json'),JSON.stringify(groups.filter(g=>g.items.length),null,2));
fs.mkdirSync(p.join(root,'backend'),{recursive:true});fs.writeFileSync(p.join(root,'backend/pages.json'),JSON.stringify(all.map(r=>r.replace(/\.html$/,'').normalize('NFC'))));
const quick=[['board/MTA_画像修正版/review/index.html','最新盤面を開く'],['review/36_人間テストで確認する項目.html','人間テスト確認項目'],['00_CHATGPT_HANDOFF.html','HANDOFF'],['01_CHANGELOG.html','CHANGELOG']];
fs.writeFileSync(p.join(root,'index.html'),'<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M.T.A. — MurdeR Trick Algorithm —</title><link rel="stylesheet" href="assets/web.css"></head><body><h1>M.T.A.</h1><p>— MurdeR Trick Algorithm —</p><div class="mta-quick">'+quick.map(([r,l])=>'<a href="'+encodeURI(r)+'">'+l+'</a>').join('')+'</div><h2>資料一覧</h2><div class="mta-categories">'+groups.filter(g=>!['TOP','現在確認'].includes(g.name)).map(g=>'<section><h2>'+g.name+'</h2>'+g.items.map(i=>'<a href="'+encodeURI(i.path)+'">'+esc(i.label)+'</a>').join('')+'</section>').join('')+'</div></body></html>');
for(const r of all){const f=p.join(root,r);let s=fs.readFileSync(f,'utf8').replace(/<!-- MTA_AUTHOR_UI -->[\s\S]*?<!-- END_MTA_AUTHOR_UI -->/g,'');const asset=p.posix.relative(p.posix.dirname(r),'assets');const tag='<!-- MTA_AUTHOR_UI --><link rel="stylesheet" href="'+asset+'/author.css"><script defer src="'+asset+'/sidebar.js"></script><script defer src="'+asset+'/notes.js"></script><!-- END_MTA_AUTHOR_UI -->';s=s.includes('</head>')?s.replace('</head>',tag+'</head>'):s+tag;fs.writeFileSync(f,s);}
module.exports={pages:all.length,groups};
if(require.main===module)console.log('Author UI: '+all.length+' pages');
