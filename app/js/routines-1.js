'use strict';
/* ---------------------------------------------------------------- At your piano: 20-minute routines
   One routine per piano lesson, for the learner's own (physical) piano, away from the screen.
   The app adds a 3-minute warm-up and a 2-minute close to every routine, so each entry holds
   15 minutes of lesson-specific work: { f: focus, b: [[minutes, title, what to do], ...], r: ready when }.
   Tempos are metronome BPM. "Hands separately, then together" is always allowed. */
const PIANO_ROUTINES = {};
function pianoRoutine(id) { return PIANO_ROUTINES[id] || null; }

Object.assign(PIANO_ROUTINES, {

/* ============ Level 1 · Keyboard ============ */
'keyboard-layout': { f: 'Find any key on your piano without counting.', b: [
  [4, 'Black-key groups', 'Starting at the bottom of your piano, touch every group of two black keys up to the top, then every group of three. Say "two" or "three" aloud each time. Do it three times, faster each time.'],
  [5, 'C and F hunt', 'Play every C from the lowest to the highest, then every F. Then close your eyes, put a finger anywhere, open them and name the nearest C. Repeat 15 times.'],
  [4, 'Low, middle, high', 'Find middle C (the C nearest the middle of your piano, usually under the brand name). Play C3, middle C (C4) and C5. Then play any C and say "low", "middle" or "high".'],
  [2, 'Speed round', 'Set a timer for one minute: play as many Cs and Fs as you can, alternating C, F, C, F up the keyboard, without looking for more than a second.']
], r: 'You can play every C and F on your piano with your eyes closed for a moment between each.' },

'musical-alphabet': { f: 'Say and play the seven letters up and down, in any octave.', b: [
  [4, 'Alphabet up', 'From each C, play C D E F G A B C with one finger, saying each letter aloud. Do it from three different Cs.'],
  [4, 'Alphabet down', 'From each C play down: C B A G F E D C, saying each letter. Going down is harder: go slowly and do it from three Cs.'],
  [4, 'Start anywhere', 'Start on E and play up 8 keys saying the letters (E F G A B C D E). Then start on G, then on A, then on D. Then do each one going down.'],
  [3, 'Octave jumps', 'Play a C, then the next C up (an octave). Repeat with D to D, E to E and so on up to B. Feel the stretch: eight white keys.']
], r: 'You can start on any white key and say the letters up or down without stopping.' },

'white-notes': { f: 'Name any white key in under two seconds.', b: [
  [4, 'Landmarks', 'Find C (left of two black keys) and F (left of three black keys) in every octave. From each C, name D and E; from each F, name G, A and B.'],
  [5, 'Random naming', 'Point to a random white key, name it aloud, then check by counting from the nearest C or F. 20 keys. Count how many you named right without counting.'],
  [4, 'Call and find', 'Say a letter (for example "A"), then play every A on the piano from bottom to top. Do all seven letters.'],
  [2, 'Two-second test', 'Close your eyes, touch a white key, open your eyes and name it within two seconds. Ten times.']
], r: 'You name 18 out of 20 random white keys within two seconds each.' },

'sharps-flats': { f: 'Name every black key both ways (C♯ = D♭).', b: [
  [4, 'Sharp names', 'Play each white key and the black key just to its right, saying "C, C sharp; D, D sharp; F, F sharp; G, G sharp; A, A sharp". Two octaves.'],
  [4, 'Flat names', 'Play each white key and the black key just to its left: "D, D flat; E, E flat; G, G flat; A, A flat; B, B flat". Two octaves.'],
  [4, 'Both names', 'Touch each black key and say both names (for example "C sharp or D flat"). Then play the chromatic scale: every key, black and white, from C to C, up and down, slowly.'],
  [3, 'Find them fast', 'Call out a name such as "E flat", "F sharp", "B flat", "G sharp", "D flat" and play it in three octaves. Ten names.']
], r: 'You can play any sharp or flat by name without counting from C.' },

'posture-fingers': { f: 'Sit well and use the right finger numbers.', b: [
  [3, 'Set up', 'Sit so your forearms are level with the keys, elbows just in front of your body, feet flat. Curve your fingers as if holding a ball. Check this in a mirror or with your phone camera.'],
  [5, 'Five-finger position', 'Right hand thumb (1) on middle C, fingers 1 2 3 4 5 on C D E F G. Play 1 2 3 4 5 4 3 2 1, slowly, each note equally loud. Ten times. Then left hand: finger 5 on the C below middle C, play 5 4 3 2 1 2 3 4 5.'],
  [4, 'Finger calls', 'Rest both hands in position. Say a finger number and hand ("right 3", "left 4") and play it. 20 calls, mixing both hands.'],
  [3, 'Even and relaxed', 'Metronome 60: play the five-finger pattern one note per click, right hand then left hand. Keep your wrist loose; shake out your hands between each round.']
], r: 'You can play 1 2 3 4 5 4 3 2 1 in each hand evenly at 60 BPM with relaxed wrists and curved fingers.' },

/* ============ Level 1 · Rhythm ============ */
'beat': { f: 'Keep a steady beat with your body and your hands.', b: [
  [3, 'Feel it', 'Metronome 70: tap your foot on every click for one minute, then clap on every click. Then count "1 2 3 4" aloud with the clicks.'],
  [5, 'Play the beat', 'Play middle C on every click: 8 beats with the right hand, 8 with the left, then both hands together. Then hold the note for 2 clicks, then 4.'],
  [4, 'Accent beat 1', 'Play C on every click, louder on beat 1 of each group of four. Then play a C major chord (C E G) on beat 1 and single Cs on beats 2, 3 and 4.'],
  [3, 'Without the click', 'Play steady Cs with the metronome for 8 beats, then turn it off (or mute it) and keep going for 16 beats. Turn it back on: are you still together?']
], r: 'You can keep a steady beat for 16 beats on your own and still be with the metronome.' },

'note-values': { f: 'Hold whole, half, quarter and eighth notes for the right time.', b: [
  [4, 'Count and hold', 'Metronome 72, counting "1 2 3 4" aloud. Play C and hold it 4 beats (whole note), then 2 + 2 (half notes), then 4 quarter notes, then 8 eighth notes saying "1 and 2 and…".'],
  [4, 'Mixed bar', 'Play this pattern on C D E F G (one note per bar): half, quarter, quarter. Then: quarter, quarter, half. Then: four quarters. Then: eight eighths.'],
  [4, 'Two hands', 'Left hand holds a whole note C (4 beats) while the right hand plays four quarter notes on G. Then the right hand plays eighths while the left plays half notes.'],
  [3, 'Name it, play it', 'Say a note value ("half, half, quarter, quarter, half") and play it on any note, keeping the metronome on. Five different bars.']
], r: 'You hold every note value for exactly its length while counting aloud at 72 BPM.' },

'time-signatures': { f: 'Feel 4/4, 3/4 and 6/8.', b: [
  [4, '4/4 march', 'Metronome 80: play a low C on beat 1 and a C chord on beats 2, 3 and 4. Count "1 2 3 4". Eight bars.'],
  [4, '3/4 waltz', 'Metronome 90: low C on beat 1, chord on beats 2 and 3 ("oom pah pah"). Count "1 2 3". Eight bars, then change to F (low F, F A C chord) and G.'],
  [4, '6/8 lilt', 'Metronome 60 on the dotted quarter (two big beats per bar). Play six even notes per bar: low C, then E G C G E, counting "1 2 3 4 5 6" with weight on 1 and 4.'],
  [3, 'Switch', 'Play 4 bars of 4/4, 4 bars of 3/4, 4 bars of 6/8 without stopping. Say the time signature aloud before each change.']
], r: 'You can play an "oom pah pah" waltz and a 6/8 pattern with the first beat clearly stronger.' },

'metronome-play': { f: 'Play exactly with the click, not near it.', b: [
  [4, 'Lock in', 'Metronome 60: play the C major scale (right hand) one note per click. Listen: you should not hear the click when you are exactly on it.'],
  [4, 'Ladder', 'Same scale, metronome 60, 70, 80, 90. Move up only after one clean round with no early or late notes.'],
  [4, 'Eighths', 'Back to 60: play two notes per click (eighth notes) up and down the scale. Then three per click (triplets) on the C five-finger pattern.'],
  [3, 'Beat 2 and 4 click', 'Set the metronome to half your tempo (for example 40) and treat each click as beats 2 and 4 of a 4/4 bar at 80. Play quarter-note Cs. This is how gospel musicians practise.']
], r: 'Your notes hide the click at 80 BPM, and you can play eighths cleanly at 60.' },

'rhythm-patterns': { f: 'Play eighth-note patterns and syncopation in time.', b: [
  [4, 'Straight eighths', 'Metronome 70, count "1 & 2 & 3 & 4 &". Play C chords (C E G) on every eighth note, then on beats only, then on "&"s only.'],
  [5, 'Syncopation', 'Play the pattern 1, 2&, 4 (the "push" before beat 3). Then 1, 1&, 2&, 3&, 4. Say the counts aloud. Do each pattern 8 bars on C, then F, then G.'],
  [3, 'Left hand steady', 'Left hand plays low C on beats 1 and 3. Right hand plays the syncopated pattern 1, 2&, 4 on the chord. Slowly at 60, then 75.'],
  [3, 'Make your own', 'Invent a one-bar rhythm using at least one "&" off the beat. Play it 8 times on C, F, G, C without changing it.']
], r: 'You can play "1, 2&, 4" over a steady left hand at 75 BPM, eight bars without a slip.' },

'comping-rhythms': { f: 'Play the gospel push and keep the groove.', b: [
  [4, 'The push', 'Metronome 72. Play the chord just before beat 1 (on the "&" of 4) and hold it across the bar line. Progression: C, F, G, C, one chord per bar. Left hand plays the root on beat 1.'],
  [4, 'Comping pattern', 'Right hand chord on 1, 2&, and 4&; left hand root on 1 and 3. Progression C – Am – F – G. Eight bars, then repeat at 84.'],
  [4, 'Ghost the beats', 'Keep your foot on every beat while your hands play only off-beats ("&"s). This builds the gospel feel. Two rounds of the progression.'],
  [3, 'Groove check', 'Record yourself on your phone for 30 seconds, then listen: does it feel like the music leans forward? Fix any chord that lands late.']
], r: 'The push lands just before the bar line every time at 84 BPM.' },

/* ============ Level 1 · Scales ============ */
'c-major-scale': { f: 'Play the C major scale evenly with correct fingering.', b: [
  [4, 'Right hand', 'Fingering 1 2 3 1 2 3 4 5 (thumb passes under after E). Metronome 60, one note per click, up and down, five times. Watch the thumb: it moves early and quietly.'],
  [4, 'Left hand', 'Fingering 5 4 3 2 1 3 2 1 (finger 3 crosses over the thumb after G). Same as above, five times up and down.'],
  [4, 'Together', 'Both hands one octave apart, slowly (50). Then two notes per click at 50. Stop and fix any note that is louder than the others.'],
  [3, 'Two octaves', 'Right hand two octaves: 1 2 3 1 2 3 4 1 2 3 1 2 3 4 5. Left hand: 5 4 3 2 1 3 2 1 4 3 2 1 3 2 1. Hands separately at 60.']
], r: 'Two octaves, hands together, at 60 with two notes per click, even and with the right fingers.' },

'major-scale-formula': { f: 'Build any major scale with whole and half steps.', b: [
  [4, 'Say the formula', 'Whole, whole, half, whole, whole, whole, half. Play it from C saying "W W H W W W H" for each step.'],
  [5, 'Build three new scales', 'Using only the formula, work out and play G major (one sharp: F♯), D major (F♯, C♯) and F major (one flat: B♭). Right hand, slowly, saying the letter names.'],
  [3, 'Fingering', 'G and D major use the same fingering as C. F major right hand: 1 2 3 4 1 2 3 4. Play each scale hands separately at 60.'],
  [3, 'Ear check', 'Play each scale and listen: it should sound like "Do Re Mi Fa So La Ti Do". If one note sounds wrong, check the formula.']
], r: 'You can build and play G, D and F major from the formula without looking them up.' },

'first-melody': { f: 'Play simple melodies smoothly with the right fingers.', b: [
  [4, 'Five-finger tune', 'Right hand on C D E F G. Play "Amazing Grace" opening by ear or from the lesson, then any simple hymn line you know that fits in five notes. Slowly, singing along.'],
  [4, 'Legato', 'Play the melody so each note connects to the next with no gap and no overlap. Listen for a smooth line, like a singer.'],
  [4, 'Shape it', 'Play the melody three ways: softly, loudly, and growing from soft to loud. Lift your hand gently at the end of each phrase like a singer taking a breath.'],
  [3, 'Move it', 'Play the same melody starting on G (G A B C D) and on F (F G A B♭ C). Your fingers do the same thing; listen for the same tune.']
], r: 'You play a short melody smoothly and with shape, in C, G and F.' },

'two-hands': { f: 'Melody in the right hand, bass notes in the left.', b: [
  [4, 'Left hand roots', 'Left hand plays low C, F and G (one per bar, held for 4 beats). Practise jumping between them without looking. Metronome 60.'],
  [5, 'Put them together', 'Right hand plays your melody from the last lesson; left hand plays a low C on beat 1 of each bar, changing to F or G where the melody needs it. Slowly.'],
  [3, 'Hands alone first', 'If a bar is hard, play it right hand alone twice, left hand alone twice, then together three times.'],
  [3, 'Steady tempo', 'Play the whole tune hands together at 60, then 70, without stopping for mistakes. Keep the left hand on time even if the right hand slips.']
], r: 'Both hands together at 70 without stopping.' },

'natural-minor': { f: 'Play A, E and D natural minor and hear the minor sound.', b: [
  [4, 'A minor', 'A B C D E F G A, all white keys, fingering as C major (RH 1 2 3 1 2 3 4 5; LH 5 4 3 2 1 3 2 1). Hands separately, metronome 60, up and down three times.'],
  [4, 'E minor and D minor', 'E minor has F♯; D minor has B♭. Play each hands separately, then together slowly.'],
  [4, 'Major or minor', 'Play C major then A minor, G major then E minor, F major then D minor. Sing along; hear how the minor feels darker. They share the same notes: relative keys.'],
  [3, 'Minor melody', 'Make up a short four-bar melody in A minor that ends on A. Play it with a low A in the left hand.']
], r: 'A, E and D minor, hands together at 60, and you can hear major from minor.' },

'harmonic-melodic': { f: 'Play harmonic and melodic minor and use the raised 7th.', b: [
  [4, 'Harmonic minor', 'A harmonic minor: A B C D E F G♯ A. Play it up and down, hands separately, metronome 60. Listen for the step-and-a-half from F to G♯.'],
  [4, 'Melodic minor', 'A melodic minor goes up A B C D E F♯ G♯ A and comes down as natural minor (G, F). Hands separately, three times.'],
  [4, 'The E7 to Am pull', 'Play E7 (E G♯ B D) then A minor (A C E). The G♯ is the raised 7th that pulls to A. Play it 8 times, then in D minor: A7 to Dm.'],
  [3, 'All three', 'Play A natural, harmonic and melodic minor one after another without stopping. Then do the same in E minor.']
], r: 'You play all three forms of A minor and E minor and can play V7 – i in A and D minor.' },

'sharp-keys': { f: 'G, D, A, E and B major scales with correct sharps and fingering.', b: [
  [5, 'Scale ladder', 'G (F♯), D (F♯ C♯), A (F♯ C♯ G♯), E (adds D♯), B (adds A♯). Play each one octave, hands separately, metronome 60. G, D, A, E use C fingering. B major left hand starts on finger 4: 4 3 2 1 4 3 2 1.'],
  [4, 'Hands together', 'Choose two keys from today (rotate each day). Hands together at 60, then two notes per click.'],
  [3, 'Primary chords', 'In each key play the 1, 4 and 5 chords (for D: D, G, A). Then 1 – 4 – 5 – 1 with a bass note.'],
  [3, 'Name the sharps', 'Say the order of sharps: F C G D A E B. For each key, say which sharps it has before you play it.']
], r: 'You can play G, D, A and E major hands together at 60 and say each key\'s sharps.' },

'flat-keys': { f: 'F, B♭, E♭, A♭ and D♭ major scales.', b: [
  [5, 'Scale ladder', 'F (B♭), B♭ (B♭ E♭), E♭ (adds A♭), A♭ (adds D♭), D♭ (adds G♭). Right-hand fingering for B♭, E♭, A♭: always thumb on C and F. Play each one octave, hands separately, metronome 60.'],
  [4, 'Church keys', 'E♭, A♭ and D♭ are common in gospel. Play each hands together, slowly, three times.'],
  [3, 'Primary chords', 'In each key play 1 – 4 – 5 – 1 (for A♭: A♭, D♭, E♭, A♭) with the root in the left hand.'],
  [3, 'Order of flats', 'B E A D G C F. Say which flats each key has, then play the scale to check.']
], r: 'You can play E♭, A♭ and D♭ major hands together at 60.' },

'minor-keys': { f: 'Minor scales in more keys, with their relative majors.', b: [
  [5, 'New minors', 'B minor (2 sharps), F♯ minor (3 sharps), G minor (2 flats), C minor (3 flats), F minor (4 flats). Play each natural minor, hands separately, at 60.'],
  [4, 'Harmonic versions', 'Play each of the five with the raised 7th (for C minor: B natural). Listen for the pull to the tonic.'],
  [3, 'Relative pairs', 'Play each minor scale followed by its relative major: Bm – D, F♯m – A, Gm – B♭, Cm – E♭, Fm – A♭.'],
  [3, 'i – iv – V – i', 'In C minor and G minor play Cm – Fm – G7 – Cm and Gm – Cm – D7 – Gm with a bass note.']
], r: 'Five minor keys at 60 and the i – iv – V7 – i progression in C minor and G minor.' },

/* ============ Level 1–2 · Chords ============ */
'triad-major': { f: 'Find and play major triads quickly.', b: [
  [4, 'C, F, G shapes', 'Right hand fingers 1 3 5. Play C (C E G), F (F A C), G (G B D). Block chord, then broken (one note at a time). Five times each.'],
  [4, 'Switching', 'Metronome 60: C (4 beats), F (4 beats), G (4 beats), C. Look at the next chord before you move. Then 2 beats each.'],
  [4, 'All 12 by formula', 'Root, up 4 half steps, up 3 half steps. Build D, E, A, B♭, E♭ and play each block chord. Say the notes aloud.'],
  [3, 'Left hand too', 'Play C, F, G in the left hand (fingers 5 3 1), then both hands together one octave apart.']
], r: 'C – F – G – C at 2 beats per chord at 70, both hands, without stopping.' },

'triad-minor': { f: 'Play minor triads and change between major and minor.', b: [
  [4, 'Am, Dm, Em', 'Right hand 1 3 5: Am (A C E), Dm (D F A), Em (E G B). Block, then broken, five times each.'],
  [4, 'Major to minor', 'Play C then Cm (lower the middle note), D then Dm, E then Em, F then Fm, G then Gm, A then Am. Listen to the colour change.'],
  [4, 'Progression', 'C – Am – Dm – G, then C – Em – F – G. 4 beats each at 70 with the root in the left hand.'],
  [3, 'Formula', 'Minor = root, up 3, up 4. Build Bm, F♯m, Cm and Gm and play each.']
], r: 'You can turn any major chord into minor instantly, and play C – Am – Dm – G at 80.' },

'major-vs-minor-ear': { f: 'Hear major and minor without looking.', b: [
  [4, 'Play and label', 'Play C, Cm, F, Fm, G, Gm. Say "happy" or "sad" for each. Then play them in random order with your eyes closed and name each.'],
  [4, 'Sing the third', 'Play a major chord, then sing the middle note. Play the minor chord and sing its middle note. Feel the half-step difference.'],
  [4, 'Partner or phone', 'Ask someone to play major or minor chords (or record yourself playing 10 random ones, wait a day, then listen). Name each one.'],
  [3, 'In songs', 'Play the first chords of two songs you know from church. Is each chord major or minor? Check on the piano.']
], r: 'You name major or minor correctly 9 times out of 10 without looking.' },

'chords-in-key': { f: 'Play all seven chords of C major and know their numbers.', b: [
  [4, 'Up the scale', 'Play triads on every note of the C scale using white keys only: C Dm Em F G Am B°. Say the numbers "1 2 3 4 5 6 7". Up and down, three times.'],
  [4, 'Number calls', 'Say numbers and play the chord: 1 – 4 – 5 – 1, 1 – 6 – 4 – 5, 1 – 5 – 6 – 4, 2 – 5 – 1. Left hand plays the root.'],
  [4, 'In G major', 'Same chords in G (with F♯): G Am Bm C D Em F♯°. Play 1 – 4 – 5 – 1 and 1 – 5 – 6 – 4.'],
  [3, 'Church song', 'Take a simple worship song you know in C and play its chords by number (most use 1, 4, 5 and 6).']
], r: 'Someone can call any number and you play that chord in C or G within two seconds.' },

'dim-aug': { f: 'Play diminished and augmented triads and know where they are used.', b: [
  [4, 'Build them', 'Diminished: root, up 3, up 3 (C E♭ G♭). Augmented: root, up 4, up 4 (C E G♯). Play C, Cm, C°, C+ in a row. Then on D, E, F and G.'],
  [4, 'B° in C', 'Play B° (B D F) going to C. Then G7 to C. Hear how B° is like part of G7.'],
  [4, 'Augmented push', 'Play C – C+ – F (the augmented chord pulls to the 4 chord). Then G – G+ – C. Use it in a slow hymn ending.'],
  [3, 'Listen and name', 'Play major, minor, diminished and augmented on random roots with eyes closed. Name the type.']
], r: 'You can play all four triad types on any white-key root and use C – C+ – F.' },

'inversions': { f: 'Play every triad in root position, 1st and 2nd inversion, and move smoothly.', b: [
  [4, 'C three ways', 'C E G (root), E G C (1st), G C E (2nd), C E G (root). Right hand fingers 1 3 5, 1 2 5, 1 3 5. Up and down, metronome 60, five times.'],
  [4, 'F and G', 'Do the same for F (F A C, A C F, C F A) and G (G B D, B D G, D G B).'],
  [5, 'Closest shapes', 'Play C (C E G) → F (C F A, 2nd inversion) → G (B D G, 1st inversion) → C (C E G). Your hand hardly moves. Left hand plays the roots. Eight times, then in G: G – C/G – D/F♯ – G.'],
  [2, 'Minor too', 'Play Am, Dm and Em in all three inversions, up and down.']
], r: 'C – F – G – C with the closest shapes at 80, and every inversion of C, F, G and Am.' },

'bass-and-chords': { f: 'Left-hand bass and right-hand chords together.', b: [
  [4, 'Root and chord', 'Left hand low C, right hand C chord, together on beat 1. Then C – Am – F – G, 4 beats each, metronome 70.'],
  [4, 'Bass on 1 and 3', 'Left hand plays the root on beats 1 and 3, right hand holds the chord. Then right hand plays on 2 and 4 ("oom pah").'],
  [4, 'Closest shapes', 'Use the inversions from the last lesson so the right hand barely moves: C (C E G) – Am (C E A) – F (C F A) – G (B D G).'],
  [3, 'Two keys', 'Play I – vi – IV – V in G (G – Em – C – D) and in F (F – Dm – B♭ – C).']
], r: 'I – vi – IV – V in C, G and F at 80 with bass and smooth right-hand shapes.' },

/* ============ Level 2 · Theory ============ */
'intervals': { f: 'Play and hear every interval from a 2nd to an octave.', b: [
  [4, 'Count and play', 'From C play C–D (2nd), C–E (3rd), C–F (4th), C–G (5th), C–A (6th), C–B (7th), C–C (octave). Then the minor versions: C–E♭, C–A♭, C–B♭.'],
  [4, 'Sing them', 'Play the lower note, sing the upper, then check. Use song hooks: a 4th is "Here comes the bride", a 5th is the start of "Twinkle".'],
  [4, 'From other notes', 'Play a 3rd, 5th and octave from D, F, G and A. Then a minor 3rd from each.'],
  [3, 'Blind test', 'Play a random interval with your eyes closed and name it. Ten times.']
], r: 'You can play any interval on demand and name 3rds, 5ths and octaves by ear.' },

'circle-fifths': { f: 'Use the circle of fifths to know every key signature.', b: [
  [4, 'Walk the circle', 'Play C, G, D, A, E, B, F♯ (each a 5th up), then C, F, B♭, E♭, A♭, D♭, G♭ (each a 5th down). Left hand roots, right hand major chord.'],
  [4, 'Scales round the circle', 'Play the first five notes (1 2 3 4 5 4 3 2 1) of each key around the circle. Say how many sharps or flats each has.'],
  [4, 'Dominants', 'Play each key\'s 5 chord going to its 1 chord around the circle: G7 – C, D7 – G, A7 – D… This is the most common move in gospel.'],
  [3, 'Quick quiz', 'Say a number of sharps or flats ("three flats") and play that key\'s scale and chord (E♭).']
], r: 'You can play V7 – I around the whole circle and name each key signature.' },

/* ============ Level 2 · Gospel piano ============ */
'g-what': { f: 'Get the gospel sound: bass, full chords and feel.', b: [
  [4, 'Full sound', 'Left hand octaves on the root (C and the C below), right hand chord in the middle. Play C – F – G – C, 4 beats each, at 70. Let it ring.'],
  [4, 'Add the 7th and 9th', 'Right hand plays C E G B♭ (C7) and C E G D (Cadd9). Play C – Cadd9 – F – F/G – C. Hear the "church" colour.'],
  [4, 'Rhythm', 'Right hand plays on beats 2 and 4 like a clap; left hand on 1 and 3. Progression C – Am – F – G at 80.'],
  [3, 'Play a song', 'Choose a congregational song you know in C. Play its chords with bass octaves and full right-hand chords.']
], r: 'Your playing sounds full and steady: octave bass, chords on 2 and 4, at 80.' },

'g-amen': { f: 'Play the Amen (plagal) cadence in several keys.', b: [
  [4, 'In C', 'F/C (C F A) to C (C E G): the right hand moves only two fingers. Left hand plays low C under both. Play it slowly 8 times, singing "A-men".'],
  [4, 'Dress it up', 'F/C → Fm/C → C. Then Fmaj7 → C. Then F/G → C. Choose the one you like best.'],
  [4, 'Keys', 'Play IV – I in G (C/G – G), F (B♭/F – F), B♭ (E♭/B♭ – B♭), E♭ (A♭/E♭ – E♭).'],
  [3, 'Ending a song', 'Play the last line of a hymn you know and end it with IV – iv – I.']
], r: 'IV – iv – I in five keys, played softly and connected.' },

'g-worship': { f: 'Play 1 – 5 – 6m – 4 in several keys with good voicings.', b: [
  [4, 'In C', 'C – G – Am – F. Closest shapes: C E G → B D G → C E A → C F A. Left hand roots. Metronome 70, 4 beats each, 8 rounds.'],
  [4, 'Pad style', 'Hold each chord for 8 beats with soft dynamics, left hand octave, right hand adds the 9th (C–D, G–A, Am–B, F–G).'],
  [4, 'Keys', 'G (G – D – Em – C), D (D – A – Bm – G), A (A – E – F♯m – D). Two rounds each.'],
  [3, 'Sing over it', 'Sing a worship song that uses this progression while you play. Keep your hands steady even when you sing.']
], r: '1 – 5 – 6m – 4 in C, G, D and A at 70 while singing.' },

'g-sevenths': { f: 'Colour chords with sevenths.', b: [
  [4, 'Three sevenths', 'Cmaj7 (C E G B), C7 (C E G B♭), Cm7 (C E♭ G B♭). Play each on C, F and G and listen to the colour.'],
  [4, 'In the key', 'Cmaj7 – Dm7 – Em7 – Fmaj7 – G7 – Am7. Then Cmaj7 – Fmaj7 – G7 – Cmaj7 with a bass note.'],
  [4, 'Smooth movement', 'Dm7 (D F A C) → G7 (D F G B) → Cmaj7 (C E G B). Only one or two fingers move each time. Metronome 70, 8 rounds.'],
  [3, 'In F and G', 'Fmaj7 – B♭maj7 – C7 – Fmaj7 and Gmaj7 – Cmaj7 – D7 – Gmaj7.']
], r: 'I – IV – V7 – I with sevenths in C, F and G with smooth hand movement.' },

'g-turnaround': { f: 'Play 1 – 6m – 2m – 5 smoothly, in time and in keys.', b: [
  [4, 'Triads', 'C – Am – Dm – G, 2 beats each at 70, left hand roots. Closest shapes: C E G, C E A, D F A, D G B.'],
  [4, 'Sevenths', 'Cmaj7 – Am7 – Dm7 – G7. Then add the 9th on top when you can. 8 rounds at 70, then 80.'],
  [4, 'Keys', 'In F: F – Dm – Gm – C7. In G: G – Em – Am – D7. In B♭: B♭ – Gm – Cm – F7.'],
  [3, 'Loop it', 'Play the turnaround 8 times in a row without stopping in your favourite key. This is the backbone of hundreds of gospel songs.']
], r: 'The 1 – 6 – 2 – 5 turnaround in C, F, G and B♭ at 80 without a stop.' },

/* ============ Level 2 · Arpeggios and left hand ============ */
'arpeggio-major': { f: 'Smooth major arpeggios across two octaves.', b: [
  [4, 'C arpeggio', 'Right hand C E G C E G C, fingering 1 2 3 1 2 3 5; left hand 5 4 2 1 4 2 1. Metronome 60, hands separately, up and down three times.'],
  [4, 'F and G', 'Same fingering. Play each two octaves, hands separately, then together at 50.'],
  [4, 'Even sound', 'Play the C arpeggio with two notes per click at 60. The thumb tuck must be silent and smooth.'],
  [3, 'In a song', 'Play a slow worship progression (C – G – Am – F) with the right hand arpeggiating each chord up and back.']
], r: 'C, F and G arpeggios two octaves hands together at 60, even and smooth.' },

'arpeggio-7ths': { f: 'Minor and seventh-chord arpeggios.', b: [
  [4, 'Minor', 'Am, Dm, Em arpeggios two octaves, hands separately, metronome 60. Same fingering as C.'],
  [4, 'Sevenths', 'Cmaj7 (C E G B), C7, Am7, Dm7, G7: four-note arpeggios, fingers 1 2 3 4 then thumb on the next C. One octave up and down.'],
  [4, 'Through a progression', 'Arpeggiate Cmaj7 – Am7 – Dm7 – G7, one chord per bar, eighth notes, at 70.'],
  [3, 'Left hand bass arpeggio', 'Left hand plays root – 5th – octave – 5th (C G C G) under right-hand chords: a classic ballad pattern.']
], r: 'Seventh arpeggios through the turnaround at 70 without stopping.' },

'lh-patterns': { f: 'Left-hand patterns that make your playing move.', b: [
  [4, 'Octaves', 'Left hand octaves on the root, beats 1 and 3, under right-hand chords. C – Am – F – G at 70.'],
  [4, 'Root – 5th – octave', 'C G C (and back) for each chord. Then F C F, G D G. Keep the right hand holding chords.'],
  [4, 'Walking to the next', 'On beat 4, play a note one step above or below the next root (to go C → F: C, C, C, E then F). Smooth bass.'],
  [3, 'Mix them', 'Play eight bars of the turnaround using octaves for 2 bars, root – 5th for 2 bars, and walking for 4 bars.']
], r: 'Three left-hand patterns under a steady right hand at 80.' },

/* ============ Reading ============ */
'staff-clefs': { f: 'Find the notes of the staff on your piano.', b: [
  [4, 'Landmarks', 'Treble G (2nd line) = G above middle C. Bass F (4th line) = F below middle C. Middle C is between the staves. Play these three again and again.'],
  [4, 'Lines and spaces', 'Treble lines E G B D F, spaces F A C E. Bass lines G B D F A, spaces A C E G. Play each set on the piano, saying the names.'],
  [4, 'From the book', 'Open any hymn book. Find five notes on the treble staff and five on the bass, name them, then play them.'],
  [3, 'Quick find', 'Say "treble third line" or "bass second space" and play the note. Ten calls.']
], r: 'You can play any line or space note in both clefs within three seconds.' },

'treble-notes': { f: 'Read treble-clef notes fluently.', b: [
  [4, 'Line notes', 'Play E G B D F (Every Good Boy Deserves Fruit) from E above middle C, right hand. Then the spaces F A C E.'],
  [5, 'Read a melody', 'From a hymn book or the app\'s songbook, read the right-hand melody of one line, slowly, saying each note name before you play it.'],
  [3, 'Step and skip', 'Notes that move line to space are steps; line to line are skips. In your hymn line, point out steps and skips and play them without naming.'],
  [3, 'Flash cards', 'Write ten notes on paper (or use the Sight-reading drill), cover the answers, read them aloud and play.']
], r: 'You read a simple one-line hymn melody at a slow steady pace.' },

'bass-notes': { f: 'Read bass-clef notes fluently.', b: [
  [4, 'Line notes', 'Bass lines G B D F A (Good Boys Do Fine Always). Left hand plays each, from G two octaves below middle C.'],
  [4, 'Spaces', 'A C E G (All Cows Eat Grass). Play them, then mix lines and spaces.'],
  [4, 'Read a bass line', 'Read the bass part of one hymn line, left hand only, slowly, saying names.'],
  [3, 'Both clefs', 'Play the treble melody note and the bass note together for the first four beats of the hymn.']
], r: 'You read a hymn bass part slowly with no counting up from a landmark.' },

'ledger-middle-c': { f: 'Read ledger-line notes around middle C.', b: [
  [4, 'Middle C both ways', 'Middle C is one ledger line below treble and one above bass. Play it from both clefs on paper. Then B, A below and D, E above.'],
  [4, 'High and low', 'Treble ledger lines above: A (1 line), C (2 lines). Bass ledger lines below: E (1 line), C (2 lines). Find and play each.'],
  [4, 'Read across', 'Play a melody that crosses middle C between hands: right hand C D E, left hand C B A. Slowly.'],
  [3, 'Quick test', 'Point at ledger notes in a hymn book and play them. Ten notes.']
], r: 'You play ledger notes near middle C from either staff without hesitation.' },

'staff-accidentals': { f: 'Read sharps, flats and naturals correctly.', b: [
  [4, 'Play the sign', 'On paper write C, C♯, D, D♭, E, E♭, F♯, B♭ and play each. A sharp is the key to the right; a flat, to the left.'],
  [4, 'Through the bar', 'An accidental lasts until the end of the bar. Read a hymn line with accidentals and circle where they stop.'],
  [4, 'Naturals', 'A natural cancels a sharp or flat. Play F♯ then F♮, B♭ then B♮, five times each.'],
  [3, 'Sight read', 'Read one line of music with accidentals slowly, saying the full note name (for example "F sharp").']
], r: 'You play accidentals correctly, including when they carry through a bar.' },

'key-signatures-staff': { f: 'Play in the right key from the key signature.', b: [
  [4, 'Read and name', 'Look at five hymn key signatures. Count the sharps or flats and name the key (one sharp = G, two flats = B♭).'],
  [4, 'Play the scale', 'For each key signature play the major scale before reading the music. Your hands learn which black keys to use.'],
  [4, 'Read a line', 'Read one hymn line in a sharp key and one in a flat key, slowly.'],
  [3, 'Common church keys', 'Play the key chord and scale for E♭, A♭, B♭, F, G and D in a row.']
], r: 'You can read a hymn melody in a key with up to three flats without missing the black keys.' },

'rhythm-notation': { f: 'Read and play rhythms from the page.', b: [
  [4, 'Clap first', 'Clap and count four bars of hymn rhythm aloud ("1 2 3 4"). Then play them on one note.'],
  [4, 'Dotted notes', 'A dot adds half the value: dotted half = 3 beats, dotted quarter = 1½. Play bars with dotted notes on C, counting "1 & 2 &".'],
  [4, 'Rests', 'Read a line with rests. Lift your hand on the rest and count it aloud. Silence is part of the music.'],
  [3, 'Melody in rhythm', 'Read one hymn melody line with the metronome at 60, correct notes and correct rhythm.']
], r: 'One hymn line with correct rhythm at 60, including dotted notes and rests.' },

'chord-symbols-reading': { f: 'Turn chord symbols and staff chords into playing.', b: [
  [4, 'Symbols', 'Play C, Cm, C7, Cmaj7, Cm7, Csus4 and C/E from the symbol alone. Then the same on F and G.'],
  [4, 'From a lead sheet', 'Take a song with chord symbols above the melody. Play the chords only, 4 beats each, with a bass note.'],
  [4, 'Stacked notes', 'In a hymn, look at the four notes on beat 1 of each bar. Name the chord they make. Play them.'],
  [3, 'Melody and chords', 'Right hand melody, left hand plays the chord root (or a simple chord) from the symbols. Slowly.']
], r: 'You play any chord symbol on sight and accompany a lead sheet with roots and chords.' },

'first-sight-reading': { f: 'Read new music without stopping.', b: [
  [3, 'Look first', 'Before playing a new piece: key, time signature, highest and lowest notes, tricky rhythms. 60 seconds.'],
  [6, 'Read three new pieces', 'Use the Sight-reading drill or a hymn book. Play each at a slow tempo (50) without stopping, even if you miss notes. Keep the beat going.'],
  [3, 'Eyes ahead', 'Cover the bar you are playing with a card so you must look one bar ahead. Read one line this way.'],
  [3, 'Repeat-free', 'Read a fourth new piece once. Mark what went wrong, but do not practise it. Sight-reading is a new piece every day.']
], r: 'You can play a new simple hymn line at 50 without stopping.' }

});
