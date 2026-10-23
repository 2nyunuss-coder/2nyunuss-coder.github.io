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
for(const approved of [false,true])test('Skopi automatic distribution skips a long-shift rest violation'+(approved?' even with a leftover manual approval':''),()=>{
 const f=fixture(c=>{
  const col=c.dutyColumnByKey('pol','long');
  const chosen=[1,3].find(id=>c.canTakeShift(id,6,col,'PORTABL + SKOPİ'));
  if(chosen)c.db.assign['2026-10|pol|6|long']=chosen;
  c.save();
 });
 f.cols.long.unit='PORTABL + SKOPİ';f.c.db.staff.push({id:3,name:'Rested person',status:'Aktif'});
 f.c.db.assign['2026-10|pol|5|long']=1;
 if(approved)f.c.__RPYS_MANUAL_16_APPROVED__='2026-10-06|1|long';
 f.c.distributeSkopiSequential();
 assert.equal(f.c.db.assign['2026-10|pol|5|long'],1);
 assert.equal(f.c.db.assign['2026-10|pol|6|long'],3);
 assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);assert.equal(f.c.rpysRest16V397.allViolations().size,0);
});
test('Skopi leaves an unfillable shift empty instead of introducing a rest violation and rolling back',()=>{
 const f=fixture(c=>{const col=c.dutyColumnByKey('pol','long');if(c.canTakeShift(1,6,col,'PORTABL + SKOPİ'))c.db.assign['2026-10|pol|6|long']=1;c.save()});
 f.cols.long.unit='PORTABL + SKOPİ';f.c.db.assign['2026-10|pol|5|long']=1;
 f.c.distributeSkopiSequential();assert.equal(f.c.db.assign['2026-10|pol|6|long'],undefined);assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);
});
test('scoped monthly rest validation includes both month boundaries and excludes unrelated history',()=>{
 const {c}=fixture();c.db.staff.push({id:3,name:'Other person',status:'Aktif'});
 c.db.assign={'2026-08|pol|20|long':1,'2026-08|pol|21|day':1,'2026-09|pol|30|long':1,'2026-10|pol|1|day':1,'2026-10|pol|3|long':1,'2026-10|pol|4|day':1,'2026-10|pol|31|long':1,'2026-11|pol|1|day':1,'2026-10|pol|7|long':3,'2026-10|pol|8|day':3};
 const scoped=c.rpysRest16V397.allViolationsForMonth([1],'2026-10');assert.equal(scoped.size,3);assert.ok([...scoped.keys()].some(k=>k.includes('2026-09-30|2026-10-01')));assert.ok([...scoped.keys()].some(k=>k.includes('2026-10-31|2026-11-01')));assert.equal(c.rpysRest16V397.allViolations().size,5);
});

test('non-rebuild transactions can fill cleared null cells while protecting explicit empty locks',()=>{
 const key='2026-10|pol|5|day',f=fixture(c=>{assert.equal(c.rpysScheduler398.protectedCell(key),false);c.db.assign[key]=1;c.saveNowV245()});
 f.controls.rebuildSelectedUnitV246.checked=false;f.c.db.assign[key]=null;f.c.autoDistribute();assert.equal(f.c.db.assign[key],1);assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);
 const locked=fixture(c=>{assert.equal(c.rpysScheduler398.protectedCell(key),true);c.db.assign[key]=1;c.saveNowV245()});locked.controls.rebuildSelectedUnitV246.checked=false;locked.c.db.assign[key]=null;locked.c.db.rpysCellLocks[key]={exists:false};const before=JSON.stringify(locked.c.db);locked.c.autoDistribute();assert.equal(JSON.stringify(locked.c.db),before);assert.equal(locked.saved.length,0);
});

