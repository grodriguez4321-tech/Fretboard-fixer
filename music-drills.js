function scoreTaps(expected, taps, beatSeconds) {
  const window=Math.min(.20,beatSeconds*.44);
  const offsets=[];const unused=new Set(expected.map((_,i)=>i));
  for(const tap of taps){
    let best=-1,error=Infinity;
    for(const i of unused){const d=Math.abs(tap-expected[i]);if(d<error){best=i;error=d}}
    if(best>=0 && error<=window){unused.delete(best);offsets.push(Math.round((tap-expected[best])*1000))}
  }
  return {offsets,missed:unused.size,extra:taps.length-offsets.length};
}
lab.add('rhythm','Rhythm trainer','Tap a pattern, see early and late hits, or keep time when the click drops out.',()=>{
  const patterns=[
    {name:'Four quarter notes',beats:[0,1,2,3],count:'1 · 2 · 3 · 4'},
    {name:'Two eighths on beat two',beats:[0,1,1.5,2,3],count:'1 · 2 & · 3 · 4'},
    {name:'Rest on beat two',beats:[0,2,2.5,3],count:'1 · rest · 3 & · 4'}
  ];
  const view=toolVisual.panel('rhythm');
  const pattern=lab.select('Pattern',patterns.map((p,i)=>[i,p.name]),0);
  const mode=lab.select('Test click',[['on','Click throughout'],['gap','Silent test bar']],'on');
  const bpm=lab.select('Tempo',[45,60,75,90,120].map(v=>[v,v+' BPM']),60);
  const info=lab.status(),result=element('div'),pad=lab.button('Tap here',()=>{},'tap-pad');
  let expected=[],hits=[],start=0,end=0,beat=1,timers=[],run=0;
  let step=-1,clockOrigin=0;
  const drawGrid=()=>toolVisual.rhythm(view,patterns[Number(pattern.input.value)].beats,step,hits.map(t=>(t-start)/beat));
  function clear(){step=-1;hits=[];drawGrid();run++;timers.forEach(clearTimeout);timers=[];silence();expected=[];pad.disabled=true}
  function tap(event){
    if(event?.repeat || !expected.length)return;
    // Anchor input to the same instant as the scheduled bar. Some WebKit
    // outputs expose a zero or stale device timestamp, especially on resume.
    const now=performance.now();
    const inputTime=event?.timeStamp>0 && Math.abs(event.timeStamp-now)<1000 ? event.timeStamp : now;
    const scheduledTime=clockOrigin+inputTime/1000;
    const stamp=audio.getOutputTimestamp?.();
    const outputTime=stamp?.contextTime+(inputTime-stamp?.performanceTime)/1000;
    const usable=stamp?.contextTime>0 && stamp.performanceTime>0 && Math.abs(now-stamp.performanceTime)<300 && Math.abs(outputTime-scheduledTime)<.15;
    const t=usable ? outputTime : scheduledTime;
    if(t<start-beat*.35 || t>end)return;
    hits.push(t);drawGrid();pad.textContent='Tap · '+hits.length;
  }
  pad.onpointerdown=tap;pad.onclick=e=>{if(e.detail===0)tap(e)};
  function finish(){
    step=-1;drawGrid();
    const {offsets,missed,extra}=scoreTaps(expected,hits,beat);
    result.replaceChildren(element('strong',offsets.length+' of '+expected.length+' hits matched · '+missed+' missed · '+extra+' extra'));
    result.append(element('p',offsets.map(ms=>ms===0?'On beat':Math.abs(ms)+' ms '+(ms<0?'early':'late')).join(' · ')));
    info.textContent='Try the same pattern again or change the tempo.';expected=[];pad.disabled=true;
  }
  async function startRound(test){
    clear();const id=run;
    if(!await lab.audioReady(info) || id!==run)return;
    result.replaceChildren();hits=[];beat=60/Number(bpm.input.value);
    const p=patterns[Number(pattern.input.value)],t=audio.currentTime+.12;
    clockOrigin=audio.currentTime-performance.now()/1000;
    const at=(time,fn)=>timers.push(setTimeout(()=>{if(id===run)fn()},Math.max(0,1000*(time-clockOrigin)-performance.now())));
    const click=(time,accent)=>voice(accent?980:710,.045,time,.11,null,'sine');
    for(let i=0;i<4;i++)click(t+i*beat,i===0);
    start=t+4*beat;end=start+4*beat;
    info.textContent='Count in · four beats';pad.textContent='Tap here';
    at(start,()=>{info.textContent=test?'Your turn · '+p.count:'Listen · '+p.count});
    if(!test || mode.input.value==='on'){
      for(let i=0;i<8;i++)at(start+i*beat/2,()=>{step=i;drawGrid()});
    }
    if(test){
      expected=p.beats.map(b=>start+b*beat);pad.disabled=false;
      if(mode.input.value==='on')for(let i=0;i<4;i++)click(start+i*beat,i===0);
      click(end,true);at(end+.08,finish);
    }else{
      for(const b of p.beats)voice(300,.10,start+b*beat,.16,null,'triangle');
      at(end,()=>{step=-1;drawGrid();info.textContent='Now try tapping it back.'});
    }
  }
  clear();info.textContent='Listen once. Start a test, count four clicks, then tap the pattern. Use wired headphones or the device speaker. Wireless audio can affect timing.';
  lab.body.append(view.surface,lab.fields(pattern.box,mode.box,bpm.box),lab.row(lab.button('Hear pattern',()=>startRound(false)),lab.button('Start tap test',()=>startRound(true),'primary')),info,pad,result);
  for(const field of [pattern,mode,bpm])field.input.onchange=()=>{clear();result.replaceChildren();info.textContent='Ready for the new settings.'};
  lab.onStop(clear);
});

