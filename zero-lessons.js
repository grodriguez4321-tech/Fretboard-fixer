// Lesson wording from the Guitar from Zero curriculum.
const zeroLessons = [
  {
    "title": "Hold, tune, and make a sound",
    "body": "Rest the guitar against your body with the neck slightly raised. Support the body with your picking forearm so the fretting hand can let go. The hand on the neck presses the strings. Hold the pick between thumb and the side of your index finger, with a little tip showing. Set a tuner to standard guitar. Trace each string to its peg. From thick to thin, pluck E2, A2, D3, G3, B3, E4. If flat (too low), tighten slightly. If sharp (too high), loosen slightly. Aim for the named note and a centered indicator. Repluck after small turns. Compare with the tuner’s reference tone if the pitch is unfamiliar.",
    "check": "Pluck the thick E and thin E separately. Hear which sounds higher."
  },
  {
    "title": "Frets change pitch",
    "body": "The nut is the strip where the strings leave the neck toward the pegs. Count fret spaces from there. “Open” means you pick the string with no finger pressing it. Play the thinnest string open, then press it with your index just behind fret 1. Pick again. Try fret 3 with your ring finger. Play open, 1, 3, 1, open three times, releasing each fretted note before the next.",
    "check": "Hear three distinct pitches. A buzz is your cue to move closer to the wire and try again."
  },
  {
    "title": "Keep a beat",
    "body": "Set the click to 60 BPM. Count “1, 2, 3, 4” aloud, one number per click. Four beats make one bar in the exercises here. Tap your thigh for four bars. Pick the open G string (third from thin) once per click for two bars. Then pick it only on beat 1 and let it ring while you say 2, 3, 4. Alternate the two versions.",
    "check": "Hear the next beat 1 arrive on time even when your picking hand is resting."
  },
  {
    "title": "Build E minor",
    "body": "A chord sounds several notes together. On page 2 find Em. Put your index on A fret 2 and middle on D fret 2. Leave the other four strings open. Pick from thick E to thin E one string at a time. Adjust one finger if needed. Lift both fingers, rebuild, and repeat three times. Finish by strumming Em on beat 1 for four bars.",
    "check": "All six strings ring on at least one build, and you can name the two you pressed."
  },
  {
    "title": "Find a tune by ear",
    "body": "Use two neighboring strings. Open B is the second string from thin. On the G string, fret 2 is A and open is G. Play B, A, G. Sing or hum those three sounds back. Play B A G A, one note per beat. Then play B B B and let the last B ring for beat 4. These are the first two bars of the tune on page 11. Join them slowly.",
    "check": "Hear the first three notes step downward. Try playing them once after looking away."
  },
  {
    "title": "Read your first tab",
    "body": "Turn to the tab on page 11. The top line is the thinnest string. Read left to right. A 0 is open and a 2 means fret 2. The beat numbers above the tab give the timing. Trace the first bar with your finger, saying each string and fret. Play its four notes slowly, then play both bars with a count-in of “1, 2, 3, 4.” Finish with four bars of Em.",
    "check": "Point to the note on beat 2 of bar 1, then play it without guessing."
  },
  {
    "title": "Week 1 check",
    "body": "Tune each string. Start with open G and count eight beats while picking one note per beat. Build Em from memory and test its six strings. Play the first two bars of the tune twice, taking a fresh count-in each time. Write the one task you could start on your own and the one you needed to look up.",
    "check": "Ready when you can tune with the guide, sound Em, and count through those two bars. Revisit Day 2 for buzzing or Day 3 for lost beats."
  },
  {
    "title": "Add G major",
    "body": "Use the G diagram on page 2. Place middle on thick E fret 3, index on A fret 2, and ring on thin e fret 3. Pick across all six strings. Build G three times. Then switch Em to G slowly. With these fingerings, the index can stay on A fret 2. Move the other fingers and listen to the thin e.",
    "check": "Hear the top note ring on G without moving the index off its string."
  },
  {
    "title": "Give a chord change a deadline",
    "body": "Count four beats per bar. Strum Em on 1. During 2, 3, 4, move to G. Strum G on the next 1. Repeat back to Em. Play four bars this way, then four more after a pause. If the hand arrives late, allow eight beats per chord. Finish with the two bars of melody from Day 5.",
    "check": "Count how many of four chord starts landed on beat 1. Write the number and tempo."
  },
  {
    "title": "Add D major",
    "body": "Use page 2. Index goes on G fret 2, ring on B fret 3, middle on thin e fret 2. Start the stroke at open D, the fourth string from thin. Pick D, G, B, e separately, then strum those four strings. Release and rebuild three times. Alternate a G strum and a D strum, giving yourself time to aim.",
    "check": "You can pick the open D first and hear the thin e last."
  },
  {
    "title": "Finish the first musical phrase",
    "body": "Read bars 1–4 on page 11. The new note D is fret 3 on B. For bar 3, play A three times and hold through beat 4. For bar 4, play B D D and hold the last D. Hum all four bars. Play bars 3–4 twice, then connect bars 2–3 once. Play bars 1–4 in order while counting.",
    "check": "Each bar gets four beats, including the ones ending in a held note."
  },
  {
    "title": "Land G and D on beat 1",
    "body": "Form G and sound it. Look at the destination of your D fingers, move them, and aim the pick at the D string. Reverse the change and aim at thick E. Alternate G and D, one strum per four beats, for eight bars. If one direction is harder, isolate it for three slow tries before returning to the loop.",
    "check": "Both changes work at least once without an extra beat. Note the harder direction."
  },
  {
    "title": "Accompany half a verse",
    "body": "Play the first four chord bars of the tune: G, G, D, G. Strum only on beat 1 of each bar. Say the next chord name on beat 4. Hum the tune while tapping first. Then play the chord part twice. If humming and strumming together is difficult, record the chords and hum on playback.",
    "check": "The switch to D happens at the start of bar 3. The return to G happens at bar 4."
  },
  {
    "title": "Week 2 check",
    "body": "After tuning, build Em, G, and D once each without the diagrams. Check any missing strings individually. Do two separate takes: the four-bar melody, then its four-bar chord part. Pick a speed at which you can count continuously. Listen back or tally missed downbeats.",
    "check": "Advance when you can play both parts separately with four beats per bar. Repeat Day 11 for note lengths or Day 12 for a late change."
  },
  {
    "title": "Play twice per bar",
    "body": "Hold Em. Strum downward on counts 1 and 3. Let the chord ring on 2 and 4. Tap all four counts with your foot. Repeat on G. Then play the first four chord bars of the tune with two strums per bar. If changing makes you rush, simplify that bar to one strum and continue.",
    "check": "Beat 3 is as far from the next beat 1 as it is from the previous beat 1."
  },
  {
    "title": "Add C major",
    "body": "Use page 2. Ring goes on A fret 3, middle on D fret 2, index on B fret 1. Leave G and thin e open. Start from A. Pick the five strings individually. If thin e goes silent, arch the index slightly and recheck B and e. Strum C once, relax, and rebuild it three times.",
    "check": "Both open strings ring, and the stroke starts on A."
  },
  {
    "title": "Make a four-chord loop",
    "body": "A progression is a sequence of chords. Play G, D, Em, C, one bar each. First move through the shapes with no click and say each starting string. Set a comfortable click. Strum on beat 1 only. Loop twice. Isolate the change where you paused, then try the last two beats before it and the first beat after it.",
    "check": "Name the four starting strings in order: thick E, D, thick E, A."
  },
  {
    "title": "Finish the tune",
    "body": "Read bars 5–8 on page 11. Bar 5 repeats bar 1. Bar 6 has four B notes. Bar 7 is A A B A. Bar 8 is G held for four beats. Play bars 6–7 three times, then bars 5–8. Finally connect bar 4 to bar 5 so you hear where the second half starts.",
    "check": "You hear the difference between bar 2, which holds a B, and bar 6, which repeats it on beat 4."
  },
  {
    "title": "Find the offbeat",
    "body": "Count “1 and 2 and 3 and 4 and.” Numbers land with the clicks and “and” falls halfway between. Downstrokes travel toward the floor, upstrokes return. Tap the numbers, then say the “ands.” Hold Em. Brush down on 1, 2, 3, 4 and add one light upward brush on the “and” after 4. Repeat four bars on Em alone.",
    "check": "The added upstroke fits between 4 and 1 without pushing the next downstroke late."
  },
  {
    "title": "Train your ear and your picking hand",
    "body": "On the G string play open G and fret-2 A. Hum them. Add open B on the next string. Make a three-note question, such as G A B. Hum it, then play it. Answer it with B A G. Keep the notes evenly spaced. Then play the complete eight-bar tune from page 11, using its written rhythm.",
    "check": "You can hum the direction of each three-note phrase and find its starting string."
  },
  {
    "title": "Week 3 check",
    "body": "Play the four-chord loop twice with one strum per bar. Pick through C once to find any muted strings. Count the eighth-note pattern on Em. Play the eight-bar tune once. If you lose your place, count in again at bar 5 and finish. Log which bar needs attention at the next session.",
    "check": "Ready when you can restart at bar 5, finish the tune, and play through the four-chord loop at your chosen speed."
  },
  {
    "title": "Play the full accompaniment",
    "body": "Follow the chord letters above the tune on page 11. Each half uses G, G, D, G. Count four beats in each bar. Play the full eight bars with one downstroke per bar. Record a pass or tally your changes. Then try strumming on 1 and 3, keeping the same tempo.",
    "check": "Both D chords arrive on beat 1, in bars 3 and 7."
  },
  {
    "title": "Repair one troublesome spot",
    "body": "Choose one mistake from yesterday or the melody. If it was a chord change, play the old chord on beat 3, count 4, then land the new chord on 1. If it was a melody note, play the note before it, the missed note, and the note after it. Make three comfortable passes. Put the repaired spot back into its two surrounding bars.",
    "check": "You can hear the fix in context. If it vanishes, slow those two bars and retry once."
  },
  {
    "title": "Make notes last on purpose",
    "body": "On open B, play four short, separated notes. To end each one, lightly touch the string with the picking hand. Then play four connected notes, letting each ring until the next. Use the longer sound for the held notes in bars 2–4 and 8. Play bars 1–4 quietly, then again a little louder while keeping the same beat.",
    "check": "A listener can hear a difference in volume while tapping the same pulse."
  },
  {
    "title": "Start from the middle",
    "body": "Close the guide. Hum the start of bar 5, find its first note, and play to the end.\n\nCheck the page afterward and correct any differences. Switch to the four-chord loop for two rounds. Return to the melody at bar 3. Then play the tune from bar 1. Use the page between attempts when needed.",
    "check": "You have two restart points in addition to the opening note."
  },
  {
    "title": "Play with a second part",
    "body": "Record a spoken four-beat count-in followed by the eight-bar accompaniment. Use one strum per bar at a tempo where the melody also feels easy. Play the melody with that recording. If recording is inconvenient, tap the beat and hum the tune while strumming; you can also alternate a sung pass and a played pass.",
    "check": "The final G begins with bar 8. Let it ring while you count through beat 4."
  },
  {
    "title": "Rehearse a complete take",
    "body": "Choose your easier strumming pattern. Make one uninterrupted pass of the accompaniment and one of the melody. If a note slips, rejoin at the next familiar bar. Listen once for pulse and once for clear notes. Fix one detail only. Make a second take at the same speed and compare the same detail.",
    "check": "Write what changed in audible terms, such as “the D at bar 3 now lands with the click.”"
  },
  {
    "title": "Day 28 playing check",
    "body": "Tune independently. From memory build Em, G, D, and C, checking the correct starting string. Play two rounds of G, D, Em, C with one strum per bar. Play all eight bars of the tune, then its accompaniment, at your comfortable tempo. Record the BPM, any extra beats, and one spot you can restart from memory.",
    "check": "If the beat slips, revisit Days 9 and 22. For unclear strings, revisit that chord’s lesson. If both parts hold together, try a new two- or three-chord song using the same method."
  }
];
