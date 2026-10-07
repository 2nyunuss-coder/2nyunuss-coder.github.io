(()=>{'use strict';if(window.__RPYS_DEV_CENTER_V1__)return;window.__RPYS_DEV_CENTER_V1__=true;
const KEY='rpysDevCenterV1',uid=p=>(p||'x')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),clone=x=>x==null?x:JSON.parse(JSON.stringify(x)),esc=s=>String(s==null?'':s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
function dbx(){try{return typeof db!=='undefined'?db:null}catch(e){return null}};function defaults(){return {version:1,pages:[],queries:[],forms:[],rules:[],modules:[],formData:{},menu:[],actions:[],history:[]}};let state=defaults();try{state=JSON.parse(localStorage.getItem(KEY)||'null')||state}catch(e){};state.pages=Array.isArray(state.pages)?state.pages:[];state.queries=Array.isArray(state.queries)?state.queries:[];state.forms=Array.isArray(state.forms)?state.forms:[];state.rules=Array.isArray(state.rules)?state.rules:[];state.modules=Array.isArray(state.modules)?state.modules:[];state.menu=Array.isArray(state.menu)?state.menu:[];state.actions=Array.isArray(state.actions)?state.actions:[];state.formData=state.formData&&typeof state.formData==='object'?state.formData:{};state.history=Array.isArray(state.history)?state.history:[];function sync(label){state.history=state.history||[];state.history.push({at:new Date().toISOString(),label:label,data:clone(state)});if(state.history.length>12)state.history.shift();try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){};let d=dbx();if(d){d.rpysDevCenter=clone(state);try{if(typeof saveNowV245==='function')saveNowV245({allowAssignDrop:true,label:label});else if(typeof save==='function')save()}catch(e){}}}
function sources(){let d=dbx()||{},a=[];Object.keys(d).forEach(k=>{if(Array.isArray(d[k]))a.push(k)});if(d.staff&&!a.includes('staff'))a.push('staff');if(d.assign&&!a.includes('assign'))a.push('assign');return a.sort()};function rows(src){let d=dbx()||{};if(src==='staff')return (d.staff||[]).map(x=>({id:x.id,name:x.name,status:x.status,unit:x.unit||x.mainUnit||'',role:x.role||''}));if(src==='assign'){let a=[];Object.keys(d.assign||{}).forEach(k=>{let q=k.split('|'),p=(d.staff||[]).find(x=>Number(x.id)===Number(d.assign[k]));a.push({key:k,person:p?p.name:d.assign[k],personId:d.assign[k],type:q[1]||'',day:q[2]||'',column:q.slice(3).join('|')})});return a}let v=d[src];return Array.isArray(v)?v.map(x=>typeof x==='object'?clone(x):{value:x}):[]};function fields(a){let s={};a.slice(0,200).forEach(r=>Object.keys(r||{}).forEach(k=>s[k]=1));return Object.keys(s)};function runq(q){let a=rows(q.source||'staff');(q.conditions||[]).filter(c=>c&&c.field).forEach(c=>{let v=String(c.value??'').toLocaleLowerCase('tr');a=a.filter(r=>{let x=String(r[c.field]??'').toLocaleLowerCase('tr');if(c.op==='=')return x===v;if(c.op==='!=')return x!==v;if(c.op==='contains')return x.indexOf(v)>=0;if(c.op==='starts')return x.startsWith(v);if(c.op==='ends')return x.endsWith(v);if(c.op==='>')return Number(x)>Number(v);if(c.op==='<')return Number(x)<Number(v);if(c.op==='>=')return Number(x)>=Number(v);if(c.op==='<=')return Number(x)<=Number(v);return true})});if(q.sort&&q.sort.field)a.sort((x,y)=>String(x[q.sort.field]??'').localeCompare(String(y[q.sort.field]??''),'tr',{numeric:true,sensitivity:'base'})*(q.sort.dir==='desc'?-1:1));return a.slice(0,Math.min(Math.max(Number(q.limit)||100,1),500))};
const css='<style id="rpys-dev-center-css">#rpysDevLauncher{display:block!important;visibility:visible!important;position:fixed!important;right:15px!important;bottom:16px!important;z-index:10060;border:0;border-radius:13px;background:#17365d;color:#fff;padding:10px 14px;font-weight:800;box-shadow:0 8px 25px #17365d44}#rpysDevOverlay{position:fixed;inset:0;background:#08152299;z-index:10050;display:none;padding:3vh 2vw}#rpysDevOverlay.open{display:block}.rpysDevApp{height:94vh;background:#f5f8fb;border-radius:18px;overflow:hidden;display:grid;grid-template-columns:190px 1fr;color:#17365d}.rpysDevSide{background:#17365d;color:#fff;padding:14px;display:flex;flex-direction:column;gap:5px}.rpysDevSide h2{font-size:16px;margin:5px}.rpysDevNav{border:0;background:transparent;color:#dce9f7;text-align:left;padding:10px;border-radius:8px;font-size:12px}.rpysDevNav.active,.rpysDevNav:hover{background:#ffffff1c}.rpysDevClose{margin-top:auto}.rpysDevMain{min-width:0;display:flex;flex-direction:column}.rpysDevHead{padding:13px 17px;background:#fff;border-bottom:1px solid #dce5ee;display:flex;justify-content:space-between}.rpysDevHead h1{font-size:18px;margin:0}.rpysDevBody{padding:13px;overflow:auto}.rpysDevCard,.rpysDevItem{background:#fff;border:1px solid #dce5ee;border-radius:10px;padding:11px}.rpysDevList{display:grid;gap:6px}.rpysDevItem{display:flex;justify-content:space-between;gap:8px}.rpysDevBtn{border:1px solid #cbd8e5;background:#fff;border-radius:7px;padding:7px 10px;font-size:11px}.rpysDevBtn.primary{background:#17365d;color:#fff}.rpysDevInput,.rpysDevSelect{width:100%;padding:8px;border:1px solid #cbd8e5;border-radius:7px;box-sizing:border-box}.rpysDevField{margin:7px 0}.rpysDevMuted{font-size:11px;color:#6b7c8e}.rpysDevGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rpysDevBuilder{display:grid;grid-template-columns:180px 1fr 230px;gap:9px}.rpysDevPalette,.rpysDevCanvas,.rpysDevProps{background:#fff;border:1px solid #dce5ee;border-radius:10px;padding:9px}.rpysDevPaletteItem{padding:8px;border:1px dashed #b8c8d8;border-radius:7px;margin:5px 0;font-size:11px}.rpysDevPageCanvas{min-height:500px}.rpysDevBlock{padding:9px;margin:4px 0;border:1px solid transparent;border-radius:7px}.rpysDevBlock:hover{border-color:#4d78a8;background:#edf5fc}.rpysDevTable{width:100%;border-collapse:collapse;font-size:11px}.rpysDevTable th,.rpysDevTable td{border:1px solid #dce5ee;padding:5px;text-align:left}@media(max-width:900px){#rpysDevOverlay{padding:0}.rpysDevApp{height:100dvh;border-radius:0;grid-template-columns:1fr}.rpysDevSide{display:none}.rpysDevGrid,.rpysDevBuilder{grid-template-columns:1fr}}</style>';
function open(){if(!document.getElementById('rpysDevOverlay'))build();document.getElementById('rpysDevOverlay').classList.add('open');render('pages')};function close(){document.getElementById('rpysDevOverlay').classList.remove('open')};function build(){document.head.insertAdjacentHTML('beforeend',css);let o=document.createElement('div');o.id='rpysDevOverlay';o.innerHTML='<div class="rpysDevApp"><aside class="rpysDevSide"><h2>🧩 Geliştirme Merkezi</h2><button class="rpysDevNav" data-tab="pages">📄 Sayfalar</button><button class="rpysDevNav" data-tab="queries">🔎 Sorgular</button><button class="rpysDevNav" data-tab="forms">📝 Formlar</button><button class="rpysDevNav" data-tab="modules">🧱 Modüller</button><button class="rpysDevNav" data-tab="menu">🧭 Menü</button><button class="rpysDevNav" data-tab="actions">⚡ İşlemler</button><button class="rpysDevNav" data-tab="rules">⚙️ Kurallar</button><button class="rpysDevNav" data-tab="data">🗃 Veri</button><button class="rpysDevNav" data-tab="backup">↩️ Yedek</button><button class="rpysDevNav" data-tab="guide">📘 Kullanım Kılavuzu</button><button class="rpysDevNav rpysDevClose">✕ Kapat</button></aside><main class="rpysDevMain"><header class="rpysDevHead"><h1 id="rpysDevTitle">Geliştirme Merkezi</h1><button class="rpysDevBtn" id="devClose">Kapat</button></header><div class="rpysDevBody" id="rpysDevBody"></div></main></div>';document.body.append(o);let b=document.createElement('button');b.id='rpysDevLauncher';b.type='button';b.textContent='🧩 Geliştirme';document.body.append(b);b.onclick=open;document.getElementById('devClose').onclick=close;document.querySelector('.rpysDevClose').onclick=close;document.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>render(x.dataset.tab));o.onclick=e=>{if(e.target===o)close()}};
function render(tab){let body=document.getElementById('rpysDevBody');document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));let fn={pages:pages,queries:queries,forms:forms,modules:modules,menu:menu,actions:actions,rules:rules,data:data,backup:backup,guide:devGuide}[tab]||pages;fn(body)};


