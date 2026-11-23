// Course text from the supplied From Notes to Orchestration workbook.
const theoryWeeks = [
  {
    "title": "Give a rhythm a pulse",
    "goal": "Make a two-bar rhythm you can repeat and recognize after a pause.",
    "concept": "A beat is the pulse you tap your foot to. Rhythm is the pattern your hands or voice play against it. In 4/4, count four quarter-note beats per bar. A quarter note lasts one beat, a half note two, a whole note four. An eighth note lasts half a beat. A rest is measured silence.",
    "days": [
      {
        "title": "Find beat one",
        "task": "Set a metronome to 72 beats per minute (BPM). Count “1 2 3 4” aloud four times. Tap your leg on every beat and clap only on 1. Record four bars. Listen for four evenly spaced claps."
      },
      {
        "title": "Give silence a length",
        "task": "Count eight beats. In bar 1 clap on 1, 2 and 4. In bar 2 clap on 1 and 3. Speak through every silent beat. Repeat four times. Can you start bar 2 without waiting for your hand?"
      },
      {
        "title": "Split a beat",
        "task": "Say “1 and 2 and 3 and 4 and.” Clap on 1, the “and” after 2, and 4. Compare a second take with that middle clap on 3. Circle the one that feels more like leaning forward."
      },
      {
        "title": "Borrow speech",
        "task": "Say “leave the light on” naturally. Tap the stressed words with one hand while the other keeps time. Try two rhythms for the same four words. Keep the take that sounds like someone speaking."
      },
      {
        "title": "Write from memory",
        "task": "Create your own two-bar rhythm with one rest and one pair of eighth notes. Record it on a single pitch and put it away for five minutes. Tap it back from memory, then compare the recordings."
      }
    ],
    "check": "Can you count through the rest and return to beat 1 together with the click three times? If the return drifts, remove the eighth notes and add them back one beat at a time."
  },
  {
    "title": "Make three notes feel like a tune",
    "goal": "Write a four-bar tune with a recognizable beginning and a deliberate ending.",
    "concept": "Pitch tells you how high or low a sound is. On a keyboard, C is the white key immediately left of a group of two black keys. The white keys read C D E F G A B, then repeat. The number in C4 identifies the octave. A motif is a short idea you can recognize when it comes back.",
    "days": [
      {
        "title": "Find home",
        "task": "Play C, D and E in order, then sing them back on “la.” Hold C beneath them on a second track or sound it before each try. Sing E–D and pause. Then sing E–D–C. Describe the second ending in your own words."
      },
      {
        "title": "Hear the distance",
        "task": "An interval is the distance between two pitches. Play C–D (a second), C–E (a third) and C–G (a fifth). Count letter names including both ends. Sing each pair back within a comfortable octave."
      },
      {
        "title": "Give the rhythm pitches",
        "task": "Use yesterday’s C–D–E pitches with your week 1 rhythm. Make one version that rises and one that falls. Save both. Which version could introduce a question?"
      },
      {
        "title": "Write an answer",
        "task": "Write two bars with C, D and E, ending on D. Repeat the rhythm for two more bars and end on C. Sing all four bars. Leave enough space to breathe where the first idea ends."
      },
      {
        "title": "Test one variation",
        "task": "Record the four bars. Change only the highest note, then only the last rhythm in a separate take. Play the takes in mixed order. Write down what still tells you they belong together."
      }
    ],
    "check": "Sing bar 1 from memory and tap the final note’s length. If you remember only the pitches, speak the rhythm once and rerecord with clearer note lengths."
  },
  {
    "title": "Choose a key and build chords",
    "goal": "Make a four-bar accompaniment and explain why the last chord feels like an arrival.",
    "concept": "A scale is a set of notes arranged in order. A key gives one note a sense of home, the tonic. To build a triad within C major, start on a scale note, skip a note, take the next, skip and take one more. C–E–G gives you C major. A–C–E gives you A minor. You can enter the three notes together in a piano roll.",
    "days": [
      {
        "title": "Build a major scale",
        "task": "A half step is one guitar fret or one adjacent piano key, counting black keys. A whole step is two half steps. Start at C and move whole, whole, half, whole, whole, whole, half. Name the notes. Find the two places with no black key between neighbors."
      },
      {
        "title": "Hear two kinds of triad",
        "task": "Play C–E–G. Lower only E to E-flat and play again. The middle note changes a major third into a minor third. Try the same operation on A–C-sharp–E. Name both resulting minor chords."
      },
      {
        "title": "Make four chords",
        "task": "Enter one chord per bar. Use C (C–E–G), Am (A–C–E), F (F–A–C) and G (G–B–D). Hold each for four beats. Play just the lowest note of each chord, then restore the others."
      },
      {
        "title": "Hear a cadence",
        "task": "A cadence is a phrase ending shaped by harmony or melody. Play C–F–G–G and stop. Next play C–F–G–C. Sing B over the last G and let it rise to C when C arrives. Describe where you would put a full stop."
      },
      {
        "title": "Put a tune on top",
        "task": "Choose one of your four-bar tunes. Try it over C–Am–G–C. Where a note rubs, hold it and listen before changing it. Try moving the melody by one scale step or changing the chord. Save the ending you prefer."
      }
    ],
    "check": "Name the three notes of Am without looking. Play both endings and identify the one you would use to close the piece. If the chord changes are hard to hear, compare only their bass notes."
  },
  {
    "title": "Finish a miniature",
    "goal": "Turn a four-bar idea into a complete eight-bar piece with a beginning, answer and ending.",
    "concept": "A phrase is a musical thought you can sing in one gesture. A pair of phrases can share an opening and have different endings. A chord tone belongs to the current chord. A passing tone moves by step between two more stable notes. Over C, try E–F–G and hear how F connects the other two.",
    "days": [
      {
        "title": "Find the stable notes",
        "task": "Over C, sing E, F, G, holding each in turn. Play Am and repeat. Write the shared chord tones of C and Am. Keep one common tone sounding as the harmony changes underneath."
      },
      {
        "title": "Build a question",
        "task": "Write four bars over C–Am–F–G. Use your week 2 motif twice. Land on D above G in bar 4 and leave room for an answer. Record with one chord per bar."
      },
      {
        "title": "Build an answer",
        "task": "Write four bars over Am–F–G–C. Repeat the opening rhythm from the question. Move the ending toward C. Sing the whole eight bars without a backing track."
      },
      {
        "title": "Smooth a chord change",
        "task": "Voice leading is the path each note takes into the next chord. Play C4–E4–G4 then C4–E4–A4. Only G moves. Play A3 beneath the second shape to hear Am clearly. Find a similarly small move from Am to F."
      },
      {
        "title": "Finish and name it",
        "task": "Choose a tempo, give the piece a title and record one complete pass. Listen to the first pass of “Leave the Light On.” Hum its opening, then hum yours. Name one rhythmic choice that makes yours distinct."
      }
    ],
    "check": "You have an eight-bar recording with two identifiable phrase endings. If it still loops indefinitely, try making the last note twice as long and stopping the accompaniment with it."
  },
  {
    "title": "Write a lyric that sings",
    "goal": "Write a verse and a chorus around one point of view, with a title you can sing back.",
    "concept": "Prosody is the fit between language and music. A stressed syllable can draw attention through pitch, length, placement or volume. Start by speaking: “I LEFT the porch light ON.” Put “the” on the highest, longest note, then try “light” there. Listen for which version tells the story you meant.",
    "days": [
      {
        "title": "Pick the scene",
        "task": "Write who is speaking, who they address and what changes. Example: someone leaves a light burning for a brother who said he would never return. List five details the speaker could see or hear. Choose one as the verse opening."
      },
      {
        "title": "Write a hook",
        "task": "A hook is a memorable phrase of words, music or both. Write three titles of two to six syllables. Speak each over a pulse. Sing the strongest title three ways. Record a version you can recall after a minute."
      },
      {
        "title": "Set one line",
        "task": "Write a line of six to ten syllables. Underline the words that carry meaning. Speak it, clap it, then sing on three pitches. Keep the stressed syllable of any multisyllable word intelligible. Record two placements of the strongest word."
      },
      {
        "title": "Draft the verse",
        "task": "Write four short lines that describe one moment. Sing each over two bars, leaving one breath between lines where needed. Trade a generic feeling word for a visible action. Compare “I’m lonely” with “I set two plates.”"
      },
      {
        "title": "Draft the chorus",
        "task": "Write two to four lines that state what the moment means to the speaker. Put the title at the start or end. Sing verse and chorus into a voice memo. For an instrumental song, substitute two contrasting themes and label the feeling each expresses."
      }
    ],
    "check": "Read the verse aloud and sing it at the same conversational pace. If a line crowds the breath, cut a word or start it earlier. You should be able to recall the chorus title and its rhythm the next day."
  },
  {
    "title": "Give the chorus a reason to arrive",
    "goal": "Build an eight-bar verse and an eight-bar chorus that a listener can tell apart.",
    "concept": "A verse can advance the scene while a returning chorus carries its central thought. Contrast can come from register (how high or low), note length, rhythm or harmony. A higher chorus is one option. A low, suddenly quiet chorus can be just as decisive.",
    "days": [
      {
        "title": "Map a song by ear",
        "task": "Choose a song you know. Note the time of its first verse, first chorus and return of an earlier idea. Hum the first two beats of each section. Describe the first audible change, such as longer vowels or a bass entrance."
      },
      {
        "title": "Shape the verse",
        "task": "Set your four verse lines over eight bars. Limit the first phrase to three pitches, then allow one new pitch in line 2. Leave one short rest before the chorus. Record just melody and pulse."
      },
      {
        "title": "Shape the chorus",
        "task": "Write a different eight-bar melody around the title. Try one version with longer notes and another with shorter repeated notes. Use the same tempo and accompaniment so you can hear the effect of rhythm alone."
      },
      {
        "title": "Set the handoff",
        "task": "Join the last two verse bars to the first two chorus bars. Try a one-beat gap before the title, then try the title starting just before beat 1 (a pickup). Choose the version that makes the lyric sound intentional."
      },
      {
        "title": "Check the form blind",
        "task": "Record verse and chorus on the same sound at the same level. Start playback in the middle of a section and identify it by ear. If you need to see the timeline, change one feature of the chorus and repeat."
      }
    ],
    "check": "Keep a sixteen-bar demo with a marked chorus entrance. Name two differences you can hear, one of which survives when sung without chords."
  },
  {
    "title": "Make harmony tell the story",
    "goal": "Make two harmonizations of the same line, then write a short bridge that earns the return.",
    "concept": "Scale degrees number the notes of a key from its tonic. In C, C is 1 and G is 5. Roman numerals label chords by root and quality. C, F, G and Am become I, IV, V and vi. Uppercase means major here, lowercase minor. These labels let you keep the harmonic relationship when you change key.",
    "days": [
      {
        "title": "Move a progression",
        "task": "Play I–vi–IV–V in C using week 3. Move it to G major (G A B C D E F-sharp). Build the four chords by skipping alternate scale notes. Check your answer on the reference page."
      },
      {
        "title": "Change what a note means",
        "task": "Record or hold E4 over a bar of C, then Am, then F. E is the third of C, fifth of Am and major seventh above F. Write one line of lyric and test where the F chord makes a word feel especially exposed."
      },
      {
        "title": "Choose harmonic pace",
        "task": "Harmonic rhythm is how often chords change. Keep the melody fixed. Try one chord every two bars in the verse, then one per bar in the chorus. Reverse the rates. Decide which treatment better serves the words."
      },
      {
        "title": "Find a minor center",
        "task": "Play Am–Dm–Em–Am (Dm is D–F–A and Em is E–G–B). Try E major in place of Em. Its G-sharp moves up a half step to A. Sing G-sharp–A over the last two chords and save the version you prefer."
      },
      {
        "title": "Draft a bridge",
        "task": "A bridge gives a new perspective before a familiar section returns. Write four bars beginning on Am or Dm and one line revealing something the speaker withheld. End where the first chorus note feels convincing. Record bridge into chorus."
      }
    ],
    "check": "Save both harmonizations and a four-bar bridge. Sing the chorus entrance immediately after the bridge. If it feels disconnected, use a shared note across the boundary or echo the hook rhythm on the way in."
  },
  {
    "title": "Finish the whole song in one sound",
    "goal": "Record a beginning-to-end song that works with just a lead and one accompaniment.",
    "concept": "A lead sheet captures the melody, chords and lyrics so the song can be performed again. For this course a bar-by-bar grid plus a voice memo works too. A second verse gives the chorus new meaning when it comes back. Change what the speaker learns, sees or decides.",
    "days": [
      {
        "title": "Map the whole form",
        "task": "Use this 48-bar plan or adapt it: intro 4, verse 1 8, chorus 8, verse 2 8, chorus 8, bridge 4, final chorus 8. At 80 BPM in 4/4 this lasts 2:24. Mark the first bar of every section before adding detail."
      },
      {
        "title": "Write verse two",
        "task": "Give verse 2 a new action or consequence. Keep verse 1’s rhythm and high points at first. Sing the new words and alter the few notes needed for natural stress. Compare the first line of each verse."
      },
      {
        "title": "Write the edges",
        "task": "Build the intro from part of your hook. Try two endings for the last chorus: stop together on the title or leave two beats of accompaniment after it. Keep the one that matches the speaker’s final decision."
      },
      {
        "title": "Make a usable chart",
        "task": "For each section record the first bar number, chords, words and melody. Write note names with beat lengths, use staff notation, or attach a clearly labeled melody recording. Check the chart from the bridge forward without replaying the opening."
      },
      {
        "title": "Record the bare song",
        "task": "Run from the intro to the last release with just voice or lead instrument and piano or guitar. Listen once without touching the controls. Mark one place attention drops and revise only that passage. Export the new pass."
      }
    ],
    "check": "Keep a complete rough demo and matching chart. You can start at verse 2 or the bridge without guessing the notes. If the arc still feels flat, change a lyric, a rhythm or an ending before adding the ensemble."
  },
  {
    "title": "Hear what each instrument can carry",
    "goal": "Score the chorus for a small ensemble, assigning a musical job to every entrance.",
    "concept": "Orchestration assigns musical material to instruments, registers, articulations and dynamics. Timbre is the character that makes a flute and violin sound different at the same pitch. Begin with a lead, bass and one inner part. Keep your full-song demo from week 8 for comparison.",
    "days": [
      {
        "title": "Audition the families",
        "task": "Using the instrument guide on the reference page, hear a bowed cello, flute, horn and a percussion instrument. For each, note how the sound starts, how long it lasts and whether it can swell after the attack. Pick two to support the singer."
      },
      {
        "title": "Write a bass line",
        "task": "Give cello one low chord root per bar for eight bars. Try C3, A2, F2 and G2 for C, Am, F and G. Shorten the last root before the title. Listen with voice and bass alone and check that each entrance supports the pulse."
      },
      {
        "title": "Assign an inner voice",
        "task": "An inner voice sits between bass and tune. Give viola one sustained chord tone per bar. Try A3 on F and G3 on G. Keep common tones where possible. Solo viola and hum the line as if someone had written it to be heard."
      },
      {
        "title": "Pass the tune",
        "task": "Give the first two bars of the chorus melody to a guiding piano or singer. Give its next two to violin in the same octave if comfortably playable. Compare with violin an octave higher. Pick the handoff that keeps the tune easy to follow."
      },
      {
        "title": "Make a seating plan on paper",
        "task": "Draw eight columns for bars. In each, label who carries tune, bass and harmony, and mark rests. Record the trio. Mute each supporting part for a pass and write what disappears. Remove any entrance you cannot explain musically."
      }
    ],
    "check": "You can name the job and active bars of each part. If the singer disappears, shorten or relocate the supporting line that overlaps the important syllable."
  },
  {
    "title": "Write parts a player could phrase",
    "goal": "Turn sustained keyboard lines into playable parts with breaths, bow changes and clear releases.",
    "concept": "Articulation describes how a note begins, connects and ends. Legato connects a line, staccato shortens it, and pizzicato asks a string player to pluck. Dynamics such as p (soft), mf (moderately strong) and f (loud) describe musical intent. A crescendo gradually grows in volume.",
    "days": [
      {
        "title": "Shape the strings",
        "task": "Give cello a two-bar line. Make one version sustained with a gentle swell and one with plucked, separated notes. Keep the pitches and tempo identical. Choose one for the verse and explain what happens to the groove."
      },
      {
        "title": "Write a wind answer",
        "task": "Sing your chorus and circle each vocal gap. Write a two- or three-note flute response in one gap. Sing the response in a single breath. Mark its release before the next important word. Compare with the same notes under that word."
      },
      {
        "title": "Space the chord",
        "task": "Play C2–E2–G2 together. Then spread the same pitch classes across cello C2, viola G3 and violin E4. Compare the clarity of the bass attack. Move the lowest note up an octave as a third test. Save the spacing you prefer."
      },
      {
        "title": "Check a transposing part",
        "task": "Concert pitch means the pitch you hear. A horn in F sounds a perfect fifth below its written note. For sounding C4 a horn player reads G4. Keep your mockup at sounding pitch. For player parts, check the instrument setting and verify one note both ways."
      },
      {
        "title": "Mark a playable phrase",
        "task": "For each line mark entrances, rests, dynamic shape and articulation. Check its lowest and highest sounding pitches against an instrument reference. Listen to a player in a similar register. Shorten any wind phrase you cannot comfortably sing in one breath as a first pass."
      }
    ],
    "check": "Keep eight scored bars and a one-line note for each player. If a line only works as a continuous keyboard chord, split the chord among players and audition the individual lines."
  },
  {
    "title": "Orchestrate the full form",
    "goal": "Extend the chorus scoring across the song and make one return feel earned.",
    "concept": "Texture is what the parts do together. Doubling puts the same line in two instruments, often in unison or octaves. A countermelody is an independent line. Doubling can strengthen an entrance. A countermelody attracts its own attention, so choose which line the listener should follow.",
    "days": [
      {
        "title": "Draw an entrance map",
        "task": "Make one row per instrument and one column per section. Fill cells with a job or a rest. Choose the most intimate moment and the peak. Reserve one timbre, register or rhythm for that peak."
      },
      {
        "title": "Score verse and refrain",
        "task": "Try the verse with voice and plucked cello, then let sustained viola enter at the chorus. Hold the output level roughly even. Can you hear the change on the first chorus beat? Adjust the entrance or note length until it registers."
      },
      {
        "title": "Use brass and percussion",
        "task": "Try a single sustained horn tone on the last chorus arrival and a soft cymbal swell that ends there. Listen to horn alone, swell alone and both. Keep either, both or neither. Leave room for the first consonant of the title."
      },
      {
        "title": "Write the second return",
        "task": "In verse 2, trade one answering line between flute and viola. Let the bridge lose its bass for two bars, then bring it back. In the final chorus try doubling only the hook in octaves. Compare the first chorus with the last."
      },
      {
        "title": "Hear the transitions",
        "task": "Play two bars on either side of every section boundary. Check the last note of the old section against the first word of the new one. Trim a release, add a pickup or leave an empty beat where the boundary feels accidental."
      }
    ],
    "check": "Export a full ensemble draft. With your eyes closed, mark the instant of the climax and identify what caused it. If every section feels equally full, remove a family from the section before the peak and compare again."
  },
  {
    "title": "Revise and deliver the song",
    "goal": "Finish a playable song, a listenable ensemble demo and a map another musician could follow.",
    "concept": "Revision works best when you can name the musical problem. “I lose the word ‘home’ at the first chorus” suggests a test. “The mix feels wrong” gives you little to act on. Keep the bare song and the full arrangement available at comparable listening levels.",
    "days": [
      {
        "title": "Check the writing",
        "task": "Listen to the week 8 demo, then your current draft. Hum the hook from memory. Identify the lyric or melodic gesture that changes meaning by its final return. Rewrite one weak line and check that verse 2 still sings easily."
      },
      {
        "title": "Check the orchestration",
        "task": "Listen quietly and mark any lost words or lead notes. Solo the competing part. Try changing its register, rhythm or release. Restore the ensemble and compare before changing volume. Keep one change you can identify by ear."
      },
      {
        "title": "Shape the performance",
        "task": "In a DAW (digital audio workstation), vary the strength of repeated attacks and draw one phrase-level swell on a sustained part if your sound supports it. With live overdubs, play the swell. Leave space between phrases. Compare at the same playback level."
      },
      {
        "title": "Prepare the handoff",
        "task": "Export a full audio mix and a melody-with-accompaniment version. Make a chart with key, tempo, meter, section names, chords and melody or guide recording. Add an instrument list and important entrances. Listen to the first and last five seconds of each export."
      },
      {
        "title": "Run a final listening test",
        "task": "Use the rubric at the back. Ask a listener where the chorus begins and which instrument answers the voice, or mark both yourself without looking at the timeline. Fix the lowest-scoring item and put a date on the final version."
      }
    ],
    "check": "Keep the complete audio, bare demo and chart together. You can point to one harmonic decision, one lyric or melodic revision and one orchestral choice, then play the exact bars where each matters."
  }
];
