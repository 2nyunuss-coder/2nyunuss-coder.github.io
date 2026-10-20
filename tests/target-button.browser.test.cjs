const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');

// Reuse the controlled personnel/calendar data, but run the production panel,
// native pointer events and the real browser Worker rather than calling the API.
function fixtureHTML(){
 const source=fs.readFileSync(path.join(__dirname,'target-integration.test.cjs'),'utf8');
 let fixture='function fixture(){'+source.split('function fixture(){')[1].split('\ntest(')[0];
 fixture=fixture.split('\n').filter(line=>!line.includes(' class Worker{')).join('\n');
 const start=fixture.indexOf(' c.window=c;vm.createContext(c);');
 const end=fixture.indexOf('\n return {c,controls',start);
 assert.ok(start>0&&end>start,'fixture extraction');
 fixture=fixture.slice(0,start)+`
 for(const [key,value] of Object.entries(c))if(!['document','window','setTimeout','clearTimeout','Date','URL','Worker','addEventListener'].includes(key))window[key]=value;
 Object.defineProperty(c,'db',{get:()=>window.db,set:v=>window.db=v});window.fixtureResult={saved,alerts,controls};
 `+fixture.slice(end);
 return `<!doctype html><html><head><meta charset="utf-8"></head><body>
 <div class="autoBox"><select id="autoUnit"><option>PORTABL + SKOPİ</option></select>
 <select id="autoPeople" multiple>${[1,2,3,4,5,6].map(id=>`<option selected value="${id}">${id}</option>`).join('')}</select>
 <input type="checkbox" id="rebuildSelectedUnitV246" checked><div id="distResult"></div></div>
 <script>const unit='PORTABL + SKOPİ';${fixture};fixture();
 document.addEventListener('click',e=>{if(e.target.closest('[data-target-action]'))e.stopImmediatePropagation()});
 </script>${['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js'].map(file=>`<script src="/${file}"></script>`).join('')}
 </body></html>`;
}

test('actual target button: queued render, legacy replacement, real Worker and visible failures',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const allowed=['rpys-runtime-v397.js','rpys-scheduler-v398.js','rpys-targets-v399.js','rpys-target-worker.js'];
  await context.route('**/*',route=>{
   const url=new URL(route.request().url()),name=url.pathname.slice(1);
   if(url.hostname==='rpys.test'&&!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML()});
   if(url.hostname==='rpys.test'&&allowed.includes(name))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,name),'utf8')});
   return route.fulfill({status:404,body:''});
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://rpys.test/');
  await page.waitForSelector('[data-target-action=run]');
  await page.evaluate(()=>{window.legacyCalls=0;window.autoDistribute=()=>{legacyCalls++};window.beforeAssignments=JSON.stringify(db.assign)});
  const button=page.locator('[data-target-action=run]');
  await button.scrollIntoViewIfNeeded();const bounds=await button.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.mouse.down();
  assert.equal(await page.evaluate(()=>{const old=document.querySelector('[data-target-action=run]');rpysTargets399.render();return old===document.querySelector('[data-target-action=run]')}),true,'a queued refresh must retain the pressed button');
  await page.mouse.up();
  const pending=await page.evaluate(()=>({busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy'),message:document.querySelector('[data-target-feedback]').textContent}));
  assert.equal(pending.busy,'true');assert.match(pending.message,/denetleniyor|hesaplanıyor/);
  await page.waitForFunction(()=>fixtureResult.saved.length===1);
  const result=await page.evaluate(()=>({filled:Object.keys(db.assign).length,saves:fixtureResult.saved.length,legacy:legacyCalls,actual:rpysTargets399.model(autoUnit.value).actual,feedback:document.querySelector('[data-target-feedback]').textContent,busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy')}));
  assert.equal(result.filled,51);assert.equal(result.saves,1);assert.equal(result.legacy,0);assert.equal(result.busy,'false');assert.match(result.feedback,/tam karşılandı/);
  assert.deepEqual(Object.values(result.actual).map(v=>[v.day,v.night]),[[5,7],[4,6],[4,5],[4,6],[3,4],[1,2]]);
  await page.evaluate(()=>{window.successAssignments=JSON.stringify(db.assign);rpysTargets399.config(autoUnit.value).people[1].day=100});
  await button.click();
  await page.waitForFunction(()=>document.querySelector('[data-target-feedback]').dataset.tone==='error');
  const failed=await page.evaluate(()=>({text:document.querySelector('[data-target-feedback]').textContent,unchanged:JSON.stringify(db.assign)===successAssignments,saves:fixtureResult.saved.length,busy:document.querySelector('[data-target-action=run]').getAttribute('aria-busy')}));
  assert.match(failed.text,/hedef toplamı/);assert.equal(failed.unchanged,true);assert.equal(failed.saves,1);assert.equal(failed.busy,'false');
  await page.evaluate(()=>{rpysScheduler398.runTargets=()=>{throw Error('startup probe')}});
  await button.click();
  await page.waitForFunction(()=>document.querySelector('[data-target-feedback]').textContent.includes('startup probe'));
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
