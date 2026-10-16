import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const forwarded=[];
const central=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;forwarded.push({auth:req.headers.authorization,body:JSON.parse(body)});res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,content:'NPC advice',provider:'groq',model:'saved-model'}));});
await new Promise(resolve=>central.listen(0,'127.0.0.1',resolve));
const placeholder=createServer();await new Promise(resolve=>placeholder.listen(0,'127.0.0.1',resolve));const port=placeholder.address().port;await new Promise(resolve=>placeholder.close(resolve));
const child=spawn(process.execPath,['dist/server.js'],{env:{...process.env,NODE_ENV:'production',PORT:String(port),DREAMMAKERHUB_PROVIDER_CATALOG_URL:`http://127.0.0.1:${central.address().port}/api/ai-providers/catalog`},stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
try{
 let ready=false;for(let i=0;i<60;i++){try{ready=(await fetch(`http://127.0.0.1:${port}/api/health`)).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(ready,log);
 const endpoint=`http://127.0.0.1:${port}/api/account/reason`;
 assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Test'})})).status,401);assert.equal(forwarded.length,0);
 const headers={Authorization:'Bearer mock-user-token','Content-Type':'application/json'};
 const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({prompt:'Suggest safe intent',modelConfig:{provider:'Groq',model:'Account default model',maxTokens:1024,temperature:0.5}})});assert.equal(response.status,200);assert.equal((await response.json()).content,'NPC advice');assert.equal(forwarded[0].body.provider,'groq');assert.equal(forwarded[0].body.source,'npc-ai-sim');assert.equal(forwarded[0].body.model,undefined);
 const unsupported=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({prompt:'Test',modelConfig:{provider:'Custom agent endpoint'}})});assert.equal(unsupported.status,400);assert.equal(forwarded.length,1);
 console.log('NPC account proxy checks passed (mock central service; no live provider calls).');
}finally{child.kill();await new Promise(resolve=>central.close(resolve));}
