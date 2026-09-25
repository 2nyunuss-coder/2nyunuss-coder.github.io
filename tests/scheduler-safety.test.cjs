const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function fixture(engine=()=>{}){
 const saved=[],alerts=[],controls={autoUnit:{value:'UNIT'},rebuildSelectedUnitV246:{checked:false}};
 const cols={day:{key:'day',unit:'UNIT',hours:8,shift:'08:00-16:00'},long:{key:'long',unit:'UNIT',hours:16,shift:'08:00-00:00'},other:{key:'other',unit:'OTHER',hours:7}};
 const c={console:{error(){}},Date,db:{staff:[{id:1,name:'Person A',status:'Aktif'},{id:2,name:'Person B',status:'Pasif'}],assign:{},assignmentMeta:{},manualDutyOverrides:{},rpysCellLocks:{},leaves:[],importedRecords:[]},
  _assignCache:{},_allAssignCache:null,_calcCache:{},_peopleCache:null,
  document:{readyState:'complete',documentElement:{dataset:{}},getElementById:id=>controls[id]||null,querySelectorAll:()=>[],addEventListener(){}},
  setTimeout:()=>0,addEventListener(){},alert:m=>alerts.push(m),ym:()=> '2026-10',dateStr:d=>'2026-10-'+String(d).padStart(2,'0'),keyFor:(t,d,k)=>`2026-10|${t}|${d}|${k}`,isMonthLocked:()=>false,
  dutyColumnByKey:(t,k)=>cols[k]||null,dutyColumns:t=>t==='pol'?Object.values(cols):[],getPersonById:id=>c.db.staff.find(p=>p.id===Number(id)),personStatusAt:p=>p.status,
  canTakeShift:()=>true,autoDistribute:()=>engine(c),runPolRotation2:()=>engine(c),distributeSkopiSequential:()=>engine(c),save:()=>saved.push(JSON.stringify(c.db)),saveNowV245:()=>saved.push(JSON.stringify(c.db)),flushSave:()=>saved.push(JSON.stringify(c.db)),renderAll(){}};
 c.window=c;vm.createContext(c);for(const f of ['rpys-runtime-v397.js','rpys-scheduler-v398.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 return {c,saved,alerts,controls,cols};
}
test('16h checks see newly added and deleted assignments inside a synchronous indexed run',()=>{
 const {c,cols}=fixture();c.rpysRest16V397.runIndexed(()=>{
  assert.equal(c.rpysRest16V397.candidateResult(1,2,cols.day).ok,true);
  c.db.assign['2026-10|pol|1|long']=1;
  assert.equal(c.rpysRest16V397.candidateResult(1,2,cols.day).ok,false);
  delete c.db.assign['2026-10|pol|1|long'];
  assert.equal(c.rpysRest16V397.candidateResult(1,2,cols.day).ok,true);
 });
 c.db.assign['2026-10|pol|1|long']=1;
 assert.equal(c.rpysRest16V397.candidateResult(1,2,cols.day).ok,false);
});
test('existing rest violations cannot make additional next-day duties eligible',()=>{
 const {c,cols}=fixture();c.db.assign={'2026-10|pol|1|long':1,'2026-10|pol|2|day':1};
 assert.equal(c.rpysRest16V397.candidateResult(1,2,cols.day).ok,false);
 assert.equal(c.rpysRest16V397.validateMutations([{key:'2026-10|pol|2|day',type:'pol',day:2,colKey:'day',pid:0}]).ok,true);
});
test('October rest covers September 30 and October 31 protects November 1',()=>{
 const {c,cols}=fixture();c.db.assign={'2026-09|pol|30|long':1};
 c.rpysRest16V397.runIndexed(()=>assert.equal(c.rpysRest16V397.candidateResult(1,1,cols.day).ok,false));
 c.db.assign={'2026-11|pol|1|day':1};
 c.rpysRest16V397.runIndexed(()=>assert.equal(c.rpysRest16V397.candidateResult(1,31,cols.long).ok,false));
});
test('inactive personnel are blocked at engine eligibility',()=>{
 const {c,cols}=fixture();assert.equal(c.canTakeShift(2,1,cols.day,'UNIT'),false);assert.equal(c.canTakeShift(1,1,cols.day,'UNIT'),true);
});
test('successful motor operation saves once, only after validation',()=>{
 const f=fixture(c=>{c.db.assign['2026-10|pol|5|day']=1;c.save();c.saveNowV245();});
 f.c.autoDistribute();assert.equal(f.saved.length,1);assert.equal(f.c.db.assign['2026-10|pol|5|day'],1);assert.equal(f.alerts.length,0);
});
test('Saymanlık-only hour edit does not leave an empty duty cell blocked',()=>{
 const key='2026-10|pol|5|day',f=fixture(c=>{c.db.assign[key]=1;c.saveNowV245();});
 f.c.db.manualDutyOverrides[key]={oldPid:1,newPid:1,reason:'Saymanlık mesai saati değişikliği'};
 f.c.db.assignmentMeta[key]={shift:'09:00-17:00',hours:8,manual:true,source:'Saymanlık manuel saat'};
 assert.equal(f.c.rpysScheduler398.protectedCell(key),false);
 f.c.autoDistribute();assert.equal(f.c.db.assign[key],1);assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);
});
test('a manually cleared but unlocked empty cell can be filled automatically',()=>{
 const key='2026-10|pol|5|day',f=fixture(c=>{c.db.assign[key]=1;c.saveNowV245();});
 f.c.db.manualDutyOverrides[key]={oldPid:2,newPid:null,reason:'Manuel hücre temizleme'};
 assert.equal(f.c.rpysScheduler398.protectedCell(key),false);
 f.c.autoDistribute();assert.equal(f.c.db.assign[key],1);assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);
});
test('manual personnel assignment remains protected while Saymanlık marker becomes an icon',()=>{
 const key='2026-10|pol|5|day',f=fixture();f.c.db.assign[key]=2;f.c.db.manualDutyOverrides[key]={oldPid:1,newPid:2,reason:'Manuel personel değişikliği'};
 assert.equal(f.c.rpysScheduler398.protectedCell(key),true);
 const badge=f.c.rpysScheduler398.manualBadgeHtml(key);assert.match(badge,/>✎<\/span>/);assert.doesNotMatch(badge,/ELLE↔SAY/);
});
for(const mode of ['existing','manual','locked-empty','other-unit','other-month'])test('motor rollback preserves '+mode+' and prevents partial cloud saves',()=>{
 let key=mode==='other-month'?'2026-09|pol|1|day':mode==='other-unit'?'2026-10|pol|1|other':'2026-10|pol|1|day';
 const f=fixture(c=>{c.db.assign[key]=2;c.saveNowV245();c.db.assignmentMeta[key]={hours:24};});
 f.controls.rebuildSelectedUnitV246.checked=mode!=='existing';
 if(mode==='locked-empty')f.c.db.rpysCellLocks[key]={exists:false};else f.c.db.assign[key]=1;
 if(mode==='manual')f.c.db.manualDutyOverrides[key]={manual:true};
 const before=JSON.stringify(f.c.db);f.c.autoDistribute();assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts.at(-1),/önceki liste aynen korundu/);
});
test('motor exceptions restore the full state, including pools and manual metadata',()=>{
 const f=fixture(c=>{c.db.unitPools={broken:[2]};c.db.assign['2026-10|pol|4|day']=1;c.save();throw Error('test fault')});
 const before=JSON.stringify(f.c.db);f.c.autoDistribute();assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.equal(f.c.rpysScheduler398.running(),false);
});
test('preparation exceptions release the transaction and restore temporary helpers',()=>{
 let runs=0;const f=fixture(()=>runs++),lookup=f.c.dutyColumnByKey;
 const allMonths=()=>{throw Error('preparation fault')};f.c.allAssignmentsAllMonths=allMonths;
 const before=JSON.stringify(f.c.db);f.c.autoDistribute();
 assert.equal(JSON.stringify(f.c.db),before);assert.equal(runs,0);assert.equal(f.saved.length,0);
 assert.equal(f.c.rpysScheduler398.running(),false);assert.equal(f.c.dutyColumnByKey,lookup);assert.equal(f.c.allAssignmentsAllMonths,allMonths);
 f.c.allAssignmentsAllMonths=()=>[];f.c.autoDistribute();assert.equal(runs,1);
});
test('alternate poliklinik motor validates next-day rest before any save',()=>{
 const f=fixture(c=>{c.db.assign['2026-10|pol|5|long']=1;c.db.assign['2026-10|pol|6|day']=1;c.save();});
 f.cols.long.unit=f.cols.day.unit='POLİKLİNİK RÖNTGEN';
 const before=JSON.stringify(f.c.db);f.c.runPolRotation2();
 assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts.at(-1),/16 saat/);
});
test('a locked month never enters either alternate motor',()=>{
 let runs=0;const f=fixture(()=>runs++);f.c.isMonthLocked=()=>true;f.c.runPolRotation2();f.c.distributeSkopiSequential();assert.equal(runs,0);assert.equal(f.saved.length,0);
});
