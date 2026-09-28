(() => {
 const base=window.MTA_BASE,pageId=window.MTA_PAGE_ID;if(!base||!pageId)return;
 const section=document.createElement('section');section.className='mta-notes';section.id='author-notes';
 section.innerHTML='<h2></h2><form><label for="mta-note-input">メモ</label><textarea id="mta-note-input" maxlength="10000"></textarea><button type="submit">追記する</button><div class="mta-auth" hidden><label for="mta-edit-key">作者用編集キー</label><input id="mta-edit-key" type="password" autocomplete="off"><button type="button" class="mta-auth-submit">認証して追記</button> <button type="button" class="mta-auth-cancel">キャンセル</button></div></form><p class="mta-status" role="status" aria-live="polite"></p><div class="mta-note-list"></div><button class="mta-more" type="button" hidden>以前のメモを表示</button>';
 section.querySelector('h2').textContent=pageId==='index'?'全体メモ':'作者メモ';document.querySelector('.mta-main').append(section);
 const form=section.querySelector('form'),input=section.querySelector('textarea'),status=section.querySelector('.mta-status'),auth=section.querySelector('.mta-auth'),keyInput=section.querySelector('input'),list=section.querySelector('.mta-note-list'),more=section.querySelector('.mta-more');
 let api='',token='',busy=false,requestId=null,requestText=null,cursor=null;const storageKey='mta-author-session-v1';
 try{token=localStorage.getItem(storageKey)||''}catch{}
 function message(s){status.textContent=s}
 function loading(value){busy=value;form.querySelectorAll('button').forEach(b=>b.disabled=value)}
 function remember(value){token=value;try{value?localStorage.setItem(storageKey,value):localStorage.removeItem(storageKey)}catch{message('このブラウザでは認証を記憶できません。')}}
 async function call(route,body,authorized=false){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(api+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(authorized?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store'});const data=await r.json();if(!r.ok){const e=Error(data.error||'failed');e.status=r.status;throw e}return data}finally{clearTimeout(timer)}}
 function noteElement(n){const article=document.createElement('article');article.className='mta-note';article.dataset.id=n.id;const time=document.createElement('time');time.dateTime=n.createdAt;time.textContent=new Date(n.createdAt).toLocaleString('ja-JP');const p=document.createElement('p');p.textContent=n.text;article.append(time,p);return article;}
 async function read(append=false){try{const data=await call('/notes?page='+encodeURIComponent(pageId)+(append&&cursor?'&before='+encodeURIComponent(cursor):''));if(!append)list.replaceChildren();for(const n of data.notes)if(![...list.children].some(e=>e.dataset.id===n.id))list.append(noteElement(n));cursor=data.nextCursor;more.hidden=!cursor;if(!list.children.length)message('まだメモはありません。')}catch{message('メモを読み込めませんでした。')}}
 async function save(){if(busy)return;if(!input.value.trim()){message('メモを入力してください。');return}if(!api){message('メモ保存先は未接続です。入力内容は残しています。');return}if(!token){auth.hidden=false;keyInput.focus();return}
  const text=input.value.trim();if(text!==requestText){requestText=text;requestId=crypto.randomUUID()}loading(true);
  try{const n=await call('/notes',{pageId,text,requestId},true);if(![...list.children].some(e=>e.dataset.id===n.id))list.prepend(noteElement(n));if(input.value.trim()===text)input.value='';requestId=requestText=null;auth.hidden=true;keyInput.value='';message('追記しました。')}
  catch(e){if(e.status===401){remember('');auth.hidden=false;keyInput.focus();message('編集キーを入力してください。')}else message('保存に失敗しました。入力内容は残しています。')}
  finally{loading(false)}
 }
 form.addEventListener('submit',e=>{e.preventDefault();save()});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();save()}});
 section.querySelector('.mta-auth-submit').addEventListener('click',async()=>{if(busy)return;loading(true);try{const key=keyInput.value;keyInput.value='';const result=await call('/auth',{key});remember(result.token);auth.hidden=true;loading(false);await save()}catch(e){message(e.status===401?'編集キーが違います。':e.status===429?'少し時間をおいて再試行してください。':'認証に失敗しました。')}finally{loading(false)}});
 section.querySelector('.mta-auth-cancel').addEventListener('click',()=>{keyInput.value='';auth.hidden=true;input.focus()});
 keyInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();section.querySelector('.mta-auth-submit').click()}});
 more.addEventListener('click',()=>read(true));
 window.addEventListener('mta-logout',async()=>{try{if(api&&token)await call('/logout',{},true);remember('');message('編集認証を解除しました。')}catch{message('認証の解除に失敗しました。再試行してください。')}});
 fetch(new URL('assets/notes-config.json',base),{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.apiBase&&/^https:\/\//.test(c.apiBase)){api=c.apiBase.replace(/\/$/,'');read()}else message('メモ保存先は未接続です。')}).catch(()=>message('メモ保存先を確認できません。'));
})();
