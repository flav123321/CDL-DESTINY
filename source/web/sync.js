/* ---------- Sauvegarde et synchronisation du contenu ---------- */
const {validateContent,merge3,setPath,applyPatch,pathLabel}=ContentCore;
const BR=window.__CDL_BRIDGE__||null;
let CS=null,updMsg="",checking=false;
function parseJ(x){if(!x)return null;try{return JSON.parse(x)}catch(e){return null}}
function readKV(k,native){let a=null;try{a=parseJ(localStorage.getItem(k))}catch(e){}const b=parseJ(native);if(a&&b)return(b.ts||0)>(a.ts||0)?b:a;return a||b}
function writeKV(k,o){o.ts=Date.now();const v=JSON.stringify(o);try{localStorage.setItem(k,v)}catch(e){}
 if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:"kv",key:k,value:v}))}
function save(){if(S)writeKV("cdl-save",S)}
function saveCS(){writeKV("cdl-content",CS)}
function clearSave(){try{localStorage.removeItem("cdl-save")}catch(e){}if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:"kv",key:"cdl-save",value:null}))}
const atSeasonStart=()=>S&&!S.ended&&S.step===0&&S.decisionsDone===0;
function freshCS(){return{base:DEFAULT_CONTENT,active:DEFAULT_CONTENT,local:null,pending:null,conflicts:[],url:null,lastCheck:null}}
function computePending(remote){
 let merged=remote,conflicts=[];
 if(CS.local){const m=merge3(CS.base,CS.local,remote);if(validateContent(m.merged).ok){merged=m.merged;conflicts=m.conflicts}
  else updMsg="Tes modifications locales ne sont plus compatibles avec la version en ligne : elles sont mises de côté."}
 return{remote,merged,conflicts};
}
/** Reçoit une version complète. Elle est validée, fusionnée, puis appliquée au prochain moment sûr. */
function receive(remote){
 const v=validateContent(remote);
 if(!v.ok)return{ok:false,msg:"Fichier refusé, ton jeu n'a pas changé : "+v.errors[0]};
 const known=CS.pending?CS.pending.remote.revision:CS.base.revision;
 if(remote.revision<=known)return{ok:true,msg:CS.pending?`La révision ${known} est déjà reçue. Elle s'appliquera à la prochaine saison.`:`Tu es à jour (révision ${known}).`};
 CS.pending=computePending(remote);saveCS();
 if(!S||atSeasonStart()){const n=applyPending();return{ok:true,msg:`Révision ${CS.active.revision} appliquée. ${n}`,applied:true}}
 return{ok:true,msg:`Révision ${remote.revision} reçue. Elle s'appliquera au début de ta prochaine saison, pour ne pas changer les règles en cours de route.`};
}
function applyPending(){
 const p=CS.pending;if(!p)return null;
 CS.base=p.remote;CS.active=p.merged;CS.local=CS.local?p.merged:null;CS.conflicts=p.conflicts;CS.pending=null;
 hydrate(CS.active);saveCS();
 return p.remote.notes||"Nouvelle version installée.";
}
function contentUrl(){return CS.url||(BR&&BR.contentUrl)||(/^https?:/.test(location.protocol)&&!BR?"content.json":null)}
async function checkUpdates(manual){
 const url=contentUrl();
 if(!url){if(manual){updMsg="Ajoute d'abord l'adresse de ton fichier content.json.";render()}return}
 if(navigator.onLine===false){if(manual){updMsg=`Pas de réseau. Tu continues à jouer avec la révision ${CS.active.revision}.`;render()}return}
 if(checking)return;checking=true;
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
 try{
  const r=await fetch(url+(url.includes("?")?"&":"?")+"t="+Date.now(),{cache:"no-store",signal:ctl.signal});
  if(!r.ok)throw new Error("Le serveur a répondu "+r.status+".");
  const remote=JSON.parse(await r.text());
  CS.lastCheck=Date.now();
  const res=receive(remote);saveCS();updMsg=res.msg;
  if(manual||tab==="maj"||res.applied){if(!S)keepForm();render()}
 }catch(e){CS.lastCheck=Date.now();if(manual){updMsg="Vérification impossible, ton jeu continue normalement. "+(e.name==="AbortError"?"Le serveur a mis trop de temps à répondre.":e instanceof SyntaxError?"Le fichier n'est pas du JSON valide.":e.message);render()}}
 finally{clearTimeout(timer);checking=false}
}
function keepForm(){const n=document.getElementById("f-name"),m=document.getElementById("f-nat");if(n)form.name=n.value;if(m)form.nat=m.value}
function importText(txt){
 const o=parseJ(txt);
 if(!o||typeof o!=="object")return"Ce texte n'est pas du JSON valide. Rien n'a changé.";
 if(o.schema!==undefined&&o.revision!==undefined)return receive(o).msg;
 const next=applyPatch(CS.active,o),v=validateContent(next);
 if(!v.ok)return"Modification refusée, rien n'a changé : "+v.errors[0];
 CS.local=next;CS.active=next;hydrate(next);
 if(CS.pending)CS.pending=computePending(CS.pending.remote);
 saveCS();return"Modification locale enregistrée. Elle sera conservée lors des prochaines mises à jour.";
}
function resolveConflict(i,mine){
 const c=CS.conflicts[i];if(!c)return;
 if(mine){const a=setPath(CS.active,c.path,c.ours);
  if(!validateContent(a).ok){updMsg="Ta version n'est plus compatible avec ce contenu, la version en ligne est conservée."}
  else{CS.active=a;CS.local=setPath(CS.local||CS.base,c.path,c.ours);hydrate(a);updMsg="Ta version est conservée."}}
 else updMsg="La version en ligne est conservée.";
 CS.conflicts.splice(i,1);saveCS();render();
}
function handleUpd(d,b){
 if(d.upd==="check"){const u=document.getElementById("upd-url");if(u&&u.value.trim()!==(contentUrl()||""))CS.url=u.value.trim()||null;saveCS();updMsg="Vérification en cours…";render();checkUpdates(true);return true}
 if(d.upd==="import"){updMsg=importText(document.getElementById("upd-text").value);render();return true}
 if(d.upd==="reset"){CS.local=null;CS.active=CS.base;CS.conflicts=[];hydrate(CS.active);if(CS.pending)CS.pending=computePending(CS.pending.remote);saveCS();updMsg="Tes modifications locales sont supprimées.";render();return true}
 if(d.conf!==undefined){resolveConflict(+d.conf,d.keep==="mine");return true}
 return false;
}
const shortJ=v=>{if(v===undefined)return"(supprimé)";const s=typeof v==="string"?v:JSON.stringify(v);return s.length>160?s.slice(0,160)+"…":s};
function updView(){
 const a=CS.active,when=CS.lastCheck?new Date(CS.lastCheck).toLocaleString("fr-FR"):"jamais";
 return`<div class="stack" style="max-width:720px">
 <div><h2 style="font-size:38px">Mises à jour du jeu</h2><p class="dim">Version installée : révision ${a.revision}, du ${esc(a.updatedAt||"")}. ${a.notes?esc(a.notes):""}</p>
 <p class="dim" style="font-size:14px">Dernière vérification : ${when}. Version de l'application : __BUILD_ID__.</p></div>
 ${updMsg?`<div class="flash note" id="upd-msg">${esc(updMsg)}</div>`:""}
 ${CS.pending?`<div class="flash ok">Révision ${CS.pending.remote.revision} prête. ${S&&!atSeasonStart()?"Elle s'appliquera au début de ta prochaine saison.":""}</div>`:""}
 ${(CS.conflicts||[]).length?`<section class="stack" style="gap:8px"><div class="lab">À trancher : modifié des deux côtés</div>${CS.conflicts.map((c,i)=>`<div class="conf"><span class="mono">${esc(pathLabel(c.path))}</span><div><span class="dim">Ta version :</span> ${esc(shortJ(c.ours))}</div><div><span class="dim">En ligne :</span> ${esc(shortJ(c.theirs))}</div><div class="row"><button class="btn2" data-conf="${i}" data-keep="mine" id="conf-mine-${i}">Garder la mienne</button><button class="btn2" data-conf="${i}" data-keep="online" id="conf-on-${i}">Garder celle en ligne</button></div></div>`).join("")}</section>`:""}
 <section class="field"><label class="lab" for="upd-url">Adresse du fichier content.json</label><input type="text" id="upd-url" value="${esc(contentUrl()||"")}" placeholder="https://tonpseudo.github.io/cdl-destiny/content.json"><div class="row"><button class="btn2" data-upd="check" id="upd-check">Vérifier maintenant</button></div></section>
 <section class="field"><label class="lab" for="upd-text">Importer du JSON à la main</label><textarea id="upd-text" placeholder='Colle ici le fichier complet, ou juste une modification, par exemple {"rules":{"qualifiers":{"CDL":6}}}'></textarea><div class="row"><button class="btn2" data-upd="import" id="upd-import">Importer</button><label class="ghost" for="upd-file" style="cursor:pointer">Choisir un fichier</label><input type="file" id="upd-file" accept=".json,application/json" hidden>${CS.local?'<button class="ghost" data-upd="reset" id="upd-reset">Supprimer mes modifications locales</button>':""}</div></section>
 <p class="fine">Les textes, scénarios et règles s'appliquent à la saison suivante. Les changements d'effectifs de départ s'appliquent aux nouvelles carrières : ta carrière en cours garde son propre monde.</p>
 ${S?"":'<div><button class="ghost" data-tab="carriere" id="upd-back">Retour à la création</button></div>'}
 </div>`;
}
document.addEventListener("change",e=>{if(e.target.id!=="upd-file"||!e.target.files[0])return;const r=new FileReader();r.onload=()=>{document.getElementById("upd-text").value=r.result};r.readAsText(e.target.files[0])});
function boot(){
 const saved=readKV("cdl-content",BR&&BR.content);
 CS=saved&&saved.active&&validateContent(saved.active).ok&&validateContent(saved.base).ok?saved:freshCS();
 if(saved&&CS!==saved)updMsg="La version enregistrée était illisible : retour à la version intégrée.";
 hydrate(CS.active);
 S=readKV("cdl-save",BR&&BR.save);
 if(DEFAULT_CONTENT.revision>CS.base.revision)receive(DEFAULT_CONTENT);
 if(!S||atSeasonStart())applyPending();
 render();
 checkUpdates(false);
 addEventListener("online",()=>checkUpdates(false));
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&Date.now()-(CS.lastCheck||0)>9e5)checkUpdates(false)});
}
