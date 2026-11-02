const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.join(__dirname,'..');
test('bundled RPYS opens without the old cloud, signs in against the new API and keeps private records out of public assets',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext(),oldRequests=[],assets=new Set(),writes=[];let revision=3006,server={staff:[{id:1,name:'RECOVERY SYNTHETIC A',status:'Aktif',active:true},{id:2,name:'RECOVERY SYNTHETIC B',status:'Aktif',active:true}],assign:{'2026-11|acil|1|ar1':1},users:[{id:1,username:'recovery-test',role:'admin',active:true,authVersion:1,permissions:[]}],ui:{lastMonth:'2026-11'},settings:{},leaves:[],reserves:{}};
  const token='a'.repeat(64);
  await context.route('**/*',route=>{
   const u=new URL(route.request().url()),request=route.request();
   if(u.hostname==='rpys.test'){
    const file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
    if(fs.existsSync(file)&&fs.statSync(file).isFile()){if(u.pathname.startsWith('/rpys-assets/functions/'))assets.add(u.pathname);return route.fulfill({contentType:file.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8',body:fs.readFileSync(file)})}
   }
   if(u.hostname==='wiflnajancyomgdtheyr.supabase.co'){oldRequests.push(u.pathname);return route.fulfill({status:402,body:'old service restricted'})}
   if(u.hostname==='kdfablwkqtjaflxomxlr.supabase.co'){
    const action=u.pathname.split('/api/')[1],ok=data=>route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
    if(action==='login'){const body=request.postDataJSON();if(body.username==='recovery-test'&&body.password==='synthetic-password')return ok({token,username:'recovery-test',revision});}
    if(request.headers().authorization!=='Bearer '+token)return route.fulfill({status:401,contentType:'application/json',body:'{"error":"Bulut oturumu gerekli."}'});
    if(action==='status')return ok({revision,savedAt:'2026-10-30T13:19:31Z'});
    if(action==='state'){
     if(request.method()==='POST'){const body=request.postDataJSON();writes.push(body);if(body.expectedRevision!==revision)return route.fulfill({status:409,body:'{"error":"revision conflict"}'});server=body.data;revision++;}
     return ok({hasState:true,data:server,revision,savedAt:'2026-10-30T13:19:31Z',stats:{staff:server.staff.length,assign:Object.keys(server.assign).length,leaves:0,extra:0},cloud:{active:true,project:'RPYS-NEW'}});
    }
    if(action==='import')return ok({skipped:true,revision});
   }
   return route.fulfill({status:401,body:'{}',contentType:'application/json'});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());await page.goto('https://rpys.test/');await page.waitForFunction(()=>window.__RPYS_DIRECT_CORE_READY__&&window.rpysTargets399);await page.waitForTimeout(4200);
  const before=await page.evaluate(()=>({staff:db.staff.length,assign:Object.keys(db.assign).length,version:rpysRecovery427.version,login:document.getElementById('loginOverlay').style.display}));assert.equal(before.staff,0);assert.equal(before.assign,0);assert.equal(before.version,'20261102-restore-27');assert.equal(writes.length,0);
  await page.evaluate(async()=>{loginUser.value='recovery-test';loginPass.value='synthetic-password';await login()});
  const opened=await page.evaluate(()=>({staff:db.staff.length,assign:Object.keys(db.assign).length,user:currentUser?.username,password:db.users[0]?.password,api:RPYS_CLOUD_API}));assert.equal(opened.staff,2);assert.equal(opened.assign,1);assert.equal(opened.user,'recovery-test');assert.equal(opened.password,undefined);assert.match(opened.api,/kdfablwkqtjaflxomxlr/);assert.equal(writes.length,0,'opening the existing calendar must not seed or reset the server');
  await page.evaluate(async()=>{db.assign['2026-11|acil|2|ar2']=2;saveNowV245({label:'Synthetic recovery save'});await _storageWriteChain;await _v24SaveChain});await page.waitForFunction(()=>_v300CloudRevision===3007);
  assert.equal(writes.length,1);assert.equal(writes[0].expectedRevision,3006);assert.equal(Object.keys(writes[0].data.assign).length,2);assert.equal(writes[0].data.staff.length,2);assert.ok(assets.size>=20,'legacy add-ons must be served locally');assert.deepEqual(oldRequests,[]);assert.deepEqual(errors,[]);
  revision++;await page.evaluate(()=>v24RefreshServerStatus());assert.equal(await page.evaluate(()=>_v300CloudRevision),3007,'a remote status update must not authorize a stale calendar to overwrite the newer master');
  console.log('Recovery browser:',JSON.stringify({localAddOns:assets.size,oldCloudRequests:oldRequests.length,staff:opened.staff,assignments:opened.assign,saveCount:writes.length}));
 }finally{await browser.close()}
});
