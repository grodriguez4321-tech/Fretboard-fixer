// Local ABC song lessons. Durations are stored in quarter-note beats, just like
// the studio scores. Reject notation outside the supported subset explicitly.
const songLessons=new Map();

function guitarVoicing(midis,anchor){
  let best=null,bestCost=Infinity;
  function tryString(index,used,positions){
    if(index===midis.length){
      const frets=positions.map(p=>p.fret).filter(Boolean);
      const span=frets.length ? Math.max(...frets)-Math.min(...frets) : 0;
      const cost=span*9+positions.reduce((sum,p)=>sum+Math.abs(p.fret-anchor)+p.fret*.12,0);
      if(cost<bestCost){bestCost=cost;best=positions}
      return;
    }
    tuning.forEach((open,i)=>{
      const fret=midis[index]-open;
      if(fret>=0 && fret<=24 && !(used&(1<<i)))tryString(index+1,used|(1<<i),[...positions,{string:i+1,fret,finger:fret?null:0}]);
    });
  }
  tryString(0,0,[]);
  if(!best)throw Error('These pitches have no standard-tuning guitar voicing.');
  return best;
}

// Build a performance order while retaining printed bar indices for practice.
function abcPlaybackOrder(marks){
  const order=[], repeats=new Map();
  const segno=marks.findIndex(bar=>bar.segno),coda=marks.findIndex(bar=>bar.coda);
  let start=0,pass=1,returned=false;
  for(let index=0;index<marks.length;){
    if(order.length>=2048)return null;
    const mark=marks[index];
    if(mark.start)start=index;
    if(mark.endings && !mark.endings.includes(pass)){
      if(mark.end)repeats.delete(index);
      index++;continue;
    }
    order.push(index);
    if(mark.toCoda && returned && coda>index){index=coda;continue}
    if(mark.ds && !returned && segno>=0 && segno<index){
      returned=true;start=0;pass=1;repeats.clear();index=segno;continue;
    }
    if(mark.end){
      const nextPass=(repeats.get(index)||1)+1;
      if(nextPass<=(mark.passes||2)){
        repeats.set(index,nextPass);pass=nextPass;index=start;continue;
      }
      repeats.delete(index);start=index+1;
    }
    if(!mark.end && !marks[index+1]?.endings && !repeats.size)pass=1;
    index++;
  }
  return order;
}