test('a spouse marked on leave in Saymanlık may stay home while the other spouse works',()=>{
 const f=fixture(c=>{c.db.assign['2026-10|pol|2|day']=1;c.saveNowV245()});f.c.allAssignmentsAllMonths=()=>Object.entries(f.c.db.assign).map(([k,id])=>{const [month,type,day,col]=k.split('|');return {monthKey:month,type,day:Number(day),col:f.cols[col],person:f.c.getPersonById(id)}});f.c.db.staff[1].status='Aktif';f.c.spouseOf=id=>Number(id)===1?2:1;f.c.isOnLeave=()=>false;f.c.getCellStatus=(name,d)=>name==='Person B'&&d===2?'izin':'';
 f.c.autoDistribute();assert.equal(f.c.db.assign['2026-10|pol|2|day'],1);assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-10').length,0);
});
test('spouse leave is checked against the requested month and supports existing leave aliases',()=>{
 const f=fixture();f.c.allAssignmentsAllMonths=()=>Object.entries(f.c.db.assign).map(([k,id])=>{const [month,type,day,col]=k.split('|');return {monthKey:month,type,day:Number(day),col:f.cols[col],person:f.c.getPersonById(id)}});f.c.db.staff[1].status='Aktif';f.c.spouseOf=id=>Number(id)===1?2:1;f.c.db.assign['2026-09|pol|2|day']=1;f.c.db.leaves=[{idPerson:2,start:'2026-09-01',end:'2026-09-05'}];f.c.isOnLeave=()=>false;assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-09').length,0);f.c.db.leaves=[];assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-09').length,1);
});
test('an available spouse still requires the shared day while the spouse rule is enabled',()=>{
 const f=fixture(c=>{c.db.assign['2026-10|pol|2|day']=1;c.saveNowV245()});f.c.allAssignmentsAllMonths=()=>Object.entries(f.c.db.assign).map(([k,id])=>{const [month,type,day,col]=k.split('|');return {monthKey:month,type,day:Number(day),col:f.cols[col],person:f.c.getPersonById(id)}});f.c.db.staff[1].status='Aktif';f.c.spouseOf=id=>Number(id)===1?2:1;f.c.isOnLeave=()=>false;const before=JSON.stringify(f.c.db);f.c.autoDistribute();assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts.at(-1),/Eşlerin aynı gün/);
});

test('all RPYS Saymanlık absence codes exempt the absent spouse, including ŞUA, idari and mazeret',()=>{
 for(const code of ['sua','yillik','idari','mazeret','rapor','gecici','ketem','ketemgecici','ayrilis','atamaoncesi','tayinoncesi']){
  const f=fixture(c=>{c.db.assign['2026-10|pol|2|day']=1;c.saveNowV245()});f.c.db.staff[1].status='Aktif';f.c.spouseOf=id=>Number(id)===1?2:1;f.c.isOnLeave=()=>false;f.c.getCellStatus=(name,d)=>name==='Person B'&&d===2?code:'';f.c.autoDistribute();assert.equal(f.saved.length,1,code+': '+f.alerts.join(' '));assert.equal(f.c.db.assign['2026-10|pol|2|day'],1);assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-10').length,0);
 }
});
test('manual Saymanlık actual working hours satisfy the spouse same-day rule without creating roster duties',()=>{
 const f=fixture(c=>{c.db.assign['2026-10|pol|2|day']=1;c.saveNowV245()});f.c.db.staff[1].status='Aktif';f.c.spouseOf=id=>Number(id)===1?2:1;f.c.isOnLeave=()=>false;f.c.db.sayManualWork={'2026-10|Person B|2':{pol:7,ac:0,total:7}};const before=JSON.stringify(f.c.db.sayManualWork);f.c.autoDistribute();assert.equal(f.saved.length,1,f.alerts.join(' '));assert.equal(Object.keys(f.c.db.assign).length,1);assert.equal(JSON.stringify(f.c.db.sayManualWork),before);f.c.db.sayManualWork['2026-10|Person B|2'].total=0;assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-10').length,1);
});
test('past-month imported leave is honored and explicitly cleared status is not resurrected',()=>{
 const f=fixture();f.c.db.staff[1].status='Aktif';f.c.spouseOf=id=>Number(id)===1?2:1;f.c.db.assign['2026-09|pol|2|day']=1;f.c.db.importedSaymanlik={'2026-09|Person B|2':'ŞUA İZNİ'};assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-09').length,0);f.c.db.sayStatusCleared={'2026-09|Person B|2':true};assert.equal(f.c.rpysScheduler398.spouseDayViolations('2026-09').length,1);
});

