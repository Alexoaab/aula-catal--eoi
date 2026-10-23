/* Word lookup for published learning content only. Editable answers are excluded. */
(()=>{
 'use strict';
 const content=document.getElementById('content');if(!content)return;
 // Discard previous machine translations; never mix them with dictionary entries.
 try{localStorage.removeItem('aula-ca-es-words-v1')}catch{}
 let dictionaryPromise;
 function dictionary(){
  if(!dictionaryPromise)dictionaryPromise=fetch('assets/translate/dictionary.json?v=2').then(r=>{if(!r.ok)throw Error();return r.json()}).catch(e=>{dictionaryPromise=null;throw e});
  return dictionaryPromise;
 }
 const labels={n:'nom',adj:'adjectiu',adv:'adverbi',vblex:'verb',vbser:'verb',vbhaver:'verb',vbmod:'verb',pr:'preposició',prn:'pronom',det:'determinant',cnjcoo:'conjunció',cnjsub:'conjunció',np:'nom propi'};
 let enabled=true;try{enabled=localStorage.getItem('aula-ca-es-enabled')!=='off'}catch{}
 let timer,current,sequence=0;
 const tip=document.createElement('div');tip.id='ca-es-tooltip';tip.className='ca-es-tooltip';tip.hidden=true;tip.setAttribute('role','tooltip');
 const title=document.createElement('strong'),result=document.createElement('span'),source=document.createElement('small');
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Tancar la traducció');close.onclick=hide;
 result.setAttribute('aria-live','polite');tip.append(close,title,result,source);document.body.append(tip);
 const settings=document.createElement('details');settings.className='ca-es-settings';settings.innerHTML='<summary>Diccionari català–castellà</summary><label><input type="checkbox"> Consultar paraules en passar-hi el ratolí</label><p>Mantén el ratolí sobre una paraula o toca-la al mòbil. També pots seleccionar-la i prémer Alt+T. Diccionari bilingüe Apertium: mostra equivalències segons el context, sense traducció automàtica. Les formes conjugades o flexionades poden no tenir entrada: consulta’n la forma base. Les consultes es fan al dispositiu.</p><p><a href="https://github.com/apertium/apertium-spa-cat" target="_blank" rel="noopener">Font: Apertium</a> · <a href="assets/translate/COPYING">Llicència GPL-2.0</a></p>';
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
  title.textContent=item.word+' → castellà';result.textContent='Consultant el diccionari…';source.textContent='';tip.hidden=false;place(item.rect);
  const word=item.word.normalize('NFC').toLocaleLowerCase('ca').replace(/[’‘]/g,"'");
  try{
   const entries=await dictionary();if(seq!==sequence)return;
   const found=Object.hasOwn(entries,word)?entries[word]:null;
   result.replaceChildren();
   if(found){
    for(const [translation,pos] of found){const row=document.createElement('span');row.style.display='block';row.lang='es';row.textContent=translation+(labels[pos]?' ('+labels[pos]+')':'');result.append(row)}
    source.textContent='Diccionari Apertium · Tria el sentit segons el context.';
   }else{
    result.textContent='No s’ha trobat aquesta entrada.';
    source.textContent='Si és una forma conjugada, femenina o plural, consulta la forma base al diccionari. No es genera cap traducció automàtica.';
   }
  }catch{if(seq!==sequence)return;result.textContent='No s’ha pogut carregar el diccionari. Torna-ho a provar.';source.textContent='Cal connexió per carregar el diccionari.'}
  if(seq===sequence)place(item.rect);
 }
 content.addEventListener('pointermove',event=>{
  if(!enabled||event.pointerType==='touch'||event.buttons)return;
  const item=wordAt(event.clientX,event.clientY);
  if(!item){if(current)hide();else clearTimeout(timer);return}
  if(current&&current.node===item.node&&current.offset===item.offset)return;
  hide();current=item;timer=setTimeout(()=>show(item),650);
 });
 content.addEventListener('pointerup',event=>{if(!enabled||event.pointerType==='mouse')return;const item=wordAt(event.clientX,event.clientY);if(item){hide();show(item)}});
 document.addEventListener('pointerdown',event=>{if(!content.contains(event.target)&&!tip.contains(event.target))hide()});
 content.addEventListener('pointerleave',event=>{if(!tip.contains(event.relatedTarget))hide()});
 tip.addEventListener('pointerleave',event=>{if(!content.contains(event.relatedTarget))hide()});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){hide();return}
  if(!enabled||!event.altKey||event.key.toLowerCase()!=='t')return;
  const selection=getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0);const el=range.commonAncestorContainer.nodeType===Node.TEXT_NODE?range.commonAncestorContainer.parentElement:range.commonAncestorContainer;
  const word=selection.toString().trim();if(!allowed(el)||!allowed(selection.anchorNode?.parentElement)||!allowed(selection.focusNode?.parentElement)||!/^[\p{L}\p{M}]+(?:[·'’‘-][\p{L}\p{M}]+)*$/u.test(word)||word.length>70)return;
  event.preventDefault();hide();show({word,node:selection.anchorNode,rect:range.getBoundingClientRect()});
 });
 window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);
 new MutationObserver(()=>{if(current&&!content.contains(current.node))hide()}).observe(content,{childList:true,subtree:true});
})();
