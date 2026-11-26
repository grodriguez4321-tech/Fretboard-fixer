const fingerCourse=(()=>{
  const el=element,P=fingerPatterns,body=$('fingerBody');
  const blocks=['Tune and warm up','Picking-hand accuracy','Fretting-hand accuracy','Finger independence','Music theory','Song practice'];
  const minutes={30:[2,5,5,5,3,10],40:[3,7,7,7,4,12],60:[4,10,10,10,5,21]};
  const weeks=['Accuracy and fundamentals','Coordination and movement','Bass and melody independence','Expression and performance'];
  const metrics=['Random fret accuracy (%)','Spider exercise (BPM)','Open-string picking (BPM)','Thumb independence (BPM)','Clean simultaneous plucks (/10)'];
  const goals=['Find frets 1–5 without prolonged searching','Navigate all six strings with the picking hand','Pluck two, three and four strings together','Maintain an independent bass rhythm','Sustain bass under a moving melody','Recognize chord shapes in tab','Perform sections of three fingerstyle songs','Use hammer-ons, pull-offs, slides and harmonics','Play with less hand tension'];
  const names=['thin e','B','G','D','A','thick E'];
  const picking=s=>s>3?'P':['A','M','I'][s-1];
  const week=d=>Math.min(3,Math.floor((d-1)/7));
  const route=(d,b)=>'#finger'+(d?'/'+d:'')+(b?'/'+b:'');
  const state=()=>store.fingerRoadmap??={length:30,days:{},weeks:{},goals:{}};
  const day=d=>state().days[d]??={blocks:{}};
  const nextDay=()=>Array.from({length:30},(_,i)=>i+1).find(d=>!state().days[d]?.done)||30;
  const clean=[];
  function leave(){while(clean.length)clean.pop()()}
  document.addEventListener('leavepracticepage',leave);
  function link(title,url,cls){const a=el('a',title,cls);a.href=url;return a}
  function button(title,fn){const b=el('button',title);b.type='button';b.onclick=fn;return b}
  function row(...nodes){const r=el('div',null,'fs-row');r.append(...nodes);return r}
  function section(title,fold=false){const s=el(fold?'details':'section',null,'surface');s.append(el(fold?'summary':'h2',title));body.append(s);return s}
  function field(label,input){const l=el('label',label,'fs-field');l.append(input);return l}
  function select(values,active,change){const s=el('select');for(const [value,title] of values){const o=el('option',title);o.value=value;s.append(o)}s.value=active;s.onchange=()=>change(s.value);return s}
  function count(title,obj,key,max){
    const out=el('strong');const show=()=>out.textContent=(obj[key]||0)+' / '+max;show();
    function change(step){obj[key]=Math.max(0,Math.min(max,(obj[key]||0)+step));save();show()}
    return row(el('span',title),button('−',()=>change(-1)),out,button('+1',()=>change(1)));
  }
  function home(){const d=nextDay();$('fingerStart').href=route(d);$('fingerStart').textContent=(state().days[d]?.done?'Review':'Open')+' day '+d;$('fingerToday').textContent=fingerDays[d-1][0]}
  function tracker(d){
    const w=week(d),m=state().weeks[w]??={};const panel=section('Week '+(w+1)+' progress',true);
    metrics.forEach((label,i)=>{
      const input=el('input');input.type='number';input.min=0;if(i===0)input.max=100;if(i===4)input.max=10;
      input.value=m[i]??'';input.onchange=()=>{if(input.reportValidity()){m[i]=input.value;save()}};panel.append(field(label,input));
    });
  }
  function outline(){
    $('fingerTitle').textContent='Melodic fingerstyle';$('fingerKicker').textContent='30-day roadmap · Standard tuning';
    const course=section('Your next session');const d=nextDay();
    course.append(link('Day '+d+' · '+fingerDays[d-1][0],route(d),'start-link'));
    const pdf=link('Printable 30-day roadmap','fingerstyle-roadmap.pdf');pdf.target='_blank';pdf.rel='noopener';const pdfRow=el('p');pdfRow.append(pdf);course.append(pdfRow);
    weeks.forEach((title,w)=>{const s=section('Week '+(w+1)+' · '+title,true);s.open=w===week(d);
      fingerDays.forEach(([name],i)=>{if(week(i+1)===w)s.append(link((state().days[i+1]?.done?'✓ ':'')+'Day '+(i+1)+' · '+name,route(i+1),'fs-item'))});
    });
  }
  function checklist(d){
    const info=day(d),s=section('Today’s checklist');
    const duration=select(Object.keys(minutes).map(n=>[n,n+' minutes']),state().length,v=>{state().length=Number(v);save();open(d)});
    s.append(el('p',fingerDays[d-1][1]),field('Session length',duration));
    blocks.forEach((name,i)=>s.append(link((info.blocks[i+1]?'✓ ':'')+name+' · '+minutes[state().length][i]+' min',route(d,i+1),'fs-item')));
    tracker(d);
    if(d===30){const g=section('Month-end playing check');goals.forEach((label,i)=>{const b=el('input');b.type='checkbox';b.checked=!!state().goals[i];b.onchange=()=>{state().goals[i]=b.checked;save()};const l=el('label',label,'fs-goal');l.prepend(b);g.append(l)})}
    const note=el('textarea');note.rows=3;note.value=info.note||'';note.oninput=()=>{info.note=note.value;save()};const wrap=section(d===30?'Next month’s goals':'Session notes');wrap.append(field('What sounded better? What needs another pass?',note));
    const finish=button(info.done?'Return to practice':'Finish day',()=>{info.done=true;store.days[dayKey()]=true;save();location.hash='practice'});
    finish.disabled=!info.done && !blocks.every((_,i)=>info.blocks[i+1]);body.append(row(finish,link('All 30 days',route())));
  }
  function demoChoices(d,b){
    if(b===1)return [P.picking()];
    if(b===2){
      if(d===24)return ['Quiet','Moderate','Loud'].map((name,i)=>({name:name+' phrase',cue:'Play the same four notes at each volume. Keep the tempo steady and the attacks clear. Record two versions and compare.',division:1,bpm:50,steps:[0,1,3,1].map(f=>[{string:1,fret:f,duration:.9,volume:[.05,.12,.22][i]}])}));
      if(d===2)return [P.picking(false,true),P.picking()];
      if(d===10)return [P.picking(),P.picking(true)];
      if([3,4,12,24,25].includes(d))return [ ...(d===12||d===24?[P.balance]:d===25?[P.mute]:[]),P.pinch(2),P.pinch(3),P.pinch(4)];
      if([8,9].includes(d))return d===8?Object.keys(P.shapes).map(P.chord):[P.changes('D'),P.changes('E')];
      if(d>=15&&d<=18)return [P.thumb(d===15?1:d===17?2:3),P.picking()];
      return [P.picking(false,d===2),P.picking(true)];
    }
    if(b===3){
      if(d===19)return [P.legato('hammer')];
      if(d===20)return [P.legato('pull'),P.legato('slide')];
      if(d===22)return [{name:'Natural harmonics',cue:'Touch thick E directly above wire 12, 7 or 5. Pluck with the thumb and lift the touching finger immediately. Listen for a clear bell-like pitch.',division:1,bpm:45,steps:[12,7,5].map((f,i)=>[{string:6,fret:f,ratio:[2,3,4][i],duration:.95}])}];
      if(d===19||d===20)return d===19?[P.legato('hammer')]:[P.legato('pull'),P.legato('slide')];
      if(d===22)return [P.harmonic];if(d===23)return [P.shift];if(d===11)return [P.jumps];
      if(d===8)return Object.keys(P.shapes).map(P.chord);
      if(d===9)return [P.changes('D'),P.changes('E')];
      return ['1234','4321','1324','1423','2413'].map(o=>P.spider(o));
    }
    if(d===6||d===25)return d===25?[P.mute,P.sustain]:[P.sustain,P.thumb(1)];
    if(d<=4)return [P.pinch(d===4?3:2),P.pinch(4),P.thumb(1)];
    const levels=d>=18?[3,4,1,2]:d>=17?[2,1,3,4]:[1,2,3,4];return levels.map(P.thumb);
  }
  function player(d,b){
    const panel=section('Play along'),info=day(d),choices=demoChoices(d,b);
    let variant=0,pattern=choices[0],pos=0,running=false,version=0,timer,frame,loop=true;
    const cue=el('p'),readout=el('strong'),tab=el('div',null,'fs-score'),neck=guitarNeck('Fingerstyle positions');
    const bpm=el('input');bpm.type='number';bpm.min=25;bpm.max=180;bpm.value=info['tempo'+b]||pattern.bpm;
    const loopBox=el('input');loopBox.type='checkbox';loopBox.checked=true;loopBox.onchange=()=>loop=loopBox.checked;
    const play=button('Play',toggle),previous=button('Previous',()=>step(-1)),next=button('Next',()=>step(1));
    const summary=el('p','Top line is thin e. Numbers are frets. Stack two or more numbers to pluck together.','hint');
    let cols=[];
    function paint(i){
      pos=i;const notes=pattern.steps[i];for(const c of cols)c.removeAttribute('aria-current');cols[i].setAttribute('aria-current','step');
      const c=cols[i];if(c.offsetLeft<tab.scrollLeft||c.offsetLeft+c.offsetWidth>tab.scrollLeft+tab.clientWidth)tab.scrollLeft=Math.max(0,c.offsetLeft-tab.clientWidth/3);
      neck.cells.forEach(cell=>{cell.classList.add('blank');cell.classList.remove('selected','fs-held')});
      for(let j=i-1;j>=Math.max(0,i-8);j--){
        for(const n of pattern.steps[j]){
          if(n.duration<=(i-j)/pattern.division || pattern.steps.slice(j+1,i+1).some(col=>col.some(v=>v.string===n.string)))continue;
          const cell=neck.cellAt(n.string,n.fret);cell.classList.remove('blank');cell.classList.add('fs-held');cell.firstChild.textContent='Ring';
        }
      }
      for(const n of notes){const cell=neck.cellAt(n.string,n.fret);cell.classList.remove('blank');cell.classList.add('selected');cell.firstChild.textContent=picking(n.string)}
      if(notes.length)neck.reveal(notes[0].fret);
      readout.textContent=notes.map(n=>picking(n.string)+' · '+names[n.string-1]+' '+(n.fret?'fret '+n.fret:'open')+(n.left?' · fretting finger '+n.left:'')+(n.gesture?' · '+n.gesture:'')).join(' + ')||'Let the last notes ring';
    }
    function draw(){
      cue.textContent=pattern.cue;tab.replaceChildren();const key=el('div',null,'fs-col fs-label');['Beat','e','B','G','D','A','E'].forEach(x=>key.append(el('span',x)));tab.append(key);
      cols=pattern.steps.map((notes,i)=>{const c=button('',()=>{stop();paint(i)});c.className='fs-col';
        const beat=pattern.division===2&&i%2?'&':String(Math.floor(i/pattern.division)%4+1);c.append(el('small',beat));
        for(let s=1;s<=6;s++){const n=notes.find(n=>n.string===s);c.append(el('span',n?String(n.fret):'·',n?'fs-hit':''))}
        c.setAttribute('aria-label','Step '+(i+1)+', '+(notes.map(n=>names[n.string-1]+' '+n.fret).join(' with ')||'ring'));tab.append(c);return c});paint(0);
    }
    function stop(){version++;running=false;clearTimeout(timer);cancelAnimationFrame(frame);play.textContent='Play';silence()}
    function step(delta){stop();paint((pos+delta+pattern.steps.length)%pattern.steps.length)}
    async function toggle(){
      if(running){stop();return}
      const token=++version;running=true;play.textContent='Pause';
      const audible=await enableAudio();if(token!==version)return;
      const seconds=60/Math.max(25,Math.min(180,Number(bpm.value)||pattern.bpm)),interval=seconds/pattern.division;
      const clock=()=>audible?audio.currentTime:performance.now()/1000;
      const start=clock()+.05,first=pos;let ticks=0,last=-1,limit=Infinity;
      function schedule(){
        while(start+ticks*interval<=clock()+.09 && ticks<limit){
          const i=(first+ticks)%pattern.steps.length,t=start+ticks*interval;
          if(audible){
            if(i%pattern.division===0)voice(920,.035,t,.055,null,'sine');
            for(const n of pattern.steps[i]){
              const hz=n.ratio?pitchAt(n.string,0).hz*n.ratio:pitchAt(n.string,n.fret).hz;
              voice(hz,n.duration*seconds,t,n.volume||.13,null,n.ratio?'sine':'triangle');
            }
          }
          ticks++;if(!loop && i===pattern.steps.length-1)limit=ticks;
        }
        timer=setTimeout(schedule,30);
      }
      function display(){
        const tick=Math.floor((clock()-start)/interval);
        if(tick>=limit){stop();paint(0);return}
        if(tick>=0 && tick!==last){paint((first+tick)%pattern.steps.length);last=tick}
        frame=requestAnimationFrame(display);
      }
      schedule();display();
    }
    const reps=el('div');
    function showCount(){const name=pattern.name,pinch=name.endsWith('strings together');reps.replaceChildren(count(pinch?'Clean plucks':'Clean passes',info,'clean-'+b+'-'+name,pinch?10:5))}
    const variantInput=select(choices.map((v,i)=>[i,v.name]),0,v=>{stop();variant=Number(v);pattern=choices[variant];draw();showCount()});
    panel.append(field('Pattern',variantInput),cue,summary,tab,readout,neck.root);
    if(choices.every(p=>p.name.startsWith('Spider'))){const start=select([[1,'Fret 1'],[5,'Fret 5']],1,v=>{stop();choices.forEach((p,i)=>choices[i]=P.spider(p.name.split(' ')[1],Number(v)));pattern=choices[variant];draw()});panel.append(field('Hand position',start))}
    if(choices.some(p=>p.name.includes('strings together'))){panel.append(field('Thumb string for simultaneous plucks',select([[6,'Thick E'],[5,'A'],[4,'D']],6,v=>{stop();choices.forEach((p,i)=>{if(p.name.includes('strings together'))choices[i]=P.pinch(Number(p.name[0]),Number(v))});pattern=choices[variant];draw()})))}
    bpm.onchange=()=>{stop();bpm.value=Math.max(25,Math.min(180,Number(bpm.value)||pattern.bpm));info['tempo'+b]=Number(bpm.value);save()};
    panel.append(row(play,previous,next,button('Restart',()=>{stop();paint(0)})),row(field('Tempo (BPM)',bpm),field('Loop',loopBox)));
    const hidden=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',hidden);
    panel.append(reps);showCount();clean.push(()=>{stop();document.removeEventListener('visibilitychange',hidden)});draw();
  }
  function navigationTest(d){
    const s=section('Find 20 positions'),data=day(d);
    const message=el('p'),feedback=el('p');feedback.setAttribute('role','status');
    function make(limit){
      const pool=[];for(let string=1;string<=6;string++)for(let fret=1;fret<=limit;fret++)pool.push({string,fret});
      for(let i=pool.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
      data.quiz={limit,targets:pool.slice(0,20),at:0,correct:0};save();
    }
    if(!data.quiz)make(5);
    const neck=guitarNeck('Tap a string and fret',p=>{
      const q=data.quiz,t=q.targets[q.at];if(!t)return;
      const hit=p.string===t.string&&p.fret===t.fret;
      if(hit)q.correct++;
      feedback.textContent=(hit?'Correct. ':'You tapped '+names[p.string-1]+' fret '+p.fret+'. ')+'Target was '+names[t.string-1]+' fret '+t.fret+'.';
      q.at++;if(q.at===20){const w=state().weeks[week(d)]??={};w[0]=q.correct*5}
      save();draw();
    });
    const redo=button('Repeat 20 targets',()=>{make(data.quiz.limit);feedback.textContent='';draw()});
    const expand=button('Expand range',()=>{make(data.quiz.limit===5?8:12);feedback.textContent='';draw()});
    function draw(){
      const q=data.quiz,t=q.targets[q.at];message.textContent=t?'Target '+(q.at+1)+' of 20 · Play '+names[t.string-1]+' fret '+t.fret+' on your guitar, then tap that position.':q.correct+' / 20 correct ('+q.correct*5+'%). '+(q.correct<18?'Repeat this range.':'Range complete.');
      redo.hidden=!!t;expand.hidden=!!t||q.correct<18||q.limit===12;
      if(!expand.hidden)expand.textContent='Try frets 1–'+(q.limit===5?8:12);
    }
    neck.cells.forEach(c=>c.classList.add('blank'));s.append(message,neck.root,feedback,row(redo,expand));draw();
  }
  const questions=[
    [['What is one fret higher than open thin E?','F','F♯','D'],['Which string is one below thin e in pitch when open?','B','G','A'],['How many eighth notes fill one quarter-note beat?','2','3','4']],
    [['Which note changes when A major becomes A minor?','C♯ moves to C','E moves to F','A moves to G'],['Which three notes build D major?','D F♯ A','D F A','D G A'],['Which note is the fifth in E minor?','B','G','E']],
    [['What matches open thin e exactly in pitch?','B string fret 5','B string fret 3','G string fret 5'],['How many frets above an open string is its octave?','12','7','5'],['Open G to open B spans which interval?','Major third','Perfect fifth','Octave']],
    [['What changes if you play the same chord tones in a new order or octave?','The voicing','The tempo','The meter'],['Which part should stand out if you want someone to hum the tune?','Melody','Bass pulse','Every note equally'],['Which change brings out a high melody over alternating bass?','Pluck the melody a little stronger','Speed up each high note','Mute every bass note']]
  ];
  function theory(d){
    const s=section('Listen, then answer'),q=questions[week(d)][(d-1)%3],result=el('p');
    s.append(el('p',q[0]));const options=q.slice(1);const offset=1+d%2;
    for(let i=0;i<3;i++){const answer=options[(i+offset)%3];s.append(button(answer,()=>{result.textContent=answer===q[1]?'Correct · '+q[1]+'.':'Try it on the guitar, then choose again.'}))}
    result.setAttribute('role','status');s.append(result);
    if(d===5||d===30)navigationTest(d);
  }
  const repertoire=['Fallen Down','Concerning Hobbits','I Want to Live','One Summer’s Day','Interstellar','Promise','Unravel'];
  function song(d){
    const s=section('Work on one phrase'),info=day(d);
    const suggested=d===27?5:d===26?4:[10,23].includes(d)?3:(d>=15&&d<=21)?2:[4,8,9,13,14].includes(d)?1:0;
    const input=el('input');input.placeholder='e.g. opening, bars 1–2';input.value=info.phrase||'';input.oninput=()=>{info.phrase=input.value;save()};
    const pick=select(repertoire.map(n=>[n,n]),info.song||repertoire[suggested],v=>{info.song=v;info.reps=0;save();open(d,6)});
    s.append(field('Song',pick),field('Section or measure numbers',input),link('Open my arrangements in Songs','#songs'),el('p','Use your own tab or recording. Pick one or two measures. Find comfortable frets, assign P/I/M/A, then combine at half speed. Count five clean passes before adding a measure. If the same slip returns, isolate the two or three notes around it.'),count('Clean phrase passes',info,'reps',5));
    const record=section('My recordings',true);record.open=[7,14,21,28,30].includes(d);
    theoryCourse.recorder('fingerstyle-'+d,record);
    if(d===14||d===21||d===30){
      const previous=d===14?7:d===21?14:21;s.append(link('Hear my day '+previous+' recordings',route(previous,6)));
    }
  }
  function open(d=0,b=0){
    leave();body.replaceChildren();if(!d){outline();return}
    const [title,assignment]=fingerDays[d-1],info=day(d);
    $('fingerTitle').textContent=b?blocks[b-1]:title;
    $('fingerKicker').textContent='Week '+(week(d)+1)+' · Day '+d+(b?' · '+title:' · '+weeks[week(d)]);
    if(!b){
      const intro=section('Today’s focus');intro.append(el('p',assignment),field('Session length',select([30,40,60].map(n=>[n,n+' minutes']),state().length,v=>{state().length=Number(v);save();open(d)})));
      checklist(d);return;
    }
    body.append(link('← Day '+d+' checklist',route(d)),el('p',assignment,'hint'));
    if(b===1){
      const s=section('Tune thick to thin');s.append(el('p','Use your tuner. Pluck one open string at a time, then compare with its reference tone. Rest the picking hand loosely and play one slow roll.'));
      const refs=row();for(const [i,label] of ['E2','A2','D3','G3','B3','E4'].entries())refs.append(button(label,async()=>{if(await enableAudio()&&refs.isConnected)voice(pitchAt(6-i,0).hz,1.3,audio.currentTime+.01,.15)}));s.append(refs);
    }
    if(b<=4){player(d,b);if(d===5 && b===3)navigationTest(d);
      const reps=section('Check your playing');const pinch=b===2&&[3,4].includes(d);
      reps.append(el('p',pinch?'Listen for one attack from all the strings. Reset your picking fingers between plucks.':'Play once without the guide. If a note buzzes, a bass beat moves or the hand tightens, slow down and repeat the smallest difficult group.'));
    }else if(b===5)theory(d);else song(d);
    const done=button('Done · back to checklist',()=>{info.blocks[b]=true;save();location.hash=route(d)});done.className='primary';body.append(done);
  }
  return {home,open};
})();
