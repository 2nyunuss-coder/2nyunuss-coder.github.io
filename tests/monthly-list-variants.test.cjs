const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=file=>fs.readFileSync(path.join(root,file),'utf8');

function fixture(){
  const saves=[];
  const db={
    assign:{'2026-10|pol|1|p1':1,'2026-11|pol|1|p1':9},
    assignmentMeta:{'2026-10|pol|1|p1':{hours:7,manual:true}},
    manualDutyOverrides:{'2026-10|pol|1|p1':{reason:'Manuel'}},
    dutyCellOverrides:{'2026-10|pol|2|p1':'on'},
    engineDecisions:{'2026-10|pol|1|p1':{winner:1}},
    unitPools:{'2026-10|POLİKLİNİK RÖNTGEN':[1,2],'2026-11|POLİKLİNİK RÖNTGEN':[9]},
    manualSyncMonths:{'2026-10':{active:true}},
    manualDistributionTargetsV399:{'2026-10|POLİKLİNİK RÖNTGEN':{enabled:true,people:{1:{day:1,night:0}}}},
    rpysCellLocks:{'2026-10|pol|1|p1':{exists:true,value:1}},
    lockedDutyCells:{'2026-10|pol|1|p1':true},
    lockedMonths:{'2026-10':{lockedAt:'signed'}},
    polRotation2:{orders:{'2026-10':[1,2]},audit:{'2026-10':[1]},baseWeek:{'2026-10':3},auditSummary:{'2026-10':{ok:true}}},
    polRoomRotation:{plans:{'2026-10':{1:{people:[1]}}}}
  };
  const c={console,Date,JSON,db,window:null,document:{readyState:'complete',getElementById:()=>null,addEventListener(){},body:null,head:{appendChild(){}}},
    setInterval:()=>0,clearInterval(){},setTimeout:fn=>{fn();return 0},addEventListener(){},alert(){},renderAll(){},
    saveNowV245:opts=>saves.push(opts),logAction(){},dutyColumnByKey:(type,key)=>({p1:{unit:'UNIT A'},p2:{unit:'UNIT B'},p3:{unit:'UNIT B'}}[key]||null),
    _assignCache:{old:1},_allAssignCache:[1],_calcCache:{old:1},_peopleCache:[1]};
  c.window=c;vm.createContext(c);vm.runInContext(source('rpys-runtime-v406.js'),c);
  return {c,saves};
}

test('an alternative starts as an unlocked copy while the signed main list remains intact',()=>{
  const {c,saves}=fixture(),api=c.rpysListVariants406;
  assert.equal(api.createAlternative('2026-10'),true);
  assert.equal(api.activeVariant('2026-10'),'alt');
  assert.equal(c.db.assign['2026-10|pol|1|p1'],1);
  assert.equal(c.db.lockedMonths['2026-10'],undefined);
  assert.equal(c.db.monthListVariantsV406.variants['2026-10'].main.data.maps.lockedMonths['2026-10'].lockedAt,'signed');
  assert.equal(c.db.monthListVariantsV406.variants['2026-10'].alt.data.maps.rpysCellLocks['2026-10|pol|1|p1'].value,1);
  assert.equal(saves.length,1);assert.equal(saves[0].allowAssignDrop,true);
});

