const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture(){
 const dom=new JSDOM('<select id="month"><option value="2026-10">Ekim</option><option value="2026-11">Kasım</option></select><section class="page" id="nobet"><div class="panel"><input value="draft"></div></section><section class="page active" id="saymanlik"><div class="panel"><input value="draft"></div></section>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.db={signedDocumentArchive:[],assign:{},settings:{}};w.ym=()=>w.document.getElementById('month').value;
 w.localStorage.setItem('rpys_page_fit_zoom_v1',JSON.stringify({nobet:1,saymanlik:1}));
 for(const page of w.document.querySelectorAll('.page')){Object.defineProperty(page,'clientWidth',{value:800});page.getClientRects=()=>[{}]}
 return {dom,w};
}
test('archive counters and page zoom settle together and keep unsaved input intact',async()=>{
 const f=fixture(),{w}=f;try{
  w.eval(read('rpys-runtime-v395.js'));w.eval(read('rpys-page-fit-v1.js'));await pause(450);
  const input=w.document.querySelector('#saymanlik input');input.value='UNSAVED DRAFT';
  const obs=new w.MutationObserver(()=>{});obs.observe(w.document.body,{childList:true,subtree:true});await pause(450);
  assert.equal(obs.takeRecords().length,0,'idle callbacks must not trigger each other');
  assert.equal(w.document.querySelector('#saymanlik input'),input);assert.equal(input.value,'UNSAVED DRAFT');
  w.db.signedDocumentArchive.push({kind:'saymanlik',period:'2026-10',number:'SAY-1'});
  const change=w.document.createElement('span');w.document.body.append(change);await pause(250);
  assert.equal(w.document.querySelector('#saymanlik [data-arc-count]').textContent,'1 kayıt');
  obs.takeRecords();await pause(350);assert.equal(obs.takeRecords().length,0,'real updates must settle again');
  const button=w.document.querySelector('#saymanlik [data-pfit="plus"]');button.click();await pause(250);
  assert.equal(w.document.querySelector('#saymanlik .rpysPageFitBarV1 output').value,'110%');
  obs.takeRecords();await pause(250);assert.equal(obs.takeRecords().length,0);obs.disconnect();
 }finally{f.dom.window.close()}
});
test('note styles are mounted once across delayed startup and month changes',async()=>{
 const f=fixture(),{w}=f;try{
  w.eval(read('rpys-page-notes-v2.js'));await pause(350);
  const month=w.document.getElementById('month');month.value='2026-11';month.dispatchEvent(new w.Event('change',{bubbles:true}));await pause(450);
  assert.equal(w.document.querySelectorAll('[id="rpys-page-notes-style-v4"]').length,1);
  assert.equal(w.document.querySelectorAll('#saymanlik .rpysPageNote').length,1);
  assert.equal(w.document.querySelector('#saymanlik .rpysPageNote').dataset.rpysNoteMonth,'2026-11');
 }finally{f.dom.window.close()}
});
test('status messages outside work pages cannot restart page fitting',async()=>{
 const f=fixture(),{w}=f;try{
  w.eval(read('rpys-page-fit-v1.js'));await pause(250);
  const panel=w.document.querySelector('#saymanlik .panel'),obs=new w.MutationObserver(()=>{});obs.observe(panel,{attributes:true,attributeFilter:['style']});
  const status=w.document.createElement('div');w.document.body.append(status);status.textContent='Son kayıt: güncellendi';await pause(250);
  assert.equal(obs.takeRecords().length,0,'unrelated status changes must not reset zoom and reflow a long list');obs.disconnect();
 }finally{f.dom.window.close()}
});