function compileAbc(text){
  if(typeof text!=='string'||text.length>24000)throw Error('Choose one short ABC excerpt per file.');
  const fields={},titles=[],comments=[],music=[];
  for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
    if(raw.trimStart().startsWith('%')){comments.push(raw.trim().replace(/^%+\s*/,''));continue}
    const line=raw.split('%')[0].trim();if(!line)continue;
    if(/^[A-Za-z]:/.test(line)){
      const key=line[0],value=line.slice(2).trim();
      if(key==='T')titles.push(value);
      if(key==='X' && fields.X)throw Error('Choose a single tune per file.');
      fields[key]=value;
    }else music.push(line);
  }
  if(!titles[0] || fields.K?.toLowerCase()!=='none')throw Error('Use a titled K:none excerpt with written accidentals.');
  const meter=fields.M==='none'?0:({'3/4':3,'4/4':4})[fields.M];
  const unit=/^1\/(4|8|16)$/.exec(fields.L),bpm=/^1\/4\s*=\s*(\d+)$/.exec(fields.Q);
  if(meter==null||!unit||!bpm||+bpm[1]<20||+bpm[1]>300)throw Error('Unsupported meter, note unit or tempo.');
  const defaultBeat=4/Number(unit[1]),bars=[],labels=[];
  let bar=[],accidental=new Map(),tupleCount=0,factor=1,tie=null,slur=false,slurStart=false,last=null,ordinal=0;
  // The source may specify a physical guitar position for a slurred gesture.
  const bStringHint=comments.some(c=>/B string 10 to 8/i.test(c));
  const pullOffHint=comments.join(' ').match(/pull-off\s*\((\d+) to (\d+)\)/i);
  let anchor=bStringHint?8:2;
  let section='',events=0,hasNavigation=false,activeTempo=Number(bpm[1]);
  const marks=[];
  const navigation=()=>marks[bars.length]??={};
  const tempoChanges=[];
  const pitchSyntax=/^([_=^]?)([A-Ga-g])([,']*)/;
  function readPitch(token){
    const [,mark,letter,octaves]=token.match(pitchSyntax),key=letter+octaves;
    if(mark)accidental.set(key,{'_':-1,'^':1,'=':0}[mark]);
    const shift=accidental.get(key)||0;
    const midi=60+({C:0,D:2,E:4,F:5,G:7,A:9,B:11})[letter.toUpperCase()]+(letter===letter.toLowerCase()?12:0)
      +12*Array.from(octaves).reduce((a,c)=>a+(c==="'"?1:-1),0)+shift;
    return {midi,label:letter.toUpperCase()+(shift<0?'♭':shift>0?'♯':'')+Math.floor((midi-shift)/12-1)};
  }
  function finishBar(){
    if(!bar.length)return;
    if(bars.length>=256)throw Error('Choose a song with 256 bars or fewer.');
    navigation();bars.push(bar);labels.push(section||'Phrase '+bars.length);bar=[];accidental=new Map();
  }
  let data=music.join(' ');
  while(data.length){
    data=data.trimStart();if(!data)break;
    let m;
    if((m=/^\[P:([^\]]+)\]/.exec(data))){
      if(bar.length)finishBar();
      section=m[1].trim();data=data.slice(m[0].length);continue;
    }
    if((m=/^\[Q:1\/4\s*=\s*(\d+)\]/.exec(data))){
      const tempo=Number(m[1]);
      if(tempo<20||tempo>300)throw Error('Unsupported tempo.');
      activeTempo=tempo;
      tempoChanges.push('Bar '+(bars.length+1)+': '+tempo+' BPM');
      data=data.slice(m[0].length);continue;
    }
    if((m=/^\[(\d+(?:,\d+)*)/.exec(data))){
      navigation().endings=m[1].split(',').map(Number);hasNavigation=true;
      data=data.slice(m[0].length);continue;
    }
    if((m=/^!(segno|coda)!/.exec(data))){
      navigation()[m[1]]=true;hasNavigation=true;
      data=data.slice(m[0].length);continue;
    }
    if((m=/^"\^([^"]*)"/.exec(data))){
      if(/^D\.S\. al Coda$/i.test(m[1]))navigation().ds=true;
      if(/^To Coda$/i.test(m[1]))navigation().toCoda=true;
      const times=/^Repeat x([2-9])$/i.exec(m[1]);
      if(times)navigation().passes=Number(times[1]);
      data=data.slice(m[0].length);continue;
    }
    if((m=/^(\|:|:\||\|\]|\|\||\|)/.exec(data))){
      if(m[0]===':|' && bar.length){navigation().end=true;hasNavigation=true}
      finishBar();
      if(m[0]==='|:'){navigation().start=true;hasNavigation=true}
      data=data.slice(m[0].length);continue;
    }
    if((m=/^Z(\d*)/.exec(data))){
      const count=Number(m[1]||1);
      if(!meter||count<1||count>256||bar.length||tie||tupleCount)throw Error('Unsupported whole-bar rest.');
      for(let i=0;i<count;i++){
        last={positions:[],beats:meter,action:'Rest',from:null,names:[],midis:[],sourceIndex:ordinal++,continuation:false,tempoRatio:activeTempo/Number(bpm[1])};
        bar.push(last);finishBar();events++;
      }
      data=data.slice(m[0].length);continue;
    }
    if((m=/^\(3(?::2:([123]))?/.exec(data))){factor=2/3;tupleCount=Number(m[1]||3);data=data.slice(m[0].length);continue}
    if(data[0]==='('){slur=true;slurStart=true;data=data.slice(1);continue}
    if(data[0]===')'){slur=false;data=data.slice(1);continue}
    if(data[0]==='-'){if(!last?.positions.length)throw Error('Tie needs a preceding note.');tie=last;data=data.slice(1);continue}
    m=/^(\[(?:[_=^]?[a-gA-G][,']*){1,6}\]|[_=^]?[a-gA-G][,']*|z)(\d*)(?:\/(\d*))?/.exec(data);
    if(!m)throw Error('Unsupported ABC near “'+data.slice(0,10)+'”.');
    let beats=defaultBeat*(Number(m[2])||1)/(m[3]===undefined?1:Number(m[3])||2);
    if(tupleCount){beats*=factor;tupleCount--}
    if(!(beats>0 && beats<=32) || ++events>4096)throw Error('Unsupported excerpt length.');
    const notes=(m[1].match(/[_=^]?[a-gA-G][,']*/g)||[]).map(readPitch);
    let positions=guitarVoicing(notes.map(n=>n.midi),anchor);
    if(bStringHint && notes.length===1){
      const fret=notes[0].midi-tuning[1];
      if(fret>=0 && fret<=24)positions=[{string:2,fret,finger:fret?null:0}];
    }
    let action=positions.length>1?'Pluck together':positions.length?'Pick':'Rest',from=null;
    if(tie){
      if(tie.midis.join(',')!==notes.map(n=>n.midi).join(','))throw Error('Tied pitches must match.');
      positions=tie.positions;action='Hold';
    }else if(slur && !slurStart && positions.length===1 && last?.positions.length===1){
      const prev=last.positions[0],fret=notes[0].midi-tuning[prev.string-1];
      if(fret>=0 && fret<=24){
        positions=[{string:prev.string,fret,finger:fret?null:0}];
        if(bStringHint && prev.string===2 && prev.fret===10 && fret===8){action='Slide';from=prev.fret}
        else action=fret<prev.fret?'Pull-off':fret>prev.fret?'Hammer-on':'Pick';
      }
    }
    // A source comment can specify a pull-off even when its slur ends early.
    if(!tie && pullOffHint && action==='Pick' && positions.length===1 && last?.positions.length===1){
      const prev=last.positions[0],next=positions[0];
      if(prev.string===next.string && prev.fret===Number(pullOffHint[1]) && next.fret===Number(pullOffHint[2]) && next.fret<prev.fret)action='Pull-off';
    }
    if(positions.length===1 && positions[0].fret)anchor=positions[0].fret;
    const e={positions,beats,action,from,names:notes.map(n=>n.label),midis:notes.map(n=>n.midi),sourceIndex:tie?tie.sourceIndex:ordinal++,continuation:!!tie,tempoRatio:activeTempo/Number(bpm[1])};
    last=e;bar.push(e);slurStart=false;tie=null;data=data.slice(m[0].length);
  }
  finishBar();
  if(!bars.length || tupleCount)throw Error('Incomplete excerpt.');
  const playbackOrder=hasNavigation?abcPlaybackOrder(marks.slice(0,bars.length)):null;
  if(hasNavigation && !playbackOrder)comments.push('Playback follows written bar order because the repeat sequence exceeds the playback limit.');
  if(tempoChanges.length)comments.push('Source tempo changes: '+tempoChanges.join(', ')+'. Playback scales these changes to your chosen BPM.');
  const title=titles[0],descriptor=titles.slice(1).join(' · ');
  const sourceBpm=Number(bpm[1]),startBpm=Math.min(80,Math.max(40,5*Math.round(sourceBpm*.65/5)));
  const intro=bars.flat().find(e=>e.positions.length);
  if(!intro)throw Error('This excerpt has no pitched notes.');
  const hasChords=bars.some(b=>b.some(e=>e.positions.length>1));
  const steps=[
    'Choose the first bar in Phrase. Listen once, then play along at '+startBpm+' BPM.',
    'Start on '+intro.names.join(' + ')+' at '+intro.positions.map(p=>stringNames[p.string-1]+' fret '+p.fret).join(', ')+'. Count any rests before you enter.',
    hasChords?'Notes joined by + sound together. Place each finger first, then pluck those strings together.':'Read the note names in order. Follow the tab for the string and fret, and leave silence for each rest.',
    'Play each bar twice cleanly. Connect two bars, then work toward the source tempo of '+sourceBpm+' BPM.'
  ];
  return {name:title,descriptor,sourceBpm,bpm:startBpm,meter,bars,labels,steps,comments,playbackOrder};
}

async function importAbcFiles(texts,replaceId=null){
  const songs=[];
  if(!Array.isArray(texts)||!texts.length||texts.length>32)throw Error('Choose 1–32 ABC files.');
  for(const text of texts){
    const parsed=compileAbc(text);
    const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
    const id='abc-'+Array.from(hash.slice(0,12),b=>b.toString(16).padStart(2,'0')).join('');
    songs.push({id,text,parsed});
  }
  if(replaceId && !songLessons.has(replaceId))throw Error('This lesson has already been removed.');
  if(replaceId && songs[0].id!==replaceId && songLessons.has(songs[0].id))throw Error('That song is already in your list. Choose a different ABC file.');
  commitSongLibrary(songs,replaceId===songs[0].id?null:replaceId);
  return songs.length;
}
function commitSongLibrary(songs,removeId){
  const previous=store.abcLibrary,previousSession=store.quickSession;
  const library={...previous};
  if(removeId)delete library[removeId];
  for(const song of songs)library[song.id]=song.text;
  store.abcLibrary=library;
  // A resumed session must always point to playable scores.
  if(removeId && previousSession){
    const fallback=p=>p?.lesson===removeId?{lesson:'song',level:0,phrase:'all',cursor:0,bpm:lessonById('song').bpm}:p;
    const plan=previousSession.plan.map(fallback);
    store.quickSession={...previousSession,plan,position:fallback(previousSession.position),
      review:plan[0]===previousSession.plan[0]?previousSession.review:null};
  }
  try{save()}catch(error){store.abcLibrary=previous;store.quickSession=previousSession;throw error}
  if(removeId){
    document.dispatchEvent(new CustomEvent('songwillunload',{detail:removeId}));
    songLessons.delete(removeId);delete scores[removeId];
  }
  songs.forEach(s=>registerAbc(s.id,s.parsed));
  refreshRiffPicker();$('lesson').value=active.id;render();
  document.dispatchEvent(new Event('songlibrarychange'));
}
function registerAbc(id,parsed){
  const {name,descriptor,sourceBpm,bpm,meter,bars,labels,steps,comments,playbackOrder}=parsed;
  const ex={id,name,duration:180,bpm,steps,goal:'Play each bar twice with the correct notes and rests, then connect the phrase.'};
  scores[id]={bars,labels,meter,sourceBpm,comments,playbackOrder,aim:descriptor||'Practice this song excerpt one bar at a time.',next:'Join the bars and gradually work toward '+sourceBpm+' BPM.'};
  songLessons.set(id,ex);
}
for(const [id,text] of Object.entries(store.abcLibrary||{})){
  if(!/^abc-[0-9a-f]{24}$/.test(id))continue;
  try{registerAbc(id,compileAbc(text))}catch{}
}