function actionById(id){return (state.actions||[]).find(a=>a.id===id)}
function actionTargets(){
 let a=[{value:'none',label:'Yok'}];
 publishedPages().forEach(p=>a.push({value:'page:'+p.slug,label:'Sayfa: '+p.name}));
 (state.modules||[]).forEach(m=>a.push({value:'module:'+m.id,label:'Modül: '+m.name}));
 return a;
}
function runAction(id,ctx){
 let a=actionById(id);if(!a)return;
 if(a.type==='message'){toastDev(a.message||'İşlem tamamlandı');return}
 if(a.type==='reload'){location.reload();return}
 if(a.type==='page'){location.href=location.pathname+'?devpage='+encodeURIComponent(a.target||'');return}
 if(a.type==='module'){editModuleRuntime(a.target);open();return}
}
function wireActions(root){
 (root||document).querySelectorAll('[data-dev-action]').forEach(x=>x.onclick=e=>{e.preventDefault();runAction(x.dataset.devAction,{element:x})});
}
function actionOptions(selected){
 return (state.actions||[]).map(a=>'<option value="'+esc(a.id)+'" '+(a.id===selected?'selected':'')+'>'+esc(a.name)+'</option>').join('');
}
function actions(b){
 state.actions=state.actions||[];
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="newAction">＋ Yeni İşlem</button><p class="rpysDevMuted">Butonlara kod yazmadan davranış bağla. Bu sürümde güvenli işlemler: mesaj, sayfa aç, modül aç ve yenile.</p></div><div class="rpysDevList" style="margin-top:10px">'+state.actions.map((a,i)=>'<div class="rpysDevItem"><div><b>'+esc(a.name)+'</b><div class="rpysDevMuted">'+esc(a.type)+(a.target?' • '+esc(a.target):'')+'</div></div><button class="rpysDevBtn" data-act-edit="'+i+'">Düzenle</button><button class="rpysDevBtn" data-act-del="'+i+'">Sil</button></div>').join('')+'</div>';
 document.getElementById('newAction').onclick=()=>newAction();
 document.querySelectorAll('[data-act-edit]').forEach(x=>x.onclick=()=>editAction(+x.dataset.actEdit,b));
 document.querySelectorAll('[data-act-del]').forEach(x=>x.onclick=()=>{state.actions.splice(+x.dataset.actDel,1);sync('İşlem silindi');actions(b)});
}
function newAction(){
 let name=prompt('İşlem adı:','Yeni İşlem');if(!name)return;
 let type=prompt('Tip: message / page / module / reload','message')||'message';
 if(!['message','page','module','reload'].includes(type))type='message';
 let a={id:uid('act'),name,type,message:'İşlem tamamlandı',target:''};
 if(type==='message')a.message=prompt('Gösterilecek mesaj:','İşlem tamamlandı')||'İşlem tamamlandı';
 if(type==='page'||type==='module'){
  let t=actionTargets().filter(x=>x.value!=='none');
  if(!t.length){alert('Önce yayınlanmış bir sayfa veya modül oluştur.');return}
  let pick=prompt('Hedef numarası:\n'+t.map((x,i)=>i+' = '+x.label).join('\n'),'0'),idx=Number(pick);
  if(!Number.isInteger(idx)||!t[idx])idx=0;
  a.target=t[idx].value.split(':').slice(1).join(':');
 }
 state.actions.push(a);sync('Yeni işlem oluşturuldu');render('actions');
}
function editAction(i,b){
 let a=state.actions[i],t=actionTargets().filter(x=>x.value!=='none');if(!a)return;
 let name=prompt('İşlem adı:',a.name);if(name)a.name=name;
 if(a.type==='message')a.message=prompt('Mesaj:',a.message||'İşlem tamamlandı')||a.message;
 if(a.type==='page'||a.type==='module'){
  let pick=prompt('Hedef numarası:\n'+t.map((x,j)=>j+' = '+x.label).join('\n'),'0'),idx=Number(pick);
  if(Number.isInteger(idx)&&t[idx])a.target=t[idx].value.split(':').slice(1).join(':');
 }
 sync('İşlem güncellendi');actions(b);
}

