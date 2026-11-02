const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),bcrypt=require('bcryptjs');
const modulePromise=import('../supabase/functions/rpys-web/index.ts');
const copy=x=>structuredClone(x),digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function fixture(){
 const state={staff:[{id:1,name:'Synthetic A'},{id:2,name:'Synthetic B'}],assign:{'2026-11|acil|1|ar1':1},users:[{id:1,username:'test',password:'existing-test-password',active:true,role:'admin',authVersion:1,permissions:[]}],leaves:[{personId:2,start:'2026-11-03',end:'2026-11-04'}],rpysCellLocks:{'2026-11|acil|1|ar1':{value:1}}};
 let row={id:'workspace',name:'RPYS_MAIN',revision:3006,updated_at:'2026-10-30T13:19:31Z',state},writes=0;const records=new Map(),backups=[];
 const store={workspace:async()=>copy(row),workspaceById:async id=>id===row.id?copy(row):null,record:async id=>copy(records.get(id)||null),putRecord:async(id,value)=>records.set(id,copy(value)),removeRecord:async id=>records.delete(id),snapshot:async(old,label)=>{const snapshot={...copy(old),id:backups.length+1,workspace_id:old.id,label};backups.push(snapshot);return snapshot},snapshots:async()=>backups.map(({state,...r})=>r),snapshotById:async(w,id)=>copy(backups.find(x=>x.workspace_id===w&&x.id===id)||null),replace:async(old,data,label)=>{if(old.revision!==row.revision)throw Object.assign(Error('CAS conflict'),{status:409});await store.snapshot(row,label);row={...row,state:copy(data),revision:row.revision+1};writes++;return copy(row)}};
 return {store,records,backups,get row(){return row},get writes(){return writes}};
}
async function client(f){
 const {createHandler}=await modulePromise,handler=createHandler({store:f.store,compareBcrypt:bcrypt.compare,token:()=>crypto.randomBytes(32).toString('hex')});
 const call=async(path,body,token)=>{const response=await handler(new Request('https://example.supabase.co/functions/v1/rpys-web/api/'+path,{method:body===undefined?'GET':'POST',headers:{Origin:'https://2nyunuss-coder.github.io',...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));return {status:response.status,data:await response.json()}};
 const login=await call('login',{username:'test',password:'existing-test-password'});assert.equal(login.status,200);return {handler,call,token:login.data.token};
}
test('existing credentials open the original revision without modifying personnel/state or revealing passwords',async()=>{
 const f=fixture(),before=JSON.stringify(f.row),c=await client(f);assert.equal(JSON.stringify(f.row),before);assert.equal(f.writes,0);
 const state=await c.call('state',undefined,c.token);assert.equal(state.status,200);assert.equal(state.data.revision,3006);assert.equal(state.data.stats.staff,2);assert.equal(state.data.stats.assign,1);assert.equal(state.data.data.users[0].password,undefined);assert.ok(!JSON.stringify(state.data).includes('existing-test-password'));
 assert.equal((await c.call('state')).status,401);assert.equal((await c.call('login',{username:'test',password:'wrong'})).status,401);
 assert.equal((await c.call('logout',{},c.token)).status,200);assert.equal((await c.call('state',undefined,c.token)).status,401);assert.equal(JSON.stringify(f.row),before);
});
test('a validated save preserves credentials and existing data, increments the existing revision and snapshots first',async()=>{
 const f=fixture(),c=await client(f),loaded=(await c.call('state',undefined,c.token)).data.data;loaded.assign['2026-11|acil|2|ar2']=2;
 const saved=await c.call('state',{data:loaded,expectedRevision:3006,label:'Synthetic new assignment'},c.token);
 assert.equal(saved.status,200);assert.equal(saved.data.revision,3007);assert.equal(f.writes,1);assert.equal(f.row.state.staff.length,2);assert.equal(f.row.state.users[0].password,'existing-test-password');assert.equal(f.backups.length,1);assert.equal(Object.keys(f.backups[0].state.assign).length,1);
 const stale=await c.call('state',{data:loaded,expectedRevision:3006},c.token);assert.equal(stale.status,409);assert.equal(f.writes,1);
});
test('locked assignments, unconfirmed staff/task loss, automatic import and stale restores cannot overwrite the master',async()=>{
 const f=fixture(),c=await client(f),before=JSON.stringify(f.row),loaded=(await c.call('state',undefined,c.token)).data.data;
 const locked=copy(loaded);locked.assign['2026-11|acil|1|ar1']=2;assert.equal((await c.call('state',{data:locked,expectedRevision:3006},c.token)).status,409);
 const lost=copy(loaded);delete lost.assign['2026-11|acil|1|ar1'];assert.equal((await c.call('state',{data:lost,expectedRevision:3006},c.token)).status,409);
 const missing=copy(loaded);missing.staff.pop();assert.equal((await c.call('state',{data:missing,expectedRevision:3006},c.token)).status,409);
 const imported=await c.call('import',{data:lost},c.token);assert.equal(imported.data.skipped,true);assert.equal(JSON.stringify(f.row),before);assert.equal(f.writes,0);
 await c.call('snapshot',{},c.token);assert.equal((await c.call('snapshot/restore',{id:1},c.token)).status,409);assert.equal(JSON.stringify(f.row),before);
});
test('password changes invalidate previous sessions, hash the new password and keep schedules intact',async()=>{
 const f=fixture(),c=await client(f),assign=JSON.stringify(f.row.state.assign);
 const changed=await c.call('change-password',{userId:1,newPassword:'new-test-password'},c.token);assert.equal(changed.status,200);assert.ok(f.row.state.users[0].password.startsWith('pbkdf2$'));assert.equal(JSON.stringify(f.row.state.assign),assign);
 assert.equal((await c.call('state',undefined,c.token)).status,401);assert.equal((await c.call('state',undefined,changed.data.token)).status,200);assert.equal((await c.call('login',{username:'test',password:'existing-test-password'})).status,401);assert.equal((await c.call('login',{username:'test',password:'new-test-password'})).status,200);
});
test('status polling uses the small auth projection instead of downloading the full monthly database',async()=>{
 const f=fixture(),c=await client(f);let fullReads=0;f.store.authWorkspaceById=async()=>({id:f.row.id,revision:f.row.revision,updated_at:f.row.updated_at,state:{users:copy(f.row.state.users)},partial:true});f.store.workspaceById=async()=>{fullReads++;return copy(f.row)};
 const status=await c.call('status',undefined,c.token);assert.equal(status.status,200);assert.equal(status.data.revision,3006);assert.equal(fullReads,0);assert.equal(status.data.data,undefined);
 assert.equal((await c.call('state',undefined,c.token)).status,200);assert.equal(fullReads,1);
});
test('foreign origins and read-only accounts cannot write, and repeated failed logins are limited',async()=>{
 const f=fixture(),c=await client(f);const foreign=await c.handler(new Request('https://example.supabase.co/functions/v1/rpys-web/api/state',{headers:{Origin:'https://unrelated.invalid',Authorization:'Bearer '+c.token}}));assert.equal(foreign.status,403);
 f.row.state.users[0].role='viewer';const loaded=(await c.call('state',undefined,c.token)).data.data;assert.equal((await c.call('state',{data:loaded,expectedRevision:3006},c.token)).status,403);assert.equal(f.writes,0);
 for(let i=0;i<8;i++)assert.equal((await c.call('login',{username:'test',password:'wrong'})).status,401);assert.equal((await c.call('login',{username:'test',password:'wrong'})).status,429);
});
test('REST compare-and-swap cannot replace a newer revision even if a concurrent save wins',async()=>{
 const {RestStore}=await modulePromise,calls=[];const store=new RestStore('https://example.supabase.co','server-only-key',async(url,options)=>{calls.push({url:String(url),method:options.method,body:JSON.parse(options.body)});return new Response(JSON.stringify([]),{status:200})});
 await assert.rejects(()=>store.replace({id:'workspace',revision:3006,state:{staff:[],assign:{}},state_hash:'old'}, {staff:[],assign:{}},'test'),e=>e.status===409);
 assert.equal(calls[0].method,'POST');assert.match(calls[0].url,/rpys_snapshots/);assert.equal(calls[1].method,'PATCH');assert.match(calls[1].url,/revision=eq.3006/);
});


test('restored bcrypt credentials stay valid and are preserved across normal state saves',async()=>{
 const f=fixture();f.row.state.users[0].password=await bcrypt.hash('existing-test-password',10);const original=f.row.state.users[0].password;
 const c=await client(f);assert.equal(f.row.state.users[0].password,original);assert.equal(f.writes,0);
 assert.equal((await c.call('login',{username:'test',password:'wrong'})).status,401);
 const loaded=(await c.call('state',undefined,c.token)).data.data;assert.equal(loaded.users[0].password,undefined);
 const saved=await c.call('state',{data:loaded,expectedRevision:3006,label:'Synthetic bcrypt preservation'},c.token);assert.equal(saved.status,200);assert.equal(f.row.state.users[0].password,original);
});
