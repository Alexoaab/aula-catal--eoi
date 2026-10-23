/* Catalan-only, on-device spelling for Aula. No external spelling service. */
(()=>{
 'use strict';
 const base=new URL('.',document.currentScript.src),fields=new Map();
 let worker,failed=false,ready=false,nextId=0,enabled=true;
 try{enabled=localStorage.getItem('aula-catalan-spell')!=='off'}catch{}
 const tokens=value=>Array.from(value.matchAll(/[\p{L}\p{M}]+(?:[·'’‘-][\p{L}\p{M}]+)*/gu),m=>({word:m[0],start:m.index,end:m.index+m[0].length}));
 function start(){
  if(worker||failed)return;
  try{
   worker=new Worker(new URL('worker.js',base));
   worker.onmessage=({data})=>{
    if(data.type==='ready'){ready=true;for(const f of fields.values())if(f.el.isConnected)queue(f,0);return}
    if(data.type==='error'){fail();return}
    const f=fields.get(data.id);
    if(!f||!f.el.isConnected||!enabled||data.revision!==f.revision)return;
    paint(f,new Set(data.errors));
   };
   worker.onerror=fail;
  }catch{fail()}
 }
 function fail(){failed=true;worker?.terminate();worker=null;for(const f of fields.values()){f.layer.replaceChildren();f.status.textContent='Corrector català no disponible. Recarrega la pàgina per tornar-ho a provar.'}}
 function geometry(f){
  const s=getComputedStyle(f.el);
  for(const p of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','wordSpacing','textAlign','textIndent','textTransform','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderRadius','boxSizing','tabSize'])f.layer.style[p]=s[p];
  f.layer.style.width=f.el.offsetWidth+'px';f.layer.style.height=f.el.offsetHeight+'px';
  f.layer.style.whiteSpace=f.el.tagName==='INPUT'?'pre':'pre-wrap';
  f.layer.style.overflowWrap=f.el.tagName==='INPUT'?'normal':'break-word';
  f.layer.scrollTop=f.el.scrollTop;f.layer.scrollLeft=f.el.scrollLeft;
 }
 function paint(f,errors){
  f.layer.replaceChildren();let last=0;const frag=document.createDocumentFragment();
  for(const t of tokens(f.el.value)){
   if(!errors.has(t.word))continue;
   frag.append(document.createTextNode(f.el.value.slice(last,t.start)));
   const mark=document.createElement('mark');mark.textContent=t.word;frag.append(mark);last=t.end;
  }
  frag.append(document.createTextNode(f.el.value.slice(last)+'\n'));f.layer.append(frag);geometry(f);
  const words=[...errors];f.status.textContent=words.length?'Revisa: '+words.slice(0,12).join(', ')+(words.length>12?'…':''):'Corrector català · Cap paraula desconeguda.';
 }
 function queue(f,delay=450){
  clearTimeout(f.timer);f.revision++;f.layer.replaceChildren();
  if(!enabled){f.status.textContent='Corrector català pausat.';return}
  if(failed){f.status.textContent='Corrector català no disponible. Recarrega la pàgina per tornar-ho a provar.';return}
  if(!f.el.value.trim()){f.status.textContent='Corrector català · Revisió ortogràfica local.';return}
  f.status.textContent=ready?'Revisant l’ortografia…':'Carregant el diccionari català…';
  f.timer=setTimeout(()=>{
   if(!f.el.isConnected||f.composing)return;
   start();if(!worker)return;
   worker.postMessage({type:'check',id:f.id,revision:f.revision,words:[...new Set(tokens(f.el.value).map(t=>t.word))]});
  },delay);
 }
 function attach(el){
  if(el.dataset.catalanSpell)return;
  el.dataset.catalanSpell='1';el.lang='ca';el.spellcheck=false;
  const wrap=document.createElement('span');wrap.className='ca-spell-wrap';
  const layer=document.createElement('span');layer.className='ca-spell-layer';layer.setAttribute('aria-hidden','true');
  const status=document.createElement('span');status.className='ca-spell-status';status.id='ca-spell-'+(++nextId);
  el.setAttribute('aria-describedby',((el.getAttribute('aria-describedby')||'')+' '+status.id).trim());
  el.before(wrap);wrap.append(layer,el);wrap.after(status);el.classList.add('ca-spell-input');
  if(el.tagName==='INPUT')wrap.classList.add('ca-spell-short');
  const f={el,layer,status,id:nextId,revision:0};fields.set(f.id,f);
  el.addEventListener('input',()=>{if(!f.composing)queue(f)});
  el.addEventListener('compositionstart',()=>{f.composing=true;f.revision++;clearTimeout(f.timer);layer.replaceChildren()});
  el.addEventListener('compositionend',()=>{f.composing=false;queue(f)});
  el.addEventListener('focus',()=>{if(enabled)start();geometry(f)});
  el.addEventListener('scroll',()=>geometry(f));
  if(window.ResizeObserver){f.observer=new ResizeObserver(()=>geometry(f));f.observer.observe(el)}
  queue(f);requestAnimationFrame(()=>geometry(f));
 }
 const bar=document.createElement('details');bar.className='ca-spell-settings';
 bar.innerHTML='<summary>Corrector català</summary><label><input type="checkbox"> Ressaltar possibles faltes mentre escric</label><p>Revisa les paraules en català només en aquesta pàgina. El text es comprova al teu navegador. Pots pausar-lo per escriure síl·labes o fragments. Els noms propis i algunes formes poden no constar al diccionari; no revisa la gramàtica.</p><a href="assets/spell/NOTICE.txt" target="_blank" rel="noopener">Diccionari i llicències</a>';
 document.querySelector('#content').before(bar);
 const toggle=bar.querySelector('input');toggle.checked=enabled;
 toggle.onchange=()=>{enabled=toggle.checked;try{localStorage.setItem('aula-catalan-spell',enabled?'on':'off')}catch{}for(const f of fields.values())if(f.el.isConnected)queue(f,0)};
 window.aulaCatalanSpell={attach,refresh(){for(const [id,f] of fields){if(!f.el.isConnected){clearTimeout(f.timer);f.observer?.disconnect();fields.delete(id)}}document.querySelectorAll('textarea, input[data-key]').forEach(attach)}};
 window.aulaCatalanSpell.refresh();
})();
