importScripts('../rpys-rules-v421.js?v=20261021-or-12','engine.js?v=20261021-or-12');
onmessage=e=>{try{postMessage({ok:true,...UnitPlanner.generate(e.data.state,e.data.options)})}catch(err){postMessage({ok:false,error:err.message})}};
