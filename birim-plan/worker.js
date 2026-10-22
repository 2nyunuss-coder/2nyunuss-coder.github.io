importScripts('../rpys-rules-v421.js?v=20261022-mini-13','engine.js?v=20261022-mini-13');
onmessage=e=>{try{postMessage({ok:true,...UnitPlanner.generate(e.data.state,e.data.options)})}catch(err){postMessage({ok:false,error:err.message})}};
