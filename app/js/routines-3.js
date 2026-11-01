'use strict';
/* At your piano, part 3: Worship and ministry, Songwriting, Music production. */
Object.assign(PIANO_ROUTINES, {

/* ============ Playing for worship ============ */
'w-pads': { f: 'Sustained pad chords that carry a room.', b: [
  [4, 'Wide and still', 'Left hand octave on the root, right hand open voicing (root – 5th – 9th, for C: C G D). Hold each chord 8 beats with the sustain pedal. C – G – Am – F at 60.'],
  [4, 'Smooth changes', 'Change the pedal cleanly: press the new chord, then lift and press the pedal again straight after. No blur and no gap.'],
  [4, 'Dynamics', 'Play the same progression very softly for 4 bars, grow over 4 bars, then fall back. Only the weight of your hands changes.'],
  [3, 'Under prayer', 'Pad for 3 minutes while someone (or a recording) prays. Stay soft and stay in one key.']
], r: 'Three minutes of soft pads with clean pedal changes in two keys.' },

'w-support': { f: 'Support a singer without covering them.', b: [
  [4, 'Find the range', 'Sing a song and notice where your voice sits. Keep the right hand below or around it, never on top of the melody line.'],
  [4, 'Less when they sing', 'Play simple chords on beat 1 while singing; add movement only between lines.'],
  [4, 'Keys for voices', 'Play the song in two keys (for example G and A). Sing both. Choose the key where the high note is comfortable.'],
  [3, 'Follow', 'Record a singer (or yourself) singing freely. Play along and follow their timing, holding chords until they move.']
], r: 'You accompany a sung verse where the voice is always the clearest sound.' },

'w-build': { f: 'Build and release intensity.', b: [
  [4, 'Four levels', 'Play one chorus at four levels: 1 pad only, 2 add bass octaves, 3 add rhythm on 2 and 4, 4 full chords and runs. Move up one level each time.'],
  [4, 'Builds', 'Use a walk-up, a 5 pedal, and a crescendo to move from level 2 to 4 in 2 bars.'],
  [4, 'Release', 'Drop from level 4 to level 1 in one beat: a sudden soft moment. Practise landing it.'],
  [3, 'Map it', 'Plan a song: verse at level 1–2, chorus at 3, bridge build to 4, last chorus at 4, tag at 1. Play it through.']
], r: 'A song that rises and falls on purpose, with clean builds and drops.' },

'w-sus-lift': { f: 'Sus chords and the lift into a chorus.', b: [
  [4, 'Sus to major', 'Gsus4 – G, then Asus4 – A, Dsus4 – D, held 4 beats each.'],
  [4, 'The lift', 'At the end of a verse play 5sus4 – 5 before the chorus: in G, Dsus4 – D – G.'],
  [4, 'Sus2 pads', 'Gsus2 – Csus2 – Dsus4 – D: an open worship sound.'],
  [3, 'Keys', 'The verse-to-chorus lift in C, D and E.']
], r: 'A clean 5sus4 – 5 lift into a chorus in three keys.' },

/* ============ Flow ============ */
'w-spontaneous': { f: 'Vamps for spontaneous worship.', b: [
  [4, 'Two-chord vamp', '1 – 4 (C – F) with a steady pulse, 8 bars at 70. Then 4 – 5 (F – G) and 6m – 4 (Am – F).'],
  [4, 'Change the colour', 'Keep the same vamp but change the voicing every 4 bars: triads, sus2, 7ths, open voicings.'],
  [4, 'Sing over it', 'Sing a simple phrase of praise over the vamp. Repeat it, then answer it with a new phrase.'],
  [3, 'Stay in the flow', 'Play the vamp for 3 minutes without stopping, changing dynamics only.']
], r: 'Three minutes of vamp with changing colour, never losing the pulse.' },

'w-modulate': { f: 'Change key during worship without a bump.', b: [
  [4, 'Up a step', 'G → A via E7: G – Em – E7 – A. Then A → B via F♯7.'],
  [4, 'Up a half step', 'G → A♭ via E♭7: G – E♭7 – A♭.'],
  [4, 'Pivot chord', 'G → C via G7 (the 1 becomes the 5).'],
  [3, 'Song to song', 'Play a chorus in G, modulate, and play a chorus of a second song in A.']
], r: 'Three smooth modulations, each landing on beat 1.' },

'w-transitions': { f: 'Move between songs with no silence.', b: [
  [4, 'Same key', 'End song A on the 1 chord and keep playing a pad; start song B in the same key.'],
  [4, 'Different keys', 'Use the 5 chord of the new key as a bridge: from G to D, play A7sus4 – A7 – D.'],
  [4, 'Tempo change', 'From a fast song to a slow one: play a held chord, let it ring, then start the slow feel.'],
  [3, 'Set of three', 'Plan three songs and play the two transitions between them.']
], r: 'Two clean transitions in a three-song set.' },

/* ============ Ministry ============ */
'w-prayer': { f: 'Play under prayer and spoken ministry.', b: [
  [4, 'Soft bed', 'Low octave and open right hand (sus2 and add9), very soft, 8 beats per chord.'],
  [4, 'Follow the voice', 'Play under a recorded sermon or prayer. When the voice rises, swell gently; when it pauses, hold.'],
  [4, 'Key choice', 'Choose a key that leads into the next song. Practise ending the pad on that song\'s 5 chord.'],
  [3, 'No rhythm', 'Play 3 minutes with no clear rhythm: chords change only when it feels right.']
], r: 'Three minutes of supportive pad that follows a speaking voice.' },

'w-endings': { f: 'End worship songs well.', b: [
  [4, 'Sustained ending', 'Final 1 chord with sus2 – 1, held, slow release.'],
  [4, 'Tag and stop', 'Repeat the last line twice, then a big ♭6 – ♭7 – 1 ending.'],
  [4, 'Into prayer', 'Last chord turns into a soft pad for prayer.'],
  [3, 'Three songs', 'Play the last chorus of three songs with three different endings.']
], r: 'Three different worship endings, each one clear for the band.' },

'm-spontaneous': { f: 'Spontaneous worship at depth: create songs on the spot.', b: [
  [4, 'Vamp choice', 'Choose a vamp (1 – 4, 6m – 4 – 1 – 5, or 1 – 4/1) in a key. Play it with pulse for 2 minutes.'],
  [4, 'Call and response', 'Sing a phrase, then play the same phrase on piano. Then let the piano answer with a new phrase.'],
  [4, 'Build a chorus', 'Find a short repeated line ("You are holy") and make it a chorus over the vamp. Repeat until it sticks.'],
  [3, 'Return', 'Bring the spontaneous section back to the song\'s chorus with a clean transition.']
], r: 'A new short chorus created over a vamp and joined back to a song.' },

'm-reharm-live': { f: 'Reharmonize live without losing the song.', b: [
  [4, 'Plain first', 'Play a well-known chorus with plain chords, singing the melody.'],
  [4, 'One change at a time', 'Second time, change only the 4 chord to a 2m7 or 4maj7. Third time, add a passing diminished. Keep singing.'],
  [4, 'Big moment', 'For the last chorus use a full reharm: 3m7 – 6 7 – 2m7 – ♭2 7 – 1.'],
  [3, 'Safe', 'Keep the melody note on top of each new chord. If it clashes, go back to the plain chord.']
], r: 'Three passes of one chorus, each richer, with the melody always on top.' },

/* ============ Leading and the band ============ */
'w-follow': { f: 'Follow a worship leader.', b: [
  [4, 'Watch and listen', 'Play along with a live worship video. Follow the leader\'s repeats, stops and key changes.'],
  [4, 'Hand signs', 'Practise reacting to signs: one finger = 1 chord, four fingers = 4 chord, fist = stop, hand up = go up a key.'],
  [4, 'Hold the vamp', 'When the leader talks, keep a soft vamp going in the same key.'],
  [3, 'Recover', 'If you get lost, play the 1 chord softly until you hear where they are.']
], r: 'You follow a live recording\'s repeats and key changes the first time.' },

'w-band': { f: 'Play with a band without crowding the sound.', b: [
  [4, 'Leave the bass', 'Right hand only, middle range, while a recording of a band plays: no low notes, the bass player has them.'],
  [4, 'Find a lane', 'If the guitar plays rhythm, play pads. If the guitar is quiet, play rhythm.'],
  [4, 'Lock with the drums', 'Play on the hi-hat pattern: right-hand chords exactly with the drummer\'s 2 and 4.'],
  [3, 'Practise with tracks', 'Play along with a multitrack or a backing track for one whole song.']
], r: 'One whole song with a band track where the keys never clash with bass or guitar.' },

'w-capstone': { f: 'Lead a short worship set.', b: [
  [4, 'Plan', 'Choose three songs, their keys, and how each starts, transitions and ends.'],
  [4, 'Run it', 'Play and sing the whole set, start to finish, with transitions.'],
  [4, 'Fix the joins', 'Repeat only the transitions and endings until they flow.'],
  [3, 'Record', 'Record the full set on your phone and listen through once.']
], r: 'A three-song set played and sung without stopping, with smooth joins.' },

/* ============ Songwriting ============ */
's-ideas': { f: 'Turn ideas into musical sketches at the piano.', b: [
  [4, 'Idea list', 'Write five lines of praise or testimony. Choose one.'],
  [4, 'Sing it on one chord', 'Hold C and sing the line in three different rhythms. Record each on your phone.'],
  [4, 'Add chords', 'Try the best version over C – F, then over Am – F – C – G.'],
  [3, 'Save it', 'Record the best idea and give it a title.']
], r: 'One recorded musical idea with words and chords.' },

's-lyrics': { f: 'Write lyrics that people can sing.', b: [
  [4, 'Syllable count', 'Play a 4-bar phrase on C – F – G – C. Write a line that fits it naturally, stress on strong beats.'],
  [4, 'Sing and fix', 'Sing the line over the chords. Change any word that feels awkward to sing.'],
  [4, 'Rhyme and repeat', 'Write a second line that rhymes and a third line that repeats the first.'],
  [3, 'Congregation test', 'Play and sing it twice. Could someone sing it back after one hearing?']
], r: 'Four singable lines that fit the chords.' },

's-progression': { f: 'Build your own chord progression.', b: [
  [4, 'Start on 1', 'Try 1 – 4 – 1 – 5, 1 – 6m – 4 – 5, 1 – 5 – 6m – 4 in a key you like.'],
  [4, 'Add one surprise', 'Add a borrowed 4m, a 3 7 (E7 in C), or a ♭7 chord in one place.'],
  [4, 'Feel', 'Play your progression as a ballad, then as an up-tempo praise groove.'],
  [3, 'Write it', 'Write the progression in numbers and record it.']
], r: 'An original 8-bar progression played in two feels.' },

's-melody-chordtones': { f: 'Write melodies from chord tones.', b: [
  [4, 'Chord tones', 'Over C – F – G – C, sing or play only notes of each chord (C E G, F A C, G B D).'],
  [4, 'Add steps', 'Connect chord tones with passing notes between them.'],
  [4, 'Target notes', 'Aim for the 3rd of each chord on beat 1. Play the melody with chords.'],
  [3, 'Record', 'Record your melody and sing it back the next day.']
], r: 'A melody that sits well on its chords, played with them.' },

's-motif': { f: 'Motifs, repetition and shape.', b: [
  [4, 'Find a motif', 'Make a 3–5 note idea. Play it starting on C, then on E, then on G.'],
  [4, 'Repeat and vary', 'Bar 1 motif, bar 2 motif again, bar 3 motif changed, bar 4 ending.'],
  [4, 'Shape', 'Make the chorus higher than the verse. Plan the highest note for the most important word.'],
  [3, 'Play it', 'Play the 8-bar melody with simple chords.']
], r: 'An 8-bar melody built from one motif with a clear high point.' },

's-verse-chorus': { f: 'Verse and chorus that feel different.', b: [
  [4, 'Verse', 'Lower, quieter melody; chords change every bar. Play 8 bars.'],
  [4, 'Chorus', 'Higher melody, stronger rhythm, the title line. Play 8 bars.'],
  [4, 'Joint', 'Practise the last bar of the verse leading into the chorus (5 chord or 5sus4).'],
  [3, 'Whole', 'Play verse – chorus – verse – chorus and record it.']
], r: 'A verse and chorus that are clearly different and joined smoothly.' },

's-prechorus-bridge': { f: 'Pre-chorus, bridge, intro and outro.', b: [
  [4, 'Pre-chorus', 'Use 4 – 5 or 2m – 4 – 5 to lift into the chorus. 4 bars.'],
  [4, 'Bridge', 'Start on a new chord (4 or 6m), new melody, new message. 8 bars.'],
  [4, 'Intro and outro', 'Intro: chorus chords softly. Outro: chorus line repeated, slowing down.'],
  [3, 'Full form', 'Play intro – verse – pre – chorus – bridge – chorus – outro.']
], r: 'A complete song form played through once.' },

's-callresponse': { f: 'Call and response at the piano.', b: [
  [4, 'Short calls', 'Sing a 1-bar call ("Lift Him up"), then a 1-bar response ("Lift Him up!"). Repeat over 1 – 4.'],
  [4, 'Piano answers', 'Sing a call; the piano answers with a fill. Then reverse.'],
  [4, 'Build', 'Make the calls rise in pitch each time; push the energy.'],
  [3, 'Use it', 'Add a call-and-response vamp to the end of your song.']
], r: 'A call-and-response vamp that builds over 16 bars.' },

's-harmony': { f: 'Background vocal harmony at the piano.', b: [
  [4, 'Thirds above', 'Play your melody and add a third above in the scale. Sing the harmony while playing the melody.'],
  [4, 'Three parts', 'Melody on top, alto a third below, tenor the chord root or fifth. Play all three.'],
  [4, 'Teach it', 'Play each part alone slowly as if teaching a choir.'],
  [3, 'Record', 'Record each part on your phone and sing along.']
], r: 'Three-part harmony for your chorus that you can play and teach.' },

's-gospel-form': { f: 'Gospel, praise and worship song forms.', b: [
  [4, 'Praise', 'Up-tempo 1 – 4 vamp with call and response. 16 bars at 110.'],
  [4, 'Worship', 'Slow 1 – 5 – 6m – 4 with a long melodic chorus at 70.'],
  [4, 'Traditional', '12/8 or 6/8 feel, 1 – 4 – 1 – 5 – 1 with a big ending.'],
  [3, 'Your song', 'Choose which form fits your song and play it that way.']
], r: 'Your song played in the gospel form that fits it best.' },

's-arrangement': { f: 'Song arrangement: the dynamic map.', b: [
  [4, 'Map', 'Write each section with a level 1–4 and what the piano does.'],
  [4, 'Play the map', 'Play the song, following your levels exactly.'],
  [4, 'Contrast', 'Make one section very different (for example a bridge with only pads).'],
  [3, 'Record', 'Record the full arrangement.']
], r: 'A recorded performance that follows a written dynamic map.' },

's-capstone': { f: 'Finish a complete song.', b: [
  [4, 'Check the parts', 'Play each section once. Fix the weakest line or chord.'],
  [4, 'Performance pass', 'Play and sing the whole song with intro and ending.'],
  [4, 'Chart', 'Write a chord chart with numbers and lyrics for a band.'],
  [3, 'Record', 'Record a clean demo.']
], r: 'A complete song with chart and recording.' },

/* ============ Music production (keys parts for recording) ============ */
'p-daw': { f: 'Prepare a keyboard part you could record into a DAW.', b: [
  [4, 'Play to a click', 'Metronome 80: play C – Am – F – G for 8 bars with no drift. A DAW grid needs steady time.'],
  [4, 'Count-in', 'Practise starting exactly after a 1-bar count-in.'],
  [4, 'Clean takes', 'Play the 8 bars three times; the best take has no early or late chords.'],
  [3, 'Sections', 'Play 4 bars, stop, then come back in on bar 9 exactly: punching in.']
], r: 'An 8-bar part, three takes in a row at 80 with no drift.' },

'p-midi': { f: 'Play MIDI-friendly parts: even velocity and clean releases.', b: [
  [4, 'Even velocity', 'Play the C scale at the same loudness on every note. Then a chord progression at the same level.'],
  [4, 'Clean releases', 'Lift every chord exactly before the next. MIDI records how long you hold.'],
  [4, 'Separate hands', 'Play the left-hand part alone for 8 bars, then the right hand alone: this is how parts are recorded.'],
  [3, 'Quantize by ear', 'Play the right-hand part at 70 and listen: would it need fixing on the grid?']
], r: 'Hands-separate parts with even velocity and clean timing.' },

'p-instruments': { f: 'Play differently for each sound.', b: [
  [4, 'Piano', 'Full voicings, pedal, dynamics.'],
  [4, 'Organ', 'No sustain pedal; hold chords legato; left hand bass simple.'],
  [4, 'Strings / pads', 'Slow changes, few notes, smooth voice leading.'],
  [3, 'Electric piano', 'Lighter touch, 7th and 9th chords, rhythmic comping.']
], r: 'The same progression played four ways for four sounds.' },

'p-record-piano': { f: 'Prepare a clean piano take.', b: [
  [4, 'Warm up the part', 'Play the part slowly once, then at tempo.'],
  [4, 'Three takes', 'Record three full takes on your phone with a click in headphones.'],
  [4, 'Pick and fix', 'Listen, choose the best, and practise the bars that were weak.'],
  [3, 'Final take', 'Record one more full take.']
], r: 'A full clean take recorded to a click.' },

'p-vocal': { f: 'Accompany for a vocal recording.', b: [
  [4, 'Guide part', 'Play a simple, steady guide part that a singer can follow: chords on beat 1, clear changes.'],
  [4, 'Leave space', 'Play less in the verse so the vocal can be heard.'],
  [4, 'Key check', 'Try the song a step up and a step down; choose the best key for the voice.'],
  [3, 'Record a guide', 'Record the guide part with a click.']
], r: 'A steady guide part in the singer\'s best key.' },

'p-drums': { f: 'Play drum patterns on the keyboard (finger drumming).', b: [
  [4, 'Kick and snare', 'Left hand C2 = kick on 1 and 3, right hand D2 = snare on 2 and 4. Metronome 80.'],
  [4, 'Hi-hat', 'Add F♯2 eighth notes with the right hand (snare with left). Simple rock-gospel beat.'],
  [4, 'Fill', 'At bar 4 play snare eighths as a fill.'],
  [3, 'Praise groove', 'Play a 16-bar pattern at 100 without stopping.']
], r: 'A steady 16-bar finger-drum pattern at 100.' },

'p-groove': { f: 'Groove, swing and feel.', b: [
  [4, 'Straight', 'Eighth-note chords at 90, exactly even.'],
  [4, 'Swing', 'Long-short eighths (triplet feel). Same chords.'],
  [4, 'Behind and ahead', 'Play slightly behind the click for a laid-back feel, then right on it.'],
  [3, 'Choose', 'Play a song in the feel that suits it best.']
], r: 'Straight and swung versions of the same groove, steady at 90.' },

'p-bass': { f: 'Play bass lines on the keys.', b: [
  [4, 'Roots', 'Left hand only, root notes on 1 and 3 for C – Am – F – G.'],
  [4, 'Movement', 'Add passing notes on beat 4 leading to the next root.'],
  [4, 'Octaves', 'Octave bass with a rhythm (1, 2&, 4).'],
  [3, 'With chords', 'Left hand bass line, right hand chords on 2 and 4.']
], r: 'A moving bass line under right-hand chords at 80.' },

'p-pads-strings': { f: 'Pads and string parts.', b: [
  [4, 'Long notes', 'Hold each chord 8 beats with few notes (3 or 4).'],
  [4, 'Voice leading', 'Move each voice by the smallest step.'],
  [4, 'Lines', 'Play a string line: one melodic voice moving slowly over the chords.'],
  [3, 'Swell', 'Grow from soft to loud over 4 bars.']
], r: 'A smooth pad with one moving string line.' },

'p-arrangement': { f: 'Arrange keyboard parts for a full song.', b: [
  [4, 'Sections', 'Decide what the keys play in each section: pad, rhythm, or silence.'],
  [4, 'Layers', 'Play the piano part, then the pad part, then a lead line, each alone.'],
  [4, 'Transitions', 'Practise the keys part going into each chorus.'],
  [3, 'Full pass', 'Play the full keys part from top to bottom.']
], r: 'A planned keys part for every section, played through.' },

'p-eq': { f: 'Hear frequency ranges at the piano.', b: [
  [4, 'Low', 'Play notes below C2: this is the bass zone. Too many notes here sound muddy.'],
  [4, 'Middle', 'Play chords around middle C: the vocal zone. Leave room for voices.'],
  [4, 'High', 'Play above C6: brightness. Use it lightly.'],
  [3, 'Place your part', 'Re-voice a progression so the left hand stays above C2 and the right hand avoids the vocal range.']
], r: 'A re-voiced part that leaves space for bass and vocals.' },

'p-dynamics-fx': { f: 'Dynamics at the keys before any compressor.', b: [
  [4, 'Even level', 'Play a progression at one steady level for 8 bars.'],
  [4, 'Accents', 'Accent beat 2 and 4 only.'],
  [4, 'Sustain and space', 'Use the pedal like reverb: long in pads, short in rhythm.'],
  [3, 'Contrast', 'Verse soft and dry, chorus loud and sustained.']
], r: 'Clear control of level, accents and sustain.' },

'p-mix': { f: 'Play parts that mix well.', b: [
  [4, 'Less is more', 'Play the chorus with 3-note voicings instead of full hands.'],
  [4, 'Register', 'Move the right hand up or down an octave to find the place that sounds clearest.'],
  [4, 'Rhythm', 'Play rhythmic chords only where the drums leave space.'],
  [3, 'Record and compare', 'Record full and simple versions and compare.']
], r: 'A simpler, clearer keys part that sits in the mix.' },

'p-master-export': { f: 'A final performance ready to export.', b: [
  [4, 'Run the song', 'Play the whole song at performance level.'],
  [4, 'Fix spots', 'Repeat any bars that are not clean.'],
  [4, 'Final take', 'Record a full take.'],
  [3, 'Listen', 'Listen on a phone speaker and on headphones: is the piano clear?']
], r: 'A final recorded take ready for the mix.' },

'p-capstone': { f: 'Finish an original gospel song.', b: [
  [4, 'Parts', 'Play each keys part of your song: piano, pad, bass.'],
  [4, 'Full take', 'Record the main piano part to a click.'],
  [4, 'Overdubs', 'Record a pad and a bass part on top (or practise them).'],
  [3, 'Check', 'Listen through and list what to fix in the mix.']
], r: 'All keyboard parts of your song recorded.' }

});