function pairFixture(engine=()=>{}){
 const f=fixture(engine),c=f.c;c.db.staff[1].status='Aktif';c.spouseOf=id=>({1:2,2:1}[id]||null);c.ruleCfg=()=>({spouseSameDay:true});c.isDutyCellApplicable=()=>true;c.isOnLeave=(id,d)=>c.rpysScheduler398.spouseUnavailable(id,d);c.canTakeShiftV2414=(id,d,col,unit)=>!c.isOnLeave(id,d)&&c.canTakeShift(id,d,col,unit);f.slots=['day','long'].map(k=>({type:'pol',col:f.cols[k]}));return f;
}
test('spouse placement reserves both eligible cells without changing the draft until commit',()=>{
 const f=pairFixture(),c=f.c,before=JSON.stringify(c.db);const plan=c.rpysScheduler398.spousePlacements(1,2,f.slots[0],'UNIT',[1,2],f.slots);assert.equal(plan.length,2);assert.equal(JSON.stringify(c.db),before);
 const hours={},count={},unitHours={},unitCount={};c.rpysScheduler398.placeSpouseGroup(1,2,f.slots[0],'UNIT',[1,2],f.slots,hours,count,unitHours,unitCount);
 assert.equal(c.db.assign['2026-10|pol|2|day'],1);assert.equal(c.db.assign['2026-10|pol|2|long'],2);assert.deepEqual(hours,{1:8,2:16});assert.deepEqual(count,{1:1,2:1});assert.deepEqual(unitCount,count);assert.deepEqual(unitHours,hours);assert.equal(c.rpysScheduler398.spouseDayViolations('2026-10').length,0);
});
test('the transaction commits an available spouse pair once instead of rolling back after the first spouse',()=>{
 let f;f=pairFixture(c=>{c.rpysScheduler398.placeSpouseGroup(1,2,f.slots[0],'UNIT',[1,2],f.slots,{},{});c.saveNowV245()});f.c.autoDistribute();assert.equal(Object.keys(f.c.db.assign).length,2);assert.equal(f.saved.length,1);assert.deepEqual(f.alerts,[]);
});
for(const mode of ['leave-record','saymanlik'])test('the working spouse is placed alone when the other has '+mode,()=>{
 const f=pairFixture(),c=f.c;if(mode==='leave-record')c.db.leaves=[{personId:2,start:'2026-10-02',end:'2026-10-02'}];else c.db.cellStatus={'2026-10|Person B|2':'sua'};
 const plan=c.rpysScheduler398.placeSpouseGroup(1,2,f.slots[0],'UNIT',[1,2],f.slots,{},{});assert.equal(plan.length,1);assert.equal(c.db.assign['2026-10|pol|2|day'],1);assert.equal(Object.keys(c.db.assign).length,1);assert.equal(c.rpysScheduler398.spouseDayViolations('2026-10').length,0);
});
for(const mode of ['locked-empty','manual','unselected','rest','single-slot'])test('pair planning leaves the whole draft unchanged when the second spouse has '+mode,()=>{
 const f=pairFixture(),c=f.c;let ids=[1,2],slots=f.slots;
 if(mode==='locked-empty')c.db.rpysCellLocks['2026-10|pol|2|long']={exists:false};if(mode==='manual'){c.db.assign['2026-10|pol|2|long']=3;c.db.manualDutyOverrides['2026-10|pol|2|long']={newPid:3}}
 if(mode==='unselected')ids=[1];if(mode==='rest')c.db.assign['2026-10|pol|1|long']=2;if(mode==='single-slot')slots=[f.slots[0]];
 const before=JSON.stringify(c.db);assert.equal(c.rpysScheduler398.placeSpouseGroup(1,2,f.slots[0],'UNIT',ids,slots,{},{}).length,0);assert.equal(JSON.stringify(c.db),before);
});
test('a spouse already working in another unit satisfies pairing without being assigned a second duty',()=>{
 const f=pairFixture(),c=f.c;c.db.assign['2026-10|pol|2|other']=2;const before=JSON.stringify(c.db.assign['2026-10|pol|2|other']);const rows=c.rpysScheduler398.placeSpouseGroup(1,2,f.slots[0],'UNIT',[1],f.slots,{},{});assert.equal(rows.length,1);assert.equal(JSON.stringify(c.db.assign['2026-10|pol|2|other']),before);assert.equal(Object.keys(c.db.assign).length,2);assert.equal(c.rpysScheduler398.spouseDayViolations('2026-10').length,0);
});
test('gap or balance repairs cannot split an already paired day',()=>{
 const f=pairFixture(),c=f.c;c.db.assign={'2026-10|pol|2|day':1,'2026-10|pol|2|long':2};const before=JSON.stringify(c.db.assign);const result=c.rpysScheduler398.preserveSpousePairs(()=>{delete c.db.assign['2026-10|pol|2|day'];c.db.assign['2026-10|pol|5|day']=1;return 1});assert.equal(result,0);assert.equal(JSON.stringify(c.db.assign),before);
});

