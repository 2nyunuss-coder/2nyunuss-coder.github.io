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
 assert.match(html,/async function poll\(\)\{if\(reloading\|\|document\.hidden\|\|!auth\|\|!api\|\|_saveTimerV245\|\|Date\.now\(\)-_saveQueuedAtV245<5000\)return;/);
 assert.doesNotMatch(html,/Saymanlık manuel puantaj değişikliği[\s\S]{0,120}save\(\);renderAll\(\)/);
});
test('RPYS: Saymanlık totals include rostered staff and match duties by person id',()=>{
 const html=source('index.html');
 assert.match(html,/function saymanlikPeopleForTotals\(\)/);
 assert.match(html,/\[\.\.\.\(roster\.say1\|\|\[\]\),\.\.\.\(roster\.say2\|\|\[\]\)\]\.map\(getPersonById\)\.forEach\(add\)/);
 assert.match(html,/out=saymanlikPeopleForTotals\(\)\.map\(p=>\{/);
 assert.match(html,/Number\(a\.person\.id\)===Number\(pid\)&&a\.day===d/);
 assert.match(html,/getPersonById\(personIdByName\(personName\)\)/);
});
test('All shipped JavaScript files parse successfully',()=>{
 for(const folder of ['mobile','yea-suite'])for(const file of fs.readdirSync(path.join(root,folder)).filter(x=>x.endsWith('.js')))new vm.Script(source(folder+'/'+file),{filename:folder+'/'+file});
});
