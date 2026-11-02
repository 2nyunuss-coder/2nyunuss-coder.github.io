(()=>{
if(window.__RPYS_PATCH326__)return;window.__RPYS_PATCH326__=1;
const n=x=>Number(x||0);
function inferCat(a){
  let c=String(a?.col?.cat||'');if(c==='Poliklinik'||c==='Acil')return c;
  if(String(a?.type||'')==='acil')return 'Acil';
  let u=String(a?.col?.unit||'').toLocaleUpperCase('tr-TR');
  return /ACİL|ACIL|TOMOGRAFİ|TOMOGRAFI|SKOPİ|SKOPI|PORTABL/.test(u)?'Acil':'Poliklinik';
}
window.totals=function(){
  let people=(db.staff||[]).filter(p=>p&&p.status==='Aktif'),as=[];
  try{as=assignmentsMonth()||[]}catch(_){as=[]}
  let by=new Map(people.map(p=>[String(p.id),{p,pol:0,ac:0}]));
  for(const a of as){let r=by.get(String(a?.person?.id));if(!r)continue;let h=n(a?.col?.hours);if(inferCat(a)==='Acil')r.ac+=h;else r.pol+=h}
  let out=[];
  for(const r of by.values()){
    let muk=0;try{muk=n(finalObligation(r.p))}catch(_){muk=0}
    let pol=Math.round(r.pol*10)/10,ac=Math.round(r.ac*10)/10,total=Math.round((pol+ac)*10)/10;
    out.push({p:r.p,pol,ac,total,muk,diff:Math.round((total-muk)*10)/10})
  }
  return out
};
function pageNames(pageNo){try{return sayNamesForPage(pageNo)||[]}catch(_){return[]}}
function val(r,key){try{return Number(puantajValue(r,key)||0)}catch(_){if(key==='pol'||key==='ac'||key==='muk')return n(r?.[key]);if(key==='total')return n(r?.total);return n(r?.diff)}}
function fixRows(target,pageNo){
  let root=document.getElementById(target);if(!root)return;let names=new Set(pageNames(pageNo));let rows=window.totals().filter(r=>names.has(r.p.name));
  let muk=0,total=0,extra=0;for(const r of rows){let m=val(r,'muk'),t=val(r,'total');muk+=m;total+=t;extra+=Math.max(0,t-m)}
  const vals={'BİRİM TOPLAM MÜKELLEF':muk,'BİRİM TOPLAM ÇALIŞILAN MESAİ':total,'BİRİM TOPLAM FAZLA MESAİ':extra,'TÜM BİRİM TOPLAMI':total};
  for(const tr of root.querySelectorAll('tr')){let first=tr.cells?.[0];if(!first)continue;let label=String(first.textContent||'').replace(/\s+/g,' ').trim().toLocaleUpperCase('tr-TR');for(const [k,v] of Object.entries(vals)){if(label===k||label.includes(k)){let last=tr.cells[tr.cells.length-1];if(last)last.textContent=(k==='TÜM BİRİM TOPLAMI'?(Math.round(v*10)/10)+' SAAT':String(Math.round(v*10)/10));break}}}
}
const oldBuild=window.buildSay;
if(typeof oldBuild==='function'&&!oldBuild.__p326){const f=function(names,target,label){let r=oldBuild.apply(this,arguments);try{fixRows(target,target==='say2Grid'?2:1)}catch(_){}return r};f.__p326=1;window.buildSay=f}
function refresh(){try{_calcCache={};_assignCache={}}catch(_){}try{if(document.getElementById('say1Grid'))window.buildSay(pageNames(1),'say1Grid','SAYFA 1/2')}catch(_){}try{if(document.getElementById('say2Grid'))window.buildSay(pageNames(2),'say2Grid','SAYFA 2/2')}catch(_){} }
setTimeout(refresh,250);
console.log('RPYS PATCH326 Saymanlık hesap motoru aktif');
})();