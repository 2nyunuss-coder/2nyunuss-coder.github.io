const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../yea-suite/arcade/engine.js');
test('all 20 arrow boards have a complete valid solution',()=>{
  for(let level=1;level<=20;level++){const game=new E.Arrows(level);for(const i of game.solution)assert.equal(game.tap(i),true,`level ${level}, cell ${i}`);assert.equal(game.status,'won');assert.equal(game.lives,3);}
});
test('blocked arrows lose a life and undo restores it',()=>{
  const game=new E.Arrows(8),original=[...game.cells];const blocked=game.cells.findIndex((dir,i)=>!E.pathClear(game.cells,game.n,i,dir));assert(blocked>=0);assert.equal(game.tap(blocked),false);assert.equal(game.lives,2);game.undo();assert.equal(game.lives,3);assert.deepEqual(game.cells,original);
});
test('all 30 block puzzles are reversible to matching exits',()=>{
  for(let level=1;level<=30;level++){const g=new E.Blocks(level);for(const [id,dir] of g.reverse)assert.equal(g.move(id,dir),true,`level ${level}`);for(const p of g.pieces){assert.equal(g.move(p.id,p.exit),true);assert.equal(p.out,true);}assert.equal(g.status,'won');}
});
test('block movement cannot overlap another block or use the wrong gate',()=>{
  const pieces=JSON.parse(JSON.stringify(E.gates.slice(0,4)));assert.equal(E.blockMove(pieces,'R',0),false);assert.equal(E.blockMove(pieces,'R',2),true);assert.equal(E.blockMove(pieces,'R',1),false);
});
test('block undo restores the board and move counter',()=>{
  const g=new E.Blocks(10),original=JSON.stringify(g.pieces),[id,dir]=g.reverse[0];g.move(id,dir);g.undo();assert.equal(JSON.stringify(g.pieces),original);assert.equal(g.moves,0);
});
test('wood cannot be restored by cutting; raw and finished forms are graded correctly',()=>{
  for(let level=1;level<=12;level++){const g=new E.Wood(level);assert.equal(g.accuracy(),0);assert.equal(g.finish(),false);g.cut(25,80,1);const before=[...g.profile];g.cut(25,120,1);assert(g.profile.every((r,i)=>r<=before[i]));g.profile=[...g.target];assert.equal(g.accuracy(),100);assert.equal(g.finish(),true);assert.equal(g.status,'won');}
});
test('all hole levels offer reachable growth and can finish within the timer',()=>{
  for(let level=1;level<=20;level++){const g=new E.Hole(level);let ticks=0;while(g.status==='playing'&&ticks<10000){const eligible=g.items.filter(x=>!x.taken&&x.r<=g.hole.r).sort((a,b)=>Math.hypot(a.x-g.hole.x,a.y-g.hole.y)-Math.hypot(b.x-g.hole.x,b.y-g.hole.y));assert(eligible.length,'growth dead end');g.target=eligible[0];g.update(1/30);ticks++;}assert.equal(g.status,'won',`level ${level}, ${g.collected}/${g.total}`);}
});
test('hole ignores oversized items and loses at time zero',()=>{
  const g=new E.Hole(1),large=g.items.find(x=>x.r>g.hole.r);g.hole.x=large.x;g.hole.y=large.y;g.target=large;g.update(.01);assert.equal(large.taken,false);g.time=.001;g.update(.02);assert.equal(g.status,'lost');
});
test('castle disallows parallel shots and settles after a missed shot',()=>{
  const g=new E.Castle(1);assert.equal(g.fire(80,20),true);assert.equal(g.fire(44,80),false);for(let i=0;i<300;i++)g.update(1/60);assert.equal(g.ball,null);assert.equal(g.shots,7);assert(Number.isFinite(g.score()));
});
test('territory enforces source ownership and in-flight strength',()=>{
  const g=new E.Territory(1);assert.equal(g.send(2,0,.5),false);assert.equal(g.send(0,0,.5),false);const initial=g.nodes[0].power;assert.equal(g.send(0,1,.5),true);assert.equal(g.nodes[0].power+g.fleets[0].count,initial);for(let i=0;i<200;i++)g.update(1/60);assert(g.nodes.every(n=>Number.isFinite(n.power)&&n.power>=0));
});
test('all six games are registered with independent constructors and bounded levels',()=>{
  assert.equal(E.catalog.length,6);assert.equal(new Set(E.catalog.map(g=>g.id)).size,6);for(const g of E.catalog){const m=new g.Model(1);assert.equal(m.status,'playing');assert(g.levels>=10&&g.levels<=30);assert(Number.isFinite(m.score()));}
});
test('service worker cache references all exist, including mobile and all arcade assets',()=>{
  const root=path.resolve(__dirname,'../yea-suite'),source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const context=vm.createContext({self:{addEventListener(){}}});vm.runInContext(source,context);const entries=vm.runInContext('CORE',context);
  for(const entry of entries)assert(fs.existsSync(path.join(root,entry)),`missing ${entry}`);
  for(const entry of ['v18.html','v18-mobile.js','arcade/engine.js','arcade/arcade.js'])assert(entries.includes('./'+entry));
});
test('new entry points reference existing local resources and contain no inline executable handlers',()=>{
  const root=path.resolve(__dirname,'../yea-suite');for(const name of ['v18.html','arcade/index.html']){const file=path.join(root,name),html=fs.readFileSync(file,'utf8');assert(!/\son\w+=/i.test(html));for(const m of html.matchAll(/(?:src|href)="(\.\/?[^"#]+)"/g)){assert(fs.existsSync(path.resolve(path.dirname(file),m[1])),`missing ${m[1]}`);}}
});
