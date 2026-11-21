const engines=require('playwright');
const assert=require('node:assert/strict'), path=require('node:path');
const http=require('node:http'),fs=require('node:fs');
(async()=>{
const server=http.createServer((req,res)=>{
 const name=req.url==='/'?'index.html':req.url.slice(1);
 if(!['index.html','routine.js','scores.js','studio.js','studio.css'].includes(name)){res.writeHead(404).end();return}
 const file=path.join(__dirname,'..',name);
 if(!fs.existsSync(file)){res.writeHead(404).end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
browser=await engines[process.argv[2] || 'chromium'].launch();
const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>{if(!localStorage.getItem('fretboard-v2'))localStorage.setItem('fretboard-v2',JSON.stringify({notes:'Old notes',days:{'2026-11-20':true},times:{ear:125},done:{ear:true}}))});
await page.goto('http://127.0.0.1:'+server.address().port);
assert.equal(await page.locator('#notes').inputValue(),'Old notes');
const pitches=await page.evaluate(()=>[
  pitchAt(1,5),pitchAt(2,10),pitchAt(3,2),pitchAt(6,0)
].map(p=>[p.name+p.octave,Math.round(p.hz)]));
assert.deepEqual(pitches,[['A4',440],['A4',440],['A3',220],['E2',82]]);
assert.equal(await page.locator('#doneCount').innerText(),'1/11');
assert.equal(await page.locator('#practiceTime').innerText(),'2m');
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:850});
 const ids=await page.locator('#lesson option').evaluateAll(nodes=>nodes.map(n=>n.value));
 assert.equal(ids.length,11);
 for(const id of ids){
  await page.selectOption('#lesson',id);
  const result=await page.evaluate(()=>{
   const problems=[];
   for(const bar of score().bars)if(bar.reduce((sum,n)=>sum+n.beats,0)!==4)problems.push('bad duration');
   for(let i=0;i<sequence.length;i++){
    seek(i);
    if(document.querySelectorAll('.tabcol.current').length!==1)problems.push('cursor');
    if(document.querySelectorAll('.fret.selected').length!==sequence[i].positions.length)problems.push('neck');
   }
   if(document.documentElement.scrollWidth>innerWidth+1)problems.push('page overflow '+document.documentElement.scrollWidth);
   return problems;
  });
  assert.deepEqual(result,[],width+' '+id);
 }
 console.log('11 lessons and every position at width',width);
}
await page.selectOption('#lesson','chromatic');
for(const level of ['1','2','3','0']){
 await page.selectOption('#level',level);
 assert.equal(await page.evaluate(()=>score().bars.every(b=>b.reduce((n,e)=>n+e.beats,0)===4)),true);
}
await page.selectOption('#phrase','1');
assert.match(await page.locator('#placement').innerText(),/fret 8/);
await page.click('#step');assert.match(await page.locator('#placement').innerText(),/fret 7/);
await page.click('#restart');await page.click('#loop');
await page.evaluate(()=>{
  window.audioEvents=[];
  const original=voice;
  voice=(hz,duration,time,...rest)=>{
    window.audioEvents.push({hz,time});
    original(hz,duration,time,...rest);
  };
});
await page.evaluate(()=>setBpm(180));await page.click('#play');await page.waitForTimeout(1560);
assert.match(await page.locator('#play').innerText(),/Pause/);
assert.match(await page.locator('#barName').innerText(),/Bar 2/);
const events=await page.evaluate(()=>window.audioEvents);
const clicks=events.filter(e=>e.hz===1250 || e.hz===890);
assert.ok(clicks.length>=4,'expected four audible click events');
assert.ok(events.some(e=>Math.abs(e.hz-523.251)<.01 && clicks.some(c=>Math.abs(c.time-e.time)<.001)),
  'the C5 at the start of the isolated bar should coincide with a click');
await page.click('#play');const paused=await page.locator('#placement').innerText();await page.waitForTimeout(450);
assert.equal(await page.locator('#placement').innerText(),paused);
await page.click('#loop');await page.click('#restart');await page.click('#play');
await page.waitForFunction(()=>document.getElementById('play').textContent.includes('Replay'));
await page.click('#saveBest');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('fretboard-v2')).bests['chromatic-bar1']),180);
await page.click('#metroBtn');assert.equal(await page.locator('#metroBtn').innerText(),'Stop click');
await page.click('#play');assert.equal(await page.locator('#metroBtn').innerText(),'Start click');
await page.selectOption('#lesson','ear');
await page.getByRole('button',{name:'Hear a pair'}).click();
await page.getByRole('button',{name:'Higher',exact:true}).click();assert.match(await page.locator('#quiz').innerText(),/of 1 correct/);
await page.selectOption('#lesson','findnotes');await page.getByRole('button',{name:'New question'}).click();
assert.equal(await page.locator('#quiz div button').count(),12);
await page.click('#timerBtn');await page.waitForTimeout(520);await page.click('#timerBtn');
assert.ok(await page.evaluate(()=>store.times.findnotes>0));
await page.evaluate(()=>{remaining=.05});await page.click('#timerBtn');await page.waitForTimeout(300);
assert.equal(await page.locator('#timer').innerText(),'00:00');assert.equal(await page.locator('#doneCount').innerText(),'1/11');
await page.click('#complete');assert.equal(await page.locator('#doneCount').innerText(),'2/11');
await page.locator('#notes').fill('Test journal');const dl=page.waitForEvent('download');await page.click('#export');
const download=await dl;const contents=JSON.parse(fs.readFileSync(await download.path()));
assert.equal(contents.notes,'Test journal');assert.equal(contents.bests['chromatic-bar1'],180);
await page.reload();assert.equal(await page.locator('#notes').inputValue(),'Test journal');assert.equal(await page.locator('#doneCount').innerText(),'2/11');
await page.selectOption('#lesson','chromatic');await page.setViewportSize({width:390,height:844});

assert.deepEqual(errors,[]);console.log('PASS progression, timing, loop boundaries, transport, metronome handoff, blind quiz, note quiz, timer expiry, completion, export, legacy persistence.');
}finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
