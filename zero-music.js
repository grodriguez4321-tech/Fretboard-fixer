// A cell is one beat, except in the offbeat drill where it is an eighth note.
// A dash sustains the previous attack. String 1 is the thin E.
const zeroMusic=(()=>{
  const shapes={
    Em:{frets:[0,2,2,0,0,0],fingers:[0,1,2,0,0,0]},
    G:{frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]},
    D:{frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2]},
    C:{frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0]}
  };
  const placements={G:[3,0,0],A:[3,2,2],B:[2,0,0],D:[2,3,3],e:[1,0,0],F:[1,1,1],g:[1,3,3]};
  const tune=['B A G A','B B B -','A A A -','B D D -','B A G A','B B B B','A A B A','G - - -'];
  const harmony=['G','G','D','G','G','G','D','G'];
  const loop=['G','D','Em','C'];
  function melody(first=1,last=8){
    return {name:'Melody · '+(first===last?'bar '+first:'bars '+first+'–'+last),first,bars:tune.slice(first-1,last).map(row=>row.split(' '))};
  }
  function chords(name,names,twice=false){
    return {name,chords:true,bars:names.map(n=>[n,'-',twice?n:'-','-'])};
  }
  const changes=chords('Em to G · four starts',['Em','G','Em','G']);
  const progression=chords('Four-chord loop',loop);
  const backing=(last=8,twice=false)=>chords('Accompaniment · '+last+' bars · '+(twice?'beats 1 and 3':'beat 1'),harmony.slice(0,last),twice);
  const em=chords('Em · four bars',Array(4).fill('Em'));
  const gd=chords('G to D · eight bars',Array.from({length:8},(_,i)=>i%2?'D':'G'));
  const offbeat={name:'Down on the numbers, up after 4',chords:true,division:2,bars:Array.from({length:4},()=>['Em','-','Em','-','Em','-','Em','Em'])};
  const pulse={name:'Pick open G, then let it ring',bars:['G G G G','G G G G','G - - -','G - - -'].map(s=>s.split(' '))};
  const ear={name:'Hear the question and answer',bars:[['G','A','B','-'],['B','A','G','-']]};
  const versions=[
    [],[{name:'Open, 1, 3, 1, open',bars:[['e','F','g','F'],['e','-','-','-']]}],[pulse],[em],
    [melody(1,2)],[melody(1,2),em],[pulse,melody(1,2)],[changes],[changes,melody(1,2)],[gd],
    [melody(3,4),melody(2,3),melody(1,4)],[gd],[backing(4),melody(1,4)],[melody(1,4),backing(4)],
    [chords('Em and G on 1 and 3',['Em','G'],true),backing(4,true)],[chords('Build C',['C'])],
    [progression],[melody(6,7),melody(5,8),melody(4,5)],[offbeat],[ear,melody()],
    [progression,offbeat,melody(5,8),melody()],[backing(),backing(8,true)],
    [melody(),progression],[{name:'Short B, then ringing B',shortFirst:true,bars:[['B','B','B','B'],['B','B','B','B']]},melody(1,4)],
    [melody(5,8),progression,melody(3,8),melody()],[backing(),melody()],[backing(),backing(8,true),melody()],[progression,melody(),backing()]
  ];
  function positions(token,isChord){
    if(isChord)return shapes[token].frets.flatMap((f,i)=>f<0?[]:[{string:6-i,fret:f,finger:shapes[token].fingers[i]}]).reverse();
    const [string,fret,finger]=placements[token];return [{string,fret,finger}];
  }
  return {shapes,versions,positions};
})();