function publishedPages(){return (state.pages||[]).filter(p=>p.published)}
function pageBySlug(slug){return publishedPages().find(p=>p.slug===slug)}
function formById(id){return (state.forms||[]).find(f=>f.id===id)}
function saveFormSubmission(formId,data){state.formData=state.formData||{};state.formData[formId]=state.formData[formId]||[];state.formData[formId].push({id:uid('submission'),at:new Date().toISOString(),data:clone(data)});sync('Form verisi kaydedildi')}
function renderFormHTML(f){if(!f)return '<div class="rpysDevMuted">Form seçilmemiş veya bulunamadı.</div>';return '<form data-dev-form="'+esc(f.id)+'"><h3>'+esc(f.name)+'</h3>'+(f.fields||[]).map(x=>'<div class="rpysDevField"><label>'+esc(x.label)+(x.required?' *':'')+'</label>'+(x.type==='textarea'?'<textarea class="rpysDevInput" name="'+esc(x.id)+'" rows="4" '+(x.required?'required':'')+'></textarea>':'<input class="rpysDevInput" type="'+(x.type==='number'?'number':x.type==='date'?'date':'text')+'" name="'+esc(x.id)+'" '+(x.required?'required':'')+'>')+'</div>').join('')+'<button class="rpysDevBtn primary" type="submit">Kaydet</button><span class="rpysDevMuted" data-form-msg style="margin-left:8px"></span></form>'}
function wireForms(root){(root||document).querySelectorAll('form[data-dev-form]').forEach(f=>f.onsubmit=e=>{e.preventDefault();let data={};new FormData(f).forEach((v,k)=>data[k]=v);saveFormSubmission(f.dataset.devForm,data);let m=f.querySelector('[data-form-msg]');if(m)m.textContent='Kaydedildi';})}
function renderPublishedPage(p){
 let root=document.getElementById('rpysPublishedPage');
 if(!root){root=document.createElement('div');root.id='rpysPublishedPage';document.body.appendChild(root)}
 root.innerHTML='<div style="position:fixed;inset:0;z-index:10040;background:#f5f8fb;overflow:auto"><div style="max-width:1200px;margin:auto;min-height:100vh;background:#fff;padding:18px"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dce5ee;padding-bottom:12px;margin-bottom:15px"><strong>RPYS</strong><button class="rpysDevBtn" id="closePublished">← RPYS Ana Sayfa</button></div><h1>'+esc(p.name)+'</h1><div id="publishedBlocks"></div></div></div>';
 let box=document.getElementById('publishedBlocks');
 (p.blocks||[]).forEach(x=>{
  let el=document.createElement('div');el.className='rpysDevBlock';
  let q=x.props||{}, html='';
  if(x.type==='heading')html='<h2>'+esc(q.text)+'</h2>';
  else if(x.type==='text')html='<p>'+esc(q.text)+'</p>';
  else if(x.type==='kpi')html='<div class="rpysDevCard"><span>'+esc(q.text)+'</span><h2>'+esc(q.value)+'</h2></div>';
  else if(x.type==='button')html='<button class="rpysDevBtn primary" data-dev-action="'+esc(q.actionId||'')+'">'+esc(q.text)+'</button>';
  else if(x.type==='form'){html=renderFormHTML(formById(q.formId));}
  else if(x.type==='query'){
    let qq=state.queries.find(z=>z.id===q.queryId);
    if(qq){let a=runq(qq),cols=qq.columns?.filter(Boolean)||fields(a).slice(0,6);
      html='<h3>'+esc(qq.name)+'</h3><div style="overflow:auto"><table class="rpysDevTable"><tr>'+cols.map(k=>'<th>'+esc(k)+'</th>').join('')+'</tr>'+a.map(row=>'<tr>'+cols.map(k=>'<td>'+esc(row[k])+'</td>').join('')+'</tr>').join('')+'</table></div>';
    } else html='<span class="rpysDevMuted">Sorgu seçilmemiş.</span>';
  }
  el.innerHTML=html;box.appendChild(el);
 });
 wireForms(box);wireActions(box);document.getElementById('closePublished').onclick=()=>{root.remove();history.pushState({},'',location.pathname+location.search.replace(/[?&]devpage=[^&]*/,'').replace(/^&/,'?'))};
}
function tryOpenPublished(){
 let m=location.search.match(/[?&]devpage=([^&]+)/); if(!m)return false;
 let p=pageBySlug(decodeURIComponent(m[1])); if(!p)return false;
 renderPublishedPage(p); return true;
}
function publishPage(p){p.published=true;p.publishedAt=new Date().toISOString();sync('Sayfa yayınlandı');toastDev('Sayfa yayınlandı: '+p.slug)}
function toastDev(s){let x=document.createElement('div');x.textContent=s;x.style='position:fixed;right:15px;bottom:70px;z-index:10120;background:#17365d;color:#fff;padding:10px 13px;border-radius:8px;font-size:11px';document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}

