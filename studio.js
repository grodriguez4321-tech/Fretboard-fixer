const colors = ['#dce6d7','#b7f493','#9ad9eb','#f0c37d','#d3b6ed'];
const stringSymbols = ['e','B','G','D','A','E'];
let sequence = [], cursor = 0, looping = false, playing = false, finished = false;
let timeout, generation = 0, barShown = -1, lessonNeck, lastNeckEvent;
let quizTotal = 0, quizCorrect = 0;
const voices = new Set();
const levelNumber = () => Number($('level').value) || 0;
const score = () => active.id==='chromatic' ? chromaticLevels[levelNumber()].score : scores[active.id];
function bestKey() {
  const level=active.id==='chromatic' && levelNumber() ? '-level'+levelNumber() : '';
  const phrase=$('phrase').value==='all' ? '' : '-bar'+$('phrase').value;
  return active.id+level+phrase;
}
const tempo = () => Number($('bpm').value);
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function makeSequence(bars, selection) {
  let ordinal=0;
  const events=bars.flatMap((bar, b) => {
    let beat = 0;
    return bar.map(event => {
      const item = {...event, bar:b, beat, sourceIndex:event.sourceIndex ?? ordinal};
      ordinal++;
      beat += event.beats;
      return item;
    });
  });
  const join=joinNotes(selection);
  if(join)return join.flatMap(index=>events.filter(e=>e.sourceIndex===index));
  const bounds=noteRange(selection);
  if(bounds)return events.filter(e=>e.sourceIndex>=bounds[0] && e.sourceIndex<=bounds[1]);
  return events.filter(event=>selection==='all' || event.bar===Number(selection));
}
function nextIndex() {
  return cursor + 1 < sequence.length ? cursor + 1 : looping ? 0 : -1;
}
function describe(event) {
  if (!event) return ['End of phrase', ''];
  if(event.names?.length){
    const action=event.continuation?'Hold':event.action;
    return [event.names.join(' + ')+' · '+action,event.positions.map(p=>stringNames[p.string-1]+' string · fret '+p.fret).join(' / ')];
  }
  if (event.chord) {
    const shape = [6,5,4,3,2,1].map(s => event.positions.find(p => p.string===s)?.fret ?? '×');
    return [event.chord, shape.join(' ')+' · low E to high E'];
  }
  if (!event.positions.length) return [event.action, event.action === 'Rest' ? 'Silence' : 'Lightly mute all six strings'];
  const {string, fret, finger} = event.positions[0];
  const {name, octave} = pitchAt(string, fret);
  return [name + octave + ' · ' + event.action, stringNames[string-1] + ' string · fret ' + fret + ' · ' + (finger==null ? 'your fingering' : fingerNames[finger])];
}
function token(event, string) {
  if (event.action.startsWith('Muted')) return '×';
  const position = event.positions.find(p => p.string === string);
  if (!position) return event.chord && string === 6 ? '×' : '';
  const marker = {'Hammer-on':'h','Pull-off':'p','Slide':event.from < position.fret ? '/' : '∖'}[event.action] || '';
  return (event.continuation ? '~' : '') + marker + position.fret + (event.action === 'Half-step bend' ? 'b½' : '');
}
function buildStaff(bar) {
  const staff = $('staff');
  const events = sequence.filter(e => e.bar === bar);
  staff.style.setProperty('--columns',events.length);
  const labels = element('div', null, 'staff-labels');
  for (const string of stringSymbols) labels.append(element('span', string));
  staff.replaceChildren(labels);
  for (const event of events) {
    const index = sequence.indexOf(event);
    const button = element('button', null, 'tabcol');
    button.dataset.index = index;
    button.setAttribute('aria-label', 'Beat ' + (event.beat+1) + ', ' + describe(event).join(', '));
    for (let s=1;s<=6;s++) {
      const line = element('span');
      const mark = token(event,s);
      if (mark) line.append(element('i',mark));
      button.append(line);
    }
    button.append(element('small',event.action === 'Rest' ? 'rest' : Number.isInteger(event.beat) ? event.beat+1 : '&'));
    button.onclick = () => seek(index, true);
    staff.append(button);
  }
}
function drawNeck(event) {
  if(!lessonNeck){
    lessonNeck=guitarNeck('Lesson fretboard',({string,fret})=>{
      haltPlayback();stopMetro();
      const pitch=pitchAt(string,fret);
      $('explore').textContent=pitch.name+pitch.octave+' · '+stringNames[string-1]+' string · '+(fret?'fret '+fret:'open');
      audition(note(string,fret,0));
    });
    for(const cell of lessonNeck.cells)cell.classList.add('fret');
    $('neck').append(lessonNeck.root);
  }
  if(lastNeckEvent!==event){
    const p=event.positions.find(p=>p.fret>0) || event.positions[0];
    if(p){lessonNeck.reveal(p.fret);lessonNeck.setTabStop(lessonNeck.cellAt(p.string,p.fret))}
    lastNeckEvent=event;
  }
  for(const cell of lessonNeck.cells){
    const s = Number(cell.dataset.string), f = Number(cell.dataset.fret);
    const pos = event.positions.find(p=>p.string === s && p.fret === f);
    cell.classList.toggle('blank',!pos && !$('names').checked);
    const finger=pos ? String(pos.finger ?? 'unspecified') : '';
    if(cell.dataset.finger===finger)continue;
    cell.dataset.finger=finger;
    cell.classList.toggle('selected',!!pos);
    cell.setAttribute('aria-pressed',String(!!pos));
    const marker=cell.firstChild;
    marker.textContent=cell.dataset.pitch;
    if(pos){
      cell.style.setProperty('--finger',colors[pos.finger || 0]);
      if(pos.fret===0 || pos.finger)marker.append(element('sup',pos.fret===0 ? '°' : pos.finger));
    }
  }
}
function beatReadout(beat){
  const count=Math.floor(beat+1e-8)+1;
  return 'Beat '+count+(score().meter===0?'':' / '+(score().meter||4));
}
function paint() {
  const event = sequence[cursor], next = nextIndex();
  if (barShown !== event.bar) {buildStaff(event.bar);barShown=event.bar;}
  for (const col of $('staff').querySelectorAll('button')) {
    const i = Number(col.dataset.index);
    col.classList.toggle('current',i===cursor);
    col.classList.toggle('next',i===next);
    col.setAttribute('aria-current',String(i===cursor));
    if (i===cursor) {
      const box=col.getBoundingClientRect(), scroll=$('staff').parentElement, boundary=scroll.getBoundingClientRect();
      if(box.right>boundary.right) scroll.scrollLeft += box.right-boundary.right+4;
      if(box.left<boundary.left) scroll.scrollLeft -= boundary.left-box.left+4;
    }
  }
  [$('now').textContent,$('placement').textContent]=describe(event);
  [$('upcoming').textContent,$('nextPosition').textContent]=describe(sequence[next]);
  $('barName').textContent='Bar '+(event.bar+1)+' · '+score().labels[event.bar];
  $('count').textContent=beatReadout(event.beat);
  $('play').textContent=playing?'Pause':finished?'Replay':'Play';
  $('play').dataset.playing=String(playing);
  drawNeck(event);
}
function silence() {
  for(const source of voices) {try{source.stop()}catch{}}
  voices.clear();
}
function haltPlayback() {
  generation++;
  playing=false;
  clearTimeout(timeout);
  silence();
  if(sequence.length){$('play').textContent=finished?'Replay':'Play';$('play').dataset.playing='false'}
}
async function enableAudio() {
  const Context=window.AudioContext || window.webkitAudioContext;
  if(!Context) return false;
  try {audio??=new Context();await audio.resume();return audio.state==='running'}catch{return false}
}
function voice(hz, duration, time, volume, target, type='triangle') {
  const source=audio.createOscillator(), gain=audio.createGain();
  source.type=type;
  source.frequency.setValueAtTime(hz,time);
  if(target) source.frequency.exponentialRampToValueAtTime(target,time+Math.min(.28,duration*.6));
  gain.gain.setValueAtTime(.0001,time);
  gain.gain.exponentialRampToValueAtTime(volume,time+.009);
  gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  source.connect(gain).connect(audio.destination);
  voices.add(source);
  source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect()};
  source.start(time);source.stop(time+duration+.01);
}
function sound(event,time,seconds) {
  if(!audio || audio.state!=='running') return;
  if(event.action.startsWith('Muted')) {voice(125,.065,time,.07,65,'triangle');return}
  const positions=event.chord ? [...event.positions].reverse() : event.positions;
  positions.forEach(({string,fret},i)=>{
    const hz=pitchAt(string,fret).hz;
    const start=event.from!=null ? pitchAt(string,event.from).hz : hz;
    const target=event.action==='Half-step bend' ? hz*2**(1/12) : start!==hz ? hz : null;
    const amplitude=event.chord ? .048 : ['Hammer-on','Pull-off'].includes(event.action) ? .10 : .15;
    voice(start,Math.max(.09,Math.min(seconds*.93,event.names?12:2.3)),time+(event.names?0:i*.009),amplitude,target);
  });
}
async function audition(event) {
  const token=generation;
  if(await enableAudio() && token===generation) sound(event,audio.currentTime,.6);
}
function seek(index, listen=false) {
  haltPlayback();finished=false;cursor=index;paint();
  if(listen){stopMetro();audition(sequence[index])}
}
async function play() {
  if(playing){haltPlayback();return}
  stopMetro();haltPlayback();
  if(finished)cursor=0;
  finished=false;playing=true;
  const token=generation;
  paint();
  const audible=await enableAudio();
  if(token!==generation)return;
  if(!audible)$('explore').textContent='Audio unavailable. Follow the highlighted notes visually.';
  // One clock schedules every eighth note, including beats inside held chords.
  const clock=()=>audible ? audio.currentTime : performance.now()/1000;
  let due=clock()+.04, elapsed=0, freshAttack=true;
  const ranged=!!(noteRange($('phrase').value) || joinNotes($('phrase').value));
  function waitBeats(count,label,withClick) {
    if(token!==generation)return;
    if(!count){pulse();return}
    $('count').textContent=label+' · '+count;
    if(withClick && audible && $('clickTrack').checked)voice(890,.045,due,.11,null,'sine');
    due+=60/tempo();
    timeout=setTimeout(()=>waitBeats(count-1,label,withClick),Math.max(0,(due-clock())*1000-10));
  }
  function pulse() {
    if(token!==generation)return;
    const event=sequence[cursor], seconds=60/tempo();
    if(audible){
      if(elapsed===0 && $('guideTone').checked && (!event.continuation || freshAttack)){
        let beats=event.beats;
        for(let i=cursor+1;i<sequence.length && sequence[i].continuation && sequence[i].sourceIndex===event.sourceIndex;i++)beats+=sequence[i].beats;
        sound(event,due,seconds*beats);
      }
      if($('clickTrack').checked && Math.abs(event.beat+elapsed-Math.round(event.beat+elapsed))<1e-8)
        voice(event.beat+elapsed===0?1250:890,.045,due,.11,null,'sine');
    }
    const soundingBeat=event.beat+elapsed;
    timeout=setTimeout(()=>{
      if(token!==generation)return;
      if(elapsed===0)paint();
      $('count').textContent=beatReadout(soundingBeat);
      const step=Math.min(.5,event.beats-elapsed,Math.floor(soundingBeat+1+1e-8)-soundingBeat);
      elapsed+=step;
      due+=seconds*step;
      timeout=setTimeout(()=>{
        if(token!==generation)return;
        if(elapsed>=event.beats-1e-8){
          const next=nextIndex();
          if(next<0){timeout=setTimeout(()=>{finished=true;haltPlayback();paint()},Math.max(0,(due-clock())*1000));return}
          freshAttack=next===0;
          cursor=next;elapsed=0;
          if(freshAttack && ranged && Number($('rangeGap').value)){
            waitBeats(Number($('rangeGap').value),'Reset',false);return;
          }
        }
        due=Math.max(due,clock()+.002);
        pulse();
      },Math.max(0,(due-clock()-.03)*1000));
    },Math.max(0,(due-clock())*1000));
  }
  waitBeats(ranged ? Number($('rangeLead').value) : 0,'Count in',true);
}
function rebuildPhrase() {
  haltPlayback();cursor=0;finished=false;barShown=-1;
  sequence=makeSequence(score().bars,$('phrase').value);refreshRange();paint();showLog();
  document.dispatchEvent(new Event('practicephrasechange'));
}
function refreshRange(){
  const events=makeSequence(score().bars,'all');
  const bounds=noteRange($('phrase').value);
  const first=bounds?.[0] ?? sequence[0].sourceIndex;
  const last=bounds?.[1] ?? Math.min(first+1,sequence.at(-1).sourceIndex);
  for(const [id,value] of [['rangeFirst',first],['rangeLast',last]]){
    const select=$(id);select.replaceChildren();
    for(const e of events.filter(e=>!e.continuation)){
      const pos=e.positions[0];
      const label=e.names?.length ? e.names.join('+') : e.chord || (pos ? stringNames[pos.string-1]+' '+pos.fret : e.action);
      select.add(new Option((e.sourceIndex+1)+'. '+label+' · bar '+(e.bar+1)+' beat '+(e.beat+1),e.sourceIndex));
    }
    select.value=String(value);
  }
  $('rangeStatus').textContent=bounds ? 'Selected '+phraseName($('phrase').value)+'. Press Play to hear the loop.' : '';
}
function applyRange(expand){
  let first=Number($('rangeFirst').value),last=Number($('rangeLast').value);
  if(last<first){$('rangeStatus').textContent='Choose a last note at or after the first note.';return}
  if(expand){first=Math.max(0,first-1);last=Math.min($('rangeLast').options.length-1,last+1)}
  selectPhrase('notes-'+first+'-'+last);
  looping=true;$('loop').setAttribute('aria-pressed','true');rebuildPhrase();
}
$('applyRange').onclick=()=>applyRange(false);
$('growRange').onclick=()=>applyRange(true);
function showLog() {
  $('exerciseGoal').textContent=active.goal;
  const best=store.bests[bestKey()];
  $('best').textContent=best?'Personal best · '+best+' BPM':'No clean tempo logged yet';
}
function buildQuiz() {
  const panel=$('quiz');
  panel.hidden=active.id!=='ear' && active.id!=='findnotes';
  panel.replaceChildren();
  quizCorrect=0;quizTotal=0;
  if(panel.hidden)return;
  const ear=active.id==='ear';
  panel.append(element('h3',ear?'Blind listening quiz':'Name that note'));
  const prompt=element('button',ear?'Hear a pair':'New question');
  const message=element('p',ear?'Listen, then choose the direction of the second note.':'Name the note at the given string and fret.');
  message.setAttribute('role','status');
  const answers=element('div');
  panel.append(prompt,message,answers);
  prompt.onclick=async()=>{
    haltPlayback();stopMetro();
    const token=generation;
    if(ear && !await enableAudio()){message.textContent='Audio is unavailable for this quiz.';return}
    if(token!==generation)return;
    const fret=Math.floor(Math.random()*8)+2;
    const string=1+Math.floor(Math.random()*6);
    let choices, correct;
    if(ear){
      const up=Math.random()<.5, interval=1+Math.floor(Math.random()*4);
      const second=up?fret+interval:fret;
      const first=up?fret:fret+interval;
      sound(note(string,first,1),audio.currentTime+.04,.48);
      sound(note(string,second,1),audio.currentTime+.68,.48);
      choices=['Higher','Lower'];correct=up?'Higher':'Lower';message.textContent='Which way did the second note move?';
    }else{
      correct=pitchAt(string,fret).name;
      choices=pitches;
      message.textContent=stringNames[string-1]+' string · fret '+fret+' — which note?';
    }
    answers.replaceChildren();
    for(const value of choices){
      const choice=element('button',value);
      choice.onclick=()=>{
        quizTotal++;if(value===correct)quizCorrect++;
        message.textContent=(value===correct?'Correct. ':'Answer: '+correct+'. ')+quizCorrect+' of '+quizTotal+' correct.';
        answers.replaceChildren();
      };
      answers.append(choice);
    }
  };
}
function openLesson(ex) {
  haltPlayback();stopMetro();pauseTimer();active=ex;remaining=ex.duration;
  $('timer').textContent=fmt(remaining);setBpm(ex.bpm);$('lesson').value=ex.id;
  $('levelRow').hidden=ex.id!=='chromatic';
  $('level').value=String(Math.max(0,Math.min(chromaticLevels.length-1,Number(store.chromaticLevel)||0)));
  $('lessonTitle').textContent=ex.name;
  const section=sections.find(s=>s.items.includes(ex));
  $('category').textContent=(section ? section.title.split(' · ')[0] : songLessons.has(ex.id)?'Song lesson':'My riffs')+' · '+Math.round(ex.duration/60)+' min';
  $('copyRiff').hidden=!riffLessons.has(ex.id);
  $('objective').textContent=score().aim;
  $('phrase').replaceChildren(new Option('All measures','all'));
  score().labels.forEach((name,i)=>$('phrase').add(new Option('Bar '+(i+1)+' · '+name,i)));
  const guide=$('guideContent'), instructions=element('ol',null,'steps');
  const steps=ex.id==='chromatic' && levelNumber()>0 ? [score().aim,'Count 1 & 2 & 3 & 4 &. Pick down on each number and up on each &.','Loop both bars and keep every note the same length.'] : ex.steps;
  $('firstStep').textContent=steps[0];
  for(const step of steps)instructions.append(element('li',step));
  guide.replaceChildren(instructions);
  for(const [label,detail] of [['Start at',ex.bpm+' BPM'],['Completion goal',ex.goal],['Next challenge',ex.id==='chromatic' && levelNumber()<3 ? 'After five clean full passes, try the '+chromaticLevels[levelNumber()+1].name.toLowerCase()+' level at the same tempo.' : score().next]]){
    const row=element('p');row.append(element('strong',label+' · '),detail);guide.append(row);
  }
  $('explore').textContent='Tap a fret to hear its pitch. Swipe or drag along the neck. The thin high E string is on top.';
  $('songNotes').hidden=!songLessons.has(ex.id);
  if(!$('songNotes').hidden){
    $('noteBars').replaceChildren(...score().bars.map((bar,i)=>{
      const row=element('button',null,'notes-row');
      row.append(element('strong','Bar '+(i+1)),element('span',bar.map(e=>e.continuation?'hold '+e.names.join('+'):e.names.length?e.names.join('+'):'rest').join('  ·  ')));
      row.onclick=()=>{selectPhrase(String(i));rebuildPhrase();$('play').focus();};
      return row;
    }));
    $('sourceNotes').textContent='Source tempo '+score().sourceBpm+' BPM. '+score().comments.join(' ');
  }
  buildQuiz();rebuildPhrase();showLog();render();
  document.dispatchEvent(new Event('lessonopened'));
}
chromaticLevels.forEach((level,i)=>$('level').add(new Option(level.name,i)));
$('level').onchange=()=>{store.chromaticLevel=levelNumber();save();openLesson(active)};
for(const section of sections){
  const group=element('optgroup');group.label=section.title;
  for(const ex of section.items)group.append(new Option(ex.name,ex.id));
  $('lesson').append(group);
}
fingerNames.forEach((name,i)=>{
  const label=element('span'), dot=element('b',i||'°','finger');
  dot.style.setProperty('--finger',colors[i]);label.append(dot,' '+name);$('legend').append(label);
});
function refreshRiffPicker(){
  let group=$('lesson').querySelector('[data-riffs]');
  if(!group){group=element('optgroup');group.label='My riffs';group.dataset.riffs='true';$('lesson').append(group)}
  group.replaceChildren();
  for(const ex of [...riffLessons.values(),...songLessons.values()])group.append(new Option(ex.name,ex.id));
}
refreshRiffPicker();
$('lesson').onchange=()=>openLesson(lessonById($('lesson').value));
$('phrase').onchange=rebuildPhrase;
$('play').onclick=play;
$('step').onclick=()=>seek((cursor+1)%sequence.length,true);
$('restart').onclick=()=>{const resume=playing;seek(0);if(resume)play()};
$('loop').onclick=()=>{looping=!looping;$('loop').setAttribute('aria-pressed',String(looping));paint()};
$('names').onchange=()=>drawNeck(sequence[cursor]);
$('slower').onclick=()=>setBpm(tempo()-5);$('faster').onclick=()=>setBpm(tempo()+5);
$('saveBest').onclick=()=>{
  store.bests[bestKey()]=Math.max(Number(store.bests[bestKey()])||0,tempo());
  store.days[new Date().toLocaleDateString('en-CA')]=true;save();showLog();updateStats();
};
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){haltPlayback();stopMetro();if(timerRunning){tick();pauseTimer()}}
});
openLesson(active);

const focusMode=$('focusMode');
function setPracticeFocus(on) {
  document.body.classList.toggle('practice-focus',on);
  focusMode.setAttribute('aria-pressed',String(on));
  focusMode.textContent=on ? 'Exit focus' : 'Focus mode';
  focusMode.closest('.lesson-settings').scrollIntoView({block:'start'});
}
focusMode.onclick=()=>setPracticeFocus(!document.body.classList.contains('practice-focus'));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && document.body.classList.contains('practice-focus') && !document.querySelector('dialog[open]')){
    setPracticeFocus(false);focusMode.focus({preventScroll:true});
  }
});
