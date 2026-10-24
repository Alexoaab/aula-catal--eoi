/* Word lookup for published learning content only. Editable answers are excluded. */
(()=>{
 'use strict';
 const content=document.getElementById('content');if(!content)return;
 // Discard previous machine translations; never mix them with dictionary entries.
 try{localStorage.removeItem('aula-ca-es-words-v1')}catch{}
 let indexPromise;const shards=new Map(),formShards=new Map();
 async function loadJson(path){const r=await fetch(path);if(!r.ok)throw Error('dictionary');return r.json()}
 async function senses(word){
  word=word.normalize('NFC').toLocaleLowerCase('ca').replace(/[’‘]/g,"'").trim();
  if(!word)return [];
  if(!indexPromise)indexPromise=loadJson('assets/definitions/index.json?v=2').catch(e=>{indexPromise=null;throw e});
  const index=await indexPromise;let lemmas=Object.hasOwn(index,word)?index[word]:[];
  if(!lemmas.length){
   const key=word.codePointAt(0).toString(16);
   if(!formShards.has(key))formShards.set(key,fetch('assets/translate/forms/'+key+'.json?v=3').then(r=>r.status===404?{}:r.ok?r.json():Promise.reject(Error('forms'))).catch(e=>{formShards.delete(key);throw e}));
   const forms=await formShards.get(key);
   for(const lemma of Object.hasOwn(forms,word)?forms[word]:[])if(Object.hasOwn(index,lemma))lemmas.push(...index[lemma]);
   lemmas=[...new Set(lemmas)];
  }
  if(!lemmas.length&&/^(?:l|d|n|s|m|t)'/.test(word))return senses(word.slice(word.indexOf("'")+1));
  const found=[];
  for(const lemma of lemmas){
   const key=lemma.codePointAt(0).toString(16);
   if(!shards.has(key))shards.set(key,loadJson('assets/definitions/data/'+key+'.json?v=2').catch(e=>{shards.delete(key);throw e}));
   const data=await shards.get(key);if(Object.hasOwn(data,lemma))found.push(data[lemma]);
  }
  return found;
 }
 let enabled=true;try{enabled=localStorage.getItem('aula-ca-es-enabled')!=='off'}catch{}
 let timer,current,sequence=0;
 const tip=document.createElement('div');tip.id='ca-es-tooltip';tip.className='ca-es-tooltip';tip.hidden=true;tip.setAttribute('role','tooltip');
 const title=document.createElement('strong'),result=document.createElement('span'),source=document.createElement('small');
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Tancar el diccionari');close.onclick=hide;
 result.setAttribute('aria-live','polite');tip.append(close,title,result,source);document.body.append(tip);
 const settings=document.createElement('details');settings.className='ca-es-settings';settings.innerHTML='<summary>Diccionari d’accepcions</summary><label><input type="checkbox"> Mostrar les accepcions en passar el ratolí</label><p>Mantén el ratolí sobre una paraula o toca-la al mòbil. També pots seleccionar una paraula o locució i prémer Alt+T. Les accepcions es mostren en català, numerades i amb la categoria gramatical. Les formes flexionades remeten a l’entrada corresponent.</p><p>Definicions del Viccionari i un complement didàctic revisat, adaptats al format de l’aula, sota llicència CC BY-SA 4.0. La font apareix a cada entrada. No totes les paraules ni totes les accepcions possibles estan documentades.</p>';
 content.before(settings);const toggle=settings.querySelector('input');toggle.checked=enabled;toggle.onchange=()=>{enabled=toggle.checked;try{localStorage.setItem('aula-ca-es-enabled',enabled?'on':'off')}catch{}if(!enabled)hide()};
 function allowed(el){return el&&content.contains(el)&&!el.closest('input,textarea,select,button,a,label,[contenteditable],.answer-explanation,.ca-spell-status,.ca-spell-layer,.ca-spell-wrap,.actions,.exercise-index,.topic-grid')}
 function wordAt(x,y){
  let node,offset;
  if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(x,y);if(!p)return;node=p.offsetNode;offset=p.offset}
  else if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);if(!r)return;node=r.startContainer;offset=r.startOffset}
  if(!node||node.nodeType!==Node.TEXT_NODE||!allowed(node.parentElement))return;
  const block=node.parentElement.closest('p,li,td,th,h1,h2,h3,h4,h5,h6,figcaption')||node.parentElement;
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT),nodes=[];let all='',position=-1,n;
  while((n=walker.nextNode())){if(!allowed(n.parentElement))continue;if(n===node)position=all.length+offset;nodes.push({node:n,start:all.length,end:all.length+n.textContent.length});all+=n.textContent}
  if(position<0)return;
  const matches=Array.from(all.matchAll(/[\p{L}\p{M}]+(?:[·'’‘-][\p{L}\p{M}]+)*/gu));
  const match=matches.find(m=>position>=m.index&&position<m.index+m[0].length)||matches.find(m=>position===m.index+m[0].length);
  if(!match||match[0].length>70)return;
  const begin=nodes.find(n=>match.index>=n.start&&match.index<n.end),end=nodes.find(n=>match.index+match[0].length>n.start&&match.index+match[0].length<=n.end);
  if(!begin||!end)return;
  const range=document.createRange();range.setStart(begin.node,match.index-begin.start);range.setEnd(end.node,match.index+match[0].length-end.start);
  const rects=Array.from(range.getClientRects());if(!rects.some(r=>x>=r.left-1&&x<=r.right+1&&y>=r.top&&y<=r.bottom))return;
  return {word:match[0],node:begin.node,offset:match.index,rect:range.getBoundingClientRect()};
 }
 function hide(){clearTimeout(timer);sequence++;current=null;tip.hidden=true}
 function place(rect){tip.style.left=Math.max(8,Math.min(rect.left,innerWidth-tip.offsetWidth-8))+'px';const below=rect.bottom+8;tip.style.top=(below+tip.offsetHeight<innerHeight?below:Math.max(8,rect.top-tip.offsetHeight-8))+'px'}
 async function show(item){
  const seq=++sequence;current=item;
  title.textContent=item.word;result.textContent='Consultant les accepcions…';source.replaceChildren();tip.hidden=false;place(item.rect);
  const word=item.word.normalize('NFC').toLocaleLowerCase('ca').replace(/[’‘]/g,"'").replace(/\s+/g,' ');
  try{
   const entries=await senses(word);if(seq!==sequence)return;
   result.replaceChildren();
   if(entries.length){
    for(const entry of entries){
     const heading=document.createElement('strong');heading.className='ca-sense-head';heading.textContent=entry.word;
     if(entry.word.toLocaleLowerCase('ca')!==word)heading.textContent+=' · forma base';
     result.append(heading);
     const list=document.createElement('ol');list.className='ca-senses';
     for(const sense of entry.senses){const li=document.createElement('li'),pos=document.createElement('em');pos.textContent=sense.pos+' ';li.append(pos,document.createTextNode(sense.definition));list.append(li)}
     result.append(list);
     const credit=document.createElement('a');credit.href=entry.source==='editorial'?'assets/definitions/README.md':'https://ca.wiktionary.org/wiki/'+encodeURIComponent(entry.word);credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent=entry.source==='editorial'?'Glossari didàctic de l’aula · '+entry.word:'Font: Viccionari · '+entry.word;source.append(credit,document.createElement('br'));
    }
    source.append(document.createTextNode('CC BY-SA 4.0 · Selecció d’entrades per al material de l’aula.'));
   }else{
    result.textContent='Encara no hi ha cap accepció documentada per a aquesta forma.';
    source.textContent='Les sigles, els fragments de paraula i les grafies dels exercicis poden no tenir una entrada pròpia.';
   }
  }catch{if(seq!==sequence)return;result.textContent='No s’ha pogut carregar el diccionari. Torna-ho a provar.';source.textContent=''}
  if(seq===sequence)place(item.rect);
 }
 content.addEventListener('pointermove',event=>{
  if(!enabled||event.pointerType==='touch'||event.buttons)return;
  const item=wordAt(event.clientX,event.clientY);
  if(!item){clearTimeout(timer);if(current)timer=setTimeout(hide,350);return}
  if(current&&current.node===item.node&&current.offset===item.offset)return;
  hide();current=item;timer=setTimeout(()=>show(item),650);
 });
 content.addEventListener('pointerup',event=>{if(!enabled||event.pointerType==='mouse')return;const item=wordAt(event.clientX,event.clientY);if(item){hide();show(item)}});
 document.addEventListener('pointerdown',event=>{if(!content.contains(event.target)&&!tip.contains(event.target))hide()});
 content.addEventListener('pointerleave',event=>{clearTimeout(timer);if(!tip.contains(event.relatedTarget))timer=setTimeout(hide,350)});
 tip.addEventListener('pointerenter',()=>clearTimeout(timer));
 tip.addEventListener('focusin',()=>clearTimeout(timer));
 tip.addEventListener('pointerleave',event=>{if(!content.contains(event.relatedTarget))hide()});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){hide();return}
  if(!enabled||!event.altKey||event.key.toLowerCase()!=='t')return;
  const selection=getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0);const el=range.commonAncestorContainer.nodeType===Node.TEXT_NODE?range.commonAncestorContainer.parentElement:range.commonAncestorContainer;
  const word=selection.toString().trim();if(!allowed(el)||!allowed(selection.anchorNode?.parentElement)||!allowed(selection.focusNode?.parentElement)||!/^[\p{L}\p{M}]+(?:[·'’‘ -][\p{L}\p{M}]+)*$/u.test(word)||word.length>70)return;
  event.preventDefault();hide();show({word,node:selection.anchorNode,rect:range.getBoundingClientRect()});
 });
 window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);
 new MutationObserver(()=>{if(current&&!content.contains(current.node))hide()}).observe(content,{childList:true,subtree:true});
})();
