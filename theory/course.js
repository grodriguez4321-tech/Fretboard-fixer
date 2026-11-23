// Text and course progress share the existing local journal/export. Audio takes use IndexedDB.
const theoryCourse=(()=>{
  const el=element,body=$('theoryBody');
  const base='theory/',pdf=base+'From-Notes-to-Orchestration.pdf';
  const state=()=>store.musicTheory??={completed:{},notes:{},chart:{}};
  let cleanups=[],pauseTools=[],dbPromise;
  function leave(){
    for(const fn of cleanups)fn();
    cleanups=[];pauseTools=[];
  }
  document.addEventListener('leavepracticepage',leave);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseTools.forEach(fn=>fn())});
  window.addEventListener('pagehide',()=>pauseTools.forEach(fn=>fn()));
  function link(text,href,cls){const a=el('a',text,cls);a.href=href;return a}
  function documentLink(text,page){const a=link(text,pdf+'#page='+page);a.target='_blank';a.rel='noopener';return a}
  function box(title,fold=false){
    const node=el(fold?'details':'section',null,'surface');
    node.append(el(fold?'summary':'h2',title));body.append(node);return node;
  }
  function field(name,input){const label=el('label',name,'theory-field');label.append(input);return label}
  function button(text,fn){return lab.button(text,fn)}
  function actions(...nodes){const r=el('div',null,'theory-actions');r.append(...nodes);return r}
  function remember(status){
    try{save();if(status)status.textContent='Saved in this browser.';return true}
    catch{if(status)status.textContent='Browser storage is full. Copy your notes before leaving.';return false}
  }
  function resume(){
    const data=state();
    if(data.last && !data.completed[data.last])return data.last;
    for(let i=1;i<=60;i++)if(!data.completed[i])return i;
    return 0;
  }
  function weekDay(n){return 'Week '+Math.ceil(n/5)+' · Day '+((n-1)%5+1)}
  function materials(expand=false){
    const boxEl=box('Listening example and workbook',true);boxEl.open=expand;
    boxEl.append(el('h3','Leave the Light On'),el('p','Instructor example · Eight bars in C major at 80 BPM. Listen for what changes each time the chorus returns.'));
    const player=el('audio');player.controls=true;player.preload='none';player.src=base+'Leave-the-Light-On.mp3';player.setAttribute('aria-label','Leave the Light On, three arrangements');
    const message=el('p',null,'hint');let seek=0,sequence=0;
    const chapters=actions();
    for(const [seconds,label] of [[0,'0:00 · Melody'],[26,'0:26 · With piano'],[52,'0:52 · Ensemble']]){
      chapters.append(button(label,async()=>{
        seek=seconds;let version=++sequence;message.textContent='';
        const move=()=>{if(version===sequence)player.currentTime=seek};
        if(player.readyState>=1)move();else player.addEventListener('loadedmetadata',move,{once:true});
        try{await player.play()}catch{if(version===sequence)message.textContent='Tap Play in the audio controls to listen.'}
      }));
    }
    const midi=link('Download six-track MIDI',base+'Leave-the-Light-On.mid');midi.download='Leave-the-Light-On.mid';
    boxEl.append(player,chapters,message,actions(documentLink('Full workbook',1),documentLink('Listening score',14),documentLink('Answer key',16),documentLink('Song chart and rubric',17),midi));
    cleanups.push(()=>{sequence++;player.pause();player.removeAttribute('src');player.load()});
    pauseTools.push(()=>player.pause());
  }
  function overview(){
    $('theoryLocation').textContent='Music Theory · 12 weeks';
    $('theoryTitle').textContent='From Notes to Orchestration';
    const n=resume(),done=Object.keys(state().completed).length;
    const intro=box(n?weekDay(n):'Course complete');intro.classList.add('theory-next');
    intro.append(el('p','Write a two-bar rhythm, develop it into a song, then arrange that song for an ensemble.'));
    if(n){
      const day=theoryWeeks[Math.floor((n-1)/5)].days[(n-1)%5];
      intro.append(link((done||state().last?'Continue':'Start')+' · '+day.title,'#theory/'+n,'start-link'));
    }
    intro.append(el('p',done+' of 60 sessions complete · Five sessions per week, at your pace.','theory-meta'));
    const list=box('Course outline');
    theoryWeeks.forEach((w,i)=>{
      const week=el('details',null,'theory-week');week.open=i===Math.floor((n-1)/5);
      week.append(el('summary','Week '+(i+1)+' · '+w.title),el('p',w.goal));
      w.days.forEach((d,j)=>{const number=i*5+j+1;week.append(link((state().completed[number]?'✓ ':'')+'Day '+(j+1)+' · '+d.title,'#theory/'+number))});
      list.append(week);
    });
    materials();
  }
  function clickTrack(open){
    const panel=box('Practice pulse',true);panel.open=open;
    const tempo=el('input');tempo.type='number';tempo.min=30;tempo.max=240;tempo.value=state().tempo||72;
    const pulse=el('div',null,'theory-pulses');for(let i=1;i<=4;i++)pulse.append(el('span',i));
    const msg=el('p',null,'hint');let timer,version=0,active=false;
    const run=button('Start click',async()=>{
      if(active){stop();return}
      const token=++version;active=true;run.textContent='Stop click';msg.textContent='';
      const bpm=Math.min(240,Math.max(30,Math.round(+tempo.value||72)));tempo.value=bpm;
      state().tempo=bpm;remember();
      if(!await enableAudio()){if(token===version){stop();msg.textContent='Audio unavailable. Count four even beats aloud.'}return}
      if(token!==version)return;
      const seconds=60/bpm,start=audio.currentTime+.05;let next=0;
      function tick(){
        while(start+next*seconds<audio.currentTime+.1){
          voice(next%4===0?1100:760,.045,start+next*seconds,.12,null,'sine');next++;
        }
        const beat=Math.floor((audio.currentTime-start)/seconds);
        [...pulse.children].forEach((p,i)=>p.classList.toggle('current',beat>=0&&i===beat%4));
        timer=setTimeout(tick,25);
      }
      tick();
    });
    function stop(){version++;active=false;clearTimeout(timer);run.textContent='Start click';for(const p of pulse.children)p.classList.remove('current')}
    tempo.onchange=stop;panel.append(field('Tempo (BPM)',tempo),pulse,run,msg);
    cleanups.push(stop);pauseTools.push(stop);
  }
  function keyboard(open){
    const panel=box('Play notes and chords',true);panel.open=open;
    const keys=el('div',null,'theory-keys'),octave=lab.select('Octave',[2,3,4,5,6].map(x=>[x,x]),4);
    const latch=el('input');latch.type='checkbox';const label=el('label',' Build a chord');label.prepend(latch);
    const selected=new Set(),msg=el('p','Tap a note to hear it.','hint');
    async function hear(notes){
      const g=generation;if(await enableAudio() && g===generation && panel.isConnected){
        for(const n of notes)voice(440*2**((n-69)/12),.95,audio.currentTime+.015,.13/Math.sqrt(notes.length));
      }
    }
    function draw(){
      keys.replaceChildren();
      for(let i=0;i<=12;i++){
        const n=12*(Number(octave.input.value)+1)+i,b=button(midiName(n),()=>{
          if(latch.checked){
            selected.has(n)?selected.delete(n):selected.add(n);
            msg.textContent=selected.size?[...selected].sort((a,b)=>a-b).map(midiName).join(' · '):'Choose chord tones.';
            draw();
          }else msg.textContent=midiName(n);
          hear([n]);
        });
        const white=[0,2,4,5,7,9,11,12],black=[1,3,6,8,10].includes(i);
        b.classList.toggle('accidental',black);
        b.style.setProperty('--key',black?white.filter(step=>step<i).length:white.indexOf(i));
        if(latch.checked){b.classList.toggle('on',selected.has(n));b.setAttribute('aria-pressed',String(selected.has(n)))}
        keys.append(b);
      }
    }
    const chord=button('Hear chord',()=>{if(selected.size)hear([...selected]);else msg.textContent='Select the notes you want to hear together.'});
    function mode(){selected.clear();chord.hidden=!latch.checked;msg.textContent=latch.checked?'Tap the notes in your chord, then hear them together.':'Tap a note to hear it.';draw()}
    octave.input.onchange=draw;latch.onchange=mode;panel.append(actions(octave.box,label),keys,chord,msg);mode();
  }
  function database(){
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open('fretboard-theory-takes',1);
      req.onupgradeneeded=()=>{const takes=req.result.createObjectStore('takes',{keyPath:'id',autoIncrement:true});takes.createIndex('lesson','lesson')};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    }).catch(e=>{dbPromise=null;throw e});
    return dbPromise;
  }
  async function takeStore(mode,operation){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('takes',mode),req=operation(tx.objectStore('takes'));
      tx.oncomplete=()=>resolve(req.result);tx.onabort=tx.onerror=()=>reject(tx.error);
    });
  }
  function recorder(n){
    const panel=box('My recordings',true),list=el('div'),info=el('p','Record a take or attach an audio file. Saved takes stay in this browser.','hint');
    const input=el('input');input.type='file';input.accept='audio/*,.m4a,.wav,.mp3,.ogg,.webm';
    let live=true,stream,rec,requesting=false,loaded=false;
    const urls=[],displayed=new Set();
    function item(take){
      if(displayed.has(take.id))return;
      displayed.add(take.id);
      const div=el('div'),title=el('h3',take.name),audio=el('audio');audio.controls=true;audio.preload='none';
      const url=URL.createObjectURL(take.blob);urls.push(url);audio.src=url;audio.setAttribute('aria-label',take.name);
      const download=link('Download take',url);download.download=take.name;
      div.append(title,audio,actions(download,button('Remove take',async()=>{
        if(!confirm('Remove this saved recording?'))return;
        try{await takeStore('readwrite',s=>s.delete(take.id));div.remove();URL.revokeObjectURL(url)}catch{info.textContent='Could not remove this take.'}
      })));list.prepend(div);
    }
    panel.addEventListener('toggle',async()=>{
      if(!panel.open||loaded)return;loaded=true;
      try{const old=await takeStore('readonly',s=>s.index('lesson').getAll(n));if(live)old.forEach(item)}
      catch{loaded=false;info.textContent='Cannot open recording storage in this browser. Use a voice memo and note its filename below.'}
    });
    async function keep(blob,name){
      const take={lesson:n,blob,name};
      try{take.id=await takeStore('readwrite',s=>s.add(take));if(live){item(take);info.textContent='Take saved.'}}
      catch{if(live){const url=URL.createObjectURL(blob);urls.push(url);const a=link('Download this take',url);a.download=name;info.replaceChildren('Browser storage unavailable. ',a)}}
    }
    function release(){stream?.getTracks().forEach(t=>t.stop());stream=null}
    const record=button('Record take',async()=>{
      if(rec?.state==='recording'){rec.stop();record.disabled=true;return}
      requesting=true;record.disabled=true;
      try{
        if(!window.MediaRecorder||!navigator.mediaDevices?.getUserMedia)throw Error();
        const mic=await navigator.mediaDevices.getUserMedia({audio:true});
        if(!live||!requesting){mic.getTracks().forEach(t=>t.stop());return}
        stream=mic;const parts=[];rec=new MediaRecorder(mic);
        rec.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
        rec.onstop=async()=>{
          const mime=rec.mimeType,ext=mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm';
          release();
          if(parts.length)await keep(new Blob(parts,{type:mime}),'Session-'+n+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+ext);
          if(live){record.textContent='Record take';record.disabled=false}
        };
        rec.start();record.textContent='Stop and save';info.textContent='Recording…';
      }catch{release();if(live)info.textContent='Microphone unavailable. Attach a voice memo below.'}
      finally{requesting=false;if(live)record.disabled=false}
    });
    input.onchange=async()=>{const file=input.files[0];if(file)await keep(file,file.name);input.value=''};
    function pause(){requesting=false;if(rec?.state==='recording')rec.stop();for(const a of list.querySelectorAll('audio'))a.pause()}
    cleanups.push(()=>{live=false;pause();release();urls.forEach(url=>URL.revokeObjectURL(url))});pauseTools.push(pause);
    panel.append(info,record,field('Attach a recording',input),list);
  }
  function writing(n){
    const panel=box('My writing notebook'),data=state(),note=data.notes[n]??={};
    const status=el('p','Notes save on this device.','hint');status.setAttribute('role','status');
    for(const [key,label] of [['draft','My rhythm, words, notes or draft'],['heard','What I heard or changed'],['next','What still feels difficult or needs another pass']]){
      const input=el('textarea');input.rows=key==='draft'?4:2;input.value=note[key]||'';
      input.oninput=()=>{note[key]=input.value;remember(status)};panel.append(field(label,input));
    }
    panel.append(status);
  }
  function worksheet(){
    const panel=box('My song chart and final listen',true),chart=state().chart,status=el('p',null,'hint');
    function entry(key,label,rows=0){
      const input=el(rows?'textarea':'input');if(rows)input.rows=rows;input.value=chart[key]||'';
      input.oninput=()=>{chart[key]=input.value;remember(status)};panel.append(field(label,input));
    }
    entry('title','Song title');entry('settings','Key, meter and tempo');
    entry('chart','Section, starting bar, chords, words or motif, and entrances',6);
    panel.append(el('h3','Final listen'),el('p','Score each item from 0 (missing) through 1 (audible in places) to 2 (clear throughout).'));
    for(const [key,label] of Object.entries({hook:'Hook · can I sing it back?',form:'Form · can I hear the chorus return?',words:'Words or phrasing · can I follow the line?',harmony:'Harmony · does a chord change give a note new meaning?',ensemble:'Orchestration · can I hear the lead and supporting entrances?',delivery:'Delivery · do both recordings match the chart?'})){
      const score=lab.select(label,[['','Choose'],[0,'0'],[1,'1'],[2,'2']],chart[key]??'');
      score.input.onchange=()=>{chart[key]=score.input.value;remember(status)};panel.append(score.box);
    }
    entry('revision','Timestamp, revision, and what you heard after the change',2);panel.append(status);
  }
  function exportNotes(){
    const s=state(),out=['From Notes to Orchestration',''];
    for(let n=1;n<=60;n++){
      const note=s.notes[n];if(!s.completed[n]&&!Object.values(note||{}).some(Boolean))continue;
      out.push(weekDay(n)+' · '+theoryWeeks[Math.floor((n-1)/5)].days[(n-1)%5].title+(s.completed[n]?' · completed':' · in progress'));
      if(note?.draft)out.push(note.draft);if(note?.heard)out.push('I heard: '+note.heard);if(note?.next)out.push('Next try: '+note.next);out.push('');
    }
    out.push('Song chart');for(const [key,value] of Object.entries(s.chart))if(value)out.push(key+': '+value);
    const url=URL.createObjectURL(new Blob([out.join('\n')],{type:'text/plain;charset=utf-8'}));
    const a=link('Download notebook',url);a.download='Music-theory-notebook.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function open(n){
    leave();body.replaceChildren();if(!n){overview();worksheet();body.append(button('Export notebook',exportNotes));return}
    const w=theoryWeeks[Math.floor((n-1)/5)],d=w.days[(n-1)%5];
    state().last=n;remember();
    $('theoryLocation').textContent=weekDay(n)+' · Music Theory';$('theoryTitle').textContent=d.title;
    body.append(link('← Course outline','#theory'));
    const task=box('Today’s session');task.classList.add('theory-next');task.append(el('p',d.task));
    const context=el('details');context.open=n%5===1;
    context.append(el('summary',w.title),el('p',w.goal),el('p',w.concept));task.append(context);
    const routine=el('details');routine.append(el('summary','25-minute practice routine'),el('p','Recall for 3 minutes, play the example for 5, write for 12, then record and listen for 5. Short session? Do the writing task and save a ten-second memo.'));task.append(routine);
    clickTrack(n<=5);keyboard(n>=6 && n<=20);recorder(n);writing(n);
    materials(n===20 || n===41);
    if(n>=36)worksheet();
    const check=box('Weekly checkpoint',n%5!==0);check.append(el('p',w.check));
    const status=el('p',null,'hint');status.setAttribute('role','status');
    const finish=button(state().completed[n]?'Done reviewing':'Mark session done',()=>{
      const previous=state().completed[n];state().completed[n]=true;
      if(remember(status))location.hash='theory';else if(!previous)delete state().completed[n];
    });finish.className='primary';body.append(actions(finish,link('Return to outline','#theory')),status);
  }
  return {open};
})();