function pages(b){
 try{
  if(!b)return;
  state.pages=Array.isArray(state.pages)?state.pages:[];
  state.pages=state.pages.filter(p=>p&&typeof p==='object');
  state.pages.forEach(p=>{p.id=p.id||uid('page');p.name=p.name||'Yeni Sayfa';p.slug=p.slug||p.id;p.blocks=Array.isArray(p.blocks)?p.blocks:[]});
  let h='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="newPage">＋ Yeni Sayfa</button><span class="rpysDevMuted" style="margin-left:8px">Yayınlanan sayfalar: '+publishedPages().length+'</span><p class="rpysDevMuted">AI olmadan oluşturabileceğin sayfalar: tablo, KPI, metin, sorgu, form, buton.</p></div><div class="rpysDevList" style="margin-top:10px">';
  if(!state.pages.length)h+='<div class="rpysDevCard"><b>Henüz özel sayfa yok.</b><p class="rpysDevMuted">Yeni Sayfa butonuna basarak ilk sayfanı oluşturabilirsin.</p></div>';
  state.pages.forEach(p=>{h+='<div class="rpysDevItem"><div><b>'+esc(p.name)+'</b><div class="rpysDevMuted">/'+esc(p.slug)+' • '+p.blocks.length+' bileşen • '+(p.published?'YAYINDA':'Taslak')+'</div></div><div><button class="rpysDevBtn" data-edit="'+esc(p.id)+'">Düzenle</button><button class="rpysDevBtn primary" data-publish="'+esc(p.id)+'">Yayınla</button>'+(p.published?'<button class="rpysDevBtn" data-open="'+esc(p.slug)+'">Aç</button>':'')+'</div></div>'});
  b.innerHTML=h+'</div>';
  let add=document.getElementById('newPage');if(add)add.onclick=newPage;
  b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editPage(x.dataset.edit));
  b.querySelectorAll('[data-publish]').forEach(x=>x.onclick=()=>{let p=state.pages.find(z=>z.id===x.dataset.publish);if(p){publishPage(p);render('pages')}});
  b.querySelectorAll('[data-open]').forEach(x=>x.onclick=()=>{location.href=location.pathname+'?devpage='+encodeURIComponent(x.dataset.open)});
 }catch(e){
  b.innerHTML='<div class="rpysDevCard"><b>Sayfalar yüklenirken hata oluştu.</b><p class="rpysDevMuted">'+esc(e&&e.message||e)+'</p><button class="rpysDevBtn primary" id="devRepairPages">Sayfa verisini sıfırla ve devam et</button></div>';
  let x=document.getElementById('devRepairPages');if(x)x.onclick=()=>{state.pages=[];sync('Bozuk sayfa verisi temizlendi');render('pages')};
 }
}
function editPage(id){let p=state.pages.find(x=>x.id===id);if(!p)return;let b=document.getElementById('rpysDevBody');b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn" id="back">← Geri</button><button class="rpysDevBtn primary" id="savep">💾 Kaydet</button><div class="rpysDevField"><label>Sayfa adı</label><input class="rpysDevInput" id="pn" value="'+esc(p.name)+'"></div><div class="rpysDevField"><label>Adres</label><input class="rpysDevInput" id="ps" value="'+esc(p.slug)+'"></div><p class="rpysDevMuted">Bileşene dokun → sağdaki özelliklerden düzenle. ↑ ↓ ile sırayı değiştir.</p></div><div class="rpysDevBuilder" style="margin-top:10px"><div class="rpysDevPalette"><b>Bileşenler</b>'+['heading','text','kpi','query','form','button'].map(x=>'<div class="rpysDevPaletteItem" data-add="'+x+'">'+x+'</div>').join('')+'</div><div class="rpysDevCanvas"><div class="rpysDevPageCanvas" id="pc">'+p.blocks.map((x,i)=>block(x,i,p)).join('')+'</div></div><div class="rpysDevProps" id="devProps"><b>Bileşen özellikleri</b><p class="rpysDevMuted">Bir bileşene dokununca temel özellikleri düzenlenir.</p></div></div>';document.getElementById('back').onclick=()=>render('pages');document.getElementById('savep').onclick=()=>{p.name=document.getElementById('pn').value||'Yeni Sayfa';p.slug=(document.getElementById('ps').value||uid('sayfa')).toLowerCase().replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ-]+/gi,'-');sync('Özel sayfa kaydedildi');alert('Sayfa kaydedildi.');render('pages')};document.querySelectorAll('[data-add]').forEach(x=>x.onclick=()=>{let t=x.dataset.add,props={};if(t==='heading')props={text:'Yeni Başlık'};if(t==='text')props={text:'Yeni metin'};if(t==='kpi')props={text:'Gösterge',value:'0'};if(t==='query')props={queryId:state.queries[0]?.id||''};if(t==='form')props={title:'Yeni Form'};if(t==='button')props={text:'Buton'};p.blocks.push({id:uid('b'),type:t,props:props});editPage(id)});document.querySelectorAll('[data-del]').forEach(x=>x.onclick=()=>{p.blocks.splice(Number(x.dataset.del),1);sync('Bileşen silindi');editPage(id)});document.querySelectorAll('[data-up]').forEach(x=>x.onclick=()=>{let i=Number(x.dataset.up);if(i>0){[p.blocks[i-1],p.blocks[i]]=[p.blocks[i],p.blocks[i-1]];editPage(id)}});document.querySelectorAll('[data-down]').forEach(x=>x.onclick=()=>{let i=Number(x.dataset.down);if(i<p.blocks.length-1){[p.blocks[i+1],p.blocks[i]]=[p.blocks[i],p.blocks[i+1]];editPage(id)}});document.querySelectorAll('[data-select-block]').forEach(x=>x.onclick=()=>propsEditor(p,Number(x.dataset.selectBlock)))};function propsEditor(p,i){let x=p.blocks[i],q=x.props||{},d=document.getElementById('devProps');if(!x||!d)return;let labels={heading:'Başlık',text:'Metin',kpi:'KPI',button:'Buton',form:'Form',query:'Sorgu'};let body='<b>'+labels[x.type]+' özellikleri</b><div class="rpysDevField"><label>Metin / Başlık</label><input class="rpysDevInput" id="ppText" value="'+esc(q.text||q.title||'')+'"></div>';if(x.type==='kpi')body+='<div class="rpysDevField"><label>Değer</label><input class="rpysDevInput" id="ppValue" value="'+esc(q.value||'')+'"></div>';if(x.type==='button')body+='<div class="rpysDevField"><label>İşlem</label><select class="rpysDevSelect" id="ppAction"><option value="">İşlem yok</option>'+actionOptions(q.actionId)+'</select></div>';if(x.type==='query')body='<b>Sorgu bileşeni</b><div class="rpysDevField"><label>Sorgu</label><select class="rpysDevSelect" id="ppQuery">'+state.queries.map(v=>'<option value="'+esc(v.id)+'" '+(v.id===q.queryId?'selected':'')+'>'+esc(v.name)+'</option>').join('')+'</select></div>';body+='<button class="rpysDevBtn primary" id="ppSave">Uygula</button>';d.innerHTML=body;document.getElementById('ppSave').onclick=()=>{let t=document.getElementById('ppText');if(x.type==='query')q.queryId=document.getElementById('ppQuery').value;else if(x.type==='form')q.title=t.value;else q.text=t.value;if(x.type==='button')q.actionId=document.getElementById('ppAction').value;if(x.type==='kpi')q.value=document.getElementById('ppValue').value;x.props=q;sync('Bileşen özelliği güncellendi');editPage(p.id);propsEditor(p,i)}}function newPage(){let p={id:uid('p'),name:'Yeni Sayfa',slug:'yeni-sayfa',blocks:[]};state.pages.push(p);sync('Yeni sayfa oluşturuldu');editPage(p.id)};
function queries(b){
 state.queries=state.queries||[];
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="newq">＋ Yeni Sorgu</button><p class="rpysDevMuted">Sorgu Stüdyosu: kaynak seç, birden fazla filtre ekle, sıralama belirle ve sonucu canlı önizle.</p></div><div class="rpysDevList" style="margin-top:10px">'+state.queries.map(q=>'<div class="rpysDevItem"><div><b>'+esc(q.name)+'</b><div class="rpysDevMuted">'+esc(q.source)+' • '+runq(q).length+' sonuç • '+((q.conditions||[]).length)+' filtre</div></div><button class="rpysDevBtn" data-q="'+esc(q.id)+'">Stüdyoyu Aç</button></div>').join('')+'</div>';
 document.getElementById('newq').onclick=newQuery;
 document.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>editQuery(x.dataset.q));
}
function newQuery(){let q={id:uid('q'),name:'Yeni Sorgu',source:sources()[0]||'staff',columns:[],conditions:[],sort:{field:'',dir:'asc'},limit:100};state.queries.push(q);sync('Yeni sorgu oluşturuldu');editQuery(q.id)}
function queryOpOptions(v){return ['=','!=','contains','starts','ends','>','<','>=','<='].map(x=>'<option '+(x===v?'selected':'')+'>'+x+'</option>').join('')}
function queryFieldOptions(fs,v){return '<option value="">Alan seç...</option>'+fs.map(x=>'<option value="'+esc(x)+'" '+(x===v?'selected':'')+'>'+esc(x)+'</option>').join('')}
function queryPreviewHTML(q){let a=runq(q),c=q.columns?.filter(Boolean)||fields(a).slice(0,6);return '<div class="rpysDevMuted">'+a.length+' sonuç</div><div style="overflow:auto"><table class="rpysDevTable"><tr>'+c.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr>'+a.slice(0,20).map(r=>'<tr>'+c.map(x=>'<td>'+esc(r[x])+'</td>').join('')+'</tr>').join('')+'</table></div>'}
function editQuery(id){
 let q=state.queries.find(x=>x.id===id);if(!q)return;
 q.conditions=q.conditions||[];q.sort=q.sort||{field:'',dir:'asc'};
 let b=document.getElementById('rpysDevBody'),a=rows(q.source),fs=fields(a);
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn" id="backq">← Geri</button> <button class="rpysDevBtn primary" id="saveq">💾 Kaydet</button><div class="rpysDevField"><label>Sorgu adı</label><input class="rpysDevInput" id="qn" value="'+esc(q.name)+'"></div><div class="rpysDevField"><label>Veri kaynağı</label><select class="rpysDevSelect" id="qs">'+sources().map(x=>'<option value="'+esc(x)+'" '+(x===q.source?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div></div>'+
 '<div class="rpysDevGrid" style="margin-top:10px"><div class="rpysDevCard"><b>Filtreler</b><p class="rpysDevMuted">Birden fazla filtre ekleyebilirsin. Filtreler birlikte (VE) uygulanır.</p><div id="qconds"></div><button class="rpysDevBtn primary" id="addcond">＋ Filtre ekle</button></div>'+
 '<div class="rpysDevCard"><b>Çıktı ve sıralama</b><div class="rpysDevField"><label>Gösterilecek alanlar (virgülle)</label><input class="rpysDevInput" id="qc" value="'+esc((q.columns||[]).join(','))+'"><div class="rpysDevMuted">Boş bırakırsan ilk 6 alan otomatik gösterilir.</div></div><div class="rpysDevField"><label>Sıralama alanı</label><select class="rpysDevSelect" id="qsort">'+queryFieldOptions(fs,q.sort.field)+'</select></div><div class="rpysDevField"><label>Sıralama yönü</label><select class="rpysDevSelect" id="qdir"><option value="asc" '+(q.sort.dir!=='desc'?'selected':'')+'>Artan</option><option value="desc" '+(q.sort.dir==='desc'?'selected':'')+'>Azalan</option></select></div><div class="rpysDevField"><label>Sonuç limiti (1–500)</label><input class="rpysDevInput" id="ql" type="number" min="1" max="500" value="'+(q.limit||100)+'"></div></div></div>'+
 '<div class="rpysDevCard" style="margin-top:10px"><b>Canlı önizleme</b><div id="qp" style="margin-top:8px">'+queryPreviewHTML(q)+'</div></div>';
 document.getElementById('backq').onclick=()=>render('queries');
 const renderConds=()=>{
   let box=document.getElementById('qconds');box.innerHTML=q.conditions.map((c,i)=>'<div class="rpysDevCard" style="margin:6px 0;padding:8px"><div class="rpysDevGrid"><select class="rpysDevSelect" data-cfield="'+i+'">'+queryFieldOptions(fields(rows(q.source)),c.field)+'</select><select class="rpysDevSelect" data-cop="'+i+'">'+queryOpOptions(c.op||'contains')+'</select></div><div style="display:flex;gap:6px;margin-top:6px"><input class="rpysDevInput" data-cval="'+i+'" value="'+esc(c.value??'')+'"><button class="rpysDevBtn" data-cdel="'+i+'">Sil</button></div></div>').join('')||'<div class="rpysDevMuted">Henüz filtre yok.</div>';
   box.querySelectorAll('[data-cfield]').forEach(x=>x.onchange=()=>{q.conditions[+x.dataset.cfield].field=x.value;refreshPreview()});
   box.querySelectorAll('[data-cop]').forEach(x=>x.onchange=()=>{q.conditions[+x.dataset.cop].op=x.value;refreshPreview()});
   box.querySelectorAll('[data-cval]').forEach(x=>x.oninput=()=>{q.conditions[+x.dataset.cval].value=x.value;refreshPreview()});
   box.querySelectorAll('[data-cdel]').forEach(x=>x.onclick=()=>{q.conditions.splice(+x.dataset.cdel,1);renderConds();refreshPreview()});
 };
 const refreshPreview=()=>{q.source=document.getElementById('qs').value;q.columns=document.getElementById('qc').value.split(',').map(x=>x.trim()).filter(Boolean);q.sort={field:document.getElementById('qsort').value,dir:document.getElementById('qdir').value};q.limit=Math.min(Math.max(Number(document.getElementById('ql').value)||100,1),500);document.getElementById('qp').innerHTML=queryPreviewHTML(q)};
 renderConds();
 document.getElementById('addcond').onclick=()=>{q.conditions.push({field:fields(rows(q.source))[0]||'',op:'contains',value:''});renderConds();refreshPreview()};
 document.getElementById('qs').onchange=()=>{q.source=document.getElementById('qs').value;q.conditions=q.conditions.map(c=>({...c,field:fields(rows(q.source)).includes(c.field)?c.field:''}));let sf=fields(rows(q.source));document.getElementById('qsort').innerHTML=queryFieldOptions(sf,q.sort.field);renderConds();refreshPreview()};
 ['qc','qsort','qdir','ql'].forEach(id=>document.getElementById(id).oninput=refreshPreview);
 document.getElementById('saveq').onclick=()=>{q.name=document.getElementById('qn').value||'Yeni Sorgu';refreshPreview();sync('Sorgu güncellendi');alert('Sorgu kaydedildi.');render('queries')};
}
function preview(q){return queryPreviewHTML(q)}
function forms(b){b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="nf">＋ Yeni Form</button><span class="rpysDevMuted" style="margin-left:8px">Formlar artık alanlarıyla birlikte oluşturulabilir.</span></div><div class="rpysDevList" style="margin-top:10px">'+state.forms.map(x=>'<div class="rpysDevItem"><div><b>'+esc(x.name)+'</b><div class="rpysDevMuted">'+x.fields.length+' alan • '+(x.fields.map(f=>f.label||f).join(', '))+'</div></div><button class="rpysDevBtn" data-fe="'+x.id+'">Düzenle</button></div>').join('')+'</div>';document.getElementById('nf').onclick=()=>{let n=prompt('Form adı:','Yeni Form');if(n){let f={id:uid('f'),name:n,fields:[{id:uid('fld'),label:'Ad Soyad',type:'text',required:true},{id:uid('fld'),label:'Açıklama',type:'textarea',required:false}]};state.forms.push(f);sync('Form oluşturuldu');editForm(f.id)}};document.querySelectorAll('[data-fe]').forEach(x=>x.onclick=()=>editForm(x.dataset.fe))}function editForm(id){let f=state.forms.find(x=>x.id===id);if(!f)return;let b=document.getElementById('rpysDevBody');b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn" id="fb">← Geri</button> <button class="rpysDevBtn primary" id="fs">💾 Kaydet</button><div class="rpysDevField"><label>Form adı</label><input class="rpysDevInput" id="fn" value="'+esc(f.name)+'"></div></div><div class="rpysDevGrid" style="margin-top:10px"><div class="rpysDevCard"><b>Alanlar</b><div id="fl" class="rpysDevList" style="margin-top:8px">'+f.fields.map((x,i)=>'<div class="rpysDevItem"><div><b>'+esc(x.label)+'</b><div class="rpysDevMuted">'+esc(x.type)+(x.required?' • zorunlu':'')+'</div></div><div><button class="rpysDevBtn" data-fup="'+i+'">↑</button><button class="rpysDevBtn" data-fdown="'+i+'">↓</button><button class="rpysDevBtn" data-fedit="'+i+'">Düzenle</button><button class="rpysDevBtn" data-fdel="'+i+'">Sil</button></div></div>').join('')+'</div><button class="rpysDevBtn primary" id="fa" style="margin-top:8px">＋ Alan ekle</button></div><div class="rpysDevCard"><b>Canlı önizleme</b><div id="fp" style="margin-top:8px">'+f.fields.map(x=>'<div class="rpysDevField"><label>'+esc(x.label)+(x.required?' *':'')+'</label>'+(x.type==='textarea'?'<textarea class="rpysDevInput" rows="4"></textarea>':x.type==='number'?'<input class="rpysDevInput" type="number">':x.type==='date'?'<input class="rpysDevInput" type="date">':'<input class="rpysDevInput" type="text">')+'</div>').join('')+'<button class="rpysDevBtn primary">Kaydet</button></div></div>';document.getElementById('fb').onclick=()=>render('forms');document.getElementById('fs').onclick=()=>{f.name=document.getElementById('fn').value||'Yeni Form';sync('Form kaydedildi');render('forms')};document.getElementById('fa').onclick=()=>{let label=prompt('Alan adı:','Yeni Alan');if(label){let type=prompt('Tip: text / textarea / number / date','text')||'text';if(!['text','textarea','number','date'].includes(type))type='text';f.fields.push({id:uid('fld'),label,type,required:false});sync('Form alanı eklendi');editForm(id)}};document.querySelectorAll('[data-fdel]').forEach(x=>x.onclick=()=>{f.fields.splice(Number(x.dataset.fdel),1);sync('Form alanı silindi');editForm(id)});document.querySelectorAll('[data-fup]').forEach(x=>x.onclick=()=>{let i=Number(x.dataset.fup);if(i>0){[f.fields[i-1],f.fields[i]]=[f.fields[i],f.fields[i-1]];editForm(id)}});document.querySelectorAll('[data-fdown]').forEach(x=>x.onclick=()=>{let i=Number(x.dataset.fdown);if(i<f.fields.length-1){[f.fields[i+1],f.fields[i]]=[f.fields[i],f.fields[i+1]];editForm(id)}});document.querySelectorAll('[data-fedit]').forEach(x=>x.onclick=()=>{let i=Number(x.dataset.fedit),v=f.fields[i],label=prompt('Alan adı:',v.label);if(label){v.label=label;v.required=confirm('Bu alan zorunlu olsun mu?');sync('Form alanı güncellendi');editForm(id)}})}
function moduleById(id){return (state.modules||[]).find(m=>m.id===id)}
function moduleRows(m){return (m&&m.records)||[]}
function saveModule(m){state.modules=state.modules||[];sync('Modül kaydedildi')}
function renderModuleHTML(m){
 if(!m)return '<div class="rpysDevMuted">Modül bulunamadı.</div>';
 let rows=moduleRows(m), fs=m.fields||[];
 let head=fs.map(f=>'<th>'+esc(f.label)+'</th>').join('');
 let body=rows.map((r,i)=>'<tr>'+fs.map(f=>'<td>'+esc(r[f.id])+'</td>').join('')+'<td><button class="rpysDevBtn" data-mod-edit="'+i+'">Düzenle</button> <button class="rpysDevBtn" data-mod-del="'+i+'">Sil</button></td></tr>').join('');
 return '<div class="rpysDevCard"><h2>'+esc(m.name)+'</h2><button class="rpysDevBtn primary" data-mod-add>＋ Yeni Kayıt</button><span class="rpysDevMuted" style="margin-left:8px">'+rows.length+' kayıt</span><div style="overflow:auto;margin-top:10px"><table class="rpysDevTable"><tr>'+head+'<th>İşlem</th></tr>'+body+'</table></div><div id="modForm" style="margin-top:10px"></div></div>';
}
function moduleFormHTML(m,idx){
 let r=idx==null?{}:clone(moduleRows(m)[idx]||{});
 return '<form id="devModuleForm" class="rpysDevCard"><b>'+(idx==null?'Yeni kayıt':'Kayıt düzenle')+'</b>'+(m.fields||[]).map(f=>{
   let v=esc(r[f.id]||'');
   if(f.type==='textarea')return '<div class="rpysDevField"><label>'+esc(f.label)+(f.required?' *':'')+'</label><textarea class="rpysDevInput" name="'+esc(f.id)+'" rows="3" '+(f.required?'required':'')+'>'+v+'</textarea></div>';
   if(f.type==='select')return '<div class="rpysDevField"><label>'+esc(f.label)+(f.required?' *':'')+'</label><select class="rpysDevSelect" name="'+esc(f.id)+'" '+(f.required?'required':'')+'><option value="">Seçiniz</option>'+((f.options||[]).map(o=>'<option '+(String(o)===String(r[f.id])?'selected':'')+'>'+esc(o)+'</option>').join(''))+'</select></div>';
   return '<div class="rpysDevField"><label>'+esc(f.label)+(f.required?' *':'')+'</label><input class="rpysDevInput" name="'+esc(f.id)+'" type="'+(f.type==='number'?'number':f.type==='date'?'date':'text')+'" value="'+v+'" '+(f.required?'required':'')+'></div>';
 }).join('')+'<button class="rpysDevBtn primary" type="submit">Kaydet</button> <button class="rpysDevBtn" type="button" id="modCancel">Vazgeç</button></form>';
}
function wireModuleRuntime(root,m){
 let form=(root||document).querySelector('#devModuleForm');
 if(form)form.onsubmit=e=>{e.preventDefault();let data={};new FormData(form).forEach((v,k)=>data[k]=v);let idx=Number(form.dataset.idx);if(Number.isInteger(idx)&&idx>=0)m.records[idx]=data;else m.records.push(data);sync('Modül kaydı kaydedildi');editModuleRuntime(m.id)};
 let add=(root||document).querySelector('[data-mod-add]');if(add)add.onclick=()=>{let box=document.querySelector('#modForm');box.innerHTML=moduleFormHTML(m,null);wireModuleRuntime(box,m)};
 (root||document).querySelectorAll('[data-mod-edit]').forEach(x=>x.onclick=()=>{let box=document.querySelector('#modForm');box.innerHTML=moduleFormHTML(m,Number(x.dataset.modEdit));let ff=box.querySelector('#devModuleForm');ff.dataset.idx=x.dataset.modEdit;wireModuleRuntime(box,m)});
 (root||document).querySelectorAll('[data-mod-del]').forEach(x=>x.onclick=()=>{if(confirm('Bu kayıt silinsin mi?')){m.records.splice(Number(x.dataset.modDel),1);sync('Modül kaydı silindi');editModuleRuntime(m.id)}});
 let cancel=(root||document).querySelector('#modCancel');if(cancel)cancel.onclick=()=>{document.querySelector('#modForm').innerHTML=''};
}
function editModuleRuntime(id){
 let m=moduleById(id),b=document.getElementById('rpysDevBody');if(!m)return;
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn" id="mrBack">← Modüller</button></div><div style="margin-top:10px" id="moduleRuntime">'+renderModuleHTML(m)+'</div>';
 document.getElementById('mrBack').onclick=()=>render('modules');wireModuleRuntime(b,m);
}
function modules(b){
 state.modules=state.modules||[];
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="newModule">＋ Yeni Modül</button><p class="rpysDevMuted">AI olmadan kendi veri modülünü oluştur: alanlarını tanımla, kayıt ekle/düzenle/sil. Veriler RPYS çekirdek tablolarından ayrı tutulur.</p></div><div class="rpysDevList" style="margin-top:10px">'+state.modules.map(m=>'<div class="rpysDevItem"><div><b>'+esc(m.name)+'</b><div class="rpysDevMuted">/'+esc(m.slug)+' • '+(m.fields||[]).length+' alan • '+(m.records||[]).length+' kayıt</div></div><button class="rpysDevBtn" data-me="'+m.id+'">Alanları Düzenle</button><button class="rpysDevBtn primary" data-mr="'+m.id+'">Kayıtlar</button></div>').join('')+'</div>';
 document.getElementById('newModule').onclick=()=>{let name=prompt('Modül adı:','Yeni Modül');if(!name)return;let m={id:uid('m'),name,slug:name.toLowerCase().replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/gi,'-'),fields:[{id:uid('fld'),label:'Ad',type:'text',required:true}],records:[]};state.modules.push(m);sync('Modül oluşturuldu');editModule(m.id)};
 document.querySelectorAll('[data-me]').forEach(x=>x.onclick=()=>editModule(x.dataset.me));document.querySelectorAll('[data-mr]').forEach(x=>x.onclick=()=>editModuleRuntime(x.dataset.mr));
}
function editModule(id){
 let m=moduleById(id),b=document.getElementById('rpysDevBody');if(!m)return;
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn" id="mb">← Geri</button> <button class="rpysDevBtn primary" id="ms">💾 Kaydet</button><div class="rpysDevField"><label>Modül adı</label><input class="rpysDevInput" id="mn" value="'+esc(m.name)+'"></div><div class="rpysDevField"><label>Adres</label><input class="rpysDevInput" id="mslug" value="'+esc(m.slug)+'"></div></div><div class="rpysDevGrid" style="margin-top:10px"><div class="rpysDevCard"><b>Alanlar</b><div id="mfl" class="rpysDevList" style="margin-top:8px">'+m.fields.map((f,i)=>'<div class="rpysDevItem"><div><b>'+esc(f.label)+'</b><div class="rpysDevMuted">'+esc(f.type)+(f.required?' • zorunlu':'')+'</div></div><div><button class="rpysDevBtn" data-mup="'+i+'">↑</button><button class="rpysDevBtn" data-mdown="'+i+'">↓</button><button class="rpysDevBtn" data-medit="'+i+'">Düzenle</button><button class="rpysDevBtn" data-mdel="'+i+'">Sil</button></div></div>').join('')+'</div><button class="rpysDevBtn primary" id="madd" style="margin-top:8px">＋ Alan ekle</button></div><div class="rpysDevCard"><b>Canlı önizleme</b><div style="margin-top:8px">'+moduleFormHTML(m,null)+'</div></div></div>';
 document.getElementById('mb').onclick=()=>render('modules');document.getElementById('ms').onclick=()=>{m.name=document.getElementById('mn').value||'Yeni Modül';m.slug=(document.getElementById('mslug').value||uid('mod')).toLowerCase().replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ-]+/gi,'-');saveModule(m);render('modules')};
 document.getElementById('madd').onclick=()=>{let label=prompt('Alan adı:','Yeni Alan');if(!label)return;let type=prompt('Tip: text / textarea / number / date / select','text')||'text';if(!['text','textarea','number','date','select'].includes(type))type='text';let f={id:uid('fld'),label,type,required:false};if(type==='select')f.options=(prompt('Seçenekler (virgülle):','Seçenek 1,Seçenek 2')||'').split(',').map(x=>x.trim()).filter(Boolean);m.fields.push(f);sync('Modül alanı eklendi');editModule(id)};
 document.querySelectorAll('[data-mdel]').forEach(x=>x.onclick=()=>{m.fields.splice(Number(x.dataset.mdel),1);sync('Modül alanı silindi');editModule(id)});document.querySelectorAll('[data-mup]').forEach(x=>x.onclick=()=>{let i=+x.dataset.mup;if(i>0){[m.fields[i-1],m.fields[i]]=[m.fields[i],m.fields[i-1]];editModule(id)}});document.querySelectorAll('[data-mdown]').forEach(x=>x.onclick=()=>{let i=+x.dataset.mdown;if(i<m.fields.length-1){[m.fields[i+1],m.fields[i]]=[m.fields[i],m.fields[i+1]];editModule(id)}});document.querySelectorAll('[data-medit]').forEach(x=>x.onclick=()=>{let f=m.fields[+x.dataset.medit],label=prompt('Alan adı:',f.label);if(label){f.label=label;f.required=confirm('Bu alan zorunlu olsun mu?');if(f.type==='select')f.options=(prompt('Seçenekler (virgülle):',(f.options||[]).join(','))||'').split(',').map(x=>x.trim()).filter(Boolean);sync('Modül alanı güncellendi');editModule(id)}});
}
function menuItems(){state.menu=state.menu||[];return state.menu}
function menu(b){
 let items=menuItems();
 b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="newMenu">＋ Menü öğesi</button><p class="rpysDevMuted">Oluşturduğun özel sayfa veya modülü RPYS içinde menü bağlantısı olarak yayınla. Sıra ve görünürlük burada yönetilir.</p></div><div class="rpysDevList" style="margin-top:10px">'+items.map((x,i)=>'<div class="rpysDevItem"><div><b>'+esc(x.label)+'</b><div class="rpysDevMuted">'+esc(x.type)+' • '+esc(x.target)+' • '+(x.visible?'Görünür':'Gizli')+'</div></div><div><button class="rpysDevBtn" data-mupmenu="'+i+'">↑</button><button class="rpysDevBtn" data-mdnmenu="'+i+'">↓</button><button class="rpysDevBtn" data-medmenu="'+i+'">Düzenle</button><button class="rpysDevBtn" data-togmenu="'+i+'">'+(x.visible?'Gizle':'Göster')+'</button><button class="rpysDevBtn" data-delmenu="'+i+'">Sil</button></div></div>').join('')+'</div>';
 document.getElementById('newMenu').onclick=()=>newMenu();
 document.querySelectorAll('[data-mupmenu]').forEach(x=>x.onclick=()=>{let i=+x.dataset.mupmenu;if(i>0){[items[i-1],items[i]]=[items[i],items[i-1]];sync('Menü sırası değişti');menu(b)}});
 document.querySelectorAll('[data-mdnmenu]').forEach(x=>x.onclick=()=>{let i=+x.dataset.mdnmenu;if(i<items.length-1){[items[i+1],items[i]]=[items[i],items[i+1]];sync('Menü sırası değişti');menu(b)}});
 document.querySelectorAll('[data-togmenu]').forEach(x=>x.onclick=()=>{items[+x.dataset.togmenu].visible=!items[+x.dataset.togmenu].visible;sync('Menü görünürlüğü değişti');menu(b)});
 document.querySelectorAll('[data-delmenu]').forEach(x=>x.onclick=()=>{items.splice(+x.dataset.delmenu,1);sync('Menü öğesi silindi');menu(b)});
 document.querySelectorAll('[data-medmenu]').forEach(x=>x.onclick=()=>editMenu(+x.dataset.medmenu,b));
}
function menuTargets(){
 let a=[];
 publishedPages().forEach(p=>a.push({value:'page:'+p.slug,label:'Sayfa: '+p.name}));
 (state.modules||[]).forEach(m=>a.push({value:'module:'+m.id,label:'Modül: '+m.name}));
 return a;
}
function newMenu(){
 let targets=menuTargets();if(!targets.length){alert('Önce bir sayfa yayınla veya modül oluştur.');return}
 let label=prompt('Menü adı:',targets[0].label.split(': ')[1]||'Yeni Menü');if(!label)return;
 let t=prompt('Hedef numarası:\n'+targets.map((x,i)=>i+' = '+x.label).join('\n'),'0');let idx=Number(t);if(!Number.isInteger(idx)||!targets[idx])idx=0;
 state.menu=state.menu||[];state.menu.push({id:uid('menu'),label,type:targets[idx].value.split(':')[0],target:targets[idx].value.slice(targets[idx].value.indexOf(':')+1),visible:true});
 sync('Menü öğesi oluşturuldu');render('menu');
}
function editMenu(i,b){
 let x=menuItems()[i],targets=menuTargets();if(!x)return;
 let label=prompt('Menü adı:',x.label);if(label)x.label=label;
 let t=prompt('Hedef numarası:\n'+targets.map((z,j)=>j+' = '+z.label).join('\n'),'0');let idx=Number(t);if(Number.isInteger(idx)&&targets[idx]){x.type=targets[idx].value.split(':')[0];x.target=targets[idx].value.slice(targets[idx].value.indexOf(':')+1)}
 sync('Menü öğesi güncellendi');menu(b);
}
function renderCustomNavigation(){
 let items=menuItems().filter(x=>x.visible),root=document.getElementById('rpysCustomMenu');
 if(!root){root=document.createElement('div');root.id='rpysCustomMenu';root.style='position:fixed;left:12px;bottom:16px;z-index:10055;display:flex;gap:6px;flex-wrap:wrap;max-width:calc(100vw - 24px)';document.body.appendChild(root)}
 root.innerHTML=items.map(x=>'<button class="rpysDevBtn" data-custom-nav="'+esc(x.id)+'">'+esc(x.label)+'</button>').join('');
 root.querySelectorAll('[data-custom-nav]').forEach(btn=>btn.onclick=()=>{let x=items.find(z=>z.id===btn.dataset.customNav);if(x)openMenuTarget(x)});
}
function renderPublishedModule(m){
 let root=document.getElementById('rpysPublishedModule');
 if(!root){root=document.createElement('div');root.id='rpysPublishedModule';document.body.appendChild(root)}
 root.innerHTML='<div style="position:fixed;inset:0;z-index:10041;background:#f5f8fb;overflow:auto"><div style="max-width:1200px;margin:auto;min-height:100vh;background:#fff;padding:18px"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dce5ee;padding-bottom:12px;margin-bottom:15px"><strong>RPYS</strong><button class="rpysDevBtn" id="closePublishedModule">← RPYS Ana Sayfa</button></div><h1>'+esc(m.name)+'</h1><div id="publishedModuleBody"></div></div></div>';
 let box=document.getElementById('publishedModuleBody');
 box.innerHTML=renderModuleHTML(m);
 wireModuleRuntime(box,m);
 document.getElementById('closePublishedModule').onclick=()=>{root.remove();history.pushState({},'',location.pathname)};
}
function tryOpenPublishedModule(){
 let m=location.search.match(/[?&]devmodule=([^&]+)/);if(!m)return false;
 let mod=moduleById(decodeURIComponent(m[1]));if(!mod)return false;
 renderPublishedModule(mod);return true;
}

