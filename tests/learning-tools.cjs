module.exports=async function(page,assert,choose,nav){
  const box=page.locator('#labDialog'),button=(name)=>box.getByRole('button',{name,exact:true});
  async function open(name){
    if(await box.isVisible())await page.click('#labBack');else await page.click('#exerciseTools');
    if(!['Alternate fingerings','Song-section map'].includes(name))await box.locator('.more-tools summary').click();
    await box.getByRole('button',{name:new RegExp('^'+name)}).click();
  }
  const close=()=>page.click('#labClose');
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:844});
    for(const name of ['Alternate fingerings','Acoustic note check','Song-section map','Rhythm trainer','Melody by ear','Chord and melody playground']){
      await open(name);
      const graph=box.locator('#labBody > .tool-visual svg');
      assert.ok(await graph.isVisible(),name+' diagram');
      if(name==='Alternate fingerings' || name==='Song-section map'){
        const size=await box.locator('.touch-fret').first().boundingBox();
        assert.ok(size.width>=44 && size.height>=44,name+' tap target at '+width);
      }
      assert.ok((await graph.getAttribute('aria-label')).length>4);
      assert.ok(await box.evaluate(d=>d.scrollWidth<=d.clientWidth+1),name+' width '+width);
    }
    await close();
  }
  await open('Alternate fingerings');
  const cell=(string,fret)=>box.locator('.touch-fret[data-string="'+string+'"][data-fret="'+fret+'"]');
  await cell(6,0).click();assert.equal(await box.locator('h3').innerText(),'E2');
  await button('Frets 21 to 24').click();await cell(1,24).click();
  assert.equal(await box.locator('h3').innerText(),'E6');
  await button('Frets 9 to 12').click();await cell(2,10).click();
  assert.ok(await button('high E string · fret 5').isVisible());
  await button('high E string · fret 5').click();
  assert.equal(await box.locator('svg').getAttribute('aria-label'),'high E string · fret 5');
  await button('Two notes').click();await button('Frets 1 to 4').click();await cell(1,3).click();
  assert.match(await box.locator('h3').innerText(),/A4 \+ G4/);
  assert.ok(await box.getByRole('button',{name:/span/}).count()>0);
  await close();

  await choose('chromatic');
  await open('Acoustic note check');
  const detection=await page.evaluate(()=>{
    const results=[];
    for(const rate of [44100,48000])for(const hz of [82.4,110,220,440,659,1318]){
      const data=Float32Array.from({length:4096},(_,i)=>.25*Math.exp(-i/rate*4)*(.6*Math.sin(i*2*Math.PI*hz/rate)+Math.sin(i*4*Math.PI*hz/rate)));
      results.push(Math.abs(1200*Math.log2(estimateGuitarHz(data,rate)/hz)));
    }
    let seed=1;
    const noise=Float32Array.from({length:4096},()=>{seed=(seed*16807)%2147483647;return seed/2147483647-.5});
    return [Math.max(...results),estimateGuitarHz(new Float32Array(4096),48000),estimateGuitarHz(noise,48000)];
  });
  assert.ok(detection[0]<15);assert.deepEqual(detection.slice(1),[null,null]);
  await page.evaluate(()=>{
    window.fakeMic={deny:true,hz:0,stops:0};
    const track={stop(){fakeMic.stops++},addEventListener(){}};
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{
      if(fakeMic.deny)throw new DOMException('Declined','NotAllowedError');
      return {getTracks:()=>[track],getAudioTracks:()=>[track]};
    }}});
  });
  await button('Start microphone').click();await box.getByText(/permission was declined/).waitFor();
  await page.evaluate(()=>{
    fakeMic.deny=false;
    audio.createMediaStreamSource=()=>({connect(){},disconnect(){}});
    audio.createAnalyser=()=>({disconnect(){},getFloatTimeDomainData(data){
      for(let i=0;i<data.length;i++)data[i]=.3*Math.sin(2*Math.PI*fakeMic.hz*i/audio.sampleRate);
    }});
    fakeMic.hz=110;
  });
  await button('Start microphone').click();await box.getByText(/Heard A2/).waitFor();
  assert.match(await box.locator('svg').getAttribute('aria-label'),/A2 at/);
  assert.equal(await page.evaluate(()=>cursor),0);
  await page.evaluate(()=>{const p=sequence[0].positions[0];fakeMic.hz=pitchAt(p.string,p.fret).hz});
  await page.waitForFunction(()=>cursor===1);await page.waitForTimeout(220);
  assert.equal(await page.evaluate(()=>cursor),1);
  await close();await page.waitForFunction(()=>fakeMic.stops===1);

  await open('Rhythm trainer');
  const timing=await page.evaluate(()=>scoreTaps([0,.5,1,1.5],[.015,.46,1.49,2.1],.5));
  assert.deepEqual(timing,{offsets:[15,-40,-10],missed:1,extra:1});
  await box.getByLabel('Tempo').selectOption('120');await box.getByLabel('Test click').selectOption('gap');
  await button('Start tap test').click();await box.getByText(/Your turn/).waitFor();
  await button('Tap here').click();await box.getByText(/hits matched/).waitFor();
  assert.match(await box.locator('svg').getAttribute('aria-label'),/1 tap recorded/);

  await open('Melody by ear');
  await page.evaluate(()=>{window.realRandom=Math.random;Math.random=()=>0});
  await button('New phrase').click();await page.evaluate(()=>Math.random=window.realRandom);
  assert.equal(await box.locator('svg text').allTextContents().then(values=>values.filter(v=>v==='?').length),3);
  await button('Reveal next note').click();await box.getByText(/Note 1 · B string · fret 5/).waitFor();
  for(const fret of [8,5,7,5])await button('B string · fret '+fret).click();
  await box.getByText('Complete · 1 hints · 1 retries').waitFor();

  await open('Chord and melody playground');await button('C4').click();await button('E4').click();
  await button('Compare melody').click();await box.getByText('Same melody over Am').waitFor();
  assert.match(await box.locator('svg').getAttribute('aria-label'),/Playing Am/);
  await box.getByText('Same melody over C',{exact:true}).waitFor();await button('Stop sound').click();
  await open('Song-section map');await box.getByLabel('Song or saved riff').selectOption('song');
  await button('Bar 2').click();
  assert.match(await box.locator('svg').getAttribute('aria-label'),/Notes 5 through/);
  async function saveSection(name){
    await box.getByLabel('Section name').fill(name);await box.getByLabel('Practice BPM').selectOption('65');
    await button('Save section').click();
  }
  await button('Bar 1').click();await cell(2,5).click();
  await box.locator('.note-occurrences').getByRole('button',{name:/Bar 1 · Note 1/}).click();
  await cell(2,7).click();await box.locator('.note-occurrences').getByRole('button',{name:/Bar 1 · Note 2/}).click();
  await saveSection('Intro');
  await box.getByRole('button',{name:/^Start ·/}).click();await button('Choose rest').click();
  await cell(2,7).click();await box.locator('.note-occurrences').getByRole('button',{name:/Bar 2 · Note 5/}).click();
  await saveSection('Answer');
  await button('Practice Intro').click();assert.equal(await page.locator('#phrase').inputValue(),'notes-0-1');
  await page.click('#saveBest');await open('Song-section map');await box.getByText(/clean best 65 BPM/).waitFor();
  await button('Intro into Answer').click();assert.deepEqual(await page.evaluate(()=>sequence.map(n=>n.sourceIndex)),[1,3]);
  const savedLessonURL=page.url();await page.goto('about:blank');await page.goto(savedLessonURL);
  await open('Song-section map');assert.ok(await button('Intro into Answer').isVisible());await close();

  await nav('Practice');await page.click('#quickStart');await page.locator('#recallDialog[open]').waitFor();
  await page.click('#closeRecall');await page.click('#quickNext');
  assert.match(await page.locator('#phrase').inputValue(),/^notes-/);
  await page.click('#step');await page.waitForTimeout(1100);await page.click('#quickPause');
  const saved=await page.evaluate(()=>JSON.parse(JSON.stringify(store.quickSession)));
  assert.ok(saved.remaining<120 && saved.remaining>112);
  assert.equal(saved.position.cursor,1);
  const done=await page.evaluate(()=>JSON.stringify(store.done));
  await page.reload();await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>store.quickSession.remaining),saved.remaining);
  await nav('Practice');await page.click('#quickStart');
  assert.deepEqual(await page.evaluate(()=>practiceSnapshot()),saved.position);
  await page.click('#quickNext');assert.match(await page.locator('#quickTitle').innerText(),/Play music/);
  await page.click('#quickNext');assert.ok(await page.locator('#quickPanel').isHidden());
  assert.equal(await page.evaluate(()=>JSON.stringify(store.done)),done);
  console.log('PASS microphone pitch, permission, track cleanup, fingerings, rhythm scoring, melody recall, chord comparison, section joins, saved tempo and session resume.');
};
