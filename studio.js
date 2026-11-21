const colors = ['#dce6d7','#b7f493','#9ad9eb','#f0c37d','#d3b6ed'];
const stringSymbols = ['e','B','G','D','A','E'];
let sequence = [], cursor = 0, looping = false, playing = false, finished = false;
let timeout, generation = 0, barShown = -1, neckKey = '';
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
  return bars.flatMap((bar, b) => {
    let beat = 0;
    return bar.map(event => {
      const item = {...event, bar:b, beat};
      beat += event.beats;
      return item;
    });
  }).filter(event => selection === 'all' || event.bar === Number(selection));
}
function nextIndex() {
  return cursor + 1 < sequence.length ? cursor + 1 : looping ? 0 : -1;
}
function describe(event) {
  if (!event) return ['End of phrase', ''];
  if (event.chord) {
    const shape = [6,5,4,3,2,1].map(s => event.positions.find(p => p.string===s)?.fret ?? '×');
    return [event.chord, shape.join(' ')+' · low E to high E'];
  }
  if (!event.positions.length) return [event.action, event.action === 'Rest' ? 'Silence' : 'Lightly mute all six strings'];
  const {string, fret, finger} = event.positions[0];
  const {name, octave} = pitchAt(string, fret);
  return [name + octave + ' · ' + event.action, stringNames[string-1] + ' string · fret ' + fret + ' · ' + fingerNames[finger]];
}
function token(event, string) {
  if (event.action.startsWith('Muted')) return '×';
  const position = event.positions.find(p => p.string === string);
  if (!position) return event.chord && string === 6 ? '×' : '';
  const marker = {'Hammer-on':'h','Pull-off':'p','Slide':event.from < position.fret ? '/' : '∖'}[event.action] || '';
  return marker + position.fret + (event.action === 'Half-step bend' ? 'b½' : '');
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
  // Keep both ends of a shift visible and the neck still throughout the bar.
  const fretted = score().bars[event.bar].flatMap(item=>item.positions.map(p=>p.fret)).filter(f=>f>0);
  const high = Math.max(0,...fretted);
  const low = fretted.length ? Math.min(...fretted) : 1;
  const start = Math.max(1, Math.min(low,high-4));
  const width = Math.max(5,high-start+1);
  const frets = [0,...Array.from({length:width},(_,i)=>start+i)];
  const neck = $('neck'), key = frets.join(',');
  if (key !== neckKey) {
    neckKey = key;
    neck.replaceChildren(element('span'));
    neck.style.setProperty('--frets',frets.length);
    for (const f of frets) neck.append(element('b', f || '0','fret-label'));
    for (let s=1;s<=6;s++) {
      neck.append(element('b',stringSymbols[s-1],'fret-label'));
      for (const f of frets) {
        const pitch = pitchAt(s,f);
        const button = element('button', null, 'fret' + (f===0 ? ' open' : ''));
        button.dataset.string = s;
        button.dataset.fret = f;
        button.setAttribute('aria-label',stringNames[s-1] + ' string, fret ' + f + ', ' + pitch.name + pitch.octave);
        button.append(element('span',pitch.name));
        button.onclick = () => {
          haltPlayback();stopMetro();
          $('explore').textContent = pitch.name + pitch.octave + ' · ' + stringNames[s-1] + ' string · ' + (f ? 'fret ' + f : 'open');
          audition(note(s,f,0));
        };
        neck.append(button);
      }
    }
  }
  for (const cell of neck.querySelectorAll('button')) {
    const s = Number(cell.dataset.string), f = Number(cell.dataset.fret);
    const pos = event.positions.find(p=>p.string === s && p.fret === f);
    cell.classList.toggle('selected',!!pos);
    cell.classList.toggle('blank',!pos && !$('names').checked);
    cell.style.setProperty('--finger',colors[pos?.finger || 0]);
    const label = pitchAt(s,f).name;
    const marker=cell.firstChild;
    marker.textContent=label;
    if(pos) marker.append(element('sup',pos.finger || '°'));
    cell.setAttribute('aria-pressed',String(!!pos));
  }
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
  $('count').textContent='Beat '+(event.beat+1)+' / 4';
  $('play').textContent=playing?'Ⅱ Pause':finished?'▶︎ Replay':'▶︎ Play';
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
  if(sequence.length) $('play').textContent=finished?'▶︎ Replay':'▶︎ Play';
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
    voice(start,Math.max(.09,Math.min(seconds*.93,2.3)),time+i*.009,amplitude,target);
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
  let due=clock()+.04, elapsed=0;
  function pulse() {
    if(token!==generation)return;
    const event=sequence[cursor], seconds=60/tempo();
    if(audible){
      if(elapsed===0 && $('guideTone').checked)sound(event,due,seconds*event.beats);
      if($('clickTrack').checked && Number.isInteger(event.beat+elapsed))
        voice(event.beat+elapsed===0?1250:890,.045,due,.11,null,'sine');
    }
    const soundingBeat=event.beat+elapsed;
    timeout=setTimeout(()=>{
      if(token!==generation)return;
      if(elapsed===0)paint();
      $('count').textContent='Beat '+(Math.floor(soundingBeat)+1)+' / 4';
      elapsed+=.5;
      due+=seconds/2;
      timeout=setTimeout(()=>{
        if(token!==generation)return;
        if(elapsed>=event.beats){
          const next=nextIndex();
          if(next<0){timeout=setTimeout(()=>{finished=true;haltPlayback();paint()},Math.max(0,(due-clock())*1000));return}
          cursor=next;elapsed=0;
        }
        due=Math.max(due,clock()+.002);
        pulse();
      },Math.max(0,(due-clock()-.03)*1000));
    },Math.max(0,(due-clock())*1000));
  }
  pulse();
}
function rebuildPhrase() {
  haltPlayback();cursor=0;finished=false;barShown=-1;
  sequence=makeSequence(score().bars,$('phrase').value);paint();showLog();
  document.dispatchEvent(new Event('practicephrasechange'));
}
function showLog() {
  $('complete').textContent=store.done[active.id]?'Mark incomplete':'Mark complete';
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
  $('category').textContent=section.title.split(' · ')[0]+' · '+Math.round(ex.duration/60)+' min';
  $('objective').textContent=score().aim;
  $('phrase').replaceChildren(new Option('All measures','all'));
  score().labels.forEach((name,i)=>$('phrase').add(new Option('Bar '+(i+1)+' · '+name,i)));
  const guide=$('guideContent'), instructions=element('ol',null,'steps');
  const steps=ex.id==='chromatic' && levelNumber()>0 ? [score().aim,'Count 1 & 2 & 3 & 4 &. Pick down on each number and up on each &.','Loop both bars and keep every note the same length.'] : ex.steps;
  for(const step of steps)instructions.append(element('li',step));
  guide.replaceChildren(instructions);
  for(const [label,detail] of [['Start at',ex.bpm+' BPM'],['Completion goal',ex.goal],['Next challenge',ex.id==='chromatic' && levelNumber()<3 ? 'After five clean full passes, try the '+chromaticLevels[levelNumber()+1].name.toLowerCase()+' level at the same tempo.' : score().next]]){
    const row=element('p');row.append(element('strong',label+' · '),detail);guide.append(row);
  }
  $('explore').textContent='Tap a fret to hear its pitch. The thin high E string is on top.';
  buildQuiz();rebuildPhrase();showLog();render();
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
$('lesson').onchange=()=>openLesson(all.find(ex=>ex.id===$('lesson').value));
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
$('complete').onclick=()=>{
  store.done[active.id]=!store.done[active.id];
  if(store.done[active.id])store.days[new Date().toLocaleDateString('en-CA')]=true;
  save();showLog();render();
};
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){haltPlayback();stopMetro();if(timerRunning){tick();pauseTimer()}}
});
openLesson(active);