const earBank=[
  {string:2,fret:5},{string:2,fret:7},{string:2,fret:8},
  {string:1,fret:5},{string:1,fret:7},{string:1,fret:8}
];
const asNote=p=>note(p.string,p.fret,null);
lab.add('earMelody','Melody by ear','Hear an original phrase, sing it, then find the notes on your guitar.',()=>{
  const view=toolVisual.panel('earMelody');
  const size=lab.select('Phrase length',[3,4,5].map(n=>[n,n+' notes']),3);
  const strings=lab.select('Strings',[['one','B string'],['two','B and high E']],'one');
  const msg=lab.status(),progress=element('p',null,'lab-metric'),answers=element('div',null,'ear-neck');
  let phrase=[],index=0,hints=0,misses=0,ticket=0;
  let hintIndex=-1,playing=-1,lights=[];
  function stopLights(){lights.forEach(clearTimeout);lights=[];playing=-1}
  const drawPhrase=()=>toolVisual.melody(view,Number(size.input.value),phrase,index,hintIndex,playing);
  function draw(){drawPhrase();progress.textContent=index===phrase.length && phrase.length ? 'Complete · '+hints+' hints · '+misses+' retries' : index+' / '+phrase.length+' found'}
  async function hear(){
    const id=++ticket;stopLights();drawPhrase();silence();
    if(!await lab.audioReady(msg)||id!==ticket)return;
    const start=audio.currentTime+.07;
    phrase.forEach((p,i)=>{
      sound(asNote(p),start+i*.58,.5);
      lights.push(setTimeout(()=>{if(id===ticket){playing=i;drawPhrase()}},70+i*580));
    });
    lights.push(setTimeout(()=>{if(id===ticket){playing=-1;drawPhrase()}},70+phrase.length*580));
  }
  function newPhrase(){
    const pool=earBank.slice(0,strings.input.value==='one'?3:6);
    phrase=[];index=hints=misses=0;hintIndex=-1;
    for(let i=0;i<Number(size.input.value);i++){
      const choices=pool.filter(p=>p!==phrase.at(-1));phrase.push(choices[Math.floor(Math.random()*choices.length)]);
    }
    answers.replaceChildren();
    answers.append(element('span'));
    for(const fret of [5,7,8])answers.append(element('span','Fret '+fret));
    for(const p of pool){
      if(p.fret===5)answers.append(element('span',stringNames[p.string-1]));
      const key=lab.button(String(p.fret),()=>{
      if(index>=phrase.length)return;
      ticket++;stopLights();silence();audition(asNote(p));
      for(const k of answers.querySelectorAll('button'))k.removeAttribute('data-answer');
      key.dataset.answer=p===phrase[index]?'correct':'retry';
      if(p===phrase[index]){index++;msg.textContent=index===phrase.length?'Play the whole phrase once on your guitar.':'Correct. Find the next note.'}
      else{misses++;msg.textContent='Try that note again. You can replay the phrase.'}
      draw();
      });
      key.setAttribute('aria-label',locationName(p));answers.append(key);
    }
    msg.textContent='Listen and sing it back. Find each note on your guitar, then tap the matching position.';draw();hear();
  }
  function reset(){ticket++;stopLights();silence();phrase=[];index=0;hintIndex=-1;drawPhrase();answers.replaceChildren();progress.textContent='';msg.textContent='Choose New phrase when ready.'}
  size.input.onchange=strings.input.onchange=reset;
  const hint=lab.button('Reveal next note',()=>{if(index<phrase.length){hints++;hintIndex=index;msg.textContent='Note '+(index+1)+' · '+locationName(phrase[index]);draw()}});
  lab.body.append(view.surface,lab.fields(size.box,strings.box),lab.row(lab.button('New phrase',newPhrase,'primary'),lab.button('Replay',()=>{if(phrase.length)hear()}),hint),progress,msg,answers);
  reset();lab.onStop(()=>{ticket++;stopLights()});
});

