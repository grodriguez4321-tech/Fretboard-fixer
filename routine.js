const sections = [
  {
    "title": "Warm-up · 3 min",
    "items": [
      {
        "id": "chromatic",
        "name": "Chromatic 1–2–3–4",
        "duration": 180,
        "bpm": 60,
        "goal": "5 clean ascending and descending passes with relaxed hands.",
        "steps": [
          "Put index, middle, ring, and pinky on frets 5, 6, 7, and 8 of the high E string.",
          "Pick each note once, alternating down and up strokes.",
          "Pick fret 8 again on beat 1 of the next bar, then descend 8–7–6–5. Repeat both bars on the B string.",
          "Play one note per click. Keep fingertips close to the strings; stop if you feel pain."
        ]
      }
    ]
  },
  {
    "title": "Rhythm · 6 min",
    "items": [
      {
        "id": "emam",
        "name": "Em ↔ Am chord changes",
        "duration": 120,
        "bpm": 60,
        "goal": "8 changes in a row without stopping the beat.",
        "steps": [
          "Fret Em (022000), strum down on beat 1.",
          "Count 1–2–3–4 aloud; switch to Am (x02210) for the next bar.",
          "Repeat. Start with one downstroke per beat, then add upstrokes between beats."
        ]
      },
      {
        "id": "amc",
        "name": "Am ↔ C chord changes",
        "duration": 120,
        "bpm": 60,
        "goal": "8 smooth changes; fingers land together.",
        "steps": [
          "Play Am (x02210) for four beats.",
          "Switch to C (x32010) for four beats.",
          "Notice that index and middle fingers can stay in place; move your ring finger from G string fret 2 to A string fret 3."
        ]
      },
      {
        "id": "strum",
        "name": "Steady eighth-note strumming",
        "duration": 120,
        "bpm": 60,
        "goal": "30 seconds of uninterrupted down-up motion.",
        "steps": [
          "Mute all six strings lightly with your fretting hand.",
          "Strum down on the click and up halfway to the next click.",
          "Say “1 & 2 & 3 & 4 &”. Keep the wrist loose and movement small."
        ]
      }
    ]
  },
  {
    "title": "Lead · 6 min",
    "items": [
      {
        "id": "alternate",
        "name": "Alternate-picking accuracy",
        "duration": 120,
        "bpm": 60,
        "goal": "5 error-free passes, one note per click.",
        "steps": [
          "Use the high E string and play frets 5–7–8–7 repeatedly.",
          "Pick down-up-down-up, even when the notes change direction.",
          "Aim for even volume and no accidental adjacent-string noise."
        ]
      },
      {
        "id": "legato",
        "name": "Hammer-on and pull-off",
        "duration": 120,
        "bpm": 55,
        "goal": "10 clear 5h7p5 patterns without losing volume.",
        "steps": [
          "Fret high E fret 5 with index finger and pick once.",
          "Hammer ring finger onto fret 7 without picking again.",
          "Pull off toward the floor slightly to sound fret 5; avoid yanking the string out of tune.",
          "The 5h7p5 group can be practiced slowly without assigning each note to a click."
        ]
      },
      {
        "id": "slides",
        "name": "Controlled slides",
        "duration": 120,
        "bpm": 55,
        "goal": "10 slides in each direction with both notes audible.",
        "steps": [
          "Fret high E fret 5 and pick it.",
          "Keep gentle pressure while sliding to fret 7; let the destination note ring.",
          "Pick fret 7 and slide back to 5. Use only the pressure needed to keep contact."
        ]
      }
    ]
  },
  {
    "title": "Theory and ear · 4 min",
    "items": [
      {
        "id": "findnotes",
        "name": "Find the same note twice",
        "duration": 120,
        "bpm": 60,
        "goal": "Find 5 matching pitch classes and say their names.",
        "steps": [
          "Play high E string fret 5: A.",
          "Find A on the B string fret 10, or G string fret 2.",
          "Play the notes back-to-back; listen to the same note name at different octaves when applicable.",
          "Try a new note and use a fretboard chart if you need help."
        ]
      },
      {
        "id": "ear",
        "name": "Higher or lower?",
        "duration": 120,
        "bpm": 60,
        "goal": "10 guesses, at least 8 correct.",
        "steps": [
          "Play the demonstration to hear a rising and a falling pair.",
          "Tap Hear a pair in the blind listening quiz. Listen to both notes before choosing Higher or Lower.",
          "Try ten pairs. Repeat the pitches on your guitar after each guess."
        ]
      }
    ]
  },
  {
    "title": "Song application · 6 min",
    "items": [
      {
        "id": "song",
        "name": "Master one short song passage",
        "duration": 240,
        "bpm": 55,
        "goal": "5 clean repeats, then +5 BPM; keep accuracy over speed.",
        "steps": [
          "In the original demo, place your index at fret 5 and ring finger at fret 7. In bar 1, pick B string frets 5 and 7, then high E fret 5. Mute on beat 4.",
          "In bar 2, bend the B string at fret 7 up one semitone toward the sound of fret 8. Keep the ring finger supported. If uncomfortable, play fret 8 directly. Finish at fret 5.",
          "Select a bar and enable Loop. Join both once each feels steady. For your own song, choose 2–4 measures from your own tab and use the standalone metronome.",
          "Write the song, bar numbers, and clean tempo in your journal."
        ]
      },
      {
        "id": "stretch",
        "name": "Optional: safe reach and position shifts",
        "duration": 120,
        "bpm": 50,
        "goal": "5 clean shifts; no forced stretch or discomfort.",
        "steps": [
          "On the high E string, play fret 5 with index and fret 8 with pinky.",
          "Relax, lift slightly, and shift the entire hand to fret 7 (index) and fret 10 (pinky).",
          "For very wide distances such as frets 3 and 10, shift your hand rather than trying to span seven frets.",
          "Accuracy and relaxed movement matter more than maximum reach."
        ]
      }
    ]
  }
];
const all=sections.flatMap(s=>s.items),$=id=>document.getElementById(id);let store={};try{store=JSON.parse(localStorage.getItem('fretboard-v2')||'{}')}catch{};if(!store || typeof store!=='object' || Array.isArray(store))store={};store.bests??={};store.done??={};store.times??={};store.days??={};let active=all[0],remaining=active.duration,timerRunning=false,timerInterval=null,lastTick=0,metroRunning=false,metroTimer=null,audio=null,beat=0;
function save(){localStorage.setItem('fretboard-v2',JSON.stringify(store))}function fmt(s){s=Math.max(0,Math.ceil(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function dayKey(){return new Date().toLocaleDateString('en-CA')}
function todayDone(){return store.dailyDone?.[dayKey()] || {}}
function exerciseLink(ex,done){
  const link=element('a',null,'exercise-row');
  link.href='#exercise/'+ex.id;
  link.dataset.lesson=ex.id;
  const check=element('span',done?'✓':'','check');check.setAttribute('aria-hidden','true');
  link.append(check,element('strong',ex.name),element('small',Math.round(ex.duration/60)+' min'));
  if(done){link.classList.add('is-done');link.setAttribute('aria-label',ex.name+', completed today')}
  return link;
}
function render(){
  const container=$('sections'), done=todayDone();
  container.replaceChildren();
  for(const section of sections){
    const group=element('section',null,'checklist-group'), head=element('div',null,'group-head');
    head.append(element('h3',section.title.split(' · ')[0]),element('span',section.items.filter(ex=>done[ex.id]).length+' / '+section.items.length));
    group.append(head,...section.items.map(ex=>exerciseLink(ex,done[ex.id])));container.append(group);
  }
  const count=all.filter(ex=>done[ex.id]).length,next=all.find(ex=>!done[ex.id]);
  $('todayCount').textContent=count+' of '+all.length+' done';
  $('todayProgress').value=count;
  $('todayDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  $('nextExercise').hidden=!next;
  if(next){$('nextExercise').href='#exercise/'+next.id;$('nextExercise').textContent=count?'Continue practice':'Start practice'}
  else $('finishNotice').textContent='All exercises complete for today.';
  $('savedRiffs').hidden=!riffLessons.size;
  $('riffList').replaceChildren(...Array.from(riffLessons.values(),ex=>exerciseLink(ex,done[ex.id])));
  updateStats();
}
function updateStats(){let done=all.filter(x=>store.done[x.id]).length;$('doneCount').textContent=done+'/'+all.length;let total=Object.values(store.times).reduce((a,b)=>a+b,0);$('practiceTime').textContent=Math.floor(total/60)+'m';let d=new Date(),count=0;for(let i=0;i<365;i++){let key=d.toLocaleDateString('en-CA');if(store.days[key])count++;else if(i>0)break;d.setDate(d.getDate()-1)}$('streak').textContent=count}
function pauseTimer(){timerRunning=false;clearInterval(timerInterval);$('timerBtn').textContent='Start timer'}function tick(){const now=performance.now(),delta=Math.min((now-lastTick)/1000,remaining);lastTick=now;remaining-=delta;store.times[active.id]=(store.times[active.id]||0)+delta;store.days[new Date().toLocaleDateString('en-CA')]=true;$('timer').textContent=fmt(remaining);if(remaining<=0){remaining=0;pauseTimer();$('timer').textContent='00:00';if(navigator.vibrate)navigator.vibrate([100,70,100])}save();updateStats();if(!timerRunning)render()}
$('timerBtn').onclick=()=>{if(timerRunning){pauseTimer();return}if(remaining<=0)remaining=active.duration;timerRunning=true;lastTick=performance.now();timerInterval=setInterval(tick,200);$('timerBtn').textContent='Pause timer'};$('timerReset').onclick=()=>{pauseTimer();remaining=active.duration;$('timer').textContent=fmt(remaining)};
function setBpm(v){v=Math.max(40,Math.min(180,v));$('speed').textContent=v+' BPM';$('bpm').value=v;$('bpmDisplay').textContent=v;document.dispatchEvent(new Event('practicetempochange'));if(metroRunning){stopMetro();startMetro()}}$('bpm').oninput=e=>setBpm(+e.target.value);$('beats').onchange=()=>{makeDots();if(metroRunning){stopMetro();startMetro()}};function makeDots(){let n=+$('beats').value;$('beatCount').textContent=n+' beats / bar';$('dots').innerHTML=Array.from({length:n},(_,i)=>'<span class="dot" id="dot'+i+'"></span>').join('')}
function clickSound(accent){if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;osc.frequency.value=accent?1100:760;osc.type='sine';gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.18,t+.004);gain.gain.exponentialRampToValueAtTime(.0001,t+.065);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+.07)}function metroTick(){let n=+$('beats').value;clickSound(beat===0);document.querySelectorAll('.dot').forEach((el,i)=>el.classList.toggle('lit',i===beat));beat=(beat+1)%n}function startMetro(){audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();metroRunning=true;beat=0;metroTick();metroTimer=setInterval(metroTick,60000/(+$('bpm').value));$('metroBtn').textContent='Stop click'}function stopMetro(){metroRunning=false;clearInterval(metroTimer);$('metroBtn').textContent='Start click';document.querySelectorAll('.dot').forEach(x=>x.classList.remove('lit'))}$('metroBtn').onclick=()=>metroRunning?stopMetro():(haltPlayback(),startMetro());
$('notes').value=store.notes||'';$('notes').oninput=e=>{store.notes=e.target.value;save()};$('resetRoutine').onclick=()=>{if(confirm('Clear completed exercises and practice time? Your notes will stay.')){store.done={};store.dailyDone={};store.times={};store.days={};pauseTimer();remaining=active.duration;$('timer').textContent=fmt(remaining);save();render();showLog()}};$('export').onclick=()=>{const blob=new Blob([JSON.stringify({exported:new Date().toISOString(),...store},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fretboard-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};makeDots();
