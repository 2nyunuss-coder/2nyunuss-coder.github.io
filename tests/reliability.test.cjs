const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

function worker(app) {
  const scope = 'https://example.test/' + app + '/';
  const handlers = {}, data = new Map();
  let network = () => Promise.reject(new Error('offline'));
  const key = req => new URL(typeof req === 'string' ? req : req.url, scope).href;
  const open = async name => {
    if (!data.has(name)) data.set(name, new Map());
    const entries = data.get(name);
    return {match: async req => entries.get(key(req))?.clone(), put: async(req,r)=>entries.set(key(req),r.clone()),addAll:async()=>{}};
  };
  const context = vm.createContext({URL,Response,fetch:req=>network(req),caches:{open,keys:async()=>[...data.keys()],delete:async name=>data.delete(name)},self:{registration:{scope},location:{origin:new URL(scope).origin},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(name,cb)=>handlers[name]=cb}});
  vm.runInContext(source(app+'/sw.js'), context);
  const cacheName = vm.runInContext('CACHE',context);
  return {data, open, cacheName, network:fn=>network=fn, async activate(){let p;handlers.activate({waitUntil:x=>p=x});await p;},async request(url,mode='navigate',method='GET'){let response,done;handlers.fetch({request:{url:new URL(url,scope).href,mode,method},respondWith:r=>response=r,waitUntil:p=>done=p});if(!response)return null;const result=await response;await done;return result;}};
}
for (const app of ['mobile','yea-suite']) {
 test(app+': activation preserves other applications and removes only own old shell',async()=>{
  const w=worker(app);for(const name of ['rpys-cep-shell-v3','yea-suite-v16','unrelated-records',w.cacheName])await w.open(name);
  await w.activate();assert(w.data.has('unrelated-records'));assert(w.data.has(app==='mobile'?'yea-suite-v16':'rpys-cep-shell-v3'));
  assert(!w.data.has(app==='mobile'?'rpys-cep-shell-v3':'yea-suite-v16'));assert(w.data.has(w.cacheName));
 });
 test(app+': HTTP errors cannot replace a good offline copy',async()=>{
  const w=worker(app),c=await w.open(w.cacheName);await c.put('./v16.html',new Response('saved'));
  w.network(async()=>new Response('server error',{status:500}));assert.equal(await(await w.request('./v16.html')).text(),'saved');
  w.network(async()=>{throw new Error('offline')});assert.equal(await(await w.request('./v16.html')).text(),'saved');
 });
 test(app+': missing scripts do not receive HTML and another app is not intercepted',async()=>{
  const w=worker(app),c=await w.open(w.cacheName);await c.put('./index.html',new Response('<html>shell</html>'));
  assert.equal((await w.request('./missing.js','cors')).status,503);
  assert.equal(await w.request('https://example.test/unrelated/data'),null);
  assert.equal(await w.request('./api','cors','POST'),null);
 });
}
test('YEA: navigation cannot overwrite the v16 offline page',async()=>{
 const w=worker('yea-suite'),c=await w.open(w.cacheName);await c.put('./v16.html',new Response('v16'));
 w.network(async()=>new Response('v15'));await w.request('./v15.html');
 w.network(async()=>{throw new Error('offline')});assert.equal(await(await w.request('./v16.html')).text(),'v16');
 assert.equal(await(await w.request('./v15.html')).text(),'v15');
});

