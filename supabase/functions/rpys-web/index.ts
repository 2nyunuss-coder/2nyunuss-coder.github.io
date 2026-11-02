// Compatibility API for the existing RPYS client. No seed/reset on startup.
// Credentials remain server-side. The public client receives opaque sessions.
const encoder=new TextEncoder();
const clone=value=>structuredClone(value);
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const equal=async(a,b)=>{const x=await hash(String(a)),y=await hash(String(b));let difference=0;for(let i=0;i<x.length;i++)difference|=x.charCodeAt(i)^y.charCodeAt(i);return difference===0};
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const fault=(status,message)=>Object.assign(new Error(message),{status});
const stats=data=>({staff:data?.staff?.length||0,assign:Object.keys(data?.assign||{}).length,extra:data?.importedRecords?.length||0,leaves:data?.leaves?.length||0});
const admin=user=>user?.role==='admin';
const publicState=data=>{const result=clone(data);for(const user of result.users||[]){delete user.password;delete user.passwordHash;delete user.secret;}return result};
const publicUser=user=>{const result={...user};delete result.password;delete result.passwordHash;delete result.secret;return result};
const userVersion=user=>Number(user.authVersion||0);
async function passwordHash(password){
 const salt=crypto.getRandomValues(new Uint8Array(16)),material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},material,256);
 const hex=value=>Array.from(new Uint8Array(value),b=>b.toString(16).padStart(2,'0')).join('');
 return 'pbkdf2$210000$'+hex(salt)+'$'+hex(bits);
}
async function passwordMatches(password,stored,compareBcrypt){
 if(/^\$2[aby]\$/.test(String(stored||'')))return compareBcrypt(password,stored);
 if(!String(stored||'').startsWith('pbkdf2$'))return !!stored&&await equal(password,stored);
 const [,count,saltHex,wanted]=stored.split('$');
 if(!/^\d+$/.test(count)||Number(count)>1000000||!/^[a-f0-9]{32}$/.test(saltHex)||!/^[a-f0-9]{64}$/.test(wanted))return false;
 const salt=Uint8Array.from(saltHex.match(/../g),x=>parseInt(x,16)),material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:Number(count),hash:'SHA-256'},material,256);
 const actual=Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');return equal(actual,wanted);
}