function openMenuTarget(x){
 if(x.type==='page'){location.href=location.pathname+'?devpage='+encodeURIComponent(x.target);return}
 if(x.type==='module'){location.href=location.pathname+'?devmodule='+encodeURIComponent(x.target);return}
}
function rules(b){b.innerHTML='<div class="rpysDevCard"><button class="rpysDevBtn primary" id="nr">＋ Yeni Kural</button><p class="rpysDevMuted">Kurallar özel geliştirme katmanında tutulur. 6.1.1 dağıtım motoruna doğrudan müdahale etmez.</p></div><div class="rpysDevList" style="margin-top:10px">'+state.rules.map(x=>'<div class="rpysDevItem"><b>'+esc(x.name)+'</b><span class="rpysDevMuted">EĞER '+esc(x.when)+' → '+esc(x.then)+'</span></div>').join('')+'</div>';document.getElementById('nr').onclick=()=>{let n=prompt('Kural adı:','Yeni Kural');if(n){state.rules.push({id:uid('r'),name:n,when:prompt('EĞER:','Birim = BT')||'',then:prompt('O ZAMAN:','Göster')||''});sync('Kural oluşturuldu');render('rules')}}};function data(b){b.innerHTML='<div class="rpysDevGrid"><div class="rpysDevCard"><b>Okunabilir veri kaynakları</b><div class="rpysDevList" style="margin-top:8px">'+sources().map(x=>'<div class="rpysDevItem"><b>'+esc(x)+'</b><span class="rpysDevMuted">'+rows(x).length+' kayıt</span></div>').join('')+'</div></div><div class="rpysDevCard"><b>Koruma</b><p class="rpysDevMuted">Bu katman SQL çalıştırmaz, veri silmez ve 6.1.1 motorunu değiştirmez. Sorgular yalnızca okuma amaçlıdır.</p></div></div>'};function backup(b){b.innerHTML='<div class="rpysDevCard"><b>Geliştirme Merkezi yedeği</b><p class="rpysDevMuted">'+state.history.length+' sürüm geçmişi.</p><button class="rpysDevBtn primary" id="exp">JSON dışa aktar</button><input class="rpysDevInput" id="imp" type="file" accept="application/json" style="margin-top:8px"></div>';document.getElementById('exp').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='rpys-gelistirme-merkezi.json';a.click()};document.getElementById('imp').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);sync('Geliştirme Merkezi içe aktarma');render('pages');alert('Yedek yüklendi.')}catch(x){alert('Yedek okunamadı')}};r.readAsText(f)}};
function devGuide(b){b.innerHTML='<div class="rpysDevGrid"><div class="rpysDevCard"><h3>📘 Geliştirme Merkezi</h3><p>Bu alanla RPYS içinde AI veya token kullanmadan özel sayfa, sorgu, form ve modül oluşturabilirsin.</p></div><div class="rpysDevCard"><b>📄 Sayfa</b><p class="rpysDevMuted">Özel ekran oluştur. Bileşen ekle, düzenle, sırala ve yayınla.</p><b>🔎 Sorgu</b><p class="rpysDevMuted">Verileri filtrele, sırala ve sonuçları sayfalarda göster.</p><b>📝 Form</b><p class="rpysDevMuted">Kendi veri giriş formlarını oluştur.</p><b>🧱 Modül</b><p class="rpysDevMuted">RPYS çekirdek verisinden ayrı özel kayıt tabloları oluştur.</p></div><div class="rpysDevCard"><b>⚠️ Önemli</b><p class="rpysDevMuted">Geliştirme Merkezi RPYS 6.1.1 dağıtım motoruna doğrudan müdahale etmez. Yine de düzenli olarak ↩️ Yedek bölümünden JSON yedeği al.</p></div></div>'}
function block(x,i){let p=x.props||{};let h=x.type==='heading'?'<h2>'+esc(p.text)+'</h2>':x.type==='text'?'<p>'+esc(p.text)+'</p>':x.type==='kpi'?'<div class="rpysDevCard"><span>'+esc(p.text)+'</span><h2>'+esc(p.value)+'</h2></div>':x.type==='button'?'<button class="rpysDevBtn primary">'+esc(p.text)+(p.actionId?' ⚡':'')+'</button>':x.type==='form'?'<div class="rpysDevCard"><b>'+esc(p.title||'Form')+'</b></div>':x.type==='query'?'<div class="rpysDevCard">Canlı sorgu: '+esc(p.queryId||'seçilmedi')+'</div>':'<div>'+x.type+'</div>';return '<div class="rpysDevBlock" data-select-block="'+i+'">'+h+' <button class="rpysDevBtn" data-up="'+i+'">↑</button><button class="rpysDevBtn" data-down="'+i+'">↓</button><button class="rpysDevBtn" data-del="'+i+'">Sil</button></div>'}
function boot(){if(!document.body)return;build();renderCustomNavigation();setTimeout(()=>{if(tryOpenPublished())return;tryOpenPublishedModule()},50)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,250);window.rpysDevCenter={open:open,close:close,state:()=>clone(state),newPage:newPage,newQuery:newQuery};})();