function mobile() {
 const values=new Map(),elements=new Map();let failStorage=false;
 function el(){return {hidden:false,style:{},classList:{add(){},remove(){},toggle(){}},querySelector(){return el()},textContent:'',addEventListener(){}};}
 const document={querySelector(s){if(!elements.has(s))elements.set(s,el());return elements.get(s)},querySelectorAll(){return []}};
 const context=vm.createContext({document,navigator:{onLine:true},crypto:require('node:crypto').webcrypto,localStorage:{getItem:k=>values.get(k)||null,setItem(k,v){if(failStorage)throw Error('quota');values.set(k,v)}},setTimeout,clearTimeout,console,window:{},Date});
 let code=source('mobile/mobile.js');code=code.slice(0,code.indexOf("  $('#requestForm').addEventListener"));
 code+=`renderAll=()=>{};globalThis.testApi={createRecord,flushQueue,readQueue,withPendingRecords,installBridge,set(s,b){snapshot=s;authenticated=true;frame.contentWindow={__RPYS_MOBILE_V2__:b};}};})();`;
 vm.runInContext(code,context);
 const state={user:{username:'test-user',role:'admin'},requests:[],devices:[]};const api=context.testApi;
 const bridge={snapshot:()=>structuredClone(state),createRequest:()=>{},createDevice:()=>{},confirmRecords:async()=>[]};api.set(state,bridge);
 return {api,bridge,state,context,values,failStorage:()=>failStorage=true};
}
const payload = id => ({id,type:'İzin talebi',date:'2026-09-07',detail:'Test'});
test('Mobile: offline submissions remain durable across reload',async()=>{
 const m=mobile();m.context.navigator.onLine=false;m.api.createRecord('request',payload('one'));assert.equal(m.api.readQueue().length,1);
 assert.equal(JSON.parse(m.values.get('rpys_cep_queue_v2'))[0].payload.id,'one');
 assert.equal(m.api.withPendingRecords({user:{username:'test-user'},requests:[]}).requests[0].queued,true);
});
test('Mobile: failed server confirmation retains the queued record',async()=>{
 const m=mobile();m.bridge.confirmRecords=async()=>{throw Error('server unavailable')};m.api.createRecord('request',payload('one'));await m.api.flushQueue();assert.equal(m.api.readQueue().length,1);
});
test('Mobile: remove only confirmed records and preserve submissions during synchronization',async()=>{
 const m=mobile();let resolve; m.bridge.confirmRecords=()=>new Promise(r=>resolve=r);
 m.api.createRecord('request',payload('one'));const pending=m.api.flushQueue();m.api.createRecord('request',payload('two'));
 resolve(['one']);await pending;assert.deepEqual(JSON.parse(JSON.stringify(m.api.readQueue())).map(x=>x.payload.id),['two']);
});
test('Mobile: another user cannot send or display the first user queue',async()=>{
 const m=mobile();m.context.navigator.onLine=false;m.api.createRecord('request',payload('one'));m.state.user.username='second-user';let calls=0;m.bridge.createRequest=()=>calls++;
 m.context.navigator.onLine=true;await m.api.flushQueue();assert.equal(calls,0);assert.equal(m.api.readQueue().length,1);assert.equal(m.api.withPendingRecords({user:{username:'second-user'},requests:[]}).requests.length,0);
});
test('Mobile: storage failure is reported before sending or clearing the form',()=>{
 const m=mobile();let calls=0;m.bridge.createRequest=()=>calls++;m.failStorage();assert.throws(()=>m.api.createRecord('request',payload('one')),/Cihaza kaydedilemedi/);assert.equal(calls,0);
});
test('Mobile: viewers and incomplete requests cannot enter the send queue',()=>{
 const m=mobile();assert.throws(()=>m.api.createRecord('request',{type:'',date:'',detail:''}),/eksik/);m.state.user.role='viewer';assert.throws(()=>m.api.createRecord('request',payload('one')),/görüntüleme/);assert.equal(m.api.readQueue().length,0);
});
test('Mobile bridge: cloud data must contain matching ID, owner and fields before acknowledgment',async()=>{
 const m=mobile(),frame=vm.createContext({window:{dispatchEvent(){}},currentUser:{username:'test-user',role:'admin'},db:{},crypto:require('node:crypto').webcrypto,CustomEvent:function(){},_storageReady:true,_v24ServerOnline:true,_storageWriteChain:Promise.resolve(),_v24SaveChain:Promise.resolve(),saveNowV245(){},v24FetchJson:async()=>({hasState:true,data:{rpysMobileV2:{requests:[{...payload('one'),createdBy:'test-user'}]}}})});
 const doc={getElementById:()=>null,createElement:()=>({}),body:{appendChild(script){vm.runInContext(script.textContent,frame)}}};
 m.api.installBridge(doc);const b=frame.window.__RPYS_MOBILE_V2__,item={kind:'request',payload:payload('one'),owner:'test-user'};
 assert.equal((await b.confirmRecords([item]))[0],'one');item.payload.detail='Changed';assert.equal((await b.confirmRecords([item])).length,0);
 item.payload.detail='Test';item.owner='second-user';assert.equal((await b.confirmRecords([item])).length,0);
 frame.currentUser.role='viewer';await assert.rejects(b.confirmRecords([item]),/görüntüleme/);
});
test('YEA: mute day and budget month follow Istanbul at midnight and year end',()=>{
 const code=source('yea-suite/v16-core.js'),start=code.indexOf('function istanbulDay('),end=code.indexOf('function expenseThisMonth(',start),c=vm.createContext({Intl,Date});
 vm.runInContext(code.slice(start,end),c);
 for(const [utc,day] of [['2026-09-06T20:59:59Z','2026-09-06'],['2026-09-06T21:00:00Z','2026-09-07'],['2026-12-31T21:00:00Z','2027-01-01']])assert.equal(c.istanbulDay(new Date(utc)),day);
 assert.equal(c.monthKey(new Date('2026-09-30T21:00:00Z')),'2026-10');
});
test('YEA: startup timeout stops polling and offers retry without changing stored records',()=>{
 let now=0,timerId=0;const timers=new Map(),nodes=[];const c=vm.createContext({Date:{now:()=>now},setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),location:{href:'https://example.test/yea-suite/v16.html',origin:'https://example.test',reload(){}},URL,window:{addEventListener(){}},document:{getElementById:()=>null,body:{appendChild:n=>nodes.push(n)},createElement:()=>({style:{},setAttribute(){},addEventListener(){},append(){}})}});
 vm.runInContext(source('yea-suite/boot-guard.js'),c);let started=0;c.window.YeaBoot.waitUntil(()=>false,()=>started++,100);assert.equal(timers.size,1);now=101;const callbacks=[...timers.values()];timers.clear();callbacks.forEach(x=>x());assert.equal(timers.size,0);assert.equal(nodes.length,1);assert.equal(started,0);
});
test('YEA: recurring task search returns a correctly labelled result',()=>{
 const code=source('yea-suite/v10-core.js'),start=code.indexOf('function searchV10('),end=code.indexOf('function runSearchV10(',start);
 const c=vm.createContext({normText:s=>s.toLocaleLowerCase('tr-TR'),tasks:[],projects:[],drafts:[],vehicles:[],finance:[],radiology:[],recurring:[{title:'Haftalık kontrol',notes:'Cuma'}]});
 vm.runInContext(code.slice(start,end),c);const found=c.searchV10('kontrol');assert.equal(found.length,1);assert.equal(found[0].type,'Tekrar');assert.equal(found[0].title,'Haftalık kontrol');assert.equal(found[0].tab,'recurring');
});
test('RPYS: manual timesheet totals save before focus polling can reload the page',()=>{
 const html=source('index.html');
 assert.match(html,/saveNowV245\(\{label:\"Saymanlık manuel puantaj değişikliği\"\}\);renderAll\(\)/);
 assert.match(html,/window\.__RPYS_LAST_USER_EDIT_V396__/);
 assert.match(html,/_saveTimerV245\|\|_savePending\|\|Number\(window\.__RPYS_EDIT_GUARD_UNTIL_V400__/);
 assert.match(html,/Date\.now\(\)-editAt<60000/);
 assert.doesNotMatch(html,/Saymanlık manuel puantaj değişikliği[\s\S]{0,120}save\(\);renderAll\(\)/);
});
test('RPYS: every first edit invalidates stale caches before delayed rendering',()=>{
 const html=source('index.html'),runtime=source('rpys-runtime-v396.js');
 assert.match(html,/function save\(opts=\{\}\)\{\\n  window\.__RPYS_LAST_USER_EDIT_V396__=Date\.now\(\);_assignCache=\{\};_allAssignCache=null;_calcCache=\{\};_peopleCache=null;/);
 assert.match(html,/function saveNowV245\(opts=\{\}\)\{\\n  window\.__RPYS_LAST_USER_EDIT_V396__=Date\.now\(\);_assignCache=\{\};_allAssignCache=null;_calcCache=\{\};_peopleCache=null;/);
 assert.match(runtime,/function invalidateCaches\(\)/);
 assert.match(runtime,/markEdit\(\);invalidateCaches\(\);return base\.apply/);
 assert.match(runtime,/__RPYS_LAST_USER_EDIT_V396__/);
 new vm.Script(runtime,{filename:'rpys-runtime-v396.js'});
});
test('RPYS: first save is flushed immediately and remote reload stays guarded until acknowledgement',async()=>{
 let immediate=0,box={style:{},replaceChildren(){this.cleared=true}},timer=0;
 const controls={autoUnit:{value:'OTHER'},autoPeople:{selectedOptions:[]},month:{value:'2026-10'},dutySuitableListV2413:box};
 const document={readyState:'complete',body:{},documentElement:{dataset:{}},getElementById:id=>controls[id]||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
 const c={console,Date,Promise,document,db:{unitPools:{'2026-10|PORTABL + SKOPİ':[2]},skopiEligible:[1,2]},ym:()=> '2026-10',
  suitablePeopleForDutyV2413:()=>[{p:{id:1}},{p:{id:2}},{p:{id:3}}],_assignCache:{old:1},_allAssignCache:[1],_calcCache:{old:1},_peopleCache:[1],
  _saveTimerV245:0,_savePending:false,_storageWriteChain:Promise.resolve(),
  save(){this._saveTimerV245=++timer;return null},saveNowV245(){this._saveTimerV245=0;immediate++;this._storageWriteChain=Promise.resolve();return '{}'},
  setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){},MutationObserver:function(){this.observe=()=>{}},addEventListener(){}};
 c.window=c;vm.createContext(c);vm.runInContext(source('rpys-runtime-v400.js'),c);
 c.save();await new Promise(resolve=>setTimeout(resolve,15));
 assert.equal(immediate,1);assert.equal(c._saveTimerV245,0);assert.equal(c._assignCache&&Object.keys(c._assignCache).length,0);
 assert.equal(c.rpysInteraction400.suitableRows({unit:'PORTABL + SKOPİ'}).rows.length,1);
 c.rpysInteraction400.renderSuitable();assert.equal(box.style.display,'none');assert.equal(box.cleared,true);
});
test('RPYS: suitable personnel is click-only, single-menu and unit-pool scoped',()=>{
 const runtime=source('rpys-runtime-v400.js'),html=source('index.html');
 assert.match(runtime,/if\(!suitableOpen\)\{box\.replaceChildren\(\);box\.style\.display='none';return\}/);
 assert.match(runtime,/configuredPool\(col\)/);assert.match(runtime,/rows\.filter\(row=>pool\.has/);
 assert.match(runtime,/for\(const duplicate of menus\.slice\(1\)\)duplicate\.remove\(\)/);
 assert.match(html,/rpys-interaction-guard-loader-v400/);assert.match(html,/rpys-manual-targets-loader-v399/);
 assert.match(html,/__RPYS_EDIT_GUARD_UNTIL_V400__/);
});
test('RPYS: per-person day and night target panel is connected to the 6.1.1 safe scheduler',()=>{
 const targets=source('rpys-targets-v399.js'),scheduler=source('rpys-scheduler-v398.js');
 assert.match(targets,/Personel Gündüz \/ Nöbet Hedefleri/);assert.match(targets,/Hedeflere Göre Dağıt/);
 assert.match(targets,/manualDistributionTargetsV399/);assert.match(targets,/rpysScheduler398\?\.manualAssignmentCell/);
 assert.match(scheduler,/rpysTargets399\?\.enabledFor\(unit\)\?window\.rpysTargets399\.distribute\(unit\)/);
 assert.doesNotMatch(targets,/engine:\s*['"]6\.1\.0/);
});
test('RPYS: inactive personnel move last and leave active operating lists',()=>{
 const html=source('index.html'),runtime=source('rpys-runtime-v396.js');
 assert.match(html,/staffForPeopleV396=db\.staff\.slice\(\)\.sort/);
 assert.match(html,/personStatusAt\(a,date\)==="Aktif"\?0:1/);
 assert.match(html,/lPerson\.innerHTML=currentPeople\(\)\.slice\(\)\.sort/);
 assert.match(html,/return db\.staff\.filter\(p=>p\.status==="Aktif"\|\|personHasMonthData\(p,mk\)\)/);
 assert.match(html,/p\.active=p\.status==='Aktif'/);
 assert.match(html,/saveNowV245\(\{label:'Personel durum değişikliği'\}\);renderAll\(\)/);
 assert.match(runtime,/eligibleSayPeople/);
 assert.match(runtime,/reconcileSayRoster/);
});
test('RPYS: context menus are deduplicated and expose date-specific suitable personnel',()=>{
 const html=source('index.html'),runtime=source('rpys-runtime-v396.js');
 assert.match(html,/rpys-data-integrity-personnel-loader-v396/);
 assert.match(html,/insertBeforeFinalBody\(app,DATA_INTEGRITY_PERSONNEL_JS\)/);
 assert.match(runtime,/function dedupeMenu\(menu\)/);
 assert.match(runtime,/ÇALIŞMAYI DEĞİŞTİR/);
 assert.match(runtime,/O Güne Uygun Personeli Bul/);
 assert.match(runtime,/gündür herhangi bir mesaiye gelmedi/);
 assert.match(runtime,/Son mesai:/);
 assert.match(runtime,/data-rpys-suitable-person/);
 assert.doesNotMatch(runtime,/button[^\n]{0,120}>[^\n]*Uygun Kişiler/);
});
function rest16Runtime(){
 const columns={
  'acil|long16':{key:'long16',shift:'08:00-00:00',hours:16},
  'acil|long24':{key:'long24',shift:'08:00-08:00',hours:24},
  'pol|day8a':{key:'day8a',shift:'08:00-16:00',hours:8},
  'pol|day8b':{key:'day8b',shift:'08:00-16:00',hours:8},
  'pol|day7':{key:'day7',shift:'08:00-15:00',hours:7}
 };
 const context={console,setTimeout:()=>0,clearTimeout(){},alert(){},MutationObserver:function(){this.observe=()=>{}},
  db:{staff:[{id:1,name:'Test Personel'}],assign:{},assignmentMeta:{},importedRecords:[]},ym:()=> '2026-09',
  dateStr:d=>`2026-09-${String(d).padStart(2,'0')}`,dutyColumnByKey:(type,key)=>columns[type+'|'+key]||null,
  document:{readyState:'complete',getElementById(){return null},querySelectorAll(){return[]},addEventListener(){}},addEventListener(){},CustomEvent:function(){}};
 context.window=context;vm.createContext(context);vm.runInContext(source('rpys-runtime-v397.js'),context);
 return {context,columns,api:context.rpysRest16V397}
}
test('RPYS: 16-hour next-day rest is a central non-overridable rule',()=>{
 const html=source('index.html'),runtime=source('rpys-runtime-v397.js');
 assert.match(html,/rpys-rest-16-hours-loader-v397/);
 assert.match(html,/previousDayBlockingHours\(personId,d\)>=16/);
 assert.match(html,/if\(hours>=16\)return true/);
 assert.match(html,/00\.00 bitişi dinlenme kuralını kaldırmaz/);
 assert.match(runtime,/const REST_LIMIT=16/);
 for(const name of ['canTakeShift','canTakeShiftV2413','canTakeShiftV2414','setAssign','applyDutyBulkSelection','validateDutyMove','rpysApproveDutyConflict384'])assert.match(runtime,new RegExp(name));
 assert.match(runtime,/wrapTransaction\("autoDistribute"/);
 assert.match(runtime,/wrapTransaction\("distributeSkopiSequential"/);
 new vm.Script(runtime,{filename:'rpys-runtime-v397.js'});
});
test('RPYS: rest calculation totals all work and crosses month boundaries',()=>{
 const {context,columns,api}=rest16Runtime();
 assert.equal(api.limit,16);assert.equal(api.parseShiftHours('08:00-00:00'),16);assert.equal(api.parseShiftHours('08:00-08:00'),24);assert.equal(api.parseShiftHours('08:00-07:00'),23);
 context.db.assign={'2026-08|acil|31|long16':1};
 assert.equal(api.previousDayHours(1,1),16);assert.equal(api.candidateResult(1,1,columns['pol|day7']).ok,false);
 context.db.assign={'2026-08|pol|31|day8a':1,'2026-08|pol|31|day8b':1};
 assert.equal(api.previousDayHours(1,1),16);assert.equal(api.candidateResult(1,1,columns['pol|day7']).ok,false);
 context.db.assign={'2026-08|pol|31|day8a':1};assert.equal(api.candidateResult(1,1,columns['pol|day7']).ok,true);
});
test('RPYS: a long assignment cannot be inserted before an existing next-day duty',()=>{
 const {context,columns,api}=rest16Runtime();context.db.assign={'2026-09|pol|2|day7':1};
 const result=api.validateMutations([{key:'2026-09|acil|1|long16',type:'acil',day:1,colKey:'long16',pid:1}]);
 assert.equal(result.ok,false);assert.equal(result.violations[0].longDate,'2026-09-01');assert.equal(result.violations[0].nextDate,'2026-09-02');
 assert.equal(api.candidateResult(1,1,columns['acil|long16']).ok,false);
});
test('RPYS: signed duty and payroll documents have durable numbered archives',()=>{
 const html=source('index.html'),runtime=source('rpys-runtime-v395.js');
 assert.match(html,/rpys-data-safety-archive-loader-v395/);
 assert.match(html,/insertBeforeFinalBody\(app,DATA_SAFETY_ARCHIVE_JS\)/);
 assert.match(html,/__RPYS_ARCHIVE_PRINT_DOCUMENT_V395__/);
 assert.match(runtime,/signedDocumentArchive/);
 assert.match(runtime,/NÖB/);
 assert.match(runtime,/SAY/);
 assert.match(runtime,/Son İmzalatılanlar/);
 assert.match(runtime,/CompressionStream/);
 assert.match(runtime,/printedMeta\(doc\)/);
 assert.match(runtime,/archiveCss\(meta\.orientation\)/);
 assert.match(runtime,/saveNowV245\(\{label:\"Son imzalatılan arşivi • \"\+number\}\)/);
 assert.match(runtime,/v24FetchJson\(\"\/api\/snapshot\"/);
 new vm.Script(runtime,{filename:'rpys-runtime-v395.js'});
});
test('RPYS: Saymanlık totals include eligible staff and match duties by person id',()=>{
 const html=source('index.html');
 assert.match(html,/function saymanlikPeopleForTotals\(\)/);
 assert.match(html,/sayEligiblePeople\(ym\(\)\)\.forEach\(add\)/);
 assert.match(html,/out=saymanlikPeopleForTotals\(\)\.map\(p=>\{/);
 assert.match(html,/Number\(a\.person\.id\)===Number\(pid\)&&a\.day===d/);
 assert.match(html,/getPersonById\(personIdByName\(personName\)\)/);
});
test('RPYS: Fiilî Hizmet print controls cannot be classified as Saymanlık',()=>{
 const html=source('index.html');
 assert.match(html,/rpys-fiili-print-isolation-v1/);
 assert.match(html,/lastIndexOf\('<\/body>'\)/);
 assert.match(html,/insertBeforeFinalBody\(app,FIILI_PRINT_JS\)/);
 assert.match(html,/selector=\"#fiilihizmet\"/);
 assert.match(html,/removeAttribute\(\"data-rpys383print\"\)/);
 assert.match(html,/selector\+\" \.rpys332Print\"/);
 assert.match(html,/typeof printFiiliDocument===\"function\"\)printFiiliDocument\(\)/);
 assert.doesNotMatch(html,/rpys-fiili-print-isolation-v1[\s\S]{0,1500}stablePrintSay\(/);
});
test('All shipped JavaScript files parse successfully',()=>{
 for(const folder of ['mobile','yea-suite'])for(const file of fs.readdirSync(path.join(root,folder)).filter(x=>x.endsWith('.js')))new vm.Script(source(folder+'/'+file),{filename:folder+'/'+file});
});
