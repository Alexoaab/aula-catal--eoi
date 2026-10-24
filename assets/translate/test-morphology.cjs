const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/hover.js','utf8');
const code=source.slice(source.indexOf(' const formLoads='),source.indexOf(' const labels='));
const sandbox={Map,Object,fetch:async url=>{const path=__dirname+'/'+url.replace('assets/translate/','').split('?')[0];return fs.existsSync(path)?{ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(path))}:{ok:false,status:404}}};
vm.createContext(sandbox);vm.runInContext(code+';this.lookup=lookup;',sandbox);
const entries=JSON.parse(fs.readFileSync(__dirname+'/dictionary.json'));
(async()=>{
 for(const [word,lemma,translation] of [['escriviu','escriure','escribir'],['boniques','bonic','bonito'],['llops','llop','lobo'],['paraules','paraula','palabra'],["l’aigua".replace('’',"'"),'aigua','agua'],['tenim','tenir','tener']]){
 const result=await sandbox.lookup(word,entries);assert(result.some(x=>x.lemma===lemma&&x.values.some(v=>v[0]===translation)),word);console.log('PASS',word,lemma,translation);
 }
 assert.equal((await sandbox.lookup('inventadíssimaqq',entries)).length,0);
 assert((await sandbox.lookup('brut',entries)).some(x=>x.values.some(v=>v[0]==='sucio')));
 console.log('PASS unknown word and direct dictionary senses');
})().catch(e=>{console.error(e);process.exit(1)});
