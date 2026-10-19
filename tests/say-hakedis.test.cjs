const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../rpys-saymanlik-hakedis-fix-v1.js'),'utf8');
function fixture(){
 const dom=new JSDOM('<select id="month"><option value="2026-10">October</option><option value="2026-11">November</option></select><div id="cellContextMenu"></div><div id="suaHoursSummary"></div><table id="suaHoursTable"></table>',{runScripts:'outside-only',url:'https://test.invalid'}),w=dom.window;
 w.eval(`var db={staff:[{id:1,name:'A'},{id:2,name:'B'}],assign:{},assignmentMeta:{},leaves:[],cellStatus:{},sayCellOverrides:{},sayTextObligation:{},specialAssignments:{},obligationOverride:{},puantajOverride:{},sua:{year:2026}};
 var _assignCache={},_allAssignCache=null,_calcCache={},_peopleCache=null,selectedSayCells=[],saves=0;
 function ym(){return document.getElementById('month').value}
 function dateStr(d){return ym()+'-'+String(d).padStart(2,'0')}
 function daysInMonth(){let [y,m]=ym().split('-').map(Number);return new Date(y,m,0).getDate()}
 function sayOverrideKey(n,d){return ym()+'|'+n+'|'+d}
 function statusKey(n,d){return sayOverrideKey(n,d)}
 function sayManualOverride(n,d){return db.sayCellOverrides[sayOverrideKey(n,d)]}
 function getCellStatus(n,d){return db.cellStatus[statusKey(n,d)]||''}
 function sayData(n,d){return sayManualOverride(n,d)||''}
 function sayStatusFromText(t){return /rapor/i.test(t)?'rapor':/yıllık/i.test(t)?'yillik':''}
 function sayStatusLabel(s){return s}
 function isMonthLocked(){return false}
 function obligationKey(id){return ym()+'|'+id}
 function puantajOverrideKey(id,k){return ym()+'|'+id+'|'+k}
 function automaticObligation(){return 145}
 function finalObligation(p){return db.obligationOverride[obligationKey(p.id)]??automaticObligation(p)}
 function rawPuantajValue(){return 999}
 function isHolidayDate(ds){return ds==='2026-10-29'}
 function isHalfHolidayDate(ds){return ds==='2026-10-28'}
 function syncSayStatusesToLeavePage(){}
 function saveNowV245(){saves++}
 function renderAll(){}
 function pushUndoPoint(){}
 function editSelectedSayCellText(){}
 function suaHoursForPersonMonth(){return 0}
 function suaPeople(){return db.staff}
 function suaTab(){}
 function renderSuaHours(people,year){document.getElementById('suaHoursTable').innerHTML='<tbody>'+people.map(p=>'<tr><td>'+p.name+'</td><td>'+fmt(suaHoursForPersonMonth(p,year,9))+'</td></tr>').join('')+'</tbody>'}
 function dutyColumnByKey(){return {hours:7,shift:'08:00-15:00'}}
 `);
 w.eval(source);return {w,dom,pick(days,n='A'){w.selectedSayCells=days.map(d=>({dataset:{person:n,day:String(d)}}))},edit(text){w.prompt=()=>text;w.editSelectedSayCellText()}};
}
test('text deducts 7h weekday, 5h half holiday and zero full holiday/weekend; duplicate edit and clear are reversible',()=>{
 const f=fixture(),{w}=f;try{const p=w.db.staff[0],before=w.finalObligation(p);f.pick([27,28,29,31,27]);f.edit('Eğitim');assert.equal(before-w.finalObligation(p),12);f.edit('Eğitim');assert.equal(before-w.finalObligation(p),12);f.edit('');assert.equal(w.finalObligation(p),before);assert.equal(w.saves,3)}finally{f.dom.window.close()}
});
test('future cross-month leave overrides stale imported display without creating cell records',()=>{
 const f=fixture(),{w}=f;try{w.db.leaves=[{personId:1,start:'2026-10-30',end:'2026-11-03',type:'Yıllık İzin'}];const before=JSON.stringify(w.db);w.document.getElementById('month').value='2026-11';assert.equal(w.sayData('A',2),'YILLIK İZİN');assert.equal(w.getCellStatus('A',2),'yillik');assert.equal(w.automaticObligation(w.db.staff[0]),133);assert.equal(JSON.stringify(w.db),before);assert.equal(w.sayData('A',4),'')}finally{f.dom.window.close()}
});
test('leave and text on same day count once; shift text and cancelled prompt do not deduct',()=>{
 const f=fixture(),{w}=f;try{const p=w.db.staff[0];w.db.leaves=[{personId:1,start:'2026-10-27',end:'2026-10-27',type:'Rapor'}];const before=w.automaticObligation(p);f.pick([27]);f.edit('Eğitim');assert.equal(w.automaticObligation(p),before);f.pick([26]);f.edit('08:00-15:00');assert.equal(w.automaticObligation(p),before);const saved=JSON.stringify(w.db);f.edit(null);assert.equal(JSON.stringify(w.db),saved)}finally{f.dom.window.close()}
});
test('explicit obligation and puantaj overrides adjust by the edit delta once per person',()=>{
 const f=fixture(),{w}=f;try{w.db.obligationOverride['2026-10|1']=100;w.db.puantajOverride['2026-10|1|muk']=90;f.pick([27,28]);f.edit('Eğitim');assert.equal(w.finalObligation(w.db.staff[0]),88);assert.equal(w.db.puantajOverride['2026-10|1|muk'],78);f.edit('Eğitim');assert.equal(w.finalObligation(w.db.staff[0]),88);f.edit('');assert.equal(w.finalObligation(w.db.staff[0]),100)}finally{f.dom.window.close()}
});
test('ŞUA renderer has a formatter and reads actual monthly hours; refresh never saves',()=>{
 const f=fixture(),{w}=f;try{w.db.assign={'2026-10|pol|5|day':1};w.rpysRefreshSuaHoursV1();assert.equal(w.document.querySelectorAll('#suaHoursTable tbody tr').length,2);assert.match(w.document.getElementById('suaHoursTable').textContent,/A7B0/);assert.equal(w.saves,0);assert.equal(w.rawPuantajValue({p:w.db.staff[0]},'muk'),145)}finally{f.dom.window.close()}
});
