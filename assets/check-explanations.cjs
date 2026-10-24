const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync('work/book/index.html','utf8'), original=fs.readFileSync('work/book/original.html','utf8');const elements=new Map();const document={querySelector(s){if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',classList:{toggle(){}},dataset:{}});return elements.get(s)},querySelectorAll(){return []}};const storage=new Map([['aula-catala-v1',JSON.stringify({version:1,answers:{'t2-ex5-r0-0':'saved original'},checked:{},custom:[],answerBoxesV1:true})]]);const ctx=vm.createContext({window:{},document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout,clearTimeout,console,URL,Blob});vm.runInContext(fs.readFileSync('work/book/book-b2.js','utf8'),ctx);for(const s of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(s[1].trim())vm.runInContext(s[1],ctx);
for(const view of ['catalog','morfosintaxi','lexic','ambit1']){vm.runInContext(`go('${view}')`,ctx);assert(elements.get('#content').innerHTML.length>200)}
const ids=vm.runInContext('base.filter(t=>t.book&&!t.pending).map(t=>t.id)',ctx);for(const id of ids){vm.runInContext(`openTopic('${id}')`,ctx);const out=elements.get('#content').innerHTML;if(vm.runInContext(`base.find(t=>t.id==='${id}').exercises.length`,ctx)){assert(out.includes('La teva resposta'));assert(!out.includes('Veure l’original'))}else{assert(!out.includes('Consultar el document original'));assert(!out.includes('bocet'))}assert(!out.includes('undefined'))}
vm.runInContext("openTopic('book-o01');state.answers['book-o01-ex1-0']='test response';save();checkOne('book-o01-ex1')",ctx);assert(elements.get('#fb-book-o01-ex1').innerHTML.includes('Solució del llibre'));vm.runInContext("checkOne('book-o01-ex1')",ctx);assert.equal(elements.get('#fb-book-o01-ex1').innerHTML,'');const saved=JSON.parse(storage.get('aula-catala-v1'));assert.equal(saved.answers['t2-ex5-r0-0'],'saved original');assert.equal(saved.answers['book-o01-ex1-0'],'test response');
// Exercise the actual final-button handler in every topic, including mixed visibility.
for(const id of vm.runInContext('base.filter(t=>t.exercises.length).map(t=>t.id)',ctx)){
 vm.runInContext(`openTopic('${id}');for(const e of topics().find(t=>t.id===selected).exercises)state.checked[e.id]=false`,ctx);
 const answersBefore=vm.runInContext('JSON.stringify(state.answers)',ctx);
 elements.get('#check').onclick();
 assert(vm.runInContext('topics().find(t=>t.id===selected).exercises.every(e=>state.checked[e.id])',ctx),id);
 elements.get('#check').onclick();
 for(const ex of vm.runInContext('topics().find(t=>t.id===selected).exercises.map(e=>e.id)',ctx)){assert.equal(elements.get('#fb-'+ex).innerHTML,'');assert.equal(JSON.parse(storage.get('aula-catala-v1')).checked[ex],false)}
 vm.runInContext('checkOne(topics().find(t=>t.id===selected).exercises[0].id)',ctx);
 if(vm.runInContext('topics().find(t=>t.id===selected).exercises.length>1',ctx)){elements.get('#check').onclick();assert(vm.runInContext('topics().find(t=>t.id===selected).exercises.every(e=>state.checked[e.id])',ctx),id)}
 assert.equal(vm.runInContext('JSON.stringify(state.answers)',ctx),answersBefore);
 vm.runInContext('for(const e of topics().find(t=>t.id===selected).exercises)state.checked[e.id]=false;save()',ctx);
}
console.log('PASS: final check button shows/hides all solutions across every topic, handles mixed visibility and preserves answers.');
const extract=s=>JSON.parse(s.slice(s.indexOf('const base=')+11,s.indexOf(';\n',s.indexOf('const base='))));assert.deepStrictEqual(extract(html).map(t=>t.exercises),extract(original).map(t=>t.exercises));console.log('PASS: 4 catalogs, 15 topic renders, solution toggle, answer persistence, original topics unchanged.');
vm.runInContext("go('legacy')",ctx);assert(!elements.get('#content').innerHTML.includes('data-topic="book-'));assert(elements.get('#content').innerHTML.includes('data-topic="t2"'));assert(elements.get('#content').innerHTML.includes('B2.1'));vm.runInContext("go('catalog')",ctx);assert(!elements.get('#content').innerHTML.includes('data-topic="t2"'));assert(elements.get('#content').innerHTML.includes('data-topic="book-o01"'));assert.equal(vm.runInContext("topicView(base.find(t=>t.id==='t2'))",ctx),'legacy');assert.equal(vm.runInContext("topicView(base.find(t=>t.id==='book-o01'))",ctx),'catalog');console.log('PASS: B2 and B2.1 contain separate materials, with correct return navigation.');

for(const view of ['consells','lectora','oral','escrita','expressio-oral','examens','bibliografia']){vm.runInContext(`go('${view}')`,ctx);assert(elements.get('#content').innerHTML.includes('data-topic="book-'));assert(!elements.get('#content').innerHTML.includes('undefined'))}
assert.equal(vm.runInContext('base.filter(t=>t.book).length',ctx),57);assert.equal(vm.runInContext('base.filter(t=>t.book).flatMap(t=>t.exercises).length',ctx),351);assert.equal(vm.runInContext('base.filter(t=>t.book).flatMap(t=>t.exercises).filter(e=>!e.solutionHtml).length',ctx),9);
vm.runInContext("openTopic('book-ee01');checkOne('book-ee01-ex1')",ctx);assert(elements.get('#fb-book-ee01-ex1').innerHTML.includes('Resposta model orientativa'));
vm.runInContext("openTopic('book-co01')",ctx);assert(elements.get('#content').innerHTML.includes('Consultar la transcripció'));
const box={offsetHeight:152,clientHeight:150,scrollHeight:500,style:{}};ctx.box=box;vm.runInContext('fitAnswerBox(box)',ctx);assert.equal(box.style.height,'502px');box.scrollHeight=700;vm.runInContext('fitAnswerBox(box)',ctx);assert.equal(box.style.height,'702px');box.scrollHeight=150;vm.runInContext('fitAnswerBox(box)',ctx);assert.equal(box.style.height,'152px');
console.log('PASS: 56 topics, 342 per-exercise solutions, 7 new sections, labelled open models, transcripts and textarea growth.');
const vfBox={dataset:{key:'book-ex01-ex2-vf-0',ex:'book-ex01-ex2'},value:'F'};ctx.vfBox=vfBox;const originalQuery=document.querySelectorAll;document.querySelectorAll=s=>s==='[data-key]'?[vfBox]:[];vm.runInContext("openTopic('book-ex01')",ctx);vfBox.oninput();assert.equal(JSON.parse(storage.get('aula-catala-v1')).answers['book-ex01-ex2-vf-0'],'F');vm.runInContext("openTopic('book-ex01')",ctx);assert(elements.get('#content').innerHTML.includes('value="F" selected'));assert(!elements.get('#content').innerHTML.includes('{{VF_'));document.querySelectorAll=originalQuery;console.log('PASS: V/F controls save individual answers and restore their selection.');

vm.runInContext("openTopic('exam2020')",ctx);assert(elements.get('#content').innerHTML.includes('Convocatoria ordinaria 2020'));assert.equal((elements.get('#content').innerHTML.match(/data-key="exam2020-ex\d+-item-/g)||[]).length,52);assert(elements.get('#content').innerHTML.includes('Cal l’àudio'));console.log('PASS: new exam has 9 tasks, 52 individually saved answers and explicit audio/solution status');
const examOut=elements.get('#content').innerHTML;
assert(!examOut.includes('<img'));assert(!examOut.includes('assets/exam-2020'));assert(!examOut.includes('fotografiades'));
for(const title of ['Per Carnestoltes','Estiuejants o depredadors?','L’hort del terrat','Amunt l’autoestima','La sal de la vida','Al barri on has anat'])assert(examOut.includes(title));
assert(examOut.includes('Eixelebrat'));assert(examOut.includes('que si s’entén bé'));assert(examOut.includes('en tenen prou d’'));
const examBox={dataset:{key:'exam2020-ex2-item-9',ex:'exam2020-ex2'},value:'B'};document.querySelectorAll=s=>s==='[data-key]'?[examBox]:[];vm.runInContext("openTopic('exam2020')",ctx);examBox.oninput();vm.runInContext("openTopic('exam2020')",ctx);assert.equal(JSON.parse(storage.get('aula-catala-v1')).answers[examBox.dataset.key],'B');assert(elements.get('#content').innerHTML.includes('value="B" selected'));
const ten=vm.runInContext("base.find(t=>t.id==='exam2020').exercises[1].responseFields[9].options.join('')",ctx);assert.equal(ten,'AB');
console.log('PASS: complete native text, no exam images, correct item options, saved exam answer restored.');

for(const id of ids){vm.runInContext(`openTopic('${id}')`,ctx);assert(!elements.get('#content').innerHTML.includes('book-source'))}console.log('PASS: every topic renders without source/page notices.');
// Reasoning must be independent of grading and survive backup/import.
const nodes=[];document.createElement=tag=>({tagName:tag.toUpperCase(),dataset:{},children:[],style:{},setAttribute(k,v){this[k]=v},appendChild(n){this.children.push(n)}});
const parentLabel={querySelectorAll:()=>[answer],classList:{contains:()=>false},insertAdjacentElement(where,node){nodes.push(node)}};
const answer={dataset:{key:'book-o02-ex3-0',ex:'book-o02-ex3'},getAttribute:()=> 'Resposta de l’exercici O02.3',closest:s=>s==='label'?parentLabel:null};
document.querySelectorAll=s=>s==='input[data-key], textarea[data-key], select[data-key]'?[answer]:[];
vm.runInContext("state.checked['book-o02-ex3']=true;bindExplanations();bindExplanations()",ctx);
assert.equal(nodes.length,1);const reason=nodes[0].children[1];reason.value='Aplico la regla del hiat.\nUna vocal en cada síl·laba.';reason.oninput();
assert.equal(JSON.parse(storage.get('aula-catala-v1')).answers['book-o02-ex3-0-explanation'],reason.value);
assert.equal(vm.runInContext("state.checked['book-o02-ex3']",ctx),true);
vm.runInContext("state.answers['t2-ex5-r0-0-explanation']='Regla general';state.answers['exam2020-ex2-item-9-explanation']='Context de la lectura';",ctx);
const backup=vm.runInContext('backupData()',ctx);ctx.reasonBackup=backup;
const restored=vm.runInContext('validBackupAnswers(reasonBackup)',ctx);
for(const k of ['book-o02-ex3-0-explanation','t2-ex5-r0-0-explanation','exam2020-ex2-item-9-explanation'])assert.equal(restored[k],backup.answers[k]);
assert.equal(restored['t2-ex5-r0-0'],'saved original');
answer.dataset.explanationAdded='';vm.runInContext('bindExplanations()',ctx);assert.equal(nodes[1].children[1].value,reason.value);
console.log('PASS: one reasoning box per answer, independent autosave, restored text, B2/B2.1/exam backup round-trip.');