export class RestStore{
 constructor(url,key,transport=fetch){this.url=url;this.key=key;this.transport=transport;}
 async request(table,query={},method='GET',body){
  const url=new URL('/rest/v1/'+table,this.url);for(const [k,v] of Object.entries(query))url.searchParams.set(k,String(v));
  const response=await this.transport(url,{method,headers:{apikey:this.key,...(this.key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+this.key}),'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!response.ok)throw fault(503,'Veritabanı bağlantısı tamamlanamadı; mevcut kayıt korunuyor.');
  const text=await response.text();return text?JSON.parse(text):[];
 }
 async authWorkspace(name){const row=(await this.request('rpys_workspaces',{name:'eq.'+name,select:'id,name,revision,updated_at,users:state->users'}))[0];return row?{...row,state:{users:row.users},partial:true}:null;}
 async authWorkspaceById(id){const row=(await this.request('rpys_workspaces',{id:'eq.'+id,select:'id,name,revision,updated_at,users:state->users'}))[0];return row?{...row,state:{users:row.users},partial:true}:null;}
 async workspace(name){return (await this.request('rpys_workspaces',{name:'eq.'+name,select:'id,name,state,revision,updated_at,state_hash'}))[0]||null;}
 async workspaceById(id){return (await this.request('rpys_workspaces',{id:'eq.'+id,select:'id,name,state,revision,updated_at,state_hash'}))[0]||null;}
 async replace(row,data,label){
  // Back up before CAS. A losing concurrent writer may leave an extra backup,
  // but can never replace a newer revision or lose the previous calendar.
  await this.snapshot(row,'Kayıt öncesi: '+label);
  const updated=await this.request('rpys_workspaces',{id:'eq.'+row.id,revision:'eq.'+row.revision},'PATCH',{state:data,state_hash:await hash(JSON.stringify(data)),revision:Number(row.revision)+1,updated_at:new Date().toISOString(),last_label:label});
  if(updated.length!==1)throw fault(409,'Başka bir oturum daha yeni kayıt yaptı. Açık çalışmanız korunuyor; güncel veriyi kontrol edin.');
  return updated[0];
 }
 async snapshot(row,label){return (await this.request('rpys_snapshots',{},'POST',{workspace_id:row.id,revision:row.revision,state:row.state,state_hash:row.state_hash||await hash(JSON.stringify(row.state)),label}))[0];}
 snapshots(id){return this.request('rpys_snapshots',{workspace_id:'eq.'+id,select:'id,revision,created_at,label',order:'created_at.desc',limit:100});}
 async snapshotById(workspace,id){return (await this.request('rpys_snapshots',{workspace_id:'eq.'+workspace,id:'eq.'+id,limit:1}))[0]||null;}
 async record(id){return (await this.request('rpys_cloud_state',{id:'eq.'+id,select:'state',limit:1}))[0]?.state||null;}
 async putRecord(id,state){
  const existing=await this.request('rpys_cloud_state',{id:'eq.'+id,select:'id',limit:1});
  return this.request('rpys_cloud_state',existing.length?{id:'eq.'+id}:{},existing.length?'PATCH':'POST',{id,state,updated_at:new Date().toISOString()});
 }
 removeRecord(id){return this.request('rpys_cloud_state',{id:'eq.'+id},'DELETE');}
}

const nativeBcrypt=async(password,stored)=>{const bcrypt=await import('npm:bcryptjs@3.0.2');return bcrypt.compare(password,stored)};
export function createHandler({store,now=()=>Date.now(),token=randomToken,compareBcrypt=nativeBcrypt}={}){
 const allowedOrigins=new Set(['https://2nyunuss-coder.github.io','http://localhost:4173','http://127.0.0.1:4173']);
 return async function handler(request){
  const origin=request.headers.get('origin'),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  if(origin&&allowedOrigins.has(origin))headers['Access-Control-Allow-Origin']=origin;
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
  try{
   if(origin&&!allowedOrigins.has(origin))throw fault(403,'Bu uygulama adresine erişim izni yok.');
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
   const path=new URL(request.url).pathname.split('/api/')[1]||'';
   if(path==='health'&&request.method==='GET')return json({ok:!!store,version:'20261102-restore-27'},store?200:503);
   if(!store)throw fault(503,'Sunucu bağlantısı henüz hazır değil.');
   let body=null;
   if(request.method==='POST'){
    const text=await request.text();if(text.length>30000000)throw fault(413,'Kayıt boyutu desteklenen sınırı aşıyor.');
    try{body=JSON.parse(text)}catch{throw fault(400,'Geçerli JSON gerekli.')}
    if(!body||typeof body!=='object'||Array.isArray(body))throw fault(400,'Geçerli JSON nesnesi gerekli.');
   }
   const newSession=async(row,user)=>{
    const raw=token(),id='rpys_session:'+await hash(raw);
    await store.putRecord(id,{workspaceId:row.id,userId:String(user.id),authVersion:userVersion(user),expiresAt:now()+86400000});
    return raw;
   };
   if(path==='login'&&request.method==='POST'){
    const username=String(body.username||'').trim(),password=String(body.password||'');
    if(!username||username.length>150||!password||password.length>1000)throw fault(401,'Kullanıcı adı veya şifre hatalı.');
    const rateId='rpys_login:'+await hash((request.headers.get('x-forwarded-for')||'unknown').split(',')[0]+'|'+username.toLowerCase());
    const rate=await store.record(rateId);if(rate?.until>now()&&rate.failures>=8)throw fault(429,'Çok fazla giriş denemesi yapıldı. Bir süre sonra tekrar deneyin.');
    const row=await (store.authWorkspace?store.authWorkspace('RPYS_MAIN'):store.workspace('RPYS_MAIN'));
    if(!row)throw fault(503,'Ana RPYS kaydı bulunamadı; boş veri oluşturulmadı.');
    const user=(row.state.users||[]).find(u=>u.active!==false&&String(u.username).toLowerCase()===username.toLowerCase());
    if(!user||!await passwordMatches(password,user.passwordHash||user.password,compareBcrypt)){
     await store.putRecord(rateId,{failures:rate?.until>now()?Number(rate.failures||0)+1:1,until:now()+900000});throw fault(401,'Kullanıcı adı veya şifre hatalı.');
    }
    if(rate)await store.removeRecord(rateId);
    return json({token:await newSession(row,user),username:user.username,user:publicUser(user),revision:row.revision});
   }
   const bearer=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
   if(!bearer)throw fault(401,'Bulut oturumu gerekli.');
   const sessionId='rpys_session:'+await hash(bearer),session=await store.record(sessionId);
   if(!session||session.expiresAt<=now())throw fault(401,'Oturum süresi doldu. Tekrar giriş yapın.');
   let row=await (store.authWorkspaceById?store.authWorkspaceById(session.workspaceId):store.workspaceById(session.workspaceId));let user=(row?.state.users||[]).find(u=>String(u.id)===session.userId&&u.active!==false);
   if(!row||!user||userVersion(user)!==session.authVersion)throw fault(401,'Oturum geçerli değil. Tekrar giriş yapın.');
   const status=current=>({ok:true,hasState:true,revision:Number(current.revision),seq:Number(current.revision),savedAt:current.updated_at,...(current.partial?{}:{stats:stats(current.state)}),cloud:{active:true,provider:'Supabase',project:'RPYS-NEW'}});
   const requireAdmin=()=>{if(!admin(user))throw fault(403,'Bu işlem için yönetici yetkisi gerekli.');};
   if(path==='logout'&&request.method==='POST'){await store.removeRecord(sessionId);return json({ok:true});}
   if(path==='status'&&request.method==='GET')return json(status(row));
   if(path==='import'&&request.method==='POST')return json({...status(row),skipped:true,reason:'Mevcut ana kayıt korunuyor. Yerel kopya otomatik olarak ana kaydın üzerine yazılmaz.'});
   if(row.partial){row=await store.workspaceById(session.workspaceId);const fresh=row?.state.users?.find(u=>String(u.id)===session.userId&&u.active!==false);if(!fresh||userVersion(fresh)!==session.authVersion)throw fault(401,'Oturum geçerli değil. Tekrar giriş yapın.');user=fresh;}
   if(path==='state'&&request.method==='GET')return json({...status(row),data:publicState(row.state)});
   if(path==='export'&&request.method==='GET')return new Response(JSON.stringify(publicState(row.state)),{headers:{...headers,'Content-Disposition':'attachment; filename="RPYS_BULUT_YEDEK.json"'}});
   if(path==='snapshots'&&request.method==='GET')return json({items:await store.snapshots(row.id)});
   if(path==='snapshot'&&request.method==='POST'){requireAdmin();const saved=await store.snapshot(row,String(body.label||'Manuel yedek').slice(0,200));return json({ok:true,id:saved.id,revision:row.revision});}
   if(path==='change-password'&&request.method==='POST'){
    if(!admin(user)&&String(body.userId)!==String(user.id))throw fault(403,'Bu kullanıcı için şifre değiştirilemez.');
    const password=String(body.newPassword||'');if(password.length<8||password.length>1000)throw fault(400,'Yeni şifre en az 8 karakter olmalı.');
    const data=clone(row.state),target=data.users.find(u=>String(u.id)===String(body.userId));if(!target)throw fault(404,'Kullanıcı bulunamadı.');
    target.password=await passwordHash(password);delete target.passwordHash;target.authVersion=userVersion(target)+1;
    const updated=await store.replace(row,data,'Kullanıcı şifresi güncellendi');
    return json({...status(updated),...(String(target.id)===String(user.id)?{token:await newSession(updated,target)}:{})});
   }
   if((path==='state'||path==='snapshot/restore')&&request.method==='POST'){
    if(!admin(user)&&!(user.role!=='viewer'&&Array.isArray(user.permissions)&&user.permissions.some(p=>['nobet','personel','izin','saymanlik'].includes(p))))throw fault(403,'Kayıt yetkisi gerekli.');
    if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision!==Number(row.revision))throw fault(409,'Kayıt sürümü değişti; mevcut liste korunuyor. Güncel veriyi kontrol edin.');
    let data,label=String(body.label||'RPYS kaydı').slice(0,200);
    if(path==='snapshot/restore'){
     requireAdmin();const snapshot=await store.snapshotById(row.id,Number(body.id));if(!snapshot)throw fault(404,'Bu çalışma alanında yedek bulunamadı.');data=clone(snapshot.state);label='Yedek geri yükleme #'+snapshot.id;
    }else data=body.data;
    if(!data||!Array.isArray(data.staff)||!data.assign||Array.isArray(data.assign)||typeof data.assign!=='object')throw fault(400,'Geçerli personel ve görev kaydı gerekli.');
    const oldPeople=new Set((row.state.staff||[]).map(p=>String(p.id))),people=new Set(data.staff.map(p=>String(p.id)));
    if(path==='state'&&[...oldPeople].some(id=>!people.has(id))&&!/personel.*sil/i.test(label))throw fault(409,'Mevcut personel kayıtlarını azaltan kayıt engellendi.');
    if(path==='state'&&!body.allowAssignDrop&&Object.keys(row.state.assign||{}).some(key=>!data.assign[key]))throw fault(409,'MASTER HARD LOCK: görev azalması engellendi. Mevcut liste korundu.');
    if(path==='state')for(const [key,lock] of Object.entries(row.state.rpysCellLocks||{}))if(data.rpysCellLocks?.[key]&&JSON.stringify(lock)===JSON.stringify(data.rpysCellLocks[key])&&Number(data.assign[key]||0)!==Number(row.state.assign?.[key]||0))throw fault(409,'Kilitli görev değişikliği engellendi.');
    const incomingUsers=data.users||[];
    if(!admin(user)&&JSON.stringify(publicState({users:incomingUsers}).users)!==JSON.stringify(publicState({users:row.state.users}).users))throw fault(403,'Kullanıcı yetkileri değiştirilemez.');
    data=clone(data);data.users=[];
    for(const incoming of incomingUsers){
     const previous=(row.state.users||[]).find(u=>String(u.id)===String(incoming.id));const merged={...incoming};
     // The client never receives stored passwords. Missing credentials mean
     // preserve, not reset. New accounts are hashed before persistence.
     if(previous){merged.password=previous.password;merged.passwordHash=previous.passwordHash;merged.authVersion=previous.authVersion;}
     else{if(!admin(user)||!incoming.password)throw fault(400,'Yeni kullanıcı için şifre gerekli.');merged.password=await passwordHash(String(incoming.password));delete merged.passwordHash;merged.authVersion=1;}
     data.users.push(merged);
    }
    if(!data.users.some(u=>u.active!==false&&u.role==='admin'))throw fault(409,'Son etkin yönetici kaldırılamaz.');
    return json(status(await store.replace(row,data,label)));
   }
   throw fault(404,'API işlemi bulunamadı.');
  }catch(error){return json({error:error.status?error.message:'İşlem tamamlanamadı; mevcut kayıt korunuyor.'},error.status||500);}
 };
}

if(typeof Deno!=='undefined'){
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
 Deno.serve(createHandler({store:url&&key?new RestStore(url,key):null}));
}
