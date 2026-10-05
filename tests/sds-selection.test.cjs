const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('const SDS_ALL_DOCTORS_LOADER=`');
assert.notEqual(start,-1,'SDS selector loader exists');
const bodyStart=start+'const SDS_ALL_DOCTORS_LOADER=`'.length;
const bodyEnd=html.indexOf('`;',bodyStart);
assert.notEqual(bodyEnd,-1,'SDS selector loader closes');
const declaration=html.slice(start,bodyEnd+2);

function contextFor(patchSource,document){
 const window={};
 const ctx={window,document,base:'https://example.com',fetch:async()=>({ok:true,text:async()=>patchSource}),
  MutationObserver:class{observe(){}},setTimeout,console,Promise};
 vm.createContext(ctx);vm.runInContext(declaration+';window.__loader=SDS_ALL_DOCTORS_LOADER',ctx);
 vm.runInContext(window.__loader,ctx);
 return {ctx,window};
}

test('SDS Word shows every branch and doctor after the five-item caps are removed',async()=>{
 const emptyDocument={querySelectorAll:()=>[],documentElement:{}};
 const patch=`window.sdsBranches=['B1','B2','B3','B4','B5','B6','B7','B8'].slice(0,5);window.sdsDoctors=['D1','D2','D3','D4','D5','D6','D7'].slice(0,5);window.sdsBlocked=false;const selectedBranches=['1','2','3','4','5'];if(selectedBranches.length>=5){window.sdsBlocked=true;alert('en fazla 5 branş')}`;
 const {ctx,window}=contextFor(patch,emptyDocument);
 await vm.runInContext("fixedSdsDoctors('sds','39219')",ctx);
 assert.equal(window.sdsBranches.length,8);
 assert.equal(window.sdsDoctors.length,7);
 assert.equal(window.sdsBlocked,false);
});

test('one SDS Word action checks all branches and doctors, including dynamically loaded doctors',async()=>{
 const checks=[];
 const makeCheck=()=>({checked:false,disabled:false,click(){this.checked=true}});
 for(let i=0;i<8;i++)checks.push(makeCheck());
 const root={textContent:'SDS Word — Branşlar ve Hekimler',children:[],
  querySelector(sel){return this.children.find(x=>x.dataset?.rpysSdsSelectAll==='1')||null},
  querySelectorAll(){return checks},
  prepend(button){this.children.unshift(button)},parentElement:null};
 let changed=false;
 checks[7].click=()=>{checks[7].checked=true;if(!changed){changed=true;for(let i=0;i<7;i++)checks.push(makeCheck())}};
 const document={documentElement:{},querySelectorAll:()=>[root],createElement:()=>({dataset:{},events:{},addEventListener(type,fn){this.events[type]=fn}})};
 const {ctx}=contextFor('window.ready=true',document);
 await vm.runInContext("fixedSdsDoctors('sds','39219')",ctx);
 const button=root.children[0];
 assert.equal(button.textContent,'Tüm Branş ve Hekimleri Seç');
 await button.events.click({preventDefault(){},stopPropagation(){}});
 assert.equal(checks.filter(x=>x.checked).length,15);
 assert.equal(button.textContent,'Tüm Branş ve Hekimler Seçildi');
});
