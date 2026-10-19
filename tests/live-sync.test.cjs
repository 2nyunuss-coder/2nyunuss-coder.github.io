const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../rpys-live-sync-v419.js'),'utf8');
function fixture(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://test.invalid',pretendToBeVisual:true}),w=dom.window;let remote=5,polls=0,confirms=0;
 w.Headers=Headers;w.Response=Response;w.setInterval=()=>0;w.confirm=()=>{confirms++;return true};
 w.fetch=async(url,init)=>{if(String(url).includes('/status')){polls++;return Response.json({revision:remote})}return Response.json({revision:5})};
 w.eval('var _savePending=false,_saveTimerV245=null;');w.eval(source);
 return {dom,w,setRevision(n){remote=n},get polls(){return polls},get confirms(){return confirms},async init(){await w.fetch('https://cloud.test/rpys-web/api/state',{headers:{Authorization:'Bearer test-only'}})}};
}
test('new remote revisions notify without replacing data or prompting for a reload',async()=>{
 const f=fixture();try{await f.init();f.setRevision(6);await f.w.rpysLiveSync419.poll();await f.w.rpysLiveSync419.poll();assert.equal(f.w.document.querySelectorAll('#rpysRemoteUpdate419').length,1);assert.equal(f.confirms,0)}finally{f.dom.window.close()}
});
test('pending saves suppress polls and block the refresh button',async()=>{
 const f=fixture();try{await f.init();f.setRevision(6);await f.w.rpysLiveSync419.poll();f.w._savePending=true;const count=f.polls;await f.w.rpysLiveSync419.poll();assert.equal(f.polls,count);f.w.document.querySelector('#rpysRemoteUpdate419 button').click();assert.equal(f.confirms,0);assert.match(f.w.document.getElementById('rpysRemoteUpdate419').textContent,/henüz tamamlanmadı/)}finally{f.dom.window.close()}
});
test('own successful writes do not produce remote-update notifications',async()=>{
 const f=fixture();try{await f.init();await f.w.fetch('https://cloud.test/rpys-web/api/state',{method:'POST',headers:{Authorization:'Bearer test-only'}});await f.w.rpysLiveSync419.poll();assert.equal(f.w.document.getElementById('rpysRemoteUpdate419'),null)}finally{f.dom.window.close()}
});