lab.add('harmony','Chord and melody playground','Play a melody over two different backing chords and hear how its notes change character.',()=>{
  const view=toolVisual.panel('harmony');
  const chords=Object.keys(shapes).map(s=>[s,s]);
  const first=lab.select('First chord',chords,'Am'),second=lab.select('Second chord',chords,'C');
  const bpm=lab.select('Tempo',[60,80,100].map(v=>[v,v+' BPM']),80);
  const notes=[{string:2,fret:1},{string:2,fret:3},{string:1,fret:0},{string:1,fret:1},{string:1,fret:3},{string:1,fret:5},{string:1,fret:7}];
  const melody=[],msg=lab.status(),line=element('p',null,'lab-metric'),keys=element('div',null,'log-buttons');
  let timer,run=0;
  const drawChords=(which=-1)=>toolVisual.chords(view,[first.input.value,second.input.value],which);
  function stop(){run++;clearTimeout(timer);silence();drawChords()}
  for(const f of [first,second,bpm])f.input.onchange=()=>{stop();msg.textContent=''};
  function label(p){return midiName(tuning[p.string-1]+p.fret)}
  function draw(){line.textContent=melody.length?melody.map(label).join('   '):'Tap up to four melody notes.'}
  for(const p of notes)keys.append(lab.button(label(p),()=>{
    if(melody.length===4){msg.textContent='Four notes entered. Undo one or compare the chords.';return}
    stop();melody.push(p);audition(asNote(p));msg.textContent=locationName(p);draw();
  }));
  async function play(compare){
    stop();const id=run;
    if(!await lab.audioReady(msg) || id!==run)return;
    const beat=60/Number(bpm.input.value),bar=4*beat;
    const names=compare?[first.input.value,second.input.value]:[first.input.value];
    let turn=0;
    const cycle=()=>{
      if(id!==run)return;
      const name=names[turn%names.length], t=audio.currentTime+.06;
      drawChords(turn%names.length);sound(chord(name),t,bar);
      if(compare)melody.forEach((p,i)=>sound(asNote(p),t+i*beat+.025,beat*.9));
      msg.textContent=compare?'Same melody over '+name:'Looping '+name+' · play your guitar over the chord.';
      turn++;
      if(compare && turn===names.length){timer=setTimeout(()=>{if(id===run){drawChords();msg.textContent='Which notes felt settled over each chord?'}},bar*1000);return}
      timer=setTimeout(cycle,bar*1000);
    };
    cycle();
  }
  lab.body.append(view.surface,element('small','○ Open string · × Skip string · Dots show finger numbers','hint'),element('p','Enter a short melody, then compare it over both chords. Or loop the first chord and improvise on your guitar.'),lab.fields(first.box,second.box,bpm.box),keys,line,
    lab.row(lab.button('Undo note',()=>{stop();melody.pop();draw()}),lab.button('Compare melody',()=>{if(melody.length)play(true);else msg.textContent='Add at least one melody note.'},'primary'),lab.button('Loop first chord',()=>play(false)),lab.button('Stop sound',()=>{stop();msg.textContent='Stopped.'})),msg);
  draw();drawChords();lab.onStop(stop);
});