test('the sequential Skopi draft completes both spouse days before committing once',()=>{
 let f;f=pairFixture(c=>{c.db.assign['2026-10|pol|2|day']=1;c.db.assign['2026-10|pol|5|long']=2;c.rpysScheduler398.alignSpouseDays('UNIT',[1,2,3]);c.saveNowV245()});const c=f.c;c.db.staff.push({id:3,name:'Other',status:'Aktif'});c.unitSlots=()=>f.slots;const eligible=c.canTakeShiftV2414;c.canTakeShiftV2414=(id,d,col,u)=>eligible(id,d,col,u)&&!Object.entries(c.db.assign).some(([k,p])=>p===id&&Number(k.split('|')[2])===d);
 c.autoDistribute();assert.equal(f.saved.length,1,f.alerts.join(' '));assert.equal(c.rpysScheduler398.spouseDayViolations('2026-10').length,0);assert.equal(Object.keys(c.db.assign).length,4);assert.equal(c.db.assign['2026-10|pol|2|long'],2);assert.equal(c.db.assign['2026-10|pol|5|day'],1);
});
test('sequential pairing leaves an infeasible day empty while keeping other lawful work and locks',()=>{
 let f;const audit=[];f=pairFixture(c=>{c.db.assign['2026-10|pol|2|day']=1;c.db.assign['2026-10|pol|8|day']=3;c.rpysScheduler398.alignSpouseDays('UNIT',[1,2,3],audit);c.saveNowV245()});const c=f.c;c.db.staff.push({id:3,name:'Other',status:'Aktif'});c.unitSlots=()=>[f.slots[0]];c.db.rpysCellLocks['2026-10|pol|4|day']={exists:false};const eligible=c.canTakeShiftV2414;c.canTakeShiftV2414=(id,d,col,u)=>id!==3||d!==2?eligible(id,d,col,u):false;
 c.autoDistribute();assert.equal(f.saved.length,1,f.alerts.join(' '));assert.equal(c.db.assign['2026-10|pol|2|day'],undefined);assert.equal(c.db.assign['2026-10|pol|8|day'],3);assert.ok(c.db.rpysCellLocks['2026-10|pol|4|day']);assert.ok(audit.some(x=>x.kind==='spouse-day-shortfall'));assert.equal(c.rpysScheduler398.spouseDayViolations('2026-10').length,0);
});

