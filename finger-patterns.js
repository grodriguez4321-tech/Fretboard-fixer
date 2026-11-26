// Each column is one beat or one eighth note. A group sounds together.
// Durations are measured in beats so the bass can ring across melody attacks.
const fingerPatterns=(()=>{
  const note=(string,fret=0,duration=.88,extra={})=>({string,fret,duration,...extra});
  const line=(name,cue,steps,division=1,bpm=50)=>({name,cue,steps,division,bpm});
  const basses=[6,5,4];
  function picking(reverse=false,skip=false){
    return line(reverse?'Reverse roll':skip?'Skip a string':'Forward PIMA','Rest P (thumb) over the bass, I (index) on G, M (middle) on B and A (ring) on thin e. Play one note per click. Aim for five clean cycles without looking.',basses.flatMap(s=>(reverse?[1,2,3,s]:skip?[s,2,3,1]:[s,3,2,1]).map(v=>[note(v)])));
  }
  function pinch(count,bass=6){
    return line(count+' strings together','Set the fingertips against their strings before releasing them together. Listen for a single attack. Count ten clean plucks, then move the thumb to the next bass string.',[[bass,...(count===2?[1]:count===3?[2,1]:[3,2,1])].map(s=>note(s))]);
  }
  function spider(order='1234',start=1){
    const out=[];
    for(const string of [6,5,4,3,2,1,1,2,3,4,5,6]){
      for(const f of order)out.push([note(string,start+Number(f)-1,.88,{left:f})]);
    }
    return line('Spider '+order,'Use fretting fingers 1 index, 2 middle, 3 ring, 4 pinky. Play across the strings and back. Shift the starting fret to 5 for a narrower reach.',out);
  }
  function thumb(level){
    const attacks=[[note(6,0,1)],[],[note(4,2,1)],[],[note(6,0,1)],[],[note(4,2,1)],[]];
    const melody=[[],[[0,0],[4,3]],[[1,0],[3,3],[5,0],[7,3]],[[0,0],[3,3],[5,0]]][level-1];
    melody.forEach(([i,f])=>attacks[i].push(note(1,f,.5)));
    return line('Thumb level '+level,['Alternate open thick E and D fret 2 on each click. Count 1 and 2 and 3 and 4 and.','Keep the same thumb pulse. Add thin e together with the bass on beats 1 and 3.','Play thin e halfway between the bass attacks. Say “and” with each melody note.','Add thin e on 1, the “and” after 2, and the “and” after 3. Keep all four bass attacks evenly spaced.'][level-1],attacks,2,45);
  }
  const sustain=line('Keep the bass ringing','Hold A fret 2 with your middle finger throughout. Use index for thin e fret 1 and pinky for fret 3. Listen for the low B underneath every change.',[[note(5,2,4)],[note(1) ],[],[note(1,1)],[],[note(1,3)],[],[note(1,1)]],2,45);
  const shapes={A:[-1,0,2,2,2,0],D:[-1,-1,0,2,3,2],E:[0,2,2,1,0,0],Am:[-1,0,2,2,1,0],Em:[0,2,2,0,0,0],C:[-1,3,2,0,1,0]};
  function chord(name){
    const shape=shapes[name],bass=6-shape.findIndex(f=>f>=0);
    return line(name+' chord roll','Build '+name+' ('+shape.map(f=>f<0?'x':f).join(' ')+', thick to thin). Skip x, leave 0 open. Hold the shape as you pick bass, G, B, thin e.',[bass,3,2,1].map(s=>[note(s,shape[6-s],1)]));
  }
  function changes(target){
    const a=chord('A'),b=chord(target);
    return line('A to '+target,'Roll A for four beats. Aim the thumb at the new bass string on the next beat 1, then roll '+target+'. Listen for an even gap at the change.',[...a.steps,...b.steps]);
  }
  function frets(name,cue,positions){
    return line(name,cue,positions.map(f=>[note(1,f)]));
  }
  function legato(type){
    const parts=type==='hammer'?[0,2,2,4]:type==='pull'?[2,0]:[3,5];
    const label={hammer:'Hammer-on',pull:'Pull-off',slide:'Slide'}[type];
    return line(label,{hammer:'Pick the first note of each pair on thin e. Bring a fretting fingertip down firmly on the second fret shown. Listen for both notes at similar volume.',pull:'Fret thin e at 2. Pick it once, then release with a small sideways motion to sound open e. Match the two notes in volume.',slide:'Pick thin e at fret 3. Keep the fingertip down and glide to fret 5. Listen for one attack and a connected change of pitch.'}[type],parts.map((f,i)=>[note(1,f,.88,{gesture:i%2?label:'Pick'})]));
  }
  const harmonic=line('Natural harmonics','Rest a fingertip directly above the indicated wire on thick E. Pluck with your thumb and lift the touching finger. Listen for a clear bell-like tone.',[12,7,5].map((f,i)=>[note(6,f,1,{ratio:[2,3,4][i],gesture:'Touch wire'})]));
  return {picking,pinch,spider,thumb,sustain,chord,changes,legato,harmonic,shapes,
    jumps:frets('Land on the fret','On thin e, lift and move the whole hand between frets. Land just behind the wire before picking. Repeat any jump that buzzes.',[3,5,7,9,7,5]),
    shift:frets('Shift position','Play each four-note group with fingers 1–4, then move the whole hand to the next starting fret.',[3,4,5,6,5,6,7,8,9,10,11,12]),
    balance:line('Bring out the melody','Pluck thin e with the ring finger and a softer bass with the thumb. Listen for the top line above the bass.',[0,1,3,1].map(f=>[note(6,0,.9,{volume:.055}),note(1,f,.9,{volume:.18})])),
    mute:line('Mute only the melody','Hold A fret 2 and let it ring for four beats. After each high note, lightly touch thin e with the picking finger to stop it. Keep the thumb clear of A.',[[note(5,2,4),note(1,0,.3)],[note(1,1,.3)],[note(1,3,.3)],[note(1,1,.3)]])};
})();
