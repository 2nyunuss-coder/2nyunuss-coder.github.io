/* Public program assets stay on Pages; private records stay behind cloud login. */
(()=>{
 'use strict';if(window.rpysRecovery427)return;
 const oldHost='wiflnajancyomgdtheyr.supabase.co',newHost='kdfablwkqtjaflxomxlr.supabase.co';
 const assets=new Set(['rpys-lint385','rpys-lint388','rpys-lint389','rpys-patch319fixed','rpys-patch320fixed','rpys-patch321','rpys-patch322','rpys-patch323','rpys-patch326','rpys-patch329','rpys-patch332','rpys-patch334','rpys-patch335','rpys-patch336','rpys-patch337','rpys-patch338','rpys-patch339','rpys-patch340','rpys-patch351','rpys-patch352','rpys-patch353','rpys-patch361','rpys-patch363','rpys-patch371','rpys-patch372','rpys-patch377','rpys-patch381','rpys-patch382','rpys-patch383','rpys-patch384','rpys-patch385','rpys-patch386','rpys-patch387','rpys-patch388','rpys-patch389','rpys-patch390']);
 function route(value){
  const text=String(value),url=new URL(text,document.baseURI);
  if(![oldHost,newHost].includes(url.hostname))return text;
  const slug=url.pathname.match(/^\/functions\/v1\/([^/]+)$/)?.[1];
  if(assets.has(slug))return new URL('/rpys-assets/functions/'+slug+'.js'+url.search,location.origin).href;
  if(url.hostname===oldHost&&/^\/functions\/v1\/rpys-web\/api(?:\/|$)/.test(url.pathname)){url.hostname=newHost;return url.href;}
  return text;
 }
 const originalFetch=window.fetch.bind(window);
 window.fetch=function(input,options){
  const original=typeof input==='string'||input instanceof URL?String(input):input.url,target=route(original);
  return originalFetch(target===original?input:input instanceof Request?new Request(target,input):target,options);
 };
 // Legacy loaders use classic script tags as well as fetch/eval.
 const descriptor=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,'src');
 if(descriptor?.set)Object.defineProperty(HTMLScriptElement.prototype,'src',{...descriptor,set(value){descriptor.set.call(this,route(value))}});
 window.rpysRecovery427={version:'20261102-restore-27',route,assetSlugs:[...assets]};
})();
