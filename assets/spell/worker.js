/* Dictionary engine runs off the UI thread. Text never leaves this browser. */
importScripts('typo.js');
let dictionary;
const cache=new Map();
const ready=Promise.all(['ca.aff','ca.dic'].map(async name=>{
 const r=await fetch(name);if(!r.ok)throw Error('dictionary unavailable');return r.text();
})).then(([aff,dic])=>{dictionary=new Typo('ca',aff,dic);postMessage({type:'ready'});});
ready.catch(()=>postMessage({type:'error'}));
onmessage=async({data})=>{
 if(!['check','suggest'].includes(data.type))return;
 try{
  await ready;
  if(data.type==='suggest'){
   const word=data.word.normalize('NFC').replace(/[’‘]/g,"'");
   const suggestions=!word.includes('-')&&word.length<=32?dictionary.suggest(word,6):[];
   postMessage({type:'suggestions',id:data.id,revision:data.revision,request:data.request,word:data.word,suggestions});return;
  }
  const errors=[];
  for(const word of data.words){
   // Hyphens can be deliberate syllable separators in exercise answers.
   if(word.includes('-'))continue;
   const normalized=word.normalize('NFC').replace(/[’‘]/g,"'").replace(/ŀ/g,'l·').replace(/Ŀ/g,'L·');
   if(!cache.has(normalized))cache.set(normalized,dictionary.check(normalized));
   if(!cache.get(normalized))errors.push(word);
  }
  if(cache.size>20000)cache.clear();
  postMessage({type:'result',id:data.id,revision:data.revision,errors});
 }catch{postMessage({type:'error'});}
};
