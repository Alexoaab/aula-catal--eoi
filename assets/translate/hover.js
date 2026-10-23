/* Word lookup for published learning content only. Editable answers are excluded. */
(()=>{
 'use strict';
 const content=document.getElementById('content');if(!content)return;
 const storageKey='aula-ca-es-words-v1';
 const local={llop:'lobo',llops:'lobos',laberint:'laberinto',loció:'loción',paraula:'palabra',paraules:'palabras',síl·laba:'sílaba',síl·labes:'sílabas',lletra:'letra',lletres:'letras',resposta:'respuesta',respostes:'respuestas',raonament:'razonamiento',exercici:'ejercicio',exercicis:'ejercicios',solució:'solución',solucions:'soluciones',enunciat:'enunciado',enunciats:'enunciados',escriviu:'escribid / escriban',completeu:'completad / completen',separeu:'separad / separen',marqueu:'marcad / marquen',trieu:'elegid / elijan',llegiu:'leed / lean',classifiqueu:'clasificad / clasifiquen',ordeneu:'ordenad / ordenen',següent:'siguiente',següents:'siguientes',exemple:'ejemplo',exemples:'ejemplos',diftong:'diptongo',diftongs:'diptongos',hiat:'hiato',accent:'acento',accents:'acentos',dièresi:'diéresis',tònica:'tónica',àtona:'átona',avui:'hoy',ahir:'ayer',demà:'mañana',cabells:'cabello / pelos',vermell:'rojo',vermella:'roja',roba:'ropa',cadira:'silla',taula:'mesa / tabla',finestra:'ventana',aigua:'agua',aigües:'aguas',col·legi:'colegio',qüestió:'cuestión',qüestions:'cuestiones',jutge:'juez',jutjat:'juzgado',jutgessa:'jueza',lleig:'feo',llest:'listo',cullera:'cuchara',cavall:'caballo',crosta:'costra',fàbrica:'fábrica',gàbia:'jaula',xàfec:'chaparrón',ordinador:'ordenador',ordre:'orden',ordenació:'ordenación',dona:'mujer / da',gat:'gato',gos:'perro',casa:'casa',temps:'tiempo',feina:'trabajo',nen:'niño',nena:'niña',noi:'chico',noia:'chica',mot:'palabra',mots:'palabras',desar:'guardar'};
 let cache={};try{const data=JSON.parse(localStorage.getItem(storageKey)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))cache=data}catch{}
 let enabled=true;try{enabled=localStorage.getItem('aula-ca-es-enabled')!=='off'}catch{}
 let timer,current,sequence=0,controller;
 const tip=document.createElement('div');tip.id='ca-es-tooltip';tip.className='ca-es-tooltip';tip.hidden=true;tip.setAttribute('role','tooltip');
 const title=document.createElement('strong'),result=document.createElement('span'),source=document.createElement('small');
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Tancar la traducció');close.onclick=hide;
 result.setAttribute('aria-live','polite');tip.append(close,title,result,source);document.body.append(tip);
 const settings=document.createElement('details');settings.className='ca-es-settings';settings.innerHTML='<summary>Traducció al castellà</summary><label><input type="checkbox"> Traduir paraules en passar-hi el ratolí</label><p>Mantén el ratolí sobre una paraula del contingut o toca-la al mòbil. També pots seleccionar-la i prémer Alt+T. Traducció orientativa: el significat pot canviar segons el context. Les consultes noves envien només la paraula a MyMemory; no es tradueixen els camps de resposta ni els raonaments.</p>';
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
 function hide(){clearTimeout(timer);sequence++;controller?.abort();controller=null;current=null;tip.hidden=true}
 function place(rect){tip.style.left=Math.max(8,Math.min(rect.left,innerWidth-tip.offsetWidth-8))+'px';const below=rect.bottom+8;tip.style.top=(below+tip.offsetHeight<innerHeight?below:Math.max(8,rect.top-tip.offsetHeight-8))+'px'}
 function decode(text){const d=new DOMParser().parseFromString(text,'text/html');return d.body.textContent||''}
 async function show(item){
  controller?.abort();controller=null;const seq=++sequence;current=item;
  title.textContent=item.word+' → castellà';result.textContent='Traduint…';source.textContent='';tip.hidden=false;place(item.rect);
  const word=item.word.normalize('NFC').toLocaleLowerCase('ca');
  const found=local[word]||(typeof cache[word]==='string'?cache[word]:null);
  if(found){result.textContent=found;source.textContent=local[word]?'Glossari · Segons el context':'MyMemory · Traducció orientativa';place(item.rect);return}
  const requestController=new AbortController();controller=requestController;const timeout=setTimeout(()=>requestController.abort(),10000);
  try{
   const url=new URL('https://api.mymemory.translated.net/get');url.searchParams.set('q',item.word);url.searchParams.set('langpair','ca|es');
   const response=await fetch(url,{signal:requestController.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('unavailable');
   const data=await response.json();if(data.quotaFinished||Number(data.responseStatus)===429)throw Error('quota');
   if(Number(data.responseStatus)!==200||!data.responseData?.translatedText)throw Error('unavailable');
   const translated=decode(data.responseData.translatedText).trim();if(!translated||translated.length>400)throw Error('unavailable');
   if(seq!==sequence)return;
   cache[word]=translated;const keys=Object.keys(cache);if(keys.length>1500)delete cache[keys[0]];
   try{localStorage.setItem(storageKey,JSON.stringify(cache))}catch{}
   result.textContent=translated;source.textContent='MyMemory · Traducció orientativa';place(item.rect);
  }catch(error){if(seq!==sequence)return;result.textContent=error.message==='quota'?'S’ha arribat al límit diari de traduccions. Torna-ho a provar demà.':'No s’ha pogut obtenir la traducció. Torna-ho a provar.';source.textContent='Cal connexió per consultar paraules noves.';place(item.rect)}
  finally{clearTimeout(timeout)}
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
