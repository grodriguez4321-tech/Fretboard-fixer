// The course uses its own progress so first-time players always begin with Day 1.
const zeroCourse=(()=>{
  const el=element, button=lab.button, row=lab.row, host=$('zeroBody');
  let dispose=()=>{},suspend=()=>{},stopGuide=()=>{};
  const state=()=>store.zeroCourse??={next:1,attempts:[],drafts:{}};
  function draft(day){return state().drafts[day]??={}}
  function link(label,url){
    const a=el('a',label);a.href=url;
    if(url.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer'}
    return a;
  }
  function block(title){
    const section=el('section',null,'surface zero-block');section.append(el('h2',title));host.append(section);return section;
  }
  function home(){
    const course=store.zeroCourse,day=course?.next||1;
    $('zeroToday').textContent='Day '+day+' · '+zeroLessons[day-1].title;
    $('zeroStart').textContent=course?.attempts.length?'Continue course':'Start Guitar from Zero';
    if(course?.attempts.length){
      const last=course.attempts.at(-1);
      if(last.date===dayKey())$('zeroToday').textContent='✓ Practiced Day '+last.day+' today. '+(last.repeat?'Repeat':'Up next')+' · Day '+day+' · '+zeroLessons[day-1].title;
      if(last.day===28 && !last.repeat)$('zeroToday').textContent='Day 28 check logged. Revisit any course day below.';
    }
    $('zeroStart').href='#zero/'+day;
    const list=$('zeroContents');list.replaceChildren();
    for(const [i,lesson] of zeroLessons.entries()){
      const practiced=course?.attempts.some(a=>a.day===i+1);
      list.append(link((practiced?'✓ ':'')+(i+1)+'. '+lesson.title,'#zero/'+(i+1)));
    }
  }
  function tuning(day){
    const box=day===1?block('Tune one string at a time'):el('details',null,'surface zero-block');
    if(day!==1){box.append(el('summary','Tune before you play'));host.append(box)}
    const names=['E2','A2','D3','G3','B3','E4'];
    const chooser=el('div',null,'zero-strings'),target=el('strong'),readout=el('p','Pluck one open string. Use your tuner or turn on the microphone.','hint');
    const meter=el('meter');meter.min=-50;meter.max=50;meter.value=0;meter.hidden=true;meter.setAttribute('aria-label','Cents from target');
    let index=draft(day).stringIndex??0,stream,source,frame,token=0,pending=false;
    function select(i){
      index=i;draft(day).stringIndex=i;save();target.textContent='String '+(6-i)+' · '+names[i]+(i===0?' · thick E':i===5?' · thin e':'');
      [...chooser.children].forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));
      meter.hidden=true;readout.textContent='Trace this string to its peg. Pluck it and check the note name before centering the indicator.';
    }
    names.forEach((name,i)=>chooser.append(button(name,()=>select(i))));
    function stop(){
      token++;pending=false;cancelAnimationFrame(frame);source?.disconnect();source=null;
      stream?.getTracks().forEach(t=>t.stop());stream=null;mic.textContent='Use microphone';meter.hidden=true;
    }
    const mic=button('Use microphone',async()=>{
      if(stream||pending){stop();readout.textContent='Microphone off. You can continue with your tuner.';return}
      const mine=++token;pending=true;mic.textContent='Cancel microphone';
      try{
        if(!await enableAudio() || !navigator.mediaDevices?.getUserMedia)throw Error();
        if(mine!==token)return;
        const input=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
        if(mine!==token){input.getTracks().forEach(t=>t.stop());return}
        stream=input;pending=false;mic.textContent='Stop microphone';
        source=audio.createMediaStreamSource(stream);const analyser=audio.createAnalyser();analyser.fftSize=4096;source.connect(analyser);
        const samples=new Float32Array(analyser.fftSize);let last=-100;
        function listen(now){
          if(mine!==token)return;
          frame=requestAnimationFrame(listen);if(now-last<100)return;last=now;
          analyser.getFloatTimeDomainData(samples);const hz=estimateGuitarHz(samples,audio.sampleRate);
          if(!hz){meter.hidden=true;readout.textContent='Listening for '+names[index]+'…';return}
          const raw=69+12*Math.log2(hz/440),detected=Math.round(raw),wanted=tuningMidi();
          const cents=Math.round(100*(raw-wanted));meter.hidden=detected!==wanted;meter.value=Math.min(50,Math.max(-50,cents));
          readout.textContent='Heard '+midiName(detected)+' · target '+names[index]+' · '+(Math.abs(cents)<=5?'centered':(cents<0?'flat · below target':'sharp · above target'));
        }
        frame=requestAnimationFrame(listen);
      }catch{if(mine===token){stop();readout.textContent='Microphone unavailable. Use your own tuner and the reference tones below.'}}
    });
    function tuningMidi(){return [40,45,50,55,59,64][index]}
    const reference=button('Hear target',()=>{
      if(stream||pending)stop();
      readout.textContent='Reference '+names[index]+'. Let it fade, then pluck your string.';
      audition({positions:[{string:6-index,fret:0}],action:'Pick'});
    });
    box.append(chooser,target,row(reference,mic),meter,readout);
    if(day===1)box.append(el('p','Flat means too low. Tighten slightly. Sharp means too high. Loosen slightly. Repluck after each small turn. When the name and indicator match, tap the next string.'));
    target.textContent='String '+(6-index)+' · '+names[index];chooser.children[index].setAttribute('aria-pressed','true');
    box.addEventListener('toggle',()=>{if(!box.open)stop()});
    return stop;
  }
  const chartsByDay={4:['Em'],7:['Em'],8:['Em','G'],9:['Em','G'],10:['D','G'],12:['G','D'],13:['G','D'],14:['Em','G','D'],15:['Em','G'],16:['C'],17:['G','D','Em','C'],19:['Em'],21:['C'],22:['G','D'],26:['G','D'],28:['Em','G','D','C']};
  function charts(day){
    const names=chartsByDay[day];if(!names)return;
    const detail=el('details',null,'surface zero-block');detail.open=![7,14,21,28].includes(day);
    detail.append(el('summary','Chord fingerings'));
    const gallery=el('div',null,'zero-charts');
    for(const name of names){
      const fig=el('figure'),shape=zeroMusic.shapes[name];
      fig.append(el('figcaption',name),chordLibrary.chart(shape,name),button('Hear '+name,()=>{stopGuide();audition({positions:zeroMusic.positions(name,true),action:'Strum',chord:name})}));
      gallery.append(fig);
    }
    detail.append(gallery,el('p','Thick E is on the left. ○ open · × skip. Fingers: 1 index, 2 middle, 3 ring, 4 little.','hint'));
    if(day===8||day===9)detail.append(el('p','Keep finger 1 on A fret 2. For G, move finger 2 to thick E fret 3 and place finger 3 on thin e fret 3. For Em, bring finger 2 back to D fret 2 and lift finger 3.'));
    host.append(detail);
  }
  function player(day){
    const tracks=zeroMusic.versions[day-1];if(!tracks.length)return ()=>{};
    const box=block('Play the exercise');
    const choice=lab.select('Practice part',tracks.map((p,i)=>[i,p.name]),0);
    const speed=el('input');speed.type='number';speed.min=30;speed.max=160;speed.value=draft(day).bpm||(day===3?60:50);
    const tempoLabel=el('label','Tempo (BPM)');tempoLabel.append(speed);
    const guide=el('input');guide.type='checkbox';guide.checked=day!==9;
    const soundLabel=el('label','Guide notes ');soundLabel.prepend(guide);
    const spacing=lab.select('Time per chord',[[4,'4 beats'],[8,'8 beats']],draft(day).spacing||4);
    const from=lab.select('Start bar',[]),to=lab.select('End bar',[]);
    const range=el('details');range.append(el('summary','Choose bars'),lab.fields(from.box,to.box));
    const position=el('strong'),cue=el('span',null,'hint'),beat=el('div',null,'zero-pulse');
    for(let i=1;i<=4;i++)beat.append(el('b',i));
    const scoreBox=el('details');scoreBox.open=![5,7,14,20,21,25,27,28].includes(day);
    scoreBox.append(el('summary','Show the notes and tab'));
    const scoreGrid=el('div',null,'zero-score');scoreBox.append(scoreGrid);
    const board=guitarNeck('Course fretboard',p=>{stop();audition({action:'Pick',positions:[p]})});scoreBox.append(board.root);
    const main=button('Start pass',start,'primary'),message=el('p',null,'hint');
    const track=()=>tracks[+choice.input.value];
    let timer,version=0,running=false,events=[],barCards=[];
    function stop(){
      version++;clearTimeout(timer);running=false;silence();main.textContent='Start pass';
      for(const node of beat.children)node.classList.remove('current');
    }
    stopGuide=stop;
    function label(token){return token==='-'?'Hold':token==='e'?'E4':token==='g'?'G4':token}
    function setBoard(token){
      const notes=zeroMusic.positions(token,track().chords);
      for(const key of board.cells){
        const p=notes.find(n=>n.string===+key.dataset.string && n.fret===+key.dataset.fret);
        key.classList.toggle('selected',!!p);
        key.querySelector('.note-cap').textContent=p?(p.fret?p.finger:'○'):'';
      }
    }
    function prepare(){
      stop();message.textContent='';const p=track();const first=p.first||1;
      from.input.replaceChildren();to.input.replaceChildren();
      p.bars.forEach((_,i)=>{from.input.add(new Option(i+first,i));to.input.add(new Option(i+first,i))});
      to.input.value=p.bars.length-1;
      spacing.box.hidden=!(p.chords && day===9);range.hidden=p.bars.length===1;
      scoreGrid.replaceChildren();barCards=[];
      p.bars.forEach((bar,i)=>{
        const card=el('div',null,'zero-bar');card.append(el('strong','Bar '+(i+first)));
        const lines=p.chords?['Count','Chord']:['Count','e (1)','B (2)','G (3)','D (4)','A (5)','E (6)'];
        const table=el('table');
        lines.forEach((name,l)=>{
          const tr=el('tr');tr.append(el('th',name));
          bar.forEach((token,j)=>{
            let value=l===0?(p.division===2?(j%2?'&':j/2+1):j+1):'—';
            if(l>0 && p.chords)value=label(token);
            else if(l>0 && token!=='-'){const n=zeroMusic.positions(token,false)[0];if(n.string===l)value=n.fret}
            tr.append(el('td',value));
          });
          table.append(tr);
        });
        card.append(table);scoreGrid.append(card);barCards.push(card);
      });
      resetCue();
    }
    function resetCue(){
      stop();const p=track(),token=p.bars[+from.input.value][0];position.textContent=scoreBox.open || p.chords?'Start on '+label(token):'Listen first';cue.textContent='Four clicks count you in.';
      setBoard(token);barCards.forEach(c=>c.classList.remove('current'));
    }
    async function start(){
      if(running){stop();message.textContent='Pass stopped. Start again when ready.';return}
      stop();const mine=version;running=true;main.textContent='Stop';
      const bpm=Math.max(30,Math.min(160,Math.round(Number(speed.value)||50)));speed.value=bpm;
      const p=track(),division=p.division||1,first=+from.input.value,last=+to.input.value;
      const extra=day===9 && p.chords && spacing.input.value==='8';
      draft(day).bpm=bpm;draft(day).spacing=+spacing.input.value;save();
      const playable=await enableAudio();if(mine!==version)return;
      if(!playable){stop();message.textContent='Audio unavailable. Count four beats aloud and follow the tab.';return}
      const unit=60/bpm/division, countIn=4*division;events=[];
      p.bars.slice(first,last+1).forEach((bar,b)=>{
        bar.forEach((token,j)=>events.push({token,b:b+first,j}));
        if(extra)for(let j=0;j<4;j++)events.push({token:'-',b:b+first,j,extra:true});
      });
      const startTime=audio.currentTime+.10;let scheduled=-countIn,shown=-countIn-1;
      function tick(){
        if(mine!==version)return;
        const elapsed=(audio.currentTime-startTime)/unit;
        while(scheduled<events.length && scheduled<=elapsed+.15/unit-countIn){
          const k=scheduled++,at=startTime+(k+countIn)*unit;
          if(k%division===0)voice(k%(4*division)===0?1250:890,.045,at,.12,null,'sine');
          if(k<0 || !guide.checked || events[k].token==='-')continue;
          const {token,b}=events[k];let length=1;
          while(events[k+length]?.token==='-')length++;
          sound({action:p.chords?'Strum':'Pick',names:p.chords?undefined:[token],chord:p.chords?token:undefined,positions:zeroMusic.positions(token,p.chords)},at,p.shortFirst && b===0?.18:unit*length);
        }
        const k=Math.floor(elapsed)-countIn;
        if(k>=events.length){stop();position.textContent='Pass complete';cue.textContent='';message.textContent=day===9?'Pause, count your on-time starts, then try the second pass.':'Listen back in your head. Use the check below before your next pass.';return}
        if(k>=-countIn && k!==shown){
          shown=k;const pulse=Math.floor((k+countIn)/division)%4;
          [...beat.children].forEach((n,i)=>n.classList.toggle('current',pulse===i));
          if(!scoreBox.open && !p.chords && k>=0){position.textContent='Listen · bar '+(events[k].b+(p.first||1));cue.textContent='Hum the phrase, then find it on your guitar.'}
          else if(k<0){position.textContent='Count in · '+(pulse+1);cue.textContent='Get ready for '+label(events[0].token)}
          else{
            const ev=events[k],next=events.slice(k+1).find(e=>e.token!=='-');
            position.textContent='Bar '+(ev.b+(p.first||1))+' · '+(ev.token==='-'?(day===9&&p.chords?'Move to the next shape':'Let it ring'):label(ev.token)+(p.chords?(division===2&&ev.j===7?' ↑':' ↓'):''));
            cue.textContent=next?'Next · '+label(next.token):'Count through the end';
            if(ev.token!=='-')setBoard(ev.token);
            barCards.forEach((c,i)=>c.classList.toggle('current',i===ev.b));
          }
        }
        timer=setTimeout(tick,25);
      }
      tick();
    }
    choice.input.onchange=prepare;
    from.input.onchange=()=>{if(+from.input.value>+to.input.value)to.input.value=from.input.value;resetCue()};
    to.input.onchange=()=>{if(+to.input.value<+from.input.value)from.input.value=to.input.value;resetCue()};
    speed.onchange=()=>{stop();draft(day).bpm=Math.max(30,Math.min(160,Math.round(+speed.value||50)));speed.value=draft(day).bpm;save()};
    spacing.input.onchange=()=>{resetCue();draft(day).spacing=+spacing.input.value;save()};
    box.append(choice.box,lab.fields(tempoLabel,spacing.box),range,beat,position,cue,row(main,soundLabel),message,scoreBox);
    prepare();return stop;
  }
  function finish(day){
    const box=block('Check your playing'),lesson=zeroLessons[day-1],record=draft(day);
    box.append(el('p',lesson.check));
    if(day===9){
      const tally=el('div',null,'zero-tally'),result=el('p',null,'hint');
      const paint=()=>{result.textContent=(record.passes||[]).map((p,i)=>'Pass '+(i+1)+': '+p.hits+'/4 at '+p.bpm+' BPM ('+p.beats+' beats per chord)').join(' · ')};
      box.append(el('p','After each four-start pass, tap how many strums landed on beat 1.'),tally,result);
      for(let hits=0;hits<=4;hits++)tally.append(button(String(hits),()=>{
        (record.passes??=[]).push({hits,bpm:record.bpm||50,beats:record.spacing||4});save();paint();
      }));
      box.append(button('Undo last tally',()=>{record.passes?.pop();save();paint()}));paint();
    }
    const label=el('label',day===1?'What did you hear?':'What did you hear or want to revisit?'),memo=el('textarea');
    memo.rows=2;memo.maxLength=500;memo.value=record.note||'';label.append(memo);
    memo.oninput=()=>{record.note=memo.value;save()};
    const repeat=el('input');repeat.type='checkbox';const repeatLabel=el('label',' Repeat this day next time');repeatLabel.prepend(repeat);
    repeat.checked=!!record.repeat;repeat.onchange=()=>{record.repeat=repeat.checked;save()};
    const status=el('p',null,'hint');status.setAttribute('role','status');
    const done=button('Done',()=>{
      const course=state(),previousNext=course.next,previousDay=store.days[dayKey()];
      const attempt={...record,day,date:dayKey(),time:Date.now(),repeat:repeat.checked};
      course.attempts.push(attempt);course.next=repeat.checked?day:Math.max(course.next,Math.min(28,day+1));
      delete course.drafts[day];store.days[dayKey()]=true;
      try{save()}catch{course.attempts.pop();course.next=previousNext;course.drafts[day]=record;if(previousDay)store.days[dayKey()]=previousDay;else delete store.days[dayKey()];status.textContent='Could not save this attempt. Your notes are still here.';return}
      location.hash='practice';
    },'primary');
    box.append(label,repeatLabel,done,status);
    const previous=state().attempts.filter(a=>a.day===day).slice(-3).reverse();
    if(previous.length){
      const history=el('details');history.append(el('summary','Previous attempts'));
      for(const a of previous)history.append(el('p',[a.date,a.bpm?a.bpm+' BPM':'',...(a.passes||[]).map(p=>p.hits+'/4 at '+p.bpm+' BPM'),a.note,a.repeat?'Repeat requested':'Practiced'].filter(Boolean).join(' · ')));
      box.append(history);
    }
  }
  function handImage(grip){
    const img=el('img',null,'zero-hand'+(grip?' grip':''));
    img.src='zero-hands.webp';img.alt=grip?'Small pick held between thumb and curled index finger.':'A seated player rests the picking forearm on the guitar body and releases the neck.';
    return img;
  }
  function takeRecorder(){
    const box=block('Record a practice take'),controls=el('div',null,'log-buttons'),clips=el('div'),info=el('p','Include your spoken count-in. Takes are available until you leave this lesson.','hint');
    const urls=[];let recorder,stream,generation=0;
    function release(){stream?.getTracks().forEach(t=>t.stop());stream=null}
    const start=button('Record take',async()=>{
      if(recorder?.state==='recording'){start.classList.remove('zero-recording');start.disabled=true;recorder.stop();return}
      const version=++generation;start.disabled=true;
      try{
        if(!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia)throw Error();
        const input=await navigator.mediaDevices.getUserMedia({audio:true});
        if(version!==generation){input.getTracks().forEach(t=>t.stop());return}
        stream=input;recorder=new MediaRecorder(input);const chunks=[];
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
        recorder.onstop=()=>{
          if(version!==generation)return;
          const url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));urls.push(url);
          const audio=el('audio');audio.controls=true;audio.src=url;audio.setAttribute('aria-label','Practice take '+urls.length);
          clips.append(el('p','Take '+urls.length),audio);release();start.disabled=false;start.textContent='Record another take';info.textContent='Listen for one detail, then try again.';
        };
        recorder.start();start.classList.add('zero-recording');start.textContent='Stop recording';info.textContent='Recording on this device…';
      }catch{release();info.textContent='Recording is unavailable. Use a phone recorder, or alternate a hummed pass and a played pass.'}
      finally{if(version===generation)start.disabled=false}
    });
    controls.append(start);box.append(info,controls,clips);
    return ()=>{generation++;if(recorder?.state==='recording')recorder.stop();release();for(const url of urls)URL.revokeObjectURL(url);clips.replaceChildren();urls.length=0;start.disabled=false;start.textContent='Record take'};
  }
  function open(day){
    dispose();stopGuide=()=>{};
    const lesson=zeroLessons[day-1];host.replaceChildren();
    $('zeroDay').textContent='Guitar from Zero · Day '+day+' of 28';
    $('zeroTitle').textContent=lesson.title;
    let stopTuner=()=>{};
    if(day===1){
      const hold=block('1. Hold the guitar');
      hold.append(handImage(false),el('p','Sit with the guitar against your body and the neck slightly raised. Rest your picking forearm on the body. Open your fretting hand briefly. If the neck drops, reposition the body and try again.'),
        link('See how to hold an acoustic guitar ↗','https://www.fender.com/play/lessons/hold-an-acoustic-guitar-and-pick'));
      const pick=block('2. Make one sound');
      pick.append(handImage(true),el('p','Hold the pick between your thumb and the side of your index finger. Leave just a little tip showing. Near the sound hole, pluck the thickest string once with nothing pressing on the neck. If several strings sound, use a smaller stroke.'),
        link('See the pick grip ↗','https://www.fender.com/articles/techniques/get-a-grip-how-to-hold-a-pick'));
      stopTuner=tuning(day);
    }else{
      const plan=el('details',null,'surface zero-block');
      plan.append(el('summary','Today’s session · about 15 minutes'),el('p','Tune for 2 minutes. Recall yesterday’s skill for 3. Try the new movement for 5, use it in music for 4, then take 1 to log what you heard.'),
        el('p','Short on time? Tune, recall one skill, and do one pass. Pick “Repeat this day next time” to come back to it.'));
      host.append(plan);stopTuner=tuning(day);
      const guide=block('What to do');
      for(const part of lesson.body.split(/\n\s*\n/))guide.append(el('p',part));
      if(day===9)guide.append(el('p','Keep your picking hand still on beats 2–4. Both downstrokes start from thick E. Listen for the click and the start of your strum together.'));
      charts(day);
    }
    const stopPlayer=player(day);
    const stopRecorder=[13,14,22,26,27,28].includes(day)?takeRecorder():()=>{};
    finish(day);
    suspend=()=>{stopTuner();stopPlayer();if(document.querySelector('#zeroBody .zero-recording'))document.querySelector('#zeroBody .zero-recording').click()};
    dispose=()=>{stopTuner();stopPlayer();stopRecorder();stopGuide=()=>{};suspend=()=>{}};
  }
  document.addEventListener('leavepracticepage',()=>{dispose();dispose=()=>{}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend()});
  window.addEventListener('pagehide',()=>dispose());
  return {open,home};
})();
