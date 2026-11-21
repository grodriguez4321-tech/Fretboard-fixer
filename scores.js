// String 1 is high E. Durations are measured in quarter-note beats.
const tuning = [64, 59, 55, 50, 45, 40];
const stringNames = ['high E', 'B', 'G', 'D', 'A', 'low E'];
const fingerNames = ['Open', 'Index', 'Middle', 'Ring', 'Pinky'];
const pitches = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
function pitchAt(string, fret) {
  const midi = tuning[string - 1] + fret;
  return {name: pitches[midi % 12], octave: Math.floor(midi / 12) - 1,
    hz: 440 * 2 ** ((midi - 69) / 12)};
}
function note(string, fret, finger, beats = 1, action = 'Pick', from = null) {
  return {positions: [{string, fret, finger}], beats, action, from};
}
const rest = (beats = 1) => ({positions: [], beats, action: 'Rest'});
const shapes = {
  Em: [[1,0,0],[2,0,0],[3,0,0],[4,2,3],[5,2,2],[6,0,0]],
  Am: [[1,0,0],[2,1,1],[3,2,3],[4,2,2],[5,0,0]],
  C: [[1,0,0],[2,1,1],[3,0,0],[4,2,2],[5,3,3]]
};
function chord(name) {
  return {positions: shapes[name].map(([string,fret,finger]) => ({string,fret,finger})),
    beats: 4, action: 'Strum', chord: name};
}
const scaleBar = (string, frets) => frets.map(fret => note(string,fret,fret-4));
const pickingBar = () => [5,7,8,7].map((f,i) => note(1,f,f-4,1,i%2 ? 'Upstroke' : 'Downstroke'));
const mutedBar = () => Array.from({length:8}, (_,i) => ({
  action: i%2 ? 'Muted up' : 'Muted down', beats:.5, positions:[]
}));
const scores = {
  chromatic: {
    aim:'Coordinate four fingertips with alternating pick strokes.',
    next:'Move the pattern to G. Keep the same tempo until both directions sound even.',
    labels:['High E · ascend','High E · descend','B · ascend','B · descend'],
    bars:[scaleBar(1,[5,6,7,8]),scaleBar(1,[8,7,6,5]),scaleBar(2,[5,6,7,8]),scaleBar(2,[8,7,6,5])]
  },
  emam:{aim:'Change chord shapes without interrupting the pulse.',next:'Strum each beat, then add upstrokes between beats.',
    labels:['E minor','A minor'],bars:[[chord('Em')],[chord('Am')]]},
  amc:{aim:'Keep two fingers anchored as the ring finger changes strings.',next:'Shorten each chord to two beats once eight changes feel easy.',
    labels:['A minor','C major'],bars:[[chord('Am')],[chord('C')]]},
  strum:{aim:'Place each upstroke halfway between clicks.',next:'Keep the same wrist motion while fretting Em.',
    labels:['Muted strums'],bars:[mutedBar()]},
  alternate:{aim:'Match each pick stroke to the moment the fret sounds clean.',next:'Repeat the figure on B, then alternate strings between bars.',
    labels:['First pass','Second pass'],bars:[pickingBar(),pickingBar()]},
  legato:{aim:'Sound three clear pitches with a single pick stroke.',next:'Move the pattern to B and compare the volume of the three notes.',
    labels:['Hammer and release','Repeat'],bars:Array.from({length:2},()=>[note(1,5,1),note(1,7,3,1,'Hammer-on'),note(1,5,1,2,'Pull-off')])},
  slides:{aim:'Land on the target pitch while one finger stays in contact.',next:'Slide from fret 5 to 8 and return with the same finger.',
    labels:['Slide up','Slide down'],bars:[[note(1,5,1),note(1,7,1,3,'Slide',5)],[note(1,7,1),note(1,5,1,3,'Slide',7)]]},
  findnotes:{aim:'Recognize the same note name on different strings.',next:'Hide note names and locate five different notes before checking.',
    labels:['Two unisons','One octave lower'],bars:[[note(1,5,1,2),note(2,10,1,2)],[note(3,2,1,2),rest(2)]]},
  ear:{aim:'Identify the direction of a pitch change by ear.',next:'Try the blind listening quiz with your eyes closed.',
    labels:['Ascending pair','Descending pair'],bars:[[note(1,5,1,2),note(1,7,3,2)],[note(1,7,3,2),note(1,5,1,2)]]},
  song:{aim:'Learn a short passage one measure at a time. This original demo ends with a half-step bend.',
    next:'Connect the two bars for five clean repeats, then raise the tempo by 5 BPM.',
    labels:['Question','Answer'],bars:[[note(2,5,1),note(2,7,3),note(1,5,1),rest()],[note(2,7,3,2,'Half-step bend'),note(2,5,1,2)]]},
  stretch:{aim:'Reach nearby frets by moving the whole hand between positions.',next:'Move the entire pattern one fret higher and keep the hand relaxed.',
    labels:['Fifth position','Seventh position'],bars:[[note(1,5,1,2),note(1,8,4,2)],[note(1,7,1,2),note(1,10,4,2)]]}
};

// Each chromatic level changes the musical task at the same reference tempo.
const chromaticLevels = [
  {name:'Beginner', score:scores.chromatic},
  {name:'Developing', strings:[1,2], fingers:[1,2,3,4,4,3,2,1],
    setup:'Play frets 5–6–7–8–8–7–6–5 on high E, then on B. Keep one finger per fret and play two notes per click.'},
  {name:'Intermediate', strings:[2,1], fingers:[1,3,2,4,4,2,3,1],
    setup:'Play frets 5–7–6–8–8–6–7–5 on B, then high E. Use index, ring, middle, pinky on the way up. Play two notes per click.'},
  {name:'Advanced', strings:[1,3], fingers:[1,3,2,4,4,2,3,1], crossing:true,
    setup:'Alternate between high E and G on every note. Play frets 5–7–6–8–8–6–7–5, then start the same figure on G. Keep alternate picking through each string skip.'}
];
for(const level of chromaticLevels.slice(1)){
  level.score={...scores.chromatic, aim:level.setup,
    labels:level.strings.map(s=>(level.crossing?'Start on ':'')+stringNames[s-1]),
    bars:level.strings.map((s,bar)=>level.fingers.map((finger,i)=>{
      const string=level.crossing && i%2 ? level.strings[1-bar] : s;
      return note(string,4+finger,finger,.5,i%2?'Upstroke':'Downstroke');
    }))};
}