test('reserve is recognized from the personnel calendar, Saymanlık and imported statuses despite cleared imports',()=>{
 const f=fixture(),c=f.c;c.db.reserves={'2026-10|1':['10',11]};assert.equal(c.rpysScheduler398.reservedOn(1,10),true);assert.equal(c.canTakeShift(1,10,f.cols.day,'UNIT'),false);
 c.db.cellStatus={'2026-10|Person A|17':'reserve'};assert.equal(c.rpysScheduler398.reservedOn(1,17),true);c.db.importedSaymanlik={'2026-10|Person A|18':'REZERVE'};assert.equal(c.rpysScheduler398.reservedOn(1,18),true);c.db.sayStatusCleared={'2026-10|Person A|18':true};assert.equal(c.rpysScheduler398.reservedOn(1,18),false);assert.equal(c.rpysScheduler398.reservedOn(1,10),true);
});
test('only leave endings produce mandatory workdays, including across month boundaries',()=>{
 const f=fixture(),c=f.c;c.db.staff[1].status='Aktif';c.db.reserves={'2026-10|1':[10,11]};assert.deepEqual(Array.from(c.rpysScheduler398.returnWorkdays(1)),[]);c.db.leaves=[{personId:2,start:'2026-09-25',end:'2026-09-30'},{idPerson:2,start:'2026-10-05',end:'2026-10-09'}];assert.deepEqual(Array.from(c.rpysScheduler398.returnWorkdays(2)),[1,12]);
 c.db.cellStatus={'2026-10|Person A|14':'idari'};c.db.importedSaymanlik={'2026-10|Person A|15':'ŞUA İZNİ'};c.rpysHolidayInfo=date=>date==='2026-10-16'?{type:'full'}:null;assert.deepEqual(Array.from(c.rpysScheduler398.returnWorkdays(1)),[19]);
});
test('a real leave return skips reserve days and holidays without scheduling on them',()=>{
 const f=fixture(),c=f.c;c.db.leaves=[{personId:1,start:'2026-10-05',end:'2026-10-09'}];c.db.reserves={'2026-10|1':[10,11,12]};c.rpysHolidayInfo=date=>date==='2026-10-13'?{type:'full'}:null;assert.deepEqual(Array.from(c.rpysScheduler398.returnWorkdays(1)),[14]);
});
test('an existing job in another unit or manual Saymanlık work satisfies mandatory return without duplicate duties',()=>{
 const f=fixture(),c=f.c;c.db.leaves=[{personId:1,start:'2026-10-05',end:'2026-10-09'}];c.db.assign['2026-10|pol|12|other']=1;assert.equal(c.rpysScheduler398.returnWorkdayViolations([1]).length,0);c.db.assign={};c.db.sayManualWork={'2026-10|Person A|12':{total:7}};assert.equal(c.rpysScheduler398.returnWorkdayViolations([1]).length,0);c.db.sayManualWork['2026-10|Person A|12'].total=0;assert.equal(c.rpysScheduler398.returnWorkdayViolations([1]).length,1);
});
test('normal distribution reserves the return day and prevents a prior long duty from consuming its rest day',()=>{
 let f;f=fixture(c=>{const slots=[{type:'pol',col:f.cols.day}];assert.equal(c.canTakeShift(1,11,f.cols.long,'UNIT'),false);c.rpysScheduler398.reserveReturnWorkdays('UNIT',[1],slots,{},{});c.save()});const c=f.c;c.isDutyCellApplicable=()=>true;c.db.leaves=[{personId:1,start:'2026-10-05',end:'2026-10-09'}];c.autoDistribute();assert.equal(c.db.assign['2026-10|pol|12|day'],1);assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);
});
test('a locked return cell explains the exact person and date and never changes the old roster',()=>{
 let f;f=fixture(c=>{c.rpysScheduler398.reserveReturnWorkdays('UNIT',[1],[{type:'pol',col:f.cols.day}],{},{});c.save()});const c=f.c;c.isDutyCellApplicable=()=>true;c.db.leaves=[{personId:1,start:'2026-10-05',end:'2026-10-09'}];c.db.rpysCellLocks['2026-10|pol|12|day']={exists:false};const before=JSON.stringify(c.db);c.autoDistribute();assert.equal(JSON.stringify(c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/Person A: 2026-10-12/);assert.match(f.alerts[0],/ilk iş günü/);
});
test('a motor cannot save a new reserve-day duty even if it bypassed candidate eligibility',()=>{
 const f=fixture(c=>{c.db.assign['2026-10|pol|10|day']=1;c.save()});f.c.db.cellStatus={'2026-10|Person A|10':'reserve'};const before=JSON.stringify(f.c.db);f.c.autoDistribute();assert.equal(JSON.stringify(f.c.db),before);assert.equal(f.saved.length,0);assert.match(f.alerts[0],/10. gün rezerve/);
});

test('a Sunday night cannot consume the next months mandatory Monday return',()=>{
 const f=fixture(c=>{assert.equal(c.canTakeShift(1,31,f.cols.long,'UNIT'),false);c.save()});f.c.ym=()=> '2026-05';f.c.dateStr=d=>'2026-05-'+String(d).padStart(2,'0');f.c.db.leaves=[{personId:1,start:'2026-05-25',end:'2026-05-29'}];assert.deepEqual(Array.from(f.c.rpysScheduler398.returnWorkdays(1,'2026-06')),[1]);f.c.autoDistribute();assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);
});

