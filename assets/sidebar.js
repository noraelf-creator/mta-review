(() => {
 const base=new URL('../',document.currentScript.src);window.MTA_BASE=base;
 let pathname;try{pathname=decodeURIComponent(location.pathname)}catch{pathname=location.pathname}
 const basepath=decodeURIComponent(base.pathname);let id=pathname.startsWith(basepath)?pathname.slice(basepath.length):pathname.replace(/^\//,'');
 window.MTA_PAGE_ID=(id||'index.html').replace(/\.html$/,'').normalize('NFC');
 const main=document.createElement('main');main.className='mta-main';
 [...document.body.childNodes].forEach(n=>main.append(n));document.body.append(main);document.body.classList.add('mta-shell');
 main.querySelectorAll('nav.web-home,nav.nav').forEach(n=>n.remove());
 const side=document.createElement('aside');side.className='mta-side';side.id='mta-navigation';side.setAttribute('aria-label','資料ナビゲーション');
 const brand=document.createElement('div');brand.className='mta-brand';brand.textContent='M.T.A.';side.append(brand);
 const subtitle=document.createElement('span');subtitle.className='mta-subtitle';subtitle.textContent='— MurdeR Trick Algorithm —';side.append(subtitle);
 const menu=document.createElement('button');menu.className='mta-menu';menu.type='button';menu.textContent='☰';menu.setAttribute('aria-label','資料メニュー');menu.setAttribute('aria-controls',side.id);menu.setAttribute('aria-expanded','false');
 function setOpen(open){side.classList.toggle('mta-open',open);menu.setAttribute('aria-expanded',String(open));side.inert=matchMedia('(max-width:760px)').matches&&!open;}
 menu.addEventListener('click',()=>setOpen(!side.classList.contains('mta-open')));document.addEventListener('keydown',e=>{if(e.key==='Escape'){setOpen(false);menu.focus()}});matchMedia('(max-width:760px)').addEventListener('change',()=>setOpen(false));
 document.body.prepend(menu,side);setOpen(false);
 fetch(new URL('assets/navigation.json',base)).then(r=>{if(!r.ok)throw Error();return r.json()}).then(groups=>{
  for(const group of groups){const h=document.createElement('h2');h.textContent=group.name;side.append(h);for(const item of group.items){const a=document.createElement('a');a.href=new URL(item.path,base);a.textContent=item.label;if(item.path.replace(/\.html$/,'').normalize('NFC')===window.MTA_PAGE_ID)a.setAttribute('aria-current','page');side.append(a);}}
  const logout=document.createElement('button');logout.type='button';logout.textContent='編集認証を解除';logout.addEventListener('click',()=>window.dispatchEvent(new Event('mta-logout')));side.append(logout);
 }).catch(()=>{const a=document.createElement('a');a.href=base;a.textContent='総合INDEX';side.append(a)});
})();