test('main and alternative assignments, targets, pools, locks and rotations stay independent',()=>{
  const {c}=fixture(),api=c.rpysListVariants406,key='2026-10|pol|1|p1';
  api.createAlternative('2026-10');
  c.db.assign[key]=2;
  c.db.unitPools['2026-10|POLİKLİNİK RÖNTGEN']=[2];
  c.db.manualDistributionTargetsV399['2026-10|POLİKLİNİK RÖNTGEN'].people={2:{day:1,night:0}};
  c.db.polRotation2.orders['2026-10']=[2];
  delete c.db.rpysCellLocks[key];

  assert.equal(api.switchVariant('main','2026-10'),true);
  assert.equal(c.db.assign[key],1);
  assert.deepEqual(Array.from(c.db.unitPools['2026-10|POLİKLİNİK RÖNTGEN']),[1,2]);
  assert.deepEqual(Array.from(c.db.polRotation2.orders['2026-10']),[1,2]);
  assert.equal(c.db.rpysCellLocks[key].value,1);
  assert.equal(c.db.lockedMonths['2026-10'].lockedAt,'signed');

  c.db.assign[key]=3;
  assert.equal(api.switchVariant('alt','2026-10'),true);
  assert.equal(c.db.assign[key],2);
  assert.deepEqual(Array.from(c.db.unitPools['2026-10|POLİKLİNİK RÖNTGEN']),[2]);
  assert.deepEqual(Array.from(c.db.polRotation2.orders['2026-10']),[2]);
  assert.equal(c.db.rpysCellLocks[key],undefined);
  assert.equal(c.db.lockedMonths['2026-10'],undefined);

  assert.equal(api.switchVariant('main','2026-10'),true);
  assert.equal(c.db.assign[key],3);
  assert.equal(c.db.assign['2026-11|pol|1|p1'],9);
  assert.deepEqual(Array.from(c.db.unitPools['2026-11|POLİKLİNİK RÖNTGEN']),[9]);
});

test('unit copy replaces only that unit and preserves every other target assignment',()=>{
  const {c}=fixture(),api=c.rpysListVariants406,mk='2026-10';
  const snap=assign=>({month:mk,maps:{assign,assignmentMeta:{},manualDutyOverrides:{},dutyCellOverrides:{},engineDecisions:{},unitPools:{},manualSyncMonths:{},manualDistributionTargetsV399:{},rpysCellLocks:{},lockedDutyCells:{},lockedMonths:{}},nested:{}});
  const source=snap({'2026-10|pol|1|p1':1,'2026-10|pol|1|p2':2});
  const target=snap({'2026-10|pol|1|p1':9,'2026-10|pol|1|p2':8,'2026-10|pol|1|p3':7});
  const result=api.copyScopeData(source,target,'unit','UNIT A',mk);
  assert.equal(result.maps.assign['2026-10|pol|1|p1'],1);
  assert.equal(result.maps.assign['2026-10|pol|1|p2'],8);
  assert.equal(result.maps.assign['2026-10|pol|1|p3'],7);
});

test('person copy moves only that persons duties without importing occupants of cleared cells',()=>{
  const {c}=fixture(),api=c.rpysListVariants406,mk='2026-10';
  const snap=assign=>({month:mk,maps:{assign,assignmentMeta:{},manualDutyOverrides:{},dutyCellOverrides:{},engineDecisions:{},unitPools:{},manualSyncMonths:{},manualDistributionTargetsV399:{},rpysCellLocks:{},lockedDutyCells:{},lockedMonths:{}},nested:{}});
  const source=snap({'2026-10|pol|1|p1':1,'2026-10|pol|1|p2':2});
  const target=snap({'2026-10|pol|1|p2':1,'2026-10|pol|1|p3':7});
  const result=api.copyScopeData(source,target,'person',1,mk);
  assert.equal(result.maps.assign['2026-10|pol|1|p1'],1);
  assert.equal(result.maps.assign['2026-10|pol|1|p2'],undefined);
  assert.equal(result.maps.assign['2026-10|pol|1|p3'],7);
});

test('the opening page injects the v406 monthly list selector after existing safety runtimes',()=>{
  const html=source('index.html');
  assert.match(html,/rpys-monthly-list-variants-loader-v406/);
  assert.match(html,/rpys-runtime-v406\.js\?v=20260929-1/);
  assert.ok(html.indexOf("rpys-custom-shift-loader-v405'))app")<html.indexOf("rpys-monthly-list-variants-loader-v406'))app"));
  const runtime=source('rpys-runtime-v406.js');assert.match(runtime,/Listeler Arası Kopyala/);assert.match(runtime,/Tüm listeyi birebir kopyala/);assert.match(runtime,/Yalnız seçilen birimi kopyala/);assert.match(runtime,/Yalnız seçilen personeli kopyala/);
  new vm.Script(runtime,{filename:'rpys-runtime-v406.js'});
});