function gapFixture(){const f=fixture();f.c.daysInMonth=()=>30;f.c.unitRulesV251=()=>({maxGapEnabled:true});return f;}
test('gap definition permits five empty days but reports six, without an off-by-one',()=>{
 const f=gapFixture(),c=f.c;c.db.assign={'2026-10|pol|1|day':1,'2026-10|pol|7|day':1};assert.equal(c.rpysScheduler398.gapViolations([1],'UNIT').length,0);delete c.db.assign['2026-10|pol|7|day'];c.db.assign['2026-10|pol|8|day']=1;const issues=c.rpysScheduler398.gapViolations([1],'UNIT');assert.equal(issues.length,1);assert.equal(issues[0].blank,6);
});
test('month boundaries are checked and reserve periods reset the blank run exactly like leave',()=>{
 const f=gapFixture(),c=f.c;c.__RPYS_RULEPATCH8_EDGE_GAP_SPOUSE__=1;c.db.assign={'2026-10|pol|1|day':1,'2026-10|pol|26|day':1};c.db.reserves={'2026-10|1':Array.from({length:19},(_,i)=>i+2)};assert.equal(c.rpysScheduler398.gapViolations([1],'UNIT').length,0);delete c.db.assign['2026-10|pol|26|day'];c.db.assign['2026-10|pol|27|day']=1;assert.ok(c.rpysScheduler398.gapViolations([1],'UNIT').some(x=>x.blank===6));c.db.reserves={};c.db.leaves=[{personId:1,start:'2026-10-02',end:'2026-10-20'}];assert.ok(c.rpysScheduler398.gapViolations([1],'UNIT').some(x=>x.blank===6));
});
test('previous-month real duties and imported reserve statuses share the same cross-month check',()=>{
 const f=gapFixture(),c=f.c;c.db.assign={'2026-09|pol|25|day':1,'2026-10|pol|6|day':1};c.db.importedSaymanlik=Object.fromEntries([28,29,30].map(d=>['2026-09|Person A|'+d,'REZERVE']));assert.equal(c.rpysScheduler398.gapViolations([1],'UNIT').length,0);delete c.db.assign['2026-10|pol|6|day'];c.db.assign['2026-10|pol|7|day']=1;const issues=c.rpysScheduler398.gapViolations([1],'UNIT');assert.equal(issues.length,1);assert.equal(issues[0].blank,6);assert.equal(issues[0].leftDate,'2026-09-25');
});

test('reserve in calendars or Saymanlık never creates workday requirements, even across a month boundary',()=>{
 const f=fixture(),c=f.c;c.db.reserves={'2026-09|1':[30],'2026-10|1':[10,11,30,31]};c.db.cellStatus={'2026-10|Person A|17':'reserve'};c.db.importedSaymanlik={'2026-10|Person A|18':'REZERVE'};assert.deepEqual(Array.from(c.rpysScheduler398.returnWorkdays(1)),[]);assert.deepEqual(Array.from(c.rpysScheduler398.returnWorkdays(1,'2026-11')),[]);assert.equal(c.rpysScheduler398.returnWorkdayViolations([1]).length,0);
});
test('a locked post-reserve workday does not abort normal distribution or change the lock',()=>{
 let f;f=fixture(c=>{assert.equal(c.rpysScheduler398.reserveReturnWorkdays('UNIT',[1],[{type:'pol',col:f.cols.day}],{},{}),0);c.save()});const c=f.c;c.db.reserves={'2026-10|1':[10,11]};c.db.rpysCellLocks['2026-10|pol|12|day']={exists:false};const locks=JSON.stringify(c.db.rpysCellLocks);c.autoDistribute();assert.equal(f.saved.length,1);assert.equal(f.alerts.length,0);assert.equal(JSON.stringify(c.db.rpysCellLocks),locks);assert.equal(Object.keys(c.db.assign).length,0);
});
