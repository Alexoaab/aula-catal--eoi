(()=>{
 const button=document.getElementById('install-app'),panel=document.getElementById('install-panel'),status=document.getElementById('install-status');
 let pending;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 if(standalone()){panel.hidden=true;return}
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;button.hidden=false});
 button.addEventListener('click',async()=>{
  if(!pending)return;
  button.disabled=true;
  try{await pending.prompt();const result=await pending.userChoice;status.textContent=result.outcome==='accepted'?'Instal·lació sol·licitada.':'Pots afegir l’accés més endavant des del menú del navegador.'}
  catch{status.textContent='Fes servir el menú del navegador per afegir l’accés.'}
  finally{pending=null;button.hidden=true;button.disabled=false}
 });
 window.addEventListener('appinstalled',()=>{pending=null;panel.hidden=true});
})();
