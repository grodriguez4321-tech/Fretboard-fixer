// Saved riffs use the same beat and string numbering as the built-in scores.
const riffLessons = new Map();
const lessonById = id => riffLessons.get(id) || all.find(ex => ex.id === id);
const riffLengths = [.5, 1, 2, 4];
if (!Array.isArray(store.riffs)) store.riffs = [];

function validRiffEvent(e) {
  return e && riffLengths.includes(e.beats) && (e.string===0 ||
    (Number.isInteger(e.string) && e.string>=1 && e.string<=6 &&
     Number.isInteger(e.fret) && e.fret>=0 && e.fret<=24 &&
     (e.finger==null || [0,1,2,3,4].includes(e.finger))));
}

function compileRiff(events) {
  // Split long notes at a bar line for isolation. Link both segments so a
  // continuous pass sounds the note only once.
  const bars=[];
  let beat=0;
  for (const [sourceIndex,e] of events.entries()) {
    let left=e.beats;
    while(left>0) {
      if(beat===0) bars.push([]);
      const length=Math.min(4-beat,left);
      const item=e.string ? note(e.string,e.fret,e.fret===0?0:e.finger,length) : rest(length);
      bars.at(-1).push({...item,sourceIndex,continuation:left!==e.beats});
      beat=(beat+length)%4;
      left-=length;
    }
  }
  return bars;
}

function registerRiff(riff) {
  if (!riff || !/^riff-[\w-]+$/.test(riff.id) || typeof riff.name!=='string' ||
    !Array.isArray(riff.events) || !riff.events.length || riff.events.length>128 ||
    !riff.events.every(validRiffEvent)) return;
  const bars=compileRiff(riff.events);
  const lesson={id:riff.id,name:riff.name,duration:120,bpm:riff.bpm || 60,
    goal:'Play the phrase twice with clear notes and steady timing.',
    steps:['Listen to the riff once and find the starting string and fret.',
      'Play along at a comfortable tempo. Use the tricky-change looper around any hesitation.',
      'Turn off Notes and play the phrase with the click.']};
  scores[riff.id]={bars,labels:bars.map((_,i)=>'Measure '+(i+1)),aim:'Practice your saved riff one phrase at a time.',
    next:'Expand a clean loop by one note on each side, then connect the full riff.'};
  riffLessons.set(riff.id,lesson);
  return lesson;
}
store.riffs.forEach(registerRiff);

function noteRange(value) {
  const m=/^notes-(\d+)-(\d+)$/.exec(value);
  return m ? [Number(m[1]),Number(m[2])] : null;
}
function phraseName(value) {
  const bounds=noteRange(value);
  if(bounds) return 'notes '+(bounds[0]+1)+'–'+(bounds[1]+1);
  return value==='all' ? 'full phrase' : 'bar '+(Number(value)+1);
}
function selectPhrase(value) {
  if(noteRange(value)) {
    let option=$('phrase').querySelector('[data-range]');
    if(!option){option=new Option();option.dataset.range='true';$('phrase').add(option)}
    option.value=value;option.textContent=phraseName(value);
  }
  $('phrase').value=value;
}
