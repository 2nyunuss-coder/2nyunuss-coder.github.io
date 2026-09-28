const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const helper=source.match(/const insertBeforeFinalBody=(.*);/)[1];
const insert=vm.runInNewContext('('+helper+')');
test('Turkish dotted capitals cannot shift the insertion into an existing script URL',()=>{
 const prefix='<!doctype html><html><body><main>İZİN ŞİŞLİ FİİLÎ HİZMET</main>';
 const loaders=['v395','v396','v397','v398','v399','v400'].map(id=>`<script id="${id}" src="/${id}.js?v=1"></script>`);
 let html=prefix+'</body></html>';
 for(const loader of loaders)html=insert(html,loader);
 assert.equal(html,prefix+loaders.join('')+'</body></html>');
});
test('Mixed-case body closure and earlier print-template body strings are preserved',()=>{
 const prefix='<HTML><BODY><main>İzin</main><script>const print="<body>İzin</body>";</script>';
 assert.equal(insert(prefix+'</BoDy ></HTML>','<script src="/guard.js"></script>'),prefix+'<script src="/guard.js"></script></BoDy ></HTML>');
});
test('A source without a body closing tag is preserved and extended',()=>{
 assert.equal(insert('<main>İZİN</main>','<script src="/guard.js"></script>'),'<main>İZİN</main><script src="/guard.js"></script>');
});
