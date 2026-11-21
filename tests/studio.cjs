const engines=require('playwright');
const assert=require('node:assert/strict'), path=require('node:path');
const http=require('node:http'),fs=require('node:fs');
(async()=>{
const server=http.createServer((req,res)=>{
 const name=req.url==='/'?'index.html':req.url.slice(1);
 if(!['index.html','routine.js','scores.js','studio.js','coach.js','riff-data.js','riff-editor.js','tool-visuals.js','note-picker.js','learning-tools.js','pitch-tools.js','music-drills.js','practice-plans.js','studio.css','pages.js','abc-lessons.js','acoustic-cover.webp'].includes(name)){res.writeHead(404).end();return}
 const file=path.join(__dirname,'..',name);
 if(!fs.existsSync(file)){res.writeHead(404).end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
browser=await engines[process.argv[2] || 'chromium'].launch();
let page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>{if(location.protocol==='http:' && !localStorage.getItem('fretboard-v2'))localStorage.setItem('fretboard-v2',JSON.stringify({notes:'Old notes',days:{'2026-11-20':true},times:{ear:125},done:{ear:true}}))});
await page.goto('http://127.0.0.1:'+server.address().port);
assert.equal(await page.locator('#notes').inputValue(),'Old notes');
async function moreTools(){
  if(!await page.locator('#moreTools').evaluate(d=>d.open))await page.locator('#moreTools summary').click();
}
const nav=async name=>{
  await page.locator('.brandbar nav').getByRole('link',{name,exact:true}).click();
  const panels={Practice:'#practicePage',Songs:'#songsPage',Tools:'#toolsPage',Journal:'#journal'};
  await page.locator(panels[name]).waitFor();
};
const choose=async id=>{
  await nav('Practice');
  await page.locator('.exercise-row[data-lesson="'+id+'"]').click();
  await page.locator('#studio').waitFor();
};
assert.ok(await page.locator('#practicePage').isVisible());
assert.ok(await page.locator('#studio').isHidden());
assert.equal(await page.locator('.exercise-row').count(),11);
assert.equal(await page.locator('#todayCount').innerText(),'0 of 11 done');
await page.click('#nextExercise');
assert.equal(new URL(page.url()).hash,'#exercise/chromatic');
await page.click('#timerBtn');await page.evaluate(()=>history.back());await page.locator('#practicePage').waitFor();
assert.ok(await page.locator('#practicePage').isVisible());
assert.equal(await page.evaluate(()=>timerRunning),false);
assert.equal(await page.locator('#todayCount').innerText(),'0 of 11 done');
await page.evaluate(()=>history.forward());await page.locator('#studio').waitFor();
await page.click('#step');assert.match(await page.locator('#placement').innerText(),/fret 6/);
const deepLink=page.url();await page.goto('about:blank');await page.goto(deepLink);await page.locator('#studio').waitFor();
await page.reload();assert.equal(await page.locator('#lesson').inputValue(),'chromatic');
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
  await choose(id);
  const result=await page.evaluate(()=>{
   const problems=[];
   for(const bar of score().bars)if(bar.reduce((sum,n)=>sum+n.beats,0)!==4)problems.push('bad duration');
   for(let i=0;i<sequence.length;i++){
    seek(i);
    if(document.querySelectorAll('.tabcol.current').length!==1)problems.push('cursor');
    if(document.querySelectorAll('.fret.selected').length!==sequence[i].positions.length)problems.push('neck');
   }
   if(document.documentElement.scrollWidth>innerWidth+1){
     const outside=[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && !el.closest('.staff-scroll'));
     problems.push('overflow '+document.documentElement.scrollWidth+' from '+outside.slice(0,12).map(el=>(el.id||el.className||el.tagName)+' '+Math.round(el.getBoundingClientRect().right)).join(', '));
   }
   return problems;
  });
  assert.deepEqual(result,[],width+' '+id);
 }
 console.log('11 lessons and every position at width',width);
}
await choose('chromatic');
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
await nav('Tools');assert.equal(await page.locator('#toolTiles button').count(),2);assert.ok(await page.locator('#otherTiles').isHidden());await moreTools();await page.click('#metroBtn');
assert.deepEqual(await page.locator('#dots .dot').allTextContents(),['1','2','3','4']);
assert.equal(await page.locator('#dots .lit').count(),1);assert.equal(await page.locator('#metroBtn').innerText(),'Stop click');
await choose('chromatic');await page.click('#play');assert.equal(await page.locator('#metroBtn').innerText(),'Start click');
await choose('ear');
await page.getByRole('button',{name:'Hear a pair'}).click();
await page.getByRole('button',{name:'Higher',exact:true}).click();assert.match(await page.locator('#quiz').innerText(),/of 1 correct/);
await choose('findnotes');await page.getByRole('button',{name:'New question'}).click();
assert.equal(await page.locator('#quiz div button').count(),12);
await page.click('#timerBtn');await page.waitForTimeout(520);await page.click('#timerBtn');
assert.ok(await page.evaluate(()=>store.times.findnotes>0));
await page.evaluate(()=>{remaining=.05});await page.click('#timerBtn');await page.waitForTimeout(300);
assert.equal(await page.locator('#timer').innerText(),'00:00');assert.equal(await page.locator('#doneCount').innerText(),'1/11');
await page.click('#complete');assert.ok(await page.locator('#practicePage').isVisible());assert.equal(await page.locator('#todayCount').innerText(),'1 of 11 done');
await page.click('#undoDone');assert.equal(await page.locator('#todayCount').innerText(),'0 of 11 done');
await choose('findnotes');await page.click('#complete');
await choose('findnotes');await page.click('#complete');assert.equal(await page.locator('#todayCount').innerText(),'1 of 11 done');assert.equal(await page.locator('#doneCount').innerText(),'2/11');
await nav('Journal');await page.locator('#notes').fill('Test journal');const dl=page.waitForEvent('download');await page.click('#export');
const download=await dl;const contents=JSON.parse(fs.readFileSync(await download.path()));
assert.equal(contents.notes,'Test journal');assert.equal(contents.bests['chromatic-bar1'],180);
await page.reload();assert.equal(await page.locator('#notes').inputValue(),'Test journal');assert.equal(await page.locator('#doneCount').innerText(),'2/11');
await choose('chromatic');await page.setViewportSize({width:390,height:844});

await choose('song');
await page.selectOption('#phrase','1');
await page.click('#faster');
await page.click('#coachStart');
assert.match(await page.locator('#coachHint').innerText(),/bar 2 · 60 BPM/);
await page.click('#repClean');
await page.click('#repMiss');
assert.match(await page.locator('#repStatus').innerText(),/hesitation/);
await page.click('#repClean');
await page.click('#slower');
assert.match(await page.locator('#repStatus').innerText(),/New tempo/);
await page.click('#repClean');
assert.equal(await page.locator('#recallDialog').isVisible(),false);
await page.click('#repClean');
assert.equal(await page.locator('#recallTitle').innerText(),'Switch tasks for two bars');
await page.click('#recallClick');
assert.equal(await page.locator('#recallClick').innerText(),'Stop click');
await page.getByRole('button',{name:'Try original phrase from memory'}).click();
assert.equal(await page.locator('#recallTitle').innerText(),'Play it from memory');
assert.equal(await page.locator('#recallClick').innerText(),'Start click');
await page.getByRole('button',{name:'Played it cleanly'}).click();
await page.click('#closeRecall');
let review=await page.evaluate(()=>store.phraseReviews['song/0/1']);
assert.equal(review.bpm,55);
assert.equal(review.streak,0);
assert.equal(review.reviews,0);
assert.ok(Math.abs(review.due-Date.now()-86400000)<10000);
assert.equal(await page.locator('#startReview').isVisible(),false);
await page.evaluate(()=>{store.phraseReviews['song/0/1'].due=Date.now()-100;save()});
await page.reload();
await nav('Practice');await page.click('#startReview');
assert.equal(await page.locator('#recallTitle').innerText(),'First try of this review');
await page.getByRole('button',{name:'Played it cleanly'}).click();
await page.click('#closeRecall');
review=await page.evaluate(()=>store.phraseReviews['song/0/1']);
assert.equal(review.streak,1);
assert.equal(review.reviews,1);
assert.ok(Math.abs(review.due-Date.now()-3*86400000)<10000);
await page.evaluate(()=>{store.phraseReviews['song/0/1'].due=Date.now()-100;save()});
await page.reload();await nav('Practice');await page.click('#startReview');
await page.getByRole('button',{name:'Needed a cue'}).click();
await page.getByRole('button',{name:'Practice this phrase',exact:true}).click();
assert.equal(await page.locator('#lesson').inputValue(),'song');
assert.equal(await page.locator('#phrase').inputValue(),'1');
assert.equal(await page.locator('#speed').innerText(),'55 BPM');
assert.equal(await page.locator('#repClean').isVisible(),true);
assert.equal(await page.locator('#doneCount').innerText(),'2/11');
assert.equal(await page.locator('#notes').inputValue(),'Test journal');
await choose('emam');
assert.equal(await page.locator('#repClean').isVisible(),false);
await page.click('#coachStart');
assert.match(await page.locator('#coachHint').innerText(),/both bars/);
await page.setViewportSize({width:320,height:640});
await page.click('#repClean');await page.click('#repClean');
assert.ok(await page.locator('#recallDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
await page.keyboard.press('Escape');
assert.equal(await page.locator('#recallDialog').isVisible(),false);
console.log('PASS phrase training, repair, tempo change, cue-free recall, delayed review, target restoration and phone dialog.');

await nav('Tools');await moreTools();await page.click('#newRiff');
await page.fill('#riffName','B-string 10–9');
await page.selectOption('#riffWindow','6');
const fretButton=n=>page.getByRole('button',{name:'Add B string fret '+n,exact:true});
for(const fret of [10,9,10])await fretButton(fret).click();
await page.selectOption('#riffLength','2');await fretButton(9).click(); // beats 4 to 1 of bar two
await page.selectOption('#riffLength','0.5');await page.click('#addRest');
await page.click('#undoNote');await page.click('#addRest');
await page.click('#closeRiff');await page.reload();await nav('Tools');await moreTools();await page.click('#newRiff');
assert.equal(await page.locator('#riffName').inputValue(),'B-string 10–9');
assert.equal(await page.locator('#draftNotes button').count(),5);
assert.equal(await page.locator('#riffRibbon .riff-measure').count(),2);
assert.equal(await page.locator('#riffRibbon .rest').count(),1);
await page.locator('#draftNotes button').first().click();await page.click('#replaceNote');
await page.selectOption('#riffWindow','6');await fretButton(10).click();
await page.click('#saveRiff');
const riffId=await page.locator('#lesson').inputValue();
assert.ok(riffId.startsWith('riff-'));
assert.equal(await page.locator('#lessonTitle').innerText(),'B-string 10–9');
assert.equal(await page.locator('#placement').innerText(),'B string · fret 10 · your fingering');
assert.deepEqual(await page.evaluate(()=>sequence.map(n=>[n.sourceIndex,n.bar,n.beats,n.continuation])),
  [[0,0,1,false],[1,0,1,false],[2,0,1,false],[3,0,1,false],[3,1,1,true],[4,1,.5,false]]);
await page.locator('#rangeTool summary').click();
await page.selectOption('#rangeFirst','3');await page.selectOption('#rangeLast','4');await page.click('#applyRange');
assert.equal(await page.locator('#phrase').inputValue(),'notes-3-4');
assert.equal(await page.locator('#loop').getAttribute('aria-pressed'),'true');
await page.evaluate(()=>setBpm(180));
await page.selectOption('#rangeGap','2');
await page.evaluate(()=>{
  window.riffSounds=[];
  const previous=sound;
  sound=(e,time,length)=>{window.riffSounds.push({action:e.action,index:e.sourceIndex,time,length});previous(e,time,length)};
});
await page.click('#play');
await page.waitForFunction(()=>document.getElementById('count').textContent.startsWith('Count in'));
await page.waitForFunction(()=>window.riffSounds.filter(e=>e.action==='Pick').length>=2);
await page.click('#play');
const sounding=await page.evaluate(()=>window.riffSounds.filter(e=>e.action==='Pick'));
assert.ok(sounding.every(e=>e.index===3 && Math.abs(e.length-2/3)<.01));
assert.ok(sounding[1].time-sounding[0].time>=1.43,'reset gap should separate repeated notes');
await page.click('#growRange');assert.equal(await page.locator('#phrase').inputValue(),'notes-2-4');
await page.click('#coachStart');
assert.match(await page.locator('#coachHint').innerText(),/notes 3–5/);
await page.click('#repMiss');assert.doesNotMatch(await page.locator('#repStatus').innerText(),/undefined/);
await page.click('#repClean');await page.click('#repClean');
await page.getByRole('button',{name:'Try original phrase from memory'}).click();
await page.getByRole('button',{name:'Needed a cue'}).click();await page.click('#closeRecall');
await page.evaluate(id=>{store.phraseReviews[id+'/0/notes-2-4'].due=Date.now()-1;save()},riffId);
await page.reload();await nav('Practice');await page.click('#startReview');
assert.match(await page.locator('#recallTarget').innerText(),/notes 3–5/i);
await page.getByRole('button',{name:'Needed a cue'}).click();
await page.getByRole('button',{name:'Practice this phrase',exact:true}).click();
assert.equal(await page.locator('#lesson').inputValue(),riffId);
assert.equal(await page.locator('#phrase').inputValue(),'notes-2-4');
assert.equal(await page.locator('#speed').innerText(),'180 BPM');
await page.click('#copyRiff');assert.equal(await page.locator('#draftNotes button').count(),5);
assert.equal(await page.locator('#riffRibbon .riff-measure').count(),2);
assert.equal(await page.locator('#riffRibbon .rest').count(),1);
await page.locator('#draftNotes button').last().click();await page.click('#deleteNote');
assert.equal(await page.locator('#draftNotes button').count(),4);await page.click('#saveRiff');
assert.notEqual(await page.locator('#lesson').inputValue(),riffId);
await nav('Journal');const exported=page.waitForEvent('download');await page.click('#export');
const backup=JSON.parse(fs.readFileSync(await (await exported).path()));
assert.equal(backup.riffs.length,2);assert.equal(backup.riffs[0].events.length,5);
await choose('chromatic');
await page.locator('#rangeTool').evaluate(el=>el.open=true);
await page.selectOption('#rangeFirst','3');await page.selectOption('#rangeLast','4');await page.click('#applyRange');
assert.deepEqual(await page.evaluate(()=>sequence.map(e=>e.bar)),[0,1]);
for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:800});await nav('Tools');await moreTools();await page.click('#newRiff');
  assert.ok(await page.locator('#riffDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  await page.click('#closeRiff');
  const overflow=await page.evaluate(()=>{
    if(document.documentElement.scrollWidth<=innerWidth+1)return null;
    return {width:innerWidth,page:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('main *')].filter(e=>e.clientWidth && (e.scrollWidth>e.clientWidth+1 || e.getBoundingClientRect().right>innerWidth+1)).slice(0,30).map(e=>[e.id||e.className||e.tagName,e.clientWidth,e.scrollWidth,Math.round(e.getBoundingClientRect().right)])};
  });
  assert.equal(overflow,null,JSON.stringify(overflow));
}
console.log('PASS riff editing, draft recovery, sustained notes, cross-bar loop bounds, count-in, gap, expansion, custom recall and export.');

await choose('chromatic');
for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:844});
  const [tab,neck]=await Promise.all([page.locator('.tab-panel').boundingBox(),page.locator('.neck-panel').boundingBox()]);
  if(width>900)assert.ok(neck.x>=tab.x+tab.width-1);
  else assert.ok(neck.y>=tab.y+tab.height-1);
  for(const id of ['play','step','focusMode'])assert.ok((await page.locator('#'+id).boundingBox()).height>=44);
}
for(const scheme of ['dark','light']){
  await page.emulateMedia({colorScheme:scheme});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),scheme);
}
const cover=await page.request.get(new URL('/acoustic-cover.webp',page.url()).href);
assert.equal(cover.status(),200);assert.equal((await cover.body()).subarray(8,12).toString(),'WEBP');
await page.click('#focusMode');
assert.equal(await page.locator('#focusMode').getAttribute('aria-pressed'),'true');
assert.ok(await page.locator('#studio .lesson-head').isHidden());
await page.click('#step');
assert.ok(await page.locator('.fret.selected').count()>0);
await page.keyboard.press('Escape');
assert.ok(await page.locator('#studio .lesson-head').isVisible());
// Start each remaining suite in a fresh tab with the same saved practice data.
async function reopenInFreshContext(url){
  const oldContext=page.context();
  const saved=await oldContext.storageState();
  const context=await browser.newContext({storageState:saved});
  page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url);
  await oldContext.close();
}
await reopenInFreshContext(page.url());
await require('./learning-tools.cjs')(page,assert,choose,nav);
await reopenInFreshContext(page.url().split('#')[0]+'#practice');
await nav('Practice');
await page.reload();assert.equal(await page.locator('#todayCount').innerText(),'1 of 11 done');
const tomorrow=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.getTime()});
await page.clock.setFixedTime(new Date(tomorrow));
await nav('Tools');await nav('Practice');
assert.equal(await page.locator('#todayCount').innerText(),'0 of 11 done');
assert.equal(await page.locator('#doneCount').textContent(),'2/11');
await nav('Songs');
const sample='X:1\nT:Test study\nM:3/4\nL:1/8\nQ:1/4=90\nK:none\n(3CDE [G,B,]2 z2 | ^F2 F2-F2 | Z |]';
await page.locator('#abcFiles').setInputFiles({name:'study.abc',mimeType:'text/plain',buffer:Buffer.from(sample)});
await page.getByText('1 song lesson ready on this device.').waitFor();
await page.locator('#songList a').click();await page.locator('#noteBars button').first().waitFor();
assert.equal(await page.locator('#noteBars button').count(),3);
assert.deepEqual(await page.evaluate(()=>score().bars.map(b=>Math.round(b.reduce((a,e)=>a+e.beats,0)))),[3,3,3]);
assert.equal(await page.evaluate(()=>score().bars[1][2].continuation),true);
assert.deepEqual(await page.evaluate(()=>score().bars[1].map(e=>e.midis[0])),[66,66,66]);
await page.locator('#noteBars button').nth(1).click();assert.equal(await page.locator('#phrase').inputValue(),'1');
await page.click('#complete');assert.ok(await page.locator('#songsPage').isVisible());await page.reload();
assert.equal(await page.locator('#songList .is-done').count(),1);
const explicitPull=await page.evaluate(()=>compileAbc('X:1\nT:Descending study\nM:4/4\nL:1/4\nQ:1/4=72\nK:none\n% pull-off (2 to 0)\n^F E z2 |]').bars[0].map(e=>e.action));
assert.deepEqual(explicitPull,['Pick','Pull-off','Rest']);
const packed=require('node:zlib').gzipSync(JSON.stringify([sample,sample.replace('Test study','Second study')])).toString('base64url');
await page.goto(page.url().split('#')[0]+'#songbook='+packed);await page.getByText('2 song lessons ready on this device.').waitFor();
assert.equal(await page.locator('#songList a').count(),2);assert.equal(new URL(page.url()).hash,'#songs');
console.log('PASS ABC imports, songbook links, triplets, accidentals, ties, chord voicings, named notes and daily song completion.');
assert.deepEqual(errors,[]);console.log('PASS progression, timing, loop boundaries, transport, metronome handoff, blind quiz, note quiz, timer expiry, completion, export, legacy persistence.');
}finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
