const fs=require('fs'),p=require('path'),crypto=require('crypto');
const ROOT=__dirname,SRC=process.env.MTA_SOURCE||'G:/マイドライブ/マダミス-6/ChatGPT共有/神経衰弱_CURRENT';
const title='M.T.A. — MurdeR Trick Algorithm —';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>['.git','.wrangler','node_modules'].includes(e.name)?[]:e.isDirectory()?files(p.join(d,e.name)):[p.join(d,e.name)]);
const rel=f=>p.relative(ROOT,f).replaceAll('\\','/');
const write=(r,s)=>{fs.mkdirSync(p.dirname(p.join(ROOT,r)),{recursive:true});fs.writeFileSync(p.join(ROOT,r),s);};
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const original=Object.fromEntries(files(SRC).map(f=>[f,hash(f)]));
const local=/file:\/\/\/[^\s<>"'`]+|(?<![a-z:])[A-Z]:[\\/][^\s<>"'`]+|https?:\/\/localhost[^\s<>"'`]*|localhost(?::\d+)?/gi;
function clean(s){return s.replace(local,v=>{const normalized=v.replaceAll('\\','/');const ix=normalized.indexOf('/神経衰弱_CURRENT/');if(ix>=0)return './'+normalized.slice(ix+ '/神経衰弱_CURRENT/'.length);return '［旧ローカル保存先：Web版では総合INDEXを参照］';});}
const css='body{max-width:1120px;margin:auto;padding:24px;font:16px/1.75 system-ui,Meiryo,sans-serif;background:#f5f3ed;color:#172c38}a{color:#155773;overflow-wrap:anywhere}h1{line-height:1.25}h2{margin-top:2em;border-bottom:2px solid #acbfc8}li{margin:8px 0}.priority,.warning{padding:18px;background:#fff2cd;border-left:5px solid #b27128}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.box{padding:18px;background:white;border:1px solid #cbd5d8;border-radius:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}img{max-width:100%;height:auto}nav{margin-bottom:16px}@media(max-width:600px){body{padding:14px}.grid{grid-template-columns:1fr}h1{font-size:26px}}';
write('assets/web.css',css);
function page(name,body,r){const home=p.posix.relative(p.posix.dirname(r),'index.html')||'index.html',style=p.posix.relative(p.posix.dirname(r),'assets/web.css');return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+esc(name)+' | '+title+'</title><link rel="stylesheet" href="'+style+'"></head><body><nav><a href="'+home+'">M.T.A. 総合INDEX</a></nav><h1>'+esc(name)+'</h1>'+body+'</body></html>';}
const copied=[],excluded=[];
for(const f of files(SRC)){
 const r=p.relative(SRC,f).replaceAll('\\','/');
 if(!/\.(html|css|js|png|jpg|jpeg|svg|webp|json|md|txt)$/i.test(r)||p.basename(r)==='MANIFEST.txt'){excluded.push(r);continue;}
 let b=fs.readFileSync(f);
 if(/\.(html|css|js|json|md|txt|svg)$/i.test(r)){
  let s=clean(b.toString('utf8'));
  if(r.endsWith('.html')){
   s=s.replace(/((?:href|src)=["'])([^"']+)(["'])/gi,(all,a,url,c)=>{
    if(/^(https?:|data:|#|mailto:)/.test(url))return all;
    let u=decodeURIComponent(url);if(/\.(md|txt)(?:#.*)?$/.test(u))u=u.replace(/\.(md|txt)(?=#|$)/,'.html');return a+encodeURI(u)+c;
   });
   s=s.replace(/<title>(.*?)<\/title>/s,(_,t)=>'<title>'+title+' | '+t.replace(/神経衰弱/g,'M.T.A.')+'</title>');
   const nav='<nav class="web-home"><a href="'+p.posix.relative(p.posix.dirname(r),'index.html')+'">M.T.A. 総合INDEXへ</a></nav>';
   if(/<body[^>]*>/i.test(s))s=s.replace(/<body[^>]*>/i,m=>m+nav);else s+=nav;
   s+='<style>html{overflow-x:hidden}body{box-sizing:border-box}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{overflow-wrap:anywhere}.web-home{padding:10px;background:#e4edf0}.web-table{overflow:auto;max-width:100%}@media(max-width:600px){body{padding:12px!important;margin:auto!important}.grid{grid-template-columns:1fr!important}}</style>';
   s=s.replace(/<table\b[\s\S]*?<\/table>/gi,m=>'<div class="web-table">'+m+'</div>');
   if(!/name=["']viewport/.test(s))s='<meta name="viewport" content="width=device-width,initial-scale=1">'+s;
  }
  if(r==='00_CHATGPT_HANDOFF.md')s='# Web確認版の現在の入口\n\nhttps://noraelf-creator.github.io/mta-review/\n\nシナリオはVer.4.1.1、盤面はPNG画像修正版。Web版は元CURRENTの専用コピーであり、正本を変更しない。\n\n'+s;
  if(r==='01_CHANGELOG.md')s='## 2026-09-28 Web確認版\n\n専用コピーを静的HTMLサイト化。全資料の総合INDEX・文書HTML・相対リンク・スマホ用表スクロールを追加。元シナリオは未変更。公開先と実アクセス検査はPUBLIC_URL.txt、HTTP_VALIDATION.json参照。\n\n'+s;
  b=Buffer.from(s);
 }
 write(r,b);copied.push(r);
 if(/\.(md|txt)$/.test(r)){const h=r.replace(/\.(md|txt)$/,'.html');write(h,page(p.basename(r),'<pre>'+esc(b.toString('utf8'))+'</pre>',h));copied.push(h);}
}
const groups={'シナリオ・真相・時間':[],'人物・HO':[],'調査カード・追加情報':[],'読み合わせ台本':[],'地図':[],'テスト・検証':[],'最新版盤面':[],'SOURCE / 開発資料':[]};
for(const r of copied){if(!/\.html$/.test(r)&&!r.startsWith('source/'))continue;let g=r.startsWith('board/')?'最新版盤面':r.startsWith('source/')?'SOURCE / 開発資料':/testplay|検証レポート|人間テスト/.test(r)?'テスト・検証':/maps\//.test(r)?'地図':/scripts\/|台本/.test(r)?'読み合わせ台本':/HO-|characters\/|人物一覧|人間関係|PC目標/.test(r)?'人物・HO':/cards\/|カード|メモ|数字札/.test(r)?'調査カード・追加情報':'シナリオ・真相・時間';groups[g].push(r);}
const link=(r,label)=>'<a href="'+encodeURI(r)+'">'+esc(label||p.basename(r).replace(/\.html$/,''))+'</a>';
write('index.html',page('M.T.A.','<p>— MurdeR Trick Algorithm —</p><div class="warning"><strong>作者確認用／重大なネタバレを含みます</strong><br>全HO・犯人・事件真相を公開しています。閲覧制限はありません。</div><h2>最優先確認</h2><div class="priority">'+link('board/MTA_画像修正版/review/index.html','最新テスプ盤面（画像修正版）')+'<ul>'+['00_CHATGPT_HANDOFF.html','01_CHANGELOG.html','00_LOCKED_SPEC_疑似テスト前正本.html','review/36_人間テストで確認する項目.html'].map(r=>'<li>'+link(r)+'</li>').join('')+'</ul></div><p>既存資料の内容を維持したWeb確認版です。旧題の表記はシナリオ資料内に残ります。資料名で探す場合はブラウザのページ内検索を利用できます。</p>'+Object.entries(groups).map(([g,rs])=>'<section><h2>'+g+'</h2><ul>'+rs.map(r=>'<li>'+link(r)+'</li>').join('')+'</ul></section>').join('')+'<h2>サイト運用</h2><p>'+link('README.html','公開範囲・更新方法')+' ／ '+link('WEB_VALIDATION.html','Web検証結果')+' ／ '+link('AI_HANDOFF.html','Web引き継ぎ')+'</p>','index.html'));
write('.nojekyll','');
write('README.md','# '+title+'\n\n作者確認用。全HO、犯人、真相を含む公開サイトです。URLを共有すると全真相を閲覧できます。noindexはアクセス制限ではありません。\n\n元CURRENTを読み取り、専用コピーのみWeb化しています。シナリオ本文は改稿しません。過去ZIP、バックアップ、実行用ショートカット、キャッシュは掲載しません。\n\n更新：このフォルダで update_mta_review.ps1 を実行。既定は生成・検査のみ。-Publish を付けると検査成功後にcommit/pushします。公開先はmainブランチのルート。\n\nGitHub Pages設定：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site\n');
write('CHANGELOG.md','# Web変更履歴\n\n'+new Date().toISOString()+'：CURRENTから資料・画像をコピー。総合INDEX、文書HTML、相対参照、スマホ用表スクロール、リンク・秘密情報検査を生成。元データは未変更。公開状況はPUBLIC_URL.txtを参照。\n');
write('AI_HANDOFF.md','# Web引き継ぎ\n\n公開予定URL：https://noraelf-creator.github.io/mta-review/\nリポジトリ：https://github.com/noraelf-creator/mta-review\nローカルWeb元：環境設定MTA_SOURCEと本スクリプトの保存フォルダを参照。\n元データ：ChatGPT共有の神経衰弱_CURRENT。読取専用。\n更新方法：update_mta_review.ps1。公開する場合 -Publish。\n掲載範囲：全HTML資料・地図・最新画像修正版・JSON・HANDOFF等の文書。\n非掲載：ZIP・ショートカット・バックアップ・MANIFEST。\n最終更新：'+new Date().toISOString()+'\nリンク検査：WEB_VALIDATION.md参照。実公開の確認結果：HTTP_VALIDATION.json参照（未作成なら未検証）。\n');
if(fs.existsSync(p.join(ROOT,'PUBLIC_URL.txt'))){const f=p.join(ROOT,'AI_HANDOFF.md');write('AI_HANDOFF.md',fs.readFileSync(f,'utf8').replace('公開予定URL：','公開URL：')+'\nローカルWeb元：'+ROOT+'\n元シナリオCURRENT：'+SRC+'\n');}
for(const r of ['README.md','CHANGELOG.md','AI_HANDOFF.md']){const h=r.replace('.md','.html');write(h,page(r,'<pre>'+esc(clean(fs.readFileSync(p.join(ROOT,r),'utf8')))+'</pre>',h));}
// Reserve the validation page before crawling every internal reference.
write('WEB_VALIDATION.html',page('Web検証','<p>検査中</p>','WEB_VALIDATION.html'));
delete require.cache[require.resolve('./apply_author_ui.cjs')];require('./apply_author_ui.cjs');
const report={updated:new Date().toISOString(),html:0,images:0,internalReferences:0,broken:[],localPaths:[],secretFindings:[],imageMissing:0,http404:'公開後検査待ち',sourceUnchanged:true,excluded};
for(const f of files(ROOT)){
 const r=rel(f);if(/\.(png|svg|jpg|webp)$/i.test(r))report.images++;
 if(/\.(html|json|md|txt|svg|css)$/i.test(r)){
  const s=fs.readFileSync(f,'utf8').replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g,'[image]');
  if(/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16}|-----BEGIN .*PRIVATE KEY-----|(?:password|api[_-]?key|access[_-]?token|cookie)\s*[=:]\s*["'][^"']{8,}["'])/i.test(s))report.secretFindings.push(r);
 }
 if(!r.endsWith('.html'))continue;report.html++;
 const s=fs.readFileSync(f,'utf8');if(local.test(s))report.localPaths.push(r);local.lastIndex=0;
 for(const m of s.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
  let u=m[1].replaceAll('&amp;','&');if(/^(https?:|data:|mailto:)/.test(u))continue;
  report.internalReferences++;u=decodeURIComponent(u.split('#')[0].split('?')[0]);const target=p.resolve(p.dirname(f),u||p.basename(f));
  if(!target.startsWith(ROOT+p.sep)||!fs.existsSync(target)){report.broken.push({file:r,url:m[1]});if(m[0].startsWith('src'))report.imageMissing++;}
 }
}
report.sourceUnchanged=Object.entries(original).every(([f,h])=>hash(f)===h);
if(fs.existsSync(p.join(ROOT,'HTTP_VALIDATION.json'))){const h=JSON.parse(fs.readFileSync(p.join(ROOT,'HTTP_VALIDATION.json')));report.http404=h.http404;report.httpCheckedAt=h.checkedAt;report.httpChecked=h.total;}
write('WEB_VALIDATION.json',JSON.stringify(report,null,2));
const summary='# Web検証\n\n'+report.updated+'\n\nHTML数：'+report.html+'\n画像数：'+report.images+'\n内部参照数：'+report.internalReferences+'\nリンク切れ：'+report.broken.length+'\nローカル絶対パス：'+report.localPaths.length+'\n画像欠落：'+report.imageMissing+'\n認証情報パターン検出：'+report.secretFindings.length+'\n元CURRENTのハッシュ一致：'+report.sourceUnchanged+'\nHTTP 404：公開後検査はHTTP_VALIDATION.json参照。\n全HTMLのhref/srcをURLデコードして検査。公開前の検査で実サイト表示の保証はしない。\n';
const finalSummary=summary+'\n公開HTTP検査：'+(report.httpChecked||0)+'件\n公開HTTP 404件数：'+report.http404+'\nfile参照：'+report.localPaths.length+'件\nCドライブ参照：'+report.localPaths.length+'件\nGドライブ参照：'+report.localPaths.length+'件\n';
write('WEB_VALIDATION.md',finalSummary);write('WEB_VALIDATION.html',page('Web検証','<pre>'+esc(finalSummary)+'</pre>','WEB_VALIDATION.html'));
console.log(JSON.stringify(report,null,2));
delete require.cache[require.resolve('./apply_author_ui.cjs')];require('./apply_author_ui.cjs');
if(report.broken.length||report.localPaths.length||report.secretFindings.length||!report.sourceUnchanged)process.exitCode=1;
