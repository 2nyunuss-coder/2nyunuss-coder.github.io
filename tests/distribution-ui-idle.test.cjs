const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('SDS upload action mounts on a new card without rescanning personnel tables for progress updates',async()=>{
 const dom=new JSDOM('<section id="nobet"><div id="distResult"></div><div><button>Duty</button></div></section>',{url:'https://rpys.test',runScripts:'outside-only'}),w=dom.window;
 try{
  let scans=0,personnelLayoutReads=0;const query=w.document.querySelectorAll.bind(w.document);
  w.document.querySelectorAll=s=>{if(s==='section,div,article')scans++;return query(s)};
  Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){if(this.closest('#nobet'))personnelLayoutReads++;return this.textContent}});
  w.eval(read('rpys-sds-compare-v1.js'));await pause(50);scans=0;
  for(let n=0;n<10;n++){w.document.getElementById('distResult').textContent='Hesaplanıyor '+n;await pause(5)}
  assert.equal(scans,0);assert.equal(personnelLayoutReads,0);
  const panel=w.document.createElement('section');panel.className='panel';panel.innerHTML='<h3>Hekim / Branş İstem Dosyalarını Yükle</h3><button>Dosya Seç</button>';w.document.body.append(panel);await pause(50);
  const action=w.document.getElementById('rpysSdsCompareOpen');assert.ok(action);assert.equal(action.parentElement,panel);assert.equal(panel.querySelectorAll('#rpysSdsCompareOpen').length,1);
 }finally{w.close()}
});
test('shift-header maintenance ignores progress changes and still discovers a rebuilt schedule',async()=>{
 const head='<tr><th class="unitHeaderAction" colspan="2">ACİL RÖNTGEN</th></tr><tr><th class="shift">08:00-07:00</th><th class="shift">10:00-08:00</th></tr>';
 const dom=new JSDOM('<section id="nobet"><div id="distResult"></div><div id="acilGrid"><table class="schedule"><thead>'+head+'</thead><tbody><tr><td>1</td><td>A</td><td>B</td></tr></tbody></table></div></section>',{url:'https://rpys.test',runScripts:'outside-only'}),w=dom.window;
 try{
  let scans=0;const query=w.document.querySelectorAll.bind(w.document);w.document.querySelectorAll=s=>{if(s.includes('#polGrid table.schedule'))scans++;return query(s)};
  w.eval(read('rpys-duty-print-v415.js'));await pause(50);scans=0;
  for(let n=0;n<10;n++){w.document.getElementById('distResult').textContent='Hesaplanıyor '+n;await pause(5)}
  assert.equal(scans,0,'an unrelated status update must not rescan every shift header');
  w.document.querySelector('thead').innerHTML=head;await pause(50);assert.ok(scans>0);
  const shift=w.document.querySelector('th.shift');assert.equal(shift.dataset.rpysShiftName,'08:00-07:00');
  shift.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));assert.equal(shift.style.display,'none');assert.ok(w.document.querySelector('.rpysDutyShowShift'));
  w.document.querySelector('.rpysDutyShowShift').click();assert.equal(shift.style.display,'');
 }finally{w.close()}
});
