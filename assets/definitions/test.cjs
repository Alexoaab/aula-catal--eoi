const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),root=__dirname;
const source=fs.readFileSync(path.join(root,'../translate/hover.js'),'utf8');
const code=source.slice(source.indexOf(' let indexPromise'),source.indexOf(' let enabled'));
let calls=0;const sandbox={Map,Object,fetch:async url=>{calls++;const p=path.join(root,url.replace('assets/definitions/','').replace('assets/translate/','../translate/').split('?')[0]);return {ok:fs.existsSync(p),status:fs.existsSync(p)?200:404,json:async()=>JSON.parse(fs.readFileSync(p))}}};
vm.createContext(sandbox);vm.runInContext(code+';this.senses=senses;',sandbox);
(async()=>{
 const acarament=await sandbox.senses('acarament');assert.equal(acarament[0].senses.length,2);
 const a=await sandbox.senses('altressí');assert.equal(a.length,1);assert.equal(a[0].senses.length,2);assert.equal(a[0].senses[0].pos,'adverbi');assert.equal(a[0].senses[1].pos,'nom masculí');
 for(const [word,lemma] of [['escriviu','escriure'],['llops','llop'],['boniques','bonic'],["l'aigua",'aigua'],['complements','complement'],['atribut','atribut'],['ortogràfics','ortogràfic'],['semivocals','semivocal'],['loció','loció'],['tramitadors','tramitador'],["explica-m’ho",'explicar'],['jaguis','jaure']])assert((await sandbox.senses(word)).some(x=>x.word===lemma),word);
 assert((await sandbox.senses('taula'))[0].senses.length>2);
 assert.equal((await sandbox.senses('inventadíssimaqq')).length,0);
 const before=calls;await sandbox.senses('altressí');assert.equal(calls,before);
 let count=0;for(const file of fs.readdirSync(path.join(root,'data'))){for(const entry of Object.values(JSON.parse(fs.readFileSync(path.join(root,'data',file))))){assert(entry.senses.length);for(const s of entry.senses){assert(s.pos&&s.definition);assert(!/\{\{|\}\}|\[\[|\]\]/.test(s.definition),entry.word);count++}}}
 console.log('PASS: numbered senses, categories, homonyms, inflections, editorial provenance, missing entries, caching and '+count+' clean definitions');
})().catch(e=>{console.error(e);process.exit(1)});
