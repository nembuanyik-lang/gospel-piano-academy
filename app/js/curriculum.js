/* Gospel Music Academy — curriculum as data.
   Nothing in the UI knows about specific lessons. To add a lesson, add an entry to
   LESSONS and list its id in a module. Prerequisites default to "the previous lesson
   in the module" unless `req` is given. */
(function (root) {
'use strict';

const q = (text, o, a, why, x) => Object.assign({ q: text, o, a, why }, x || {});
const ch = (r, quality, x) => Object.assign({ root: r, quality }, x || {});
const bassCh = (r, quality, x) => Object.assign({ root: r, quality, bass: true }, x || {});
const CHORD_LISTEN = (r, quality, mode) => ({ kind: 'chord', root: r, quality, oct: 4, mode: mode || 'block' });

const LESSONS = [

/* =============================== LEVEL 1 · KEYBOARD =============================== */
{
  id: 'keyboard-layout', cat: 'Keyboard', title: 'Meet the keyboard', minutes: 6,
  why: 'Every chord, scale and song sits on this pattern. Once you can find your way around, you never have to count keys.',
  objective: 'Find any C or F on the keyboard using the groups of black keys.',
  theory: [
    'The piano has white keys and black keys. The black keys come in groups of two and groups of three. These groups are your map.',
    'Find a group of two black keys. The white key just to the left of that group is C. Every C on the piano is found this way.',
    'Now find a group of three black keys. The white key just to the left of that group is F. Sounds get higher as you move right and lower as you move left.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Every C sits just left of a group of two black keys.', hi: ['C'] },
    { caption: 'Every F sits just left of a group of three black keys.', hi: ['F'] },
    { caption: 'Low sounds are on the left, high sounds on the right.', hi: ['C3', 'C4', 'C5'] }
  ] },
  listen: [{ label: 'Low to high: C3, C4, C5', spec: { kind: 'notes', notes: ['C3', 'C4', 'C5'], d: 1.2 } }],
  play: { type: 'find', names: ['C'], count: 4, range: [48, 72], prompt: 'Play a C four times. Any C will do.' },
  practice: [{ type: 'find', names: ['C', 'F'], count: 6, range: [48, 72], prompt: 'Play the note shown. Use the black-key groups to find it.' }],
  apply: { text: 'Gospel pianists find the key by feel. When a worship leader says "we are in F", your hand lands on F without looking down. Landmarks are how you build that habit.' },
  challenge: { type: 'find', names: ['C', 'F'], count: 8, range: [48, 72], maxMiss: 2, prompt: 'Challenge: eight notes, at most two mistakes.' },
  quiz: [
    q('Which white key sits just left of a group of two black keys?', ['C', 'D', 'F', 'A'], 0, 'C is always just left of the pair of black keys.', { show: { range: [48, 72], hi: ['C#', 'D#'] } }),
    q('Which white key sits just left of a group of three black keys?', ['E', 'F', 'G', 'B'], 1, 'F is always just left of the group of three.'),
    q('Moving to the right on the keyboard, the sound gets…', ['Lower', 'Higher', 'Quieter', 'The same'], 1, 'Right is higher, left is lower.')
  ]
},
{
  id: 'musical-alphabet', cat: 'Keyboard', title: 'The musical alphabet and octaves', minutes: 6,
  why: 'Knowing the seven note names and the octave lets you talk about any note, in any song.',
  objective: 'Name the seven musical letters and play the same note in different octaves.',
  theory: [
    'Music uses seven letters: A B C D E F G. After G the pattern starts again at A, over and over, all the way up the keyboard.',
    'From one C to the next C is an octave. The two notes have the same name but one sounds higher. Singers use octaves all the time when a melody is too high or low.',
    'This app writes a number after the letter to show which octave. C4 is middle C, near the centre of the piano. C5 is the next C up, C3 the next C down.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C4 is middle C.', hi: ['C4'] },
    { caption: 'C4 and C5 are one octave apart. Same letter, higher sound.', hi: ['C4', 'C5'] },
    { caption: 'C3, C4 and C5: three octaves of the same note.', hi: ['C3', 'C4', 'C5'] }
  ] },
  listen: [{ label: 'C4 then C5', spec: { kind: 'notes', notes: ['C4', 'C5'], d: 1.3 } }, { label: 'Both together', spec: { kind: 'notes', notes: ['C4', 'C5'], mode: 'block' } }],
  play: { type: 'seq', notes: ['C4', 'C5', 'C3'], hints: true, range: [48, 72], prompt: 'Play C4, then C5, then C3.' },
  practice: [{ type: 'seq', notes: ['C3', 'C4', 'C5', 'C4', 'C3'], hints: true, range: [48, 72], prompt: 'Climb the octaves and come back down.' }],
  apply: { text: 'When a song is too high for a singer you move the key, but within a song gospel players also double the bass in octaves for a bigger sound. That starts with hearing an octave.' },
  challenge: { type: 'seq', notes: ['C5', 'C3', 'C4', 'C5', 'C4'], hints: false, maxMiss: 2, range: [48, 72], prompt: 'Challenge: play C5, C3, C4, C5, C4 with no hints.' },
  quiz: [
    q('What letter comes after G?', ['H', 'A', 'B', 'F'], 1, 'The alphabet loops: G is followed by A.'),
    q('How many different letter names does music use?', ['5', '7', '8', '12'], 1, 'A B C D E F G. Seven.'),
    q('Two notes with the same name, one higher than the other, are an…', ['Octave', 'Chord', 'Scale', 'Beat'], 0, 'The distance between two notes with the same name is an octave.')
  ]
},
{
  id: 'white-notes', cat: 'Keyboard', title: 'Naming the white keys', minutes: 8,
  why: 'Once every white key has a name in your hands, you can follow any chord chart.',
  objective: 'Name and play every white key from C to the next C.',
  theory: [
    'Around the group of two black keys: C is on the left, D sits between the two, E is on the right.',
    'Around the group of three: F is on the left, G and A sit between the black keys, B is on the right.',
    'Then it repeats: C D E F G A B C. Say the names out loud as you play. It speeds up learning.'
  ],
  visual: { range: [60, 72], labels: 'names', steps: [
    { caption: 'C D E: around the group of two black keys.', hi: ['C4', 'D4', 'E4'] },
    { caption: 'F G A B: around the group of three black keys.', hi: ['F4', 'G4', 'A4', 'B4'] },
    { caption: 'All seven, then C again.', hi: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] }
  ] },
  listen: [{ label: 'C to C, one note at a time', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], d: 0.6 } }],
  play: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], hints: true, prompt: 'Play C D E F G A B C, left to right.' },
  practice: [{ type: 'find', names: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], count: 10, range: [48, 72], prompt: 'Play the note shown. Any octave counts.' }],
  apply: { text: 'Chord charts only give you letter names: C, F, G, Am. Instant recall of the white keys is what lets you play along with a chart in real time.' },
  challenge: { type: 'seq', notes: ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], hints: false, maxMiss: 3, prompt: 'Challenge: play C to C backwards, no hints.' },
  quiz: [
    q('Which white key sits between the two black keys of the group of two?', ['C', 'D', 'E', 'F'], 1, 'D is in the middle of the pair of black keys.', { show: { range: [60, 72], hi: ['C#4', 'D#4'] } }),
    q('Which white key is just right of the group of three black keys?', ['A', 'B', 'C', 'G'], 1, 'B comes right after the group of three, then C starts again.'),
    q('Which note is just left of E?', ['C', 'D', 'F', 'G'], 1, 'The order is C D E, so D is just left of E.')
  ]
},
{
  id: 'sharps-flats', cat: 'Keyboard', title: 'Sharps and flats', minutes: 8,
  why: 'Most keys that singers use need black keys. You will meet them in nearly every song.',
  objective: 'Find sharps and flats on the black keys and explain half steps.',
  theory: [
    'A half step is the distance from one key to the very next key, black or white. A whole step is two half steps.',
    'A sharp (♯) raises a note by a half step, to the next key on the right. A flat (♭) lowers it by a half step, to the next key on the left.',
    'So each black key has two names. The black key between C and D is C♯ and also D♭. Which name you use depends on the key of the song.',
    'E to F and B to C are half steps with no black key between them. Keep an eye on those two spots.'
  ],
  visual: { range: [60, 72], labels: 'names', steps: [
    { caption: 'C♯ (also D♭) is a half step above C.', hi: ['C4', 'C#4', 'D4'] },
    { caption: 'E to F is a half step with no black key between.', hi: ['E4', 'F4'] },
    { caption: 'B to C is the other natural half step.', hi: ['B4', 'C5'] }
  ] },
  listen: [{ label: 'Half steps from C to G', spec: { kind: 'notes', notes: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'], d: 0.5 } }],
  play: { type: 'seq', notes: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4'], hints: true, prompt: 'Play every key from C to F, black and white.' },
  practice: [{ type: 'find', names: ['F#', 'Bb', 'C#', 'Eb', 'G#', 'Ab'], count: 8, range: [48, 72], prompt: 'Find the black key. Either name works for the same key.' }],
  apply: { text: 'Gospel is often played in flat keys such as D♭, E♭ and A♭ because they suit many voices. Black keys are not hard, they just need a name.' },
  challenge: { type: 'seq', notes: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'], hints: false, maxMiss: 3, prompt: 'Challenge: C up to G, one half step at a time, no hints.' },
  quiz: [
    q('What is the black key just right of F called?', ['F♯ (or G♭)', 'E♭', 'A♭', 'D♯'], 0, 'One half step above F is F♯, which is also G♭.'),
    q('Which two white notes have no black key between them?', ['C and D', 'E and F', 'F and G', 'A and B'], 1, 'E to F is a half step, and so is B to C.', { show: { range: [60, 72], hi: ['E4', 'F4'] } }),
    q('A flat sign (♭) does what to a note?', ['Raises it a half step', 'Lowers it a half step', 'Makes it louder', 'Makes it longer'], 1, 'Flat means lower by a half step.')
  ]
},
{
  id: 'posture-fingers', cat: 'Keyboard', title: 'Posture and finger numbers', minutes: 7,
  why: 'Good habits now prevent tension and let you play fast and gently later.',
  objective: 'Sit well, number your fingers, and play the five-finger C position in both hands.',
  theory: [
    'Sit on the front half of the bench with a tall back. Let your forearms be level with the keys and your wrists relaxed. Curve your fingers as if you are holding a small ball. Shoulders down.',
    'Fingers are numbered 1 to 5 in both hands, starting from the thumb: 1 thumb, 2 index, 3 middle, 4 ring, 5 pinky.',
    'In the C position, your right thumb (1) rests on C and your fingers lie on C D E F G. Your left pinky (5) is on C and the thumb (1) on G.'
  ],
  visual: { range: [48, 72], labels: 'fingers', steps: [
    { caption: 'Right hand, C position: 1 2 3 4 5 on C D E F G.', hi: ['C4', 'D4', 'E4', 'F4', 'G4'], fingers: { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 } },
    { caption: 'Left hand, C position: 5 4 3 2 1 on C D E F G.', hi: ['C3', 'D3', 'E3', 'F3', 'G3'], fingers: { C3: 5, D3: 4, E3: 3, F3: 2, G3: 1 } }
  ] },
  listen: [{ label: 'The five notes of the C position', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'], d: 0.5 } }],
  play: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'], fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1], hints: true, prompt: 'Right hand: play C up to G and back, using fingers 1 to 5.' },
  practice: [{ type: 'seq', notes: ['C3', 'D3', 'E3', 'F3', 'G3', 'F3', 'E3', 'D3', 'C3'], fingers: [5, 4, 3, 2, 1, 2, 3, 4, 5], hints: true, range: [48, 72], prompt: 'Left hand: C up to G and back, fingers 5 down to 1.' }],
  apply: { text: 'Long worship sets can last an hour. A relaxed hand and curved fingers are what let you keep playing sustained chords without pain.' },
  challenge: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'C3', 'D3', 'E3', 'F3', 'G3'], fingers: [1, 2, 3, 4, 5, 5, 4, 3, 2, 1], hints: false, maxMiss: 3, range: [48, 72], prompt: 'Challenge: right hand up, then left hand up. No hints.' },
  quiz: [
    q('Which finger number is the thumb?', ['1', '2', '3', '5'], 0, 'Thumbs are always 1 and pinkies are always 5.'),
    q('In the right-hand C position, finger 3 plays…', ['C', 'D', 'E', 'G'], 2, 'Fingers 1 to 5 play C D E F G, so finger 3 plays E.'),
    q('Which describes a good hand shape?', ['Flat, stiff fingers', 'Curved fingers, relaxed wrists', 'Wrists high, fingers straight', 'Tight shoulders'], 1, 'Curved, relaxed hands are faster and gentler on the body.')
  ]
},

/* =============================== LEVEL 1 · RHYTHM =============================== */
{
  id: 'beat', cat: 'Rhythm', title: 'Feel the beat', minutes: 7, req: ['keyboard-layout'],
  why: 'Rhythm is what makes people move and sing together. A steady beat is the first skill of every accompanist.',
  objective: 'Tap a steady beat in time with a metronome.',
  theory: [
    'The beat is the steady pulse in music, like walking or a heartbeat. You tap your foot to it.',
    'Tempo is how fast the beat goes, measured in beats per minute (BPM). At 60 BPM there is one beat every second.',
    'Roughly, slow worship sits around 60 to 72 BPM, mid-tempo songs around 90 to 110, and fast praise 120 and above.'
  ],
  listen: [{ label: 'Slow: 60 BPM', spec: { kind: 'metro', bpm: 60, bars: 2 } }, { label: 'Medium: 90 BPM', spec: { kind: 'metro', bpm: 90, bars: 2 } }, { label: 'Fast: 130 BPM', spec: { kind: 'metro', bpm: 130, bars: 2 } }],
  play: { type: 'tap', bpm: 70, bpb: 4, pattern: [1, 1, 1, 1, 1, 1, 1, 1], prompt: 'After the count-in, tap on every click. Use the big pad, or press the space bar.' },
  practice: [{ type: 'tap', bpm: 90, bpb: 4, pattern: [1, 1, 1, 1, 1, 1, 1, 1], prompt: 'Faster now: 90 BPM.' }],
  apply: { text: 'In gospel the band locks to the drummer and the bass. Your chords will always land on a beat or a division of one, so steady time is what holds the song together.' },
  challenge: { type: 'tap', bpm: 60, bpb: 4, tol: 0.14, pattern: [1, 1, 1, 1, 1, 1, 1, 1], prompt: 'Challenge: 60 BPM with a tighter timing window. Slow is harder than it sounds.' },
  quiz: [
    q('BPM stands for…', ['Beats per minute', 'Bass pitch mode', 'Bars per measure', 'Basic piano method'], 0, 'Beats per minute is the speed of the pulse.'),
    q('At 60 BPM, how often does a beat fall?', ['Twice a second', 'Once a second', 'Once every two seconds', 'Once a minute'], 1, '60 beats in 60 seconds is one per second.'),
    q('Which tempo is the fastest?', ['60 BPM', '72 BPM', '100 BPM', '130 BPM'], 3, 'A higher BPM means a faster beat.')
  ]
},
{
  id: 'note-values', cat: 'Rhythm', title: 'Note values', minutes: 8,
  why: 'Note values tell you how long each sound lasts, so chords and melodies line up with the beat.',
  objective: 'Understand whole, half, quarter and eighth notes and tap simple rhythms.',
  theory: [
    'In 4/4 time you count 1 2 3 4. A quarter note lasts one beat. A half note lasts two beats. A whole note lasts four beats.',
    'An eighth note lasts half a beat, so two fit in one beat. Count them 1 & 2 & 3 & 4 &.',
    'A rest is silence for the same length. Silence is part of rhythm.'
  ],
  visual: { rhythm: true },
  listen: [
    { label: 'One whole note', spec: { kind: 'rhythm', pattern: [4], bpm: 80 } },
    { label: 'Two half notes', spec: { kind: 'rhythm', pattern: [2, 2], bpm: 80 } },
    { label: 'Four quarter notes', spec: { kind: 'rhythm', pattern: [1, 1, 1, 1], bpm: 80 } },
    { label: 'Eight eighth notes', spec: { kind: 'rhythm', pattern: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], bpm: 80 } }
  ],
  play: { type: 'tap', bpm: 70, bpb: 4, pattern: [1, 1, 2, 1, 1, 2], prompt: 'Tap: quarter, quarter, half. Then again. The click keeps going.' },
  practice: [{ type: 'tap', bpm: 70, bpb: 4, pattern: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1], prompt: 'Mix of quarters and eighths. Tap each note as it starts.' }],
  apply: { text: 'A lot of gospel groove comes from eighth notes and from leaving space. Pianists often play chords on the "and" of the beat, which you can only do once the division is natural.' },
  challenge: { type: 'tap', bpm: 70, bpb: 4, pattern: [0.5, 0.5, 1, 0.5, 0.5, 1, 2, 1], prompt: 'Challenge: faster subdivisions, 70 BPM.' },
  quiz: [
    q('How many beats does a half note last in 4/4?', ['1', '2', '3', '4'], 1, 'Whole = 4, half = 2, quarter = 1.'),
    q('How many eighth notes fit in one beat?', ['1', '2', '4', '8'], 1, 'An eighth note is half a beat, so two make a beat.'),
    q('How many quarter notes fill one whole note?', ['2', '3', '4', '8'], 2, 'A whole note is four beats, and each quarter is one.')
  ]
},
{
  id: 'time-signatures', cat: 'Rhythm', title: 'Time signatures', minutes: 8,
  why: 'The time signature tells you how the beats group, which changes how a song feels and where you place the bass.',
  objective: 'Tell 4/4, 3/4 and 6/8 apart and tap each.',
  theory: [
    'A time signature has two numbers. The top says how many beats are in each bar. The bottom says which note gets one beat, and 4 means a quarter note.',
    '4/4 counts 1 2 3 4, with the strongest beat on 1. 3/4 counts 1 2 3, a waltz feel.',
    '6/8 has six eighth-note beats felt in two groups of three: ONE two three FOUR five six. It rolls. You will hear it in many slow gospel and worship songs.'
  ],
  listen: [
    { label: '4/4: strong beat on 1', spec: { kind: 'metro', bpm: 90, bpb: 4, bars: 3 } },
    { label: '3/4: waltz', spec: { kind: 'metro', bpm: 90, bpb: 3, bars: 4 } },
    { label: '6/8: two groups of three', spec: { kind: 'metro', bpm: 150, bpb: 6, bars: 3 } }
  ],
  play: { type: 'tap', bpm: 80, bpb: 3, pattern: [1, 1, 1, 1, 1, 1], prompt: 'Tap in 3/4. Feel the strong click on 1.' },
  practice: [{ type: 'tap', bpm: 100, bpb: 6, pattern: [1, 1, 1, 1, 1, 1], prompt: 'Tap six beats in 6/8 at a gentle speed. The accent falls on 1 only.' }],
  apply: { text: 'Slow gospel ballads and many worship songs are in 6/8 or 12/8. When you play a left-hand bass pattern, it is the time signature that tells you where the bass note goes.' },
  challenge: { type: 'tap', bpm: 80, bpb: 4, pattern: [1, 0.5, 0.5, 1, 1, 1, 1, 2], prompt: 'Challenge: a 4/4 pattern with eighth notes.' },
  quiz: [
    q('In 3/4 time, how many beats are in each bar?', ['2', '3', '4', '6'], 1, 'The top number is the beats per bar.'),
    q('Which time signature feels like two groups of three?', ['4/4', '3/4', '6/8', '2/2'], 2, '6/8 is felt as ONE two three FOUR five six.'),
    q('The beat that is usually strongest in a bar is…', ['The last beat', 'Beat 1', 'Beat 3 only', 'None'], 1, 'Beat 1 (the downbeat) is usually strongest.')
  ]
},

/* =============================== LEVEL 1 · SCALES AND MELODIES =============================== */
{
  id: 'c-major-scale', cat: 'Scales', title: 'The C major scale', minutes: 9, req: ['white-notes', 'posture-fingers'],
  why: 'Scales are the alphabet of melody. Almost every song you play is made from the notes of one.',
  objective: 'Play the C major scale up and down with the right fingering.',
  theory: [
    'A scale is a ladder of notes in order. The C major scale is all the white keys from C to C. No sharps and no flats.',
    'Each note is a scale degree, numbered 1 to 8. C is 1, D is 2, E is 3, F is 4, G is 5, A is 6, B is 7.',
    'Right-hand fingering going up: 1 2 3, then tuck your thumb under to play F with finger 1, then 2 3 4 5. Keep your hand quiet and the sound even.'
  ],
  visual: { range: [60, 72], labels: 'fingers', steps: [
    { caption: 'Right hand fingering: 1 2 3 then thumb under, 1 2 3 4 5.', hi: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], fingers: { C4: 1, D4: 2, E4: 3, F4: 1, G4: 2, A4: 3, B4: 4, C5: 5 } },
    { caption: 'Degree 5 (G) is a key landmark. Chords are often built from degrees 1, 3 and 5.', hi: ['C4', 'E4', 'G4'] }
  ] },
  listen: [{ label: 'C major scale, slow', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], d: 0.5 } }],
  play: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], fingers: [1, 2, 3, 1, 2, 3, 4, 5], hints: true, prompt: 'Play the C major scale up one octave.' },
  practice: [{ type: 'seq', notes: ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], fingers: [5, 4, 3, 2, 1, 3, 2, 1], hints: true, prompt: 'Now come down. Finger 3 crosses over the thumb.' }],
  apply: { text: 'Melodies, bass lines and runs in gospel are mostly built from the major scale and its relatives. A smooth, even scale is the base for fills and runs later.' },
  challenge: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], hints: false, maxMiss: 3, prompt: 'Challenge: up and down the C major scale with no hints.' },
  quiz: [
    q('How many sharps or flats does C major have?', ['None', 'One', 'Two', 'Seven'], 0, 'C major uses only white keys.'),
    q('What is the 5th note (degree 5) of C major?', ['F', 'G', 'A', 'B'], 1, 'C D E F G: the fifth note is G.'),
    q('In the right-hand scale, after finger 3 you…', ['Stop', 'Tuck the thumb under', 'Switch hands', 'Lift your wrist high'], 1, 'The thumb passes under so your hand can keep moving.')
  ]
},
{
  id: 'major-scale-formula', cat: 'Scales', title: 'How major scales are built', minutes: 10, req: ['c-major-scale', 'sharps-flats'],
  why: 'One recipe builds a major scale in every key. Learn it once and you can work out any key signature.',
  objective: 'Use the whole step and half step recipe to build G, F and D major.',
  theory: [
    'Every major scale follows the same recipe: whole, whole, half, whole, whole, whole, half. Written W W H W W W H.',
    'In C the half steps fall naturally at E to F and B to C, so all the notes are white keys.',
    'Start on G and follow the same recipe: G A B C D E then F♯ then G. The recipe needs F♯ so that the last step is a half step. G major has one sharp.',
    'F major goes the other way: F G A B♭ C D E F. One flat. D major has two sharps: F♯ and C♯.'
  ],
  visual: { range: [60, 84], labels: 'names', steps: [
    { caption: 'G major: G A B C D E F♯ G. One sharp.', hi: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'] },
    { caption: 'F major: F G A B♭ C D E F. One flat.', hi: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'] },
    { caption: 'D major: D E F♯ G A B C♯ D. Two sharps.', hi: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'] }
  ] },
  listen: [{ label: 'G major', spec: { kind: 'notes', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], d: 0.5 } }, { label: 'F major', spec: { kind: 'notes', notes: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], d: 0.5 } }],
  play: { type: 'seq', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], hints: true, range: [60, 84], prompt: 'Play the G major scale.' },
  practice: [{ type: 'seq', notes: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], hints: true, range: [60, 84], prompt: 'Play the F major scale. Watch for the B♭.' }],
  apply: { text: 'Singers pick the key. Gospel keyboardists are asked for D♭, E♭, A♭ and others all the time. If you know the recipe, you can build the scale for any key you are handed.' },
  challenge: { type: 'seq', notes: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'], hints: false, maxMiss: 3, range: [60, 84], prompt: 'Challenge: D major, no hints. Remember the two sharps.' },
  quiz: [
    q('Which pattern builds every major scale?', ['W W H W W W H', 'W H W H W W H', 'H W W H W W W', 'W W W H W W H'], 0, 'Whole, whole, half, whole, whole, whole, half.'),
    q('Which note does G major need that C major does not?', ['B♭', 'F♯', 'C♯', 'E♭'], 1, 'G major has one sharp: F♯.'),
    q('How many sharps does D major have?', ['0', '1', '2', '3'], 2, 'D major has F♯ and C♯.'),
    q('F major has one flat. Which is it?', ['B♭', 'E♭', 'A♭', 'D♭'], 0, 'F major contains B♭.')
  ]
},
{
  id: 'first-melody', cat: 'Scales', title: 'Your first melody', minutes: 10, req: ['c-major-scale', 'note-values'],
  why: 'This is where scales turn into music. You will play a tune that people have sung for over a century.',
  objective: 'Play the melody of "Joyful, Joyful, We Adore Thee" in the C position.',
  theory: [
    'This melody, from Beethoven’s Ninth Symphony, was fitted with the hymn words "Joyful, Joyful, We Adore Thee" in 1907. Both the tune and the words are in the public domain.',
    'It moves mostly by step, to the next note on the white keys, with a few repeated notes. That makes it easy to find under your fingers.',
    'Use fingers 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3 2 2. Your hand stays in one position. Play it slowly and evenly.'
  ],
  visual: { range: [60, 72], labels: 'fingers', steps: [
    { caption: 'Hand position: finger 1 on C, finger 5 on G.', hi: ['C4', 'D4', 'E4', 'F4', 'G4'], fingers: { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 } }
  ] },
  listen: [{ label: 'First phrase', spec: { kind: 'notes', notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'], d: 0.7 } }],
  play: { type: 'seq', notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'], fingers: [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2], hints: true, prompt: 'Play the first phrase, note by note.' },
  practice: [{ type: 'seq', notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'], fingers: [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2], hints: false, maxMiss: 4, prompt: 'Same phrase from memory. Hints are off.' }],
  apply: { text: 'A worship pianist often plays the melody alone in the right hand during a quiet moment so the congregation can find the tune. Knowing a melody by heart lets you do that.' },
  challenge: { type: 'seq', notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'D4', 'C4', 'C4'], fingers: [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 2, 1, 1], hints: false, maxMiss: 3, prompt: 'Challenge: the second phrase. It ends differently, on C.' },
  quiz: [
    q('Which note does the melody start on?', ['C', 'D', 'E', 'G'], 2, 'It starts E E F G.'),
    q('How does this melody mostly move?', ['By big leaps', 'By step, to the next note', 'In chords only', 'Only on black keys'], 1, 'Most notes are neighbours: this is called stepwise motion.'),
    q('In this hand position, which finger plays C?', ['1', '3', '4', '5'], 0, 'Finger 1 rests on C.')
  ]
},
{
  id: 'two-hands', cat: 'Scales', title: 'Two hands: bass and melody', minutes: 10, req: ['first-melody'],
  why: 'Two hands with two jobs is the heart of piano accompaniment: bass below, tune on top.',
  objective: 'Play a left-hand bass note followed by a right-hand melody, and move between them.',
  theory: [
    'Left hand plays the bass: a single low note, usually the root of the chord. Right hand plays the melody or the chord above.',
    'The bass gives the song its foundation. The right hand sits well above it so the two parts do not blur.',
    'Here the left hand plays C, then F, then G, each followed by three right-hand notes. Play bass note, then the three notes, then change bass.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Left hand: bass C3. Right hand: E4 D4 C4.', hi: ['C3', 'E4', 'D4', 'C4'] },
    { caption: 'Left hand: bass F3. Right hand: A4 G4 F4.', hi: ['F3', 'A4', 'G4', 'F4'] },
    { caption: 'Left hand: bass G3. Right hand: B4 A4 G4.', hi: ['G3', 'B4', 'A4', 'G4'] }
  ] },
  listen: [{ label: 'The pattern', spec: { kind: 'notes', notes: ['C3', 'E4', 'D4', 'C4', 'F3', 'A4', 'G4', 'F4', 'G3', 'B4', 'A4', 'G4', 'C3', 'C4'], d: 0.5 } }],
  play: { type: 'seq', notes: ['C3', 'E4', 'D4', 'C4', 'F3', 'A4', 'G4', 'F4', 'G3', 'B4', 'A4', 'G4', 'C3', 'C4'], hints: true, range: [48, 72], prompt: 'Left hand bass, then right hand notes, following the highlights.' },
  practice: [{ type: 'seq', notes: ['C3', 'E4', 'D4', 'C4', 'F3', 'A4', 'G4', 'F4', 'G3', 'B4', 'A4', 'G4', 'C3', 'C4'], hints: false, maxMiss: 4, range: [48, 72], prompt: 'Again with the hints off.' }],
  apply: { text: 'Even in a full gospel arrangement the left hand is still doing this job: root notes underneath, with passing notes between chords that you will learn later.' },
  challenge: { type: 'seq', notes: ['C3', 'G4', 'E4', 'C4', 'G3', 'D5', 'B4', 'G4', 'F3', 'C5', 'A4', 'F4', 'C3', 'E4', 'C4'], hints: false, maxMiss: 3, range: [48, 76], prompt: 'Challenge: bass notes C, G, F, C with higher right-hand shapes. No hints.' },
  quiz: [
    q('Which hand usually plays the bass?', ['Left', 'Right', 'Either, always together', 'Neither'], 0, 'The left hand plays the low bass.'),
    q('The bass note is usually the chord’s…', ['Root', 'Seventh', 'Highest note', 'Third only'], 0, 'The root is the note the chord is named after.'),
    q('Why keep bass and melody far apart?', ['They stay clear and do not blur', 'It is louder', 'It is a rule with no reason', 'Only for looks'], 0, 'Low and high parts are easier to hear when they are separated.')
  ]
},

/* =============================== LEVEL 1 · BASIC CHORDS =============================== */
{
  id: 'triad-major', cat: 'Chords', title: 'Major triads: C, F and G', minutes: 9, req: ['white-notes'],
  why: 'Chords are what you play under a singer. Three major chords already unlock hundreds of songs.',
  objective: 'Build and play the C, F and G major triads.',
  theory: [
    'A chord is three or more notes played together. The simplest chord is the triad, which has three notes: root, third and fifth.',
    'A major triad is the root, then a note 4 half steps up (the major third), then a note 7 half steps above the root (the perfect fifth).',
    'On white keys, skip a key between each note: C E G is C major, F A C is F major, G B D is G major. Major chords sound bright and settled.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C major: C E G. Root, third, fifth.', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: 'F major: F A C.', chord: { root: 'F', quality: 'major', oct: 4 } },
    { caption: 'G major: G B D.', chord: { root: 'G', quality: 'major', oct: 4 } }
  ] },
  listen: [{ label: 'C major', spec: CHORD_LISTEN('C', 'major', 'both') }, { label: 'F major', spec: CHORD_LISTEN('F', 'major', 'both') }, { label: 'G major', spec: CHORD_LISTEN('G', 'major', 'both') }],
  play: { type: 'chord', targets: [ch('C', 'major'), ch('F', 'major'), ch('G', 'major')], hints: true, prompt: 'Play C, then F, then G. Press the three notes together, or one after another within a couple of seconds.' },
  practice: [{ type: 'chord', targets: [ch('C', 'major'), ch('F', 'major'), ch('G', 'major'), ch('C', 'major')], hints: true, prompt: 'Play C, F, G, C. This is the sound of I, IV, V, I.' }],
  apply: { text: 'C, F and G in the key of C are the 1, 4 and 5 chords. Many hymns, spirituals and early gospel songs use only these three.' },
  challenge: { type: 'chord', targets: [ch('C', 'major'), ch('G', 'major'), ch('F', 'major'), ch('C', 'major'), ch('F', 'major'), ch('G', 'major')], hints: false, prompt: 'Challenge: six chords, no hints.' },
  quiz: [
    q('Which notes make a C major triad?', ['C E G', 'C F A', 'C D E', 'C E♭ G'], 0, 'Root C, third E, fifth G.'),
    q('Which notes make an F major triad?', ['F A C', 'F B♭ C', 'F G A', 'F A D'], 0, 'F, A, C.'),
    q('How many half steps are between the root and the fifth of a major triad?', ['3', '5', '7', '12'], 2, 'The perfect fifth is 7 half steps above the root.')
  ]
},
{
  id: 'triad-minor', cat: 'Chords', title: 'Minor triads: Am, Dm and Em', minutes: 9,
  why: 'Minor chords add tenderness and depth. Almost every song mixes them with major chords.',
  objective: 'Turn a major triad into a minor one and play Am, Dm and Em.',
  theory: [
    'Lower the middle note (the third) of a major triad by one half step and you get a minor triad. C major is C E G. C minor is C E♭ G.',
    'A minor triad is the root, a note 3 half steps up (the minor third), and the perfect fifth. It sounds darker or more tender than major.',
    'On white keys the minor chords are A minor (A C E), D minor (D F A) and E minor (E G B). You write them Am, Dm, Em.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C major: C E G.', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: 'C minor: the E drops to E♭.', chord: { root: 'C', quality: 'minor', oct: 4 } },
    { caption: 'A minor: A C E.', chord: { root: 'A', quality: 'minor', oct: 4 } },
    { caption: 'D minor: D F A.', chord: { root: 'D', quality: 'minor', oct: 4 } },
    { caption: 'E minor: E G B.', chord: { root: 'E', quality: 'minor', oct: 4 } }
  ] },
  listen: [{ label: 'C major then C minor', spec: { kind: 'chords', list: [ch('C', 'major'), ch('C', 'minor')], d: 2 } }, { label: 'A minor', spec: CHORD_LISTEN('A', 'minor', 'both') }],
  play: { type: 'chord', targets: [ch('A', 'minor'), ch('D', 'minor'), ch('E', 'minor')], hints: true, prompt: 'Play Am, Dm, Em.' },
  practice: [{ type: 'chord', targets: [ch('A', 'minor'), ch('D', 'minor'), ch('E', 'minor'), ch('A', 'minor')], hints: true, prompt: 'Play Am, Dm, Em, Am.' }],
  apply: { text: 'C, Am, F and G is one of the most used sets of chords in gospel ballads. You can now play all four.' },
  challenge: { type: 'chord', targets: [ch('C', 'major'), ch('A', 'minor'), ch('F', 'major'), ch('G', 'major')], hints: false, prompt: 'Challenge: C, Am, F, G with no hints.' },
  quiz: [
    q('What changes when you turn a major triad into a minor triad?', ['The third is lowered a half step', 'The root moves', 'The fifth is removed', 'Nothing'], 0, 'Only the middle note (the third) drops by a half step.'),
    q('Which notes make an A minor triad?', ['A C E', 'A C♯ E', 'A D E', 'A C F'], 0, 'A, C, E.'),
    q('Which notes make a D minor triad?', ['D F A', 'D F♯ A', 'D G A', 'D E A'], 0, 'D, F, A.')
  ]
},
{
  id: 'major-vs-minor-ear', cat: 'Chords', title: 'Hearing major and minor', minutes: 8,
  why: 'Playing is only half of music. Your ear tells you whether a chord is right before you check the chart.',
  objective: 'Tell major and minor chords apart by ear and play both on the same root.',
  theory: [
    'Major chords usually sound bright, open and settled. Minor chords usually sound darker, softer or more serious.',
    'Listening for the difference is a skill that grows with repetition. Compare the same root: C against Cm, F against Fm, G against Gm.',
    'You can always check yourself on the keyboard. Which third did you hear: the higher one or the lower one?'
  ],
  listen: [
    { label: 'F major', spec: CHORD_LISTEN('F', 'major', 'both') }, { label: 'F minor', spec: CHORD_LISTEN('F', 'minor', 'both') },
    { label: 'G major', spec: CHORD_LISTEN('G', 'major', 'both') }, { label: 'G minor', spec: CHORD_LISTEN('G', 'minor', 'both') }
  ],
  play: { type: 'chord', targets: [ch('F', 'major'), ch('F', 'minor')], hints: true, prompt: 'Play F major, then F minor. Hear the third drop.' },
  practice: [{ type: 'chord', targets: [ch('G', 'major'), ch('G', 'minor')], hints: true, prompt: 'Now G major, then G minor.' }],
  apply: { text: 'Moving from a major chord to its minor, such as C to Cm, is a classic way to bring a moment of sorrow into a song before it resolves back to joy.' },
  challenge: { type: 'chord', targets: [ch('C', 'major'), ch('C', 'minor'), ch('C', 'major')], hints: false, prompt: 'Challenge: C, Cm, C with no hints.' },
  quiz: [
    q('Listen. Is this chord major or minor?', ['Major', 'Minor'], 0, 'B♭ major has the higher third (D).', { listen: CHORD_LISTEN('Bb', 'major') }),
    q('Listen. Is this chord major or minor?', ['Major', 'Minor'], 1, 'D minor has the lower third (F).', { listen: CHORD_LISTEN('D', 'minor') }),
    q('Listen. Is this chord major or minor?', ['Major', 'Minor'], 1, 'F♯ minor.', { listen: CHORD_LISTEN('F#', 'minor') }),
    q('Listen. Is this chord major or minor?', ['Major', 'Minor'], 0, 'A major.', { listen: CHORD_LISTEN('A', 'major') }),
    q('Listen. Is this chord major or minor?', ['Major', 'Minor'], 1, 'E minor.', { listen: CHORD_LISTEN('E', 'minor') })
  ]
},
{
  id: 'chords-in-key', cat: 'Chords', title: 'Chords in the key of C', minutes: 12, req: ['triad-minor', 'c-major-scale'],
  why: 'Songs are written with numbers. Once you can think in the number system, you can play any song in any key.',
  objective: 'Name the seven chords of C major with letters, Roman numerals and numbers, and play them.',
  theory: [
    'Build a triad on each note of the C major scale, using only notes from the scale, and you get seven chords: C, Dm, Em, F, G, Am and Bdim.',
    'Roman numerals label them by position: I ii iii IV V vi vii°. A capital letter means major, a lowercase letter means minor, and ° means diminished.',
    'The number system says the same thing with plain numbers: 1, 2m, 3m, 4, 5, 6m, 7°. Gospel musicians say "play a one, a four, a five".',
    'The pattern is identical in every key. In G the one chord is G, the four is C, the five is D. That is how you transpose.'
  ],
  visual: { chordsInKey: 'C', range: [48, 72] },
  listen: [{ label: 'The seven chords, in order', spec: { kind: 'chords', list: [ch('C', 'major'), ch('D', 'minor'), ch('E', 'minor'), ch('F', 'major'), ch('G', 'major'), ch('A', 'minor')], d: 1.4 } }],
  play: { type: 'chord', targets: [ch('C', 'major', { label: 'I' }), ch('D', 'minor', { label: 'ii' }), ch('E', 'minor', { label: 'iii' }), ch('F', 'major', { label: 'IV' }), ch('G', 'major', { label: 'V' }), ch('A', 'minor', { label: 'vi' })], hints: true, prompt: 'Play the I to vi chords of C major in order.' },
  practice: [
    { type: 'chord', targets: [ch('C', 'major', { label: '1' }), ch('F', 'major', { label: '4' }), ch('G', 'major', { label: '5' }), ch('C', 'major', { label: '1' })], hints: true, prompt: 'Play 1 – 4 – 5 – 1 in C.' },
    { type: 'chord', targets: [ch('C', 'major', { label: '1' }), ch('G', 'major', { label: '5' }), ch('A', 'minor', { label: '6m' }), ch('F', 'major', { label: '4' })], hints: true, prompt: 'Play 1 – 5 – 6m – 4 in C.' }
  ],
  apply: { text: 'Worship songs are very often 1 – 5 – 6m – 4. The same four numbers, in C, G, D or any key, cover a large share of the songs you will be asked to play.' },
  challenge: { type: 'chord', targets: [ch('D', 'minor', { label: '2m' }), ch('G', 'major', { label: '5' }), ch('C', 'major', { label: '1' })], hints: false, prompt: 'Challenge: play 2m – 5 – 1 in C without hints. Think of the numbers, then find the chords.' },
  quiz: [
    q('In C major, which chord is the vi?', ['Dm', 'Em', 'Am', 'Bdim'], 2, 'The sixth note is A, and its chord is A minor.'),
    q('In C major, which chord is the IV?', ['D', 'F', 'G', 'A'], 1, 'The fourth note is F, so the IV chord is F major.'),
    q('A lowercase Roman numeral such as "ii" means…', ['Major', 'Minor', 'Diminished', 'Seventh'], 1, 'Lowercase is minor. Uppercase is major.'),
    q('In G major, what is the 5 chord?', ['C', 'D', 'E', 'F♯'], 1, 'G A B C D: the fifth note is D, so the 5 chord is D major.')
  ]
},

/* =============================== LEVEL 2 · FOUNDATION =============================== */
{
  id: 'intervals', cat: 'Theory', title: 'Intervals', minutes: 10, req: ['chords-in-key', 'major-scale-formula'],
  why: 'Intervals are the building blocks of melodies and chords. They also train your ear.',
  objective: 'Measure and play the major 3rd, perfect 4th, perfect 5th and octave above any note.',
  theory: [
    'An interval is the distance between two notes. Count letter names from the lower note to the higher one to get the number: C to E is a 3rd (C D E), C to G is a 5th, C to the next C is an octave.',
    'The quality comes from the half steps: minor 2nd 1, major 2nd 2, minor 3rd 3, major 3rd 4, perfect 4th 5, perfect 5th 7, octave 12.',
    'Chords are stacked intervals. A major triad is a major third with a minor third on top.'
  ],
  visual: { range: [60, 72], steps: [
    { caption: 'C to E: major 3rd (4 half steps).', hi: ['C4', 'E4'] },
    { caption: 'C to F: perfect 4th (5 half steps).', hi: ['C4', 'F4'] },
    { caption: 'C to G: perfect 5th (7 half steps).', hi: ['C4', 'G4'] },
    { caption: 'C to C: octave (12 half steps).', hi: ['C4', 'C5'] }
  ] },
  listen: [
    { label: 'Major 3rd', spec: { kind: 'notes', notes: ['C4', 'E4'], d: 1.2 } }, { label: 'Perfect 4th', spec: { kind: 'notes', notes: ['C4', 'F4'], d: 1.2 } },
    { label: 'Perfect 5th', spec: { kind: 'notes', notes: ['C4', 'G4'], d: 1.2 } }, { label: 'Octave', spec: { kind: 'notes', notes: ['C4', 'C5'], d: 1.2 } }
  ],
  play: { type: 'seq', notes: ['C4', 'E4', 'C4', 'G4', 'C4', 'C5'], hints: true, prompt: 'From C: up a major 3rd, back to C, up a perfect 5th, back to C, up an octave.' },
  practice: [{ type: 'seq', notes: ['G4', 'B4', 'G4', 'D5', 'G4', 'G5'], hints: true, range: [60, 84], prompt: 'Same shapes from G: major 3rd (B), perfect 5th (D), octave (G).' }],
  apply: { text: 'The perfect 5th is the "power" interval in the bass: root and fifth together give a strong open sound that gospel bass lines use constantly.' },
  challenge: { type: 'seq', notes: ['F4', 'A4', 'F4', 'C5', 'F4', 'Bb4'], hints: false, maxMiss: 2, range: [60, 84], prompt: 'Challenge: from F, play the major 3rd, the perfect 5th, then the perfect 4th. No hints.' },
  quiz: [
    q('How many half steps are in a major 3rd?', ['3', '4', '5', '7'], 1, 'Major 3rd is 4 half steps; minor 3rd is 3.'),
    q('What interval is C up to G?', ['Perfect 4th', 'Perfect 5th', 'Major 3rd', 'Octave'], 1, 'C D E F G is five letter names, and 7 half steps, a perfect 5th.'),
    q('What is the interval from E up to G?', ['Major 3rd', 'Minor 3rd', 'Perfect 4th', 'Major 2nd'], 1, 'E to G is 3 half steps: a minor 3rd.'),
    q('Listen. Which interval is this?', ['Major 3rd', 'Perfect 5th', 'Octave'], 1, 'C up to G is a perfect 5th.', { listen: { kind: 'notes', notes: ['C4', 'G4'], d: 1.2 } })
  ]
},
{
  id: 'dim-aug', cat: 'Chords', title: 'Diminished and augmented triads', minutes: 10, req: ['triad-minor', 'intervals'],
  why: 'These two tense chords are the doorway to passing chords in gospel harmony.',
  objective: 'Build and play all four triad types on the same root.',
  theory: [
    'There are four kinds of triad. Major: root, major 3rd, perfect 5th. Minor: root, minor 3rd, perfect 5th.',
    'Diminished: root, minor 3rd and a lowered fifth. It is two minor thirds stacked, tense and wanting to move. B diminished is B D F.',
    'Augmented: root, major 3rd and a raised fifth. It is two major thirds stacked, a bright but unsettled sound. C augmented is C E G♯.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C major: C E G.', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: 'C minor: C E♭ G.', chord: { root: 'C', quality: 'minor', oct: 4 } },
    { caption: 'C diminished: C E♭ G♭.', chord: { root: 'C', quality: 'dim', oct: 4 } },
    { caption: 'C augmented: C E G♯.', chord: { root: 'C', quality: 'aug', oct: 4 } }
  ] },
  listen: [{ label: 'All four on C', spec: { kind: 'chords', list: [ch('C', 'major'), ch('C', 'minor'), ch('C', 'dim'), ch('C', 'aug')], d: 2 } }],
  play: { type: 'chord', targets: [ch('C', 'major'), ch('C', 'minor'), ch('C', 'dim'), ch('C', 'aug')], hints: true, prompt: 'Play C, Cm, Cdim, Caug. One note changes each time.' },
  practice: [{ type: 'chord', targets: [ch('G', 'major'), ch('G', 'minor'), ch('G', 'dim'), ch('G', 'aug')], hints: true, prompt: 'The same four on G.' }],
  apply: { text: 'Diminished chords often connect two chords in gospel, for example between I and ii. You will build those passing chords in the Gospel Harmony module.' },
  challenge: { type: 'chord', targets: [ch('D', 'major'), ch('D', 'minor'), ch('D', 'dim'), ch('D', 'aug')], hints: false, prompt: 'Challenge: the four triad types on D, no hints.' },
  quiz: [
    q('A diminished triad is made of…', ['Two minor thirds', 'Two major thirds', 'A major then a minor third', 'Two fifths'], 0, 'Two minor thirds stacked give root, ♭3, ♭5.'),
    q('Which triad has a raised fifth?', ['Major', 'Minor', 'Diminished', 'Augmented'], 3, 'Augmented has ♯5.'),
    q('Which notes make B diminished?', ['B D F', 'B D♯ F♯', 'B D F♯', 'B E F'], 0, 'B, D, F.')
  ]
},
{
  id: 'inversions', cat: 'Chords', title: 'Chord inversions', minutes: 11, req: ['triad-major', 'triad-minor'],
  why: 'Inversions let your hand stay put while the chords change. They make progressions smooth.',
  objective: 'Play root position, first and second inversions, and use them to move smoothly.',
  theory: [
    'An inversion is the same chord with a different note at the bottom. C major in root position is C E G.',
    'In first inversion the root moves to the top: E G C, with E lowest. In second inversion the lowest note is G: G C E.',
    'Chord symbols show the bottom note after a slash: C/E is a C chord with E in the bass. C/G has G in the bass.',
    'Why bother? To go from C to F, you can play C E G then C F A. Only two fingers move, each by a step.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Root position: C E G (C lowest).', chord: { root: 'C', quality: 'major', oct: 4, inv: 0 } },
    { caption: 'First inversion, C/E: E G C (E lowest).', chord: { root: 'C', quality: 'major', oct: 4, inv: 1 } },
    { caption: 'Second inversion, C/G: G C E (G lowest).', chord: { root: 'C', quality: 'major', oct: 4, inv: 2 } }
  ] },
  listen: [{ label: 'C, C/E, C/G', spec: { kind: 'chords', list: [ch('C', 'major'), ch('C', 'major', { inv: 1 }), ch('C', 'major', { inv: 2 })], d: 2 } }, { label: 'Smooth I – IV: C then F/C', spec: { kind: 'chords', list: [ch('C', 'major'), ch('F', 'major', { inv: 2 })], d: 2 } }],
  play: { type: 'chord', targets: [ch('C', 'major', { inv: 0 }), ch('C', 'major', { inv: 1 }), ch('C', 'major', { inv: 2 })], hints: true, prompt: 'Play C root position, then first inversion (E lowest), then second inversion (G lowest).' },
  practice: [{ type: 'chord', targets: [ch('F', 'major', { inv: 0 }), ch('F', 'major', { inv: 1 }), ch('F', 'major', { inv: 2 })], hints: true, prompt: 'The same three shapes on F.' }],
  apply: { text: 'Gospel and worship pianists almost never jump the whole hand between chords. They choose the inversion closest to the last one. That is called voice leading, and it is why good accompaniment sounds smooth.' },
  challenge: { type: 'chord', targets: [ch('C', 'major', { inv: 0 }), ch('F', 'major', { inv: 2 }), ch('G', 'major', { inv: 1 }), ch('C', 'major', { inv: 0 })], hints: false, prompt: 'Challenge: C, then F with C lowest, then G with B lowest, then C. Watch how little your hand moves.' },
  quiz: [
    q('C/E means…', ['A C chord with E in the bass', 'C and E chords together', 'E minor', 'C major 7th'], 0, 'The note after the slash is the lowest note.'),
    q('Which is C major in second inversion?', ['C E G', 'E G C', 'G C E', 'C G E'], 2, 'Second inversion puts the fifth (G) on the bottom: G C E.', { show: { range: [48, 72], hi: ['G4', 'C5', 'E5'] } }),
    q('The main reason to use inversions is…', ['Smooth movement between chords', 'To play louder', 'To avoid the left hand', 'To change the key'], 0, 'Inversions keep the hand close so changes are smooth.')
  ]
},
{
  id: 'bass-and-chords', cat: 'Chords', title: 'Left-hand bass, right-hand chords', minutes: 11, req: ['inversions', 'two-hands'],
  why: 'This is the basic gospel accompaniment shape: bass underneath, chord on top.',
  objective: 'Play a low root with the left hand and a triad above it with the right.',
  theory: [
    'The left hand plays the root of the chord in the low part of the keyboard. The right hand plays the triad above, near middle C.',
    'In these exercises the lowest note you play must be the root, and it must be below middle C. You can play the bass first and then the chord, or all together.',
    'Keep the right-hand chord still while the left hand moves to a new bass note, and change only when the chord changes.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C: bass C3, chord C E G.', hi: ['C3', 'C4', 'E4', 'G4'] },
    { caption: 'F: bass F3, chord F A C.', hi: ['F3', 'F4', 'A4', 'C5'] },
    { caption: 'G: bass G3, chord G B D.', hi: ['G3', 'G4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'Bass and chord: C, F, G, C', spec: { kind: 'chords', list: [bassCh('C', 'major'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('C', 'major')], d: 2 } }],
  play: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'major'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('C', 'major')], hints: true, prompt: 'Play C, F, G, C. Each time: low root first, then the chord above.' },
  practice: [{ type: 'chord', range: [48, 72], targets: [bassCh('C', 'major'), bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('G', 'major')], hints: true, prompt: 'Now C, Am, F, G with bass notes.' }],
  apply: { text: 'This shape is the engine under most gospel ballads. Add rhythm later and it becomes a groove, add 7ths and it becomes rich.' },
  challenge: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], hints: false, prompt: 'Challenge: six chords with bass notes, no hints.' },
  quiz: [
    q('Which note should the left hand play under an F chord?', ['C', 'F', 'A', 'G'], 1, 'The bass is normally the root.'),
    q('Where does the left-hand bass usually sit?', ['Low on the keyboard', 'Above the right hand', 'Anywhere', 'Only on black keys'], 0, 'Low, so it supports the chord above.'),
    q('If you play C E G with C lowest, then F A C with F lowest, you are playing…', ['Root-position triads with bass', 'Second inversions only', 'Scales', 'Seventh chords'], 0, 'Root position, each with its root at the bottom.')
  ]
},
{
  id: 'metronome-play', cat: 'Rhythm', title: 'Playing with a metronome', minutes: 9, req: ['bass-and-chords'],
  why: 'A band will not wait for you. Playing in time is the difference between practising and performing.',
  objective: 'Play a scale along with a metronome and keep an even pulse.',
  theory: [
    'A metronome is a click that never speeds up or slows down. It shows you where your timing drifts.',
    'Start slower than you think you need. Play every note exactly on a click. Only increase the tempo when the slower speed feels easy.',
    'After each run the app shows a steadiness score: how even your gaps between notes were. 100 is perfectly even.'
  ],
  listen: [{ label: 'The click at 70 BPM', spec: { kind: 'metro', bpm: 70, bars: 2 } }],
  play: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], hints: true, metro: 70, prompt: 'Play the C major scale, one note per click, at 70 BPM. The click starts when you play your first note.' },
  practice: [{ type: 'seq', notes: ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], hints: true, metro: 80, prompt: 'Down the scale at 80 BPM.' }],
  apply: { text: 'When you accompany a song, the drummer or a click track may be your reference. Practising with a metronome makes it natural to lock in.' },
  challenge: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], hints: false, metro: 90, maxMiss: 3, prompt: 'Challenge: up and down at 90 BPM, no hints.' },
  quiz: [
    q('When learning a new passage you should start…', ['At full speed', 'Slower than you need', 'Without any beat', 'Only with the left hand'], 1, 'Slow first. Speed follows accuracy.'),
    q('What does a metronome help you hear?', ['Where your timing drifts', 'Which key you are in', 'Which notes are sharp', 'Chord names'], 0, 'It exposes rushing and dragging.'),
    q('A steadiness score of 100 means…', ['Perfectly even gaps between notes', 'Very fast playing', 'No mistakes', 'Loud playing'], 0, 'It measures evenness of timing.')
  ]
},

/* =============================== GOSPEL PIANO · INTRODUCTION =============================== */
{
  id: 'g-what', cat: 'Gospel', title: 'What makes it gospel?', minutes: 8, req: ['chords-in-key'],
  why: 'You already know the notes. This lesson shows what changes in gospel and gives you a map for the rest of the track.',
  objective: 'Hear how colour, bass and groove turn plain chords into gospel.',
  theory: [
    'Gospel piano uses the same notes and chords you have been learning. What changes is how they are coloured and moved.',
    'Four ingredients. Richer chords: 7ths, 9ths and beyond. Strong bass lines that lead from one chord into the next. Groove: chords placed on off-beats with a pulse. Call and response: the piano answers the singer in the gaps.',
    'Listen to the same four chords three ways: plain triads, then with 7ths, then with a groove. The next lessons teach each ingredient in turn.'
  ],
  listen: [
    { label: '1. Plain triads: I – IV – V – I', spec: { kind: 'prog', key: 'C', degs: [1, 4, 5, 1], sevenths: false, style: 'whole', bpc: 4, bpm: 80 } },
    { label: '2. Add 7ths for colour', spec: { kind: 'prog', key: 'C', degs: [1, 4, 5, 1], sevenths: true, style: 'whole', bpc: 4, bpm: 80 } },
    { label: '3. Add a groove', spec: { kind: 'prog', key: 'C', degs: [1, 4, 5, 1], sevenths: true, style: 'groove', bpc: 4, bpm: 84 } }
  ],
  play: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'major'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('C', 'major')], hints: true, prompt: 'Play the plain version first: C, F, G, C, each with a low bass note.' },
  practice: [{ type: 'chord', range: [48, 72], targets: [bassCh('C', 'major'), bassCh('G', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], hints: true, prompt: 'One more pass with a different order: C, G, F, C.' }],
  apply: { text: 'This plain I – IV – V – I is where every gospel arrangement starts. A great player is hearing the plain skeleton underneath all the colour.' },
  challenge: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'major'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], hints: false, prompt: 'Challenge: play C, F, G, C, F, C with bass notes and no hints.' },
  quiz: [
    q('Which is NOT one of the four gospel ingredients listed?', ['Richer chords', 'Strong bass lines', 'Playing everything very loudly', 'Call and response'], 2, 'Volume is a tool, but it is not one of the four ingredients.'),
    q('What changed between the first and second examples?', ['7ths were added to the chords', 'The key changed', 'The tempo doubled', 'The left hand stopped'], 0, 'Same chord roots, with 7ths added.'),
    q('A groove usually places chords…', ['Only on beat 1', 'On off-beats as well as on beats', 'Never together with the bass', 'Only in minor keys'], 1, 'Off-beat chords give the groove its push.')
  ]
},
{
  id: 'g-amen', cat: 'Gospel', title: 'The Amen cadence (IV to I)', minutes: 9,
  why: 'The most recognisable ending in church music. You will use it in nearly every service.',
  objective: 'Play the IV – I cadence with bass notes in C, G and D.',
  theory: [
    'A cadence is a small chord movement that closes a phrase. IV to I is called the plagal or "Amen" cadence, because it is the sound under the word "A-men".',
    'In C that is F then C. The F chord is the step away, and the move home to C feels warm and settled rather than urgent.',
    'Play it with a bass note under each chord: bass F with the F chord, then bass C with the C chord. Let the last chord ring.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'IV in C: bass F, chord F A C.', hi: ['F3', 'F4', 'A4', 'C5'] },
    { caption: 'I in C: bass C, chord C E G.', hi: ['C3', 'C4', 'E4', 'G4'] }
  ] },
  listen: [{ label: 'Amen cadence in C', spec: { kind: 'prog', key: 'C', degs: [4, 1], sevenths: false, style: 'whole', bpc: 4, bpm: 70 } }, { label: 'With a groove', spec: { kind: 'prog', key: 'C', degs: [4, 1], sevenths: false, style: 'groove', bpc: 4, bpm: 76 } }],
  play: { type: 'chord', range: [48, 72], targets: [bassCh('F', 'major', { label: 'IV' }), bassCh('C', 'major', { label: 'I' })], hints: true, prompt: 'Play F then C: A – men. Bass note first, then the chord.' },
  practice: [{ type: 'chord', range: [48, 72], targets: [bassCh('C', 'major', { label: 'IV' }), bassCh('G', 'major', { label: 'I' })], hints: true, prompt: 'The same cadence in G: C then G.' }],
  apply: { text: 'When a prayer ends or a song settles, play IV to I softly and let it fade. Congregations hear it as a spoken "Amen".' },
  challenge: { type: 'chord', range: [48, 72], targets: [bassCh('G', 'major', { label: 'IV' }), bassCh('D', 'major', { label: 'I' }), bassCh('F', 'major', { label: 'IV' }), bassCh('C', 'major', { label: 'I' })], hints: false, prompt: 'Challenge: the cadence in D (G then D) and then in C (F then C). No hints.' },
  quiz: [
    q('The Amen cadence moves from…', ['I to V', 'IV to I', 'V to I', 'I to vi'], 1, 'IV to I is the plagal cadence.'),
    q('In the key of G, which chord is the IV?', ['C', 'D', 'Em', 'A'], 0, 'G A B C: the fourth note is C.'),
    q('How should the final I chord feel?', ['Settled and warm', 'Sharp and urgent', 'Staccato', 'Loud and fast'], 0, 'The cadence is a gentle landing.')
  ]
},
{
  id: 'g-worship', cat: 'Gospel', title: 'The worship progression: 1 – 5 – 6m – 4', minutes: 11,
  why: 'Learn this once and you can follow a huge number of worship songs.',
  objective: 'Play 1 – 5 – 6m – 4 with bass notes in C, G and D.',
  theory: [
    'This four-chord loop is the most used progression in modern worship. In C it is C, G, Am, F. In numbers: 1, 5, 6m, 4.',
    'It sounds open and uplifting. The 5 lifts away from home, the 6m adds a touch of tenderness, and the 4 prepares the return to 1.',
    'The same four numbers work in every key. In G they are G, D, Em, C. In D they are D, A, Bm, G. Think numbers first, chord names second.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'In C: 1 = C, 5 = G, 6m = Am, 4 = F.', hi: ['C4', 'E4', 'G4'] }
  ] },
  listen: [
    { label: 'In C, sustained', spec: { kind: 'prog', key: 'C', degs: [1, 5, 6, 4], sevenths: false, style: 'whole', bpc: 4, bpm: 72 } },
    { label: 'In G, with a groove', spec: { kind: 'prog', key: 'G', degs: [1, 5, 6, 4], sevenths: false, style: 'groove', bpc: 4, bpm: 80 } }
  ],
  play: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'major', { label: '1' }), bassCh('G', 'major', { label: '5' }), bassCh('A', 'minor', { label: '6m' }), bassCh('F', 'major', { label: '4' })], hints: true, prompt: 'In C, play 1 – 5 – 6m – 4 with bass notes.' },
  practice: [{ type: 'chord', range: [48, 72], targets: [bassCh('G', 'major', { label: '1' }), bassCh('D', 'major', { label: '5' }), bassCh('E', 'minor', { label: '6m' }), bassCh('C', 'major', { label: '4' })], hints: true, prompt: 'Now in G: G, D, Em, C.' }],
  apply: { text: 'Use the Song Lab to loop this progression in any key and with different rhythms. Practise each key until the numbers feel natural.' },
  challenge: { type: 'chord', range: [47, 72], targets: [bassCh('D', 'major', { label: '1' }), bassCh('A', 'major', { label: '5' }), bassCh('B', 'minor', { label: '6m' }), bassCh('G', 'major', { label: '4' })], hints: false, prompt: 'Challenge: the progression in D (D, A, Bm, G) with no hints.' },
  quiz: [
    q('In C, which chord is the 6m?', ['Dm', 'Em', 'Am', 'Bdim'], 2, 'The sixth note is A, so the 6m chord is Am.'),
    q('In G, 1 – 5 – 6m – 4 is…', ['G D Em C', 'G C D Em', 'G D Am C', 'G Em C D'], 0, 'G D Em C.'),
    q('Why think in numbers?', ['They work in every key', 'They are easier to spell', 'They are louder', 'No reason'], 0, 'Numbers let you move a song to any key.')
  ]
},
{
  id: 'g-sevenths', cat: 'Gospel', title: 'Add colour: the 7th', minutes: 12, req: ['g-amen', 'intervals'],
  why: 'The 7th is the first step from plain chords to the gospel sound.',
  objective: 'Build and play major 7th, minor 7th and dominant 7th chords.',
  theory: [
    'Add a note a third above the fifth of a triad and you have a 7th chord. It adds colour and movement.',
    'Major 7th (Cmaj7 = C E G B): warm, dreamy, settled. Minor 7th (Am7 = A C E G): soft and relaxed. Dominant 7th (G7 = G B D F): tense, wanting to resolve, strongly pulling toward C.',
    'Major 7th is a half step below the octave; dominant and minor 7th are a whole step below it.',
    'In C: Cmaj7, Dm7, Em7, Fmaj7, G7, Am7. Gospel pianists use these in place of plain triads almost all the time.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Cmaj7: C E G B.', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: 'Fmaj7: F A C E.', chord: { root: 'F', quality: 'maj7', oct: 4 } },
    { caption: 'G7: G B D F. It leans toward C.', chord: { root: 'G', quality: '7', oct: 4 } },
    { caption: 'Am7: A C E G.', chord: { root: 'A', quality: 'm7', oct: 4 } },
    { caption: 'Dm7: D F A C.', chord: { root: 'D', quality: 'm7', oct: 4 } }
  ] },
  listen: [
    { label: 'C, then Cmaj7', spec: { kind: 'chords', list: [ch('C', 'major'), ch('C', 'maj7')], d: 2.2 } },
    { label: 'G7 resolving to C', spec: { kind: 'chords', list: [ch('G', '7'), ch('C', 'major')], d: 2 } }
  ],
  play: { type: 'chord', targets: [ch('C', 'maj7'), ch('F', 'maj7')], hints: true, prompt: 'Play Cmaj7, then Fmaj7.' },
  practice: [{ type: 'chord', targets: [ch('A', 'm7'), ch('D', 'm7'), ch('G', '7')], hints: true, prompt: 'Play Am7, Dm7, then G7.' }],
  apply: { text: 'Take any hymn chart in C and swap C for Cmaj7, F for Fmaj7, G for G7, Am for Am7. Same song, richer sound. That is the beginning of gospel voicing.' },
  challenge: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'maj7'), bassCh('F', 'maj7'), bassCh('G', '7'), bassCh('C', 'maj7')], hints: false, prompt: 'Challenge: Cmaj7, Fmaj7, G7, Cmaj7 with bass notes, no hints.' },
  quiz: [
    q('Which notes make Cmaj7?', ['C E G B', 'C E G B♭', 'C E♭ G B♭', 'C F G B'], 0, 'Major triad plus the major 7th, B.'),
    q('Which chord leans strongly toward resolving to C?', ['Cmaj7', 'Am7', 'G7', 'Fmaj7'], 2, 'G7 is the dominant 7th in C.'),
    q('A 7th chord adds a note…', ['A third above the fifth', 'An octave below the root', 'A half step below the root', 'On the black keys only'], 0, 'It stacks another third on top.'),
    q('Listen. Which chord is this?', ['C major', 'Cmaj7'], 1, 'The extra B gives Cmaj7 its dreamy colour.', { listen: CHORD_LISTEN('C', 'maj7') })
  ]
},
{
  id: 'g-turnaround', cat: 'Gospel', title: 'Your first turnaround: 1 – 6m – 2m – 5', minutes: 12, req: ['g-sevenths'],
  why: 'A turnaround is a short loop that brings the song back to the start. You will hear it everywhere.',
  objective: 'Play the 1 – 6m – 2m – 5 turnaround with 7th chords and bass in C, F and G.',
  theory: [
    'The turnaround 1 – 6m – 2m – 5 (I – vi – ii – V) in C with 7ths is Cmaj7, Am7, Dm7, G7.',
    'Look at the roots: C, A, D, G. Each root moves down a fifth (or up a fourth) to the next, and the G7 pulls strongly back to C. That chain of fifths is why it sounds so natural.',
    'You can loop it as long as you need, for an intro, under a prayer, or while the singer collects their thoughts.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Cmaj7 (1).', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: 'Am7 (6m).', chord: { root: 'A', quality: 'm7', oct: 4 } },
    { caption: 'Dm7 (2m).', chord: { root: 'D', quality: 'm7', oct: 4 } },
    { caption: 'G7 (5), pulling back to Cmaj7.', chord: { root: 'G', quality: '7', oct: 4 } }
  ] },
  listen: [
    { label: 'In C, sustained', spec: { kind: 'prog', key: 'C', degs: [1, 6, 2, 5], sevenths: true, style: 'whole', bpc: 4, bpm: 76 } },
    { label: 'In C, with a groove', spec: { kind: 'prog', key: 'C', degs: [1, 6, 2, 5], sevenths: true, style: 'groove', bpc: 4, bpm: 84 } }
  ],
  play: { type: 'chord', range: [48, 72], targets: [bassCh('C', 'maj7', { label: '1' }), bassCh('A', 'm7', { label: '6m' }), bassCh('D', 'm7', { label: '2m' }), bassCh('G', '7', { label: '5' })], hints: true, prompt: 'In C: Cmaj7, Am7, Dm7, G7, each with its bass note.' },
  practice: [{ type: 'chord', range: [48, 72], targets: [bassCh('F', 'maj7', { label: '1' }), bassCh('D', 'm7', { label: '6m' }), bassCh('G', 'm7', { label: '2m' }), bassCh('C', '7', { label: '5' })], hints: true, prompt: 'The same turnaround in F: Fmaj7, Dm7, Gm7, C7.' }],
  apply: { text: 'Open the Song Lab, pick 1 – 6m – 2m – 5, switch on 7ths, and loop it with the gospel groove. Use it as your intro for any song in that key.' },
  challenge: { type: 'chord', range: [48, 72], targets: [bassCh('G', 'maj7', { label: '1' }), bassCh('E', 'm7', { label: '6m' }), bassCh('A', 'm7', { label: '2m' }), bassCh('D', '7', { label: '5' })], hints: false, prompt: 'Challenge: the turnaround in G (Gmaj7, Em7, Am7, D7) without hints.' },
  quiz: [
    q('In C, which chords make 1 – 6m – 2m – 5 with 7ths?', ['Cmaj7 Am7 Dm7 G7', 'Cmaj7 Fmaj7 G7 Am7', 'C Dm Em F', 'Cmaj7 Em7 Am7 D7'], 0, 'C, A, D, G roots with 7ths.'),
    q('Which chord in this turnaround is the dominant 7th?', ['Cmaj7', 'Am7', 'Dm7', 'G7'], 3, 'G7 is the 5 chord with a dominant 7th.'),
    q('Roughly why does the turnaround sound natural?', ['Each root falls a fifth to the next', 'It uses only black keys', 'It has no bass', 'It is always in minor'], 0, 'C to A to D to G are falling-fifth steps.')
  ]
}

];

/* ---------- modules and levels ---------- */
const MODULES = [
  { id: 'keys',    level: '1', title: 'Keyboard basics',        blurb: 'Find your way around the keys and set up your hands.', lessons: ['keyboard-layout', 'musical-alphabet', 'white-notes', 'sharps-flats', 'posture-fingers'] },
  { id: 'rhythm',  level: '1', title: 'Rhythm',                 blurb: 'Pulse, note lengths and time signatures.', lessons: ['beat', 'note-values', 'time-signatures'] },
  { id: 'scales',  level: '1', title: 'Scales and first melodies', blurb: 'Scales, a real melody, and your first two-hand playing.', lessons: ['c-major-scale', 'major-scale-formula', 'first-melody', 'two-hands'] },
  { id: 'chords',  level: '1', title: 'Basic chords',           blurb: 'Major and minor triads, and the chords of a key.', lessons: ['triad-major', 'triad-minor', 'major-vs-minor-ear', 'chords-in-key'] },
  { id: 'found',   level: '2', title: 'Piano foundation',       blurb: 'Intervals, triad types, inversions and playing in time.', lessons: ['intervals', 'dim-aug', 'inversions', 'bass-and-chords', 'metronome-play'] },
  { id: 'gospel1', level: 'G', title: 'Gospel introduction',    blurb: 'The first four ideas of gospel piano.', lessons: ['g-what', 'g-amen', 'g-worship', 'g-sevenths', 'g-turnaround'] }
];
const LEVELS = [
  { id: '1', name: 'Level 1', title: 'Beginner', goal: 'Move around the keyboard with confidence and play simple music with both hands.' },
  { id: '2', name: 'Level 2', title: 'Piano foundation', goal: 'Play basic songs with both hands using triads, inversions and a steady beat.' },
  { id: 'G', name: 'Gospel', title: 'Gospel piano', goal: 'Colour and move chords the way gospel pianists do.' }
];

/* ===================== BATCH 1 · Level 2 completion =====================
   Scales in every key, arpeggios, left-hand patterns, rhythm, progressions and charts.
   Inserted into content.js by build.js at the BATCH1 marker. */
const EN = root.Engine;
const sc = (r, t, o) => EN.scaleTokens(r, t, o || 4);
const FM = (toks, f) => { const m = {}; toks.forEach((k, i) => { m[k] = f[i]; }); return m; };
const RHF = [1, 2, 3, 1, 2, 3, 4, 5];
const FING = { C: RHF, G: RHF, D: RHF, A: RHF, E: RHF, B: RHF, F: [1, 2, 3, 4, 1, 2, 3, 4], Bb: [4, 1, 2, 3, 1, 2, 3, 4], Eb: [3, 1, 2, 3, 4, 1, 2, 3], Ab: [3, 4, 1, 2, 3, 1, 2, 3], Db: [2, 3, 1, 2, 3, 4, 1, 2], 'F#': [2, 3, 4, 1, 2, 3, 1, 2] };
const MFING = { A: RHF, E: RHF, D: RHF, G: RHF, C: RHF, B: RHF, F: [1, 2, 3, 4, 1, 2, 3, 4] };
const SR = [60, 84];
const rev = a => a.slice().reverse();
const upEx = (r, t, f, o) => Object.assign({ type: 'seq', notes: sc(r, t), fingers: f, hints: true, range: SR }, o || {});
const downEx = (r, t, f, o) => Object.assign({ type: 'seq', notes: rev(sc(r, t)), fingers: rev(f), hints: true, range: SR }, o || {});
const bothEx = (r, t, f, o) => Object.assign({ type: 'seq', notes: sc(r, t).concat(rev(sc(r, t)).slice(1)), fingers: f.concat(rev(f).slice(1)), hints: true, range: SR }, o || {});
const scStep = (r, t, f, caption) => ({ caption, hi: sc(r, t), fingers: FM(sc(r, t), f) });
const heard = (r, t, d) => ({ label: r + ' ' + t, spec: { kind: 'notes', notes: sc(r, t), d: d || 0.45 } });
const diaTargets = (key, degs, sev, labels, bass) => EN.progressionChords(key, degs, sev).map((c, i) => Object.assign({ root: c.root, quality: c.quality }, bass === false ? {} : { bass: true }, labels ? { label: labels[i] } : {}));
const chExs = (key, degs, sev, labels, o) => Object.assign({ type: 'chord', range: [48, 72], targets: diaTargets(key, degs, sev, labels), hints: true }, o || {});

const BATCH1 = { lessons: [], modules: [] };
const L = BATCH1.lessons;

/* ------------------------- module: scales in every key ------------------------- */
L.push({
  id: 'natural-minor', cat: 'Scales', title: 'Natural minor scales', minutes: 10, req: ['major-scale-formula', 'triad-minor'],
  why: 'Minor scales give you the sound of tenderness, longing and depth. Many of the strongest worship and gospel songs live in a minor key.',
  objective: 'Build and play A, E and D natural minor scales, and name the relative minor of a major key.',
  theory: [
    'The natural minor scale has its own recipe: whole, half, whole, whole, half, whole, whole. Written W H W W H W W. The half step comes early, after the second note, and that gives minor its darker colour.',
    'A natural minor is all the white keys from A to A: A B C D E F G A. Compare it with A major (A B C♯ D E F♯ G♯). The 3rd, 6th and 7th notes are each a half step lower in minor.',
    'Every major key has a relative minor that shares its notes. It starts on the 6th note of the major scale. C major and A minor share the same notes. G major and E minor share F♯. F major and D minor share B♭.',
    'The fingering is the same as C major: 1 2 3, thumb under, 1 2 3 4 5.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    scStep('A', 'minor', MFING.A, 'A natural minor: A B C D E F G A. All white keys.'),
    scStep('E', 'minor', MFING.E, 'E natural minor: E F♯ G A B C D E. One sharp, the same as G major.'),
    scStep('D', 'minor', MFING.D, 'D natural minor: D E F G A B♭ C D. One flat, the same as F major.')
  ] },
  listen: [heard('A', 'minor', 0.5), heard('C', 'major', 0.5), heard('E', 'minor', 0.5)],
  play: upEx('A', 'minor', MFING.A, { prompt: 'Play the A natural minor scale, one octave up.' }),
  practice: [
    upEx('E', 'minor', MFING.E, { prompt: 'Play E natural minor. Watch for the F♯.' }),
    upEx('D', 'minor', MFING.D, { prompt: 'Play D natural minor. Watch for the B♭.' })
  ],
  apply: { text: 'A song in a minor key usually feels prayerful or yearning. And inside any major-key song, the vi chord is the home chord of the relative minor, which is why it adds tenderness to the 1 – 5 – 6m – 4 worship loop.' },
  challenge: bothEx('E', 'minor', MFING.E, { hints: false, maxMiss: 3, prompt: 'Challenge: E natural minor, up and back down, no hints.' }),
  quiz: [
    q('Which recipe builds the natural minor scale?', ['W H W W H W W', 'W W H W W W H', 'H W W H W W W', 'W H W W W H W'], 0, 'Whole, half, whole, whole, half, whole, whole.'),
    q('What is the relative minor of C major?', ['A minor', 'D minor', 'E minor', 'G minor'], 0, 'The 6th note of C major is A, so A minor shares its notes.'),
    q('What is the 3rd note of A natural minor?', ['C', 'C♯', 'B', 'D'], 0, 'A B C: the 3rd note is C, a half step lower than the C♯ in A major.'),
    q('D natural minor has one flat. Which is it?', ['B♭', 'F♯', 'E♭', 'C♯'], 0, 'D minor shares its notes with F major, which has B♭.'),
    q('Listen. Is this scale major or minor?', ['Major', 'Minor'], 1, 'The lowered 3rd, 6th and 7th give it the minor sound.', { listen: { kind: 'notes', notes: sc('A', 'minor'), d: 0.5 } })
  ]
});

L.push({
  id: 'harmonic-melodic', cat: 'Scales', title: 'Harmonic and melodic minor', minutes: 10, req: ['natural-minor'],
  why: 'These two variations explain why the V chord in a minor key is major, and they give melodies a stronger pull toward home.',
  objective: 'Play A harmonic minor and A melodic minor, and explain what each one changes.',
  theory: [
    'Harmonic minor is natural minor with the 7th note raised a half step. In A it is A B C D E F G♯ A. The step from F up to G♯ is three half steps, a distinctive "stretched" sound.',
    'Why raise the 7th? The G♯ is a half step under A, so it pulls strongly home. It also lets the V chord be major: E G♯ B instead of E G B. That E major chord is what makes a minor key finish with real conviction.',
    'Melodic minor smooths out that stretch. Going up, raise both the 6th and 7th: A B C D E F♯ G♯ A. Coming down, classical practice goes back to natural minor: A G F E D C B A.',
    'Both keep the same fingering as natural minor.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    scStep('A', 'minor', MFING.A, 'Natural minor: A B C D E F G.'),
    scStep('A', 'harmonic', MFING.A, 'Harmonic minor: the 7th is raised to G♯.'),
    scStep('A', 'melodic', MFING.A, 'Melodic minor going up: the 6th and 7th are raised, F♯ and G♯.')
  ] },
  listen: [heard('A', 'minor', 0.5), heard('A', 'harmonic', 0.5), heard('A', 'melodic', 0.5), { label: 'E major, then Am (V to i)', spec: { kind: 'chords', list: [{ root: 'E', quality: 'major' }, { root: 'A', quality: 'minor' }], d: 2 } }],
  play: upEx('A', 'harmonic', MFING.A, { prompt: 'Play A harmonic minor. The G♯ comes just before the top A.' }),
  practice: [
    { type: 'seq', notes: sc('A', 'melodic').concat(['G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4']), fingers: MFING.A.concat([4, 3, 2, 1, 3, 2, 1]), hints: true, range: SR, prompt: 'Melodic minor: up with F♯ and G♯, then down as natural minor with F and G.' }
  ],
  apply: { text: 'Whenever a gospel song is in a minor key and ends with a strong V – i, the V chord has the raised 7th from harmonic minor. In A minor, play E (or E7) before landing on Am.' },
  challenge: upEx('E', 'harmonic', MFING.E, { hints: false, maxMiss: 2, prompt: 'Challenge: E harmonic minor, no hints. The raised 7th is D♯.' }),
  quiz: [
    q('Which note is raised in harmonic minor?', ['The 7th', 'The 6th', 'The 3rd', 'The 5th'], 0, 'Harmonic minor raises only the 7th.'),
    q('Which note is in A harmonic minor but not in A natural minor?', ['G♯', 'F♯', 'C♯', 'B♭'], 0, 'A harmonic minor has G♯ instead of G.'),
    q('Going up, melodic minor raises…', ['The 6th and 7th', 'Only the 7th', 'The 3rd and 7th', 'Only the 3rd'], 0, 'Both the 6th and 7th go up a half step.'),
    q('In A minor, which note makes the V chord (E) major?', ['G♯', 'F♯', 'C♯', 'B♭'], 0, 'E major is E G♯ B. The G♯ comes from harmonic minor.'),
    q('Coming down, melodic minor is traditionally played as…', ['Natural minor', 'Harmonic minor', 'Major', 'Chromatic'], 0, 'Descending, the 6th and 7th return to natural minor.')
  ]
});

L.push({
  id: 'sharp-keys', cat: 'Scales', title: 'Major keys with sharps: G, D, A, E, B', minutes: 12, req: ['major-scale-formula'],
  why: 'A gospel pianist is handed keys by singers all the time. Knowing every sharp key means no key can surprise you.',
  objective: 'Play the major scales of A, E and B, and name the sharps in G, D, A, E and B major.',
  theory: [
    'Start at C, which has no sharps. Move up a perfect 5th to G: one sharp. Up another 5th to D: two sharps. Then A: three, E: four, B: five.',
    'Each new key adds one sharp, and the new sharp is always the 7th note of the new scale. G has F♯ (its 7th). D adds C♯. A adds G♯. E adds D♯. B adds A♯. The sharps always stack in the same order: F♯ C♯ G♯ D♯ A♯.',
    'All five of these scales use the same right-hand fingering as C major: 1 2 3, thumb under, 1 2 3 4 5. In B major the long fingers sit on the black keys, which is comfortable once you try it.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    scStep('G', 'major', FING.G, 'G major: 1 sharp (F♯).'),
    scStep('D', 'major', FING.D, 'D major: 2 sharps (F♯ C♯).'),
    scStep('A', 'major', FING.A, 'A major: 3 sharps (F♯ C♯ G♯).'),
    scStep('E', 'major', FING.E, 'E major: 4 sharps (F♯ C♯ G♯ D♯).'),
    scStep('B', 'major', FING.B, 'B major: 5 sharps (F♯ C♯ G♯ D♯ A♯).')
  ] },
  listen: [heard('A', 'major'), heard('E', 'major'), heard('B', 'major')],
  play: upEx('A', 'major', FING.A, { prompt: 'Play the A major scale. Three sharps: F♯, C♯, G♯.' }),
  practice: [
    upEx('E', 'major', FING.E, { prompt: 'Play E major. Four sharps.' }),
    upEx('B', 'major', FING.B, { prompt: 'Play B major. Five sharps.' })
  ],
  apply: { text: 'Hymn books and choir arrangements often sit in A, E and B for strong tenor and alto lines. Many guitarists and singers love E and A. Learn the scale and you know the chords that live in the key.' },
  challenge: bothEx('E', 'major', FING.E, { hints: false, maxMiss: 3, prompt: 'Challenge: E major up and back down, no hints.' }),
  quiz: [
    q('How many sharps does E major have?', ['2', '3', '4', '5'], 2, 'E major has F♯ C♯ G♯ D♯.'),
    q('The newest sharp in each new sharp key is the…', ['7th note of the new scale', '4th note of the new scale', 'First note of the new scale', '5th note of the new scale'], 0, 'F♯ is the 7th of G, C♯ is the 7th of D, and so on.'),
    q('Which sharps are in A major?', ['F♯ C♯ G♯', 'F♯ C♯', 'F♯ C♯ G♯ D♯', 'B♭ E♭'], 0, 'A major has three: F♯, C♯, G♯.'),
    q('Each new sharp key is a … above the last.', ['Perfect 5th', 'Perfect 4th', 'Major 3rd', 'Whole step'], 0, 'C to G to D to A to E to B: each up a perfect 5th.')
  ]
});

L.push({
  id: 'flat-keys', cat: 'Scales', title: 'Major keys with flats: F, B♭, E♭, A♭, D♭', minutes: 12, req: ['sharp-keys'],
  why: 'Flat keys are everywhere in gospel: B♭, E♭ and A♭ are among the most requested keys for singers and horns.',
  objective: 'Play the major scales of B♭, E♭, A♭ and D♭, and name the flats in each key.',
  theory: [
    'Go the other way round from C: down a perfect 5th (the same as up a perfect 4th) to F: one flat. Then B♭: two flats. E♭: three. A♭: four. D♭: five.',
    'Each new key adds one flat, and the new flat is the 4th note of the new scale. F has B♭ (its 4th). B♭ adds E♭. E♭ adds A♭. A♭ adds D♭. D♭ adds G♭. The flats stack in the order B♭ E♭ A♭ D♭ G♭.',
    'Fingering changes in flat keys because the thumb should land on white keys. B♭ major starts on finger 4 in the right hand: 4 1 2 3 1 2 3 4. Look at the numbers on the keyboard in the Visual step. In D♭ major the thumb falls on F and C.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    scStep('F', 'major', FING.F, 'F major: 1 flat (B♭).'),
    scStep('Bb', 'major', FING.Bb, 'B♭ major: 2 flats (B♭ E♭). Start on finger 4.'),
    scStep('Eb', 'major', FING.Eb, 'E♭ major: 3 flats (B♭ E♭ A♭). Start on finger 3.'),
    scStep('Ab', 'major', FING.Ab, 'A♭ major: 4 flats. Start on finger 3.'),
    scStep('Db', 'major', FING.Db, 'D♭ major: 5 flats. Start on finger 2.')
  ] },
  listen: [heard('Bb', 'major'), heard('Eb', 'major'), heard('Ab', 'major')],
  play: upEx('Bb', 'major', FING.Bb, { prompt: 'Play B♭ major. Two flats: B♭ and E♭.' }),
  practice: [
    upEx('Eb', 'major', FING.Eb, { prompt: 'Play E♭ major. Three flats.' }),
    upEx('Ab', 'major', FING.Ab, { prompt: 'Play A♭ major. Four flats.' })
  ],
  apply: { text: 'When a singer says "bring it down to E♭", you need to find E♭ major instantly. These flat scales are the ground your chords, bass lines and fills will stand on.' },
  challenge: upEx('Db', 'major', FING.Db, { hints: false, maxMiss: 2, prompt: 'Challenge: D♭ major, no hints. Five flats, but the shape is friendly.' }),
  quiz: [
    q('How many flats does E♭ major have?', ['1', '2', '3', '4'], 2, 'E♭ major has B♭, E♭ and A♭.'),
    q('The newest flat in each new flat key is the…', ['4th note of the new scale', '7th note of the new scale', '2nd note of the new scale', '5th note of the new scale'], 0, 'B♭ is the 4th of F, E♭ is the 4th of B♭, and so on.'),
    q('Which flats are in A♭ major?', ['B♭ E♭ A♭ D♭', 'B♭ E♭ A♭', 'B♭ E♭ A♭ D♭ G♭', 'B♭ E♭'], 0, 'A♭ major has four flats.'),
    q('Going from C to F to B♭, each key is a perfect 5th …', ['Below the previous', 'Above the previous', 'The same as the previous', 'A half step above'], 0, 'F is a 5th below C, and B♭ is a 5th below F.')
  ]
});

L.push({
  id: 'circle-fifths', cat: 'Theory', title: 'The circle of fifths and key signatures', minutes: 12, req: ['flat-keys'],
  why: 'The circle of fifths is a map of all twelve keys. It lets you work out any key signature, and any related key, in seconds.',
  objective: 'Read the circle of fifths, name key signatures, and play F♯ major.',
  theory: [
    'Put the keys on a circle and move clockwise by perfect 5ths: C G D A E B F♯. Each step adds a sharp. Move counterclockwise: C F B♭ E♭ A♭ D♭. Each step adds a flat. At the bottom of the circle, F♯ major (six sharps) and G♭ major (six flats) are the same keys on the piano with different names.',
    'Quick rule for sharp keys: the key is a half step above the last sharp. Sharps F♯ C♯ G♯: the last is G♯, so the key is A. For flat keys: the key is the second-to-last flat. B♭ E♭ A♭: the second-to-last is E♭, so the key is E♭. (One flat is always F.)',
    'Every major key has a relative minor, a minor key with the same key signature, built on the 6th note. The relative minors sit on an inner ring: A minor with C, E minor with G, B minor with D, and so on.',
    'F♯ major is a special fingering: 2 3 4 1 2 3 1 2. Think of it as a shape with the thumb landing on the white keys B and E.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    scStep('F#', 'major', FING['F#'], 'F♯ major: F♯ G♯ A♯ B C♯ D♯ E♯ F♯. Six sharps. E♯ is the white key F.')
  ] },
  listen: [heard('F#', 'major')],
  play: upEx('F#', 'major', FING['F#'], { prompt: 'Play F♯ major. The thumb lands on B and E, the white keys.' }),
  practice: [
    { type: 'seq', notes: ['C4', 'G4', 'D4', 'A4', 'E4', 'B4', 'F#4'], hints: true, range: SR, prompt: 'Walk the circle clockwise: C, G, D, A, E, B, F♯. Each key is a perfect 5th above the last.' }
  ],
  apply: { text: 'The circle is also how gospel pianists think about modulation. Moving a song up a perfect 4th (one step counterclockwise) is the smoothest and most common key change.' },
  challenge: { type: 'seq', notes: ['C4', 'F4', 'Bb4', 'Eb4', 'Ab4', 'Db4'], hints: false, maxMiss: 1, range: SR, prompt: 'Challenge: walk the flat side of the circle, no hints: C, F, B♭, E♭, A♭, D♭.' },
  quiz: [
    q('How many sharps does F♯ major have?', ['6', '5', '7', '4'], 0, 'F♯ major has six sharps, the last being E♯.'),
    q('A key signature with F♯ C♯ G♯ is which major key?', ['A', 'E', 'B', 'D'], 0, 'The last sharp is G♯, a half step below A.'),
    q('A key signature with B♭ E♭ A♭ is which major key?', ['E♭', 'B♭', 'A♭', 'F'], 0, 'The second-to-last flat is E♭.'),
    q('Which key sounds the same as F♯ major on the piano?', ['G♭ major', 'F major', 'G major', 'E♭ major'], 0, 'F♯ and G♭ are enharmonic keys.'),
    q('What is the relative minor of G major?', ['E minor', 'B minor', 'A minor', 'D minor'], 0, 'The 6th note of G major is E.')
  ]
});

L.push({
  id: 'minor-keys', cat: 'Scales', title: 'Minor scales in more keys', minutes: 12, req: ['circle-fifths', 'natural-minor'],
  why: 'With one shortcut you can build a natural minor scale in any key, not just the ones you memorised.',
  objective: 'Play G, C, B and F natural minor scales and use the "flatten 3, 6, 7" shortcut.',
  theory: [
    'Shortcut: take the major scale on the same root and lower the 3rd, 6th and 7th notes by a half step. G major is G A B C D E F♯. Lower B, E and F♯ and you get G minor: G A B♭ C D E♭ F.',
    'Or use relatives. C minor shares its notes with E♭ major, so it has three flats: B♭ E♭ A♭. G minor shares with B♭ major: two flats. B minor shares with D major: two sharps. F minor shares with A♭ major: four flats.',
    'Fingering: G, C and B minor use 1 2 3, thumb under, 1 2 3 4 5. F minor uses 1 2 3 4, thumb under, 1 2 3 4, like F major.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    scStep('G', 'minor', MFING.G, 'G minor: G A B♭ C D E♭ F G. Two flats.'),
    scStep('C', 'minor', MFING.C, 'C minor: C D E♭ F G A♭ B♭ C. Three flats.'),
    scStep('B', 'minor', MFING.B, 'B minor: B C♯ D E F♯ G A B. Two sharps.'),
    scStep('F', 'minor', MFING.F, 'F minor: F G A♭ B♭ C D♭ E♭ F. Four flats.')
  ] },
  listen: [heard('G', 'minor'), heard('C', 'minor'), heard('B', 'minor')],
  play: upEx('G', 'minor', MFING.G, { prompt: 'Play G natural minor. B♭ and E♭ are the changes from G major.' }),
  practice: [
    upEx('C', 'minor', MFING.C, { prompt: 'Play C natural minor.' }),
    upEx('B', 'minor', MFING.B, { prompt: 'Play B natural minor. Two sharps: F♯ and C♯.' })
  ],
  apply: { text: 'Any key a singer chooses may be minor. With this shortcut you can find the notes and the chords (i, iv, v) in any of them within seconds.' },
  challenge: bothEx('F', 'minor', MFING.F, { hints: false, maxMiss: 3, prompt: 'Challenge: F minor up and back down, no hints.' }),
  quiz: [
    q('To get a minor scale from the major scale on the same root, flatten which degrees?', ['3, 6 and 7', '2, 3 and 7', '4 and 5', 'Only the 7th'], 0, 'Lower the 3rd, 6th and 7th.'),
    q('How many flats does C minor have?', ['1', '2', '3', '4'], 2, 'C minor shares its notes with E♭ major: B♭ E♭ A♭.'),
    q('What is the relative major of G minor?', ['B♭ major', 'D major', 'E♭ major', 'F major'], 0, 'The 3rd note of G minor is B♭.'),
    q('B minor has the same key signature as…', ['D major', 'A major', 'G major', 'E major'], 0, 'B minor and D major both have F♯ and C♯.'),
    q('What is the 3rd note of C minor?', ['E♭', 'E', 'D♭', 'F'], 0, 'C D E♭: the 3rd is lowered.')
  ]
});

/* ------------------------- module: arpeggios and left-hand patterns ------------------------- */
const arp = (notes, f, o) => Object.assign({ type: 'seq', notes: notes.concat(rev(notes).slice(1)), fingers: f ? f.concat(rev(f).slice(1)) : undefined, hints: true, range: SR }, o || {});
const arpUp = (notes, f, o) => Object.assign({ type: 'seq', notes, fingers: f, hints: true, range: SR }, o || {});

L.push({
  id: 'arpeggio-major', cat: 'Arpeggios', title: 'Major arpeggios', minutes: 10, req: ['metronome-play', 'triad-major'],
  why: 'Arpeggios turn a chord into a flowing line. They are the first tool for ballad intros, fills between vocal lines and smooth accompaniment.',
  objective: 'Play C, F and G major arpeggios up and down with steady fingering.',
  theory: [
    'An arpeggio is the notes of a chord played one after another instead of together. A C major arpeggio is C E G, then the octave C.',
    'Right hand fingering for most triads: 1 2 3 5 going up (thumb, index, middle, pinky). Keep the wrist level and let the hand follow the shape rather than reaching.',
    'Keep the notes even and the timing steady. Try to play so quietly in the middle that the top note sings.',
    'The same shape works in any key: find the root, 3rd and 5th. F major is F A C F. G major is G B D G.'
  ],
  visual: { range: SR, labels: 'fingers', steps: [
    { caption: 'C major arpeggio: C E G C, fingers 1 2 3 5.', hi: ['C4', 'E4', 'G4', 'C5'], fingers: { C4: 1, E4: 2, G4: 3, C5: 5 } },
    { caption: 'F major arpeggio: F A C F.', hi: ['F4', 'A4', 'C5', 'F5'], fingers: { F4: 1, A4: 2, C5: 3, F5: 5 } },
    { caption: 'G major arpeggio: G B D G.', hi: ['G4', 'B4', 'D5', 'G5'], fingers: { G4: 1, B4: 2, D5: 3, G5: 5 } }
  ] },
  listen: [
    { label: 'C arpeggio, slowly', spec: { kind: 'notes', notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], d: 0.5 } },
    { label: 'The same notes as a chord', spec: { kind: 'chord', root: 'C', quality: 'major', oct: 4, d: 2.5 } },
    { label: 'Rolled slowly, then held', spec: { kind: 'chord', root: 'C', quality: 'major', oct: 4, mode: 'both' } }
  ],
  play: arp(['C4', 'E4', 'G4', 'C5'], [1, 2, 3, 5], { prompt: 'Play the C major arpeggio up and back down.' }),
  practice: [
    arp(['F4', 'A4', 'C5', 'F5'], [1, 2, 3, 5], { prompt: 'The same shape on F.' }),
    arp(['G4', 'B4', 'D5', 'G5'], [1, 2, 3, 5], { prompt: 'And on G.' })
  ],
  apply: { text: 'Before a worship song starts, rolling a soft arpeggio of the first chord sets the key and the mood. Between sung lines, a quick arpeggio fills the space without covering the singer.' },
  challenge: { type: 'seq', notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'F4', 'A4', 'C5', 'A4', 'F4'], hints: false, maxMiss: 2, range: SR, prompt: 'Challenge: a C arpeggio up and down, then an F arpeggio up and down (stop at the F). No hints.' },
  quiz: [
    q('An arpeggio is…', ['The notes of a chord played one after another', 'All the notes of a chord at once', 'A type of scale', 'A rest in the music'], 0, 'Arpeggio means "harp-like": the chord spread out.'),
    q('Which notes make a G major arpeggio?', ['G B D G', 'G A B D', 'G B D F', 'G C D G'], 0, 'Root, major 3rd, perfect 5th, octave.'),
    q('A common right-hand fingering for a one-octave triad arpeggio is…', ['1 2 3 5', '1 2 3 4', '5 3 2 1', '2 3 4 5'], 0, 'Thumb, index, middle, pinky.'),
    q('Listen. Is this an arpeggio or a scale?', ['Arpeggio', 'Scale'], 0, 'The notes jump by thirds instead of stepping.', { listen: { kind: 'notes', notes: ['C4', 'E4', 'G4', 'C5'], d: 0.5 } })
  ]
});

L.push({
  id: 'arpeggio-7ths', cat: 'Arpeggios', title: 'Minor and seventh-chord arpeggios', minutes: 12, req: ['arpeggio-major', 'g-sevenths'],
  why: 'Gospel colour lives in the 7th. Playing 7th-chord arpeggios fluently makes fills and intros sound rich.',
  objective: 'Play Am, Dm and Em arpeggios, and Cmaj7, Am7 and G7 arpeggios.',
  theory: [
    'A minor arpeggio uses the same shape with a lowered 3rd. A minor: A C E A. D minor: D F A D. E minor: E G B E.',
    'To add the 7th, include one more note above the 5th. Cmaj7: C E G B. Am7: A C E G. G7: G B D F. The 7th arpeggio has four different notes, so keep your hand relaxed and move smoothly.',
    'Fingering: 1 2 3 5 for triads. For 7th chords you can use 1 2 3 4 5 across a wider span, or 1 2 3 5 and adjust. Choose the fingering that keeps the hand relaxed and listen for evenness.'
  ],
  visual: { range: SR, steps: [
    { caption: 'Am arpeggio: A C E A.', hi: ['A4', 'C5', 'E5', 'A5'] },
    { caption: 'Cmaj7 arpeggio: C E G B.', hi: ['C4', 'E4', 'G4', 'B4'] },
    { caption: 'Am7 arpeggio: A C E G.', hi: ['A4', 'C5', 'E5', 'G5'] },
    { caption: 'G7 arpeggio: G B D F.', hi: ['G4', 'B4', 'D5', 'F5'] }
  ] },
  listen: [
    { label: 'Am arpeggio', spec: { kind: 'notes', notes: ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4'], d: 0.45 } },
    { label: 'Cmaj7 arpeggio', spec: { kind: 'notes', notes: ['C4', 'E4', 'G4', 'B4', 'G4', 'E4', 'C4'], d: 0.45 } },
    { label: 'Am7 arpeggio', spec: { kind: 'notes', notes: ['A4', 'C5', 'E5', 'G5', 'E5', 'C5', 'A4'], d: 0.45 } }
  ],
  play: arp(['A4', 'C5', 'E5', 'A5'], [1, 2, 3, 5], { prompt: 'Play the A minor arpeggio up and down.' }),
  practice: [
    arp(['D4', 'F4', 'A4', 'D5'], [1, 2, 3, 5], { prompt: 'D minor: D F A D.' }),
    arp(['E4', 'G4', 'B4', 'E5'], [1, 2, 3, 5], { prompt: 'E minor: E G B E.' }),
    arp(['C4', 'E4', 'G4', 'B4'], null, { prompt: 'Cmaj7: C E G B, up and back down.' })
  ],
  apply: { text: 'Between phrases of a slow worship song, a gentle Am7 or Cmaj7 arpeggio is the classic gospel sound. Keep it soft and let the notes ring.' },
  challenge: { type: 'seq', notes: ['A4', 'C5', 'E5', 'G5', 'E5', 'C5', 'A4', 'D4', 'F4', 'A4', 'C5'], hints: false, maxMiss: 2, range: SR, prompt: 'Challenge: Am7 arpeggio up and back down, then Dm7 up (D F A C). No hints.' },
  quiz: [
    q('Which notes make an Am7 arpeggio?', ['A C E G', 'A C E G♯', 'A C♯ E G', 'A D E G'], 0, 'A minor triad plus the 7th, G.'),
    q('What does the 7th add to a triad arpeggio?', ['A fourth note a third above the 5th', 'A rest', 'A new key', 'A faster tempo'], 0, 'It stacks another third on top of the 5th.'),
    q('Which notes make a D minor arpeggio?', ['D F A', 'D F♯ A', 'D F A♯', 'E♭ G B♭'], 0, 'D minor is D F A.'),
    q('What is the top note of a Cmaj7 arpeggio (starting on C)?', ['B', 'B♭', 'A', 'D'], 0, 'Cmaj7 is C E G B.')
  ]
});

L.push({
  id: 'lh-patterns', cat: 'Left hand', title: 'Left-hand patterns', minutes: 12, req: ['bass-and-chords', 'arpeggio-major'],
  why: 'A steady, confident left hand is what makes the right hand sound like music. Gospel starts in the bass.',
  objective: 'Play the root – 5th – octave – 5th pattern in C, F and G with the left hand.',
  theory: [
    'The simplest strong bass is the root alone. Add the 5th above it and you have the "open" sound that fits any major or minor chord. Add the octave and you have a full, rolling pattern.',
    'Pattern in C: C (low), G, C (an octave up), G, then repeat. Left-hand fingers: 5 2 1 2 (pinky, index, thumb, index). Place the pinky on the low C and let the hand open naturally.',
    'The pattern moves with the chord. In F: F, C, F, C. In G: G, D, G, D. Notice that the 5th of F is C, and the 5th of G is D.',
    'Keep the pattern even. Each note should have the same weight, so your right hand can sit on top of it.'
  ],
  visual: { range: [36, 60], labels: 'fingers', steps: [
    { caption: 'C pattern: C3 G3 C4 G3. Fingers 5 2 1 2.', hi: ['C3', 'G3', 'C4'], fingers: { C3: 5, G3: 2, C4: 1 } },
    { caption: 'F pattern: F2 C3 F3 C3.', hi: ['F2', 'C3', 'F3'], fingers: { F2: 5, C3: 2, F3: 1 } },
    { caption: 'G pattern: G2 D3 G3 D3.', hi: ['G2', 'D3', 'G3'], fingers: { G2: 5, D3: 2, G3: 1 } }
  ] },
  listen: [{ label: 'C pattern', spec: { kind: 'notes', notes: ['C3', 'G3', 'C4', 'G3', 'C3', 'G3', 'C4', 'G3'], d: 0.5 } }, { label: 'F pattern', spec: { kind: 'notes', notes: ['F2', 'C3', 'F3', 'C3', 'F2', 'C3', 'F3', 'C3'], d: 0.5 } }],
  play: { type: 'seq', notes: ['C3', 'G3', 'C4', 'G3', 'C3', 'G3', 'C4', 'G3'], fingers: [5, 2, 1, 2, 5, 2, 1, 2], hints: true, range: [36, 60], prompt: 'Play the C pattern twice with your left hand: C, G, C, G.' },
  practice: [
    { type: 'seq', notes: ['F2', 'C3', 'F3', 'C3', 'F2', 'C3', 'F3', 'C3'], fingers: [5, 2, 1, 2, 5, 2, 1, 2], hints: true, range: [36, 60], prompt: 'The same pattern on F: F, C, F, C.' },
    { type: 'seq', notes: ['G2', 'D3', 'G3', 'D3', 'G2', 'D3', 'G3', 'D3'], fingers: [5, 2, 1, 2, 5, 2, 1, 2], hints: true, range: [36, 60], prompt: 'And on G: G, D, G, D.' }
  ],
  apply: { text: 'Worship pianists often hold a root-and-fifth pattern under a whole verse while the right hand floats above with chords and melody. Try it under any song you know.' },
  challenge: { type: 'seq', notes: ['C3', 'G3', 'C4', 'G3', 'F2', 'C3', 'F3', 'C3', 'G2', 'D3', 'G3', 'D3', 'C3', 'G3', 'C4', 'G3'], hints: false, maxMiss: 3, range: [36, 60], prompt: 'Challenge: C pattern, F pattern, G pattern, then C again. No hints.' },
  quiz: [
    q('Which notes make the root – 5th – octave – 5th pattern in C?', ['C G C G', 'C E G E', 'C D E F', 'C C C C'], 0, 'C, then G, then C an octave up, then G.'),
    q('What is the 5th above F?', ['C', 'B♭', 'A', 'D'], 0, 'F G A B♭ C: the fifth note is C.'),
    q('What is the 5th above G?', ['D', 'C', 'A', 'B'], 0, 'G A B C D: the fifth note is D.'),
    q('Why do pianists use root and 5th in the bass?', ['It sounds strong and open, and fits major or minor', 'It is the only way to play bass', 'It makes the chord minor', 'It hides mistakes'], 0, 'With no 3rd, the pattern works under either quality.')
  ]
});

L.push({
  id: 'rhythm-patterns', cat: 'Rhythm', title: 'Rhythm patterns: eighths and syncopation', minutes: 11, req: ['lh-patterns', 'note-values'],
  why: 'Gospel grooves live between the beats. Learning to feel eighth notes and off-beat accents is what makes chords bounce instead of sit.',
  objective: 'Tap eighth notes, dotted rhythms and off-beat patterns accurately with the click.',
  theory: [
    'Divide each beat in two and you have eighth notes. Counting out loud: "1 & 2 & 3 & 4 &". The numbers are the beats, the "&"s are the halfway points.',
    'A dotted quarter lasts one and a half beats, followed by an eighth to complete the pair. Tap it as "1 ... & 2": the long note, then a quick one.',
    'Syncopation means putting accents in unexpected places, between the beats. Tap the "&" instead of the number and you feel it push forward.',
    'Gospel left hands use all of these. A pattern like "1, & of 2, 3, & of 4" gives a bouncy lift that the congregation can clap along to.'
  ],
  listen: [
    { label: 'Eighth notes', spec: { kind: 'rhythm', pattern: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], bpm: 80, note: 60 } },
    { label: 'Dotted quarter + eighth', spec: { kind: 'rhythm', pattern: [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1], bpm: 80, note: 60 } },
    { label: 'A gospel push', spec: { kind: 'rhythm', pattern: [1, 0.5, 1, 0.5, 1, 0.5, 0.5], bpm: 80, note: 60 } }
  ],
  play: { type: 'tap', bpm: 70, bpb: 4, pattern: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1], prompt: 'After the count-in, tap eight steady eighth notes (two per click), then two quarter notes.' },
  practice: [
    { type: 'tap', bpm: 70, bpb: 4, pattern: [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1], prompt: 'Dotted quarter, eighth, quarter, quarter. Then again.' },
    { type: 'tap', bpm: 70, bpb: 4, pattern: [1, 0.5, 1, 0.5, 1, 0.5, 0.5], prompt: 'A gospel push: quarter, eighth, quarter, eighth, quarter, eighth, eighth.' }
  ],
  apply: { text: 'Take your C root-and-fifth pattern and play it on this rhythm. The same four notes sound completely different when you change where they fall.' },
  challenge: { type: 'tap', bpm: 80, bpb: 4, tol: 0.15, pattern: [1.5, 0.5, 1, 1, 1.5, 0.5, 2], prompt: 'Challenge: 80 BPM with a tighter window. Dotted quarter, eighth, quarter, quarter, dotted quarter, eighth, half.' },
  quiz: [
    q('How many eighth notes fit in one quarter-note beat?', ['2', '1', '3', '4'], 0, 'Two eighths equal one quarter.'),
    q('A dotted quarter note lasts…', ['1½ beats', '2 beats', '1 beat', '¾ beat'], 0, 'A dot adds half the note\'s value: 1 + ½.'),
    q('Syncopation means…', ['Accenting between the beats', 'Playing very loudly', 'Playing without a pulse', 'Playing only on beat 1'], 0, 'The accents fall on the off-beats.'),
    q('In "1 & 2 & 3 & 4 &", the "&" falls…', ['Halfway between the beats', 'On the beat', 'On the downbeat', 'After four beats'], 0, 'The "&" is the half-beat.')
  ]
});

/* ------------------------- module: progressions and charts ------------------------- */
L.push({
  id: 'progs-keys', cat: 'Progressions', title: 'Common progressions in every key', minutes: 14, req: ['lh-patterns', 'flat-keys', 'chords-in-key'],
  why: 'Once you think in numbers, any progression you know in C works in every other key. This is how real musicians learn songs fast.',
  objective: 'Play 1 – 4 – 5 – 1 and 1 – 5 – 6m – 4 with bass in several keys.',
  theory: [
    'Chords come from the scale of the key. So the 1, 4 and 5 chords change with the key, but the pattern stays the same.',
    'In C: C F G. In G: G C D. In D: D G A. In F: F B♭ C. In B♭: B♭ E♭ F. In E♭: E♭ A♭ B♭. In A♭: A♭ D♭ E♭.',
    'The 6m chord is a minor chord built on the 6th note. In C it is Am, in G it is Em, in D it is Bm, in F it is Dm, in E♭ it is Cm, in A it is F♯m.',
    'Do not memorise chord names for each key. Learn the major scale for the key, then count: 1 is the first note, 4 is the fourth, 5 is the fifth, 6m is the sixth.'
  ],
  visual: { chordsInKey: 'G', range: [48, 72] },
  listen: [
    { label: '1 – 4 – 5 – 1 in G', spec: { kind: 'prog', key: 'G', degs: [1, 4, 5, 1], sevenths: false, style: 'whole', bpc: 4, bpm: 76 } },
    { label: '1 – 5 – 6m – 4 in D', spec: { kind: 'prog', key: 'D', degs: [1, 5, 6, 4], sevenths: false, style: 'groove', bpc: 4, bpm: 80 } },
    { label: '1 – 5 – 6m – 4 in E♭', spec: { kind: 'prog', key: 'Eb', degs: [1, 5, 6, 4], sevenths: false, style: 'groove', bpc: 4, bpm: 80 } }
  ],
  play: chExs('G', [1, 4, 5, 1], false, ['1', '4', '5', '1'], { prompt: 'In G, play 1 – 4 – 5 – 1 with a bass note under each chord: G, C, D, G.' }),
  practice: [
    chExs('D', [1, 4, 5, 1], false, ['1', '4', '5', '1'], { prompt: 'In D: D, G, A, D.' }),
    chExs('F', [1, 4, 5, 1], false, ['1', '4', '5', '1'], { prompt: 'In F: F, B♭, C, F.' }),
    chExs('A', [1, 5, 6, 4], false, ['1', '5', '6m', '4'], { prompt: 'In A, play 1 – 5 – 6m – 4: A, E, F♯m, D.' })
  ],
  apply: { text: 'Try the Song Lab: choose a progression and cycle through keys. When a singer asks for a new key, you only need to know where 1 is.' },
  challenge: chExs('Eb', [1, 5, 6, 4], false, ['1', '5', '6m', '4'], { hints: false, prompt: 'Challenge: 1 – 5 – 6m – 4 in E♭ without hints (E♭, B♭, Cm, A♭).' }),
  quiz: [
    q('In D major, what is the 5 chord?', ['A', 'G', 'E', 'B'], 0, 'D E F♯ G A: the 5th note is A.'),
    q('In F major, what is the 4 chord?', ['B♭', 'C', 'G', 'D'], 0, 'F G A B♭: the 4th note is B♭.'),
    q('In E♭ major, what are the 1, 4 and 5 chords?', ['E♭ A♭ B♭', 'E♭ B♭ A♭', 'E♭ G B♭', 'E♭ D♭ A♭'], 0, 'E♭ F G A♭ B♭: 1 is E♭, 4 is A♭, 5 is B♭.'),
    q('In A major, what is the 6m chord?', ['F♯m', 'Em', 'Bm', 'Dm'], 0, 'A B C♯ D E F♯: the 6th note is F♯, so the 6m is F♯m.'),
    q('In B♭, 1 – 5 – 6m – 4 is…', ['B♭ F Gm E♭', 'B♭ F Cm E♭', 'B♭ E♭ F Gm', 'B♭ F Gm D'], 0, 'B♭ C D E♭ F G: 5 is F, 6m is Gm, 4 is E♭.')
  ]
});

L.push({
  id: 'progs-minor', cat: 'Progressions', title: 'Progressions in minor keys', minutes: 12, req: ['progs-keys', 'harmonic-melodic'],
  why: 'Many powerful songs sit in a minor key. Knowing the minor-key chords and the standard movements lets you accompany them with confidence.',
  objective: 'Play three common minor-key progressions with bass in A, D and E minor.',
  theory: [
    'Build triads on a natural minor scale and you get: i, ii°, III, iv, v, VI, VII. In A minor: Am, Bdim, C, Dm, Em, F, G. In numbers: 1m, 2°, ♭3, 4m, 5m, ♭6, ♭7.',
    'The "major V" version: because harmonic minor raises the 7th, the V chord is often major (E or E7). That gives i – iv – V – i: Am, Dm, E, Am.',
    'Three common movements: i – iv – V – i (Am Dm E Am), i – VI – III – VII (Am F C G, a sweeping lift), and i – VII – VI – V (Am G F E, a descending line).',
    'Remember that the relative major is where the III chord comes from: A minor shares its notes with C major.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Am: the i chord.', chord: { root: 'A', quality: 'minor', oct: 4 } },
    { caption: 'Dm: the iv chord.', chord: { root: 'D', quality: 'minor', oct: 4 } },
    { caption: 'E: the V chord, major because of G♯.', chord: { root: 'E', quality: 'major', oct: 4 } }
  ] },
  listen: [
    { label: 'Am – Dm – E – Am', spec: { kind: 'chords', list: [{ root: 'A', quality: 'minor', bass: true }, { root: 'D', quality: 'minor', bass: true }, { root: 'E', quality: 'major', bass: true }, { root: 'A', quality: 'minor', bass: true }], d: 1.8 } },
    { label: 'Am – F – C – G', spec: { kind: 'chords', list: [{ root: 'A', quality: 'minor', bass: true }, { root: 'F', quality: 'major', bass: true }, { root: 'C', quality: 'major', bass: true }, { root: 'G', quality: 'major', bass: true }], d: 1.8 } }
  ],
  play: { type: 'chord', range: [48, 72], targets: [bassCh('A', 'minor', { label: 'i' }), bassCh('D', 'minor', { label: 'iv' }), bassCh('E', 'major', { label: 'V' }), bassCh('A', 'minor', { label: 'i' })], hints: true, prompt: 'In A minor: Am, Dm, E, Am, each with a low bass note.' },
  practice: [
    { type: 'chord', range: [48, 72], targets: [bassCh('A', 'minor', { label: 'i' }), bassCh('F', 'major', { label: 'VI' }), bassCh('C', 'major', { label: 'III' }), bassCh('G', 'major', { label: 'VII' })], hints: true, prompt: 'i – VI – III – VII in A minor: Am, F, C, G.' },
    { type: 'chord', range: [48, 72], targets: [bassCh('D', 'minor', { label: 'i' }), bassCh('Bb', 'major', { label: 'VI' }), bassCh('F', 'major', { label: 'III' }), bassCh('C', 'major', { label: 'VII' })], hints: true, prompt: 'The same movement in D minor: Dm, B♭, F, C.' }
  ],
  apply: { text: 'A minor progression often starts a song softly and lifts into the relative major for the chorus. Practise moving from Am – F – C – G into C – G – Am – F.' },
  challenge: { type: 'chord', range: [47, 72], targets: [bassCh('E', 'minor', { label: 'i' }), bassCh('A', 'minor', { label: 'iv' }), bassCh('B', 'major', { label: 'V' }), bassCh('E', 'minor', { label: 'i' })], hints: false, prompt: 'Challenge: E minor, A minor, B, E minor, no hints.' },
  quiz: [
    q('In A minor, what is the III chord?', ['C', 'E', 'F', 'G'], 0, 'A B C: the 3rd note is C, and C major is the III chord.'),
    q('In A minor, what is the VI chord?', ['F', 'G', 'D', 'E'], 0, 'A B C D E F: the 6th note is F, and F major is the VI chord.'),
    q('Why is the V chord in A minor often major (E)?', ['The raised 7th, G♯, pulls strongly to A', 'It is easier to play', 'It is the relative major', 'No reason'], 0, 'The leading tone G♯ is part of E major.'),
    q('Am – F – C – G in numbers is…', ['i – VI – III – VII', 'i – iv – v – i', 'i – ii – III – iv', 'I – IV – V – I'], 0, 'A is i, F is VI, C is III, G is VII.')
  ]
});

L.push({
  id: 'chord-charts', cat: 'Progressions', title: 'Reading chord charts and slash chords', minutes: 12, req: ['progs-keys', 'inversions'],
  why: 'Most music you will be handed is a chord chart, not full notation. Reading one quickly is how you join a band or a service.',
  objective: 'Read a chord chart with slash chords and play it.',
  theory: [
    'A chord chart shows the chord symbol for each bar. Vertical lines are bar lines, and each bar usually gets four beats. A chart looks like this: | C | G/B | Am | F |',
    'A slash chord such as G/B means "play a G chord with B as the lowest note". The note after the slash is the bass. G/B is G major in first inversion: B D G, with B in the bass.',
    'Slash chords make the bass note move smoothly: C, G/B, Am gives a bass line of C, B, A, stepping down. This is one of the most gospel-sounding moves.',
    'Other symbols: % repeats the last bar, a double bar line marks a section end, and a Roman or number chart like | 1 | 5 | 6m | 4 | works in any key.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C: the first chord of the chart.', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: 'G/B: G major with B on the bottom.', chord: { root: 'G', quality: 'major', oct: 4, inv: 1 } },
    { caption: 'Am: the bass has stepped down from B to A.', chord: { root: 'A', quality: 'minor', oct: 4 } }
  ] },
  listen: [
    { label: '| C | G/B | Am | F |', spec: { kind: 'chords', list: [{ root: 'C', quality: 'major' }, { root: 'G', quality: 'major', inv: 1 }, { root: 'A', quality: 'minor' }, { root: 'F', quality: 'major' }], d: 1.8 } }
  ],
  play: { type: 'chord', targets: [{ root: 'C', quality: 'major' }, { root: 'G', quality: 'major', inv: 1, label: 'G/B' }, { root: 'A', quality: 'minor' }, { root: 'F', quality: 'major' }], hints: true, prompt: 'Play the chart: | C | G/B | Am | F |. The G/B has B as the lowest note.' },
  practice: [
    { type: 'chord', targets: [{ root: 'C', quality: 'major' }, { root: 'C', quality: 'major', inv: 1, label: 'C/E' }, { root: 'F', quality: 'major' }, { root: 'G', quality: 'major' }], hints: true, prompt: 'Play | C | C/E | F | G |. The C/E has E as the lowest note.' },
    { type: 'chord', targets: [{ root: 'F', quality: 'major' }, { root: 'F', quality: 'major', inv: 1, label: 'F/A' }, { root: 'G', quality: 'major' }, { root: 'C', quality: 'major' }], hints: true, prompt: 'Play | F | F/A | G | C |.' }
  ],
  apply: { text: 'Ask for charts with slash chords and you will play like a pro. In worship, a bass line that walks stepwise (C, B, A, G) under changing chords is the most recognisable "church" motion there is.' },
  challenge: { type: 'chord', targets: [{ root: 'G', quality: 'major' }, { root: 'G', quality: 'major', inv: 1, label: 'G/B' }, { root: 'C', quality: 'major' }, { root: 'D', quality: 'major' }, { root: 'G', quality: 'major' }], hints: false, prompt: 'Challenge: | G | G/B | C | D | G |, no hints.' },
  quiz: [
    q('In the chord C/E, which note is the bass?', ['E', 'C', 'G', 'B'], 0, 'The note after the slash is the bass note.'),
    q('What does G/B mean?', ['G major with B in the bass', 'B major with G in the bass', 'G7', 'B minor'], 0, 'G major in first inversion.'),
    q('A "%" in a bar means…', ['Repeat the previous bar', 'Play louder', 'Rest', 'The song ends'], 0, 'It is shorthand for "same as before".'),
    q('In G, the number chart | 1 | 5 | 6m | 4 | is…', ['G D Em C', 'G C D Em', 'G D C Em', 'G Em D C'], 0, '1 = G, 5 = D, 6m = Em, 4 = C.')
  ]
});

L.push({
  id: 'transpose-basic', cat: 'Progressions', title: 'Same song, new key', minutes: 12, req: ['progs-keys', 'circle-fifths'],
  why: 'Singers change keys. If you can move a progression into a new key without writing anything down, you are ready for any service.',
  objective: 'Move a 1 – 6m – 4 – 5 progression into several keys by thinking in numbers.',
  theory: [
    'Transposing means moving every chord by the same distance. If the singer wants the song a whole step higher, every chord goes up two half steps. C becomes D, F becomes G, Am becomes Bm.',
    'The easy way: do not shift every chord. Find the new 1 chord and rebuild the progression from the numbers. 1 – 6m – 4 – 5 in C is C Am F G. In E♭ it is E♭ Cm A♭ B♭. In D it is D Bm G A.',
    'Pick the new key, spell its major scale (use the circle of fifths for the key signature), then number the notes. Each number gives you the chord root. The quality stays the same.',
    'Practise until you can say "same song in A♭" and have your hands there.'
  ],
  visual: { chordsInKey: 'Eb', range: [48, 72] },
  listen: [
    { label: '1 – 6m – 4 – 5 in C', spec: { kind: 'prog', key: 'C', degs: [1, 6, 4, 5], sevenths: false, style: 'whole', bpc: 4, bpm: 76 } },
    { label: 'The same in E♭', spec: { kind: 'prog', key: 'Eb', degs: [1, 6, 4, 5], sevenths: false, style: 'whole', bpc: 4, bpm: 76 } }
  ],
  play: chExs('C', [1, 6, 4, 5], false, ['1', '6m', '4', '5'], { prompt: 'In C: C, Am, F, G with bass notes.' }),
  practice: [
    chExs('Eb', [1, 6, 4, 5], false, ['1', '6m', '4', '5'], { prompt: 'Now in E♭: E♭, Cm, A♭, B♭.' }),
    chExs('D', [1, 6, 4, 5], false, ['1', '6m', '4', '5'], { range: [47, 72], prompt: 'And in D: D, Bm, G, A.' })
  ],
  apply: { text: 'Ask a friend to call a key at random, "A♭!", and play 1 – 6m – 4 – 5 in it. Doing this a little every day builds the automatic key sense that worship musicians rely on.' },
  challenge: chExs('Ab', [1, 6, 4, 5], false, ['1', '6m', '4', '5'], { hints: false, prompt: 'Challenge: A♭, Fm, D♭, E♭, no hints.' }),
  quiz: [
    q('Move C, F, G down a whole step. You get…', ['B♭ E♭ F', 'B C♯ D♯', 'B♭ E F', 'A D E'], 0, 'Each chord drops two half steps.'),
    q('A song in C moves up a whole step to D. The chord F becomes…', ['G', 'E', 'F♯', 'A'], 0, 'F up two half steps is G.'),
    q('What is the easiest way to transpose a progression?', ['Think in numbers and rebuild from the new 1', 'Change every note by ear', 'Play it louder', 'Use only white keys'], 0, 'Numbers describe the pattern, not the key.'),
    q('In E♭, what is the 6m chord?', ['Cm', 'Dm', 'Fm', 'Gm'], 0, 'E♭ F G A♭ B♭ C: the 6th note is C, so Cm.')
  ]
});

BATCH1.modules = [
  { id: 'scales2',  level: '2', title: 'Scales in every key',          blurb: 'Minor scales, all twelve major keys and the circle of fifths.', lessons: ['natural-minor', 'harmonic-melodic', 'sharp-keys', 'flat-keys', 'circle-fifths', 'minor-keys'] },
  { id: 'patterns', level: '2', title: 'Arpeggios and left-hand patterns', blurb: 'Flowing chord lines, steady bass patterns and rhythm.', lessons: ['arpeggio-major', 'arpeggio-7ths', 'lh-patterns', 'rhythm-patterns'] },
  { id: 'progs',    level: '2', title: 'Progressions and charts',      blurb: 'Common progressions in every key, minor keys, chord charts and transposing.', lessons: ['progs-keys', 'progs-minor', 'chord-charts', 'transpose-basic'] }
];

/* merge into the curriculum */
LESSONS.push.apply(LESSONS, BATCH1.lessons);
MODULES.splice(MODULES.findIndex(m => m.id === 'found') + 1, 0, ...BATCH1.modules);


/* ===================== BATCH 2 · Level 3 (Intermediate piano) =====================
   Sevenths in depth, colour chords, harmony language, ii–V–I, accompaniment skills.
   Inserted by build.js at the BATCH2 marker, after batch 1 (shares its helpers). */
const B2 = { lessons: [], modules: [] };
const M = B2.lessons;
const W = [48, 84];                                   // wide keyboard for tall chords
const cT = (root, quality, x) => Object.assign({ root, quality }, x || {});
const cExs = (targets, prompt, o) => Object.assign({ type: 'chord', range: [48, 72], targets, hints: true, prompt }, o || {});
const kchords = (names, o) => ({ kind: 'chords', list: names, d: (o && o.d) || 1.8 });

/* ------------------------- module: seventh chords in depth ------------------------- */
M.push({
  id: 'sevenths-deep', cat: 'Seventh chords', title: 'Half-diminished and diminished 7th chords', minutes: 12, req: ['dim-aug', 'g-sevenths'],
  why: 'These two tense chords complete the seventh-chord family. You need them for minor ii–V–i progressions and for gospel passing chords.',
  objective: 'Build and play half-diminished (m7♭5) and diminished 7th chords on any root.',
  theory: [
    'You already know three 7th chords: major 7th, minor 7th and dominant 7th. Two more complete the family.',
    'Half-diminished (written m7♭5, or ø): root, minor 3rd, diminished 5th, minor 7th. B half-diminished is B D F A. It is a diminished triad with a minor 7th added, softer than a full diminished chord, which is why it is called "half".',
    'Diminished 7th (dim7): root, minor 3rd, diminished 5th and a diminished 7th. C dim7 is C E♭ G♭ B♭♭, which sounds the same as A. Every interval is a minor third, so the chord is perfectly symmetrical and sounds restless.',
    'Where do they live? In any major key the half-diminished chord is built on the 7th note (Bm7♭5 in C). In a minor key it is the ii chord. The diminished 7th is the great gospel passing chord, which you will use between chords later on.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Bm7♭5: B D F A. A minor triad with the 5th lowered, plus a minor 7th.', chord: { root: 'B', quality: 'm7b5', oct: 4 } },
    { caption: 'Cdim7: C E♭ G♭ B♭♭ (A). Every note is a minor third above the last.', chord: { root: 'C', quality: 'dim7', oct: 4 } },
    { caption: 'Compare: Cm7 is C E♭ G B♭. Lower the 5th for m7♭5, then lower the 7th as well for dim7.', chord: { root: 'C', quality: 'm7', oct: 4 } }
  ] },
  listen: [
    { label: 'Cm7, then Cm7♭5, then Cdim7', spec: kchords([cT('C', 'm7'), cT('C', 'm7b5'), cT('C', 'dim7')], { d: 2.2 }) },
    { label: 'Bm7♭5 resolving to Cmaj7', spec: kchords([cT('B', 'm7b5'), cT('C', 'maj7')], { d: 2.2 }) }
  ],
  play: cExs([cT('B', 'm7b5'), cT('C', 'dim7')], 'Play Bm7♭5, then Cdim7.'),
  practice: [
    cExs([cT('E', 'm7b5'), cT('D', 'dim7')], 'Play Em7♭5, then Ddim7.'),
    cExs([cT('C', 'm7'), cT('C', 'm7b5'), cT('C', 'dim7')], 'Lower one note at a time: Cm7, Cm7♭5, Cdim7.')
  ],
  apply: { text: 'A diminished 7th chord a half step below a chord leads into it: C♯dim7 slides up to Dm7. You will use that exact move in the Gospel harmony module.' },
  challenge: cExs([cT('A', 'm7b5'), cT('G', 'dim7'), cT('F', 'm7b5')], 'Challenge: Am7♭5, Gdim7, Fm7♭5, no hints.', { hints: false }),
  quiz: [
    q('Which notes make Bm7♭5?', ['B D F A', 'B D F♯ A', 'B D♯ F♯ A', 'B D F A♭'], 0, 'Minor 3rd, diminished 5th, minor 7th.'),
    q('Another name for m7♭5 is…', ['Half-diminished', 'Fully diminished', 'Augmented 7th', 'Suspended 7th'], 0, 'It sits halfway between minor 7th and diminished 7th.'),
    q('A diminished 7th chord is built from stacked…', ['Minor thirds', 'Major thirds', 'Perfect fifths', 'Whole steps'], 0, 'Four notes, each a minor third above the last.'),
    q('In C major, the half-diminished chord is built on…', ['B', 'D', 'F', 'A'], 0, 'The 7th degree, B, gives Bm7♭5.'),
    q('Listen. Which chord is this?', ['Cm7', 'Cdim7'], 1, 'All minor thirds: the symmetrical, restless diminished 7th.', { listen: CHORD_LISTEN('C', 'dim7') })
  ]
});

M.push({
  id: 'sevenths-in-key', cat: 'Seventh chords', title: 'Seventh chords in a key', minutes: 13, req: ['sevenths-deep'],
  why: 'Every major key has seven 7th chords. Knowing which quality sits on which note lets you build the harmony of any song.',
  objective: 'Name and play the seven diatonic 7th chords in C, F and G.',
  theory: [
    'Build a 7th chord on each note of a major scale, using only notes of that scale. The qualities always fall in the same order: maj7, m7, m7, maj7, 7, m7, m7♭5.',
    'In C: Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7♭5. In Roman numerals: Imaj7, ii7, iii7, IVmaj7, V7, vi7, viiø7.',
    'So the I and IV chords are major 7ths, the ii, iii and vi are minor 7ths, the V is the only dominant 7th, and the vii is half-diminished. The same pattern holds in every key.',
    'In F: Fmaj7, Gm7, Am7, B♭maj7, C7, Dm7, Em7♭5. In G: Gmaj7, Am7, Bm7, Cmaj7, D7, Em7, F♯m7♭5.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'I: Cmaj7.', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: 'ii: Dm7.', chord: { root: 'D', quality: 'm7', oct: 4 } },
    { caption: 'V: G7, the only dominant 7th.', chord: { root: 'G', quality: '7', oct: 4 } },
    { caption: 'vii: Bm7♭5.', chord: { root: 'B', quality: 'm7b5', oct: 4 } }
  ] },
  listen: [{ label: 'All seven in C', spec: kchords(EN.progressionChords('C', [1, 2, 3, 4, 5, 6, 7], true).map(c => cT(c.root, c.quality)), { d: 1.6 }) }],
  play: chExs('C', [1, 2, 3, 4], true, ['Imaj7', 'ii7', 'iii7', 'IVmaj7'], { range: [48, 72], prompt: 'In C, play Cmaj7, Dm7, Em7, Fmaj7, each with a bass note.' }),
  practice: [
    chExs('C', [5, 6, 7, 1], true, ['V7', 'vi7', 'viiø7', 'Imaj7'], { range: [47, 72], prompt: 'Now G7, Am7, Bm7♭5, Cmaj7.' }),
    chExs('F', [1, 2, 3, 4, 5, 6], true, ['I', 'ii', 'iii', 'IV', 'V', 'vi'], { prompt: 'The same pattern in F: Fmaj7, Gm7, Am7, B♭maj7, C7, Dm7.' })
  ],
  apply: { text: 'Most gospel chord charts use these chords: Imaj7, ii7, V7 and vi7 are the workhorses. If you can build them in any key from the scale, you can read any chart.' },
  challenge: chExs('G', [1, 6, 2, 5, 1], true, ['I', 'vi', 'ii', 'V', 'I'], { hints: false, range: [47, 72], prompt: 'Challenge: 1 – 6m – 2m – 5 – 1 in G with 7ths: Gmaj7, Em7, Am7, D7, Gmaj7. No hints.' }),
  quiz: [
    q('Which 7th chord sits on the 5th degree of a major key?', ['Dominant 7th', 'Major 7th', 'Minor 7th', 'Half-diminished'], 0, 'V is the dominant 7th.'),
    q('In C, what is the vi7 chord?', ['Am7', 'Fmaj7', 'Em7', 'Dm7'], 0, 'The 6th note is A, and the vi chord is a minor 7th.'),
    q('In C, what chord sits on the 7th degree?', ['Bm7♭5', 'Bdim7', 'B7', 'Bmaj7'], 0, 'The vii chord is half-diminished.'),
    q('In F major, what is the IVmaj7?', ['B♭maj7', 'Cmaj7', 'Gm7', 'Dm7'], 0, 'F G A B♭: the 4th note is B♭.'),
    q('How many chords in a major key are major 7ths?', ['Two: I and IV', 'One', 'Three', 'Four'], 0, 'Only the I and IV chords.')
  ]
});

M.push({
  id: 'dominant-resolution', cat: 'Seventh chords', title: 'The dominant 7th and how it resolves', minutes: 12, req: ['sevenths-in-key'],
  why: 'The pull of a dominant 7th toward home is the engine of tonal music. Hearing and feeling it makes every progression make sense.',
  objective: 'Explain the tritone inside a dominant 7th and play V7 – I in several keys.',
  theory: [
    'Look inside G7: G B D F. The notes B and F are a tritone apart, six half steps, the most unstable interval in music. It wants to resolve.',
    'The resolution is by smallest steps: B moves up a half step to C, and F moves down a half step to E. Those two notes, C and E, are the 1 and 3 of the home chord. The root G falls to C in the bass.',
    'That is why V7 – I sounds so final. Every key has its own V7: in C it is G7, in F it is C7, in G it is D7, in B♭ it is F7.',
    'Gospel players often delay the resolution, for example by playing a sus chord or a passing chord first, to build tension before the landing.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'G7: G B D F. The tritone B to F is the tension.', chord: { root: 'G', quality: '7', oct: 4 } },
    { caption: 'Cmaj7 (or C): B rises to C, F falls to E. Home.', chord: { root: 'C', quality: 'major', oct: 4 } }
  ] },
  listen: [
    { label: 'G7 resolving to C', spec: kchords([cT('G', '7', { bass: true }), cT('C', 'major', { bass: true })], { d: 2 }) },
    { label: 'G7 without resolving (hear it hang)', spec: { kind: 'chord', root: 'G', quality: '7', oct: 4, d: 3 } },
    { label: 'C7 resolving to F', spec: kchords([cT('C', '7', { bass: true }), cT('F', 'major', { bass: true })], { d: 2 }) }
  ],
  play: cExs([bassCh('G', '7', { label: 'V7' }), bassCh('C', 'major', { label: 'I' })], 'Play G7, then C, each with a bass note. Feel the landing.'),
  practice: [
    cExs([bassCh('C', '7', { label: 'V7' }), bassCh('F', 'major', { label: 'I' })], 'In F: C7 then F.'),
    cExs([bassCh('D', '7', { label: 'V7' }), bassCh('G', 'major', { label: 'I' })], 'In G: D7 then G.')
  ],
  apply: { text: 'Before the last chord of a hymn, play V7 and hold it for a beat longer than expected. The congregation leans in, and the resolution feels like an answer.' },
  challenge: cExs([bassCh('A', '7'), bassCh('D', 'major'), bassCh('E', '7'), bassCh('A', 'major'), bassCh('D', '7'), bassCh('G', 'major')], 'Challenge: A7 – D, E7 – A, D7 – G, no hints.', { hints: false }),
  quiz: [
    q('In G7, the tritone is between…', ['B and F', 'G and D', 'D and F', 'G and B'], 0, 'B to F is six half steps.'),
    q('G7 resolves to…', ['C', 'D', 'F', 'A'], 0, 'V7 resolves to I, and G7 is the V7 of C.'),
    q('When G7 resolves to C, the B moves…', ['Up a half step to C', 'Down a whole step to A', 'Down a half step to B♭', 'Stays on B'], 0, 'B rises to C.'),
    q('What is the V7 chord in F?', ['C7', 'Cmaj7', 'Gm7', 'B♭7'], 0, 'C is the 5th note of F major.'),
    q('A tritone is…', ['Six half steps', 'A perfect 5th', 'A major 3rd', 'An octave'], 0, 'Half an octave: six half steps.')
  ]
});

M.push({
  id: 'seventh-inversions', cat: 'Seventh chords', title: 'Seventh chord inversions', minutes: 13, req: ['dominant-resolution', 'inversions'],
  why: 'A 7th chord has four notes, so it has four positions. Moving between them is the secret of smooth chord changes.',
  objective: 'Play a 7th chord in root position and in first, second and third inversion.',
  theory: [
    'A triad has two inversions. A 7th chord has three, because it has four notes. In root position the root is lowest. In first inversion the 3rd is lowest. In second inversion the 5th is lowest. In third inversion the 7th is lowest.',
    'Cmaj7: root position C E G B. First inversion E G B C. Second inversion G B C E. Third inversion B C E G.',
    'Written as slash chords: Cmaj7, Cmaj7/E, Cmaj7/G, Cmaj7/B. The note after the slash tells you the lowest note.',
    'Playing each inversion, you hold the same chord and only change which note is lowest. That is the base of voice leading.'
  ],
  visual: { range: [48, 84], steps: [
    { caption: 'Root position: C E G B.', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: 'First inversion: E G B C.', chord: { root: 'C', quality: 'maj7', oct: 4, inv: 1 } },
    { caption: 'Second inversion: G B C E.', chord: { root: 'C', quality: 'maj7', oct: 4, inv: 2 } },
    { caption: 'Third inversion: B C E G. The 7th is on the bottom.', chord: { root: 'C', quality: 'maj7', oct: 4, inv: 3 } }
  ] },
  listen: [{ label: 'Four positions of Cmaj7', spec: kchords([cT('C', 'maj7'), cT('C', 'maj7', { inv: 1 }), cT('C', 'maj7', { inv: 2 }), cT('C', 'maj7', { inv: 3 })], { d: 1.6 }) }],
  play: cExs([cT('C', 'maj7'), cT('C', 'maj7', { inv: 1, label: '1st' }), cT('C', 'maj7', { inv: 2, label: '2nd' }), cT('C', 'maj7', { inv: 3, label: '3rd' })], 'Play Cmaj7 in root position, then first, second and third inversion.', { range: W }),
  practice: [
    cExs([cT('G', '7'), cT('G', '7', { inv: 1 }), cT('G', '7', { inv: 2 }), cT('G', '7', { inv: 3 })], 'The same four positions of G7.', { range: W }),
    cExs([cT('A', 'm7'), cT('A', 'm7', { inv: 1 }), cT('A', 'm7', { inv: 2 }), cT('A', 'm7', { inv: 3 })], 'And Am7.', { range: W })
  ],
  apply: { text: 'A pianist rarely plays every chord in root position. Inversions keep the right hand in one small area while the left hand moves the bass. Practise ending each phrase on whichever inversion is closest.' },
  challenge: cExs([cT('A', 'm7', { inv: 1 }), cT('F', 'maj7', { inv: 2 }), cT('G', '7', { inv: 3 }), cT('C', 'maj7')], 'Challenge: Am7 first inversion, Fmaj7 second inversion, G7 third inversion, Cmaj7. No hints.', { hints: false, range: W }),
  quiz: [
    q('In first inversion of a 7th chord, which note is lowest?', ['The 3rd', 'The root', 'The 5th', 'The 7th'], 0, 'First inversion puts the 3rd on the bottom.'),
    q('What is the lowest note in third inversion Cmaj7?', ['B', 'C', 'E', 'G'], 0, 'Third inversion has the 7th, B, in the bass.'),
    q('How many inversions does a 7th chord have?', ['3', '2', '4', '1'], 0, 'One for each note except the root: 3rd, 5th and 7th in the bass.'),
    q('In G7/F, the lowest note is…', ['F', 'G', 'B', 'D'], 0, 'G7/F is the third inversion with F, the 7th, at the bottom.')
  ]
});

/* ------------------------- module: colour chords ------------------------- */
M.push({
  id: 'sus-chords', cat: 'Colour chords', title: 'Suspended chords', minutes: 11, req: ['dominant-resolution'],
  why: 'Sus chords sound open and waiting. They are used constantly in worship to lift a moment before it resolves.',
  objective: 'Build and play sus2, sus4 and 7sus4 chords and resolve them.',
  theory: [
    'Suspended means the 3rd is replaced by a neighbouring note, so the chord is neither major nor minor. In sus4 the 3rd is replaced by the 4th: Csus4 is C F G. In sus2 the 3rd is replaced by the 2nd: Csus2 is C D G.',
    'A sus chord wants to resolve. Csus4 falls to C: the F drops down a half step to E. Csus2 resolves up to C, or simply stays as an open sound.',
    '7sus4 adds a minor 7th: G7sus4 is G C D F. It resolves to G7, and often goes on to C. It is the favourite "leaning" chord of gospel.',
    'Try playing Csus4 then C. The little drop from F to E is one of the most worship-like movements there is.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Csus4: C F G. The 4th replaces the 3rd.', chord: { root: 'C', quality: 'sus4', oct: 4 } },
    { caption: 'Csus2: C D G. The 2nd replaces the 3rd.', chord: { root: 'C', quality: 'sus2', oct: 4 } },
    { caption: 'G7sus4: G C D F.', chord: { root: 'G', quality: '7sus4', oct: 4 } }
  ] },
  listen: [
    { label: 'Csus4, then C', spec: kchords([cT('C', 'sus4'), cT('C', 'major')], { d: 2.2 }) },
    { label: 'G7sus4, G7, then C', spec: kchords([cT('G', '7sus4'), cT('G', '7'), cT('C', 'major')], { d: 1.8 }) }
  ],
  play: cExs([cT('C', 'sus4'), cT('C', 'major')], 'Play Csus4, then C. Feel the F fall to E.'),
  practice: [
    cExs([cT('G', 'sus4'), cT('G', 'major'), cT('D', 'sus4'), cT('D', 'major')], 'Gsus4 – G, then Dsus4 – D.'),
    cExs([cT('C', 'sus2'), cT('C', 'major'), cT('F', 'sus2'), cT('F', 'major')], 'Csus2 – C, then Fsus2 – F.'),
    cExs([cT('G', '7sus4'), cT('G', '7'), cT('C', 'major')], 'G7sus4, G7, then C.')
  ],
  apply: { text: 'When a worship song comes back to the chorus, hold a sus4 on the 1 chord through the last bar before the downbeat. The resolution on the chorus feels like a release.' },
  challenge: cExs([cT('F', 'sus4'), cT('F', 'major'), cT('G', 'sus4'), cT('G', 'major'), cT('C', 'sus4'), cT('C', 'major')], 'Challenge: Fsus4 – F, Gsus4 – G, Csus4 – C, no hints.', { hints: false }),
  quiz: [
    q('Csus4 replaces the 3rd with…', ['The 4th', 'The 2nd', 'The 5th', 'The 7th'], 0, 'C F G: the 4th stands in for the 3rd.'),
    q('Which notes make Csus2?', ['C D G', 'C F G', 'C E G', 'C D F'], 0, 'Root, 2nd, 5th.'),
    q('A sus4 chord usually resolves by…', ['The 4th falling to the 3rd', 'The 4th rising to the 5th', 'Staying forever', 'Changing key'], 0, 'F falls a half step to E in Csus4 to C.'),
    q('Which notes make G7sus4?', ['G C D F', 'G B D F', 'G A D F', 'G C D F♯'], 0, 'Root, 4th, 5th, minor 7th.'),
    q('Listen. Which chord is this?', ['Csus4', 'C major'], 0, 'Neither major nor minor: open and waiting.', { listen: CHORD_LISTEN('C', 'sus4') })
  ]
});

M.push({
  id: 'sixth-chords', cat: 'Colour chords', title: 'Sixth chords', minutes: 11, req: ['sus-chords'],
  why: 'The 6th chord is a gentle, settled alternative to the major 7th, popular in hymns and ballads.',
  objective: 'Build and play major 6th and minor 6th chords.',
  theory: [
    'Add the 6th note of the scale to a triad. C6 is C E G A. Cm6 is C E♭ G A. The 6th is a major 6th above the root, nine half steps.',
    'C6 sounds sweet and finished, less dreamy than Cmaj7. It is often used as the final chord of a song.',
    'Notice that C6 has exactly the same notes as Am7 (A C E G). The two are the same pitches with a different note in the bass. Which one it is depends on the bass note and the context.',
    'Minor 6th chords, such as Cm6 or Dm6, have a haunting, bittersweet colour.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C6: C E G A.', chord: { root: 'C', quality: '6', oct: 4 } },
    { caption: 'Cm6: C E♭ G A.', chord: { root: 'C', quality: 'm6', oct: 4 } },
    { caption: 'Am7: A C E G. Same notes as C6.', chord: { root: 'A', quality: 'm7', oct: 4 } }
  ] },
  listen: [{ label: 'C, then C6', spec: kchords([cT('C', 'major'), cT('C', '6')], { d: 2.2 }) }, { label: 'F6 resolving to C6', spec: kchords([cT('F', '6'), cT('C', '6')], { d: 2.2 }) }],
  play: cExs([cT('C', '6'), cT('F', '6')], 'Play C6, then F6.'),
  practice: [
    cExs([cT('G', '6'), cT('D', 'm6')], 'Play G6, then Dm6.'),
    cExs([cT('C', 'm6'), cT('F', 'm6')], 'Minor 6ths: Cm6, then Fm6.')
  ],
  apply: { text: 'End a hymn on C6 instead of C and the final sound is sweeter and warmer. The Amen cadence F6 – C6 is a classic.' },
  challenge: cExs([bassCh('F', '6'), bassCh('G', '6'), bassCh('C', '6')], 'Challenge: F6, G6, C6 with bass notes, no hints.', { hints: false }),
  quiz: [
    q('Which notes make C6?', ['C E G A', 'C E G B', 'C E G B♭', 'C E♭ G A'], 0, 'A major triad plus the 6th.'),
    q('C6 has the same notes as which chord?', ['Am7', 'Em7', 'Dm7', 'Fmaj7'], 0, 'A C E G is Am7.'),
    q('Which notes make Cm6?', ['C E♭ G A', 'C E♭ G B♭', 'C E G A', 'C E♭ G♭ A'], 0, 'Minor triad plus the major 6th.'),
    q('How many half steps above the root is a major 6th?', ['9', '8', '10', '7'], 0, 'Nine half steps.')
  ]
});

M.push({
  id: 'ninth-chords', cat: 'Colour chords', title: 'Ninth chords: add9, maj9, m9 and dominant 9', minutes: 14, req: ['sixth-chords'],
  why: 'The 9th is the sound that makes a chord shimmer. Gospel and worship players add it to almost everything.',
  objective: 'Build and play add9, maj9, m9 and dominant 9th chords.',
  theory: [
    'The 9th is the 2nd note of the scale, placed an octave higher. In C, the 9th is D. Add it above a chord and you get a richer, more spacious sound.',
    'Cadd9 is C E G D: a plain triad with the 9th on top, no 7th. Cmaj9 is C E G B D. Cm9 is C E♭ G B♭ D. C9 is the dominant 9th: C E G B♭ D.',
    'Play the 9th as the top note of your right hand and it sings like a melody note. Many worship songs sit on add9 chords for a whole verse.',
    'These chords have five notes. Use both hands, or play the root in the left hand and four notes in the right.'
  ],
  visual: { range: W, steps: [
    { caption: 'Cadd9: C E G D.', chord: { root: 'C', quality: 'add9', oct: 4 } },
    { caption: 'Cmaj9: C E G B D.', chord: { root: 'C', quality: 'maj9', oct: 4 } },
    { caption: 'Cm9: C E♭ G B♭ D.', chord: { root: 'C', quality: 'm9', oct: 4 } },
    { caption: 'C9: C E G B♭ D.', chord: { root: 'C', quality: '9', oct: 4 } }
  ] },
  listen: [{ label: 'C, Cadd9, Cmaj9', spec: kchords([cT('C', 'major'), cT('C', 'add9'), cT('C', 'maj9')], { d: 2.2 }) }, { label: 'Dm9, G9, Cmaj9', spec: kchords([cT('D', 'm9'), cT('G', '9'), cT('C', 'maj9')], { d: 2.2 }) }],
  play: cExs([cT('C', 'add9'), cT('F', 'add9')], 'Play Cadd9, then Fadd9.', { range: W }),
  practice: [
    cExs([cT('C', 'maj9'), cT('F', 'maj9')], 'Play Cmaj9, then Fmaj9.', { range: W }),
    cExs([cT('D', 'm9'), cT('G', '9'), cT('C', 'maj9')], 'The ii – V – I of 9ths: Dm9, G9, Cmaj9.', { range: W })
  ],
  apply: { text: 'Replace a plain C with Cadd9 in a worship song and the sound is instantly wider. Keep the 9th on top for a melodic, shimmering feel.' },
  challenge: cExs([cT('A', 'm9'), cT('D', 'm9'), cT('G', '9'), cT('C', 'maj9')], 'Challenge: Am9, Dm9, G9, Cmaj9, no hints.', { hints: false, range: W }),
  quiz: [
    q('In C, the 9th is the note…', ['D', 'B', 'F', 'A'], 0, 'The 9th is the 2nd note, an octave higher.'),
    q('Which notes make Cadd9?', ['C E G D', 'C E G B D', 'C E G B♭ D', 'C E♭ G D'], 0, 'A triad plus the 9th, with no 7th.'),
    q('Which chord is C E G B♭ D?', ['C9', 'Cmaj9', 'Cm9', 'Cadd9'], 0, 'With a B♭ it is a dominant 9th.'),
    q('How many different notes does Cmaj9 have?', ['5', '4', '3', '6'], 0, 'C E G B D.')
  ]
});

M.push({
  id: 'extended-chords', cat: 'Colour chords', title: 'Elevenths and thirteenths', minutes: 14, req: ['ninth-chords'],
  why: 'The 11th and 13th are the finishing touches of gospel harmony. Hear them once and you will recognise them everywhere.',
  objective: 'Build and play m11 and dominant 13th chords and explain how pianists simplify them.',
  theory: [
    'Keep stacking thirds above a 9th chord and you reach the 11th, then the 13th. The 11th is the same note as the 4th, and the 13th the same note as the 6th, each an octave higher.',
    'Cm11 is C E♭ G B♭ D F: six notes. G13 is G B D F A E, with the 13th, E, on top (the 11th is usually left out of a dominant chord because it clashes with the 3rd).',
    'No pianist plays all six notes every time. They keep the notes that carry the colour (3rd, 7th, 9th, 13th) and drop the 5th and sometimes the root. You will learn those voicings in the Gospel harmony module.',
    'For now, learn the full chords so you know exactly which notes belong. Play them with both hands, then listen to what each added note contributes.'
  ],
  visual: { range: W, steps: [
    { caption: 'Cm11: C E♭ G B♭ D F.', chord: { root: 'C', quality: 'm11', oct: 4 } },
    { caption: 'G13: G B D F A E. The E is the 13th.', chord: { root: 'G', quality: '13', oct: 4 } }
  ] },
  listen: [{ label: 'Dm11, G13, Cmaj9', spec: kchords([cT('D', 'm11'), cT('G', '13'), cT('C', 'maj9')], { d: 2.4 }) }],
  play: cExs([cT('C', 'm11'), cT('G', '13')], 'Play Cm11, then G13. Use both hands.', { range: W }),
  practice: [cExs([cT('D', 'm11'), cT('G', '13'), cT('C', 'maj9')], 'Dm11, G13, Cmaj9: the ii – V – I at its richest.', { range: W })],
  apply: { text: 'On a gospel record, the pianist\'s ii – V – I is rarely plain triads. Dm11 – G13 – Cmaj9 is the sound you are being asked to learn.' },
  challenge: cExs([cT('G', 'm11'), cT('C', '13'), cT('F', 'maj9')], 'Challenge: Gm11, C13, Fmaj9, no hints.', { hints: false, range: W }),
  quiz: [
    q('The 11th is the same note as the…', ['4th (an octave higher)', '2nd', '6th', '7th'], 0, 'Eleven minus seven is four.'),
    q('The 13th is the same note as the…', ['6th (an octave higher)', '7th', '5th', '4th'], 0, 'Thirteen minus seven is six.'),
    q('Which notes make Cm11?', ['C E♭ G B♭ D F', 'C E G B D F', 'C E♭ G B♭ D A', 'C F G B♭ D F'], 0, 'Minor 9th chord plus the 11th, F.'),
    q('Why do pianists leave notes out of big chords?', ['To keep the sound clear, usually dropping the 5th', 'Because the chord is wrong', 'To change the key', 'They always play every note'], 0, 'The 3rd, 7th and extensions carry the colour.')
  ]
});

/* ------------------------- module: harmony language ------------------------- */
M.push({
  id: 'roman-numerals', cat: 'Harmony', title: 'Roman numeral analysis', minutes: 13, req: ['sevenths-in-key'],
  why: 'Roman numerals let you describe any progression in any key. It is the common language of musicians.',
  objective: 'Label chords with Roman numerals in a given key, and turn numerals back into chords.',
  theory: [
    'A Roman numeral names a chord by the scale degree of its root. Uppercase means major, lowercase means minor, ° means diminished, ø means half-diminished. A 7 after the numeral adds a 7th: V7, ii7, Imaj7.',
    'To analyse a chord, find the key, then count to the chord root. In A major (A B C♯ D E F♯ G♯), the chord D is IV, E is V, F♯m is vi.',
    'The same numerals describe any key: I – IV – V – I is A, D, E, A in A major and F, B♭, C, F in F major.',
    'Numerals also tell you what a chord does: a V7 is tense, a ii7 prepares it, a vi is a softer minor home. Use that knowledge to anticipate what comes next.'
  ],
  visual: { chordsInKey: 'A', range: [48, 72] },
  listen: [{ label: 'vi – IV – I – V in A', spec: { kind: 'prog', key: 'A', degs: [6, 4, 1, 5], sevenths: true, style: 'whole', bpc: 4, bpm: 72 } }],
  play: chExs('D', [1, 6, 2, 5], true, ['Imaj7', 'vi7', 'ii7', 'V7'], { prompt: 'In D, play Imaj7 – vi7 – ii7 – V7: Dmaj7, Bm7, Em7, A7.', range: [47, 72] }),
  practice: [
    chExs('Eb', [2, 5, 1], true, ['ii7', 'V7', 'Imaj7'], { prompt: 'In E♭: ii7 – V7 – Imaj7.' }),
    chExs('Ab', [1, 4, 5, 1], false, ['I', 'IV', 'V', 'I'], { prompt: 'In A♭: I – IV – V – I.' })
  ],
  apply: { text: 'Take any song you know, write its chords, and label them with numerals. You will start to see that hundreds of songs share a few patterns.' },
  challenge: chExs('A', [6, 4, 1, 5], true, ['vi7', 'IVmaj7', 'Imaj7', 'V7'], { hints: false, prompt: 'Challenge: vi7 – IVmaj7 – Imaj7 – V7 in A, no hints.' }),
  quiz: [
    q('In E♭ major, what chord is ii?', ['Fm', 'F', 'Gm', 'Cm'], 0, 'E♭ F G A♭: the 2nd note is F, and ii is minor.'),
    q('What numeral names Am in the key of C?', ['vi', 'VI', 'iii', 'ii'], 0, 'A is the 6th note and the chord is minor.'),
    q('What is the V7 chord in G?', ['D7', 'Dmaj7', 'Dm7', 'C7'], 0, 'D is the 5th note, with a dominant 7th.'),
    q('What does the numeral vii° mean in C?', ['B diminished', 'B major', 'B minor', 'B♭ major'], 0, 'The ° means a diminished triad on the 7th note.'),
    q('In A major, which chord is IV?', ['D', 'E', 'F♯m', 'B'], 0, 'A B C♯ D: the 4th note is D.')
  ]
});

M.push({
  id: 'number-borrowed', cat: 'Harmony', title: 'The number system and borrowed chords', minutes: 12, req: ['roman-numerals'],
  why: 'Gospel and worship musicians talk in numbers. Two borrowed chords, ♭7 and 4m, appear in countless songs.',
  objective: 'Play the ♭7 and the minor 4 chord in several keys.',
  theory: [
    'The number system uses plain numbers: 1, 2m, 3m, 4, 5, 6m. Add a 7 for a 7th chord, a slash for a bass note (1/3), and a ♭ for a chord lowered a half step.',
    'The ♭7 chord is a major chord built on the note a whole step below the root. In C it is B♭. The progression 1 – ♭7 – 4 – 1 (C, B♭, F, C) sounds strong and gospel-rock.',
    'The 4m chord is the minor version of the 4. In C it is Fm. Play 1 – 4 – 4m – 1 (C, F, Fm, C) and feel the bittersweet turn on the last F: the A drops to A♭. It is one of the most touching moves in church music.',
    'Both chords are "borrowed" from the parallel minor or a related mode. They sit outside the plain major scale, which is exactly why they stand out.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: '♭7 in C: B♭ major (B♭ D F).', chord: { root: 'Bb', quality: 'major', oct: 4 } },
    { caption: '4m in C: F minor (F A♭ C).', chord: { root: 'F', quality: 'minor', oct: 4 } }
  ] },
  listen: [
    { label: '1 – ♭7 – 4 – 1 in C', spec: kchords([cT('C', 'major', { bass: true }), cT('Bb', 'major', { bass: true }), cT('F', 'major', { bass: true }), cT('C', 'major', { bass: true })], { d: 1.8 }) },
    { label: '1 – 4 – 4m – 1 in C', spec: kchords([cT('C', 'major', { bass: true }), cT('F', 'major', { bass: true }), cT('F', 'minor', { bass: true }), cT('C', 'major', { bass: true })], { d: 1.8 }) }
  ],
  play: cExs([bassCh('C', 'major', { label: '1' }), bassCh('Bb', 'major', { label: '♭7' }), bassCh('F', 'major', { label: '4' }), bassCh('C', 'major', { label: '1' })], 'In C: 1 – ♭7 – 4 – 1, with bass notes.'),
  practice: [
    cExs([bassCh('G', 'major', { label: '1' }), bassCh('F', 'major', { label: '♭7' }), bassCh('C', 'major', { label: '4' }), bassCh('G', 'major', { label: '1' })], 'In G: G, F, C, G.'),
    cExs([bassCh('C', 'major', { label: '1' }), bassCh('F', 'major', { label: '4' }), bassCh('F', 'minor', { label: '4m' }), bassCh('C', 'major', { label: '1' })], 'In C: 1 – 4 – 4m – 1.')
  ],
  apply: { text: 'Use 4m just before a final chord, on the word the singer holds. A single F minor in a major key gives the whole phrase a depth the plain F cannot.' },
  challenge: cExs([bassCh('A', 'major'), bassCh('G', 'major'), bassCh('D', 'major'), bassCh('A', 'major'), bassCh('D', 'major'), bassCh('D', 'minor'), bassCh('A', 'major')], 'Challenge: 1 – ♭7 – 4 – 1 in A, then 1 – 4 – 4m – 1 in A (play the final D chords as D, Dm). No hints.', { hints: false, range: [47, 72] }),
  quiz: [
    q('What is the ♭7 chord in C?', ['B♭', 'B', 'A♭', 'D♭'], 0, 'A whole step below C is B♭.'),
    q('What is the ♭7 chord in G?', ['F', 'F♯', 'E', 'A'], 0, 'A whole step below G is F.'),
    q('What is the 4m chord in C?', ['Fm', 'F', 'Dm', 'Gm'], 0, 'F minor, the minor version of the 4.'),
    q('In the number system, what does "1/3" mean?', ['The 1 chord with the 3rd in the bass', 'Chord 1 for 3 beats', 'Chord 1 or chord 3', 'Three chords'], 0, 'The slash gives the bass note.')
  ]
});

M.push({
  id: 'voice-leading', cat: 'Harmony', title: 'Voice leading: smooth chord changes', minutes: 14, req: ['seventh-inversions'],
  why: 'Great pianists do not jump around. They move each note the shortest distance. This single skill makes your playing sound professional.',
  objective: 'Move between chords by the smallest steps, using inversions, in C and G.',
  theory: [
    'Voice leading means moving each note of one chord to the nearest note of the next. Notes that two chords share stay where they are (common tones). The others move by a step.',
    'C to F: C E G becomes C F A. The C stays, E steps up to F, G steps up to A. That is F in second inversion (C F A), not F in root position.',
    'C to G: C E G becomes B D G. G stays, C steps down to B, E steps down to D. That is G in first inversion (B D G).',
    'Try 1 – 4 – 5 – 1 this way: C root position, F second inversion, G first inversion, C root position. Your hand barely moves and the progression sounds beautifully connected.'
  ],
  visual: { range: W, steps: [
    { caption: 'C: C E G.', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: 'F (second inversion): C F A. The C is a common tone.', chord: { root: 'F', quality: 'major', oct: 4, inv: 2 } },
    { caption: 'G (first inversion): B D G. Only a small step from C F A.', chord: { root: 'G', quality: 'major', oct: 4, inv: 1 } }
  ] },
  listen: [
    { label: 'Jumping: C F G C in root position', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major')], { d: 1.4 }) },
    { label: 'Smooth: C, F/C, G/B, C', spec: kchords([cT('C', 'major'), cT('F', 'major', { inv: 2 }), cT('G', 'major', { inv: 1 }), cT('C', 'major')], { d: 1.4 }) }
  ],
  play: cExs([cT('C', 'major', { label: '1' }), cT('F', 'major', { inv: 2, label: '4' }), cT('G', 'major', { inv: 1, label: '5' }), cT('C', 'major', { label: '1' })], 'Play C, then F with C in the bass, then G with B in the bass, then C.', { range: W }),
  practice: [
    cExs([cT('C', 'major'), cT('A', 'minor', { inv: 1 }), cT('F', 'major', { inv: 2 }), cT('G', 'major', { inv: 2 }), cT('C', 'major')], '1 – 6m – 4 – 5 – 1 smoothly: C, Am (C in bass), F (C in bass), G (D in bass), C.', { range: W })
  ],
  apply: { text: 'Make every progression you know smooth. Choose the first chord, then for each next chord pick the inversion that moves the least.' },
  challenge: cExs([cT('G', 'major'), cT('C', 'major', { inv: 2 }), cT('D', 'major', { inv: 1 }), cT('G', 'major')], 'Challenge: the same smooth 1 – 4 – 5 – 1 in G, no hints: G, C (G in bass), D (F♯ in bass), G.', { hints: false, range: W }),
  quiz: [
    q('Voice leading means…', ['Moving each note the shortest distance to the next chord', 'Singing the melody', 'Playing louder', 'Always using root position'], 0, 'Smooth, minimal motion.'),
    q('Which note do C major and F major share?', ['C', 'E', 'G', 'A'], 0, 'C E G and F A C share the note C.'),
    q('Going from C to G smoothly, which position of G works well?', ['First inversion (B D G)', 'Root position', 'Second inversion', 'Third inversion'], 0, 'G stays and the other notes step down.'),
    q('In C → F (second inversion C F A), which note stays?', ['C', 'E', 'F', 'A'], 0, 'C is the common tone.'),
    q('The main benefit of voice leading is…', ['Chord changes sound smooth and connected', 'It is louder', 'It is faster', 'It changes the key'], 0, 'Less jumping, more flow.')
  ]
});

M.push({
  id: 'two-five-one', cat: 'Harmony', title: 'The ii – V – I', minutes: 14, req: ['voice-leading', 'dominant-resolution'],
  why: 'The ii – V – I is the most important chord pattern in gospel, jazz and pop. Master it in every key and you can play most songs.',
  objective: 'Play ii7 – V7 – Imaj7 in C, F, G and B♭, and voice-lead it smoothly.',
  theory: [
    'The ii – V – I is three chords, each a fifth below the last. In C: Dm7 – G7 – Cmaj7. The ii prepares, the V creates tension, the I resolves.',
    'In F: Gm7 – C7 – Fmaj7. In G: Am7 – D7 – Gmaj7. In B♭: Cm7 – F7 – B♭maj7.',
    'Voice-led, it flows. Play Dm7 (D F A C), then G7 with B in the bass (B D F G), then Cmaj7 with B on the bottom (B C E G). The D, F and the top notes hardly move.',
    'Extend it with a vi: ii – V – I – vi is Dm7 – G7 – Cmaj7 – Am7. That fourth chord is the start of the turnaround you already know.'
  ],
  visual: { range: W, steps: [
    { caption: 'Dm7: D F A C.', chord: { root: 'D', quality: 'm7', oct: 4 } },
    { caption: 'G7 (first inversion): B D F G.', chord: { root: 'G', quality: '7', oct: 4, inv: 1 } },
    { caption: 'Cmaj7 (third inversion): B C E G. The 7th sits at the bottom.', chord: { root: 'C', quality: 'maj7', oct: 4, inv: 3 } }
  ] },
  listen: [
    { label: 'ii – V – I in C, with bass', spec: { kind: 'prog', key: 'C', degs: [2, 5, 1], sevenths: true, style: 'whole', bpc: 4, bpm: 72 } },
    { label: 'ii – V – I – vi in C', spec: { kind: 'prog', key: 'C', degs: [2, 5, 1, 6], sevenths: true, style: 'groove', bpc: 4, bpm: 80 } }
  ],
  play: chExs('C', [2, 5, 1], true, ['ii7', 'V7', 'Imaj7'], { prompt: 'In C: Dm7, G7, Cmaj7, each with a bass note.' }),
  practice: [
    chExs('F', [2, 5, 1], true, ['ii7', 'V7', 'Imaj7'], { prompt: 'In F: Gm7, C7, Fmaj7.' }),
    chExs('G', [2, 5, 1], true, ['ii7', 'V7', 'Imaj7'], { prompt: 'In G: Am7, D7, Gmaj7.' }),
    chExs('Bb', [2, 5, 1], true, ['ii7', 'V7', 'Imaj7'], { prompt: 'In B♭: Cm7, F7, B♭maj7.' })
  ],
  apply: { text: 'This is everywhere. A turnaround, a bridge, an ending: look for ii – V – I. Once you hear it, you will begin to predict where a song is going.' },
  challenge: cExs([cT('D', 'm7'), cT('G', '7', { inv: 1 }), cT('C', 'maj7', { inv: 3 })], 'Challenge: the smooth ii – V – I in C with no bass notes and no hints: Dm7, G7 with B lowest, Cmaj7 with B lowest.', { hints: false, range: W }),
  quiz: [
    q('In C, the ii – V – I with 7ths is…', ['Dm7 G7 Cmaj7', 'Dm G C', 'Em7 A7 Dm7', 'Fmaj7 G7 Cmaj7'], 0, 'The ii is Dm7, the V is G7, the I is Cmaj7.'),
    q('In F, the ii – V – I is…', ['Gm7 C7 Fmaj7', 'Gm7 D7 F', 'Am7 D7 Gmaj7', 'Gm7 C7 Cmaj7'], 0, 'G is the 2nd note of F, C is the 5th.'),
    q('In G, the ii – V – I is…', ['Am7 D7 Gmaj7', 'Am7 E7 Gmaj7', 'Bm7 E7 Am7', 'Am7 D7 G7'], 0, 'A is the 2nd note of G, D is the 5th.'),
    q('ii – V – I – vi in C adds which chord at the end?', ['Am7', 'Em7', 'Fmaj7', 'Bm7♭5'], 0, 'vi is Am7.'),
    q('The roots of a ii – V – I move by…', ['Falling fifths', 'Rising seconds', 'Octaves', 'Thirds'], 0, 'D to G to C: each down a fifth (or up a fourth).')
  ]
});

M.push({
  id: 'minor-two-five-one', cat: 'Harmony', title: 'The minor ii – V – i', minutes: 13, req: ['two-five-one', 'sevenths-deep', 'progs-minor'],
  why: 'In a minor key the ii – V – i has a darker colour and a stronger pull. It drives many emotional gospel songs.',
  objective: 'Play iiø7 – V7 – i in A, D, E and C minor.',
  theory: [
    'In a minor key, the ii chord is half-diminished and the V chord is dominant. In A minor: Bm7♭5 – E7 – Am. Note that E7 (with G♯) comes from harmonic minor.',
    'The movement is identical to the major version, with one change: the ii has a lowered 5th (F instead of F♯), and the final chord is minor.',
    'In D minor: Em7♭5 – A7 – Dm. In E minor: F♯m7♭5 – B7 – Em. In C minor: Dm7♭5 – G7 – Cm.',
    'Many songs begin on a minor i chord and use this pattern to return. It gives the sound of longing resolving at the very end.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Bm7♭5 (iiø7): B D F A.', chord: { root: 'B', quality: 'm7b5', oct: 4 } },
    { caption: 'E7 (V7): E G♯ B D.', chord: { root: 'E', quality: '7', oct: 4 } },
    { caption: 'Am (i).', chord: { root: 'A', quality: 'minor', oct: 4 } }
  ] },
  listen: [{ label: 'Bm7♭5, E7, Am', spec: kchords([cT('B', 'm7b5', { bass: true }), cT('E', '7', { bass: true }), cT('A', 'minor', { bass: true })], { d: 2 }) }],
  play: cExs([bassCh('B', 'm7b5', { label: 'iiø7' }), bassCh('E', '7', { label: 'V7' }), bassCh('A', 'minor', { label: 'i' })], 'In A minor: Bm7♭5, E7, Am, with bass notes.', { range: [47, 72] }),
  practice: [
    cExs([bassCh('E', 'm7b5', { label: 'iiø7' }), bassCh('A', '7', { label: 'V7' }), bassCh('D', 'minor', { label: 'i' })], 'In D minor: Em7♭5, A7, Dm.'),
    cExs([bassCh('F#', 'm7b5', { label: 'iiø7' }), bassCh('B', '7', { label: 'V7' }), bassCh('E', 'minor', { label: 'i' })], 'In E minor: F♯m7♭5, B7, Em.', { range: [47, 72] })
  ],
  apply: { text: 'Put a minor ii – V – i at the end of a verse in a minor song and the return to the chorus feels earned. Add a sus4 before the E7 for extra lift.' },
  challenge: cExs([bassCh('D', 'm7b5'), bassCh('G', '7'), bassCh('C', 'minor')], 'Challenge: Dm7♭5, G7, Cm, no hints.', { hints: false }),
  quiz: [
    q('In A minor, what is the ii chord with a 7th?', ['Bm7♭5', 'Bm7', 'B7', 'Bdim7'], 0, 'Half-diminished on the 2nd note.'),
    q('What is the V7 chord in A minor?', ['E7', 'Em7', 'Emaj7', 'E7sus'], 0, 'The dominant 7th built on E.'),
    q('Which notes make E7?', ['E G♯ B D', 'E G B D', 'E G♯ B D♯', 'E G♯ B♯ D'], 0, 'Major triad plus the minor 7th.'),
    q('What is the ii – V – i in D minor?', ['Em7♭5 A7 Dm', 'Em7 A7 Dm', 'Em7♭5 A7 D', 'Em A Dm'], 0, 'E is the 2nd note and A is the 5th.')
  ]
});

M.push({
  id: 'bass-movement', cat: 'Harmony', title: 'Bass lines that move', minutes: 13, req: ['voice-leading'],
  why: 'In gospel the bass leads the harmony. A bass line that walks in steps makes even simple chords sound alive.',
  objective: 'Play progressions with stepwise bass lines using slash chords.',
  theory: [
    'Instead of playing each chord on its root, choose the bass note so that the bass walks by step. C – G/B – Am – G – F has bass notes C B A G F, a descending line under changing chords.',
    'Going up works too: C – C/E – F – G has bass C E F G. In G: G – G/B – C – D has bass G B C D.',
    'A slash chord names the bass note: G/B is G major with B at the bottom. Play the bass with your left hand and the chord with your right.',
    'Whenever the bass line is a smooth scale, the chords you place over it sound connected and intentional.'
  ],
  visual: { range: [48, 84], steps: [
    { caption: 'C: bass C.', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: 'G/B: bass B.', chord: { root: 'G', quality: 'major', oct: 4, inv: 1 } },
    { caption: 'Am: bass A. The bass has stepped down C – B – A.', chord: { root: 'A', quality: 'minor', oct: 4 } }
  ] },
  listen: [{ label: 'Descending bass: C, G/B, Am, G, F', spec: kchords([cT('C', 'major'), cT('G', 'major', { inv: 1 }), cT('A', 'minor'), cT('G', 'major'), cT('F', 'major')], { d: 1.5 }) }],
  play: cExs([cT('C', 'major'), cT('G', 'major', { inv: 1, label: 'G/B' }), cT('A', 'minor'), cT('G', 'major'), cT('F', 'major')], 'Play C, G/B, Am, G, F. The lowest note walks down: C B A G F.', { range: W }),
  practice: [
    cExs([cT('C', 'major'), cT('C', 'major', { inv: 1, label: 'C/E' }), cT('F', 'major'), cT('G', 'major')], 'Walking up: C, C/E, F, G.', { range: W }),
    cExs([cT('G', 'major'), cT('G', 'major', { inv: 1, label: 'G/B' }), cT('C', 'major'), cT('D', 'major')], 'In G: G, G/B, C, D.', { range: W })
  ],
  apply: { text: 'Listen to any gospel ballad and follow only the bass. You will hear scales and half-step approaches everywhere. Make your left hand do that too.' },
  challenge: cExs([cT('F', 'major'), cT('C', 'major', { inv: 1, label: 'C/E' }), cT('D', 'minor'), cT('C', 'major'), cT('B', 'major', { root: 'Bb' })], 'Challenge: F, C/E, Dm, C, B♭, no hints. The bass walks down F E D C B♭.', { hints: false, range: W }),
  quiz: [
    q('In C – G/B – Am – G – F the bass notes are…', ['C B A G F', 'C G A G F', 'C D E F G', 'C C C C C'], 0, 'Each slash chord supplies the bass note.'),
    q('In the chord C/E, the bass note is…', ['E', 'C', 'G', 'B'], 0, 'The note after the slash.'),
    q('Why use stepwise bass lines?', ['They create a smooth line under the chords', 'They make the song louder', 'They change the key', 'They avoid chords'], 0, 'The bass becomes a melody of its own.'),
    q('In G – G/B – C – D the bass notes are…', ['G B C D', 'G A B C', 'G C D E', 'G D C B'], 0, 'G, then B, then C, then D.')
  ]
});
// the B♭ target above must use the right root: fix explicitly (cT with root override)
M[M.length - 1].challenge.targets[4] = { root: 'Bb', quality: 'major' };

/* ------------------------- module: accompaniment skills ------------------------- */
M.push({
  id: 'comping-rhythms', cat: 'Rhythm', title: 'Comping rhythms: the gospel push', minutes: 12, req: ['rhythm-patterns', 'bass-movement'],
  why: 'The chords are only half of accompaniment. Where you place them makes the music move.',
  objective: 'Tap three comping rhythms: the push on 2&, the backbeat lift, and anticipation.',
  theory: [
    'Comping (short for accompanying) is playing chords in a rhythmic pattern behind a singer or band. The rhythm matters as much as the notes.',
    'Three patterns to know. The push: hits on 1, the "&" of 2 and 4. The backbeat lift: hits on 1, 2 and the "&" of 3. Anticipation: play the next chord on the "&" of 4, a half beat before the bar line, so the change arrives early and the music leans forward.',
    'Count out loud while you tap: "1 & 2 & 3 & 4 &". The numbers are the beats and the "&"s are the in-between points.',
    'Once the rhythm is in your hands, put your chords on it. The Song Lab\'s groove style uses exactly these shapes.'
  ],
  listen: [
    { label: 'The push (hits on 1, 2&, 4)', spec: { kind: 'rhythm', pattern: [1.5, 1.5, 1, 1.5, 1.5, 1], bpm: 76, note: 60 } },
    { label: 'Backbeat lift (hits on 1, 2, 3&)', spec: { kind: 'rhythm', pattern: [1, 1.5, 1.5, 1, 1.5, 1.5], bpm: 76, note: 60 } },
    { label: 'Anticipation (hits on 1 and 4&)', spec: { kind: 'rhythm', pattern: [3.5, 4, 0.5], bpm: 76, note: 60 } }
  ],
  play: { type: 'tap', bpm: 70, bpb: 4, pattern: [1.5, 1.5, 1, 1.5, 1.5, 1], prompt: 'The push, over two bars: hits on 1, 2&, 4 and again.' },
  practice: [
    { type: 'tap', bpm: 70, bpb: 4, pattern: [1, 1.5, 1.5, 1, 1.5, 1.5], prompt: 'Backbeat lift: hits on 1, 2, 3& and again.' },
    { type: 'tap', bpm: 70, bpb: 4, pattern: [3.5, 4, 0.5], prompt: 'Anticipation: one hit on 1, then on the & of 4, then on the & of 4 again.' }
  ],
  apply: { text: 'Choose one chord and loop the push rhythm. Then change chords on the "&" of 4 so each new chord lands half a beat early. That is the sound of a pianist driving a band.' },
  challenge: { type: 'tap', bpm: 80, bpb: 4, tol: 0.15, pattern: [1.5, 1.5, 1, 3.5, 0.5], prompt: 'Challenge: 80 BPM, tight window. Hits on 1, 2&, 4, then 1 of bar two, then the & of 4.' },
  quiz: [
    q('Comping means…', ['Playing chords in a rhythm behind a singer or band', 'Playing only melody', 'Playing without rhythm', 'Singing along'], 0, 'Accompanying with chords.'),
    q('Anticipation means playing the next chord…', ['A half beat early, on the & of 4', 'A beat late', 'On beat 3', 'Only on beat 1'], 0, 'The change arrives before the bar line.'),
    q('In "1 & 2 & 3 & 4 &", the "&" of 2 falls…', ['Halfway between beats 2 and 3', 'On beat 2', 'On beat 3', 'After beat 4'], 0, 'The in-between point after 2.'),
    q('Which pattern hits on 1, 2& and 4?', ['The push', 'The backbeat lift', 'Anticipation', 'A whole-note pad'], 0, 'The push.')
  ]
});

M.push({
  id: 'transpose-sevenths', cat: 'Progressions', title: 'Transposing a turnaround', minutes: 13, req: ['two-five-one', 'transpose-basic'],
  why: 'A singer will ask for a new key. You need to move a rich 7th-chord progression without writing it down.',
  objective: 'Play 1 – 6m – 2m – 5 with 7ths in C, F, B♭ and E♭ by thinking in numbers.',
  theory: [
    'You can already transpose triads. The method is the same for 7th chords: find the new key, spell its scale, and build each chord on its number, keeping the quality of the original.',
    'The turnaround 1 – 6m – 2m – 5 with 7ths is Cmaj7, Am7, Dm7, G7 in C. In F: Fmaj7, Dm7, Gm7, C7. In B♭: B♭maj7, Gm7, Cm7, F7. In E♭: E♭maj7, Cm7, Fm7, B♭7.',
    'A shortcut to move up a perfect 4th: C to F, F to B♭, B♭ to E♭. Each key is one step round the circle of fifths, going flat.',
    'Learn the numbers so well that the key becomes a detail. A good worship pianist hears "go to E♭" and finds the 1 chord instantly.'
  ],
  visual: { chordsInKey: 'Bb', range: [48, 72] },
  listen: [
    { label: 'In C', spec: { kind: 'prog', key: 'C', degs: [1, 6, 2, 5], sevenths: true, style: 'whole', bpc: 4, bpm: 76 } },
    { label: 'In F, a perfect 4th higher', spec: { kind: 'prog', key: 'F', degs: [1, 6, 2, 5], sevenths: true, style: 'whole', bpc: 4, bpm: 76 } }
  ],
  play: chExs('C', [1, 6, 2, 5], true, ['1', '6m', '2m', '5'], { prompt: 'In C: Cmaj7, Am7, Dm7, G7.' }),
  practice: [
    chExs('F', [1, 6, 2, 5], true, ['1', '6m', '2m', '5'], { prompt: 'In F: Fmaj7, Dm7, Gm7, C7.' }),
    chExs('Bb', [1, 6, 2, 5], true, ['1', '6m', '2m', '5'], { prompt: 'In B♭: B♭maj7, Gm7, Cm7, F7.' })
  ],
  apply: { text: 'Pick a number chart for a song and play it in three keys back to back: the original, a whole step up and a perfect 4th up. When you can, you are ready for any key change.' },
  challenge: chExs('Eb', [1, 6, 2, 5], true, ['1', '6m', '2m', '5'], { hints: false, prompt: 'Challenge: E♭maj7, Cm7, Fm7, B♭7, no hints.' }),
  quiz: [
    q('Moving C up a perfect 4th gives…', ['F', 'G', 'D', 'B♭'], 0, 'C D E F is a 4th.'),
    q('A whole step up from B♭ is…', ['C', 'D♭', 'D', 'B'], 0, 'B♭ up two half steps is C.'),
    q('The turnaround 1 – 6m – 2m – 5 with 7ths in F is…', ['Fmaj7 Dm7 Gm7 C7', 'Fmaj7 Am7 Gm7 C7', 'F Dm Gm C', 'Fmaj7 Dm7 Gm7 Cmaj7'], 0, 'F, D, G, C roots with 7ths.'),
    q('A minor third up from C is…', ['E♭', 'E', 'D', 'F'], 0, 'Three half steps above C is E♭.')
  ]
});

M.push({
  id: 'l3-verse', cat: 'Project', title: 'Level 3 project: accompany a full verse', minutes: 18, req: ['transpose-sevenths', 'bass-movement', 'minor-two-five-one', 'extended-chords'],
  why: 'This is the test of Level 3: can you play a complete verse of a song, in a key someone chooses, with rich chords and smooth changes?',
  objective: 'Play an eight-chord verse with 7th chords in F, then in another key.',
  theory: [
    'Here is a typical gospel verse in F with 7ths: | Fmaj7 | Dm7 | Gm7 | C7 | Fmaj7 | B♭maj7 | Gm7 | C7 | and home to Fmaj7. In numbers: 1 – 6m – 2m – 5 – 1 – 4 – 2m – 5 – 1.',
    'Play it with a bass note under each chord, then try smooth voice leading in the right hand, then add a sus4 before the C7 (C7sus4 – C7).',
    'When you can play it in F, play the same numbers in G, then in E♭. Each key only changes the letters.',
    'Take your time. The goal is not speed but a confident, connected sound.'
  ],
  listen: [{ label: 'The verse in F', spec: { kind: 'prog', key: 'F', degs: [1, 6, 2, 5, 1, 4, 2, 5, 1], sevenths: true, style: 'groove', bpc: 4, bpm: 80 } }],
  play: chExs('F', [1, 6, 2, 5, 1], true, ['1', '6m', '2m', '5', '1'], { prompt: 'First half of the verse: Fmaj7, Dm7, Gm7, C7, Fmaj7.' }),
  practice: [chExs('F', [4, 2, 5, 1], true, ['4', '2m', '5', '1'], { prompt: 'Second half: B♭maj7, Gm7, C7, Fmaj7.' })],
  apply: { text: 'Record yourself playing the verse, or play it for a friend who can sing. Notice whether the changes feel smooth and whether the groove stays steady.' },
  challenge: chExs('F', [1, 6, 2, 5, 1, 4, 2, 5, 1], true, ['1', '6m', '2m', '5', '1', '4', '2m', '5', '1'], { hints: false, prompt: 'Challenge: the whole verse in F with bass notes and no hints.' }),
  quiz: [
    q('In F, which chord is the 4 with a 7th?', ['B♭maj7', 'Cmaj7', 'Gm7', 'Dm7'], 0, 'The 4th note of F is B♭.'),
    q('What is the 5 chord with a 7th in F?', ['C7', 'Cmaj7', 'Cm7', 'G7'], 0, 'C is the 5th note and the chord is dominant.'),
    q('In the verse, which chord is the 6m with a 7th?', ['Dm7', 'Gm7', 'Am7', 'Em7'], 0, 'D is the 6th note of F.'),
    q('Adding C7sus4 before C7 does what?', ['Builds tension before the resolution', 'Changes the key', 'Makes it minor', 'Stops the song'], 0, 'The sus4 delays the resolution.')
  ]
});

B2.modules = [
  { id: 'sev3', level: '3', title: 'Seventh chords in depth', blurb: 'The full seventh-chord family, how each sits in a key, and the pull of the dominant.', lessons: ['sevenths-deep', 'sevenths-in-key', 'dominant-resolution', 'seventh-inversions'] },
  { id: 'colour3', level: '3', title: 'Colour chords', blurb: 'Sus, sixth, ninth, eleventh and thirteenth chords.', lessons: ['sus-chords', 'sixth-chords', 'ninth-chords', 'extended-chords'] },
  { id: 'lang3', level: '3', title: 'The harmony language', blurb: 'Roman numerals, borrowed chords, voice leading, ii – V – I and walking bass.', lessons: ['roman-numerals', 'number-borrowed', 'voice-leading', 'two-five-one', 'minor-two-five-one', 'bass-movement'] },
  { id: 'comp3', level: '3', title: 'Accompaniment skills', blurb: 'Rhythm, transposing and your first complete verse.', lessons: ['comping-rhythms', 'transpose-sevenths', 'l3-verse'] }
];
LESSONS.push.apply(LESSONS, B2.lessons);
MODULES.splice(MODULES.findIndex(m => m.id === 'gospel1') + 1, 0, ...B2.modules);
LEVELS.push({ id: '3', name: 'Level 3', title: 'Intermediate piano', goal: 'Accompany songs confidently with seventh chords, smooth voice leading and steady rhythm.' });

/* ===================== BATCH 3 · Gospel harmony =====================
   Passing chords, secondary dominants, tritone substitution, walk-ups and walk-downs,
   substitution, gospel voicings, turnarounds, modulation, intros, endings, runs, fills.
   Inserted by build.js at the BATCH3 marker, after batch 2 (shares its helpers). */
const GH = { lessons: [], modules: [] };
const H = GH.lessons;
const vc = (name, notes, o) => Object.assign({ name, notes, low: true }, o || {});
const vEx = (targets, prompt, o) => Object.assign({ type: 'chord', range: [36, 84], targets, hints: true, prompt }, o || {});
const kv = (list, d) => ({ kind: 'voicings', list: list.map(t => ({ notes: t.notes })), d: d || 2.2 });
const sEx = (notes, prompt, o) => Object.assign({ type: 'seq', notes, hints: true, range: SR, prompt }, o || {});

/* =========================== passing chords and chromatic movement =========================== */
H.push({
  id: 'g-passing-dim', cat: 'Passing chords', title: 'Passing diminished chords', minutes: 14, req: ['two-five-one', 'sevenths-deep'],
  why: 'The passing diminished chord is the most recognisable gospel sound. It turns two plain chords into a slide that pulls the ear forward.',
  objective: 'Place a diminished 7th chord between two chords and play it smoothly in C and G.',
  theory: [
    'A passing diminished chord is a dim7 chord placed between two chords. Its root is a half step below the chord you are heading toward, so it leans into that chord.',
    'The classic example is between I and ii. In C: Cmaj7, then C♯dim7, then Dm7. The bass walks C, C♯, D in half steps, and the upper notes slide into place: C♯ to D, E to F, G to A, B♭ to C.',
    'The same idea works elsewhere. Between IV and V in C: Fmaj7, F♯dim7, G7 (the F♯ leads up to G). Between ii and iii: Dm7, D♯dim7, Em7.',
    'The rule is simple: find the chord you want to reach, drop a half step from its root, and build a dim7 chord there. It will lead up into the target every time.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Cmaj7: the starting chord.', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: 'C♯dim7: C♯ E G B♭. A half step below D, so it leans into Dm7.', chord: { root: 'C#', quality: 'dim7', oct: 4 } },
    { caption: 'Dm7: the target chord. Every note arrived by a small step.', chord: { root: 'D', quality: 'm7', oct: 4 } }
  ] },
  listen: [
    { label: 'Cmaj7, C♯dim7, Dm7', spec: kchords([cT('C', 'maj7', { bass: true }), cT('C#', 'dim7', { bass: true }), cT('D', 'm7', { bass: true })], { d: 1.8 }) },
    { label: 'The same without the passing chord', spec: kchords([cT('C', 'maj7', { bass: true }), cT('D', 'm7', { bass: true })], { d: 1.8 }) },
    { label: 'Fmaj7, F♯dim7, G7', spec: kchords([cT('F', 'maj7', { bass: true }), cT('F#', 'dim7', { bass: true }), cT('G', '7', { bass: true })], { d: 1.8 }) }
  ],
  play: cExs([bassCh('C', 'maj7', { label: 'I' }), bassCh('C#', 'dim7', { label: '♯I°' }), bassCh('D', 'm7', { label: 'ii' })], 'Play Cmaj7, C♯dim7, Dm7, each with a bass note: C, C♯, D.'),
  practice: [
    cExs([bassCh('F', 'maj7', { label: 'IV' }), bassCh('F#', 'dim7', { label: '♯IV°' }), bassCh('G', '7', { label: 'V' }), bassCh('C', 'maj7', { label: 'I' })], 'Between IV and V: Fmaj7, F♯dim7, G7, Cmaj7.'),
    cExs([bassCh('D', 'm7', { label: 'ii' }), bassCh('D#', 'dim7', { label: '♯ii°' }), bassCh('E', 'm7', { label: 'iii' }), bassCh('F', 'maj7', { label: 'IV' })], 'Between ii and iii: Dm7, D♯dim7, Em7, Fmaj7.')
  ],
  apply: { text: 'Take the plain turnaround Cmaj7 – Dm7 – G7 and slip C♯dim7 between the first two chords. Nothing else changes, yet it suddenly sounds like church.' },
  challenge: cExs([bassCh('G', 'maj7'), bassCh('G#', 'dim7'), bassCh('A', 'm7'), bassCh('D', '7')], 'Challenge: in G, play Gmaj7, G♯dim7, Am7, D7, no hints.', { hints: false }),
  quiz: [
    q('C♯dim7 sits naturally between which two chords?', ['Cmaj7 and Dm7', 'Dm7 and G7', 'Fmaj7 and Am7', 'G7 and Cmaj7'], 0, 'It leans a half step up into Dm7.'),
    q('How do you find a passing diminished chord?', ['Build a dim7 on the note a half step below the target chord\'s root', 'Build a dim7 a whole step above the target', 'Use a major chord instead', 'Always build it on the 5th'], 0, 'The dim7 root is a half step below where you are going.'),
    q('Which passing chord connects IV and V in C?', ['F♯dim7', 'F♯m7', 'E♭dim7', 'Fdim7'], 0, 'F♯ is a half step below G.'),
    q('In G, which passing chord connects G and Am?', ['G♯dim7', 'Gdim7', 'F♯dim7', 'A♭m7'], 0, 'G♯ is a half step below A.')
  ]
});

H.push({
  id: 'g-chromatic-approach', cat: 'Passing chords', title: 'Chromatic approach chords', minutes: 12, req: ['g-passing-dim'],
  why: 'Sliding a chord in from a half step away is a shortcut to a big, soulful sound with almost no thinking.',
  objective: 'Slide into a chord from a half step above or below, keeping the same chord type.',
  theory: [
    'An approach chord is the same type of chord as your target, played a half step above or below it, then resolved. Every note moves by a half step, so the whole shape slides.',
    'From below: C♯m7 slides up into Dm7. From above: E♭m7 slides down into Dm7. With major chords, D♭maj7 slides down into Cmaj7.',
    'Compare this to the passing diminished chord. The diminished chord leans in from below with a changing shape; the approach chord moves the same shape in parallel. Both create the feeling of being pulled into the target.',
    'Use it sparingly: one slide per phrase is plenty. Land on the target with confidence, on the beat.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'E♭m7, a half step above Dm7.', chord: { root: 'Eb', quality: 'm7', oct: 4 } },
    { caption: 'Dm7: the target. Every note slid down a half step.', chord: { root: 'D', quality: 'm7', oct: 4 } }
  ] },
  listen: [
    { label: 'E♭m7 sliding into Dm7', spec: kchords([cT('Eb', 'm7'), cT('D', 'm7')], { d: 1.8 }) },
    { label: 'D♭maj7 sliding into Cmaj7', spec: kchords([cT('Db', 'maj7'), cT('C', 'maj7')], { d: 1.8 }) },
    { label: 'C♯m7 sliding up into Dm7', spec: kchords([cT('C#', 'm7'), cT('D', 'm7')], { d: 1.8 }) }
  ],
  play: cExs([cT('Eb', 'm7'), cT('D', 'm7')], 'Play E♭m7, then slide down into Dm7.'),
  practice: [
    cExs([cT('Db', 'maj7'), cT('C', 'maj7')], 'Play D♭maj7, then slide into Cmaj7.'),
    cExs([cT('C#', 'm7'), cT('D', 'm7')], 'Slide up this time: C♯m7 into Dm7.')
  ],
  apply: { text: 'Take ii – V – I in C and approach both the ii and the I from above: E♭m7 – Dm7 – G7 – D♭maj7 – Cmaj7. Two slides, and the whole progression shines.' },
  challenge: cExs([cT('Eb', 'm7'), cT('D', 'm7'), cT('G', '7'), cT('Db', 'maj7'), cT('C', 'maj7')], 'Challenge: E♭m7, Dm7, G7, D♭maj7, Cmaj7, no hints.', { hints: false }),
  quiz: [
    q('Which chord is a half step above Dm7 and of the same type?', ['E♭m7', 'Em7', 'C♯m7', 'Fm7'], 0, 'D up a half step is E♭.'),
    q('Which chord is a half step below Cmaj7 and of the same type?', ['Bmaj7', 'B♭maj7', 'D♭maj7', 'Dmaj7'], 0, 'C down a half step is B.'),
    q('In an approach chord slide, how does each note move?', ['By a half step, in parallel', 'By a fifth', 'Not at all', 'Only the bass moves'], 0, 'The whole shape slides.'),
    q('An approach chord has the same … as its target.', ['Type (quality)', 'Root', 'Key signature', 'Bass note'], 0, 'Same shape, different position.')
  ]
});

H.push({
  id: 'g-secondary-dominants', cat: 'Passing chords', title: 'Secondary dominants', minutes: 15, req: ['two-five-one', 'dominant-resolution'],
  why: 'Secondary dominants are the engine of gospel harmony: they make every chord in the key feel like a destination.',
  objective: 'Play a dominant 7th that resolves to ii, iii, IV, V or vi, and name each by its function.',
  theory: [
    'A secondary dominant is a dominant 7th chord that points to a chord other than I. Any chord can be "tonicised" this way by putting its own V7 in front of it.',
    'In C: A7 leads to Dm7 (V7 of ii). E7 leads to Am7 (V7 of vi). D7 leads to G7 (V7 of V). C7 leads to Fmaj7 (V7 of IV). B7 leads to Em7 (V7 of iii).',
    'Notice each secondary dominant contains a note outside the key (C♯ in A7, G♯ in E7, F♯ in D7). That outside note is the "colour", and it resolves by half step to a note of the target chord.',
    'The turnaround Cmaj7 – A7 – Dm7 – G7 is the best example: A7 is V7 of ii. You already know the notes; now you know why they work.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'A7 (V7 of ii): A C♯ E G. The C♯ resolves up to D.', chord: { root: 'A', quality: '7', oct: 4 } },
    { caption: 'Dm7 (ii): the target.', chord: { root: 'D', quality: 'm7', oct: 4 } },
    { caption: 'E7 (V7 of vi): E G♯ B D. The G♯ resolves up to A.', chord: { root: 'E', quality: '7', oct: 4 } }
  ] },
  listen: [
    { label: 'A7 to Dm7 (V7 of ii)', spec: kchords([cT('A', '7', { bass: true }), cT('D', 'm7', { bass: true })], { d: 1.8 }) },
    { label: 'E7 to Am7 (V7 of vi)', spec: kchords([cT('E', '7', { bass: true }), cT('A', 'm7', { bass: true })], { d: 1.8 }) },
    { label: 'D7 to G7 (V7 of V)', spec: kchords([cT('D', '7', { bass: true }), cT('G', '7', { bass: true })], { d: 1.8 }) }
  ],
  play: cExs([bassCh('A', '7', { label: 'V7/ii' }), bassCh('D', 'm7', { label: 'ii' })], 'Play A7 then Dm7, each with a bass note.'),
  practice: [
    cExs([bassCh('C', 'maj7', { label: 'I' }), bassCh('E', '7', { label: 'V7/vi' }), bassCh('A', 'm7', { label: 'vi' }), bassCh('D', '7', { label: 'V7/V' }), bassCh('G', '7', { label: 'V' }), bassCh('C', 'maj7', { label: 'I' })], 'Cmaj7, E7, Am7, D7, G7, Cmaj7: two secondary dominants in one phrase.'),
    cExs([bassCh('C', 'maj7', { label: 'I' }), bassCh('A', '7', { label: 'V7/ii' }), bassCh('D', 'm7', { label: 'ii' }), bassCh('G', '7', { label: 'V' }), bassCh('C', 'maj7', { label: 'I' })], 'The turnaround with its secondary dominant: Cmaj7, A7, Dm7, G7, Cmaj7.')
  ],
  apply: { text: 'Look at any chord chart and ask: which chords could I approach with their own V7? Putting E7 before Am or A7 before Dm is the quickest way to make a plain progression sound seasoned.' },
  challenge: cExs([bassCh('F', 'maj7'), bassCh('D', '7'), bassCh('G', 'm7'), bassCh('C', '7'), bassCh('F', 'maj7')], 'Challenge: in F, play Fmaj7, D7, Gm7, C7, Fmaj7, no hints.', { hints: false }),
  quiz: [
    q('In C, which chord is V7 of V?', ['D7', 'G7', 'A7', 'E7'], 0, 'D7 leads to G, the V chord.'),
    q('A7 leading to Dm7 is called…', ['V7 of ii', 'V7 of I', 'V of vi', 'IV of ii'], 0, 'A7 is the dominant of D minor.'),
    q('Which note of A7 is outside the key of C?', ['C♯', 'G', 'E', 'A'], 0, 'C♯ is not in C major.'),
    q('In C, which dominant 7th leads to Am7?', ['E7', 'D7', 'B7', 'A7'], 0, 'E is the V of A.'),
    q('A secondary dominant is…', ['A dominant 7th that points to a chord other than I', 'A dominant 7th in the wrong key', 'A minor 7th', 'A chord with no 7th'], 0, 'It borrows the V7 of another chord.')
  ]
});

H.push({
  id: 'g-tritone-sub', cat: 'Passing chords', title: 'Tritone substitution', minutes: 14, req: ['g-secondary-dominants'],
  why: 'The tritone substitution gives you a chromatic bass line and a surprise that still sounds right. It is a signature of sophisticated gospel playing.',
  objective: 'Replace a V7 chord with the dominant 7th a tritone away and resolve it by half step.',
  theory: [
    'You know that G7 contains B and F, a tritone. Now find another dominant 7th chord containing the same two notes. D♭7 is D♭ F A♭ C♭. C♭ sounds the same as B, so D♭7 also contains F and B.',
    'The two chords share the tritone but swap roles: B is the 3rd of G7 and the 7th of D♭7, and F is the 7th of G7 and the 3rd of D♭7. That is why they can replace each other.',
    'A tritone is six half steps, so the substitute is always six half steps from the original: G7 becomes D♭7, C7 becomes G♭7, D7 becomes A♭7.',
    'The payoff is in the bass: Dm7, D♭7, Cmaj7 gives a bass line D, D♭, C that descends by half step. The harmony is richer and the bass line is smooth.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'G7: G B D F.', chord: { root: 'G', quality: '7', oct: 4 } },
    { caption: 'D♭7: D♭ F A♭ C♭. It shares the notes F and B (as C♭) with G7.', chord: { root: 'Db', quality: '7', oct: 4 } },
    { caption: 'Cmaj7: D♭7 resolves down to it. The bass moves D♭ to C.', chord: { root: 'C', quality: 'maj7', oct: 4 } }
  ] },
  listen: [
    { label: 'Dm7, G7, Cmaj7', spec: kchords([cT('D', 'm7', { bass: true }), cT('G', '7', { bass: true }), cT('C', 'maj7', { bass: true })], { d: 1.8 }) },
    { label: 'Dm7, D♭7, Cmaj7 (tritone substitution)', spec: kchords([cT('D', 'm7', { bass: true }), cT('Db', '7', { bass: true }), cT('C', 'maj7', { bass: true })], { d: 1.8 }) }
  ],
  play: cExs([bassCh('D', 'm7', { label: 'ii' }), bassCh('Db', '7', { label: '♭II7' }), bassCh('C', 'maj7', { label: 'I' })], 'Play Dm7, D♭7, Cmaj7. The bass steps down D, D♭, C.'),
  practice: [
    cExs([bassCh('G', 'm7', { label: 'ii' }), bassCh('Gb', '7', { label: '♭II7' }), bassCh('F', 'maj7', { label: 'I' })], 'In F: Gm7, G♭7, Fmaj7.'),
    cExs([bassCh('A', 'm7', { label: 'ii' }), bassCh('Ab', '7', { label: '♭II7' }), bassCh('G', 'maj7', { label: 'I' })], 'In G: Am7, A♭7, Gmaj7.')
  ],
  apply: { text: 'Next time you play ii – V – I, swap the V for its tritone substitute and listen to the bass line. It sounds like a record.' },
  challenge: cExs([bassCh('E', 'm7'), bassCh('Eb', '7'), bassCh('D', 'maj7')], 'Challenge: in D, play Em7, E♭7, Dmaj7, no hints.', { hints: false }),
  quiz: [
    q('What is the tritone substitution for G7?', ['D♭7', 'F7', 'A♭7', 'B7'], 0, 'G7 and D♭7 are a tritone apart.'),
    q('Which two notes do G7 and D♭7 share?', ['B (C♭) and F', 'G and D', 'D and A♭', 'None'], 0, 'The tritone B–F is shared.'),
    q('What does the bass do in Dm7 – D♭7 – Cmaj7?', ['It descends by half steps: D, D♭, C', 'It jumps a fifth', 'It stays on D', 'It rises by thirds'], 0, 'Chromatic descent in the bass.'),
    q('What is the tritone substitution for C7?', ['G♭7', 'F7', 'B♭7', 'D7'], 0, 'C up or down six half steps is G♭.'),
    q('A tritone is…', ['Six half steps', 'A perfect 5th', 'A major 3rd', 'An octave'], 0, 'Half an octave.')
  ]
});

H.push({
  id: 'g-walk-up', cat: 'Passing chords', title: 'Bass walk-ups', minutes: 14, req: ['g-passing-dim', 'bass-movement'],
  why: 'A walk-up builds energy: the bass climbs, the congregation leans in, and the next chord arrives like an arrival.',
  objective: 'Play a chromatic bass walk-up from I to IV using passing diminished chords.',
  theory: [
    'A walk-up is a bass line that climbs step by step to a target. In C the chromatic walk-up from I to IV has bass notes C, C♯, D, D♯, E, F.',
    'The chords above it: Cmaj7, C♯dim7, Dm7, D♯dim7, Em7, Fmaj7. Every other chord is a passing diminished chord, and the real chords (I, ii, iii, IV) climb the scale.',
    'You can also walk up diatonically: Cmaj7, Dm7, Em7, Fmaj7, with bass C, D, E, F. It is smoother and gentler.',
    'Use a walk-up at the end of a verse to lift into the chorus. Make it a crescendo: each chord a little louder than the last.'
  ],
  visual: { range: [36, 72], steps: [
    { caption: 'The bass notes of the chromatic walk-up: C, C♯, D, D♯, E, F.', hi: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3'] }
  ] },
  listen: [{ label: 'Chromatic walk-up in C', spec: kchords([cT('C', 'maj7', { bass: true }), cT('C#', 'dim7', { bass: true }), cT('D', 'm7', { bass: true }), cT('D#', 'dim7', { bass: true }), cT('E', 'm7', { bass: true }), cT('F', 'maj7', { bass: true })], { d: 1.1 }) }],
  play: cExs([bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('D#', 'dim7'), bassCh('E', 'm7'), bassCh('F', 'maj7')], 'Play Cmaj7, C♯dim7, Dm7, D♯dim7, Em7, Fmaj7. The bass climbs C to F.'),
  practice: [
    cExs([bassCh('G', 'maj7'), bassCh('G#', 'dim7'), bassCh('A', 'm7'), bassCh('A#', 'dim7'), bassCh('B', 'm7'), bassCh('C', 'maj7')], 'In G: Gmaj7, G♯dim7, Am7, A♯dim7, Bm7, Cmaj7.', { range: [47, 72] }),
    cExs([bassCh('F', 'maj7'), bassCh('G', 'm7'), bassCh('A', 'm7'), bassCh('Bb', 'maj7')], 'A diatonic walk-up in F: Fmaj7, Gm7, Am7, B♭maj7.')
  ],
  apply: { text: 'End the last line of a verse on V7, then play the walk-up into the chorus. The chromatic notes keep the ear stretched until the arrival.' },
  challenge: cExs([bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('D#', 'dim7'), bassCh('E', 'm7'), bassCh('F', 'maj7'), bassCh('G', '7')], 'Challenge: the full walk-up and on to G7, no hints.', { hints: false }),
  quiz: [
    q('What are the bass notes of a chromatic walk-up from C to F?', ['C C♯ D D♯ E F', 'C D E F', 'C E G F', 'C B A F'], 0, 'Every half step.'),
    q('Which chord sits between Dm7 and Em7 in the walk-up?', ['D♯dim7', 'Ddim7', 'E♭maj7', 'Fdim7'], 0, 'D♯ is a half step below E.'),
    q('A walk-up usually leads to…', ['A strong arrival chord such as IV', 'A key change only', 'Silence', 'A drum solo'], 0, 'The climb builds toward the target.'),
    q('A diatonic walk-up from C to F has bass notes…', ['C D E F', 'C C♯ D F', 'C E F♯ F', 'C G F'], 0, 'Only notes of the key.')
  ]
});

H.push({
  id: 'g-walk-down', cat: 'Passing chords', title: 'Bass walk-downs', minutes: 14, req: ['g-walk-up'],
  why: 'A walk-down is the gospel sigh: the bass slides down and the music relaxes into the next chord.',
  objective: 'Play a chromatic bass walk-down from I to V in C, F and G.',
  theory: [
    'A walk-down is the reverse: the bass descends by step. From C to G, the chromatic version has bass notes C, B, B♭, A, A♭, G.',
    'The chords above it: C, G/B, B♭, Am7, A♭, G7. The G/B is a first-inversion G with B in the bass. The B♭ and A♭ are major chords borrowed from outside the key; they exist purely to carry the bass line.',
    'Moving the same idea to F gives F, C/E, E♭, Dm7, D♭, C7 (bass F, E, E♭, D, D♭, C). In G: G, D/F♯, F, Em7, E♭, D7.',
    'Use a walk-down to relax out of a climax or to settle toward the dominant before a final resolution.'
  ],
  visual: { range: [36, 72], steps: [
    { caption: 'The bass notes of the walk-down: C, B, B♭, A, A♭, G.', hi: ['C4', 'B3', 'Bb3', 'A3', 'Ab3', 'G3'] }
  ] },
  listen: [{ label: 'Walk-down in C', spec: kchords([cT('C', 'major'), cT('G', 'major', { inv: 1 }), cT('Bb', 'major'), cT('A', 'm7'), cT('Ab', 'major'), cT('G', '7')], { d: 1.2 }) }],
  play: cExs([cT('C', 'major'), cT('G', 'major', { inv: 1, label: 'G/B' }), cT('Bb', 'major'), cT('A', 'm7'), cT('Ab', 'major'), cT('G', '7')], 'Play C, G/B, B♭, Am7, A♭, G7. The bass walks down C B B♭ A A♭ G.', { range: W }),
  practice: [cExs([cT('F', 'major'), cT('C', 'major', { inv: 1, label: 'C/E' }), cT('Eb', 'major'), cT('D', 'm7'), cT('Db', 'major'), cT('C', '7')], 'In F: F, C/E, E♭, Dm7, D♭, C7.', { range: W })],
  apply: { text: 'Try the walk-down as the last bar of a chorus, landing on the V chord. Then follow the walk-up from the previous lesson into the next verse. Up and down gives your arrangements real shape.' },
  challenge: cExs([cT('G', 'major'), cT('D', 'major', { inv: 1, label: 'D/F♯' }), cT('F', 'major'), cT('E', 'm7'), cT('Eb', 'major'), cT('D', '7')], 'Challenge: in G, play G, D/F♯, F, Em7, E♭, D7, no hints.', { hints: false, range: W }),
  quiz: [
    q('What are the bass notes of C, G/B, B♭, Am7, A♭, G7?', ['C B B♭ A A♭ G', 'C B A G F E', 'C D E F G A', 'C G C G C G'], 0, 'A chromatic descent from C to G.'),
    q('G/B has which note in the bass?', ['B', 'G', 'D', 'F'], 0, 'The note after the slash.'),
    q('The B♭ and A♭ chords here are…', ['Borrowed major chords outside the key', 'Minor chords', 'Diminished chords', 'Sus chords'], 0, 'They exist to carry the bass line.'),
    q('A walk-down usually moves from…', ['I down to V', 'V up to I', 'I to IV only', 'One key to another'], 0, 'It settles toward the dominant.')
  ]
});

H.push({
  id: 'g-substitution', cat: 'Passing chords', title: 'Chord substitution and reharmonization', minutes: 15, req: ['g-tritone-sub', 'g-walk-down'],
  why: 'Reharmonization lets you take any simple song and make it your own, without changing a note of the melody.',
  objective: 'Replace plain chords with substitutes of the same function, then add secondary dominants and a tritone substitution.',
  theory: [
    'Chords in a key fall into three families by function. Tonic (rest): I, iii, vi. Subdominant (movement away): ii, IV. Dominant (tension): V, vii°.',
    'Any chord can be replaced by another from its family. Cmaj7 can become Em7 or Am7. Fmaj7 can become Dm7. G7 can become Bm7♭5 (which shares B D F with G7).',
    'Reharmonization is rewriting the chords under an existing melody. Start with the plain version (C – F – G – C), swap chords within a function, and add colour: secondary dominants, passing chords and tritone substitutions.',
    'Always check the melody. A new chord must contain, or at least not clash with, the melody note sounding over it.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Plain: Fmaj7.', chord: { root: 'F', quality: 'maj7', oct: 4 } },
    { caption: 'Same function: Dm7 (F A C plus D).', chord: { root: 'D', quality: 'm7', oct: 4 } },
    { caption: 'Dominant family: Bm7♭5 shares B D F with G7.', chord: { root: 'B', quality: 'm7b5', oct: 4 } }
  ] },
  listen: [
    { label: 'Plain: C F G C', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major')], { d: 1.6 }) },
    { label: 'Reharmonized: Cmaj7, A7, Dm7, D♭7, Cmaj7', spec: kchords([cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('Db', '7'), cT('C', 'maj7')], { d: 1.6 }) }
  ],
  play: cExs([cT('C', 'maj7'), cT('F', 'maj7'), cT('G', '7'), cT('C', 'maj7')], 'The plain version with 7ths: Cmaj7, Fmaj7, G7, Cmaj7.'),
  practice: [
    cExs([cT('C', 'maj7'), cT('D', 'm7'), cT('B', 'm7b5'), cT('C', 'maj7')], 'Same functions, new chords: Cmaj7, Dm7, Bm7♭5, Cmaj7.'),
    cExs([cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('Db', '7'), cT('C', 'maj7')], 'Reharmonized: Cmaj7, A7, Dm7, D♭7, Cmaj7.')
  ],
  apply: { text: 'Take a hymn you know. Write its plain chords, then add one substitution, one secondary dominant and one tritone substitution. Play both versions back to back.' },
  challenge: cExs([cT('F', 'maj7'), cT('D', '7'), cT('G', 'm7'), cT('Gb', '7'), cT('F', 'maj7')], 'Challenge: in F, play Fmaj7, D7, Gm7, G♭7, Fmaj7 (a secondary dominant and a tritone substitution), no hints.', { hints: false }),
  quiz: [
    q('Which chords share the tonic function in C?', ['C, Em, Am', 'C, F, G', 'Dm, G, Bdim', 'F, Dm, G'], 0, 'I, iii and vi are the tonic family.'),
    q('Which chord can substitute for Fmaj7 (same function)?', ['Dm7', 'G7', 'Em7', 'Bm7♭5'], 0, 'ii and IV are both subdominant.'),
    q('Which chord can substitute for G7 (dominant function)?', ['Bm7♭5', 'Fmaj7', 'Am7', 'Dm7'], 0, 'B D F A: it shares B D F with G7.'),
    q('Reharmonization means…', ['Changing the chords under a melody', 'Changing the melody', 'Changing the tempo', 'Changing the key'], 0, 'The tune stays; the harmony changes.')
  ]
});

/* =========================== gospel voicings =========================== */
H.push({
  id: 'g-closed-open', cat: 'Voicings', title: 'Closed and open voicings', minutes: 14, req: ['seventh-inversions', 'ninth-chords'],
  why: 'How you spread the notes of a chord changes how it sounds. Open voicings are what give gospel piano its size.',
  objective: 'Play closed and open voicings of the same chord and hear the difference.',
  theory: [
    'A voicing is the choice of which notes of a chord you play, and in what order. A closed voicing packs the notes within about an octave: Cmaj7 as C E G B.',
    'An open voicing spreads them. The left hand plays the root and 5th low, the right hand plays the 3rd, 7th and 9th above. Cmaj9 open: left hand C3 G3, right hand E4 B4 D5. The same chord, but fuller and clearer.',
    'A good rule: keep thirds and sevenths in the right hand, and keep the notes in the lower register wide apart so the sound stays clear rather than muddy.',
    'Here the app checks the notes you play (the pitch classes) and that the lowest note is the one shown. Look at the keyboard and match the shape.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'Closed Cmaj7: C E G B within one octave.', hi: ['C4', 'E4', 'G4', 'B4'] },
    { caption: 'Open Cmaj9: C and G low in the left hand, E B D above.', hi: ['C3', 'G3', 'E4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'Closed Cmaj7, then open Cmaj9', spec: kv([vc('a', ['C4', 'E4', 'G4', 'B4']), vc('b', ['C3', 'G3', 'E4', 'B4', 'D5'])], 2.6) }],
  play: vEx([vc('Cmaj7 closed', ['C4', 'E4', 'G4', 'B4']), vc('Cmaj9 open', ['C3', 'G3', 'E4', 'B4', 'D5'], { span: 20 })], 'Play Cmaj7 closed, then the same chord opened up as Cmaj9.'),
  practice: [
    vEx([vc('Fmaj9 open', ['F2', 'C3', 'A3', 'E4', 'G4'], { span: 20 }), vc('G9 open', ['G2', 'D3', 'B3', 'F4', 'A4'], { span: 20 })], 'Open voicings: Fmaj9, then G9. Root and 5th low, 3rd, 7th and 9th above.')
  ],
  apply: { text: 'Play your simple progression in closed position, then repeat it in open position with the left hand holding root and 5th. The open version fills a room.' },
  challenge: vEx([vc('Dm9 open', ['D3', 'A3', 'F4', 'C5', 'E5'], { span: 20 }), vc('G9 open', ['G2', 'D3', 'B3', 'F4', 'A4'], { span: 20 }), vc('Cmaj9 open', ['C3', 'G3', 'E4', 'B4', 'D5'], { span: 20 })], 'Challenge: Dm9, G9, Cmaj9 in open voicings, no hints.', { hints: false }),
  quiz: [
    q('A closed voicing keeps the notes…', ['Within about an octave', 'Spread over two or more octaves', 'Only on the black keys', 'As a single note'], 0, 'Packed close together.'),
    q('A typical open voicing has the left hand play…', ['Root and 5th', 'All the chord notes', 'Only the melody', 'The 3rd and 7th'], 0, 'Low and wide for clarity.'),
    q('Why use open voicings?', ['They sound fuller and avoid muddy low clusters', 'They change the key', 'They are easier for every chord', 'No reason'], 0, 'Clarity and size.'),
    q('Which right-hand notes complete an open Cmaj9 (after C and G in the left)?', ['E B D', 'C E G', 'F A C', 'D F A'], 0, '3rd, 7th and 9th.')
  ]
});

H.push({
  id: 'g-shell', cat: 'Voicings', title: 'Shell voicings: root, 7th and 3rd', minutes: 14, req: ['g-closed-open'],
  why: 'Three notes tell the whole story of a chord. Shell voicings let the left hand state the chord clearly while the right hand is free.',
  objective: 'Play shell voicings (root, 7th, 3rd) for ii – V – I in C, F and G.',
  theory: [
    'The 3rd and the 7th define a chord: the 3rd says major or minor, the 7th says maj7, m7 or dominant. Add the root and you have a shell: three notes that name the chord.',
    'A common left-hand shell is root, 7th, 3rd, ordered from low to high. Cmaj7: C3 B3 E4. Dm7: D3 C4 F4. G7: G2 F3 B3.',
    'Because it is only three notes, your right hand is free for melody, 9ths and fills. A pianist playing with a bassist can drop the root as well.',
    'Look at the keyboard for the exact positions. The app checks the notes you play and that the lowest is the root.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'Cmaj7 shell: root C, 7th B, 3rd E.', hi: ['C3', 'B3', 'E4'] },
    { caption: 'Dm7 shell: root D, 7th C, 3rd F.', hi: ['D3', 'C4', 'F4'] },
    { caption: 'G7 shell: root G, 7th F, 3rd B.', hi: ['G2', 'F3', 'B3'] }
  ] },
  listen: [{ label: 'Dm7, G7, Cmaj7 as shells', spec: kv([vc('a', ['D3', 'C4', 'F4']), vc('b', ['G2', 'F3', 'B3']), vc('c', ['C3', 'B3', 'E4'])], 2) }],
  play: vEx([vc('Cmaj7 shell', ['C3', 'B3', 'E4']), vc('Dm7 shell', ['D3', 'C4', 'F4']), vc('G7 shell', ['G2', 'F3', 'B3'])], 'Play the Cmaj7, Dm7 and G7 shells.'),
  practice: [
    vEx([vc('Fmaj7 shell', ['F2', 'E3', 'A3']), vc('Gm7 shell', ['G2', 'F3', 'Bb3']), vc('C7 shell', ['C3', 'Bb3', 'E4'])], 'The same idea in F: Fmaj7, Gm7, C7.')
  ],
  apply: { text: 'Play a shell with your left hand and a melody or an arpeggio with your right. The left hand shell is enough for the harmony to be clear.' },
  challenge: vEx([vc('Am7 shell', ['A2', 'G3', 'C4']), vc('D7 shell', ['D3', 'C4', 'F#4']), vc('Gmaj7 shell', ['G2', 'F#3', 'B3'])], 'Challenge: ii – V – I in G as shells: Am7, D7, Gmaj7, no hints.', { hints: false }),
  quiz: [
    q('A shell voicing contains…', ['Root, 3rd and 7th', 'All five notes', 'Only the root', 'Three fifths'], 0, 'The skeleton of the chord.'),
    q('Why are the 3rd and 7th so important?', ['They define the chord quality', 'They are the loudest notes', 'They are black keys', 'They are not'], 0, 'They tell you major, minor or dominant.'),
    q('Which notes make the Dm7 shell (root, 7th, 3rd)?', ['D C F', 'D F A', 'D A C', 'D E F'], 0, 'D, C, F.'),
    q('Which notes make the G7 shell (root, 7th, 3rd)?', ['G F B', 'G B D', 'G D F', 'G A B'], 0, 'G, F, B.')
  ]
});

H.push({
  id: 'g-rootless', cat: 'Voicings', title: 'Rootless voicings', minutes: 15, req: ['g-shell', 'ninth-chords'],
  why: 'Rootless voicings are how professional keyboardists sound rich without crowding the bass. They also move beautifully from chord to chord.',
  objective: 'Play a rootless ii – V – I in C, F and G with minimal movement between chords.',
  theory: [
    'When a bassist or your left hand plays the root, the right hand can leave it out and play the notes that carry colour: the 3rd, 5th (or 13th), 7th and 9th.',
    'For ii – V – I in C: Dm9 rootless is F A C E (3 5 7 9). G13 rootless is F A B E (7 9 3 13). Cmaj9 rootless is E G B D (3 5 7 9).',
    'Watch how little moves: Dm9 to G13 changes only C to B. G13 to Cmaj9 moves each note by a single step (F to E, A to G, E to D) while B stays. That is voice leading in its purest form.',
    'In F: Gm9 B♭ D F A, then C13 B♭ D E A, then Fmaj9 A C E G. In G: Am9 C E G B, then D13 C E F♯ B, then Gmaj9 B D F♯ A.'
  ],
  visual: { range: [48, 84], steps: [
    { caption: 'Dm9 rootless: F A C E.', hi: ['F4', 'A4', 'C5', 'E5'] },
    { caption: 'G13 rootless: F A B E. Only C moved, down to B.', hi: ['F4', 'A4', 'B4', 'E5'] },
    { caption: 'Cmaj9 rootless: E G B D. Each note stepped down.', hi: ['E4', 'G4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'Rootless ii – V – I in C', spec: kv([vc('a', ['F4', 'A4', 'C5', 'E5']), vc('b', ['F4', 'A4', 'B4', 'E5']), vc('c', ['E4', 'G4', 'B4', 'D5'])], 2.2) }],
  play: vEx([vc('Dm9 rootless', ['F4', 'A4', 'C5', 'E5'], { low: false }), vc('G13 rootless', ['F4', 'A4', 'B4', 'E5'], { low: false }), vc('Cmaj9 rootless', ['E4', 'G4', 'B4', 'D5'], { low: false })], 'Play the rootless ii – V – I in C: Dm9, G13, Cmaj9. Notice how little moves.', { range: [48, 84] }),
  practice: [
    vEx([vc('Gm9 rootless', ['Bb3', 'D4', 'F4', 'A4'], { low: false }), vc('C13 rootless', ['Bb3', 'D4', 'E4', 'A4'], { low: false }), vc('Fmaj9 rootless', ['A3', 'C4', 'E4', 'G4'], { low: false })], 'In F: Gm9, C13, Fmaj9.', { range: [48, 84] })
  ],
  apply: { text: 'Hold the root with your left hand and play these right-hand voicings above it. Move through the three chords slowly and listen to the connection. That is the sound of a pro playing ii – V – I.' },
  challenge: vEx([vc('Am9 rootless', ['C4', 'E4', 'G4', 'B4'], { low: false }), vc('D13 rootless', ['C4', 'E4', 'F#4', 'B4'], { low: false }), vc('Gmaj9 rootless', ['B3', 'D4', 'F#4', 'A4'], { low: false })], 'Challenge: the rootless ii – V – I in G: Am9, D13, Gmaj9, no hints.', { hints: false, range: [48, 84] }),
  quiz: [
    q('A rootless voicing leaves out…', ['The root', 'The 3rd', 'The 7th', 'The 9th'], 0, 'The bass or left hand supplies it.'),
    q('Which notes make Dm9 rootless (3 5 7 9)?', ['F A C E', 'D F A C', 'D A C E', 'F A B E'], 0, 'The 3rd, 5th, 7th and 9th.'),
    q('Going from Dm9 to G13 in these voicings, which note moves?', ['C moves to B', 'F moves to E', 'A moves to G', 'E moves to D'], 0, 'Only one note changes.'),
    q('Which notes make Cmaj9 rootless?', ['E G B D', 'C E G B', 'G B D F', 'D F A C'], 0, '3rd, 5th, 7th and 9th.'),
    q('Who plays the root?', ['The left hand or the bassist', 'Nobody', 'The singer', 'The drummer only'], 0, 'The right hand is free for colour.')
  ]
});

H.push({
  id: 'g-quartal', cat: 'Voicings', title: 'Quartal voicings', minutes: 13, req: ['g-rootless'],
  why: 'Stacking fourths gives an open, modern, ambiguous sound that suits contemporary worship and gospel ballads.',
  objective: 'Play three-note quartal stacks over a bass note and resolve them to an ordinary chord.',
  theory: [
    'Chords are normally stacked in thirds. A quartal voicing stacks perfect fourths (five half steps) instead. The result is open and suspended: it is not clearly major or minor, which makes it feel modern.',
    'Over D in the bass, the stack E A D reads as a minor 9 sound. Over G in the bass, the stack D G C reads as a suspended G. Each stack is two perfect fourths: E to A to D, and D to G to C.',
    'Quartal chords love to resolve. Play D minor with E A D, then G with D G C, then land on an ordinary Cmaj9. The ordinary chord feels like coming home.',
    'Use them for a floating introduction or under a sustained melody note where you want space rather than a clear chord quality.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'D in the bass with the stack E A D above it: two perfect fourths.', hi: ['D3', 'E4', 'A4', 'D5'] },
    { caption: 'G in the bass with the stack D G C above it.', hi: ['G2', 'D4', 'G4', 'C5'] }
  ] },
  listen: [{ label: 'Quartal Dm, quartal G, then Cmaj9', spec: kv([vc('a', ['D3', 'E4', 'A4', 'D5']), vc('b', ['G2', 'D4', 'G4', 'C5']), vc('c', ['C3', 'E4', 'G4', 'B4', 'D5'])], 2.4) }],
  play: vEx([vc('Dm quartal', ['D3', 'E4', 'A4', 'D5']), vc('G quartal', ['G2', 'D4', 'G4', 'C5'])], 'Play the quartal voicing over D, then over G.'),
  practice: [vEx([vc('Dm quartal', ['D3', 'E4', 'A4', 'D5']), vc('G quartal', ['G2', 'D4', 'G4', 'C5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5'])], 'Now resolve to an ordinary chord: Dm quartal, G quartal, Cmaj9.')],
  apply: { text: 'Hold a quartal voicing under a sustained note while the singer finds their pitch. Then let a plain chord resolve it.' },
  challenge: vEx([vc('Gm quartal', ['G2', 'A3', 'D4', 'G4']), vc('C quartal', ['C3', 'G3', 'C4', 'F4']), vc('Fmaj9', ['F2', 'A3', 'C4', 'E4', 'G4'])], 'Challenge: Gm quartal (A D G over G), C quartal (G C F over C), then Fmaj9, no hints.', { hints: false }),
  quiz: [
    q('A quartal voicing stacks…', ['Perfect fourths', 'Major thirds', 'Minor sixths', 'Octaves'], 0, 'Five half steps between neighbours.'),
    q('A perfect fourth is…', ['5 half steps', '4 half steps', '7 half steps', '3 half steps'], 0, 'C to F is a perfect fourth.'),
    q('What interval is E to A?', ['Perfect 4th', 'Perfect 5th', 'Major 3rd', 'Minor 7th'], 0, 'E F G A: four letter names, five half steps.'),
    q('How would you describe the quartal sound?', ['Open and modern, not clearly major or minor', 'Dark and tense', 'Exactly like a triad', 'Always loud'], 0, 'Fourths avoid the thirds that define quality.')
  ]
});

H.push({
  id: 'g-voicing-251', cat: 'Voicings', title: 'Gospel voicings in a ii – V – I', minutes: 16, req: ['g-quartal', 'g-rootless', 'g-shell'],
  why: 'This lesson puts it all together: bass in the left hand, rootless colour in the right, voiced to move smoothly.',
  objective: 'Play a full ii – V – I with a bass root and a rootless right-hand voicing in C, F and G.',
  theory: [
    'Combine the previous ideas. The left hand plays the root low. The right hand plays the rootless voicing above: Dm9 F A C E, G13 F A B E, Cmaj9 E G B D.',
    'The full voicing of Dm9 is D3 plus F4 A4 C5 E5. For G13 it is G2 plus F4 A4 B4 E5. For Cmaj9 it is C3 plus E4 G4 B4 D5. Only the bass leaps; the right hand barely moves.',
    'This is the heart of gospel ballad playing: a rich, moving bass under chords that glide. Practise slowly and listen to the right hand. It should sound like one voice moving, not three chords.',
    'The app checks the exact notes (pitch classes) and that the lowest note is the root, so look at the keyboard and match the shape.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'Dm9: D3 in the bass, F A C E above.', hi: ['D3', 'F4', 'A4', 'C5', 'E5'] },
    { caption: 'G13: G2 in the bass, F A B E above.', hi: ['G2', 'F4', 'A4', 'B4', 'E5'] },
    { caption: 'Cmaj9: C3 in the bass, E G B D above.', hi: ['C3', 'E4', 'G4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'ii – V – I with bass and rootless voicings', spec: kv([vc('a', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('b', ['G2', 'F4', 'A4', 'B4', 'E5']), vc('c', ['C3', 'E4', 'G4', 'B4', 'D5'])], 2.4) }],
  play: vEx([vc('Dm9', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('G13', ['G2', 'F4', 'A4', 'B4', 'E5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5'])], 'Play the full ii – V – I in C: Dm9, G13, Cmaj9, bass plus rootless voicing.'),
  practice: [
    vEx([vc('Gm9', ['G2', 'Bb3', 'D4', 'F4', 'A4']), vc('C13', ['C3', 'Bb3', 'D4', 'E4', 'A4']), vc('Fmaj9', ['F2', 'A3', 'C4', 'E4', 'G4'])], 'In F: Gm9, C13, Fmaj9.')
  ],
  apply: { text: 'Record yourself playing this in C, F and G. The right hand should sound smooth, almost like a held chord that changes colour. That is the sound you are after.' },
  challenge: vEx([vc('Am9', ['A2', 'C4', 'E4', 'G4', 'B4']), vc('D13', ['D3', 'C4', 'E4', 'F#4', 'B4']), vc('Gmaj9', ['G2', 'B3', 'D4', 'F#4', 'A4'])], 'Challenge: ii – V – I in G: Am9, D13, Gmaj9 with bass, no hints.', { hints: false }),
  quiz: [
    q('In this voicing, what does the left hand play?', ['The root', 'The 3rd', 'The 9th', 'Nothing'], 0, 'The bass root.'),
    q('Which right-hand notes make Dm9 rootless?', ['F A C E', 'D F A C', 'D A C E', 'F A B E'], 0, '3rd, 5th, 7th, 9th.'),
    q('Which right-hand notes make G13 rootless in this voicing?', ['F A B E', 'G B D F', 'B D F A', 'F A C E'], 0, '7th, 9th, 3rd and 13th.'),
    q('Between the Dm9 and G13 right-hand voicings, which note changes?', ['C to B', 'F to E', 'E to D', 'A to G'], 0, 'Only one note moves.')
  ]
});

/* =========================== arranging: turnarounds, key changes, intros, endings, pedal =========================== */
H.push({
  id: 'g-turnarounds-adv', cat: 'Arranging', title: 'Colourful turnarounds', minutes: 14, req: ['g-secondary-dominants', 'g-passing-dim', 'g-tritone-sub'],
  why: 'A turnaround is a song\'s heartbeat. Gospel turnarounds are never plain: each one carries a secondary dominant, a passing chord or a substitution.',
  objective: 'Play four enriched versions of the I – vi – ii – V turnaround.',
  theory: [
    'The plain turnaround is Cmaj7 – Am7 – Dm7 – G7. Now enrich it. Replace Am7 with A7 (V7 of ii): Cmaj7 – A7 – Dm7 – G7. The chord pulls hard into Dm7.',
    'Replace the second chord with a passing diminished chord: Cmaj7 – C♯dim7 – Dm7 – G7. The bass walks C, C♯, D, then G.',
    'Start earlier on iii: Em7 – A7 – Dm7 – G7 – Cmaj7 is a chain of dominants, each falling a fifth. And you can swap G7 for D♭7: Cmaj7 – A7 – Dm7 – D♭7 – Cmaj7.',
    'Choose the version by the mood: the secondary dominant is bright, the diminished chord is smooth, the tritone substitution is sophisticated.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Plain: Cmaj7 – Am7 – Dm7 – G7.', chord: { root: 'A', quality: 'm7', oct: 4 } },
    { caption: 'With a secondary dominant: A7 replaces Am7.', chord: { root: 'A', quality: '7', oct: 4 } }
  ] },
  listen: [
    { label: 'Plain turnaround', spec: kchords([cT('C', 'maj7', { bass: true }), cT('A', 'm7', { bass: true }), cT('D', 'm7', { bass: true }), cT('G', '7', { bass: true })], { d: 1.5 }) },
    { label: 'With A7', spec: kchords([cT('C', 'maj7', { bass: true }), cT('A', '7', { bass: true }), cT('D', 'm7', { bass: true }), cT('G', '7', { bass: true })], { d: 1.5 }) },
    { label: 'With C♯dim7', spec: kchords([cT('C', 'maj7', { bass: true }), cT('C#', 'dim7', { bass: true }), cT('D', 'm7', { bass: true }), cT('G', '7', { bass: true })], { d: 1.5 }) }
  ],
  play: cExs([bassCh('C', 'maj7'), bassCh('A', '7'), bassCh('D', 'm7'), bassCh('G', '7')], 'Play Cmaj7, A7, Dm7, G7.'),
  practice: [
    cExs([bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('G', '7')], 'With the passing diminished: Cmaj7, C♯dim7, Dm7, G7.'),
    cExs([bassCh('E', 'm7'), bassCh('A', '7'), bassCh('D', 'm7'), bassCh('G', '7'), bassCh('C', 'maj7')], 'The chain: Em7, A7, Dm7, G7, Cmaj7.')
  ],
  apply: { text: 'Play all four versions over a steady groove in the Song Lab. Pick the one that matches the mood of the song, then use it to start every verse.' },
  challenge: cExs([bassCh('E', 'm7'), bassCh('A', '7'), bassCh('D', 'm7'), bassCh('Db', '7'), bassCh('C', 'maj7')], 'Challenge: Em7, A7, Dm7, D♭7, Cmaj7 (with the tritone substitution), no hints.', { hints: false }),
  quiz: [
    q('In the turnaround Cmaj7 – A7 – Dm7 – G7, what is A7?', ['V7 of ii', 'V7 of I', 'IV', 'vi'], 0, 'A7 points at Dm7.'),
    q('Which chain is iii – VI – ii – V in C?', ['Em7 A7 Dm7 G7', 'Am7 D7 G7 C', 'Em7 B7 Am7 D7', 'Dm7 G7 Cmaj7 A7'], 0, 'E, A, D, G roots.'),
    q('Why do these turnarounds feel natural?', ['The roots fall by fifths', 'The root stays', 'All notes are the same', 'Only black keys'], 0, 'E to A to D to G, each down a fifth.'),
    q('A turnaround\'s job is to…', ['Lead back to the start of the song', 'End the song', 'Change key', 'Create silence'], 0, 'It brings you home again.')
  ]
});

H.push({
  id: 'g-modulation', cat: 'Arranging', title: 'Modulation: key changes', minutes: 15, req: ['g-secondary-dominants', 'circle-fifths'],
  why: 'In gospel, the last chorus often goes up. A smooth key change lifts the whole room.',
  objective: 'Move up a whole step or a half step using a pivot V7 or a ii – V of the new key.',
  theory: [
    'Modulation means changing key. In gospel the usual direction is up: a half step or a whole step, to raise the energy for the final chorus.',
    'The simplest way is a "gear change": play the old I chord, then jump to the new key. It works, but it is abrupt.',
    'The smooth way is to prepare the new key with its own V7. To go from C up to D, play the V7 of D, which is A7, then land on D: C – A7 – D. To go from C up to D♭ (a half step), use A♭7: C – A♭7 – D♭.',
    'Even smoother: play the ii – V of the new key. Whole step up from C to D: Em7 – A7 – Dmaj7. Half step up to D♭: E♭m7 – A♭7 – D♭maj7. The listener hears a complete cadence in the new key before the new chorus begins.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'A7 is the V7 of D. It pivots C up into D.', chord: { root: 'A', quality: '7', oct: 4 } },
    { caption: 'D major: the new home.', chord: { root: 'D', quality: 'major', oct: 4 } }
  ] },
  listen: [
    { label: 'C up a whole step to D', spec: kchords([cT('C', 'major', { bass: true }), cT('A', '7', { bass: true }), cT('D', 'major', { bass: true })], { d: 1.8 }) },
    { label: 'C up a half step to D♭', spec: kchords([cT('C', 'major', { bass: true }), cT('Ab', '7', { bass: true }), cT('Db', 'major', { bass: true })], { d: 1.8 }) },
    { label: 'ii – V – I of the new key', spec: kchords([cT('E', 'm7', { bass: true }), cT('A', '7', { bass: true }), cT('D', 'maj7', { bass: true })], { d: 1.8 }) }
  ],
  play: cExs([bassCh('C', 'major', { label: 'old I' }), bassCh('A', '7', { label: 'V7 of D' }), bassCh('D', 'major', { label: 'new I' })], 'Play C, A7, D: the pivot up a whole step.'),
  practice: [
    cExs([bassCh('C', 'major', { label: 'old I' }), bassCh('Ab', '7', { label: 'V7 of D♭' }), bassCh('Db', 'major', { label: 'new I' })], 'Up a half step: C, A♭7, D♭.'),
    cExs([bassCh('E', 'm7', { label: 'ii' }), bassCh('A', '7', { label: 'V' }), bassCh('D', 'maj7', { label: 'I' })], 'The ii – V – I of the new key: Em7, A7, Dmaj7.')
  ],
  apply: { text: 'End the last chorus on I, then play ii – V of the next key and land in the new key on the downbeat. The congregation hears a lift, not a jolt.' },
  challenge: cExs([bassCh('C', 'maj7'), bassCh('A', '7'), bassCh('D', 'maj7'), bassCh('B', '7'), bassCh('E', 'maj7')], 'Challenge: Cmaj7, A7, Dmaj7, B7, Emaj7, two key changes in a row, no hints.', { hints: false, range: [47, 72] }),
  quiz: [
    q('Which chord pivots from C into D?', ['A7', 'G7', 'F7', 'D7'], 0, 'A7 is the V7 of D.'),
    q('What is the V7 of D♭?', ['A♭7', 'G7', 'E♭7', 'D♭7'], 0, 'A♭ is the 5th note of D♭.'),
    q('A "gear change" modulation…', ['Jumps to the new key without preparation', 'Needs a long pivot', 'Always uses minor', 'Is never used'], 0, 'Abrupt, but effective.'),
    q('What is the ii – V – I of E♭?', ['Fm7 B♭7 E♭maj7', 'Em7 A7 Dmaj7', 'Gm7 C7 F', 'Fm7 B7 E♭'], 0, 'F is the 2nd note of E♭, B♭ is the 5th.'),
    q('Why raise the key for the last chorus?', ['It raises the energy', 'It lowers the energy', 'It changes the lyrics', 'It makes it softer'], 0, 'The lift builds excitement.')
  ]
});

H.push({
  id: 'g-intros', cat: 'Arranging', title: 'Introductions', minutes: 13, req: ['g-turnarounds-adv', 'sus-chords'],
  why: 'The first four bars tell the room what is coming. A good intro sets the key, the tempo and the feeling before a word is sung.',
  objective: 'Play three kinds of intro: a turnaround intro, a sus vamp and a walk-up.',
  theory: [
    'Turnaround intro: play the turnaround that leads into the song, ending on V7 so the verse arrives as a resolution. In C: Cmaj7, Am7, Dm7, G7sus4, G7, and then the song starts.',
    'Vamp intro: repeat a short pattern to set the groove while the leader finds the key and the people settle. Try Cadd9 – Fadd9 – Cadd9 – Gsus4.',
    'Walk-up intro: use the chromatic walk-up from the previous lesson to climb into the first chord. It builds anticipation.',
    'Whatever you play, state the key clearly and the tempo steadily. An intro is a promise, and the first line should keep it.'
  ],
  listen: [
    { label: 'Turnaround intro', spec: kchords([cT('C', 'maj7', { bass: true }), cT('A', 'm7', { bass: true }), cT('D', 'm7', { bass: true }), cT('G', '7sus4', { bass: true }), cT('G', '7', { bass: true })], { d: 1.5 }) },
    { label: 'Sus vamp', spec: kchords([cT('C', 'add9'), cT('F', 'add9'), cT('C', 'add9'), cT('G', 'sus4')], { d: 1.8 }) }
  ],
  play: cExs([bassCh('C', 'maj7'), bassCh('A', 'm7'), bassCh('D', 'm7'), bassCh('G', '7sus4'), bassCh('G', '7')], 'The turnaround intro: Cmaj7, Am7, Dm7, G7sus4, G7.'),
  practice: [
    cExs([cT('C', 'add9'), cT('F', 'add9'), cT('C', 'add9'), cT('G', 'sus4')], 'The sus vamp: Cadd9, Fadd9, Cadd9, Gsus4.', { range: W }),
    cExs([bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('D#', 'dim7'), bassCh('E', 'm7'), bassCh('F', 'maj7'), bassCh('G', '7')], 'The walk-up intro: Cmaj7 up to Fmaj7, then G7.')
  ],
  apply: { text: 'Choose a song you know, and write three intros for it, one of each kind. Play each for a friend and ask which one set the mood best.' },
  challenge: cExs([bassCh('F', 'maj7'), bassCh('D', 'm7'), bassCh('G', 'm7'), bassCh('C', '7sus4'), bassCh('C', '7')], 'Challenge: a turnaround intro in F: Fmaj7, Dm7, Gm7, C7sus4, C7, no hints.', { hints: false }),
  quiz: [
    q('Which intro ends on V7 so the verse feels like a resolution?', ['The turnaround intro', 'The plagal ending', 'The key change', 'Silence'], 0, 'V7 leads into the verse.'),
    q('A vamp is…', ['A short pattern repeated', 'A key change', 'A very fast run', 'A stop'], 0, 'It sets the groove and waits.'),
    q('What does G7sus4 before G7 do?', ['Delays the resolution', 'Changes the key', 'Makes it minor', 'Ends the song'], 0, 'The sus holds back the arrival.'),
    q('In a walk-up intro, the bass…', ['Rises by half steps', 'Falls', 'Stays still', 'Jumps randomly'], 0, 'A climb builds anticipation.')
  ]
});

H.push({
  id: 'g-endings', cat: 'Arranging', title: 'Endings', minutes: 13, req: ['g-walk-down', 'sus-chords'],
  why: 'The last chord is what people remember. A well-prepared ending feels inevitable and complete.',
  objective: 'Play four endings: the Amen, the bittersweet IV – iv – I, the big ♭VI – ♭VII – I, and the ii – V – I with 9ths.',
  theory: [
    'The Amen (plagal) ending: IV to I. F then C in the key of C. Gentle and settled.',
    'The bittersweet ending: IV – iv – I. F, then F minor, then C. The A in the F chord drops to A♭ and the final C lands with a sigh.',
    'The big finish: ♭VI – ♭VII – I. In C that is A♭, B♭, C. Strong and triumphant, borrowed from the minor key.',
    'The rich ending: Dm9 – G13 – Cmaj9, with a hold and a slow arpeggio. Add a tag by repeating the last line: I – IV – I. Slow the tempo as you approach the end, then let the last chord ring.'
  ],
  listen: [
    { label: 'Amen: F to C', spec: kchords([cT('F', 'major', { bass: true }), cT('C', 'major', { bass: true })], { d: 2 }) },
    { label: 'Bittersweet: F, Fm, C', spec: kchords([cT('F', 'major', { bass: true }), cT('F', 'minor', { bass: true }), cT('C', 'major', { bass: true })], { d: 2 }) },
    { label: 'Big finish: A♭, B♭, C', spec: kchords([cT('Ab', 'major', { bass: true }), cT('Bb', 'major', { bass: true }), cT('C', 'major', { bass: true })], { d: 1.6 }) }
  ],
  play: cExs([bassCh('F', 'major'), bassCh('F', 'minor'), bassCh('C', 'major')], 'The bittersweet ending: F, Fm, C.'),
  practice: [
    cExs([bassCh('Ab', 'major', { label: '♭VI' }), bassCh('Bb', 'major', { label: '♭VII' }), bassCh('C', 'major', { label: 'I' })], 'The big finish: A♭, B♭, C.'),
    cExs([cT('D', 'm9'), cT('G', '13'), cT('C', 'maj9')], 'The rich ending: Dm9, G13, Cmaj9.', { range: W })
  ],
  apply: { text: 'Decide your ending before the song starts. Choose one of these, count it in your head, and hold the last chord long enough for the sound to settle.' },
  challenge: cExs([bassCh('F', 'major'), bassCh('F', 'minor'), bassCh('Ab', 'major'), bassCh('Bb', 'major'), bassCh('C', 'major')], 'Challenge: IV, iv, ♭VI, ♭VII, I in C: F, Fm, A♭, B♭, C, no hints.', { hints: false }),
  quiz: [
    q('What is ♭VI – ♭VII – I in C?', ['A♭ B♭ C', 'A B C', 'D♭ E♭ C', 'F G C'], 0, 'The flat 6, flat 7 and 1.'),
    q('What is IV – iv – I in C?', ['F Fm C', 'F G C', 'Dm F C', 'C F C'], 0, 'F, F minor, C.'),
    q('A tag ending…', ['Repeats the last line, often I – IV – I', 'Drops a key', 'Adds a new verse', 'Is silence'], 0, 'It extends the final phrase.'),
    q('To make the last chord sweeter you can…', ['Add a colour tone such as the 6th or 9th', 'Play it as a diminished chord', 'Play it staccato', 'Change the key'], 0, 'C6, Cadd9 or Cmaj9 all feel complete.')
  ]
});

H.push({
  id: 'g-pedal', cat: 'Arranging', title: 'Pedal tones and transitions', minutes: 13, req: ['bass-movement', 'g-intros'],
  why: 'A held bass note under moving chords creates tension and release. It is the easiest way to build into a chorus or glide between sections.',
  objective: 'Hold a pedal bass note while the chords above it change, in C and F.',
  theory: [
    'A pedal tone is a bass note that stays the same while the chords above it change. In C, hold C in the bass and play C, F/C, Dm7/C, then C again. The bass never moves; the upper notes do all the work.',
    'F/C is an F chord with C in the bass (F major in second inversion: C F A). Dm7/C is Dm7 with C in the bass (third inversion: C D F A), which has the same notes as F6.',
    'A dominant pedal holds the 5th of the key: G in the bass in C. Chords above it: C/G, F/G, C/G. It creates growing tension that resolves when the bass finally steps to C.',
    'Use a pedal to build into a chorus, to connect two sections, or to hold the key steady under spoken ministry.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'C/G: C major with G in the bass (second inversion).', chord: { root: 'C', quality: 'major', oct: 4, inv: 2 } },
    { caption: 'F/C: F major with C in the bass.', chord: { root: 'F', quality: 'major', oct: 4, inv: 2 } }
  ] },
  listen: [
    { label: 'Tonic pedal: C, F/C, Dm7/C, C', spec: kchords([cT('C', 'major'), cT('F', 'major', { inv: 2 }), cT('D', 'm7', { inv: 3 }), cT('C', 'major')], { d: 1.8 }) },
    { label: 'Dominant pedal: C/G, F/G, C/G, G7', spec: kv([vc('a', ['G3', 'C4', 'E4']), vc('b', ['G2', 'F4', 'A4', 'C5']), vc('c', ['G3', 'C4', 'E4']), vc('d', ['G2', 'F4', 'B4', 'D5'])], 1.8) }
  ],
  play: cExs([cT('C', 'major'), cT('F', 'major', { inv: 2, label: 'F/C' }), cT('D', 'm7', { inv: 3, label: 'Dm7/C' }), cT('C', 'major')], 'Play C, F/C, Dm7/C, C. The bass note stays on C.', { range: W }),
  practice: [
    vEx([vc('C/G', ['G3', 'C4', 'E4']), vc('F/G', ['G2', 'F4', 'A4', 'C5']), vc('C/G', ['G3', 'C4', 'E4']), vc('G7', ['G2', 'F4', 'B4', 'D5'])], 'Dominant pedal: C/G, F/G, C/G, G7. The bass stays on G, then resolves.')
  ],
  apply: { text: 'Play a pedal under spoken ministry or a prayer. The held bass keeps the key present, and slow chord changes above it add movement without distracting.' },
  challenge: cExs([cT('F', 'major'), cT('Bb', 'major', { inv: 2, label: 'B♭/F' }), cT('G', 'm7', { inv: 3, label: 'Gm7/F' }), cT('F', 'major')], 'Challenge: a pedal on F: F, B♭/F, Gm7/F, F, no hints.', { hints: false, range: W }),
  quiz: [
    q('A pedal tone is…', ['A bass note held while the chords above it change', 'A foot pedal', 'A fast run', 'A key change'], 0, 'The bass stays put.'),
    q('What does F/C mean?', ['An F chord over a C bass', 'A C chord over an F bass', 'F7', 'F minor'], 0, 'The note after the slash is the bass.'),
    q('A dominant pedal builds…', ['Tension toward the I chord', 'Calm', 'A minor key', 'Silence'], 0, 'It resolves when the bass moves to I.'),
    q('Dm7/C has the same notes as…', ['F6', 'Cmaj7', 'Am7', 'Gm7'], 0, 'D F A C is F A C D.')
  ]
});

/* =========================== runs and fills =========================== */
H.push({
  id: 'g-runs', cat: 'Runs and fills', title: 'Runs: pentatonic and blues', minutes: 13, req: ['arpeggio-major', 'major-scale-formula'],
  why: 'A run is a quick, flowing line that connects one point to another. In gospel it is how a pianist answers a singer.',
  objective: 'Play major pentatonic and blues-scale runs up and down.',
  theory: [
    'A run is a fast scale-like line. Gospel runs usually use two scales. The major pentatonic uses the notes 1 2 3 5 6. In C: C D E G A. It has no notes that clash with a major chord, so it is safe and sweet.',
    'The blues scale adds colour: C E♭ F F♯ G B♭. The flat 3rd, the flat 5th ("blue note") and the flat 7th give the run a gritty, soulful edge.',
    'Play runs evenly and aim for a target, usually a chord tone of the chord underneath. A run that lands on E or G over a C chord always sounds right.',
    'Start slowly. Evenness matters more than speed. Speed arrives on its own.'
  ],
  visual: { range: SR, steps: [
    { caption: 'C major pentatonic: C D E G A.', hi: sc('C', 'majpent') },
    { caption: 'C blues scale: C E♭ F F♯ G B♭.', hi: sc('C', 'blues') }
  ] },
  listen: [
    { label: 'C major pentatonic', spec: { kind: 'notes', notes: sc('C', 'majpent'), d: 0.35 } },
    { label: 'C blues scale', spec: { kind: 'notes', notes: sc('C', 'blues'), d: 0.35 } }
  ],
  play: sEx(sc('C', 'majpent'), 'Play the C major pentatonic scale up one octave.'),
  practice: [
    sEx(rev(sc('C', 'majpent')), 'Now down: C A G E D C.'),
    sEx(sc('C', 'blues'), 'The C blues scale up: C E♭ F F♯ G B♭ C.')
  ],
  apply: { text: 'Over a held C chord, run up the pentatonic and land on G or E. Over a G7, run up the G blues scale. That is a gospel fill in its simplest form.' },
  challenge: sEx(['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4'], 'Challenge: C pentatonic up two notes past the octave and back down, no hints.', { hints: false, maxMiss: 3 }),
  quiz: [
    q('Which notes make the C major pentatonic?', ['C D E G A', 'C D E F G', 'C E♭ F G B♭', 'C D F G A'], 0, 'Scale degrees 1 2 3 5 6.'),
    q('What does the blues scale add?', ['A flat 3rd, a passing flat 5th and a flat 7th', 'Only major notes', 'The leading tone', 'A 9th'], 0, 'The blue notes.'),
    q('How many notes are in a pentatonic scale?', ['5', '7', '8', '12'], 0, 'Penta means five.'),
    q('What is a good target note for a run over a C chord?', ['E or G', 'F♯', 'B♭', 'D♭'], 0, 'A chord tone.')
  ]
});

H.push({
  id: 'g-fills', cat: 'Runs and fills', title: 'Fills between phrases', minutes: 13, req: ['g-runs', 'arpeggio-7ths'],
  why: 'A fill is the pianist\'s answer to the singer. It fills the space without taking it.',
  objective: 'Play short fills over C, F and G chords that land on chord tones.',
  theory: [
    'A fill is a short line you play in the gaps when the singer is not singing. It keeps the music moving, answers the vocal phrase and prepares the next one.',
    'Three rules. Play fills only in the gaps, never over the singer. Land on chord tones (1, 3 or 5 of the chord underneath). Keep them short and quiet, a bar or less.',
    'Build fills from the pentatonic and the chord arpeggio you already know. Over C: E G A G E D C. Over F: A C A G F G A. Over G: D B G A B D B G.',
    'Listen to the singer, leave space, then answer. A well-placed fill sounds like a conversation.'
  ],
  visual: { range: SR, steps: [
    { caption: 'A fill over C: E G A G E D C. It lands on the root.', hi: ['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4'] },
    { caption: 'A fill over F: A C A G F G A.', hi: ['A4', 'C5', 'A4', 'G4', 'F4', 'G4', 'A4'] }
  ] },
  listen: [
    { label: 'Fill over C', spec: { kind: 'notes', notes: ['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4'], d: 0.3 } },
    { label: 'Fill over F', spec: { kind: 'notes', notes: ['A4', 'C5', 'A4', 'G4', 'F4', 'G4', 'A4'], d: 0.3 } },
    { label: 'Fill over G', spec: { kind: 'notes', notes: ['D5', 'B4', 'G4', 'A4', 'B4', 'D5', 'B4', 'G4'], d: 0.3 } }
  ],
  play: sEx(['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4'], 'Play the fill over C: E G A G E D C.'),
  practice: [
    sEx(['A4', 'C5', 'A4', 'G4', 'F4', 'G4', 'A4'], 'The fill over F: A C A G F G A.'),
    sEx(['D5', 'B4', 'G4', 'A4', 'B4', 'D5', 'B4', 'G4'], 'The fill over G: D B G A B D B G.')
  ],
  apply: { text: 'Loop C – F – G – C in the Song Lab. Sing a line of any song in your head and play a fill in each gap. Aim for a chord tone each time.' },
  challenge: sEx(['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4', 'A4', 'C5', 'A4', 'G4', 'F4', 'G4', 'A4'], 'Challenge: the C fill, then the F fill, no hints.', { hints: false, maxMiss: 3 }),
  quiz: [
    q('Where do fills belong?', ['In the gaps between sung phrases', 'Over the singer', 'Nowhere', 'Only at the end'], 0, 'Answer, do not interrupt.'),
    q('A good fill lands on…', ['A chord tone', 'A random note', 'Only black keys', 'Always the 7th'], 0, 'Chord tones sound right.'),
    q('Fills should usually be…', ['Short and quiet', 'Loud and long', 'Always very fast', 'In a different key'], 0, 'Leave room for the singer.'),
    q('A fill over a C chord can end on…', ['C, E or G', 'F♯', 'B♭', 'D♭'], 0, 'The notes of the C triad.')
  ]
});

/* =========================== project =========================== */
H.push({
  id: 'g-capstone', cat: 'Project', title: 'Gospel harmony project: arrange a chorus', minutes: 20, req: ['g-substitution', 'g-voicing-251', 'g-modulation', 'g-endings', 'g-fills'],
  why: 'This is where you stop practising techniques and start making an arrangement. A complete chorus, with an intro, a verse, a lift and an ending.',
  objective: 'Play a complete arranged chorus in C: intro, verse, walk-up and ending.',
  theory: [
    'Here is the plan. Intro: Em7 – A7 – Dm7 – G7. Verse: Cmaj7 – C♯dim7 – Dm7 – G7 – Cmaj7 – Fmaj7 – Dm7 – G7sus4 – G7. Lift: the walk-up Cmaj7 up to Fmaj7. Ending: F – Fm – C.',
    'Each part uses something you have learned: the turnaround intro, a passing diminished chord, a secondary dominant in the intro, the walk-up to build, the bittersweet ending.',
    'Play it first with plain left-hand roots, then add voicings, fills in the gaps, and a tritone substitution if you like. Your arrangement is yours: change it until it sounds like you.',
    'When you have played it all the way through, play it in F, then in G. That is the test of a real arranger.'
  ],
  listen: [{ label: 'The verse with a groove', spec: { kind: 'prog', key: 'C', degs: [1, 2, 5, 1, 4, 2, 5], sevenths: true, style: 'groove', bpc: 4, bpm: 80 } }],
  play: cExs([bassCh('E', 'm7'), bassCh('A', '7'), bassCh('D', 'm7'), bassCh('G', '7')], 'The intro: Em7, A7, Dm7, G7.'),
  practice: [
    cExs([bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('G', '7'), bassCh('C', 'maj7'), bassCh('F', 'maj7'), bassCh('D', 'm7'), bassCh('G', '7sus4'), bassCh('G', '7')], 'The verse: Cmaj7, C♯dim7, Dm7, G7, Cmaj7, Fmaj7, Dm7, G7sus4, G7.'),
    cExs([bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('D#', 'dim7'), bassCh('E', 'm7'), bassCh('F', 'maj7')], 'The lift: the walk-up from Cmaj7 to Fmaj7.')
  ],
  apply: { text: 'Record yourself playing the whole arrangement, then listen back. Note where it feels smooth and where it needs work. That list is your practice plan for the week.' },
  challenge: cExs([bassCh('E', 'm7'), bassCh('A', '7'), bassCh('D', 'm7'), bassCh('G', '7'), bassCh('C', 'maj7'), bassCh('C#', 'dim7'), bassCh('D', 'm7'), bassCh('G', '7'), bassCh('C', 'maj7'), bassCh('F', 'major'), bassCh('F', 'minor'), bassCh('C', 'major')], 'Challenge: the intro, the first half of the verse, and the ending, straight through, no hints.', { hints: false }),
  quiz: [
    q('Which passing chord sits between Cmaj7 and Dm7?', ['C♯dim7', 'F♯dim7', 'A7', 'D♭7'], 0, 'C♯ is a half step below D.'),
    q('Which chord is the secondary dominant of Dm7?', ['A7', 'G7', 'E7', 'C7'], 0, 'A7 points to Dm7.'),
    q('What is the tritone substitution for G7?', ['D♭7', 'F7', 'A♭7', 'B7'], 0, 'D♭ is a tritone from G.'),
    q('Which ending adds a bittersweet turn?', ['IV – iv – I', 'I – V', 'ii – V', 'vi – IV'], 0, 'The minor iv sighs into the I.'),
    q('Which notes make the rootless Cmaj9 voicing?', ['E G B D', 'C E G B', 'F A C E', 'D F A C'], 0, '3rd, 5th, 7th and 9th.')
  ]
});

GH.modules = [
  { id: 'gh-move', level: 'H', title: 'Passing chords and chromatic movement', blurb: 'Passing diminished chords, secondary dominants, tritone substitution, walk-ups and reharmonization.', lessons: ['g-passing-dim', 'g-chromatic-approach', 'g-secondary-dominants', 'g-tritone-sub', 'g-walk-up', 'g-walk-down', 'g-substitution'] },
  { id: 'gh-voice', level: 'H', title: 'Gospel voicings', blurb: 'Open, closed, shell, rootless and quartal voicings, and a full ii – V – I.', lessons: ['g-closed-open', 'g-shell', 'g-rootless', 'g-quartal', 'g-voicing-251'] },
  { id: 'gh-form', level: 'H', title: 'Arranging', blurb: 'Colourful turnarounds, key changes, intros, endings and pedal tones.', lessons: ['g-turnarounds-adv', 'g-modulation', 'g-intros', 'g-endings', 'g-pedal'] },
  { id: 'gh-lines', level: 'H', title: 'Runs and fills', blurb: 'Pentatonic and blues runs, and fills between sung phrases.', lessons: ['g-runs', 'g-fills'] },
  { id: 'gh-project', level: 'H', title: 'Gospel harmony project', blurb: 'Arrange a complete chorus.', lessons: ['g-capstone'] }
];
LESSONS.push.apply(LESSONS, GH.lessons);
MODULES.push(...GH.modules);
LEVELS.push({ id: 'H', name: 'Gospel harmony', title: 'Gospel harmony', goal: 'Colour, move and arrange songs with passing chords, voicings, turnarounds, key changes, intros, endings and fills.' });

/* ===================== BATCH 4 · Worship and ministry =====================
   Accompanying singers, pads, building and releasing intensity, spontaneous worship,
   key changes, transitions, prayer, endings, following a leader, band work.
   Shares helpers from batches 2 and 3. */
const WS = { lessons: [], modules: [] };
const WL = WS.lessons;
const wPad = (name, notes, o) => vc(name, notes, o);

WL.push({
  id: 'w-pads', cat: 'Playing for worship', title: 'Sustained pad chords', minutes: 13, req: ['g-closed-open', 'comping-rhythms'],
  why: 'Worship piano is mostly about space. A held, warm chord under the singer is the most useful sound you can learn.',
  objective: 'Play a warm sustained voicing for I – V – vi – IV in C, with the bass low and the chord spread above it.',
  theory: [
    'A pad is a chord you hold or re-strike gently, so it supports the singer like a carpet. It does not play a rhythm; it provides a floor of harmony.',
    'Build it in two layers. The left hand plays the root and the 5th low and wide. The right hand plays the 3rd and one or two more notes in the middle, never above the melody.',
    'In C: C is C3 G3 then E4 G4. G is G2 D3 then B3 D4 G4. Am is A2 E3 then C4 E4. F is F2 C3 then A3 C4 F4. Notice the right hand stays in a narrow area, so the changes are small.',
    'Play softly. If the singer cannot hear their own voice, you are too loud.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'C pad: C and G in the left hand, E and G above.', hi: ['C3', 'G3', 'E4', 'G4'] },
    { caption: 'G pad: only a few notes move from the C pad.', hi: ['G2', 'D3', 'B3', 'D4', 'G4'] }
  ] },
  listen: [{ label: 'I – V – vi – IV as pads', spec: kv([vc('a', ['C3', 'G3', 'E4', 'G4']), vc('b', ['G2', 'D3', 'B3', 'D4', 'G4']), vc('c', ['A2', 'E3', 'C4', 'E4']), vc('d', ['F2', 'C3', 'A3', 'C4', 'F4'])], 2.6) }],
  play: vEx([wPad('C pad', ['C3', 'G3', 'E4', 'G4']), wPad('G pad', ['G2', 'D3', 'B3', 'D4', 'G4'])], 'Play the C pad, then the G pad.'),
  practice: [vEx([wPad('C', ['C3', 'G3', 'E4', 'G4']), wPad('G', ['G2', 'D3', 'B3', 'D4', 'G4']), wPad('Am', ['A2', 'E3', 'C4', 'E4']), wPad('F', ['F2', 'C3', 'A3', 'C4', 'F4'])], 'The full loop: C, G, Am, F. Play each softly and hold it.')],
  apply: { text: 'Play the loop with a slow pulse of four counts per chord. Hum a melody over it. If it feels peaceful rather than busy, the pad is working.' },
  challenge: vEx([wPad('F', ['F2', 'C3', 'A3', 'C4', 'F4']), wPad('C', ['C3', 'G3', 'E4', 'G4']), wPad('G', ['G2', 'D3', 'B3', 'D4', 'G4']), wPad('Am', ['A2', 'E3', 'C4', 'E4'])], 'Challenge: IV – I – V – vi: F, C, G, Am, no hints.', { hints: false }),
  quiz: [
    q('What is the job of a pad?', ['Support the singer with held harmony', 'Play the melody', 'Play fast fills', 'Replace the bass'], 0, 'It is a floor, not a feature.'),
    q('Where does the left hand play in a pad?', ['Root and 5th, low and wide', 'The melody', 'Only the 3rd', 'High and loud'], 0, 'Low and wide keeps it clear.'),
    q('How loud should a pad be?', ['Soft enough that the singer hears their own voice', 'As loud as possible', 'Silent', 'Louder than the band'], 0, 'Serve the voice.'),
    q('Why keep the right hand in a narrow area?', ['The chord changes then feel small and smooth', 'It is easier to see', 'It sounds louder', 'There is no reason'], 0, 'Small movement means smooth flow.')
  ]
});

WL.push({
  id: 'w-support', cat: 'Playing for worship', title: 'Supporting a singer', minutes: 13, req: ['w-pads', 'transpose-basic'],
  why: 'A singer needs the right key, a steady pulse and room to breathe. The pianist who gives those three things is a gift to the church.',
  objective: 'Play the same progression in G and D, ready to change key to suit the singer.',
  theory: [
    'The first job is the key. Every singer has a comfortable range. If the song is too high they strain; too low and they lose power. Ask, or listen, and be ready to move the song up or down.',
    'The second job is the pulse. Keep a steady tempo even when the singer slows down at the end of a line. Follow gently, never rush.',
    'The third job is space. Play less when the singer sings, and more in the gaps between lines. The melody belongs to the voice; do not double it loudly.',
    'Practise the I – V – vi – IV loop in several keys. Here: G (G D Em C) and D (D A Bm G). After this lesson you should be able to change keys without stopping.'
  ],
  listen: [
    { label: 'G, D, Em, C', spec: kchords([cT('G', 'major', { bass: true }), cT('D', 'major', { bass: true }), cT('E', 'minor', { bass: true }), cT('C', 'major', { bass: true })], { d: 1.6 }) },
    { label: 'D, A, Bm, G', spec: kchords([cT('D', 'major', { bass: true }), cT('A', 'major', { bass: true }), cT('B', 'minor', { bass: true }), cT('G', 'major', { bass: true })], { d: 1.6 }) }
  ],
  play: cExs([bassCh('G', 'major', { label: 'I' }), bassCh('D', 'major', { label: 'V' }), bassCh('E', 'minor', { label: 'vi' }), bassCh('C', 'major', { label: 'IV' })], 'Play the loop in G: G, D, Em, C.'),
  practice: [cExs([bassCh('D', 'major', { label: 'I' }), bassCh('A', 'major', { label: 'V' }), bassCh('B', 'minor', { label: 'vi' }), bassCh('G', 'major', { label: 'IV' })], 'Now the loop in D: D, A, Bm, G.', { range: [47, 72] })],
  apply: { text: 'Ask a singer to hum a note that feels comfortable, then choose the key where that note lands in the middle of the song. Try the loop in two keys and let them choose.' },
  challenge: cExs([bassCh('A', 'major'), bassCh('E', 'major'), bassCh('F#', 'minor'), bassCh('D', 'major')], 'Challenge: the loop in A: A, E, F♯m, D, no hints.', { hints: false, range: [45, 72] }),
  quiz: [
    q('What is the pianist\'s first job when supporting a singer?', ['Find a comfortable key', 'Play as fast as possible', 'Play the melody loudly', 'Add many notes'], 0, 'The wrong key makes everything harder.'),
    q('When the singer slows down, you should…', ['Follow gently and keep the pulse clear', 'Rush ahead', 'Stop playing', 'Change key'], 0, 'Stay with them.'),
    q('When do you play more notes?', ['In the gaps between sung lines', 'Under the loudest words', 'Never', 'Only at the end'], 0, 'Answer, do not compete.'),
    q('What are the chords of I – V – vi – IV in D?', ['D A Bm G', 'D G A Bm', 'D E F G', 'D A G Bm'], 0, 'D, A, B minor, G.')
  ]
});

WL.push({
  id: 'w-build', cat: 'Playing for worship', title: 'Building and releasing intensity', minutes: 14, req: ['w-pads'],
  why: 'A worship set has a shape. You rise, you hold, you come down. The pianist can create that shape without changing a single chord.',
  objective: 'Play one chord three ways, soft, medium and full, to build intensity.',
  theory: [
    'Intensity comes from four things: volume, register, thickness and rhythm. You can raise any of them without changing the chord.',
    'Soft: a simple triad in the middle of the keyboard. Medium: add the low root and 5th and double the top note. Full: add octaves in the bass, spread the right hand wide and play with weight.',
    'In C: soft is C4 E4 G4. Medium is C3 G3 C4 E4 G4. Full is C2 C3 G3 C4 E4 G4 C5, with the bass an octave doubled and the top an octave higher.',
    'To release, do it in reverse: drop the octave in the bass, thin out the right hand, play softer. A song that only builds becomes tiring. Let it breathe.'
  ],
  visual: { range: [24, 84], steps: [
    { caption: 'Soft: a plain triad.', hi: ['C4', 'E4', 'G4'] },
    { caption: 'Medium: root and 5th low, chord above.', hi: ['C3', 'G3', 'C4', 'E4', 'G4'] },
    { caption: 'Full: octave bass and a wide right hand.', hi: ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'] }
  ] },
  listen: [{ label: 'Soft, medium, full', spec: kv([vc('a', ['C4', 'E4', 'G4']), vc('b', ['C3', 'G3', 'C4', 'E4', 'G4']), vc('c', ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'])], 2.4) }],
  play: vEx([wPad('Soft', ['C4', 'E4', 'G4']), wPad('Medium', ['C3', 'G3', 'C4', 'E4', 'G4']), wPad('Full', ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'])], 'Build one chord: soft, medium, full.', { range: [36, 84] }),
  practice: [vEx([wPad('F soft', ['F4', 'A4', 'C5']), wPad('F medium', ['F2', 'C3', 'F4', 'A4', 'C5']), wPad('F full', ['F2', 'F3', 'C4', 'F4', 'A4', 'C5', 'F5'])], 'The same build on F: soft, medium, full.', { range: [36, 84] })],
  apply: { text: 'Play your loop four times: soft, medium, full, then back to medium. Hear the shape. Plan the shape of a song before you play it.' },
  challenge: vEx([wPad('G soft', ['G3', 'B3', 'D4']), wPad('G medium', ['G2', 'D3', 'G3', 'B3', 'D4']), wPad('G full', ['G2', 'G3', 'D4', 'G4', 'B4', 'D5'])], 'Challenge: build G: soft, medium, full, no hints.', { hints: false, range: [36, 84] }),
  quiz: [
    q('Which is NOT a way to build intensity?', ['Changing the key signature on the page', 'Playing louder', 'Using a wider register', 'Adding octaves in the bass'], 0, 'The other three all raise intensity.'),
    q('What does a full voicing usually add?', ['Octave bass and a wider right hand', 'Nothing', 'A sharp', 'Silence'], 0, 'Weight and spread.'),
    q('A song that only builds…', ['Becomes tiring', 'Is always best', 'Needs no ending', 'Changes key'], 0, 'Release matters too.'),
    q('How do you release the intensity?', ['Reverse the build: thinner, softer', 'Add more notes', 'Play faster', 'Stop suddenly'], 0, 'Let it breathe.')
  ]
});

WL.push({
  id: 'w-sus-lift', cat: 'Playing for worship', title: 'Sus chords and the lift', minutes: 12, req: ['w-pads', 'sus-chords'],
  why: 'Sus chords hang in the air. Resolving them at the right moment creates the feeling of a prayer being answered.',
  objective: 'Play sus2 and sus4 chords and resolve each to a major chord.',
  theory: [
    'A suspended chord replaces the 3rd with the 2nd (sus2) or the 4th (sus4). Without the 3rd it is neither major nor minor, so it sounds open and waiting.',
    'Resolving a sus4 to major is a small step: the 4th drops by a half step to the 3rd. Csus4 (C F G) resolves to C (C E G). Gsus4 resolves to G.',
    'Use the sus as a held moment: stay on Csus4 while the leader prays, or while the singer holds a long note, then let it fall to the major chord at the end of the phrase.',
    'Do not overuse it. The resolution only feels special if you made the listener wait.'
  ],
  listen: [
    { label: 'Csus4 to C', spec: kchords([cT('C', 'sus4', { bass: true }), cT('C', 'major', { bass: true })], { d: 2 }) },
    { label: 'Gsus2 to G', spec: kchords([cT('G', 'sus2', { bass: true }), cT('G', 'major', { bass: true })], { d: 2 }) }
  ],
  play: cExs([bassCh('C', 'sus4'), bassCh('C', 'major'), bassCh('F', 'sus4'), bassCh('F', 'major')], 'Play Csus4 to C, then Fsus4 to F.'),
  practice: [cExs([bassCh('G', 'sus2'), bassCh('G', 'major'), bassCh('D', 'sus4'), bassCh('D', 'major')], 'Gsus2 to G, then Dsus4 to D.')],
  apply: { text: 'Play your loop and turn the last chord of each line into a sus that resolves on the next downbeat. Try it under a long held note.' },
  challenge: cExs([bassCh('C', 'sus2'), bassCh('C', 'major'), bassCh('G', 'sus4'), bassCh('G', 'major'), bassCh('A', 'sus4'), bassCh('A', 'minor')], 'Challenge: Csus2, C, Gsus4, G, Asus4, Am, no hints.', { hints: false }),
  quiz: [
    q('A sus4 chord replaces the 3rd with…', ['The 4th', 'The 2nd', 'The 7th', 'The 9th'], 0, 'C F G.'),
    q('How does sus4 resolve to major?', ['The 4th falls to the 3rd', 'The root rises', 'The 5th falls', 'It cannot'], 0, 'F falls to E in C.'),
    q('Why do sus chords feel open?', ['They have no 3rd, so neither major nor minor', 'They are loud', 'They are always high', 'They have extra bass'], 0, 'The 3rd defines the quality.'),
    q('When is the best time to resolve a sus?', ['At the end of a phrase or held note', 'Immediately every time', 'Never', 'In the middle of a word'], 0, 'Make them wait, then answer.')
  ]
});

WL.push({
  id: 'w-spontaneous', cat: 'Flow', title: 'Spontaneous worship and vamps', minutes: 14, req: ['w-sus-lift', 'w-build'],
  why: 'Some of the best moments in worship are unplanned. A short loop gives you a safe base to follow the Spirit and the room.',
  objective: 'Hold a two-, three- or four-chord vamp and move between them smoothly.',
  theory: [
    'A vamp is a short loop that repeats for as long as needed. Because it repeats, you can stop thinking about chords and listen. The vamp gives the leader and the singers a floor to stand on.',
    'Common vamps in G: I – IV (G, C), I – V (G, D), I – IV – V (G, C, D) and vi – IV – I – V (Em, C, G, D).',
    'Within a vamp, change one thing at a time: the volume, the register, a bass walk or a fill. Never change everything together.',
    'Spontaneous does not mean careless. The best spontaneous playing is prepared playing: you know your keys, your loops and your sus resolutions so well that you can respond without fear.'
  ],
  listen: [
    { label: 'I – IV vamp in G', spec: kchords([cT('G', 'add9', { bass: true }), cT('C', 'add9', { bass: true }), cT('G', 'add9', { bass: true }), cT('C', 'add9', { bass: true })], { d: 1.8 }) },
    { label: 'vi – IV – I – V in G', spec: kchords([cT('E', 'minor', { bass: true }), cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('D', 'major', { bass: true })], { d: 1.6 }) }
  ],
  play: cExs([bassCh('G', 'add9'), bassCh('C', 'add9'), bassCh('G', 'add9'), bassCh('C', 'add9')], 'Play the two-chord vamp: Gadd9, Cadd9, twice.'),
  practice: [cExs([bassCh('E', 'minor'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('D', 'major')], 'The four-chord vamp: Em, C, G, D.')],
  apply: { text: 'Pick one of these loops and play it for two full minutes, changing only one thing at a time: first the volume, then the register, then add a fill. Notice how the room responds.' },
  challenge: cExs([bassCh('G', 'major'), bassCh('C', 'major'), bassCh('D', 'major'), bassCh('G', 'major'), bassCh('E', 'minor'), bassCh('C', 'major'), bassCh('D', 'major'), bassCh('G', 'major')], 'Challenge: I – IV – V – I, then vi – IV – V – I in G, no hints.', { hints: false }),
  quiz: [
    q('A vamp is…', ['A short loop repeated as long as needed', 'A key change', 'A final chord', 'A fast run'], 0, 'It gives everyone a floor.'),
    q('While vamping, you should change…', ['One thing at a time', 'Everything together', 'Nothing ever', 'Only the key'], 0, 'Volume, register or a fill.'),
    q('What makes spontaneous playing good?', ['Preparation: knowing loops and keys', 'Playing without thinking', 'Playing loudly', 'Never repeating'], 0, 'Prepared players can respond.'),
    q('Which is a vi – IV – I – V in G?', ['Em C G D', 'G C D G', 'Am F C G', 'G D Em C'], 0, 'vi is E minor.')
  ]
});

WL.push({
  id: 'w-modulate', cat: 'Flow', title: 'Key changes during worship', minutes: 13, req: ['w-spontaneous', 'g-modulation'],
  why: 'Lifting the key at the right moment brings a fresh wave of energy. In worship it often happens live, without a rehearsal.',
  objective: 'Lift a vamp up a whole step or half step with a V7 pivot, in G, F and C.',
  theory: [
    'You already know the pivot: play the V7 of the new key and land on its I. G up a whole step to A: G, E7, A (E7 is V7 of A). F up a whole step to G: F, D7, G. C up a whole step to D: C, A7, D.',
    'To lift a half step: G to A♭ uses E♭7 (the V7 of A♭). C to D♭ uses A♭7.',
    'In worship the timing matters. Change key at the start of a line, on the strong beat, and signal the lift with a short build. A last-chorus lift should feel like an arrival.',
    'Tell your worship leader. A key change that surprises the singers is dangerous. Agree the plan, or watch for the cue.'
  ],
  listen: [
    { label: 'G up to A', spec: kchords([cT('G', 'major', { bass: true }), cT('E', '7', { bass: true }), cT('A', 'major', { bass: true })], { d: 1.8 }) },
    { label: 'G up to A♭', spec: kchords([cT('G', 'major', { bass: true }), cT('Eb', '7', { bass: true }), cT('Ab', 'major', { bass: true })], { d: 1.8 }) }
  ],
  play: cExs([bassCh('G', 'major', { label: 'old I' }), bassCh('E', '7', { label: 'V7 of A' }), bassCh('A', 'major', { label: 'new I' })], 'Play G, E7, A.', { range: [45, 72] }),
  practice: [
    cExs([bassCh('F', 'major'), bassCh('D', '7'), bassCh('G', 'major')], 'F up to G: F, D7, G.'),
    cExs([bassCh('G', 'major'), bassCh('Eb', '7'), bassCh('Ab', 'major')], 'A half step up: G, E♭7, A♭.')
  ],
  apply: { text: 'Take your four-chord vamp and play it in G. After the second pass, play E7 and move to the same vamp in A. Repeat it from F to G. Listen for the lift.' },
  challenge: cExs([bassCh('C', 'major'), bassCh('A', '7'), bassCh('D', 'major'), bassCh('B', '7'), bassCh('E', 'major')], 'Challenge: C, A7, D, B7, E: two lifts in a row, no hints.', { hints: false, range: [47, 72] }),
  quiz: [
    q('What pivots G up to A?', ['E7', 'D7', 'A7', 'C7'], 0, 'E7 is V7 of A.'),
    q('What pivots F up to G?', ['D7', 'G7', 'C7', 'A7'], 0, 'D7 is V7 of G.'),
    q('When should a key change happen?', ['At the start of a line, on a strong beat', 'In the middle of a word', 'During silence only', 'Never'], 0, 'Clear timing, clear signal.'),
    q('Why talk to the worship leader first?', ['A surprise key change can throw the singers', 'It is a rule of music', 'To avoid practice', 'No reason'], 0, 'Agree a plan.')
  ]
});

WL.push({
  id: 'w-transitions', cat: 'Flow', title: 'Transitions between songs', minutes: 13, req: ['w-modulate', 'g-pedal'],
  why: 'Silence between songs breaks the moment. A short instrumental bridge keeps the room together.',
  objective: 'Move from one song\'s final chord to the next song\'s opening chord with a pivot or a held pedal.',
  theory: [
    'Look for a chord the two songs share. G is the I of one song in G and the IV of a song in D. Land on G, then slide to D. In C: F is IV of C, and I of F.',
    'A pedal tone helps. Hold the shared note in the bass while the chords above change, as in the pedal tones lesson: C/G, F/G, then move.',
    'If the songs are far apart in key, use a V7 pivot to the new key (as in key changes), or hold a sus chord and wait for the new key to be named.',
    'Keep the tempo of the new song in your head. A transition is not music for itself, it is a bridge to the next song.'
  ],
  listen: [{ label: 'C, G, D: G is the pivot', spec: kchords([cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('D', 'major', { bass: true })], { d: 1.8 }) }],
  play: cExs([bassCh('C', 'major', { label: 'song 1' }), bassCh('G', 'major', { label: 'pivot' }), bassCh('D', 'major', { label: 'song 2' })], 'Play C, G, D: G pivots from C into D.'),
  practice: [cExs([bassCh('F', 'major', { label: 'song 1' }), bassCh('C', 'major', { label: 'pivot' }), bassCh('G', 'major', { label: 'song 2' })], 'F, C, G: C pivots from F into G.')],
  apply: { text: 'Choose two songs you know in different keys. Find the chord they share, play it, and move into the second song without stopping.' },
  challenge: cExs([bassCh('D', 'major'), bassCh('A', 'major'), bassCh('E', 'major')], 'Challenge: D, A, E: A pivots from D into E, no hints.', { hints: false, range: [45, 72] }),
  quiz: [
    q('A pivot chord is…', ['A chord both keys share', 'A chord with no notes', 'A drum fill', 'A key signature'], 0, 'It connects the two songs.'),
    q('G is the I of G and the … of D.', ['IV', 'V', 'ii', 'vii'], 0, 'G is the fourth note of D.'),
    q('What does a pedal tone offer in a transition?', ['A steady anchor while chords change', 'A faster tempo', 'A louder sound', 'A new key'], 0, 'The held bass keeps things connected.'),
    q('Why keep the next tempo in mind?', ['The transition leads into it', 'It is a rule', 'To confuse people', 'No reason'], 0, 'A bridge points to the destination.')
  ]
});

WL.push({
  id: 'w-prayer', cat: 'Ministry', title: 'Playing under prayer and spoken ministry', minutes: 12, req: ['w-sus-lift', 'g-pedal'],
  why: 'Underneath a prayer or a spoken word, the pianist helps the room feel safe and still. The goal is not to be noticed but to hold the atmosphere.',
  objective: 'Play a soft, slow, spacious chord bed under spoken words.',
  theory: [
    'Stay soft and slow. Use the middle of the keyboard, avoid high bright notes and low rumbling notes, and avoid any melody that could compete with the speaker.',
    'Use one or two chords and let them ring. A tonic pad with a slow move to IV and back is enough: C, F/C, C. Add a sus or a 9th for colour.',
    'Change when the speaker pauses, never in the middle of a sentence. Silence is a part of the music.',
    'If the speaker begins a song or a clear cue, be ready. Otherwise, stay out of the way.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'A soft Cadd9 bed in the middle of the keyboard.', hi: ['C3', 'G3', 'D4', 'E4', 'G4'] },
    { caption: 'F over C: the same bass note, a change of colour.', hi: ['C3', 'F3', 'A3', 'C4', 'F4'] }
  ] },
  listen: [{ label: 'A bed: Cadd9, F/C, Cadd9', spec: kv([vc('a', ['C3', 'G3', 'D4', 'E4', 'G4']), vc('b', ['C3', 'F3', 'A3', 'C4', 'F4']), vc('c', ['C3', 'G3', 'D4', 'E4', 'G4'])], 3) }],
  play: vEx([wPad('Cadd9', ['C3', 'G3', 'D4', 'E4', 'G4']), wPad('F/C', ['C3', 'F3', 'A3', 'C4', 'F4']), wPad('Cadd9', ['C3', 'G3', 'D4', 'E4', 'G4'])], 'Play Cadd9, then F over C, then Cadd9. Slowly.'),
  practice: [vEx([wPad('Gadd9', ['G2', 'D3', 'A3', 'B3', 'D4']), wPad('C/G', ['G2', 'C3', 'E3', 'G3', 'C4']), wPad('Gadd9', ['G2', 'D3', 'A3', 'B3', 'D4'])], 'The same bed in G: Gadd9, C over G, Gadd9.')],
  apply: { text: 'Ask a friend to read a short Bible passage aloud. Play a bed underneath and change only during pauses. Ask afterwards: could you hear me?' },
  challenge: vEx([wPad('Dadd9', ['D3', 'A3', 'E4', 'F#4', 'A4']), wPad('G/D', ['D3', 'G3', 'B3', 'D4', 'G4']), wPad('Dadd9', ['D3', 'A3', 'E4', 'F#4', 'A4'])], 'Challenge: the bed in D: Dadd9, G over D, Dadd9, no hints.', { hints: false }),
  quiz: [
    q('Under spoken ministry, you should play…', ['Soft, slow and spacious', 'Loud and fast', 'A melody on top', 'As many notes as possible'], 0, 'Support the voice.'),
    q('When do you change the chord?', ['During a pause in the speaker\'s words', 'In the middle of a sentence', 'Every beat', 'Never'], 0, 'Silence is part of the music.'),
    q('Which register is best?', ['The middle of the keyboard', 'Very high', 'Very low', 'Everywhere'], 0, 'Avoid bright highs and rumbling lows.'),
    q('How many chords do you need?', ['One or two', 'Twelve', 'None', 'A key change'], 0, 'Less is more.')
  ]
});

WL.push({
  id: 'w-endings', cat: 'Ministry', title: 'Ending worship songs', minutes: 12, req: ['w-sus-lift', 'g-endings'],
  why: 'The ending sets the tone for what comes next: prayer, a message or a moment of silence. A clean ending respects that moment.',
  objective: 'End a song three ways: a held tonic, a plagal Amen and a sus-to-major tag.',
  theory: [
    'Held tonic: land on the I chord, hold it with the pedal, and let it fade. Add the 9th for a warm sound: Cadd9.',
    'Plagal Amen: IV to I. F to C. Gentle and settled, ideal after a quiet song.',
    'Sus tag: repeat the last line, then hold Csus4 and resolve to C on the last beat. It feels like a final prayer.',
    'Decide the ending with the leader before the song. In the moment, watch for the cue, slow gently and hold the last chord until the leader lets go.'
  ],
  listen: [
    { label: 'Amen: F to C', spec: kchords([cT('F', 'add9', { bass: true }), cT('C', 'add9', { bass: true })], { d: 2.4 }) },
    { label: 'Sus tag: Csus4 to C', spec: kchords([cT('C', 'sus4', { bass: true }), cT('C', 'add9', { bass: true })], { d: 2.4 }) }
  ],
  play: cExs([bassCh('F', 'add9'), bassCh('C', 'add9')], 'The Amen: Fadd9 to Cadd9.'),
  practice: [cExs([bassCh('C', 'sus4'), bassCh('C', 'add9')], 'The sus tag: Csus4 to Cadd9.'), cExs([bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('C', 'sus4'), bassCh('C', 'major')], 'A full ending: C, F, C, Csus4, C.')],
  apply: { text: 'Take a song and write down its ending before you play it. Then practise holding the last chord for a count of eight without rushing out of it.' },
  challenge: cExs([bassCh('G', 'major'), bassCh('C', 'add9'), bassCh('G', 'sus4'), bassCh('G', 'add9')], 'Challenge: in G: G, Cadd9, Gsus4, Gadd9, no hints.', { hints: false }),
  quiz: [
    q('What is a plagal Amen ending?', ['IV to I', 'V to I', 'ii to V', 'vi to IV'], 0, 'F to C in C.'),
    q('What is a sus tag?', ['Holding a sus4 and resolving on the last beat', 'A fast run', 'A key change', 'A drum fill'], 0, 'The resolution feels like a final prayer.'),
    q('Who decides the ending?', ['You and the leader, before the song', 'Nobody', 'The audience', 'The drummer alone'], 0, 'Agree the plan.'),
    q('How long should you hold the last chord?', ['Until the leader releases it', 'One beat', 'Never hold', 'Ten minutes'], 0, 'Respect the moment.')
  ]
});

WL.push({
  id: 'w-follow', cat: 'Leading and the band', title: 'Following a worship leader', minutes: 13, req: ['w-support', 'w-spontaneous'],
  why: 'Worship is led from the front. The pianist who listens well is worth more than the one who plays well.',
  objective: 'Find a key by ear, follow a leader\'s tempo, and switch keys quickly.',
  theory: [
    'Listen first, play second. The leader sets the key, the tempo and the mood. In the first four bars, find the key by ear: hum the first sung note, find it on the piano, and test whether it is I, III or V.',
    'Keep eye contact when you can. Look for a nod, a raised hand or a gesture. Agree beforehand what each means: repeat, slow, last time, stop.',
    'If the leader changes the plan, follow without comment. Go to a safe chord (the I of the current key) and wait for the new direction.',
    'Practise by ear: play the progression in a key you did not choose. The ear-training Practice section builds this skill.'
  ],
  listen: [{ label: 'The same loop in G, then A, then F', spec: kchords([cT('G', 'major'), cT('D', 'major'), cT('A', 'major'), cT('E', 'major'), cT('F', 'major'), cT('C', 'major')], { d: 1.3 }) }],
  play: cExs([bassCh('G', 'major'), bassCh('D', 'major'), bassCh('E', 'minor'), bassCh('C', 'major')], 'Play G, D, Em, C.'),
  practice: [
    cExs([bassCh('A', 'major'), bassCh('E', 'major'), bassCh('F#', 'minor'), bassCh('D', 'major')], 'Now in A: A, E, F♯m, D.', { range: [45, 72] }),
    cExs([bassCh('F', 'major'), bassCh('C', 'major'), bassCh('D', 'minor'), bassCh('Bb', 'major')], 'And in F: F, C, Dm, B♭.')
  ],
  apply: { text: 'Ask a friend to play a note on any instrument and say "I am singing in this key". Find the key in under ten seconds, then play the I – V – vi – IV loop.' },
  challenge: cExs([bassCh('Bb', 'major'), bassCh('F', 'major'), bassCh('G', 'minor'), bassCh('Eb', 'major')], 'Challenge: the loop in B♭: B♭, F, Gm, E♭, no hints.', { hints: false }),
  quiz: [
    q('What should you do first when a leader starts?', ['Listen and find the key', 'Play as loudly as possible', 'Change key', 'Close your eyes'], 0, 'Listen first.'),
    q('If the leader changes the plan, you…', ['Follow, going to a safe chord if needed', 'Argue', 'Stop playing', 'Play louder'], 0, 'Stay with them.'),
    q('Why agree on signals beforehand?', ['So hand gestures have clear meaning', 'To avoid practice', 'To be quiet', 'No reason'], 0, 'Repeat, slow, last time, stop.'),
    q('What are the chords of I – V – vi – IV in F?', ['F C Dm B♭', 'F B♭ C Dm', 'F G A B♭', 'F C D B♭'], 0, 'F, C, D minor, B♭.')
  ]
});

WL.push({
  id: 'w-band', cat: 'Leading and the band', title: 'Working with a band', minutes: 14, req: ['w-follow', 'g-rootless'],
  why: 'In a band the piano is one voice among many. Knowing when to step back is what makes a band sound like one instrument.',
  objective: 'Play light right-hand voicings that leave room for the bass and guitar.',
  theory: [
    'The bass plays the roots, so you can leave them out. Play the rootless voicings from the gospel voicings lessons in the middle of the keyboard. Your sound will fit instead of crowding.',
    'Divide the frequency range. Bass: low. Guitar: middle. Piano: middle to high, but not all the way up. Leave the very low notes to the bassist and the very high notes to the vocals.',
    'Match the drummer. Play with the pulse, not on top of it. In quieter sections, play long notes; in the chorus, play rhythm.',
    'Listen more than you play. If you cannot hear the bass, you are too loud. A great band is made by what each player leaves out.'
  ],
  visual: { range: [48, 84], steps: [
    { caption: 'Rootless Cmaj9 for a band: E G B D.', hi: ['E4', 'G4', 'B4', 'D5'] },
    { caption: 'Rootless Fmaj9: A C E G.', hi: ['A3', 'C4', 'E4', 'G4'] }
  ] },
  listen: [{ label: 'Light band voicings: Cmaj9, Fmaj9, Dm9, G13', spec: kv([vc('a', ['E4', 'G4', 'B4', 'D5']), vc('b', ['A3', 'C4', 'E4', 'G4']), vc('c', ['F4', 'A4', 'C5', 'E5']), vc('d', ['F4', 'A4', 'B4', 'E5'])], 2) }],
  play: vEx([wPad('Cmaj9', ['E4', 'G4', 'B4', 'D5'], { low: false }), wPad('Fmaj9', ['A3', 'C4', 'E4', 'G4'], { low: false })], 'Play the light voicings: Cmaj9, then Fmaj9.', { range: [48, 84] }),
  practice: [vEx([wPad('Dm9', ['F4', 'A4', 'C5', 'E5'], { low: false }), wPad('G13', ['F4', 'A4', 'B4', 'E5'], { low: false }), wPad('Cmaj9', ['E4', 'G4', 'B4', 'D5'], { low: false })], 'Dm9, G13, Cmaj9, with no bass note.', { range: [48, 84] })],
  apply: { text: 'Play along with a recording that has bass. If you can hear the bass clearly underneath you, your voicings leave the right space.' },
  challenge: vEx([wPad('Am9', ['C4', 'E4', 'G4', 'B4'], { low: false }), wPad('Dm9', ['F4', 'A4', 'C5', 'E5'], { low: false }), wPad('G13', ['F4', 'A4', 'B4', 'E5'], { low: false }), wPad('Cmaj9', ['E4', 'G4', 'B4', 'D5'], { low: false })], 'Challenge: vi – ii – V – I in C: Am9, Dm9, G13, Cmaj9 as band voicings, no hints.', { hints: false, range: [48, 84] }),
  quiz: [
    q('Why leave out the root in a band?', ['The bass plays it', 'The root is wrong', 'It is too hard', 'It is a black key'], 0, 'Avoid crowding.'),
    q('If you cannot hear the bass, you are…', ['Too loud', 'Too quiet', 'In the wrong key', 'Perfect'], 0, 'Listen and adjust.'),
    q('Which range should the piano avoid?', ['Very low and very high', 'The middle', 'Only black keys', 'None'], 0, 'Leave room for others.'),
    q('In a quiet section, the piano should play…', ['Long, sustained notes', 'Fast runs', 'Loud chords', 'Nothing ever'], 0, 'Match the section.')
  ]
});

WL.push({
  id: 'w-capstone', cat: 'Project', title: 'Worship project: lead a short set', minutes: 20, req: ['w-support', 'w-build', 'w-modulate', 'w-prayer', 'w-endings', 'w-band'],
  why: 'This brings everything together: a complete short worship moment with a beginning, a build, a lift, a quiet moment and an ending.',
  objective: 'Play a complete worship moment in G: pad, build, lift to A, then a quiet ending.',
  theory: [
    'Plan. Open with a pad on G: Gadd9. Play the vamp G, D, Em, C for the first verse, soft. Build: repeat it with octaves in the bass and a wider right hand. Lift: G, E7, A to move up a whole step. Repeat the vamp in A: A, E, F♯m, D. Ending: hold Asus4, then resolve to A.',
    'Each step uses something you have learned: pads, the I – V – vi – IV vamp, building intensity, a V7 pivot, and a sus tag.',
    'Practise until you can play it without looking. Then change one thing: a different key, or a different order. That is what live worship asks.',
    'Record it and listen back. Ask: did it sound like the room could pray over it?'
  ],
  listen: [{ label: 'The set: G vamp, lift to A', spec: kchords([cT('G', 'major', { bass: true }), cT('D', 'major', { bass: true }), cT('E', 'minor', { bass: true }), cT('C', 'major', { bass: true }), cT('E', '7', { bass: true }), cT('A', 'major', { bass: true }), cT('E', 'major', { bass: true }), cT('F#', 'minor', { bass: true }), cT('D', 'major', { bass: true })], { d: 1.2 }) }],
  play: cExs([bassCh('G', 'major'), bassCh('D', 'major'), bassCh('E', 'minor'), bassCh('C', 'major')], 'Part 1: the vamp in G: G, D, Em, C.'),
  practice: [
    cExs([bassCh('G', 'major'), bassCh('E', '7'), bassCh('A', 'major')], 'Part 2: the lift: G, E7, A.', { range: [45, 72] }),
    cExs([bassCh('A', 'major'), bassCh('E', 'major'), bassCh('F#', 'minor'), bassCh('D', 'major'), bassCh('A', 'sus4'), bassCh('A', 'major')], 'Part 3: the vamp in A and a sus tag: A, E, F♯m, D, Asus4, A.', { range: [45, 72] })
  ],
  apply: { text: 'Play the whole set from beginning to end three times without stopping. Each time, change one thing: the volume, the register or the order. Then play it for a friend.' },
  challenge: cExs([bassCh('G', 'major'), bassCh('D', 'major'), bassCh('E', 'minor'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('E', '7'), bassCh('A', 'major'), bassCh('E', 'major'), bassCh('F#', 'minor'), bassCh('D', 'major'), bassCh('A', 'sus4'), bassCh('A', 'major')], 'Challenge: the whole set in one go, no hints.', { hints: false, range: [45, 72] }),
  quiz: [
    q('What lifts G up to A smoothly?', ['E7', 'D7', 'C7', 'F7'], 0, 'E7 is V7 of A.'),
    q('How do you build intensity without changing chords?', ['Volume, register, thickness, rhythm', 'Change key', 'Stop', 'Slow down'], 0, 'Four ways to raise it.'),
    q('How do you end quietly?', ['A sus tag or held tonic', 'A fast run', 'A key change', 'Silence in the middle'], 0, 'Let the room settle.'),
    q('What should the set sound like?', ['One shaped moment, not a list of chords', 'A technical exercise', 'A solo', 'A random loop'], 0, 'It has a beginning, a middle and an end.')
  ]
});

WS.modules = [
  { id: 'w-play', level: 'W', title: 'Playing for worship', blurb: 'Pads, supporting a singer, building intensity and the sus lift.', lessons: ['w-pads', 'w-support', 'w-build', 'w-sus-lift'] },
  { id: 'w-flow', level: 'W', title: 'Flow', blurb: 'Vamps, key changes and transitions between songs.', lessons: ['w-spontaneous', 'w-modulate', 'w-transitions'] },
  { id: 'w-min', level: 'W', title: 'Ministry', blurb: 'Playing under prayer and ending songs well.', lessons: ['w-prayer', 'w-endings'] },
  { id: 'w-band', level: 'W', title: 'Leading and the band', blurb: 'Following a leader and working with a band.', lessons: ['w-follow', 'w-band'] },
  { id: 'w-project', level: 'W', title: 'Worship project', blurb: 'Play a complete short worship moment.', lessons: ['w-capstone'] }
];
LESSONS.push.apply(LESSONS, WS.lessons);
MODULES.push(...WS.modules);
LEVELS.push({ id: 'W', name: 'Worship and ministry', title: 'Worship and ministry', goal: 'Accompany a live worship session: support a singer, build and release intensity, lift the key, follow a leader and work with a band.' });

/* ===================== BATCH 5 · Songwriting =====================
   Ideas, lyrics, progressions, melody, structure, call and response, harmony,
   gospel song forms, arrangement and a complete-song project. Shares helpers from batches 2 and 3. */
const SG = { lessons: [], modules: [] };
const SL = SG.lessons;
const mel = (notes, prompt, o) => sEx(notes, prompt, Object.assign({ range: [60, 84] }, o || {}));

SL.push({
  id: 's-ideas', cat: 'Starting a song', title: 'Finding song ideas and themes', minutes: 12, req: ['progs-keys', 'w-spontaneous'],
  why: 'Every good song starts with one clear idea. When you have the idea, the lyrics, melody and chords have somewhere to go.',
  objective: 'Choose a theme, write it as one sentence, and capture a first chord sketch.',
  theory: [
    'A song is about one thing. Ask: what do I want the listener to feel or believe when the song ends? "God is faithful." "I will not be afraid." "Come, Lord, and fill this place." That sentence is your theme, and every line should serve it.',
    'Where ideas come from: a Bible verse or psalm, a testimony of what God has done, a prayer you have prayed, a phrase from a sermon, or a question you are wrestling with. Keep a notebook or a voice memo and collect phrases.',
    'Gospel and worship songs are usually short and singable. A strong song has a hook: a phrase simple enough that a congregation can sing it after hearing it once or twice.',
    'You can start from the music, too. Play a four-chord loop and see what words come. Here you will play a first sketch: I – V – vi – IV in C. Many of the world\'s best-loved songs started as a loop like that.'
  ],
  listen: [{ label: 'A first sketch: C, G, Am, F', spec: kchords([cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true })], { d: 1.8 }) }],
  play: cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Play your sketch: C, G, Am, F.'),
  practice: [cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'Same chords, a different mood: Am, F, C, G.')],
  apply: { text: 'Write your theme as one sentence. Then play the loop and say the sentence over it, in any rhythm. Change a word, repeat it, shorten it. When it feels natural to say on the chords, you have the first line of a hook. Save it in the Song Lab.' },
  challenge: cExs([bassCh('C', 'major'), bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('G', 'major')], 'Challenge: a third sketch: C, Am, F, G, no hints.', { hints: false }),
  quiz: [
    q('A good song is about…', ['One clear idea', 'Many unrelated ideas', 'Only chords', 'Only rhythm'], 0, 'One theme gives the song direction.'),
    q('Which is a good source of song ideas?', ['A psalm, a testimony or a prayer', 'Only other songs', 'Nothing in life', 'Only random words'], 0, 'Real faith and real life.'),
    q('What is a hook?', ['A short phrase easy to remember and sing', 'A fast run', 'A key change', 'A drum fill'], 0, 'The part people carry home.'),
    q('You can start a song from…', ['Words or a chord loop', 'Words only', 'Chords only', 'A recording only'], 0, 'Either door works.')
  ]
});

SL.push({
  id: 's-lyrics', cat: 'Starting a song', title: 'Writing lyrics that people can sing', minutes: 14, req: ['s-ideas'],
  why: 'Lyrics for singing are not lyrics for reading. Words must be simple, natural to sing and true.',
  objective: 'Write a four-line verse with a steady rhythm and a clear rhyme scheme, and play it over a chord loop.',
  theory: [
    'Keep each line short, usually six to ten syllables, and keep lines of one section about the same length. Equal lines are easy to fit to equal bars of music.',
    'Use common rhyme patterns. AABB: lines 1 and 2 rhyme, lines 3 and 4 rhyme. ABAB: alternate. ABCB: only lines 2 and 4 rhyme, the most natural for beginners. Rhymes help memory, but never bend a sentence to force one. A near rhyme (grace, place) is fine.',
    'Be concrete. "Your mercy is new every morning" is stronger than "Your goodness is great". Pictures and actions are easier to sing and to believe than abstract words.',
    'Speak the line in rhythm before you sing it. Stress the important words on strong beats. If you stumble over a line, rewrite it. If you cannot sing it in one breath, shorten it.'
  ],
  listen: [{ label: 'Four bars, one line per bar', spec: kchords([cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true })], { d: 2.2 }) }],
  play: cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Play C, G, Am, F, one chord per line of your verse.'),
  practice: [cExs([bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'A second verse loop: C, F, C, G.')],
  apply: { text: 'Write four lines about your theme with an ABCB rhyme scheme. Say each line in a steady pulse over the loop. Circle any line you stumble on and rewrite it until it flows.' },
  challenge: cExs([bassCh('F', 'major'), bassCh('C', 'major'), bassCh('D', 'minor'), bassCh('Bb', 'major')], 'Challenge: the loop in F, one chord per line: F, C, Dm, B♭, no hints.', { hints: false }),
  quiz: [
    q('Which rhyme scheme is ABCB?', ['Only lines 2 and 4 rhyme', 'Every line rhymes', 'No lines rhyme', 'Lines 1 and 3 rhyme'], 0, 'The most natural scheme.'),
    q('Why keep lines about the same length?', ['They fit equal bars of music', 'They look neat', 'There is no reason', 'They rhyme better'], 0, 'Equal lines are easy to set.'),
    q('Which line is more concrete?', ['"Your mercy is new every morning"', '"Your goodness is great"', '"Things are good"', '"God exists"'], 0, 'It paints a picture.'),
    q('How should you test a lyric line?', ['Speak it in rhythm and sing it in one breath', 'Read it silently', 'Count the letters', 'Skip testing'], 0, 'Lyrics are for singing.')
  ]
});

SL.push({
  id: 's-progression', cat: 'Starting a song', title: 'Building a chord progression', minutes: 13, req: ['s-ideas', 'roman-numerals'],
  why: 'The progression sets the mood. Knowing a few reliable ones, and what each feels like, lets you choose instead of guess.',
  objective: 'Play four classic progressions and choose the one that fits a mood.',
  theory: [
    'I – V – vi – IV (C G Am F) is bright and open, the sound of countless anthems and worship songs.',
    'vi – IV – I – V (Am F C G) is the same four chords but starting on the minor chord. It feels more reflective and yearning.',
    'I – vi – IV – V (C Am F G) is the classic "fifties" progression: warm, nostalgic, easy to sing. I – IV – V – IV (C F G F) is simple and rootsy, common in praise and call-and-response.',
    'Rules of thumb: start on I for confidence, start on vi for longing, use IV for lift, use V to ask a question that I answers. Always play your idea slowly and ask: does this chord fit my theme?'
  ],
  listen: [
    { label: 'I – V – vi – IV', spec: kchords([cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], { d: 1.4 }) },
    { label: 'vi – IV – I – V', spec: kchords([cT('A', 'minor'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major')], { d: 1.4 }) },
    { label: 'I – IV – V – IV', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('G', 'major'), cT('F', 'major')], { d: 1.4 }) }
  ],
  play: cExs([bassCh('C', 'major', { label: 'I' }), bassCh('A', 'minor', { label: 'vi' }), bassCh('F', 'major', { label: 'IV' }), bassCh('G', 'major', { label: 'V' })], 'Play I – vi – IV – V in C: C, Am, F, G.'),
  practice: [
    cExs([bassCh('C', 'major', { label: 'I' }), bassCh('F', 'major', { label: 'IV' }), bassCh('G', 'major', { label: 'V' }), bassCh('F', 'major', { label: 'IV' })], 'I – IV – V – IV: C, F, G, F.'),
    cExs([bassCh('G', 'major', { label: 'I' }), bassCh('D', 'major', { label: 'V' }), bassCh('E', 'minor', { label: 'vi' }), bassCh('C', 'major', { label: 'IV' })], 'I – V – vi – IV in G: G, D, Em, C.')
  ],
  apply: { text: 'Play all four progressions on the chord loop for your theme and choose by feel. Write down the Roman numerals of the one you picked. They will help you move it to any key later.' },
  challenge: cExs([bassCh('D', 'minor'), bassCh('Bb', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], 'Challenge: vi – IV – I – V in F: Dm, B♭, F, C, no hints.', { hints: false }),
  quiz: [
    q('Which progression starts on the minor chord in C?', ['Am F C G', 'C G Am F', 'C Am F G', 'C F G F'], 0, 'vi – IV – I – V.'),
    q('What does ending a phrase on V feel like?', ['A question waiting for I', 'A final answer', 'A key change', 'Silence'], 0, 'V leans toward I.'),
    q('What is I – vi – IV – V in C?', ['C Am F G', 'C G Am F', 'Am F C G', 'C F G F'], 0, 'The fifties progression.'),
    q('Why write the Roman numerals?', ['To move the progression to any key', 'Only for decoration', 'It changes the sound', 'No reason'], 0, 'Numbers travel between keys.')
  ]
});

SL.push({
  id: 's-melody-chordtones', cat: 'Melody', title: 'Melody from chord tones', minutes: 13, req: ['s-progression', 'arpeggio-major'],
  why: 'A melody built on the notes of the chord underneath always sounds right. It is the safest way to start writing tunes.',
  objective: 'Play short melodies that land on chord tones over C, F and G.',
  theory: [
    'Every chord has three safe notes: the root, 3rd and 5th. Over C: C, E, G. Over F: F, A, C. Over G: G, B, D. A melody that lands on these notes on the strong beats sounds settled.',
    'Between those notes, add passing notes (steps from one chord tone to the next) to make it flow. Over C: E, D, C. Over F: A, G, F.',
    'Use the "land and leave" pattern: land on a chord tone at the start of each bar, then move by step to the next one.',
    'Start with three notes per bar, long and singable. Gospel melodies are often simple. Repeat notes. Leave space. Singers breathe.'
  ],
  visual: { range: [60, 84], steps: [
    { caption: 'Chord tones of C: C E G.', hi: ['C4', 'E4', 'G4'] },
    { caption: 'Chord tones of F: F A C.', hi: ['F4', 'A4', 'C5'] },
    { caption: 'Chord tones of G: G B D.', hi: ['G4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'A melody over C, F, G, C', spec: { kind: 'notes', notes: ['E4', 'D4', 'C4', 'A4', 'G4', 'F4', 'B4', 'A4', 'G4', 'E4', 'D4', 'C4'], d: 0.4 } }],
  play: mel(['E4', 'D4', 'C4'], 'Over C: E, D, C.'),
  practice: [mel(['A4', 'G4', 'F4'], 'Over F: A, G, F.'), mel(['B4', 'A4', 'G4'], 'Over G: B, A, G.'), mel(['E4', 'D4', 'C4', 'A4', 'G4', 'F4', 'B4', 'A4', 'G4', 'E4', 'D4', 'C4'], 'All together over C, F, G, C: the whole tune.')],
  apply: { text: 'Play the C, F, G, C chords with your left hand while you play this melody with your right. Then change the first note of each bar to a different chord tone and hear how the character changes.' },
  challenge: mel(['G4', 'E4', 'C4', 'A4', 'F4', 'C4', 'D4', 'B4', 'G4', 'E4', 'D4', 'C4'], 'Challenge: a new melody over C, F, G, C: G E C, A F C, D B G, E D C, no hints.', { hints: false }),
  quiz: [
    q('Which notes are the chord tones of F?', ['F A C', 'F G A', 'F B D', 'F E G'], 0, 'Root, 3rd, 5th.'),
    q('A melody that lands on chord tones sounds…', ['Settled and right', 'Always wrong', 'Random', 'Tense'], 0, 'They agree with the chord.'),
    q('What is a passing note?', ['A step between two chord tones', 'A wrong note', 'A key change', 'A rest'], 0, 'It connects chord tones.'),
    q('Why keep melodies simple?', ['A congregation can sing them', 'Complex is illegal', 'It is easier to record', 'There is no reason'], 0, 'Singability comes first.')
  ]
});

SL.push({
  id: 's-motif', cat: 'Melody', title: 'Motifs, repetition and shape', minutes: 13, req: ['s-melody-chordtones'],
  why: 'A memorable tune is usually a short idea repeated and varied. Learning to develop one motif gives you a whole melody.',
  objective: 'Play a short motif, repeat it, and develop it by moving it up a step and changing the ending.',
  theory: [
    'A motif is a short musical idea, often three to five notes. Over C: E E G E (a rhythm of repeated notes, then a leap, then a return).',
    'Repeat it: play E E G E again. Repetition makes it memorable. Then vary it: move the motif up a step (F F A F over F), or keep the start and change the end (E E G D).',
    'The shape of the tune matters. A phrase usually rises to a high point and falls back. Put the highest note near the end of the chorus for impact; the verse stays lower.',
    'A call-and-answer pattern works well: a phrase that ends on an open note (D over C), answered by a phrase that ends on the home note (C).'
  ],
  listen: [{ label: 'Motif, repeat, vary, close', spec: { kind: 'notes', notes: ['E4', 'E4', 'G4', 'E4', 'E4', 'E4', 'G4', 'E4', 'F4', 'F4', 'A4', 'F4', 'E4', 'E4', 'G4', 'C4'], d: 0.35 } }],
  play: mel(['E4', 'E4', 'G4', 'E4'], 'Play the motif: E E G E.'),
  practice: [
    mel(['E4', 'E4', 'G4', 'E4', 'E4', 'E4', 'G4', 'E4'], 'Repeat it: E E G E, E E G E.'),
    mel(['E4', 'E4', 'G4', 'E4', 'F4', 'F4', 'A4', 'F4', 'E4', 'E4', 'G4', 'C4'], 'Develop it: motif, up a step, then a new ending.')
  ],
  apply: { text: 'Invent your own motif of four notes using chord tones. Play it over your progression, repeat it, move it with the chords, and end with a new last note. Record it. This is your first melody.' },
  challenge: mel(['G4', 'G4', 'A4', 'G4', 'G4', 'G4', 'A4', 'G4', 'A4', 'A4', 'B4', 'A4', 'G4', 'G4', 'A4', 'E4'], 'Challenge: a new motif: G G A G, repeated, moved up, then closed, no hints.', { hints: false, maxMiss: 3 }),
  quiz: [
    q('A motif is…', ['A short musical idea', 'A key', 'A long solo', 'A rhythm only'], 0, 'Three to five notes.'),
    q('How do you develop a motif?', ['Repeat it, move it, change the end', 'Never repeat', 'Make it longer each time', 'Change everything'], 0, 'Keep part of it each time.'),
    q('Where should the highest note often be?', ['Near the end of the chorus', 'In the intro', 'Nowhere', 'In the verse only'], 0, 'It gives impact.'),
    q('An "open" phrase ending…', ['Leaves a question, answered by the next phrase', 'Always ends the song', 'Is a mistake', 'Is silent'], 0, 'Call and answer.')
  ]
});

SL.push({
  id: 's-verse-chorus', cat: 'Structure', title: 'Verse and chorus', minutes: 14, req: ['s-motif', 's-lyrics'],
  why: 'The verse tells and the chorus declares. Contrast between them gives a song its pull.',
  objective: 'Play a verse and a chorus that contrast in chords, and explain how they differ.',
  theory: [
    'The verse carries the story or the thoughts. It is usually lower, calmer and more wordy, with a melody that stays in a small range.',
    'The chorus carries the main message and the hook. It is higher, stronger, simpler and repeated. A listener should be able to sing it after one hearing.',
    'Use contrast. If the verse starts on the minor chord (Am F C G), start the chorus on the major (C G Am F) and give it more volume. Or keep the same chords but raise the melody and thicken the left hand.',
    'The lyric tells you the structure: the verse changes each time, the chorus words stay the same. That repetition is what people remember.'
  ],
  listen: [
    { label: 'Verse: Am, F, C, G', spec: kchords([cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true }), cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true })], { d: 1.6 }) },
    { label: 'Chorus: C, G, Am, F', spec: kchords([cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true })], { d: 1.6 }) }
  ],
  play: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'The verse: Am, F, C, G.'),
  practice: [cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'The chorus: C, G, Am, F.'), cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Verse into chorus: Am, F, C, G, then C, G, Am, F.')],
  apply: { text: 'Write one verse and a chorus for your theme. The verse tells why; the chorus declares what. Play them back to back and check: does the chorus feel like an arrival?' },
  challenge: cExs([bassCh('D', 'minor'), bassCh('Bb', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('D', 'minor'), bassCh('Bb', 'major')], 'Challenge: verse and chorus in F: Dm, B♭, F, C then F, C, Dm, B♭, no hints.', { hints: false }),
  quiz: [
    q('The chorus is usually…', ['Higher, stronger and repeated', 'Quieter and different every time', 'Absent', 'Only instrumental'], 0, 'It is the main statement.'),
    q('The verse usually…', ['Tells the story and changes each time', 'Repeats exactly', 'Has no words', 'Is the highest part'], 0, 'New words each time.'),
    q('How can you contrast verse and chorus?', ['Start on a different chord, raise the melody, thicken the sound', 'Make them identical', 'Change the title', 'Stop playing'], 0, 'Contrast gives pull.'),
    q('Why repeat the chorus words?', ['They become what people remember', 'To save time', 'It is a mistake', 'To confuse'], 0, 'Repetition builds memory.')
  ]
});

SL.push({
  id: 's-prechorus-bridge', cat: 'Structure', title: 'Pre-chorus, bridge, intro and outro', minutes: 14, req: ['s-verse-chorus'],
  why: 'These smaller sections steer the energy: they build to the chorus, change the view in the middle and bring the song home.',
  objective: 'Play a pre-chorus that builds, a bridge that changes colour, and know when to use an intro and outro.',
  theory: [
    'The pre-chorus sits between verse and chorus and builds tension. It often ends on V so the chorus feels like a release: F, G, F, G in C, or Dm, F, G, G.',
    'The bridge appears once, after the second chorus, to give a new view. It uses different chords or a different feel, often starting on a chord not used before (vi or IV) and ending on V to lead back to the final chorus.',
    'The intro sets the key and mood. Use the chorus chords, a turnaround or a sus vamp from the arranging lessons. The outro ends the song: repeat the chorus line, slow down, or finish with an Amen.',
    'Not every song needs all of these. Add a section only if it does a job: build, contrast, or close.'
  ],
  listen: [
    { label: 'Pre-chorus: Dm, F, G, G', spec: kchords([cT('D', 'minor', { bass: true }), cT('F', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('G', 'major', { bass: true })], { d: 1.4 }) },
    { label: 'Bridge: F, G, Am, G', spec: kchords([cT('F', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('G', 'major', { bass: true })], { d: 1.4 }) }
  ],
  play: cExs([bassCh('D', 'minor'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('G', 'sus4')], 'The pre-chorus: Dm, F, G, Gsus4. It leans toward the chorus.'),
  practice: [cExs([bassCh('F', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('G', 'major')], 'The bridge: F, G, Am, G.'), cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], 'A simple outro: C, G, F, C.')],
  apply: { text: 'Add a pre-chorus to your song and mark where it builds. Check: does it end on V so the chorus feels like a release? Then write a two-line bridge that says the same truth from a new angle.' },
  challenge: cExs([bassCh('G', 'major'), bassCh('C', 'major'), bassCh('D', 'major'), bassCh('E', 'minor'), bassCh('D', 'major'), bassCh('D', 'sus4'), bassCh('D', 'major')], 'Challenge: in G: G, C, D, Em, D, Dsus4, D, no hints.', { hints: false }),
  quiz: [
    q('What does a pre-chorus do?', ['Builds tension toward the chorus', 'Ends the song', 'Changes key', 'Repeats the intro'], 0, 'It ends on V and leans in.'),
    q('How often does a bridge appear?', ['Usually once, after the second chorus', 'Every line', 'Never', 'Before the intro'], 0, 'A new view.'),
    q('What should an intro do?', ['Set the key and mood', 'Hide the key', 'Change the lyrics', 'Be as long as possible'], 0, 'It tells the room what is coming.'),
    q('When should you add a section?', ['When it has a job to do', 'Always', 'Never', 'To fill time'], 0, 'Build, contrast or close.')
  ]
});

SL.push({
  id: 's-callresponse', cat: 'Gospel forms', title: 'Call and response', minutes: 13, req: ['s-motif', 'g-fills'],
  why: 'Call and response is at the heart of gospel. A leader sings a line, the people answer, and the whole room becomes part of the song.',
  objective: 'Write and play a call line and an answer line, and shape them over a vamp.',
  theory: [
    'The call is a line sung by the leader; the response is the answer sung by the group or played by the piano. The call ends open, the response closes.',
    'Keep the call short and strong, and the response even shorter and always the same, such as "Hallelujah" or "Yes, Lord". A repeated response lets the whole congregation join.',
    'On piano, answer the singer with a short fill from the pentatonic, landing on a chord tone. Over C: E G A G E.',
    'Build the vamp on one or two chords so the call can be changed freely. The groove stays steady while the leader improvises.'
  ],
  listen: [{ label: 'Call (open), response (closed)', spec: { kind: 'notes', notes: ['E4', 'G4', 'A4', 'G4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4'], d: 0.4 } }],
  play: mel(['E4', 'G4', 'A4', 'G4', 'D4'], 'The call, ending open on D: E, G, A, G, D.'),
  practice: [mel(['E4', 'G4', 'E4', 'D4', 'C4'], 'The response, closing on C: E, G, E, D, C.'), mel(['E4', 'G4', 'A4', 'G4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4'], 'Call and response together.')],
  apply: { text: 'Loop C and F on the piano. Sing or play a short line, then answer it with the same response every time. Teach it to a friend and let them sing the response.' },
  challenge: mel(['G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'G4', 'E4', 'D4', 'C4'], 'Challenge: a new call and response: G A C A G, then E G E D C, no hints.', { hints: false }),
  quiz: [
    q('The call usually ends…', ['Open, waiting for the answer', 'Closed', 'On silence', 'On a key change'], 0, 'It asks for a response.'),
    q('Why keep the response short and repeated?', ['So everyone can join in', 'To save time', 'It is easier to write', 'No reason'], 0, 'A simple response invites participation.'),
    q('What can the piano do after a sung line?', ['Answer with a short fill', 'Play over it', 'Stop', 'Change key'], 0, 'Answer, never compete.'),
    q('Why use a one- or two-chord vamp?', ['The call can change freely over a steady groove', 'It is the law', 'To be simple', 'No reason'], 0, 'The groove stays steady.')
  ]
});

SL.push({
  id: 's-harmony', cat: 'Gospel forms', title: 'Harmony and background vocals', minutes: 14, req: ['s-melody-chordtones', 'g-closed-open'],
  why: 'Stacked voices make a song feel big. Even two parts, a melody and a harmony a third away, change the sound.',
  objective: 'Play a melody with a harmony line a third below, and understand how backing vocals fit.',
  theory: [
    'Harmony means singing or playing a second note against the melody. The easiest and sweetest choice is a third below: for the melody E G A G E in C, the harmony is C E F E C.',
    'Keep the harmony on notes of the chord or the scale, and move in the same direction as the melody. Where the melody lands on a chord tone, the harmony should land on a chord tone too.',
    'Background vocals ("backups") can sing in thirds, hold long chord notes (ooh, ahh), or echo the hook. Write them as a separate line and keep them quieter than the lead.',
    'To check a harmony line, play the melody with the right hand and the harmony with the left, and listen for notes that clash.'
  ],
  listen: [
    { label: 'Melody', spec: { kind: 'notes', notes: ['E4', 'G4', 'A4', 'G4', 'E4'], d: 0.5 } },
    { label: 'Harmony a third below', spec: { kind: 'notes', notes: ['C4', 'E4', 'F4', 'E4', 'C4'], d: 0.5 } }
  ],
  play: mel(['E4', 'G4', 'A4', 'G4', 'E4'], 'The melody: E G A G E.'),
  practice: [mel(['C4', 'E4', 'F4', 'E4', 'C4'], 'The harmony a third below: C E F E C.'), mel(['A4', 'G4', 'F4', 'E4', 'D4'], 'A descending melody: A G F E D.'), mel(['F4', 'E4', 'D4', 'C4', 'B3'], 'And its harmony a third below: F E D C B.', { range: [59, 84] })],
  apply: { text: 'Record the melody on one track, then play the harmony while listening back. Do the notes blend? Where they clash, move the harmony to the nearest chord tone.' },
  challenge: mel(['G4', 'A4', 'C5', 'A4', 'G4'], 'Challenge: the melody G A C A G; then try E F A F E as its harmony, no hints.', { hints: false }),
  quiz: [
    q('A harmony a third below E is…', ['C', 'G', 'D', 'F'], 0, 'E, D, C: a third below.'),
    q('Harmony should usually move…', ['In the same direction as the melody', 'Opposite always', 'Never', 'Randomly'], 0, 'Parallel motion sounds smooth.'),
    q('Background vocals should be…', ['Quieter than the lead', 'Louder than the lead', 'Silent', 'The only part'], 0, 'They support the lead.'),
    q('What can backup singers sing?', ['Thirds, held notes or echoes of the hook', 'Only the melody', 'Nothing', 'Only the bass'], 0, 'Add colour without crowding.')
  ]
});

SL.push({
  id: 's-gospel-form', cat: 'Gospel forms', title: 'Gospel, praise and worship forms', minutes: 13, req: ['s-prechorus-bridge', 's-callresponse'],
  why: 'Different types of songs do different jobs. Knowing the form tells you how to write and how to arrange.',
  objective: 'Recognise and write the three common forms: worship song, praise song and gospel vamp song.',
  theory: [
    'Worship song: slower, personal, often addressed to God ("You are…"). Form: verse, chorus, verse, chorus, bridge, chorus. The bridge builds, then the song settles.',
    'Praise song: fast, joyful, declaring ("We shout…"). Form: short verse, big chorus, repeated. Rhythmic hooks, call and response and handclaps are common.',
    'Gospel vamp song: a short verse leads to a vamp, a repeated section that grows in energy as the leader improvises. The vamp can run for minutes. Key changes often lift the vamp.',
    'Choose the form before you write. A praise song with a long wordy verse feels heavy; a worship song with no space feels rushed.'
  ],
  listen: [
    { label: 'Worship feel: slow loop', spec: kchords([cT('C', 'add9'), cT('G', 'major'), cT('A', 'm7'), cT('F', 'add9')], { d: 2.2 }) },
    { label: 'Vamp: C and F', spec: kchords([cT('C', 'major', { bass: true }), cT('F', 'major', { bass: true }), cT('C', 'major', { bass: true }), cT('F', 'major', { bass: true })], { d: 1.2 }) }
  ],
  play: cExs([bassCh('C', 'add9'), bassCh('G', 'major'), bassCh('A', 'm7'), bassCh('F', 'add9')], 'A worship loop: Cadd9, G, Am7, Fadd9.'),
  practice: [cExs([bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'A vamp that lifts: C, F, C, F, C, G.')],
  apply: { text: 'Choose a form for your song and write it on a card: sections in order, with a tempo and a feel. Keep the card as your map while you write.' },
  challenge: cExs([bassCh('G', 'add9'), bassCh('D', 'major'), bassCh('E', 'm7'), bassCh('C', 'add9')], 'Challenge: a worship loop in G: Gadd9, D, Em7, Cadd9, no hints.', { hints: false }),
  quiz: [
    q('A vamp is…', ['A repeated section that can grow in energy', 'A fixed short ending', 'A silent bar', 'A key signature'], 0, 'The leader improvises over it.'),
    q('Worship songs are usually…', ['Slower and personal', 'Fast and shouted', 'Always instrumental', 'Without lyrics'], 0, 'Often addressed to God.'),
    q('Praise songs often use…', ['Rhythmic hooks and call and response', 'Only whispered words', 'No chorus', 'Only minor keys'], 0, 'They invite participation.'),
    q('Why choose the form first?', ['It guides the writing', 'It avoids work', 'It changes the key', 'No reason'], 0, 'A map before the walk.')
  ]
});

SL.push({
  id: 's-arrangement', cat: 'Finishing', title: 'Song arrangement: the dynamic map', minutes: 13, req: ['s-gospel-form', 'w-build'],
  why: 'A song has a shape in time. An arrangement tells each player what to do in each section, so the energy rises and falls on purpose.',
  objective: 'Plan a dynamic map and play a section sequence that follows it.',
  theory: [
    'A dynamic map lists each section and its energy from 1 (quiet) to 5 (full). For example: intro 1, verse 1 = 2, chorus = 4, verse 2 = 3, chorus = 4, bridge = 3 building to 5, final chorus = 5, outro = 1.',
    'Tools for raising energy: more instruments, higher register, thicker voicings, a faster rhythm, louder dynamics, a key change. Tools for lowering it: fewer notes, lower register, space, sustained chords.',
    'Do not start at 5. The listener needs somewhere to go. Save your biggest moment for the last chorus, or a key change into it.',
    'Write the map before you rehearse. A band can follow a map; they cannot follow "just feel it".'
  ],
  listen: [{ label: 'Quiet verse to full chorus', spec: kv([vc('a', ['C4', 'E4', 'G4']), vc('b', ['G3', 'B3', 'D4']), vc('c', ['C3', 'G3', 'C4', 'E4', 'G4']), vc('d', ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'])], 2) }],
  play: vEx([wPad('Verse (energy 2)', ['C4', 'E4', 'G4']), wPad('Chorus (energy 4)', ['C3', 'G3', 'C4', 'E4', 'G4']), wPad('Final chorus (energy 5)', ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'])], 'Play the same chord at three energy levels.', { range: [36, 84] }),
  practice: [cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('D', 'major'), bassCh('A', 'major'), bassCh('B', 'minor'), bassCh('G', 'major')], 'The whole map: verse, chorus, then a lifted final chorus in D: Am, F, C, G, C, G, Am, F, then D, A, Bm, G.', { range: [47, 72] })],
  apply: { text: 'Draw your dynamic map on paper: a line that rises and falls over the sections. Mark the bridge and the final chorus. Play your song with it in front of you.' },
  challenge: cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('D', 'major'), bassCh('A', 'major'), bassCh('B', 'minor'), bassCh('G', 'major')], 'Challenge: chorus in C, then lift to D: C, G, Am, F, D, A, Bm, G, no hints.', { hints: false, range: [47, 72] }),
  quiz: [
    q('Why not start a song at full energy?', ['The listener needs somewhere to go', 'It is illegal', 'The bass is quiet', 'It breaks the piano'], 0, 'Build to the peak.'),
    q('Which is a way to raise energy?', ['Higher register, thicker voicing, key change', 'Fewer notes', 'Silence', 'Lower register only'], 0, 'Add weight, height or lift.'),
    q('Where is the biggest moment usually?', ['The final chorus', 'The first verse', 'The intro', 'Nowhere'], 0, 'Save it.'),
    q('What is a dynamic map?', ['A list of sections with planned energy', 'A map of the church', 'A key chart', 'A lyric sheet'], 0, 'It guides the band.')
  ]
});

SL.push({
  id: 's-capstone', cat: 'Project', title: 'Songwriting project: write a complete song', minutes: 25, req: ['s-verse-chorus', 's-prechorus-bridge', 's-harmony', 's-arrangement', 's-gospel-form'],
  why: 'This is where you put everything together: an original song with a theme, structure, melody and arrangement.',
  objective: 'Write and play a complete short song: verse, pre-chorus, chorus and bridge.',
  theory: [
    'Step 1: Theme. Write one sentence. Step 2: Form. Choose worship, praise or vamp. Step 3: Chord loop. Use a progression from this track. Step 4: Verse melody from chord tones with a small range. Step 5: Chorus with the hook, higher and stronger. Step 6: Pre-chorus and bridge only if they do a job. Step 7: Map the dynamics.',
    'Here is a model in C. Verse: Am, F, C, G. Pre-chorus: Dm, F, G, Gsus4. Chorus: C, G, Am, F. Bridge: F, G, Am, G. Final chorus lifted to D: D, A, Bm, G.',
    'Rehearse in pieces, then in order. Record a rough version on your phone, even with only piano and voice. Play it for someone and ask which line they remember.',
    'A finished imperfect song teaches more than a perfect unfinished one. Complete a draft, then improve it.'
  ],
  listen: [{ label: 'The model: verse, pre-chorus, chorus', spec: kchords([cT('A', 'minor'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('D', 'minor'), cT('F', 'major'), cT('G', 'major'), cT('G', 'sus4'), cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], { d: 1.2 }) }],
  play: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'Part 1: the verse: Am, F, C, G.'),
  practice: [
    cExs([bassCh('D', 'minor'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('G', 'sus4')], 'Part 2: the pre-chorus: Dm, F, G, Gsus4.'),
    cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Part 3: the chorus: C, G, Am, F.'),
    cExs([bassCh('F', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('G', 'major')], 'Part 4: the bridge: F, G, Am, G.')
  ],
  apply: { text: 'Now make it yours. Replace the model chords and words with your own. Write the verse words, the hook and the bridge line. Record it start to finish and play it for two people. Note what they remember. That is the next thing to improve.' },
  challenge: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('D', 'minor'), bassCh('F', 'major'), bassCh('G', 'major'), bassCh('G', 'sus4'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Challenge: verse, pre-chorus and chorus straight through, no hints.', { hints: false }),
  quiz: [
    q('What is the first step in writing a song?', ['Write the theme as one sentence', 'Record the drums', 'Choose the font', 'Buy a keyboard'], 0, 'Everything serves the theme.'),
    q('Which section usually carries the hook?', ['The chorus', 'The intro only', 'The verse only', 'The count-in'], 0, 'It is repeated.'),
    q('What does a pre-chorus usually end on?', ['V (or a sus on V)', 'I always', 'vi', 'Nothing'], 0, 'It leans into the chorus.'),
    q('Why record a rough version?', ['To hear it as a listener would', 'To avoid practice', 'To sell it', 'No reason'], 0, 'Your ears learn from playback.'),
    q('What is better than a perfect unfinished song?', ['A finished imperfect draft', 'Another idea', 'A longer intro', 'A new key'], 0, 'Finishing teaches.')
  ]
});

SG.modules = [
  { id: 's-start', level: 'S', title: 'Starting a song', blurb: 'Ideas, lyrics and chord progressions.', lessons: ['s-ideas', 's-lyrics', 's-progression'] },
  { id: 's-melody', level: 'S', title: 'Melody', blurb: 'Chord tones, motifs and shape.', lessons: ['s-melody-chordtones', 's-motif'] },
  { id: 's-struct', level: 'S', title: 'Structure', blurb: 'Verse, chorus, pre-chorus, bridge, intro and outro.', lessons: ['s-verse-chorus', 's-prechorus-bridge'] },
  { id: 's-gospel', level: 'S', title: 'Gospel forms', blurb: 'Call and response, harmony and the main song forms.', lessons: ['s-callresponse', 's-harmony', 's-gospel-form'] },
  { id: 's-finish', level: 'S', title: 'Finishing a song', blurb: 'Arrangement and a complete song project.', lessons: ['s-arrangement', 's-capstone'] }
];
LESSONS.push.apply(LESSONS, SG.lessons);
MODULES.push(...SG.modules);
LEVELS.push({ id: 'S', name: 'Songwriting', title: 'Songwriting', goal: 'Take a theme to a finished song: lyrics, chords, melody, structure, harmony and arrangement.' });

/* ===================== BATCH 6 · Music production =====================
   DAW basics, MIDI, instruments, recording, drums, bass, pads and strings, arrangement,
   vocals, EQ, compression and effects, mixing, mastering and a production project.
   The app cannot host a DAW, so each lesson pairs real playing or timing practice with the concepts. */
const PR = { lessons: [], modules: [] };
const PL = PR.lessons;
const tp = (bpm, pattern, prompt, o) => Object.assign({ type: 'tap', bpm, bpb: 4, pattern, prompt }, o || {});
const bs = (notes, prompt, o) => sEx(notes, prompt, Object.assign({ range: [36, 60] }, o || {}));
const e8 = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

PL.push({
  id: 'p-daw', cat: 'Foundations', title: 'What a DAW is: tracks, tempo and the grid', minutes: 12, req: ['w-capstone', 'rhythm-patterns'],
  why: 'A DAW (digital audio workstation) is your studio. Once you understand tracks, tempo and the grid, every program looks familiar.',
  objective: 'Explain tracks, regions, tempo and the grid, and play steadily against a click.',
  theory: [
    'A DAW is software for recording, editing, arranging and mixing music. Examples include GarageBand, Logic, Ableton Live, FL Studio, Reaper, Cakewalk and BandLab. They all share the same ideas, so learn the ideas, not one button layout.',
    'A project is made of tracks. Each track holds one instrument or voice. A track holds regions (also called clips): pieces of recorded audio or MIDI placed on a timeline. You can move, cut, copy and loop regions.',
    'The tempo (BPM) and time signature set the grid: the lines marking beats and bars. When you record to the click and the grid matches your tempo, you can edit by bar and beat.',
    'Set the tempo before you record. Changing it later is possible, but easier to avoid. The most important skill for recording is steady time. Practise with the metronome below.'
  ],
  listen: [{ label: 'A click at 90 BPM', spec: { kind: 'metro', bpm: 90, bars: 2 } }, { label: 'A click at 70 BPM', spec: { kind: 'metro', bpm: 70, bars: 2 } }],
  play: tp(90, [1, 1, 1, 1, 1, 1, 1, 1], 'After the count-in, tap on every click, as if recording against the grid.'),
  practice: [tp(70, [2, 2, 2, 2], 'Slower: tap on beats 1 and 3 at 70 BPM.')],
  apply: { text: 'Open any DAW (GarageBand and BandLab are free). Create a new project, set the tempo to 80, turn on the metronome and record eight bars of one chord. Zoom in and see how close each chord lands to the grid lines.' },
  challenge: tp(100, [1, 1, 1, 1, 1, 1, 1, 1], 'Challenge: 100 BPM with a tighter window.', { tol: 0.14 }),
  quiz: [
    q('What is a DAW?', ['Software for recording, editing, arranging and mixing', 'A kind of microphone', 'A piano model', 'A file format'], 0, 'Digital audio workstation.'),
    q('What is a region (or clip)?', ['A piece of audio or MIDI on a track', 'A mixing plugin', 'A tempo', 'A cable'], 0, 'You can move, cut and loop regions.'),
    q('Why set the tempo before recording?', ['So the grid matches your performance', 'It makes the sound brighter', 'It is required by law', 'No reason'], 0, 'Editing by bar and beat depends on it.'),
    q('What is the grid?', ['Lines marking beats and bars', 'A type of reverb', 'A mic position', 'A file folder'], 0, 'It keeps edits in time.')
  ]
});

PL.push({
  id: 'p-midi', cat: 'Foundations', title: 'MIDI: notes as data', minutes: 13, req: ['p-daw'],
  why: 'MIDI is the language between your keyboard and every virtual instrument. Understanding it lets you edit a performance after you play it.',
  objective: 'Explain note, velocity, length and quantize, and play MIDI-style note patterns accurately.',
  theory: [
    'MIDI does not record sound. It records instructions: which note, when it starts, how long it lasts, and how hard it was played (velocity, from 1 to 127). A virtual instrument turns those instructions into sound.',
    'Because MIDI is data, you can fix mistakes without playing again: change a wrong note, move a note in time, change its length or velocity, or swap the sound entirely. Audio cannot be changed so freely.',
    'Quantize snaps notes to the grid. Full quantize can sound robotic; use partial quantize or leave it off on emotional piano parts. Human timing is part of the feeling.',
    'In the app, middle C is MIDI note 60. The 88 keys of a piano are notes 21 to 108. Your keyboard sends velocity as well, so play with real dynamics: gentle on verses, firm on choruses.'
  ],
  listen: [{ label: 'The same notes, gently then firmly', spec: { kind: 'notes', notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], d: 0.4 } }],
  play: sEx(['C4', 'E4', 'G4', 'C5'], 'Play a simple MIDI part: C E G C.', { range: [60, 84] }),
  practice: [sEx(['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], 'Up and back down: C E G C G E C.', { range: [60, 84] })],
  apply: { text: 'In your DAW, record the notes you just played with a piano instrument. Open the piano roll and look at each note. Move one note off the grid and then quantize it back. Change the velocity of one note and listen.' },
  challenge: sEx(['E4', 'G4', 'C5', 'G4', 'E4', 'D4', 'F4', 'A4', 'F4', 'D4'], 'Challenge: E G C G E, then D F A F D, no hints.', { hints: false, range: [60, 84] }),
  quiz: [
    q('What does MIDI record?', ['Instructions: note, timing, length and velocity', 'The actual sound', 'The room acoustics', 'Only lyrics'], 0, 'It is data, not sound.'),
    q('What is velocity?', ['How hard a note was played', 'How fast the song is', 'The note length', 'The volume knob'], 0, 'A value from 1 to 127.'),
    q('What does quantize do?', ['Snaps notes to the grid', 'Raises the pitch', 'Adds reverb', 'Records audio'], 0, 'Use it gently on expressive parts.'),
    q('What is MIDI note 60?', ['Middle C', 'The lowest key', 'The highest key', 'A sharp'], 0, 'C4 in this app.')
  ]
});

PL.push({
  id: 'p-instruments', cat: 'Foundations', title: 'Virtual instruments and choosing sounds', minutes: 13, req: ['p-midi', 'g-closed-open'],
  why: 'The sound you choose shapes the whole song. A great performance on a poor sound can fall flat.',
  objective: 'Choose a sound that fits a song, and play a part that suits it.',
  theory: [
    'A virtual instrument (a plugin or built-in sound) turns MIDI into sound. Common kinds: acoustic piano, electric piano (Rhodes, Wurlitzer), organ (Hammond B3 is a gospel standard), synth pads, strings and synth leads.',
    'Choose for the song. Acoustic piano: ballads and worship. Electric piano: warm, soulful grooves. Organ: sustained gospel chords and swells. Pads: wide atmosphere under quiet moments.',
    'Match the playing to the sound. A piano rewards touch and space. An organ rewards held chords and swells. A pad needs very few changes. If a part feels wrong, try changing the sound before changing the notes.',
    'Layering: two sounds together (piano plus a soft pad) add width. Keep the layers different in tone, and keep one clearly in front.'
  ],
  listen: [{ label: 'The same chords, wide and gentle', spec: kv([vc('a', ['C3', 'G3', 'E4', 'G4']), vc('b', ['F2', 'C3', 'A3', 'C4', 'F4']), vc('c', ['G2', 'D3', 'B3', 'D4', 'G4'])], 2.4) }],
  play: vEx([wPad('C', ['C3', 'G3', 'E4', 'G4']), wPad('F', ['F2', 'C3', 'A3', 'C4', 'F4']), wPad('G', ['G2', 'D3', 'B3', 'D4', 'G4'])], 'Play a part that suits a pad or organ: C, F, G as held chords.'),
  practice: [vEx([wPad('Am', ['A2', 'E3', 'C4', 'E4']), wPad('F', ['F2', 'C3', 'A3', 'C4', 'F4']), wPad('C', ['C3', 'G3', 'E4', 'G4']), wPad('G', ['G2', 'D3', 'B3', 'D4', 'G4'])], 'Another held part: Am, F, C, G.')],
  apply: { text: 'Load three sounds on one track: an acoustic piano, an electric piano and an organ. Play the same four chords with each. Write one word for the feeling of each. Choose the one that fits your song.' },
  challenge: vEx([wPad('G', ['G2', 'D3', 'B3', 'D4', 'G4']), wPad('D', ['D3', 'A3', 'F#4', 'A4']), wPad('Em', ['E2', 'B2', 'G3', 'B3', 'E4']), wPad('C', ['C3', 'G3', 'E4', 'G4'])], 'Challenge: G, D, Em, C as held chords, no hints.', { hints: false }),
  quiz: [
    q('Which instrument is a gospel standard for sustained chords and swells?', ['Hammond-style organ', 'Triangle', 'Flute solo', 'Snare drum'], 0, 'The B3 organ is classic.'),
    q('If a part feels wrong, what is worth trying first?', ['A different sound', 'Deleting the song', 'Playing faster', 'Adding more notes'], 0, 'Sound and part must match.'),
    q('What does layering do?', ['Adds width and richness', 'Mutes the track', 'Changes the key', 'Removes noise'], 0, 'Keep one layer in front.'),
    q('Which sound suits a quiet worship moment?', ['A soft pad or piano', 'A loud synth lead', 'A drum solo', 'A siren'], 0, 'Match the mood.')
  ]
});

PL.push({
  id: 'p-record-piano', cat: 'Recording', title: 'Recording piano', minutes: 14, req: ['p-instruments', 'p-daw'],
  why: 'A good recording starts at the source: a relaxed performance, in time, captured clean.',
  objective: 'Prepare a take: count in, play against the click, keep the chords even, and know how to choose between takes.',
  theory: [
    'Before recording, set the tempo, turn on a count-in of one bar, check your sound, and set the input level. If you record MIDI, there is no level problem. If you record audio (an acoustic piano, a microphone), watch the meter: peaks around −12 to −6 dB, never reaching 0 dB (clipping).',
    'Play the whole song, not tiny pieces, so it feels like music. Record several takes. Do not stop for small errors: finish the take and compare afterwards.',
    'Play with the click, but listen to yourself. Keep your chords even in volume. Rushing is common when nervous: if you speed up, slow down and relax your shoulders.',
    'Choose the best take by feel, not perfection. Fix small mistakes by editing MIDI notes or by combining the best parts of different takes (comping).'
  ],
  listen: [{ label: 'Click, then four chords', spec: { kind: 'metro', bpm: 80, bars: 2 } }],
  play: tp(80, [1, 1, 1, 1, 1, 1, 1, 1], 'Tap along at 80 BPM like a recording count-in: steady and relaxed.'),
  practice: [cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Play C, G, Am, F evenly, as if recording a take.')],
  apply: { text: 'Record three takes of the same eight bars. Listen back with eyes closed. Which take feels best? Mark why. That is your standard for the next recording.' },
  challenge: cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], 'Challenge: C, G, Am, F, C, G, F, C straight through, no hints.', { hints: false }),
  quiz: [
    q('What is clipping?', ['The signal hitting 0 dB and distorting', 'Cutting a region', 'A kind of reverb', 'A tempo change'], 0, 'Keep peaks lower.'),
    q('A sensible recording peak level is…', ['Around −12 to −6 dB', 'Always 0 dB', 'Above 0 dB', 'There is no limit'], 0, 'Leave headroom.'),
    q('Why record the whole song?', ['It feels like music, not pieces', 'It is faster', 'It saves storage', 'No reason'], 0, 'Flow matters.'),
    q('What is comping?', ['Combining the best parts of different takes', 'Compressing audio', 'Composing a song', 'Changing key'], 0, 'Pick the best moments.')
  ]
});

PL.push({
  id: 'p-drums', cat: 'Rhythm section', title: 'Programming drums', minutes: 14, req: ['p-midi', 'rhythm-patterns'],
  why: 'Drums give a song its heartbeat. A simple, steady pattern played with feeling beats a busy one.',
  objective: 'Describe a basic gospel drum pattern and tap the kick and hi-hat rhythms in time.',
  theory: [
    'The core of a drum kit is the kick (low, on strong beats), the snare (sharp, on beats 2 and 4, the backbeat) and the hi-hat (steady pulse, often eighth notes). Add toms for fills and cymbals for crashes at section changes.',
    'A basic 4/4 pattern: kick on beats 1 and 3, snare on 2 and 4, hi-hat on every eighth note. Slow gospel ballads often use a 6/8 feel with a kick on 1, a snare on 4 of six, and hi-hat on every eighth note.',
    'In your DAW, program drums on a grid of 16 steps per bar (sixteenth notes). Start simple. Then vary the velocity: soft hi-hats on the off-beats, firm on the beats. Add a fill at the end of every four or eight bars.',
    'Drums should serve the song: sparse in verses, fuller in the chorus. Silence is a drum fill too.'
  ],
  listen: [{ label: 'Eighth-note pulse (the hi-hat)', spec: { kind: 'rhythm', pattern: e8, bpm: 80, note: 76 } }, { label: 'Kick on 1, the "and" of 2, and 4', spec: { kind: 'rhythm', pattern: [1.5, 1.5, 1], bpm: 80, note: 48 } }],
  play: tp(70, e8, 'Tap the hi-hat: eight eighth notes at 70 BPM.'),
  practice: [tp(70, [1.5, 1.5, 1], 'Tap the kick pattern: beat 1, the "and" of 2, then beat 4.'), tp(80, [1, 0.5, 0.5, 1, 1], 'A mixed pattern at 80 BPM.')],
  apply: { text: 'Program a one-bar pattern in your DAW with kick on 1 and 3, snare on 2 and 4 and hi-hat in eighths. Loop it. Then lower the velocity of every second hi-hat note and hear the groove breathe.' },
  challenge: tp(90, [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1], 'Challenge: a syncopated two-bar rhythm at 90 BPM, no hints.', { tol: 0.15 }),
  quiz: [
    q('On which beats does the snare usually fall in 4/4?', ['2 and 4', '1 and 3', 'Only 1', 'Every eighth note'], 0, 'The backbeat.'),
    q('The hi-hat usually plays…', ['A steady pulse, often eighth notes', 'Only on beat 1', 'Only at the end', 'Never'], 0, 'It keeps time.'),
    q('How many steps are in a one-bar 16-step grid?', ['16 sixteenth notes', '8 quarter notes', '4 eighth notes', '32 beats'], 0, 'Four per beat, four beats.'),
    q('How should drums change from verse to chorus?', ['Sparse in verses, fuller in the chorus', 'Identical always', 'Louder in verses', 'Silent in the chorus'], 0, 'Build with the song.')
  ]
});

PL.push({
  id: 'p-groove', cat: 'Rhythm section', title: 'Groove, swing and feel', minutes: 13, req: ['p-drums', 'comping-rhythms'],
  why: 'Two programs can play the same notes and one will feel alive. The difference is groove: tiny shifts in timing and volume.',
  objective: 'Describe how velocity, swing and timing create feel, and tap syncopated rhythms in time.',
  theory: [
    'Groove is the feel of the rhythm. It comes from three things: velocity (some notes louder), timing (some notes slightly early or late) and length (short or long notes).',
    'Swing delays the off-beat eighth notes so each pair feels like long-short. Straight eighths are even. Swing amount is a percentage: 50% is straight, around 60-66% feels like a shuffle. Try small amounts; too much sounds sloppy.',
    'Humanize by shifting a few notes a few milliseconds and varying velocities slightly. Keep the kick and snare steady; loosen the hi-hat and shakers.',
    'Gospel groove often leans on syncopation: playing on the off-beat before a strong beat. This is the "push" you practised in comping rhythms.'
  ],
  listen: [{ label: 'Straight eighths', spec: { kind: 'rhythm', pattern: e8, bpm: 90, note: 60 } }, { label: 'A syncopated push', spec: { kind: 'rhythm', pattern: [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1], bpm: 90, note: 60 } }],
  play: tp(80, [1.5, 0.5, 1, 1], 'Tap the push: dotted quarter, eighth, quarter, quarter.'),
  practice: [tp(90, [0.5, 1, 0.5, 1, 1, 0.5, 1, 0.5], 'Tap an off-beat pattern at 90 BPM.')],
  apply: { text: 'Take your programmed pattern and move every second hi-hat slightly late, and lower its velocity. Then compare to the rigid version. Which one would you rather play along to?' },
  challenge: tp(100, [1.5, 0.5, 1, 1, 0.5, 1, 0.5, 1.5, 1], 'Challenge: a longer syncopated pattern at 100 BPM, no hints.', { tol: 0.15 }),
  quiz: [
    q('Which three things create groove?', ['Velocity, timing and note length', 'Key, pitch and volume only', 'Reverb, delay and EQ', 'Tempo, key and lyrics'], 0, 'Small variations make it human.'),
    q('What does swing do?', ['Delays the off-beat eighths', 'Raises the pitch', 'Doubles the tempo', 'Removes the kick'], 0, 'Long-short pairs.'),
    q('What is syncopation?', ['Emphasis on off-beats', 'Playing on every beat', 'Silence', 'A key change'], 0, 'Playing between the beats.'),
    q('What should you keep steady when humanizing?', ['Kick and snare', 'Everything is random', 'Nothing', 'Only the hi-hat'], 0, 'Anchor the groove.')
  ]
});

PL.push({
  id: 'p-bass', cat: 'Rhythm section', title: 'Programming bass', minutes: 13, req: ['p-groove', 'bass-movement'],
  why: 'The bass links the drums and the harmony. A simple bass part makes the whole song feel grounded.',
  objective: 'Play three bass patterns: root and fifth, octaves, and a simple walk.',
  theory: [
    'The bass plays the root of each chord on the strong beats and locks to the kick drum. Keep it low (about C1 to C3) and simple. Play fewer notes than you think.',
    'Root and fifth: C then G, C then G. Octaves: C low then C an octave higher. A walk: C E F G, steps leading into the next chord, like the walk-ups you learned.',
    'Keep the bass tight in length: let each note stop where the next one starts, or use short notes for a bouncy feel. Long notes suit slow worship.',
    'Cut very low frequencies on instruments other than the bass (we will do this in the EQ lesson), so the bass and kick have room.'
  ],
  visual: { range: [36, 60], steps: [{ caption: 'Root and fifth in C: C and G.', hi: ['C2', 'G2'] }, { caption: 'A walk up: C E F G.', hi: ['C2', 'E2', 'F2', 'G2'] }] },
  listen: [{ label: 'Root and fifth', spec: { kind: 'notes', notes: ['C2', 'G2', 'C2', 'G2'], d: 0.5 } }, { label: 'A walk', spec: { kind: 'notes', notes: ['C2', 'E2', 'F2', 'G2'], d: 0.5 } }],
  play: bs(['C2', 'G2', 'C2', 'G2'], 'Play root and fifth: C G C G.'),
  practice: [bs(['C2', 'C3', 'C2', 'C3'], 'Octaves: C low, C high, C low, C high.'), bs(['C2', 'E2', 'F2', 'G2'], 'A walk: C E F G.')],
  apply: { text: 'Add a bass track to your chord part: play the root of each chord on beat 1. Then add a fifth on beat 3. Compare. Keep the version that supports without crowding.' },
  challenge: bs(['C2', 'G2', 'A2', 'E2', 'F2', 'C2', 'G2', 'G2'], 'Challenge: the roots of C, G, Am, F with walks: C G A E F C G G, no hints.', { hints: false }),
  quiz: [
    q('What does the bass usually play?', ['The root on strong beats', 'The melody', 'High chords', 'Only fills'], 0, 'It anchors the harmony.'),
    q('What does the bass lock with?', ['The kick drum', 'The hi-hat only', 'The vocal reverb', 'Nothing'], 0, 'They form the foundation.'),
    q('Which range suits bass?', ['Low: about C1 to C3', 'High: above C5', 'The same as the melody', 'Any'], 0, 'Low and clear.'),
    q('Which is a good rule?', ['Play fewer notes than you think', 'Play as many notes as possible', 'Always play fast', 'Never play roots'], 0, 'Simple and strong.')
  ]
});

PL.push({
  id: 'p-pads-strings', cat: 'Colour', title: 'Pads, strings and synths', minutes: 13, req: ['p-bass', 'w-pads'],
  why: 'Pads and strings fill the space between the instruments and add emotion. Used well they lift a chorus; used badly they muddy the mix.',
  objective: 'Write a pad or string part with spread voicings that sits above the bass without clashing.',
  theory: [
    'A pad is a sustained, slow-moving sound. Strings add warmth and lift. Synths add colour. All three work best as long notes that change only when the chord changes.',
    'Place them above the bass and piano. Use open voicings in the middle and upper range, with the root and fifth in the middle (C4-G4) and thirds above. Avoid doubling the bass note.',
    'Start with just one pad note per chord tone, long and soft. Add strings for the chorus to lift it. Remove them in the verse for contrast.',
    'Mix tip: use a low-cut (high-pass filter) on pads and strings so they leave the low end to the bass.'
  ],
  listen: [{ label: 'A string-style part: C, G, Am, F', spec: kv([vc('a', ['C4', 'E4', 'G4', 'C5']), vc('b', ['B3', 'D4', 'G4', 'B4']), vc('c', ['C4', 'E4', 'A4', 'C5']), vc('d', ['C4', 'F4', 'A4', 'C5'])], 2.4) }],
  play: vEx([wPad('C', ['C4', 'E4', 'G4', 'C5'], { low: false }), wPad('G', ['B3', 'D4', 'G4', 'B4'], { low: false })], 'Play a string-style part: C, then G, held and soft.', { range: [48, 84] }),
  practice: [vEx([wPad('Am', ['C4', 'E4', 'A4', 'C5'], { low: false }), wPad('F', ['C4', 'F4', 'A4', 'C5'], { low: false })], 'Am, then F, in the same area of the keyboard.', { range: [48, 84] })],
  apply: { text: 'Add a string or pad track above your bass and piano, with long notes that change with each chord. Mute it in the verse and bring it in for the chorus.' },
  challenge: vEx([wPad('C', ['C4', 'E4', 'G4', 'C5'], { low: false }), wPad('G', ['B3', 'D4', 'G4', 'B4'], { low: false }), wPad('Am', ['C4', 'E4', 'A4', 'C5'], { low: false }), wPad('F', ['C4', 'F4', 'A4', 'C5'], { low: false })], 'Challenge: C, G, Am, F as a string part, no hints.', { hints: false, range: [48, 84] }),
  quiz: [
    q('A pad is…', ['A sustained, slow-moving sound', 'A short drum hit', 'A vocal harmony', 'A type of reverb'], 0, 'It fills the space.'),
    q('Where should pads and strings sit?', ['Above the bass and piano', 'Below the bass', 'In the same notes as the kick', 'Anywhere'], 0, 'Leave the low end alone.'),
    q('How can strings help contrast?', ['Enter for the chorus, leave in the verse', 'Play throughout', 'Never play', 'Play only in the intro'], 0, 'Add and remove to shape.'),
    q('What does a high-pass filter do on a pad?', ['Cuts low frequencies', 'Adds bass', 'Raises pitch', 'Adds reverb'], 0, 'It clears room for the bass.')
  ]
});

PL.push({
  id: 'p-arrangement', cat: 'Building the song', title: 'Arranging in the DAW', minutes: 13, req: ['p-pads-strings', 's-arrangement'],
  why: 'Your dynamic map becomes real here: tracks entering and leaving so each section has its own energy.',
  objective: 'Plan which tracks play in each section and play the section chords in order.',
  theory: [
    'Take your dynamic map and turn it into a track plan. List sections along the top and instruments down the side. Mark which tracks play in each section.',
    'A typical plan: Intro, piano only. Verse, piano and bass. Pre-chorus, add drums with a simple pattern. Chorus, add strings and fuller drums. Bridge, drop to piano and pad, then build. Final chorus, everything, plus a key lift.',
    'Use transitions: a drum fill, a reverse cymbal or a short silence before a chorus makes the entrance obvious. Remove an instrument just before the section starts to make the entrance feel bigger.',
    'Keep the arrangement simple. When in doubt, take something out.'
  ],
  listen: [{ label: 'Verse then chorus chords', spec: kchords([cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true }), cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true })], { d: 1.2 }) }],
  play: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'The verse: Am, F, C, G.'),
  practice: [cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'The chorus: C, G, Am, F.')],
  apply: { text: 'Draw the plan as a grid: sections across, instruments down. Fill the grid. Build it in your DAW by muting and unmuting tracks. Listen to each section on its own, then all together.' },
  challenge: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Challenge: verse into chorus without a pause, no hints.', { hints: false }),
  quiz: [
    q('What is a track plan?', ['A grid showing which tracks play in each section', 'A list of lyrics', 'A tuning chart', 'A tempo map'], 0, 'It turns the map into practical choices.'),
    q('What makes a chorus entrance feel bigger?', ['Removing something just before it', 'Adding nothing', 'Playing quieter', 'A key change in the verse'], 0, 'Contrast creates impact.'),
    q('What is a good rule for arranging?', ['When in doubt, take something out', 'More is always better', 'Never remove', 'Always add drums'], 0, 'Keep it simple.'),
    q('What can mark a section change?', ['A drum fill or reverse cymbal', 'A new key signature only', 'Silence in the lyrics only', 'Nothing'], 0, 'Transitions guide the listener.')
  ]
});

PL.push({
  id: 'p-vocal', cat: 'Recording', title: 'Recording vocals', minutes: 13, req: ['p-record-piano'],
  why: 'The voice is the heart of a gospel song. A clean, confident vocal recording is worth more than any effect.',
  objective: 'Set up a vocal recording, warm up, and sing a short pattern in tune.',
  theory: [
    'Microphone: a condenser mic captures detail in a quiet room; a dynamic mic is forgiving in a noisy space. Stay about a hand-span (15-20 cm) from the mic. A pop filter reduces harsh "p" and "b" sounds.',
    'Room: record where it is quiet and not echoey. A closet full of clothes or a room with a soft sofa and curtains is surprisingly good. Turn off fans and phones.',
    'Level: sing the loudest part of the song and set the input so peaks reach about −12 to −6 dB. Wear headphones so the backing track does not leak into the mic.',
    'Warm up before recording: hum, sing a gentle scale and drink water. Record several takes of each section, then choose the best phrases to comp together.'
  ],
  listen: [{ label: 'A warm-up pattern', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'], d: 0.45 } }],
  play: sEx(['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'], 'Play the warm-up on the keyboard, then sing it: C D E F G F E D C.'),
  practice: [sEx(['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4', 'C5'], 'An arpeggio warm-up: C E G E C E G C.', { range: [60, 84] })],
  apply: { text: 'Record yourself singing a verse with just piano. Listen back. Is it in tune? Is the volume steady? Is there background noise? Fix one thing and record again.' },
  challenge: sEx(['C4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], 'Challenge: a longer warm-up, no hints.', { hints: false, range: [60, 84], maxMiss: 3 }),
  quiz: [
    q('How far should you stand from the mic?', ['About a hand-span (15-20 cm)', 'Touching it', 'Across the room', 'It does not matter'], 0, 'Close enough for detail, far enough to avoid pops.'),
    q('What does a pop filter do?', ['Reduces harsh p and b sounds', 'Adds reverb', 'Tunes the voice', 'Boosts bass'], 0, 'It softens plosives.'),
    q('Why wear headphones while recording?', ['So the backing track does not leak into the mic', 'To look professional', 'To make it louder', 'No reason'], 0, 'Avoid bleed.'),
    q('Before recording you should…', ['Warm up and drink water', 'Shout', 'Skip warm-up', 'Record without a plan'], 0, 'Care for your voice.')
  ]
});

PL.push({
  id: 'p-eq', cat: 'Mixing', title: 'EQ: making space for every sound', minutes: 14, req: ['p-bass', 'p-vocal'],
  why: 'Most mixes sound muddy because instruments fight over the same frequencies. EQ gives each sound its own space.',
  objective: 'Explain the frequency ranges of instruments and use cuts to clean a mix; play the frequency ladder.',
  theory: [
    'EQ (equaliser) boosts or cuts parts of the frequency range. Low is about 20-250 Hz (kick, bass, the lowest piano notes), low-mids are 250-500 Hz (where "mud" gathers), mids are 500 Hz-2 kHz (body of voices and instruments), high-mids 2-5 kHz (presence and clarity), and highs above 5 kHz (sparkle, "air").',
    'On the piano, C2 is about 65 Hz, C3 is 131 Hz, middle C is 262 Hz, A4 is 440 Hz and C6 is about 1047 Hz. Each octave doubles the frequency.',
    'Cut before you boost. Use a high-pass filter on everything except the kick and bass to remove unneeded low rumble. If the mix sounds muddy, try a gentle cut around 250-400 Hz on a few instruments.',
    'EQ in context: judge a sound within the full mix, not alone. Small moves of 1-3 dB are usually enough.'
  ],
  visual: { range: [36, 84], steps: [{ caption: 'The frequency ladder: C2 (65 Hz), C3, C4, C5, C6 (1047 Hz). Each is double the one before.', hi: ['C2', 'C3', 'C4', 'C5', 'C6'] }] },
  listen: [{ label: 'The frequency ladder', spec: { kind: 'notes', notes: ['C2', 'C3', 'C4', 'C5', 'C6'], d: 0.7 } }],
  play: sEx(['C2', 'C3', 'C4', 'C5', 'C6'], 'Play the frequency ladder: C2 C3 C4 C5 C6.', { range: [36, 84] }),
  practice: [sEx(['C6', 'C5', 'C4', 'C3', 'C2'], 'Now down: C6 C5 C4 C3 C2.', { range: [36, 84] })],
  apply: { text: 'Put an EQ on your piano track. Use the high-pass filter to cut below about 80 Hz. Listen to the bass: is it clearer? Try a small cut around 300 Hz and see if the mix opens up.' },
  challenge: sEx(['C2', 'G2', 'C3', 'G3', 'C4', 'G4', 'C5', 'G5', 'C6'], 'Challenge: climb the octaves by fifths: C2 G2 C3 G3 C4 G4 C5 G5 C6, no hints.', { hints: false, range: [36, 84] }),
  quiz: [
    q('Where does "mud" usually gather?', ['Around 250-500 Hz', 'Above 10 kHz', 'Below 20 Hz', 'At exactly 1 kHz'], 0, 'Low-mids.'),
    q('Does going up an octave double or halve the frequency?', ['Doubles it', 'Halves it', 'Does not change it', 'Triples it'], 0, 'A4 440 Hz, A5 880 Hz.'),
    q('A good rule for EQ is…', ['Cut before you boost', 'Always boost the highs', 'Never use EQ', 'Boost everything'], 0, 'Removing clutter is cleaner than adding.'),
    q('What is a high-pass filter for?', ['Removing unneeded low rumble', 'Adding bass', 'Adding reverb', 'Slowing the tempo'], 0, 'Clear space for the bass and kick.')
  ]
});

PL.push({
  id: 'p-dynamics-fx', cat: 'Mixing', title: 'Compression, reverb and delay', minutes: 15, req: ['p-eq', 'p-groove'],
  why: 'These three tools control dynamics and space. Used lightly, they make a mix sound polished and alive.',
  objective: 'Explain compressor settings, reverb and delay, and set a delay time to match the tempo.',
  theory: [
    'A compressor reduces the difference between loud and quiet parts. Threshold: the level where it starts working. Ratio: how much it reduces (2:1 gentle, 4:1 firmer). Attack: how quickly it reacts. Release: how quickly it lets go. Make-up gain: raises the level after compression.',
    'Use light compression on vocals, bass and piano to keep them steady: aim for 2-4 dB of gain reduction. Too much squashes the life out of the performance.',
    'Reverb simulates a space. Short reverb (hall, room) adds depth; long reverb adds atmosphere. Pre-delay (10-40 ms) keeps the vocal clear. Do not put too much on everything: use a shared reverb on a send, and cut the lows in the reverb.',
    'Delay repeats a sound. Set the delay time to the tempo so the repeats fall on the beat. At 90 BPM, a quarter note is 60000 ÷ 90 = about 667 ms and an eighth note is about 333 ms. Set it to taste, then keep the feedback low (2-3 repeats).'
  ],
  listen: [{ label: 'Quarter-note pulse at 90 BPM (667 ms)', spec: { kind: 'metro', bpm: 90, bars: 2 } }, { label: 'Eighth-note pulse at 90 BPM (333 ms)', spec: { kind: 'rhythm', pattern: e8, bpm: 90, note: 72 } }],
  play: tp(90, [1, 1, 1, 1, 1, 1, 1, 1], 'Tap the quarter-note delay pulse at 90 BPM: one tap every 667 ms.'),
  practice: [tp(90, e8, 'Tap the eighth-note delay pulse at 90 BPM: one tap every 333 ms.')],
  apply: { text: 'Add a compressor to a vocal or piano and watch the gain reduction meter. Aim for 2-4 dB. Then add a reverb send and a delay set to a quarter note at your song\'s tempo. Turn each off and on to hear what it adds.' },
  challenge: tp(100, [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1], 'Challenge: tap a rhythm at 100 BPM, as an echoing delay would repeat it, no hints.', { tol: 0.15 }),
  quiz: [
    q('What does a compressor do?', ['Reduces the difference between loud and quiet', 'Adds reverb', 'Raises pitch', 'Records audio'], 0, 'It makes levels steadier.'),
    q('What is a quarter-note delay time at 90 BPM?', ['About 667 ms', 'About 333 ms', 'About 1000 ms', 'About 90 ms'], 0, '60000 ÷ 90.'),
    q('What does pre-delay do on a vocal reverb?', ['Keeps the dry vocal clear before the reverb starts', 'Mutes the vocal', 'Raises the pitch', 'Adds bass'], 0, 'A short gap helps clarity.'),
    q('A sensible amount of compression is…', ['About 2-4 dB of gain reduction', 'Always 20 dB', 'None ever', 'As much as possible'], 0, 'Too much kills the feeling.')
  ]
});

PL.push({
  id: 'p-mix', cat: 'Mixing', title: 'Mixing fundamentals', minutes: 14, req: ['p-dynamics-fx', 'p-arrangement'],
  why: 'Mixing is where a collection of tracks becomes one song. The order and the discipline matter more than the tools.',
  objective: 'Follow a simple mixing order and play your chord part evenly, as you would want it in the mix.',
  theory: [
    'Start with a rough balance: set all faders by ear, with the vocal and the kick and bass loudest. Do this before adding effects.',
    'Then work in order: balance, pan, EQ, compression, effects, automation. Place the kick, bass and lead vocal in the centre. Pan guitars, pads and backing vocals left and right to create width.',
    'Leave headroom: keep the master bus peaking around −6 dB. Do not try to make it loud: that is the job of mastering.',
    'Automation changes a setting over time: turning up the vocal in a quiet verse, or raising the pad for the final chorus. Take breaks. Fresh ears hear problems immediately. Compare with a commercial song in the same style.'
  ],
  listen: [{ label: 'A steady chord part', spec: kchords([cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true })], { d: 1.6 }) }],
  play: cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Play an even, clean chord part: C, G, Am, F.'),
  practice: [cExs([bassCh('G', 'major'), bassCh('D', 'major'), bassCh('E', 'minor'), bassCh('C', 'major')], 'The same part in G: G, D, Em, C.')],
  apply: { text: 'Take a song with at least four tracks. Reset all the faders to the same level, then set a rough balance by ear. Pan two tracks. Save as version 1. Come back tomorrow and listen again with fresh ears.' },
  challenge: cExs([bassCh('F', 'major'), bassCh('C', 'major'), bassCh('D', 'minor'), bassCh('Bb', 'major'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('Bb', 'major'), bassCh('F', 'major')], 'Challenge: a clean, even part in F, no hints.', { hints: false }),
  quiz: [
    q('What should be in the centre of the mix?', ['Kick, bass and lead vocal', 'Everything', 'Only the pads', 'The backing vocals only'], 0, 'The foundation stays centred.'),
    q('What is a good first step in mixing?', ['A rough balance of faders', 'Add reverb everywhere', 'Compress everything', 'Export'], 0, 'Balance before effects.'),
    q('How much headroom should you leave on the master bus?', ['Peaks around −6 dB', 'Peaks at 0 dB', 'Peaks above 0 dB', 'No peaks'], 0, 'Mastering needs room.'),
    q('What is automation?', ['Changing a setting over time', 'A kind of plugin only for drums', 'Recording audio automatically', 'Exporting a file'], 0, 'Volume rides, filter sweeps and more.')
  ]
});

PL.push({
  id: 'p-master-export', cat: 'Finishing', title: 'Mastering basics and exporting', minutes: 13, req: ['p-mix'],
  why: 'Mastering and exporting prepare your song to be heard by others, on every speaker and phone.',
  objective: 'Explain what mastering does, set a safe loudness and choose the right export format.',
  theory: [
    'Mastering is the final polish of the finished mix: gentle EQ, light compression, a limiter to set the final loudness, and a check that the song works on headphones, phone speakers and a car. Mastering can be done by an engineer, by a service or yourself with care.',
    'Loudness: streaming services normalise songs, commonly around −14 LUFS (check each service). A louder master is not better: it will simply be turned down, and heavy limiting loses dynamics. Keep the true peak below −1 dB.',
    'Export formats: WAV (or AIFF) is full quality and best for archiving and sending to a mastering engineer (44.1 or 48 kHz, 24-bit). MP3 or AAC is smaller and used for sharing. Keep your WAV master.',
    'Before sharing, listen on several speakers, at low volume and in a different room. Name your files clearly with the song title and version, for example "Song-v3-master.wav".'
  ],
  listen: [{ label: 'The finishing chords, held', spec: kchords([cT('F', 'add9', { bass: true }), cT('C', 'add9', { bass: true })], { d: 2.4 }) }],
  play: cExs([bassCh('F', 'add9'), bassCh('C', 'add9')], 'Play the Amen that ends your song: Fadd9 to Cadd9.'),
  practice: [cExs([bassCh('C', 'sus4'), bassCh('C', 'add9')], 'And a sus tag: Csus4 to Cadd9.')],
  apply: { text: 'Export your mix as a WAV, then as an MP3. Listen to both on your phone and on headphones. Check that the quietest part is audible and the loudest part does not distort.' },
  challenge: cExs([bassCh('G', 'major'), bassCh('C', 'add9'), bassCh('G', 'sus4'), bassCh('G', 'add9')], 'Challenge: an ending in G: G, Cadd9, Gsus4, Gadd9, no hints.', { hints: false }),
  quiz: [
    q('What does mastering do?', ['Final polish and loudness of the finished mix', 'Records the vocals', 'Writes the lyrics', 'Programs the drums'], 0, 'It prepares the song for release.'),
    q('A commonly cited streaming loudness target is…', ['About −14 LUFS', '0 LUFS', '−60 LUFS', '+6 LUFS'], 0, 'Check each service; they normalise.'),
    q('Which format is best to archive your master?', ['WAV', 'A low-quality MP3', 'A screenshot', 'A text file'], 0, 'Keep a full-quality copy.'),
    q('Why listen on several speakers?', ['To make sure it works everywhere', 'To waste time', 'To make it louder', 'No reason'], 0, 'Phones, headphones, cars.')
  ]
});

PL.push({
  id: 'p-capstone', cat: 'Project', title: 'Production project: finish an original gospel song', minutes: 30, req: ['p-master-export', 'p-vocal', 's-capstone'],
  why: 'This is the final step of the journey: take your own song from idea to a finished recording.',
  objective: 'Produce an original gospel song from the songwriting project, from arrangement to export.',
  theory: [
    'Follow the pipeline. 1: Song and tempo (your songwriting project). 2: Piano or keys (record a clean take). 3: Drums and bass. 4: Pads and strings. 5: Lead vocal and backing vocals. 6: Edit and comp. 7: Mix (balance, pan, EQ, compression, effects). 8: Master and export.',
    'Work in short sessions and save versions often (v1, v2, v3). Finish a rough version of the whole song before polishing any part. A complete rough song teaches you more than one perfect verse.',
    'Ask for feedback: play the draft for a worship leader or a trusted friend. Listen for what they remember and where they lose interest. Improve one thing at a time.',
    'You have the skills: you can play, understand, hear, accompany, write and produce. The next step is to make music for people who need it.'
  ],
  listen: [{ label: 'The model song, verse and chorus', spec: kchords([cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true }), cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('C', 'major', { bass: true }), cT('G', 'major', { bass: true }), cT('A', 'minor', { bass: true }), cT('F', 'major', { bass: true })], { d: 1.2 }) }],
  play: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major')], 'Part 1: the verse: Am, F, C, G.'),
  practice: [cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major')], 'Part 2: the chorus: C, G, Am, F.'), cExs([bassCh('C', 'major'), bassCh('G', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], 'Part 3: the outro: C, G, F, C.')],
  apply: { text: 'Make a folder for your project. Save a rough version of your whole song by the end of the week, even if it sounds basic. Share it with one person and ask what they remember.' },
  challenge: cExs([bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('A', 'minor'), bassCh('F', 'major'), bassCh('C', 'major'), bassCh('G', 'major'), bassCh('F', 'major'), bassCh('C', 'major')], 'Challenge: verse, chorus and outro straight through, no hints.', { hints: false }),
  quiz: [
    q('What is a good first goal for a production?', ['A complete rough version', 'One perfect verse', 'A mastered intro', 'A final export'], 0, 'Finish before polishing.'),
    q('Why save versions (v1, v2, v3)?', ['You can go back if something goes wrong', 'To fill the disk', 'They sound better', 'No reason'], 0, 'Safety and progress.'),
    q('What is the first step in the pipeline?', ['The song and tempo', 'Mastering', 'Exporting', 'Adding reverb'], 0, 'Start from the song.'),
    q('Why play a draft for a friend?', ['To learn what they remember', 'To show off', 'To avoid improving', 'No reason'], 0, 'Real feedback beats guessing.'),
    q('Which comes last in the pipeline?', ['Master and export', 'Record piano', 'Write lyrics', 'Choose the tempo'], 0, 'Finish, then share.')
  ]
});

PR.modules = [
  { id: 'p-found', level: 'P', title: 'Foundations', blurb: 'The DAW, MIDI and virtual instruments.', lessons: ['p-daw', 'p-midi', 'p-instruments'] },
  { id: 'p-rec', level: 'P', title: 'Recording', blurb: 'Recording piano and vocals.', lessons: ['p-record-piano', 'p-vocal'] },
  { id: 'p-rhythm', level: 'P', title: 'Rhythm section', blurb: 'Drums, groove and bass.', lessons: ['p-drums', 'p-groove', 'p-bass'] },
  { id: 'p-build', level: 'P', title: 'Building the song', blurb: 'Pads, strings and arranging in the DAW.', lessons: ['p-pads-strings', 'p-arrangement'] },
  { id: 'p-mixing', level: 'P', title: 'Mixing', blurb: 'EQ, compression, reverb, delay and the mixing order.', lessons: ['p-eq', 'p-dynamics-fx', 'p-mix'] },
  { id: 'p-finish', level: 'P', title: 'Finishing', blurb: 'Mastering, exporting and your production project.', lessons: ['p-master-export', 'p-capstone'] }
];
LESSONS.push.apply(LESSONS, PR.lessons);
MODULES.push(...PR.modules);
LEVELS.push({ id: 'P', name: 'Music production', title: 'Music production', goal: 'Turn a song into a finished recording: DAW, MIDI, drums, bass, vocals, mixing, mastering and exporting.' });


/* what is coming: titles only. Nothing here is playable yet. */
const ROADMAP = [
  { track: 'Playable songs', items: ['Full songs with chord charts', 'Notation view', 'Play along with a backing track'] },
  { track: 'Learning tools', items: ['Spaced review of earlier skills', 'Real piano and organ samples', 'Accounts and cross-device sync'] }
];

{
/* ===================== BATCH R · Reading music (notation and sight-reading) =====================
   Written staff notation, clefs, ledger lines, accidentals, key signatures, rhythm and chords,
   ending with a first sight-reading lesson. The Practice screen has an adaptive sight-reading drill. */
const RD = { lessons: [], modules: [] };
const RL = RD.lessons;
const tk = x => (Array.isArray(x) ? x : [x]);
/* a visual step that shows notes on a staff and lights the same keys on the keyboard */
const sv = (caption, clef, notes, extra) => Object.assign({
  caption, hi: [].concat(...notes.map(tk)), staff: { clef, cols: notes.map(n => ({ notes: tk(n), dur: 'q' })) }
}, extra || {});
const staffQ = (text, clef, notes, o, a, why, dur, key) => q(text, o, a, why, { staff: { clef, key: key || 0, cols: [{ notes: tk(notes), dur: dur || 'w' }] } });

RL.push({
  id: 'staff-clefs', cat: 'Reading', title: 'The staff and the clefs', minutes: 8, req: ['white-notes'],
  why: 'Printed music, hymnals and chord charts all use the staff. Reading it opens thousands of songs that you do not have to learn by ear.',
  objective: 'Explain the staff, the treble and bass clefs and where middle C is written, and play the notes C to G from both clefs.',
  theory: [
    'Music is written on a staff: five lines with four spaces between them. Notes sit on a line or in a space. The higher a note is written, the higher it sounds, and the further right on the keyboard it is.',
    'A clef at the start of the staff tells you which notes the lines stand for. The treble clef is for higher notes, usually played by the right hand. The bass clef is for lower notes, usually played by the left hand.',
    'Piano music uses both staves together, joined by a brace: the grand staff. Middle C (C4) sits between the two staves on its own short line, called a ledger line.'
  ],
  visual: { staff: true, range: [48, 84], steps: [
    sv('Treble staff: C4, D4, E4, F4, G4. Each step up the staff is a step up the keyboard.', 'treble', ['C4', 'D4', 'E4', 'F4', 'G4']),
    sv('Bass staff: C3, D3, E3, F3, G3. The bass clef shows the lower notes.', 'bass', ['C3', 'D3', 'E3', 'F3', 'G3']),
    sv('Grand staff: middle C sits on a ledger line between the two staves.', 'grand', ['C4'])
  ] },
  listen: [
    { label: 'Going up the staff sounds higher: C to G', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4', 'G4'], d: 0.7 } },
    { label: 'Going down the staff sounds lower: G to C', spec: { kind: 'notes', notes: ['G4', 'F4', 'E4', 'D4', 'C4'], d: 0.7 } }
  ],
  play: { type: 'read', clef: 'treble', pool: ['C4', 'D4', 'E4', 'F4', 'G4'], count: 5, range: [60, 72], hints: true, prompt: 'Play the note written on the staff. The keyboard hint shows you where it is.' },
  practice: [{ type: 'read', clef: 'bass', pool: ['C3', 'D3', 'E3', 'F3', 'G3'], count: 5, range: [48, 60], hints: true, prompt: 'Now the bass clef. Play each note written on the staff.' }],
  apply: { text: 'Hymnals and choir music use the grand staff. If you know which hand reads which staff, you can find your place in a hymn in seconds and play the bass line with your left hand while the choir sings.' },
  challenge: { type: 'read', pool: [{ clef: 'treble', notes: ['C4'] }, { clef: 'treble', notes: ['E4'] }, { clef: 'treble', notes: ['G4'] }, { clef: 'bass', notes: ['C3'] }, { clef: 'bass', notes: ['E3'] }, { clef: 'bass', notes: ['G3'] }], count: 8, maxMiss: 2, range: [48, 72], prompt: 'Challenge: eight notes from both clefs, no hints. At most two mistakes.' },
  quiz: [
    q('How many lines does a staff have?', ['Three', 'Four', 'Five', 'Six'], 2, 'A staff has five lines and four spaces.'),
    q('Which clef is usually read by the right hand on the piano?', ['Bass clef', 'Treble clef', 'Both equally', 'Neither'], 1, 'The treble clef shows the higher notes, normally the right hand.'),
    q('Moving up the staff, the sound gets…', ['Lower', 'Higher', 'Quieter', 'The same'], 1, 'Higher on the staff means higher in pitch.'),
    q('Where is middle C written on the grand staff?', ['On a ledger line between the two staves', 'On the top line of the treble staff', 'In the top space of the bass staff', 'On the bottom line of the bass staff'], 0, 'Middle C sits on its own short ledger line between the staves.'),
    staffQ('Which note is written here?', 'treble', 'C4', ['C', 'D', 'E', 'G'], 0, 'This is middle C, on a ledger line below the treble staff.')
  ]
});

RL.push({
  id: 'treble-notes', cat: 'Reading', title: 'Reading the treble clef', minutes: 10,
  why: 'The right hand usually plays the melody, and the melody is written in the treble clef. Fast note recognition means you can follow a tune while watching the leader.',
  objective: 'Name and play the notes on the lines and spaces of the treble staff, from E4 up to G5.',
  theory: [
    'The five lines of the treble staff, from the bottom up, are E G B D F. A saying helps: Every Good Boy Does Fine.',
    'The four spaces, from the bottom up, spell F A C E: the word FACE. The clef curls around the second line, which is G. That is why it is also called the G clef.',
    'Above the top line the pattern carries on: G sits in the space above, then A on a short extra line. Below the bottom line, D sits in the space under it.'
  ],
  visual: { staff: true, range: [60, 84], steps: [
    sv('The lines: E G B D F (Every Good Boy Does Fine).', 'treble', ['E4', 'G4', 'B4', 'D5', 'F5']),
    sv('The spaces: F A C E (FACE).', 'treble', ['F4', 'A4', 'C5', 'E5']),
    sv('Beyond the staff: D4 sits just below the bottom line, and G5 just above the top line.', 'treble', ['D4', 'G5'])
  ] },
  listen: [{ label: 'The lines, one by one: E G B D F', spec: { kind: 'notes', notes: ['E4', 'G4', 'B4', 'D5', 'F5'], d: 0.7 } }, { label: 'The spaces: F A C E', spec: { kind: 'notes', notes: ['F4', 'A4', 'C5', 'E5'], d: 0.7 } }],
  play: { type: 'read', clef: 'treble', pool: ['E4', 'G4', 'B4', 'D5', 'F5'], count: 6, range: [64, 79], hints: true, prompt: 'Notes on the lines. Play each note written on the staff.' },
  practice: [{ type: 'read', clef: 'treble', pool: ['F4', 'A4', 'C5', 'E5'], count: 6, range: [64, 79], hints: true, prompt: 'Notes in the spaces. Think FACE.' }],
  apply: { text: 'In worship you often follow a melody line in the treble clef while the singer leads. When you can name a note at a glance, you can double the melody softly in your right hand and keep your eyes on the leader.' },
  challenge: { type: 'read', clef: 'treble', pool: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'], count: 10, maxMiss: 2, range: [64, 79], prompt: 'Challenge: ten notes from the whole treble staff, no hints. At most two mistakes.' },
  quiz: [
    q('The four spaces of the treble staff spell…', ['FACE', 'EGBDF', 'CAGE', 'ACEG'], 0, 'From the bottom: F A C E.'),
    q('Which note is on the second line of the treble staff, where the clef curls?', ['E', 'G', 'B', 'D'], 1, 'Lines from the bottom: E G B D F. The second is G.'),
    staffQ('Which note is written here?', 'treble', 'A4', ['G', 'A', 'B', 'C'], 1, 'This note is in the second space: A.'),
    staffQ('Which note is written here?', 'treble', 'D5', ['C', 'D', 'E', 'F'], 1, 'This note is on the fourth line: D.')
  ]
});

RL.push({
  id: 'bass-notes', cat: 'Reading', title: 'Reading the bass clef', minutes: 10,
  why: 'Your left hand plays the bass notes that every chord stands on. Reading the bass clef lets you play bass lines from a hymnal or a chord chart.',
  objective: 'Name and play the notes on the lines and spaces of the bass staff, from G2 up to C4.',
  theory: [
    'The five lines of the bass staff, from the bottom up, are G B D F A. A saying: Good Boys Do Fine Always.',
    'The four spaces, from the bottom up, are A C E G. A saying: All Cows Eat Grass. The two dots of the bass clef sit on either side of the fourth line, which is F. That is why it is also called the F clef.',
    'Above the top line, B sits in the space, then middle C on a ledger line. Notes in the bass clef are written lower than the same letter in the treble clef: this staff is for the left hand.'
  ],
  visual: { staff: true, range: [36, 72], steps: [
    sv('The lines: G B D F A (Good Boys Do Fine Always).', 'bass', ['G2', 'B2', 'D3', 'F3', 'A3']),
    sv('The spaces: A C E G (All Cows Eat Grass).', 'bass', ['A2', 'C3', 'E3', 'G3']),
    sv('Above the staff: B3 in the space above the top line, then middle C on a ledger line.', 'bass', ['B3', 'C4'])
  ] },
  listen: [{ label: 'The lines, one by one: G B D F A', spec: { kind: 'notes', notes: ['G2', 'B2', 'D3', 'F3', 'A3'], d: 0.7 } }, { label: 'The spaces: A C E G', spec: { kind: 'notes', notes: ['A2', 'C3', 'E3', 'G3'], d: 0.7 } }],
  play: { type: 'read', clef: 'bass', pool: ['G2', 'B2', 'D3', 'F3', 'A3'], count: 6, range: [40, 60], hints: true, prompt: 'Notes on the lines. Play each note written on the bass staff.' },
  practice: [{ type: 'read', clef: 'bass', pool: ['A2', 'C3', 'E3', 'G3'], count: 6, range: [40, 60], hints: true, prompt: 'Notes in the spaces. Think All Cows Eat Grass.' }],
  apply: { text: 'A good left hand under a worship song holds the root of each chord. When you can read the bass clef, a hymn gives you the exact bass line, which is often smoother and more interesting than just the chord root.' },
  challenge: { type: 'read', clef: 'bass', pool: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'], count: 10, maxMiss: 2, range: [40, 60], prompt: 'Challenge: ten notes from the whole bass staff, no hints. At most two mistakes.' },
  quiz: [
    q('The four spaces of the bass staff are…', ['A C E G', 'F A C E', 'G B D F', 'E G B D'], 0, 'All Cows Eat Grass: A C E G.'),
    q('The two dots of the bass clef surround which line?', ['The bottom line', 'The middle line', 'The fourth line (F)', 'The top line'], 2, 'They sit either side of F, the fourth line.'),
    staffQ('Which note is written here?', 'bass', 'F3', ['D', 'E', 'F', 'G'], 2, 'This is on the fourth line, between the two dots: F.'),
    staffQ('Which note is written here?', 'bass', 'C3', ['A', 'B', 'C', 'D'], 2, 'This is in the second space from the bottom: C.')
  ]
});

RL.push({
  id: 'ledger-middle-c', cat: 'Reading', title: 'Ledger lines and middle C', minutes: 10,
  why: 'Melodies and bass lines often leave the staff. Ledger lines and a few landmark notes let you read them without counting every line.',
  objective: 'Read notes written on ledger lines near middle C and use landmark notes to find any other note.',
  theory: [
    'When a note is too high or too low for the five lines, short extra lines called ledger lines are added above or below the staff. They follow the same line-space pattern.',
    'Middle C is the key landmark. It sits one ledger line below the treble staff and one ledger line above the bass staff. It is one key, written in two places. D is just below the ledger line in the treble clef; B is just above the bass staff.',
    'Learn three landmarks and read from them: G on the second line of the treble staff, middle C, and F on the fourth line of the bass staff. For any other note, count lines and spaces up or down from the nearest landmark.'
  ],
  visual: { staff: true, range: [48, 84], steps: [
    sv('In the treble clef, middle C sits on a ledger line below the staff and D hangs just below the bottom line.', 'treble', ['C4', 'D4']),
    sv('In the bass clef, the same middle C sits on a ledger line above the staff.', 'bass', ['A3', 'B3', 'C4']),
    sv('On the grand staff: C3, C4 and C5 are three Cs, one octave apart.', 'grand', ['C3', 'C4', 'C5'])
  ] },
  listen: [{ label: 'B3, C4, D4: down below and up above middle C', spec: { kind: 'notes', notes: ['B3', 'C4', 'D4'], d: 0.8 } }],
  play: { type: 'read', clef: 'grand', pool: ['C4', 'D4', 'B3', 'A3', 'E4', 'G3'], count: 6, range: [52, 72], hints: true, prompt: 'Play each note on the grand staff. Middle C sits on its own line between the staves.' },
  practice: [{ type: 'read', clef: 'treble', pool: ['C4', 'D4', 'B3', 'A3', 'E4'], count: 6, range: [57, 72], hints: true, prompt: 'Treble clef with ledger lines below the staff.' }],
  apply: { text: 'Choir parts for altos and tenors live around middle C. Landmark reading is how you skim an unfamiliar hymn and still find your place when the key or the clef changes.' },
  challenge: { type: 'read', clef: 'grand', pool: ['C4', 'D4', 'B3', 'A3', 'E4', 'F4', 'G3', 'F3', 'E3', 'G4'], count: 10, maxMiss: 2, range: [52, 72], prompt: 'Challenge: ten notes around middle C, no hints. At most two mistakes.' },
  quiz: [
    q('What is a ledger line?', ['A short extra line for notes above or below the staff', 'The bar line at the end of a measure', 'A line that connects two staves', 'A line that shows the tempo'], 0, 'Ledger lines extend the staff for higher or lower notes.'),
    q('Middle C is written…', ['One ledger line below the treble staff and one above the bass staff', 'On the top line of the bass staff', 'On the bottom line of the treble staff', 'In the middle space of the treble staff'], 0, 'It is the same key, written in both clefs on a ledger line.'),
    staffQ('Which note is written here?', 'bass', 'C4', ['A', 'B', 'C', 'D'], 2, 'One ledger line above the bass staff is middle C.'),
    staffQ('Which note is written here?', 'grand', 'B3', ['A', 'B', 'C', 'D'], 1, 'This is in the space just above the top line of the bass staff: B.')
  ]
});

RL.push({
  id: 'staff-accidentals', cat: 'Reading', title: 'Sharps, flats and naturals', minutes: 9,
  why: 'Most songs use the black keys. Accidentals are how the music tells you to play them.',
  objective: 'Read sharp, flat and natural signs and play the right key.',
  theory: [
    'A sharp sign (♯) before a note raises it by one half step: the very next key to the right. F♯ is the black key just above F.',
    'A flat sign (♭) lowers a note by one half step: the very next key to the left. B♭ is the black key just below B.',
    'A natural sign (♮) cancels an earlier sharp or flat. An accidental stays in force for the rest of the measure, on that line or space only. At the next bar line the note goes back to normal.'
  ],
  visual: { staff: true, range: [60, 84], steps: [
    sv('F, then F sharp: the next key to the right.', 'treble', ['F4', 'F#4']),
    sv('B, then B flat: the next key to the left.', 'treble', ['B4', 'Bb4']),
    sv('F sharp, then F natural: the natural sign cancels the sharp.', 'treble', ['F#4', 'F4'])
  ] },
  listen: [{ label: 'F then F♯ then F again', spec: { kind: 'notes', notes: ['F4', 'F#4', 'F4'], d: 0.7 } }],
  play: { type: 'read', clef: 'treble', pool: ['F#4', 'Bb4', 'C#5', 'Eb4', 'G#4'], count: 6, range: [60, 76], hints: true, prompt: 'Each note has a sharp or a flat. Play the right black key.' },
  practice: [{ type: 'read', clef: 'treble', pool: ['E4', 'F#4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'], count: 8, range: [64, 76], hints: true, prompt: 'A mix of natural notes and accidentals.' }],
  apply: { text: 'Most worship songs have one or two accidentals on the melody. Spotting a sharp or flat before you get to it prevents the wrong-note moment in front of the congregation.' },
  challenge: { type: 'read', clef: 'treble', pool: ['F#4', 'Bb4', 'C#5', 'Eb4', 'G#4', 'F4', 'B4', 'E5', 'Eb5', 'F#5'], count: 10, maxMiss: 2, range: [60, 78], prompt: 'Challenge: ten notes, no hints. At most two mistakes.' },
  quiz: [
    q('A sharp sign does what to a note?', ['Raises it by a half step', 'Lowers it by a half step', 'Makes it louder', 'Makes it shorter'], 0, 'Sharp means one half step higher.'),
    q('A flat sign does what to a note?', ['Raises it by a half step', 'Lowers it by a half step', 'Cancels a sharp', 'Doubles its length'], 1, 'Flat means one half step lower.'),
    q('How long does an accidental stay in force?', ['Until the end of the measure', 'For one note only', 'For the whole song', 'Until the next rest'], 0, 'It lasts through the measure, on that line or space.'),
    staffQ('Which note is written here?', 'treble', 'Bb4', ['A', 'B♭', 'B', 'C♯'], 1, 'A flat sign before B lowers it by a half step: B♭.')
  ]
});

RL.push({
  id: 'key-signatures-staff', cat: 'Reading', title: 'Key signatures on the staff', minutes: 11, req: ['staff-accidentals', 'major-scale-formula'],
  why: 'The key signature tells you which notes are sharp or flat all the way through a song, so you know your hand position before you play a note.',
  objective: 'Read a key signature, name the major key and play a scale from it.',
  theory: [
    'Instead of writing a sharp or flat each time, the key signature at the start of every line sets them for the whole piece. Every F on the staff is F♯ if there is an F♯ in the key signature.',
    'Sharps always appear in the same order: F C G D A E B. Flats appear in the reverse order: B E A D G C F. One sharp is G major, two sharps D major, three sharps A major. One flat is F major, two flats B♭ major, three flats E♭ major.',
    'To find the key: for sharps, go up a half step from the last sharp. For flats, the second-to-last flat names the key. With one flat, the key is F major.'
  ],
  visual: { staff: true, range: [60, 84], steps: [
    { caption: 'One sharp (F♯): G major. Notice F♯ is not written next to the note: the key signature says it.', hi: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], staff: { clef: 'treble', key: 1, cols: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'].map(n => ({ notes: [n], dur: 'q' })) } },
    { caption: 'Two sharps (F♯, C♯): D major.', hi: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'], staff: { clef: 'treble', key: 2, cols: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'].map(n => ({ notes: [n], dur: 'q' })) } },
    { caption: 'One flat (B♭): F major.', hi: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], staff: { clef: 'treble', key: -1, cols: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'].map(n => ({ notes: [n], dur: 'q' })) } },
    { caption: 'Two flats (B♭, E♭): B♭ major.', hi: ['Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4'], staff: { clef: 'treble', key: -2, cols: ['Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4'].map(n => ({ notes: [n], dur: 'q' })) } }
  ] },
  listen: [{ label: 'G major scale (one sharp)', spec: { kind: 'notes', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], d: 0.5 } }, { label: 'F major scale (one flat)', spec: { kind: 'notes', notes: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], d: 0.5 } }],
  play: { type: 'read', clef: 'treble', key: 1, pool: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5'], count: 8, range: [65, 79], hints: true, prompt: 'Key of G major: one sharp. Every F is F♯. Play each note written.' },
  practice: [{ type: 'read', clef: 'treble', key: -1, pool: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5'], count: 8, range: [65, 77], hints: true, prompt: 'Key of F major: one flat. Every B is B♭.' }],
  apply: { text: 'Worship keys are chosen to suit the singer. When you see the key signature you know at once which black keys are coming, and your hands find their place before the first chord.' },
  challenge: { type: 'read', clef: 'treble', key: 2, pool: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'], count: 10, maxMiss: 2, range: [62, 75], prompt: 'Challenge: key of D major, two sharps, no hints. At most two mistakes.' },
  quiz: [
    q('In what order do sharps appear in a key signature?', ['F C G D A E B', 'B E A D G C F', 'C D E F G A B', 'A B C D E F G'], 0, 'Father Charles Goes Down And Ends Battle: F C G D A E B.'),
    q('A key signature with one sharp is which major key?', ['C major', 'G major', 'F major', 'D major'], 1, 'One sharp (F♯) is G major.'),
    q('A key signature with one flat is which major key?', ['F major', 'G major', 'B♭ major', 'C major'], 0, 'One flat (B♭) is F major.'),
    q('If the key signature has F♯ in it, how do you play every F in the piece?', ['As F♯, unless marked natural', 'As F natural', 'Only the first F is sharp', 'It does not matter'], 0, 'The key signature applies to every F on every octave.')
  ]
});

RL.push({
  id: 'rhythm-notation', cat: 'Reading', title: 'Reading rhythm and time signatures', minutes: 10, req: ['staff-clefs', 'note-values'],
  why: 'Pitch tells you which key to press; rhythm notation tells you when and for how long. Both are needed to play from a page.',
  objective: 'Recognise whole, half, quarter and eighth notes and rests on the staff and read a simple time signature.',
  theory: [
    'The shape of a note shows its length. A whole note is a hollow oval with no stem. A half note is hollow with a stem. A quarter note is filled with a stem. An eighth note is filled with a stem and a flag.',
    'Each note value has a matching rest for silence. The whole rest hangs under a line, the half rest sits on a line, the quarter rest zigzags, and the eighth rest has a flag.',
    'The time signature is two numbers at the start. The top number says how many beats are in each measure; the bottom number says which note gets one beat. In 4/4 there are four quarter-note beats in each measure. Bar lines divide the music into measures.'
  ],
  visual: { staff: true, rhythm: false, range: [60, 84], steps: [
    { caption: 'Whole note (4 beats), half note (2), quarter note (1), eighth note (half a beat).', hi: [], staff: { clef: 'treble', time: [4, 4], cols: [{ notes: ['C5'], dur: 'w' }, { notes: ['C5'], dur: 'h' }, { notes: ['C5'], dur: 'q' }, { notes: ['C5'], dur: 'e' }] } },
    { caption: 'Rests: whole, half, quarter, eighth. Each one is silence for the same length as its note.', hi: [], staff: { clef: 'treble', cols: [{ rest: true, dur: 'w' }, { rest: true, dur: 'h' }, { rest: true, dur: 'q' }, { rest: true, dur: 'e' }] } },
    { caption: 'One measure of 4/4: a half note and two quarter notes make 2 + 1 + 1 = 4 beats.', hi: [], staff: { clef: 'treble', time: [4, 4], cols: [{ notes: ['E5'], dur: 'h' }, { notes: ['D5'], dur: 'q' }, { notes: ['C5'], dur: 'q' }] } }
  ] },
  listen: [{ label: 'Half, quarter, quarter', spec: { kind: 'rhythm', pattern: [2, 1, 1], bpm: 80 } }, { label: 'Quarter, quarter, half', spec: { kind: 'rhythm', pattern: [1, 1, 2], bpm: 80 } }],
  play: { type: 'tap', bpm: 70, bpb: 4, pattern: [2, 1, 1, 1, 1, 2], prompt: 'Tap what you saw: half, quarter, quarter, then quarter, quarter, half.' },
  practice: [{ type: 'tap', bpm: 70, bpb: 4, pattern: [1, 0.5, 0.5, 1, 1, 2, 1, 1], prompt: 'Quarters and eighths. Tap each note as it starts.' }],
  apply: { text: 'Reading rhythm helps you play with a drummer or a choir. When everyone counts the same beats from the page, entrances and cut-offs line up.' },
  challenge: { type: 'tap', bpm: 70, bpb: 4, pattern: [0.5, 0.5, 1, 1, 2, 0.5, 0.5, 1, 2], prompt: 'Challenge: a mix of eighths, quarters and halves at 70 BPM.' },
  quiz: [
    staffQ('How many beats does this note get in 4/4?', 'treble', 'C5', ['1', '2', '3', '4'], 1, 'A hollow note with a stem is a half note: two beats.', 'h'),
    staffQ('How many beats does this note get in 4/4?', 'treble', 'C5', ['1', '2', '3', '4'], 3, 'A hollow oval with no stem is a whole note: four beats.', 'w'),
    staffQ('Which note value is this?', 'treble', 'C5', ['Quarter note', 'Half note', 'Eighth note', 'Whole note'], 2, 'A filled note head with a stem and a flag is an eighth note.', 'e'),
    q('In 3/4 time, the top number 3 means…', ['Three beats in each measure', 'Three measures in the song', 'Three notes at a time', 'Play three times'], 0, 'The top number is the number of beats in each measure.')
  ]
});

RL.push({
  id: 'chord-symbols-reading', cat: 'Reading', title: 'Chords on the staff', minutes: 10, req: ['treble-notes', 'triad-major'],
  why: 'Songbooks write the same chord two ways: a chord symbol above the staff and the exact notes on it. Connecting the two lets you read either.',
  objective: 'Recognise a root-position triad written on the staff and play it, and match it to its chord symbol.',
  theory: [
    'A chord is written as notes stacked on top of each other. A root-position triad sits on three neighbouring lines or three neighbouring spaces. The lowest note is the root, and the chord takes its name from it.',
    'Above the staff, a chord symbol such as C, F, Dm or G7 is a shortcut. The notes on the staff show the exact voicing the arranger wants. When there are both, play the notes, and use the symbol to check you are right.',
    'On the grand staff, the left hand often has a single bass note (the root) in the bass clef while the right hand plays the chord in the treble clef. Read both staves together.'
  ],
  visual: { staff: true, range: [48, 84], steps: [
    sv('C major: C E G, three notes on neighbouring lines or spaces.', 'treble', [['C4', 'E4', 'G4']]),
    sv('F major: F A C. G major: G B D.', 'treble', [['F4', 'A4', 'C5'], ['G4', 'B4', 'D5']]),
    sv('A minor: A C E. Same stacked pattern; the symbol adds an m.', 'treble', [['A4', 'C5', 'E5']]),
    sv('Grand staff: left-hand bass note C3, right-hand chord C E G.', 'grand', [['C3', 'C4', 'E4', 'G4']])
  ] },
  listen: [{ label: 'C major, F major, G major', spec: { kind: 'chords', list: [{ root: 'C', quality: 'major' }, { root: 'F', quality: 'major' }, { root: 'G', quality: 'major' }], d: 1.6 } }],
  play: { type: 'read', clef: 'treble', pool: [['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['A4', 'C5', 'E5']], count: 6, range: [60, 76], hints: true, prompt: 'Play every note of the chord written on the staff together.' },
  practice: [{ type: 'read', clef: 'grand', pool: [['C3', 'C4', 'E4', 'G4'], ['F2', 'F3', 'A3', 'C4'], ['G2', 'G3', 'B3', 'D4']], count: 4, range: [36, 72], hints: true, prompt: 'Left-hand bass note and right-hand chord, together.' }],
  apply: { text: 'Gospel and worship charts usually give you chord symbols only. Reading chords on the staff trains your eye to see the shape of a chord, which helps you voice a symbol well when no notes are written.' },
  challenge: { type: 'read', clef: 'treble', pool: [['E4', 'G4', 'C5'], ['A4', 'C5', 'F5'], ['D4', 'G4', 'B4'], ['C4', 'E4', 'G4']], count: 6, maxMiss: 2, range: [60, 84], prompt: 'Challenge: chords in different positions, no hints. At most two mistakes.' },
  quiz: [
    q('A root-position triad is written as…', ['Three notes on neighbouring lines or neighbouring spaces', 'Three notes in a row, left to right', 'One note with a stem on each side', 'Three notes on a ledger line'], 0, 'Stacked thirds sit on neighbouring lines or spaces.'),
    q('In a root-position triad, the lowest note is the…', ['Root', 'Third', 'Fifth', 'Octave'], 0, 'The chord is named after its lowest note in root position.'),
    q('A chord symbol above the staff is…', ['A shortcut for the chord to play', 'The tempo', 'The key signature', 'A dynamic marking'], 0, 'The symbol names the chord; the notes show the exact voicing.')
  ]
});

RL.push({
  id: 'first-sight-reading', cat: 'Reading', title: 'Your first sight-reading', minutes: 11, req: ['bass-notes', 'treble-notes', 'rhythm-notation'],
  why: 'Sight-reading is playing music you have never seen. Even a little confidence here means you can join in when a new song appears on Sunday morning.',
  objective: 'Use a simple routine to read a short four-note phrase in each clef and keep going without stopping.',
  theory: [
    'The goal of sight-reading is to keep going, not to play perfectly. A wrong note that keeps the beat does less harm than stopping to fix it.',
    'Before you play: check the clef, the key signature and the time signature. Scan for the highest and lowest notes and for any jumps. Then count a bar in your head at a steady slow tempo.',
    'Read in shapes, not letters. A step moves from a line to the next space. A skip moves from line to line. A repeat stays on the same note. Seeing the shape lets you look ahead and let your hands follow.'
  ],
  visual: { staff: true, range: [48, 84], steps: [
    sv('Steps: each note moves to the next line or space.', 'treble', ['C4', 'D4', 'E4', 'F4']),
    sv('Skips: each note jumps from line to line (or space to space).', 'treble', ['C4', 'E4', 'G4', 'E4']),
    sv('Repeats: the same note again. Keep the beat steady.', 'treble', ['G4', 'G4', 'G4', 'G4'])
  ] },
  listen: [{ label: 'A step-wise phrase', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4'], d: 0.6 } }, { label: 'A phrase with skips', spec: { kind: 'notes', notes: ['C4', 'E4', 'G4', 'E4'], d: 0.6 } }],
  play: { type: 'read', clef: 'treble', phrase: 4, pool: ['C4', 'D4', 'E4', 'F4', 'G4'], count: 3, range: [60, 72], hints: true, prompt: 'Read each four-note phrase from left to right and play it. Take your time.' },
  practice: [{ type: 'read', clef: 'bass', phrase: 4, pool: ['C3', 'D3', 'E3', 'F3', 'G3'], count: 3, range: [48, 60], hints: true, prompt: 'The same, in the bass clef.' }],
  apply: { text: 'Open the Practice screen and try the sight-reading drill. It starts easy and moves up as you improve. Ten minutes of reading new notes each day builds speed faster than anything else.' },
  challenge: { type: 'read', clef: 'grand', phrase: 4, pool: ['C3', 'E3', 'G3', 'C4', 'D4', 'E4', 'G4'], count: 3, maxMiss: 3, range: [48, 72], prompt: 'Challenge: phrases across both staves, no hints. At most three mistakes.' },
  quiz: [
    q('What is the main goal of sight-reading?', ['Keep going without stopping', 'Play every note perfectly', 'Play as fast as you can', 'Memorise the piece'], 0, 'Steady time matters more than a perfect first read.'),
    q('What should you check before you start?', ['Clef, key signature and time signature', 'Only the first note', 'The title of the song', 'The page number'], 0, 'These three tell you where your hands go and how to count.'),
    q('A skip in the melody moves from…', ['Line to line, or space to space', 'A line to the next space', 'One note to the same note', 'One staff to another'], 0, 'Steps use the next line or space; skips jump over one.'),
    q('Why look ahead while you play?', ['So your hands are never waiting for your eyes', 'To avoid reading bar lines', 'To read the lyrics', 'To play louder'], 0, 'Your eyes should be ahead of your hands.')
  ]
});

RD.modules = [{ id: 'reading', level: '1', title: 'Reading music', blurb: 'Read the staff, clefs, key signatures and rhythm, and start sight-reading.', lessons: ['staff-clefs', 'treble-notes', 'bass-notes', 'ledger-middle-c', 'staff-accidentals', 'key-signatures-staff', 'rhythm-notation', 'chord-symbols-reading', 'first-sight-reading'] }];
LESSONS.push.apply(LESSONS, RD.lessons);
MODULES.splice(MODULES.findIndex(m => m.id === 'chords') + 1, 0, ...RD.modules);

}

/* ===================== BATCH A · Level 4 · Advanced keyboard =====================
   Fluency in every key, advanced harmony, gospel rhythm styles, hymns, ear and soloing, technique.
   Every challenge here is a timed performance test (type 'perf'): play in time with the click,
   through a tempo ladder, often in several keys. Mastery is proved at the instrument. */
const AV = { lessons: [], modules: [] };
const AL = AV.lessons;
const K12 = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'];   // round the circle in fourths
const KCHURCH = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db'];                             // the keys most church songs live in
const pEx = (id, title, prog, prompt, o) => Object.assign({ type: 'perf', id, title, prog, prompt, base: 'C', beats: 4, ladder: [60, 80, 100] }, o || {});
const tapEx = (bpm, pattern, prompt, o) => Object.assign({ type: 'tap', bpm, bpb: 4, pattern, prompt }, o || {});
const R251 = [vc('Dm9', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('G13', ['G2', 'F4', 'A4', 'B4', 'E5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5'])];

/* ---------------- fluency in every key ---------------- */
AL.push({
  id: 'a-251-keys', cat: 'Fluency', title: 'ii – V – I in all 12 keys', minutes: 20, req: ['g-capstone', 'g-voicing-251'],
  why: 'Worship leaders change key without warning. A player who owns the ii – V – I in every key never freezes.',
  objective: 'Play the ii – V – I with left-hand roots and right-hand rootless voicings in all 12 keys, in time, up to 100 BPM.',
  theory: [
    'You already know the rootless ii – V – I in C: Dm9, G13, Cmaj9. Now the left hand adds the root of each chord and the right hand keeps the same shape. Left: D, G, C. Right: F A C E, then F A B E, then E G B D.',
    'Go round the circle in fourths: C, F, B♭, E♭, A♭, D♭, G♭, B, E, A, D, G. Each key is a fourth above the last, which is the same step as the V going to the I. Your hands learn to move by that interval.',
    'Do not think of note names at speed. Think of the shape: in the ii chord the right hand plays 3 5 7 9 of the chord; into the V only the 7th of the ii falls a half step; into the I every note steps down except the one held.',
    'The test plays one bar of clicks, then expects a new chord on beat 1 of every bar. Play each chord on the beat and hold it. The tempo rises 60, 80, 100 BPM as you pass.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'Dm9: D in the left hand, F A C E in the right.', hi: ['D3', 'F4', 'A4', 'C5', 'E5'] },
    { caption: 'G13: G in the left hand, F A B E in the right. Only C moved to B.', hi: ['G2', 'F4', 'A4', 'B4', 'E5'] },
    { caption: 'Cmaj9: C in the left hand, E G B D in the right.', hi: ['C3', 'E4', 'G4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'ii – V – I in C, then in F', spec: kv([vc('a', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('b', ['G2', 'F4', 'A4', 'B4', 'E5']), vc('c', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('d', ['G2', 'Bb3', 'D4', 'F4', 'A4']), vc('e', ['C3', 'Bb3', 'D4', 'E4', 'A4']), vc('f', ['F2', 'A3', 'C4', 'E4', 'G4'])], 2) }],
  play: vEx(R251, 'Play the ii – V – I in C with the left-hand roots: Dm9, G13, Cmaj9.'),
  practice: [
    pEx('a251-c-f-bb', 'ii – V – I in C, F and B♭', R251, 'In time: C, F and B♭, one chord per bar. Hints stay on while you learn the shapes.', { keys: ['C', 'F', 'Bb'], ladder: [60, 72], hints: true }),
    pEx('a251-eb-ab-db', 'ii – V – I in E♭, A♭ and D♭', R251, 'The church keys: E♭, A♭ and D♭.', { keys: ['Eb', 'Ab', 'Db'], ladder: [60, 72], hints: true })
  ],
  apply: { text: 'Every day, take the key of the day from the Practice screen and play its ii – V – I five times before anything else. In a month the circle of fourths will feel like home.' },
  challenge: pEx('a251-all12', 'ii – V – I in all 12 keys', R251, 'Mastery test: all 12 keys round the circle, one chord per bar, no hints. 60, then 80, then 100 BPM.', { keys: K12, hints: false }),
  quiz: [
    q('In the rootless ii – V – I, which right-hand note moves from Dm9 to G13?', ['C moves down to B', 'F moves to E', 'A moves to G', 'Every note moves'], 0, 'Only the 7th of the ii chord falls a half step.'),
    q('Which order goes round the circle in fourths from C?', ['C, F, B♭, E♭…', 'C, G, D, A…', 'C, D, E, F…', 'C, E♭, F♯, A…'], 0, 'Each key is a fourth above the last.'),
    q('What does the left hand play in this voicing?', ['The root of each chord', 'The melody', 'The 9th', 'Nothing'], 0, 'Root low, colour above.'),
    q('Why practise at a rising tempo ladder?', ['To make the change automatic at real church speeds', 'Because slow is wrong', 'To skip keys', 'It is only a game'], 0, 'Fluency means it holds up at tempo.')
  ]
});

AL.push({
  id: 'a-turnaround-keys', cat: 'Fluency', title: 'The 1 – 6 – 2 – 5 turnaround in every church key', minutes: 18, req: ['a-251-keys'],
  why: 'The turnaround is the glue of gospel music. It carries you back to the top of every verse and chorus.',
  objective: 'Play 1 – 6 – 2 – 5 with dominant VI and V chords in six church keys, two beats per chord, up to 110 BPM.',
  theory: [
    'In C the gospel turnaround is Cmaj7 – A7 – Dm7 – G7. The 6 chord is made dominant (A7 instead of Am7) so it pulls strongly to the 2 chord. That pull is the sound of the church.',
    'Two beats per chord is how it is played in real songs: the turnaround usually fills the last bar or two of a section, so the hands must move twice as fast as in the last lesson.',
    'Spell each key with numbers, not letters: 1 – 6 – 2 – 5. In A♭ that is A♭maj7 – F7 – B♭m7 – E♭7. In D♭ it is D♭maj7 – B♭7 – E♭m7 – A♭7.',
    'Any voicing passes the test as long as the notes are the right chord. Keep the movement small: hold common tones and move the others by step.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: '1: Cmaj7', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: '6 made dominant: A7', chord: { root: 'A', quality: '7', oct: 3 } },
    { caption: '2: Dm7', chord: { root: 'D', quality: 'm7', oct: 4 } },
    { caption: '5: G7', chord: { root: 'G', quality: '7', oct: 3 } }
  ] },
  listen: [{ label: 'Turnaround in C, twice', spec: kchords([cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7'), cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7')], { d: 1 }) }],
  play: cExs([cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7')], 'Play the turnaround in C: Cmaj7, A7, Dm7, G7.'),
  practice: [
    pEx('aturn-c-f', 'Turnaround in C and F', [cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7')], 'Two beats per chord in C and F.', { keys: ['C', 'F'], beats: 2, ladder: [70, 85], hints: true }),
    pEx('aturn-ab-db', 'Turnaround in A♭ and D♭', [cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7')], 'Two beats per chord in A♭ and D♭.', { keys: ['Ab', 'Db'], beats: 2, ladder: [70, 85], hints: true })
  ],
  apply: { text: 'Put a turnaround at the end of every chorus you play this week. Listen for where the band naturally falls back to the top.' },
  challenge: pEx('aturn-church6', 'Turnaround in six church keys', [cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7')], 'Mastery test: C, F, B♭, E♭, A♭ and D♭, two beats per chord, no hints. 80, 95, then 110 BPM.', { keys: KCHURCH, beats: 2, ladder: [80, 95, 110], hints: false }),
  quiz: [
    q('In C, the gospel 1 – 6 – 2 – 5 is…', ['Cmaj7 – A7 – Dm7 – G7', 'C – Am – F – G', 'C – E7 – Am – D7', 'Cmaj7 – Fmaj7 – G7 – C'], 0, 'The 6 chord is made dominant.'),
    q('Why is the 6 chord played as a dominant 7th?', ['It pulls strongly to the 2 chord', 'It is easier', 'It changes key', 'It sounds minor'], 0, 'A7 resolves down a fifth to Dm7.'),
    q('In A♭ the turnaround is…', ['A♭maj7 – F7 – B♭m7 – E♭7', 'A♭ – Fm – D♭ – E♭', 'A♭maj7 – C7 – Fm7 – B♭7', 'A♭ – B♭ – C – D♭'], 0, 'Numbers 1 – 6 – 2 – 5 in A♭.'),
    q('Where does the turnaround usually go?', ['At the end of a section, leading back to the top', 'Only in the intro', 'In the middle of a word', 'Never in worship'], 0, 'It turns the song around to the start.')
  ]
});

AL.push({
  id: 'a-numbers-speed', cat: 'Fluency', title: 'Nashville numbers at speed', minutes: 16, req: ['a-turnaround-keys', 'number-borrowed'],
  why: 'Bands call chords by number. When the leader shouts "four!", you have half a beat to land it in whatever key you are in.',
  objective: 'Play a numbered progression with a borrowed chord in E♭, A♭ and B♭, two beats per chord, up to 110 BPM.',
  theory: [
    'Numbers free you from letter names. 1 – 4 – 5 – 1 is the same song in every key. Minor chords are written 6m or 2m, a flattened chord as ♭7, and a slash shows the bass: 1/3 means the 1 chord with its 3rd in the bass.',
    'The progression here is 1 – 4 – ♭7 – 4 – 1 – 5/7 – 6m – 4. In C: C – F – B♭ – F – C – G/B – Am – F. The ♭7 (B♭ in C) is borrowed from the minor key; it gives the bright, triumphant praise sound.',
    'In E♭: E♭ – A♭ – D♭ – A♭ – E♭ – B♭/D – Cm – A♭. In A♭: A♭ – D♭ – G♭ – D♭ – A♭ – E♭/G – Fm – D♭.',
    'For the 5/7 chord the test only checks the chord notes, but play the 3rd in your left hand: it makes the bass walk down 1 – 7 – 6.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: '1: C', chord: { root: 'C', quality: 'major', oct: 4 } },
    { caption: '♭7: B♭, borrowed from C minor.', chord: { root: 'Bb', quality: 'major', oct: 3 } },
    { caption: '5/7: G with B in the bass, walking down to 6m.', hi: ['B2', 'D4', 'G4', 'B4'] }
  ] },
  listen: [{ label: '1 – 4 – ♭7 – 4 – 1 – 5/7 – 6m – 4 in C', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('Bb', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major', { inv: 1 }), cT('A', 'minor'), cT('F', 'major')], { d: 1 }) }],
  play: cExs([cT('C', 'major'), cT('F', 'major'), cT('Bb', 'major'), cT('F', 'major')], 'In C: 1 – 4 – ♭7 – 4, that is C, F, B♭, F.'),
  practice: [
    pEx('anum-c', 'Numbers in C', [cT('C', 'major'), cT('F', 'major'), cT('Bb', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], 'The full progression in C, two beats per chord.', { beats: 2, ladder: [70, 90], hints: true })
  ],
  apply: { text: 'Ask a friend to call numbers at random while you vamp on the 1 chord. Land each number on the next beat 1, in any key they choose.' },
  challenge: pEx('anum-eb-ab-bb', 'Numbers in E♭, A♭ and B♭', [cT('C', 'major'), cT('F', 'major'), cT('Bb', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], 'Mastery test: 1 – 4 – ♭7 – 4 – 1 – 5 – 6m – 4 in E♭, A♭ and B♭, two beats per chord, no hints. 80, 95, 110 BPM.', { keys: ['Eb', 'Ab', 'Bb'], beats: 2, ladder: [80, 95, 110], hints: false }),
  quiz: [
    q('In E♭, what is the ♭7 chord?', ['D♭', 'D', 'C', 'B♭'], 0, 'A whole step below E♭.'),
    q('What does 5/7 mean?', ['The 5 chord with the 7th note of the key in the bass', 'A 5 chord with a 7th added', 'Play 5 then 7', 'Five beats then seven'], 0, 'In C: G/B.'),
    q('Why use numbers instead of letters?', ['The same chart works in every key', 'They are shorter to write only', 'Letters are wrong', 'Only for drummers'], 0, 'Numbers move with the key.'),
    q('In A♭, what is 6m?', ['Fm', 'F', 'Cm', 'B♭m'], 0, 'The sixth note of A♭ major is F.')
  ]
});

/* ---------------- advanced harmony ---------------- */
AL.push({
  id: 'a-altered', cat: 'Advanced harmony', title: 'Altered dominants: ♭9, ♯9 and ♯5', minutes: 18, req: ['a-251-keys', 'g-tritone-sub'],
  why: 'Altered chords are the tension that makes a gospel resolution feel like arriving home. They are the sound of the seasoned player.',
  objective: 'Voice G7♭9, G7♯9 and G7♯5 and resolve each to C, then play an altered ii – V – i in minor in time.',
  theory: [
    'A dominant 7th can have its 5th and 9th raised or lowered. These altered notes all want to resolve by a half step into the next chord, so they add pull without changing the chord\'s job.',
    'Over G in the left hand: G7♭9 = F A♭ B D (7, ♭9, 3, 5). G7♯9 = B F A♯ D (3, 7, ♯9, 5). G7♯5 = F B D♯ (7, 3, ♯5). Each resolves to C: A♭ falls to G, A♯ rises to B, D♯ rises to E.',
    'In minor keys the ♭9 is natural: the V7♭9 uses notes of the harmonic minor scale. The minor ii – V – i in C is Dm7♭5 – G7♭9 – Cm9.',
    'Use altered chords on the V just before a big resolution: the last chord before the chorus, or the final cadence of a song.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'G7♭9: G low, F A♭ B D above.', hi: ['G2', 'F4', 'Ab4', 'B4', 'D5'] },
    { caption: 'G7♯9: G low, B F A♯ D above.', hi: ['G2', 'B3', 'F4', 'A#4', 'D5'] },
    { caption: 'G7♯5: G low, F B D♯ above.', hi: ['G2', 'F4', 'B4', 'D#5'] },
    { caption: 'Home: Cmaj9.', hi: ['C3', 'E4', 'G4', 'B4', 'D5'] }
  ] },
  listen: [{ label: 'G7♭9 → C, G7♯9 → C, G7♯5 → C', spec: kv([vc('a', ['G2', 'F4', 'Ab4', 'B4', 'D5']), vc('h', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('b', ['G2', 'B3', 'F4', 'A#4', 'D5']), vc('h2', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('c', ['G2', 'F4', 'B4', 'D#5']), vc('h3', ['C3', 'E4', 'G4', 'B4', 'D5'])], 1.8) }],
  play: vEx([vc('G7♭9', ['G2', 'F4', 'Ab4', 'B4', 'D5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5'])], 'Play G7♭9, then resolve to Cmaj9.'),
  practice: [
    vEx([vc('G7♯9', ['G2', 'B3', 'F4', 'A#4', 'D5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('G7♯5', ['G2', 'F4', 'B4', 'D#5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5'])], 'G7♯9 to Cmaj9, then G7♯5 to Cmaj9.'),
    pEx('aalt-minor-c', 'Minor ii – V – i with ♭9 in C', [vc('Dm7♭5', ['D3', 'C4', 'F4', 'Ab4']), vc('G7♭9', ['G2', 'F4', 'Ab4', 'B4', 'D5']), vc('Cm9', ['C3', 'Eb4', 'G4', 'Bb4', 'D5'])], 'Minor ii – V – i in C: Dm7♭5, G7♭9, Cm9. In time.', { ladder: [60, 72], hints: true })
  ],
  apply: { text: 'Find the last V chord before the chorus in a song you play. Try ♭9, then ♯9, then ♯5 on it. Choose the one that suits the song\'s mood and write it on your chart.' },
  challenge: pEx('aalt-minor-keys', 'Minor ii – V – i in C, F and G minor', [vc('Dm7♭5', ['D3', 'C4', 'F4', 'Ab4']), vc('G7♭9', ['G2', 'F4', 'Ab4', 'B4', 'D5']), vc('Cm9', ['C3', 'Eb4', 'G4', 'Bb4', 'D5'])], 'Mastery test: the minor ii – V – i with ♭9 in C, F and G minor, no hints. 60, 75, 90 BPM.', { keys: ['C', 'F', 'G'], ladder: [60, 75, 90], hints: false }),
  quiz: [
    q('Which note makes G7 into G7♭9?', ['A♭', 'A', 'B♭', 'D♯'], 0, 'The 9th of G is A; lowered it is A♭.'),
    q('Where does the ♯5 of G7♯5 (D♯) want to go in C?', ['Up to E', 'Down to D', 'Up to F', 'It stays'], 0, 'Half step up into the 3rd of C.'),
    q('The minor ii – V – i in C is…', ['Dm7♭5 – G7♭9 – Cm9', 'Dm7 – G7 – Cmaj7', 'Am – D – G', 'Fm – B♭ – E♭'], 0, 'Half-diminished ii, altered V, minor i.'),
    q('When are altered dominants most effective?', ['On the V just before a big resolution', 'On every chord', 'Only on the 1 chord', 'Never in church'], 0, 'Tension right before release.')
  ]
});

AL.push({
  id: 'a-upper-structure', cat: 'Advanced harmony', title: 'Upper-structure triads', minutes: 17, req: ['a-altered'],
  why: 'An upper-structure triad lets you play a rich 13th or altered chord with a simple triad shape you already know.',
  objective: 'Play three upper-structure triads over a G7 shell and resolve them, then play them in time in three keys.',
  theory: [
    'Keep the left hand on a G7 shell: G, F, B (root, 7th, 3rd). Then place an ordinary major triad in the right hand. The triad supplies the colour notes.',
    'A major over G7 gives A C♯ E: the 9th, ♯11 and 13th. The result is G13♯11, bright and modern. E♭ major over G7 gives E♭ G B♭: the ♭13, root and ♯9, a dark altered sound. E major over G7 gives E G♯ B: the 13th, ♭9 and 3rd, called G13♭9.',
    'Name them by the distance from the root: A is a step above G (II), E♭ is a minor sixth above (♭VI), E is a sixth above (VI).',
    'Each resolves beautifully to C with the left hand on C and G and the right hand on E G B D.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'G7 shell plus A major: G13♯11.', hi: ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5'] },
    { caption: 'G7 shell plus E♭ major: G7♯9♭13.', hi: ['G2', 'F3', 'B3', 'Eb4', 'G4', 'Bb4'] },
    { caption: 'G7 shell plus E major: G13♭9.', hi: ['G2', 'F3', 'B3', 'E4', 'G#4', 'B4'] }
  ] },
  listen: [{ label: 'Each upper structure, resolving to C', spec: kv([vc('a', ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5']), vc('c', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5']), vc('b', ['G2', 'F3', 'B3', 'Eb4', 'G4', 'Bb4']), vc('c2', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5']), vc('d', ['G2', 'F3', 'B3', 'E4', 'G#4', 'B4']), vc('c3', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5'])], 1.8) }],
  play: vEx([vc('G13♯11', ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5']), vc('Cmaj9', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5'])], 'G7 shell with A major on top, then Cmaj9.'),
  practice: [
    vEx([vc('G7♯9♭13', ['G2', 'F3', 'B3', 'Eb4', 'G4', 'Bb4']), vc('Cmaj9', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5']), vc('G13♭9', ['G2', 'F3', 'B3', 'E4', 'G#4', 'B4']), vc('Cmaj9', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5'])], 'The ♭VI and VI upper structures, each resolving to Cmaj9.')
  ],
  apply: { text: 'Choose one upper structure as your signature V chord this month. Use it at every final cadence until your hands find it without thinking.' },
  challenge: pEx('aust-keys', 'Upper structures in C, F and B♭', [vc('G13♯11', ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5']), vc('Cmaj9', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5']), vc('G7♯9♭13', ['G2', 'F3', 'B3', 'Eb4', 'G4', 'Bb4']), vc('Cmaj9', ['C3', 'G3', 'E4', 'G4', 'B4', 'D5'])], 'Mastery test: V (II triad) – I – V (♭VI triad) – I in C, F and B♭, no hints. 60, 70, 84 BPM.', { keys: ['C', 'F', 'Bb'], ladder: [60, 70, 84], hints: false }),
  quiz: [
    q('Which triad over a G7 shell gives G13♯11?', ['A major', 'E♭ major', 'C major', 'D minor'], 0, 'A C♯ E are the 9th, ♯11 and 13th.'),
    q('E♭ major over G7 adds…', ['♭13, root and ♯9', '9, ♯11, 13', '3, 5, 7', 'Nothing new'], 0, 'E♭ G B♭: dark and altered.'),
    q('What does the left hand play?', ['A G7 shell: G, F, B', 'The triad', 'Only G', 'The melody'], 0, 'The shell states the chord; the triad colours it.'),
    q('Why use upper-structure triads?', ['Rich chords from simple shapes', 'They are easier to read only', 'They avoid the left hand', 'They change the key'], 0, 'Triads you know, sounds you want.')
  ]
});

AL.push({
  id: 'a-dim-wholetone', cat: 'Advanced harmony', title: 'Diminished and whole-tone runs', minutes: 15, req: ['a-altered', 'g-runs'],
  why: 'These two symmetrical scales give the dazzling runs that gospel pianists use to fill a dominant chord before the resolution.',
  objective: 'Play the half-whole diminished scale over G7♭9 and the whole-tone scale over G7♯5, evenly and in time.',
  theory: [
    'The half-whole diminished scale alternates half and whole steps: G A♭ B♭ B C♯ D E F G. It contains every note of G7♭9 and suits it perfectly.',
    'The whole-tone scale moves only in whole steps: G A B C♯ D♯ F G. It contains G7♯5 (G B D♯ F) and has a dreamy, suspended sound.',
    'Both scales repeat their pattern, so a few fingerings cover every key. Play them up to the top note and resolve straight into the next chord, usually the 1.',
    'In time is what matters: an uneven run sounds like a mistake, an even one sounds like mastery. The test checks every note against the click.'
  ],
  visual: { range: [55, 84], steps: [
    { caption: 'Half-whole diminished on G.', hi: ['G4', 'Ab4', 'Bb4', 'B4', 'C#5', 'D5', 'E5', 'F5', 'G5'] },
    { caption: 'Whole-tone on G.', hi: ['G4', 'A4', 'B4', 'C#5', 'D#5', 'F5', 'G5'] }
  ] },
  listen: [{ label: 'Diminished run, then whole-tone run', spec: { kind: 'notes', notes: ['G4', 'Ab4', 'Bb4', 'B4', 'C#5', 'D5', 'E5', 'F5', 'G5', 'G4', 'A4', 'B4', 'C#5', 'D#5', 'F5', 'G5'], d: 0.25 } }],
  play: sEx(['G4', 'Ab4', 'Bb4', 'B4', 'C#5', 'D5', 'E5', 'F5', 'G5'], 'Play the half-whole diminished scale on G, up one octave.', { range: [55, 84] }),
  practice: [
    sEx(['G4', 'A4', 'B4', 'C#5', 'D#5', 'F5', 'G5'], 'Play the whole-tone scale on G.', { range: [55, 84] }),
    pEx('adim-run-slow', 'Diminished run in time', ['G4', 'Ab4', 'Bb4', 'B4', 'C#5', 'D5', 'E5', 'F5'].map(n => vc(n.replace(/\d/, ''), [n], { low: false })).concat([vc('C', ['C5'], { low: false })]), 'One note per click, then land on C.', { beats: 1, ladder: [60, 80], hints: true, range: [55, 84] })
  ],
  apply: { text: 'Over the last V before the chorus, play the diminished run in eighth notes and land on the 1 chord exactly on the downbeat.' },
  challenge: pEx('adim-run', 'Diminished run in eighth notes', ['G4', 'Ab4', 'Bb4', 'B4', 'C#5', 'D5', 'E5', 'F5', 'G5', 'F5', 'E5', 'D5', 'C#5', 'B4', 'Bb4', 'Ab4'].map(n => vc(n.replace(/\d/, ''), [n], { low: false })).concat([vc('G', ['G4'], { low: false })]), 'Mastery test: the diminished scale up and down in eighth notes, no hints. 70, 85, 100 BPM.', { beats: 0.5, ladder: [70, 85, 100], hints: false, range: [55, 84] }),
  quiz: [
    q('The half-whole diminished scale on G starts…', ['G A♭ B♭ B', 'G A B C', 'G A B C♯', 'G B D F'], 0, 'Half step, whole step, repeating.'),
    q('Which chord does the whole-tone scale on G suit?', ['G7♯5', 'Gmaj7', 'Gm7', 'Gsus4'], 0, 'It contains G B D♯ F.'),
    q('Why are these scales easy to move between keys?', ['Their patterns repeat symmetrically', 'They have no black keys', 'They are only three notes', 'They are not'], 0, 'Few fingerings cover every key.'),
    q('What makes a run sound like mastery rather than a mistake?', ['Even timing and a clean landing', 'Playing it as fast as possible', 'Using the pedal', 'Playing it loudly'], 0, 'Evenness and arrival on the beat.')
  ]
});

/* ---------------- gospel rhythm styles ---------------- */
AL.push({
  id: 'a-128-ballad', cat: 'Gospel styles', title: 'The 12/8 gospel ballad', minutes: 16, req: ['g-capstone', 'comping-rhythms'],
  why: 'Many of the most loved gospel ballads and hymns of testimony sit in a slow 12/8. Its rolling triplet feel must live in your body.',
  objective: 'Keep a steady triplet pulse, then play 1 – 3m – 4 – 4m – 1 in a 12/8 feel in time.',
  theory: [
    '12/8 has four big beats per bar, and each big beat is split into three: ONE-and-a TWO-and-a THREE-and-a FOUR-and-a. Count it, sway to it, and the music breathes.',
    'The right hand usually plays the chord on every triplet, softly, while the left hand plays the root on beat 1 and the 5th or the octave on beat 3. The melody floats over the top.',
    'A classic ballad colour: 1 – 3m – 4 – 4m – 1. In C: Cmaj7 – Em7 – Fmaj7 – Fm6 – Cmaj7. The minor 4 (Fm6) is the bittersweet sigh before home.',
    'The tap test checks the triplets. The performance test counts one chord per bar at a slow tempo; keep your triplets going while you change.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Cmaj7', chord: { root: 'C', quality: 'maj7', oct: 4 } },
    { caption: 'Em7', chord: { root: 'E', quality: 'm7', oct: 4 } },
    { caption: 'Fmaj7', chord: { root: 'F', quality: 'maj7', oct: 3 } },
    { caption: 'Fm6: the sigh before home.', chord: { root: 'F', quality: 'm6', oct: 3 } }
  ] },
  listen: [{ label: 'Triplet pulse at 60', spec: { kind: 'rhythm', pattern: [1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 3], bpm: 60 } }, { label: '1 – 3m – 4 – 4m – 1', spec: kchords([cT('C', 'maj7'), cT('E', 'm7'), cT('F', 'maj7'), cT('F', 'm6'), cT('C', 'maj7')], { d: 2.4 }) }],
  play: tapEx(56, Array(12).fill(1 / 3), 'After the count-in, tap three even taps on every click: ONE-and-a TWO-and-a…', { tol: 0.1 }),
  practice: [
    cExs([cT('C', 'maj7'), cT('E', 'm7'), cT('F', 'maj7'), cT('F', 'm6'), cT('C', 'maj7')], 'Play the ballad progression: Cmaj7, Em7, Fmaj7, Fm6, Cmaj7.')
  ],
  apply: { text: 'Take a slow worship song you know in 4/4 and play it in 12/8: same chords, triplets in the right hand. Notice how it becomes more tender.' },
  challenge: pEx('a128', '12/8 ballad progression in C and E♭', [cT('C', 'maj7'), cT('E', 'm7'), cT('F', 'maj7'), cT('F', 'm6'), cT('C', 'maj7')], 'Mastery test: 1 – 3m – 4 – 4m – 1 in C and E♭, one chord per bar, no hints. 46, 54, 62 BPM.', { keys: ['C', 'Eb'], ladder: [46, 54, 62], hints: false }),
  quiz: [
    q('How many big beats are in a bar of 12/8?', ['Four, each split into three', 'Twelve equal beats', 'Three', 'Eight'], 0, 'Four dotted-quarter beats.'),
    q('In C, the 4m chord is…', ['Fm (or Fm6)', 'F', 'Am', 'Dm'], 0, 'The minor four, borrowed from C minor.'),
    q('What does the right hand typically play in a 12/8 ballad?', ['Soft chords on every triplet', 'Only the bass', 'Loud stabs on beat 4', 'Nothing'], 0, 'A rolling triplet bed.'),
    q('Why practise the triplet pulse on its own first?', ['The feel must be steady before the chords are added', 'It is shorter', 'It replaces the chords', 'No reason'], 0, 'Feel first, then harmony.')
  ]
});

AL.push({
  id: 'a-shout', cat: 'Gospel styles', title: 'Shout and praise-break playing', minutes: 18, req: ['a-128-ballad', 'g-runs'],
  why: 'When the church rises in praise, the keyboard drives the fast shout. It needs stamina, steady time and simple, strong chords.',
  objective: 'Play a fast I – IV – I – V praise pattern with left-hand octaves and right-hand off-beat stabs, up to 140 BPM.',
  theory: [
    'Shout music is fast and repetitive on purpose: the church is dancing. Keep the harmony simple, usually 1 – 4 – 1 – 5 or a 1 – 4 vamp, and put all your attention on time and energy.',
    'Left hand: octaves on every beat (C2 and C3 together), moving with the chord. Right hand: short chord stabs on the off-beats, the "and" between the bass notes. Bass ON, chord OFF: boom-chick, boom-chick.',
    'Stamina matters. Keep the wrist loose and the stabs short; play from the arm, not from tense fingers. Start slower than you think and stay steady for a full minute before speeding up.',
    'The test counts one chord every two beats. Play the change on time; the stabs between are for you and the church.'
  ],
  visual: { range: [36, 72], steps: [
    { caption: 'Left hand octave C, right hand C chord on the off-beat.', hi: ['C2', 'C3', 'E4', 'G4', 'C5'] },
    { caption: 'Left hand octave F, right hand F chord.', hi: ['F2', 'F3', 'F4', 'A4', 'C5'] }
  ] },
  listen: [{ label: 'Eighth-note drive at 120', spec: { kind: 'rhythm', pattern: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], bpm: 120 } }, { label: '1 – 4 – 1 – 5', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major')], { d: 1 }) }],
  play: tapEx(110, Array(16).fill(0.5), 'Stamina: tap even eighth notes at 110 BPM for four bars.', { tol: 0.09 }),
  practice: [
    pEx('ashout-slow', 'Shout pattern at practice tempo', [cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major')], 'Two beats per chord. Octaves in the left hand, stabs on the off-beats.', { beats: 2, ladder: [90, 105], hints: true, range: [36, 72] })
  ],
  apply: { text: 'Play the shout pattern along with a fast gospel recording for one full minute without stopping. If your arm tires, slow down and relax rather than stop.' },
  challenge: pEx('ashout', 'Shout pattern in C and A♭', [cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major')], 'Mastery test: 1 – 4 – 1 – 5 twice in C and in A♭, two beats per chord, no hints. 110, 125, 140 BPM.', { keys: ['C', 'Ab'], beats: 2, ladder: [110, 125, 140], hints: false, range: [36, 72] }),
  quiz: [
    q('In shout playing, the right-hand stabs fall…', ['On the off-beats, between the bass notes', 'Only on beat 1', 'On every sixteenth', 'Never'], 0, 'Bass on, chord off.'),
    q('Why keep the harmony simple in a shout?', ['All attention goes to time and energy for the dancing church', 'Complex chords are wrong', 'The keyboard is too quiet', 'To save notes'], 0, 'Groove first.'),
    q('What should the left hand play?', ['Octaves on the beat', 'Rootless voicings', 'Nothing', 'Only the 5th'], 0, 'Strong, low octaves drive it.'),
    q('If your arm tires during a long shout you should…', ['Relax and keep steady, slowing slightly if needed', 'Stop playing', 'Play louder', 'Change key'], 0, 'Steady time is the job.')
  ]
});

AL.push({
  id: 'a-walking-bass', cat: 'Gospel styles', title: 'Walking and octave bass lines', minutes: 16, req: ['g-walk-up', 'g-walk-down'],
  why: 'In many churches the keyboard is also the bass player. A walking left hand makes a small band sound full.',
  objective: 'Walk a bass line through Cmaj7 – A7 – Dm7 – G7 with chord tones and approach notes, one note per beat, in time.',
  theory: [
    'A walking bass plays one note per beat. Beat 1 is the root of the chord. Beats 2 and 3 are other chord or scale notes. Beat 4 is an approach note a step above or below the next root.',
    'Over Cmaj7 – A7 – Dm7 – G7 in C: C D E G, A B C♯ E, D E F A, G A B D♭, back to C. The D♭ on the last beat approaches C from a half step above.',
    'The octave bass is the other left-hand tool: root in two octaves on beat 1 and beat 3. It is strong and simple for faster songs.',
    'This test is for the left hand alone: play only the bass notes, one per click.'
  ],
  visual: { range: [36, 60], steps: [
    { caption: 'Bar 1 over Cmaj7: C D E G.', hi: ['C3', 'D3', 'E3', 'G3'] },
    { caption: 'Bar 2 over A7: A B C♯ E.', hi: ['A2', 'B2', 'C#3', 'E3'] },
    { caption: 'Bar 4 over G7: G A B D♭, approaching C from above.', hi: ['G2', 'A2', 'B2', 'Db3'] }
  ] },
  listen: [{ label: 'The walking line', spec: { kind: 'notes', notes: ['C3', 'D3', 'E3', 'G3', 'A2', 'B2', 'C#3', 'E3', 'D3', 'E3', 'F3', 'A3', 'G2', 'A2', 'B2', 'Db3', 'C3'], d: 0.6 } }],
  play: sEx(['C3', 'D3', 'E3', 'G3', 'A2', 'B2', 'C#3', 'E3'], 'Left hand: the first two bars of the walk.', { range: [36, 60] }),
  practice: [
    sEx(['D3', 'E3', 'F3', 'A3', 'G2', 'A2', 'B2', 'Db3', 'C3'], 'Left hand: bars 3 and 4, landing on C.', { range: [36, 60] })
  ],
  apply: { text: 'Walk the bass under a hymn while your right hand plays the chords on beats 2 and 4. This is the classic church-organ and piano style.' },
  challenge: pEx('awalk', 'Walking bass through the turnaround', ['C3', 'D3', 'E3', 'G3', 'A2', 'B2', 'C#3', 'E3', 'D3', 'E3', 'F3', 'A3', 'G2', 'A2', 'B2', 'Db3', 'C3'].map(n => vc(n.replace(/\d/, ''), [n], { low: false })), 'Mastery test: the whole walking line, one note per click, left hand alone, no hints. 70, 90, 110 BPM.', { beats: 1, ladder: [70, 90, 110], hints: false, range: [36, 60] }),
  quiz: [
    q('In a walking bass, beat 1 of each bar is usually…', ['The root of the chord', 'A random note', 'The 7th', 'A rest'], 0, 'Root on the downbeat.'),
    q('What is an approach note?', ['A note a step above or below the next root', 'The loudest note', 'A note in the right hand', 'The first note of a song'], 0, 'It leads into the next chord.'),
    q('Over G7 going to C, which last-beat note approaches C from a half step above?', ['D♭', 'B', 'D', 'G'], 0, 'D♭ slides down to C.'),
    q('An octave bass plays…', ['The root in two octaves, usually on beats 1 and 3', 'Only the 5th', 'Every scale note', 'The melody'], 0, 'Strong and simple.')
  ]
});

AL.push({
  id: 'a-afro-praise', cat: 'Gospel styles', title: 'African praise grooves on keys', minutes: 15, req: ['a-shout'],
  why: 'Across West and Central Africa, praise music dances. Its syncopated keyboard patterns are a style of their own, not just fast Western gospel.',
  objective: 'Feel the 3 – 3 – 2 rhythm, then drive a fast 1 – 5 praise vamp in time.',
  theory: [
    'Much African and Afro-Caribbean music is built on the 3 – 3 – 2 pattern: eight eighth notes grouped as three, three and two. Accents fall on 1, the "and" of 2, and 4. Clap it until it feels natural.',
    'Fast praise songs often move between just the 1 and the 5 chord (sometimes 1 – 4 – 5), with bright right-hand chord stabs on that 3 – 3 – 2 pattern and a busy, melodic bass line. Styles such as highlife and makossa shaped this sound.',
    'Keep the chords high and light, in the middle of the keyboard, so they cut through the drums and the guitars. Let the bass and the percussion carry the bottom.',
    'Listen to praise music from your own church and region and copy the keyboard pattern by ear. The tap test drills the 3 – 3 – 2; the performance test the fast vamp.'
  ],
  visual: { range: [48, 84], steps: [
    { caption: 'Light stab: C major high in the right hand.', hi: ['C3', 'E5', 'G5', 'C6'] },
    { caption: 'Light stab: G major.', hi: ['G2', 'D5', 'G5', 'B5'] }
  ] },
  listen: [{ label: 'The 3 – 3 – 2 pattern', spec: { kind: 'rhythm', pattern: [1.5, 1.5, 1, 1.5, 1.5, 1], bpm: 100 } }, { label: '1 – 5 vamp', spec: kchords([cT('C', 'major'), cT('G', 'major'), cT('C', 'major'), cT('G', 'major')], { d: 1 }) }],
  play: tapEx(96, [1.5, 1.5, 1, 1.5, 1.5, 1, 1.5, 1.5, 1], 'Tap the 3 – 3 – 2 pattern: ONE (two three) ONE (two three) ONE (two).', { tol: 0.12 }),
  practice: [
    pEx('aafro-slow', '1 – 5 vamp at practice tempo', [cT('C', 'major'), cT('G', 'major')], 'Two beats per chord. Light stabs high, bass low.', { beats: 2, ladder: [96, 110], hints: true, range: [36, 84] })
  ],
  apply: { text: 'Record a praise song from your own church on your phone. Find the keyboard pattern by ear and play along until your stabs lock with the drummer.' },
  challenge: pEx('aafro', '1 – 5 – 1 – 4 – 5 praise vamp in G and A♭', [cT('C', 'major'), cT('G', 'major'), cT('C', 'major'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major')], 'Mastery test: 1 – 5 – 1 – 4 – 5 – 1 in G and A♭, two beats per chord, no hints. 110, 125, 138 BPM.', { keys: ['G', 'Ab'], beats: 2, ladder: [110, 125, 138], hints: false, range: [36, 84] }),
  quiz: [
    q('How is the 3 – 3 – 2 pattern grouped?', ['Eight eighth notes as three, three and two', 'Three beats then two beats', 'Two bars of three', 'Sixteen equal notes'], 0, 'Accents on 1, the and of 2, and 4.'),
    q('Where should the right-hand stabs sit in a fast praise groove?', ['High and light, to cut through drums and guitars', 'Low and heavy', 'Only in the bass', 'Nowhere'], 0, 'Bright stabs in the middle-high register.'),
    q('Fast praise songs often move between…', ['The 1 and the 5 chord, sometimes with the 4', 'Every chord in the key', 'Only minor chords', 'Altered chords'], 0, 'Simple harmony, rich rhythm.'),
    q('What is the best way to learn your region\'s praise style?', ['Listen to local praise music and copy it by ear', 'Read about it only', 'Play every song in 12/8', 'Avoid it'], 0, 'The style lives in the recordings and the church.')
  ]
});

/* ---------------- hymns and congregational playing ---------------- */
AL.push({
  id: 'a-hymn-texture', cat: 'Hymns', title: 'Hymn playing in four parts', minutes: 16, req: ['g-capstone', 'voice-leading'],
  why: 'Hymns are the heart of church music. Playing them in four parts, like a choir, supports a whole congregation singing.',
  objective: 'Play I – IV – I – V – I in four-part hymn texture with smooth voice leading, in time.',
  theory: [
    'A hymnal writes four voices: soprano (the melody, on top), alto, tenor and bass. On the piano the right hand plays soprano and alto, the left hand tenor and bass.',
    'Good four-part writing keeps common tones and moves the other voices by step. I to IV in C: bass C to F, tenor G to A, alto E to F, soprano holds C.',
    'The plagal cadence IV – I is the "Amen" at the end of many hymns. The authentic cadence V – I ends most phrases.',
    'This test checks the exact voicing: four notes, lowest note in the bass. Keep the soprano singing on top.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'I: C3 G3 E4 C5 (bass, tenor, alto, soprano).', hi: ['C3', 'G3', 'E4', 'C5'] },
    { caption: 'IV: F3 A3 F4 C5. The soprano C holds.', hi: ['F3', 'A3', 'F4', 'C5'] },
    { caption: 'V: G2 G3 D4 B4.', hi: ['G2', 'G3', 'D4', 'B4'] }
  ] },
  listen: [{ label: 'I – IV – I – V – I in four parts', spec: kv([vc('a', ['C3', 'G3', 'E4', 'C5']), vc('b', ['F3', 'A3', 'F4', 'C5']), vc('c', ['C3', 'G3', 'E4', 'C5']), vc('d', ['G2', 'G3', 'D4', 'B4']), vc('e', ['C3', 'G3', 'E4', 'C5'])], 1.6) }],
  play: vEx([vc('I', ['C3', 'G3', 'E4', 'C5']), vc('IV', ['F3', 'A3', 'F4', 'C5']), vc('I', ['C3', 'G3', 'E4', 'C5'])], 'I – IV – I in four parts.'),
  practice: [
    vEx([vc('V', ['G2', 'G3', 'D4', 'B4']), vc('I', ['C3', 'G3', 'E4', 'C5']), vc('IV (Amen)', ['F3', 'A3', 'F4', 'C5']), vc('I', ['C3', 'G3', 'E4', 'C5'])], 'V – I, then the Amen: IV – I.')
  ],
  apply: { text: 'Open your hymnal to a hymn in C, F or G. Play only the bass and soprano lines first, then add the inner voices. Sing the melody while you play.' },
  challenge: pEx('ahymn4', 'Four-part I – IV – I – V – I in C, F and G', [vc('I', ['C3', 'G3', 'E4', 'C5']), vc('IV', ['F3', 'A3', 'F4', 'C5']), vc('I', ['C3', 'G3', 'E4', 'C5']), vc('V', ['G2', 'G3', 'D4', 'B4']), vc('I', ['C3', 'G3', 'E4', 'C5'])], 'Mastery test: I – IV – I – V – I in four parts in C, F and G, no hints. 60, 72, 84 BPM.', { keys: ['C', 'F', 'G'], ladder: [60, 72, 84], hints: false }),
  quiz: [
    q('In four-part hymn playing, which voice carries the melody?', ['Soprano', 'Alto', 'Tenor', 'Bass'], 0, 'The top voice.'),
    q('The "Amen" cadence is…', ['IV – I', 'V – I', 'ii – V', 'I – vi'], 0, 'The plagal cadence.'),
    q('From I to IV in C, the soprano C…', ['Holds, because it is common to both chords', 'Jumps an octave', 'Moves to B', 'Stops'], 0, 'Keep common tones.'),
    q('Which hand plays tenor and bass?', ['The left hand', 'The right hand', 'Both hands on soprano', 'Neither'], 0, 'Left hand: the lower two voices.')
  ]
});

AL.push({
  id: 'a-hymn-reharm', cat: 'Hymns', title: 'Reharmonizing a hymn line', minutes: 17, req: ['a-hymn-texture', 'g-substitution'],
  why: 'A fresh harmony on a familiar hymn can make a congregation hear old words in a new way, without changing the tune.',
  objective: 'Play a plain hymn line, then a gospel reharmonization with secondary dominants and a minor iv, in time.',
  theory: [
    'Start from the plain hymn harmony: I – IV – I – V – I. Keep the melody exactly as written and change only the chords under it.',
    'Three reliable moves: put a secondary dominant before a chord (A7 before Dm7), replace IV with ii (Dm7 for F), and add the minor iv before the final I (Fm6 – C).',
    'A full line in C: Cmaj7 – A7 – Dm7 – G7 – Fmaj7 – Fm6 – Cmaj7. Check every chord against the melody note above it. If they clash, choose another substitute.',
    'Reharmonize the last verse, not the first. Let the people sing it plain first, then lift them.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'A7: the secondary dominant leading to Dm7.', chord: { root: 'A', quality: '7', oct: 3 } },
    { caption: 'Fm6: the minor iv before home.', chord: { root: 'F', quality: 'm6', oct: 3 } }
  ] },
  listen: [{ label: 'Plain line', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('C', 'major')], { d: 1.5 }) }, { label: 'Reharmonized line', spec: kchords([cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7'), cT('F', 'maj7'), cT('F', 'm6'), cT('C', 'maj7')], { d: 1.5 }) }],
  play: cExs([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('C', 'major')], 'The plain hymn line: C, F, C, G, C.'),
  practice: [
    cExs([cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7'), cT('F', 'maj7'), cT('F', 'm6'), cT('C', 'maj7')], 'The reharmonized line: Cmaj7, A7, Dm7, G7, Fmaj7, Fm6, Cmaj7.')
  ],
  apply: { text: 'Choose a hymn your church loves. Write the plain chords for the last line, then write a reharmonization under it. Play it on the last verse next Sunday.' },
  challenge: pEx('areharm', 'Reharmonized hymn line in C, F and B♭', [cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7'), cT('F', 'maj7'), cT('F', 'm6'), cT('C', 'maj7')], 'Mastery test: the reharmonized line in C, F and B♭, no hints. 60, 72, 84 BPM.', { keys: ['C', 'F', 'Bb'], ladder: [60, 72, 84], hints: false }),
  quiz: [
    q('When you reharmonize a hymn, what stays the same?', ['The melody', 'The chords', 'The key signature only', 'Nothing'], 0, 'Only the harmony changes.'),
    q('Which chord is a secondary dominant leading to Dm7 in C?', ['A7', 'G7', 'E7', 'Fmaj7'], 0, 'A7 is the V of D.'),
    q('Which verse is usually best to reharmonize?', ['A later verse, after people have sung it plain', 'The first line only', 'Every verse', 'None'], 0, 'Plain first, then lift.'),
    q('What must you check for every new chord?', ['That it does not clash with the melody note', 'That it is loud', 'That it is minor', 'That it uses black keys'], 0, 'The melody leads.')
  ]
});

AL.push({
  id: 'a-congregation', cat: 'Hymns', title: 'Leading congregational singing', minutes: 14, req: ['a-hymn-texture', 'w-follow'],
  why: 'A congregation follows the keyboard more than the leader. A clear introduction and a steady tempo make everyone sing with confidence.',
  objective: 'Play a clear introduction from the last line, set the tempo, and keep it steady through a hymn phrase.',
  theory: [
    'The introduction tells the people three things: the key, the tempo and when to start. The usual intro is the last line of the hymn, ending on the V chord so the first note comes naturally.',
    'Choose the tempo for the words and the room. A large congregation sings slower than a small group. Once set, do not rush and do not drag: the people are breathing with you.',
    'Leave a short breath between verses: hold the last chord, lift your hands for one beat, and start the next verse on the downbeat. Look up at the leader before each verse.',
    'The test plays a line of I – IV – V – I with a held chord at the end. Keep exactly in time; steadiness is the skill.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'End the intro on V so the first note comes naturally.', chord: { root: 'G', quality: '7', oct: 3 } }
  ] },
  listen: [{ label: 'An introduction ending on V', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', '7')], { d: 1.6 }) }],
  play: cExs([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', '7')], 'An introduction in C ending on V7: C, F, C, G7.'),
  practice: [
    tapEx(72, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 'Steady tempo: tap with the click for three bars without drifting.', { tol: 0.1 })
  ],
  apply: { text: 'Before your next service, decide the tempo of each hymn and set it on the metronome. Play the introduction with the click until it is steady, then without.' },
  challenge: pEx('acong', 'Introduction and first line in F and G', [cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', '7'), cT('C', 'major'), cT('F', 'major'), cT('G', '7'), cT('C', 'major')], 'Mastery test: intro (I – IV – I – V7), then a line (I – IV – V7 – I) in F and G, no hints. 66, 76, 88 BPM.', { keys: ['F', 'G'], ladder: [66, 76, 88], hints: false }),
  quiz: [
    q('A hymn introduction usually uses…', ['The last line, ending on the V chord', 'The first chord only', 'A drum solo', 'Silence'], 0, 'It sets key, tempo and the start.'),
    q('A large congregation usually sings…', ['A little slower than a small group', 'Much faster', 'Without any tempo', 'Only in minor'], 0, 'The room shapes the tempo.'),
    q('Between verses you should…', ['Hold, breathe for a beat, and start together on the downbeat', 'Play a long solo', 'Change key every time', 'Stop completely'], 0, 'A shared breath keeps everyone together.'),
    q('Why is steady tempo so important here?', ['The people are breathing and singing with you', 'It looks professional', 'It saves time', 'It is not'], 0, 'You carry the whole room.')
  ]
});

/* ---------------- ear, soloing and technique ---------------- */
AL.push({
  id: 'a-by-ear', cat: 'Ear and soloing', title: 'Playing songs by ear', minutes: 16, req: ['g-capstone', 'major-vs-minor-ear'],
  why: 'Most church music is never written down. Hearing a song and finding its key, bass and chords is the skill every church musician lives on.',
  objective: 'Find the key and the bass line of a progression you hear, then play its chords back without hints.',
  theory: [
    'Step 1, the key: hum the note where the song feels at rest, usually the last note of the chorus. Find it on the keyboard. That is the 1.',
    'Step 2, the bass: listen only to the lowest notes. Most worship songs use the roots 1, 4, 5 and 6. Hum the bass and find each note.',
    'Step 3, the quality: a root of 1, 4 or 5 is usually a major chord, 2, 3 or 6 usually minor. Check by ear: does it sound bright or soft?',
    'Use Practice > Play it back every day. Start with two chords in C and work up to four-chord progressions in other keys.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Most worship songs live on 1, 4, 5 and 6m.', hi: ['C4', 'F4', 'G4', 'A4'] }
  ] },
  listen: [{ label: 'Mystery progression (listen, then play it back)', spec: kchords([cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('G', 'major')], { d: 1.6 }) }],
  play: cExs([cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('G', 'major')], 'Play back the progression from the Listen step. The hints show it this time.'),
  practice: [
    cExs([cT('C', 'major'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major')], 'Without hints: 1 – 4 – 5 – 1 in C. Hear each chord in your head before you play it.', { hints: false })
  ],
  apply: { text: 'Pick one song from last Sunday. Find its key, then its bass line, then its chords, with only the recording to help. Write them as numbers.' },
  challenge: pEx('aear', 'Play back 1 – 6m – 4 – 5 – 1 – 4 – 5 – 1 in time', [cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major')], 'Mastery test: the progression you have been hearing, in C and G, no hints. 70, 85, 100 BPM.', { keys: ['C', 'G'], beats: 2, ladder: [70, 85, 100], hints: false }),
  quiz: [
    q('How do you find the key of a song by ear?', ['Find the note where it feels at rest', 'Count the words', 'Look at the singer', 'Guess C'], 0, 'The home note is the 1.'),
    q('Which bass notes do most worship songs use?', ['1, 4, 5 and 6', 'Only 7', '2 and 3 only', 'Every chromatic note'], 0, 'The core chords of the key.'),
    q('A chord on the 6 is usually…', ['Minor', 'Major', 'Diminished', 'Augmented'], 0, 'In a major key, 6 is minor.'),
    q('What should you listen to first when working out chords?', ['The bass line', 'The cymbals', 'The words', 'The applause'], 0, 'The bass names the chord root.')
  ]
});

AL.push({
  id: 'a-soloing', cat: 'Ear and soloing', title: 'Soloing over changes', minutes: 16, req: ['a-by-ear', 'a-251-keys'],
  why: 'An instrumental solo or a melodic fill should follow the chords, not just a scale. Chord tones and approach notes make it sing.',
  objective: 'Outline Dm7 – G7 – Cmaj7 with chord tones, then add approach notes, in time.',
  theory: [
    'Chord tones are the safest, strongest notes in a solo: the 1, 3, 5 and 7 of each chord. Over Dm7 play D F A C; over G7 play B D F G; over Cmaj7 play E G B C.',
    'The 3rd and 7th are the most important. Aim for them on the strong beats (1 and 3) when the chord changes.',
    'Approach notes add flow: a half step below a chord tone, played just before it. C♯ to D, F♯ to G, B to C.',
    'The test checks every note in time, one per beat. Then improvise freely over the same chords in the Song Lab.'
  ],
  visual: { range: [55, 84], steps: [
    { caption: 'Over Dm7: D F A C.', hi: ['D4', 'F4', 'A4', 'C5'] },
    { caption: 'Over G7: B D F G.', hi: ['B4', 'D5', 'F5', 'G5'] },
    { caption: 'Over Cmaj7: E G B C.', hi: ['E5', 'G5', 'B5', 'C6'] }
  ] },
  listen: [{ label: 'A chord-tone line', spec: { kind: 'notes', notes: ['D4', 'F4', 'A4', 'C5', 'B4', 'G4', 'F4', 'D4', 'E4', 'G4', 'B4', 'D5', 'C5'], d: 0.5 } }],
  play: sEx(['D4', 'F4', 'A4', 'C5', 'B4', 'G4', 'F4', 'D4', 'E4', 'G4', 'B4', 'C5'], 'Play the chord-tone line: up Dm7, down G7, up Cmaj7.', { range: [55, 84] }),
  practice: [
    sEx(['C#4', 'D4', 'F4', 'A4', 'F#4', 'G4', 'B4', 'D5', 'B4', 'C5'], 'With approach notes: C♯ into D, F♯ into G, B into C.', { range: [55, 84] })
  ],
  apply: { text: 'Loop Dm7 – G7 – Cmaj7 in the Song Lab and improvise for two minutes using only chord tones. Then add approach notes. Record yourself and listen back.' },
  challenge: pEx('asolo', 'Chord-tone line in time', ['D4', 'F4', 'A4', 'C5', 'B4', 'G4', 'F4', 'D4', 'E4', 'G4', 'B4', 'D5', 'C5'].map(n => vc(n.replace(/\d/, ''), [n], { low: false })), 'Mastery test: the chord-tone line, one note per click, no hints. 72, 90, 108 BPM.', { beats: 1, ladder: [72, 90, 108], hints: false, range: [55, 84] }),
  quiz: [
    q('Which notes are the chord tones of G7?', ['G B D F', 'G A B C', 'G B D E', 'G C D F'], 0, '1, 3, 5 and 7.'),
    q('Which chord tones are most important to aim for on a chord change?', ['The 3rd and the 7th', 'The root only', 'The 9th', 'Any note'], 0, 'They define the chord.'),
    q('An approach note is usually…', ['A half step below the target note', 'An octave above', 'The loudest note', 'A rest'], 0, 'It leans into the chord tone.'),
    q('Why follow the chords rather than one scale?', ['The line sounds connected to the harmony', 'Scales are wrong', 'It is faster', 'It is not needed'], 0, 'The solo tells the chord story.')
  ]
});

AL.push({
  id: 'a-technique', cat: 'Technique', title: 'Technique: evenness, speed and dynamics', minutes: 15, req: ['g-capstone', 'arpeggio-7ths'],
  why: 'Ideas are only as good as the hands that play them. Even fingers, relaxed speed and controlled volume are what make harmony sound professional.',
  objective: 'Play the C major scale over two octaves in eighth notes, evenly and in time, up to 120 BPM.',
  theory: [
    'Evenness first, speed second. Every note the same length and the same loudness. Play slowly with the click and listen for the uneven note, usually at the thumb crossing.',
    'Relax. Speed comes from loose wrists and small movements, never from tension. If your forearm tightens, stop, shake out and slow down.',
    'Dynamics: on a MIDI keyboard the app hears how hard you play; on screen the lower part of a key plays louder. Practise the scale soft, then loud, then growing from soft to loud.',
    'Do ten minutes of this every day, in the key of the day from the Practice screen. Technique grows by daily repetition, not by long sessions once a week.'
  ],
  visual: { range: [60, 84], steps: [
    { caption: 'C major, two octaves: thumb under after E and B going up.', hi: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'] }
  ] },
  listen: [{ label: 'Two octaves in eighth notes', spec: { kind: 'notes', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'], d: 0.25 } }],
  play: sEx(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'], 'C major up two octaves, fingers 1 2 3, 1 2 3 4, 1 2 3, 1 2 3 4 5.', { fingers: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5], range: [60, 84] }),
  practice: [
    pEx('atech-slow', 'Two octaves in quarter notes', ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'].map(n => vc(n.replace(/\d/, ''), [n], { low: false })), 'One note per click, evenly.', { beats: 1, ladder: [72, 96], hints: true, range: [60, 84] })
  ],
  apply: { text: 'Ten minutes a day: the key-of-the-day scale soft, then loud, then from soft to loud, always with the click. Raise the tempo by 4 BPM only when it is perfectly even.' },
  challenge: pEx('atech', 'C major two octaves in eighth notes', ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'].map(n => vc(n.replace(/\d/, ''), [n], { low: false })), 'Mastery test: up and down two octaves in eighth notes, no hints. 80, 100, 120 BPM.', { beats: 0.5, ladder: [80, 100, 120], hints: false, range: [60, 84] }),
  quiz: [
    q('What comes first in technique practice?', ['Evenness', 'Maximum speed', 'Loudness', 'Pedal'], 0, 'Even first, fast later.'),
    q('Where does speed come from?', ['Relaxed wrists and small movements', 'Tense fingers', 'Pressing harder', 'Holding your breath'], 0, 'Tension is the enemy of speed.'),
    q('How should you raise the tempo?', ['A little at a time, only when it is perfectly even', 'Double it every day', 'Never use a metronome', 'Only on Sundays'], 0, 'Small steps with the click.'),
    q('Why practise every day rather than once a week?', ['Technique grows by daily repetition', 'It is required by law', 'Weekly is better', 'It does not matter'], 0, 'Little and often.')
  ]
});

/* ---------------- advanced project ---------------- */
AL.push({
  id: 'a-project', cat: 'Project', title: 'Advanced project: a full song in two keys', minutes: 25, req: ['a-hymn-reharm', 'a-altered', 'a-shout', 'a-soloing', 'a-technique'],
  why: 'Put everything together: a full arrangement that moves from a gentle ballad to a lifted final chorus in a new key.',
  objective: 'Play a complete arrangement in time: verse, turnaround, chorus, a key change up a whole step, and an altered ending. Record it.',
  theory: [
    'The form: verse (1 – 4 – 1 – 5), turnaround (1 – 6 – 2 – 5), chorus (1 – 4 – 6m – 5), then a lift: the V of the new key (A7, because A is the 5 of D) and the chorus again in D, a whole step higher.',
    'Shape the energy: soft pads in the verse, fuller voicings in the chorus, octave bass and stabs after the key change. End on the V of the new key (try an altered A7♭9) and a rich Dmaj7.',
    'The test plays the whole chord path once, in time, two beats per chord. When you pass, record your own full version with the Record button in the Apply step and send it to your teacher.',
    'Listen back to your recording. Mark one thing to improve, and play it again tomorrow.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Key change: A7 is the V of D, the new key.', chord: { root: 'A', quality: '7', oct: 3 } },
    { caption: 'The chorus again, a whole step higher, in D.', chord: { root: 'D', quality: 'major', oct: 4 } }
  ] },
  listen: [{ label: 'The chord path', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7'), cT('C', 'major'), cT('F', 'major'), cT('A', 'minor'), cT('G', 'major'), cT('A', '7'), cT('D', 'major'), cT('G', 'major'), cT('B', 'minor'), cT('A', '7'), cT('D', 'maj7')], { d: 0.9 }) }],
  play: cExs([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7')], 'Verse and turnaround in C.'),
  practice: [
    cExs([cT('C', 'major'), cT('F', 'major'), cT('A', 'minor'), cT('G', 'major'), cT('A', '7'), cT('D', 'major'), cT('G', 'major'), cT('B', 'minor'), cT('A', '7'), cT('D', 'maj7')], 'Chorus in C, the lift on A7, then the chorus in D ending A7 – Dmaj7.')
  ],
  apply: { text: 'Record your full arrangement, with your own voicings, runs and dynamics. Save the recording and play it to your teacher or music director.', record: true, signoff: true },
  challenge: pEx('aproject', 'Full song path with a key change', [cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('C', 'maj7'), cT('A', '7'), cT('D', 'm7'), cT('G', '7'), cT('C', 'major'), cT('F', 'major'), cT('A', 'minor'), cT('G', 'major'), cT('A', '7'), cT('D', 'major'), cT('G', 'major'), cT('B', 'minor'), cT('A', '7'), cT('D', 'maj7')], 'Mastery test: the whole song path, two beats per chord, no hints. 72, 86, 100 BPM.', { beats: 2, ladder: [72, 86, 100], hints: false }),
  quiz: [
    q('Going up a whole step from C to D, which chord leads into the new key?', ['A7', 'D7', 'G7', 'C7'], 0, 'A7 is the V of D, so it pulls into the new key.'),
    q('How should the energy change after the key change?', ['It grows: fuller voicings, octave bass, stabs', 'It drops to silence', 'It stays the same', 'It slows down'], 0, 'The lift is the climax.'),
    q('What should you do after recording yourself?', ['Listen back and choose one thing to improve', 'Delete it', 'Never listen', 'Post it before listening'], 0, 'Recording is a mirror.'),
    q('Why end with an altered V?', ['Maximum tension before the final release', 'It is easier', 'It changes key', 'No reason'], 0, 'Tension, then home.')
  ]
});

AV.modules = [
  { id: 'a-fluency', level: 'A', title: 'Fluency in every key', blurb: 'ii – V – I, the turnaround and numbered progressions in every key, in time.', lessons: ['a-251-keys', 'a-turnaround-keys', 'a-numbers-speed'] },
  { id: 'a-harmony', level: 'A', title: 'Advanced harmony', blurb: 'Altered dominants, upper-structure triads, diminished and whole-tone runs.', lessons: ['a-altered', 'a-upper-structure', 'a-dim-wholetone'] },
  { id: 'a-styles', level: 'A', title: 'Gospel rhythm styles', blurb: '12/8 ballads, shout and praise break, walking bass and African praise grooves.', lessons: ['a-128-ballad', 'a-shout', 'a-walking-bass', 'a-afro-praise'] },
  { id: 'a-hymns', level: 'A', title: 'Hymns and congregational playing', blurb: 'Four-part hymn playing, reharmonization and leading the congregation.', lessons: ['a-hymn-texture', 'a-hymn-reharm', 'a-congregation'] },
  { id: 'a-ear', level: 'A', title: 'Ear, soloing and technique', blurb: 'Playing by ear, soloing over changes, and daily technique.', lessons: ['a-by-ear', 'a-soloing', 'a-technique'] },
  { id: 'a-proj', level: 'A', title: 'Advanced project', blurb: 'A full arrangement with a key change, recorded.', lessons: ['a-project'] }
];
LESSONS.push.apply(LESSONS, AV.lessons);
MODULES.push(...AV.modules);
LEVELS.push({ id: 'A', name: 'Level 4', title: 'Advanced keyboard', goal: 'Play advanced gospel harmony fluently in time, in every key, at real church tempos, by ear and from a chart.' });

/* ===================== BATCH M · Level 5 · Mastery =====================
   Musical direction, spontaneous ministry, your own sound, recording and releasing your music,
   and the mastery recital. Every lesson ends in a timed performance; the recital is recorded and
   signed off by a teacher or music director. */
const MS = { lessons: [], modules: [] };
const ML = MS.lessons;

ML.push({
  id: 'm-direction', cat: 'Musical direction', title: 'Musical direction: calling the band', minutes: 18, req: ['a-project', 'w-capstone'],
  why: 'A minister of music leads from the keyboard. The band and the singers watch your hands, your eyes and your playing for every change.',
  objective: 'Use clear cues for chords, keys, dynamics and endings, and play a called progression in time without stopping.',
  theory: [
    'Agree a small set of cues with your team and use them every time. Common ones: fingers held up for the chord number (Nashville numbers), a finger pointing up for a key change up, a flat hand pressed down for softer, a raised fist for a stop or a cut, a circling finger for "repeat" or "keep vamping".',
    'Give every cue one bar early. The band needs time to see it and react. Look at the drummer and the bass player first: if they change together, everyone follows.',
    'Your playing is also a cue. A rising bass line or a held V chord tells experienced players a change is coming before any hand moves.',
    'The test plays a progression the way a leader would call it, with a key lift in the middle. Stay in time through every change; a director who stops loses the room.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'A held V tells the band a change is coming.', chord: { root: 'G', quality: '7', oct: 3 } },
    { caption: 'Then the lift: the V of the new key (A7 to go to D).', chord: { root: 'A', quality: '7', oct: 3 } }
  ] },
  listen: [{ label: 'A called progression with a lift', spec: kchords([cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('G', 'major'), cT('A', '7'), cT('D', 'major'), cT('B', 'minor'), cT('G', 'major'), cT('A', 'major')], { d: 1 }) }],
  play: cExs([cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('G', 'major'), cT('A', '7'), cT('D', 'major')], 'Play the called progression and the lift into D.'),
  practice: [
    tapEx(76, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 'Rock-steady pulse for four bars: the band follows your time.', { tol: 0.08 })
  ],
  apply: { text: 'Write your team\'s cue sheet: numbers, key up, softer, louder, stop, repeat, end. Teach it at the next rehearsal and use it for one whole set.' },
  challenge: pEx('mdir', 'Called progression with a key lift', [cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('G', 'major'), cT('C', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('A', '7'), cT('D', 'major'), cT('B', 'minor'), cT('G', 'major'), cT('A', 'major'), cT('D', 'major')], 'Mastery test: the called path with the lift, two beats per chord, in C and in E♭ (lifting to F), no hints. 76, 90, 104 BPM.', { keys: ['C', 'Eb'], beats: 2, ladder: [76, 90, 104], hints: false }),
  quiz: [
    q('When should you give a cue to the band?', ['One bar before the change', 'On the beat of the change', 'After the change', 'Only at the end'], 0, 'They need time to see and react.'),
    q('Whom should you look at first when cueing a change?', ['The drummer and the bass player', 'The congregation', 'The sound engineer', 'Nobody'], 0, 'If the rhythm section moves together, all follow.'),
    q('A raised fist commonly means…', ['Stop or cut', 'Louder', 'Key up', 'Play chord one'], 0, 'Agree cues with your team, but this one is widespread.'),
    q('To lift from C to D, the pivot chord is…', ['A7', 'G7', 'D7', 'C7'], 0, 'A7 is the V of D.')
  ]
});

ML.push({
  id: 'm-arranging', cat: 'Musical direction', title: 'Arranging for band and choir', minutes: 18, req: ['m-direction', 's-harmony'],
  why: 'A great arrangement gives every instrument and every voice its own space. That is what makes a team sound bigger than its size.',
  objective: 'Write choir parts in three-part harmony over a progression and play them in time as voicings.',
  theory: [
    'Give each instrument a register: bass low, keys in the middle, guitar a little above, pads and strings high and long. When two instruments play the same notes in the same place, both get weaker.',
    'Choir parts are usually three voices: soprano (melody or the top harmony), alto and tenor. Keep each voice moving by small steps and keep the parts within singable ranges.',
    'Over C – Am – F – G in C, a simple three-part choir line on top could be: E G C, E A C, F A C, D G B. Each voice moves by a step or holds.',
    'Add one band "hit" (everyone plays a short chord together and stops) at the end of the chorus. Hits are only powerful if they are rare and perfectly together.'
  ],
  visual: { range: [48, 84], steps: [
    { caption: 'C: choir E G C.', hi: ['E4', 'G4', 'C5'] },
    { caption: 'Am: choir E A C. Only G moved, up to A.', hi: ['E4', 'A4', 'C5'] },
    { caption: 'F: choir F A C. Only E moved, up to F.', hi: ['F4', 'A4', 'C5'] },
    { caption: 'G: choir D G B. Each voice steps down.', hi: ['D4', 'G4', 'B4'] }
  ] },
  listen: [{ label: 'Three-part choir line', spec: kv([vc('a', ['C3', 'E4', 'G4', 'C5']), vc('b', ['A2', 'E4', 'A4', 'C5']), vc('c', ['F2', 'F4', 'A4', 'C5']), vc('d', ['G2', 'D4', 'G4', 'B4'])], 1.8) }],
  play: vEx([vc('C', ['E4', 'G4', 'C5'], { low: false }), vc('Am', ['E4', 'A4', 'C5'], { low: false }), vc('F', ['F4', 'A4', 'C5'], { low: false }), vc('G', ['D4', 'G4', 'B4'], { low: false })], 'Play the three choir voices over C – Am – F – G.', { range: [48, 84] }),
  practice: [
    vEx([vc('C', ['C3', 'E4', 'G4', 'C5']), vc('Am', ['A2', 'E4', 'A4', 'C5']), vc('F', ['F2', 'F4', 'A4', 'C5']), vc('G', ['G2', 'D4', 'G4', 'B4'])], 'Add the bass root under each choir chord.')
  ],
  apply: { text: 'Arrange one chorus for your team: write the choir parts, choose a register for each instrument, and place one band hit. Rehearse it and record the result.' },
  challenge: pEx('marr', 'Choir voicings with bass in C, F and G', [vc('C', ['C3', 'E4', 'G4', 'C5']), vc('Am', ['A2', 'E4', 'A4', 'C5']), vc('F', ['F2', 'F4', 'A4', 'C5']), vc('G', ['G2', 'D4', 'G4', 'B4'])], 'Mastery test: the choir voicings with bass, in C, F and G, no hints. 64, 76, 90 BPM.', { keys: ['C', 'F', 'G'], ladder: [64, 76, 90], hints: false }),
  quiz: [
    q('Why give each instrument its own register?', ['So the parts do not cover each other', 'To make it louder only', 'Because of tuning', 'It does not matter'], 0, 'Space makes a small team sound big.'),
    q('A typical choir arrangement has…', ['Three voices: soprano, alto, tenor', 'One voice only', 'Seven voices', 'Only bass voices'], 0, 'SAT is the common church choir texture.'),
    q('How should choir parts move?', ['By small steps or held notes', 'By big leaps', 'Randomly', 'Only in octaves'], 0, 'Singable lines.'),
    q('What makes a band hit powerful?', ['It is rare and perfectly together', 'It happens every bar', 'It is very long', 'Only the drums play it'], 0, 'Precision and surprise.')
  ]
});

ML.push({
  id: 'm-medley', cat: 'Musical direction', title: 'Medleys across keys', minutes: 17, req: ['m-direction', 'w-transitions'],
  why: 'In a flowing service, songs run into each other in different keys. The minister of music makes every transition feel like it was always meant to be.',
  objective: 'Move from C to D♭ to D through pivot dominants, keeping the groove, in time.',
  theory: [
    'The strongest way into any new key is its own V chord. To go to D♭, play A♭7. To go to D, play A7. One bar of the new V, then land on the new 1.',
    'Half-step lifts (C to D♭) are dramatic; whole-step lifts (C to D) are joyful. A lift of a fourth (C to F) feels natural and gentle because C is already the V of F.',
    'Keep the groove going through the change. The drummer can play a fill on the pivot bar while you hold the new V.',
    'The test plays a medley path: a phrase in C, a lift to D♭, a phrase in D♭, a lift to D, and a final phrase in D.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Into D♭: its V, A♭7.', chord: { root: 'Ab', quality: '7', oct: 3 } },
    { caption: 'Into D: its V, A7.', chord: { root: 'A', quality: '7', oct: 3 } }
  ] },
  listen: [{ label: 'C → D♭ → D', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('G', '7'), cT('Ab', '7'), cT('Db', 'major'), cT('Gb', 'major'), cT('A', '7'), cT('D', 'major'), cT('G', 'major'), cT('A', '7'), cT('D', 'major')], { d: 1.1 }) }],
  play: cExs([cT('C', 'major'), cT('F', 'major'), cT('G', '7'), cT('Ab', '7'), cT('Db', 'major')], 'A phrase in C, then A♭7 into D♭.'),
  practice: [
    cExs([cT('Db', 'major'), cT('Gb', 'major'), cT('A', '7'), cT('D', 'major')], 'A phrase in D♭, then A7 into D.')
  ],
  apply: { text: 'Plan your next set as a medley. Write the key of each song and the pivot V between them. Practise only the transitions, ten times each.' },
  challenge: pEx('mmedley', 'Medley C → D♭ → D', [cT('C', 'major'), cT('F', 'major'), cT('G', '7'), cT('Ab', '7'), cT('Db', 'major'), cT('Gb', 'major'), cT('Ab', '7'), cT('A', '7'), cT('D', 'major'), cT('G', 'major'), cT('A', '7'), cT('D', 'major')], 'Mastery test: the full medley path, two beats per chord, no hints. 70, 84, 98 BPM.', { beats: 2, ladder: [70, 84, 98], hints: false }),
  quiz: [
    q('What is the strongest chord to lead into a new key?', ['Its own V chord', 'Its 4 chord', 'Any minor chord', 'The old 1 chord'], 0, 'The V pulls into the new 1.'),
    q('Which chord leads into D♭?', ['A♭7', 'D♭7', 'G7', 'E♭7'], 0, 'A♭ is the 5 of D♭.'),
    q('A lift of a half step (C to D♭) feels…', ['Dramatic', 'Like no change', 'Sad', 'Slower'], 0, 'Small distance, big impact.'),
    q('During the pivot bar the drummer can…', ['Play a fill while the groove continues', 'Stop', 'Change tempo', 'Leave'], 0, 'Keep the energy moving.')
  ]
});

ML.push({
  id: 'm-spontaneous', cat: 'Ministry', title: 'Spontaneous worship at depth', minutes: 16, req: ['m-medley', 'w-spontaneous'],
  why: 'When the leader moves into spontaneous worship, the keyboard must create space for the presence of God: steady, open and responsive, never busy.',
  objective: 'Sustain a two-chord worship vamp over a pedal bass, varying the voicing and dynamics while staying in time.',
  theory: [
    'A vamp is a short pattern repeated for as long as the moment needs. Over a pedal C in the bass, alternate Cmaj9 and F/C. The bass never moves, so the singer can go anywhere.',
    'Vary the voicing, not the chords: move the right hand higher, open it up, add the 6th or 9th, take notes away. Small changes keep the vamp alive for minutes.',
    'Follow the leader\'s voice. Build when the leader builds, pull back to a single pad when the leader prays. Your volume is a ministry tool.',
    'The test asks you to keep the vamp in time for many bars at slow tempos, in three keys. Steady is spiritual here: the room relaxes when the time is sure.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'Cmaj9 over a pedal C.', hi: ['C3', 'E4', 'G4', 'B4', 'D5'] },
    { caption: 'F/C: F major over the same C.', hi: ['C3', 'F4', 'A4', 'C5'] }
  ] },
  listen: [{ label: 'The vamp', spec: kv([vc('a', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('b', ['C3', 'F4', 'A4', 'C5']), vc('c', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('d', ['C3', 'F4', 'A4', 'C5'])], 2.6) }],
  play: vEx([vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('F/C', ['C3', 'F4', 'A4', 'C5'])], 'Cmaj9, then F/C, over a pedal C.'),
  practice: [
    vEx([vc('Cmaj9 high', ['C3', 'G4', 'B4', 'D5', 'E5']), vc('F/C high', ['C3', 'A4', 'C5', 'F5'])], 'The same two chords voiced higher: a lift in energy without changing the harmony.')
  ],
  apply: { text: 'Set a timer for five minutes and vamp without stopping while you pray or sing quietly. Change one thing every few bars: register, a note, or the volume.' },
  challenge: pEx('mspont', 'Worship vamp in C, E♭ and A♭', [vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('F/C', ['C3', 'F4', 'A4', 'C5']), vc('Cmaj9', ['C3', 'E4', 'G4', 'B4', 'D5']), vc('F/C', ['C3', 'F4', 'A4', 'C5'])], 'Mastery test: the vamp in C, E♭ and A♭, one chord per bar, no hints. 56, 64, 72 BPM.', { keys: ['C', 'Eb', 'Ab'], ladder: [56, 64, 72], hints: false }),
  quiz: [
    q('In a pedal vamp, what stays the same?', ['The bass note', 'The right-hand voicing', 'The volume', 'Nothing'], 0, 'The pedal frees the singer.'),
    q('How do you keep a long vamp alive?', ['Vary the voicing and dynamics, not the chords', 'Add many new chords', 'Play faster and faster', 'Stop often'], 0, 'Small changes, same harmony.'),
    q('When the leader begins to pray, the keyboard should…', ['Pull back to a soft pad', 'Play a loud run', 'Change key', 'Stop suddenly'], 0, 'Serve the moment.'),
    q('F/C means…', ['F major with C in the bass', 'F and C together only', 'F minor', 'C major'], 0, 'Slash chords name the bass.')
  ]
});

ML.push({
  id: 'm-reharm-live', cat: 'Ministry', title: 'Reharmonizing live', minutes: 16, req: ['m-spontaneous', 'a-hymn-reharm'],
  why: 'Masters reharmonize in the moment: a passing diminished chord here, a tritone substitution there, always serving the song.',
  objective: 'Turn a plain 1 – 2 – 5 – 1 into a passing-chord line in real time, in three keys, without hints.',
  theory: [
    'Keep three moves ready at all times: a passing diminished chord between two chords a whole step apart (C – C♯dim7 – Dm7), a tritone substitution for the V (D♭7 instead of G7), and a minor iv before the 1 (Fm6 – C).',
    'In C the plain line Cmaj7 – Dm7 – G7 – Cmaj7 becomes Cmaj7 – C♯dim7 – Dm7 – D♭7 – Cmaj7. The bass now walks down chromatically from D to D♭ to C.',
    'Listen to the melody before you substitute. On a long held note the substitutions shine; under busy words keep it simple.',
    'The test is the reharmonized line in three keys, without hints, at real tempo. That is reharmonizing live.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'C♯dim7: the passing chord between C and Dm7.', chord: { root: 'C#', quality: 'dim7', oct: 3 } },
    { caption: 'D♭7: the tritone substitute for G7.', chord: { root: 'Db', quality: '7', oct: 3 } }
  ] },
  listen: [{ label: 'Plain, then reharmonized', spec: kchords([cT('C', 'maj7'), cT('D', 'm7'), cT('G', '7'), cT('C', 'maj7'), cT('C', 'maj7'), cT('C#', 'dim7'), cT('D', 'm7'), cT('Db', '7'), cT('C', 'maj7')], { d: 1.3 }) }],
  play: cExs([cT('C', 'maj7'), cT('C#', 'dim7'), cT('D', 'm7'), cT('Db', '7'), cT('C', 'maj7')], 'The reharmonized line in C: Cmaj7, C♯dim7, Dm7, D♭7, Cmaj7.'),
  practice: [
    cExs([cT('F', 'maj7'), cT('F#', 'dim7'), cT('G', 'm7'), cT('Gb', '7'), cT('F', 'maj7')], 'The same line in F: Fmaj7, F♯dim7, Gm7, G♭7, Fmaj7.')
  ],
  apply: { text: 'Play a simple worship song with its plain chords, then play it again adding one live substitution per line. Record both and compare.' },
  challenge: pEx('mreharm', 'Live reharmonization in C, B♭ and A♭', [cT('C', 'maj7'), cT('C#', 'dim7'), cT('D', 'm7'), cT('Db', '7'), cT('C', 'maj7')], 'Mastery test: the reharmonized line in C, B♭ and A♭, two beats per chord, no hints. 72, 86, 100 BPM.', { keys: ['C', 'Bb', 'Ab'], beats: 2, ladder: [72, 86, 100], hints: false }),
  quiz: [
    q('Which passing chord connects Cmaj7 to Dm7?', ['C♯dim7', 'E7', 'B♭7', 'Fmaj7'], 0, 'It fills the whole step chromatically.'),
    q('The tritone substitute for G7 is…', ['D♭7', 'D7', 'C♯m7', 'A♭maj7'], 0, 'A tritone away, sharing B and F.'),
    q('When do substitutions sound best?', ['Under long held melody notes', 'Under very fast words', 'Never', 'Only in the intro'], 0, 'Give them room.'),
    q('In the reharmonized line, the bass walks…', ['D – D♭ – C', 'C – E – G', 'G – F – E', 'It does not move'], 0, 'Chromatically down to home.')
  ]
});

ML.push({
  id: 'm-signature', cat: 'Your sound', title: 'Your signature sound', minutes: 15, req: ['m-reharm-live', 'a-upper-structure'],
  why: 'Every great minister of music is recognisable in a few bars. Your sound comes from the voicings, runs and grooves you choose again and again.',
  objective: 'Choose and drill your own signature cadence: a voicing for the 2, an altered or upper-structure V, and a rich 1, in time in three keys.',
  theory: [
    'Pick one voicing per function and make it yours: a ii (Dm9 rootless), a V (G13 or an upper structure) and a I (Cmaj9 or C6/9). Use them so often that your hands find them without thinking.',
    'Add one signature run that leads into the I and one rhythm you love. Three or four personal choices, used consistently, are a style.',
    'Listen to the players who move you and copy one idea from each by ear. Then change it until it sounds like you.',
    'Record yourself each month. Your signature is what stays the same from recording to recording.'
  ],
  visual: { range: [36, 84], steps: [
    { caption: 'A signature ii: Dm9 rootless over D.', hi: ['D3', 'F4', 'A4', 'C5', 'E5'] },
    { caption: 'A signature V: G13♯11 (upper structure).', hi: ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5'] },
    { caption: 'A signature I: C6/9.', hi: ['C3', 'E4', 'A4', 'D5', 'G5'] }
  ] },
  listen: [{ label: 'One signature cadence', spec: kv([vc('a', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('b', ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5']), vc('c', ['C3', 'E4', 'A4', 'D5', 'G5'])], 2.2) }],
  play: vEx([vc('Dm9', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('G13♯11', ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5']), vc('C6/9', ['C3', 'E4', 'A4', 'D5', 'G5'])], 'Play this example signature cadence: Dm9, G13♯11, C6/9.'),
  practice: [
    vEx([vc('Gm9', ['G2', 'Bb3', 'D4', 'F4', 'A4']), vc('C13♯11', ['C3', 'Bb3', 'E4', 'D5', 'F#5', 'A5']), vc('F6/9', ['F2', 'A3', 'D4', 'G4', 'C5'])], 'The same cadence in F: Gm9, C13♯11, F6/9.')
  ],
  apply: { text: 'Write your three signature voicings, one run and one groove on a card. Use them in every song this month. Record a short improvisation at the end of the month.', record: true },
  challenge: pEx('msig', 'Signature cadence in C, E♭ and A♭', [vc('Dm9', ['D3', 'F4', 'A4', 'C5', 'E5']), vc('G13♯11', ['G2', 'F3', 'B3', 'A4', 'C#5', 'E5']), vc('C6/9', ['C3', 'E4', 'A4', 'D5', 'G5'])], 'Mastery test: the signature cadence in C, E♭ and A♭, no hints. 60, 72, 84 BPM.', { keys: ['C', 'Eb', 'Ab'], ladder: [60, 72, 84], hints: false }),
  quiz: [
    q('Where does a personal style mostly come from?', ['A few consistent choices of voicings, runs and grooves', 'Playing every possible chord', 'Playing as fast as possible', 'Expensive keyboards'], 0, 'Consistency creates identity.'),
    q('C6/9 contains…', ['C E A D G', 'C E G B', 'C F A C', 'C E♭ G B♭'], 0, 'The 6th and 9th added to C major, no 7th.'),
    q('How should you learn from players you admire?', ['Copy an idea by ear, then change it until it sounds like you', 'Copy everything exactly forever', 'Avoid listening', 'Only read about them'], 0, 'Imitate, then integrate.'),
    q('Why record yourself regularly?', ['To hear what stays consistent and what to improve', 'To fill storage', 'It is not useful', 'Only for social media'], 0, 'The recording is honest feedback.')
  ]
});

ML.push({
  id: 'm-click', cat: 'Producing your music', title: 'Recording to a click like a session player', minutes: 15, req: ['p-capstone', 'm-signature'],
  why: 'When you record your own songs, every part is built on your keyboard track. If it sits perfectly on the click, the whole production stands on rock.',
  objective: 'Play a guide track for a chorus perfectly in time with the click, with a tight timing window.',
  theory: [
    'Producers record the keys or the guide track first, to a click (metronome) at the song\'s tempo. Drums, bass and vocals are then built on it. A wandering guide track makes every later part harder.',
    'Before recording, calibrate the timing on your system (Practice > Timing calibration) and in your DAW. A few milliseconds of delay can make a perfect performance look late.',
    'Play with the click, not just near it. Listen for the click disappearing under your chord: that means you are exactly on it.',
    'This test uses a tighter window than earlier ones. Pass it and your guide tracks are studio-ready.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'The guide track: simple, clear chords exactly on the click.', chord: { root: 'C', quality: 'major', oct: 4 } }
  ] },
  listen: [{ label: 'Click at 72', spec: { kind: 'metro', bars: 2, bpb: 4 } }],
  play: tapEx(72, Array(16).fill(1), 'Tap on every click for four bars; the window is tight.', { tol: 0.06 }),
  practice: [
    pEx('mclick-slow', 'Guide track at a slow tempo', [cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], 'One chord per bar, exactly on beat 1.', { ladder: [66, 72], hints: true, pass: 0.9 })
  ],
  apply: { text: 'Record the guide track for your own song in your DAW with a click. Zoom in on the waveform: are your chords on the grid lines? Re-record until they are.' },
  challenge: pEx('mclick', 'Studio guide track in two keys', [cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('F', 'major'), cT('C', 'major')], 'Mastery test: the guide track in C and A♭, every chord must land (95%), two beats per chord, no hints. 72, 84, 96 BPM.', { keys: ['C', 'Ab'], beats: 2, ladder: [72, 84, 96], hints: false, pass: 0.95 }),
  quiz: [
    q('Which part is usually recorded first in a production?', ['A guide track to a click', 'The final vocal', 'The mastering', 'The artwork'], 0, 'Everything else is built on it.'),
    q('Why calibrate the timing before recording?', ['System delay can make on-time playing look late', 'It changes the key', 'It makes it louder', 'It is not needed'], 0, 'Measure and correct latency.'),
    q('How do you know you are exactly on the click?', ['The click seems to disappear under your chord', 'You hear it clearly before your chord', 'You cannot know', 'The screen turns red'], 0, 'On the click, it hides.'),
    q('What happens if the guide track drifts?', ['Every later part becomes harder to fit', 'Nothing', 'The song gets better', 'The key changes'], 0, 'Timing problems multiply.')
  ]
});

ML.push({
  id: 'm-release', cat: 'Producing your music', title: 'Releasing your music', minutes: 18, req: ['m-click', 's-capstone'],
  why: 'A song becomes a ministry to many when it is released well and your rights are protected, so you can keep creating.',
  objective: 'Know the steps from a finished master to a released song, and play your release-ready chorus in time.',
  theory: [
    'Protect the song. In most countries a song is protected by copyright from the moment it is written down or recorded. Keep dated lyric drafts, charts and voice memos as proof, and agree in writing with any co-writers who owns what share (a split sheet) before release.',
    'Register it. Join your country\'s music copyright or collecting society if there is one; it registers your songs and collects royalties when they are performed in public, broadcast or streamed. Each recording also needs an ISRC code to identify it; most digital distributors can assign one.',
    'Release it. A digital distributor delivers your song to streaming services and download stores. Compare their fees and the share of royalties they keep. Prepare the final master, square cover artwork, the exact title, the credits and the lyrics.',
    'Respect other people\'s rights too. Recording someone else\'s song needs a licence. Hymns old enough to be in the public domain are free to arrange, but modern arrangements and translations of them may still be protected. Rules differ between countries, so check with your collecting society.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Your chorus, release-ready: 1 – 5 – 6m – 4.', chord: { root: 'C', quality: 'major', oct: 4 } }
  ] },
  listen: [{ label: 'A release-ready chorus progression', spec: kchords([cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], { d: 1.6 }) }],
  play: cExs([cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major')], 'Your chorus progression: 1 – 5 – 6m – 4 in C.'),
  practice: [
    cExs([cT('Bb', 'major'), cT('F', 'major'), cT('G', 'minor'), cT('Eb', 'major')], 'The same chorus in B♭, a common key for congregational songs.')
  ],
  apply: { text: 'Make a release checklist for your song: split sheet signed, song registered, ISRC, final master, artwork, credits and lyrics, distributor chosen, release date set. Tick each one.' },
  challenge: pEx('mrelease', 'Chorus in your release key', [cT('C', 'major'), cT('G', 'major'), cT('A', 'minor'), cT('F', 'major'), cT('C', 'major'), cT('G', 'major'), cT('F', 'major'), cT('C', 'major')], 'Mastery test: the chorus in B♭ and E♭ (the keys congregations sing best), two beats per chord, no hints. 72, 84, 96 BPM.', { keys: ['Bb', 'Eb'], beats: 2, ladder: [72, 84, 96], hints: false }),
  quiz: [
    q('When is a song usually protected by copyright?', ['From the moment it is written down or recorded', 'Only after a release', 'Only after it becomes popular', 'Never'], 0, 'Keep dated proof of your work.'),
    q('What does a split sheet record?', ['Each co-writer\'s share of the song', 'The tempo', 'The chords', 'The mixing settings'], 0, 'Agree it before release.'),
    q('What is an ISRC?', ['A code that identifies a recording', 'A type of microphone', 'A chord symbol', 'A streaming service'], 0, 'Distributors can assign one.'),
    q('Recording someone else\'s modern song requires…', ['A licence', 'Nothing at all', 'Only a credit', 'Changing one word'], 0, 'Respect other writers\' rights.')
  ]
});

ML.push({
  id: 'm-recital', cat: 'Recital', title: 'Mastery recital: lead a worship set', minutes: 30, req: ['m-arranging', 'm-medley', 'm-reharm-live', 'm-release'],
  why: 'This is the calling made audible: leading a full set that flows from praise to worship, in several keys, with your own voice as a musician.',
  objective: 'Pass the recital performance test across three keys at real tempo, then record a 15 to 20 minute set and have it signed off by a teacher or music director.',
  theory: [
    'The recital set: an up-tempo praise song, a transition and lift, a mid-tempo song with a turnaround, and a slow worship song ending in a spontaneous vamp. At least three keys, with pivot dominants between them.',
    'Use everything: numbers, voicings, altered dominants, runs, reharmonization, dynamics and cues. But serve the songs first; mastery shows in what you leave out as much as in what you play.',
    'The app tests the harmonic path in time. Then you record the real set, with singers if you can, using the Record button in the Apply step.',
    'Ask a teacher, pastor or music director to listen to the whole recording and sign it off below. Their notes are your next steps. Mastery is a direction you keep walking in.'
  ],
  visual: { range: [48, 72], steps: [
    { caption: 'Praise in C, lift to D♭ with A♭7, worship in D with A7.', chord: { root: 'Ab', quality: '7', oct: 3 } }
  ] },
  listen: [{ label: 'The recital path', spec: kchords([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', '7'), cT('Ab', '7'), cT('Db', 'maj7'), cT('Bb', '7'), cT('Eb', 'm7'), cT('Ab', '7'), cT('A', '7'), cT('D', 'maj7'), cT('G', 'maj7'), cT('D', 'maj7')], { d: 1.2 }) }],
  play: cExs([cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', '7'), cT('Ab', '7')], 'Praise in C, ending on A♭7 to lift.'),
  practice: [
    cExs([cT('Db', 'maj7'), cT('Bb', '7'), cT('Eb', 'm7'), cT('Ab', '7'), cT('A', '7'), cT('D', 'maj7'), cT('G', 'maj7'), cT('D', 'maj7')], 'Turnaround in D♭, the lift with A7, and worship in D.')
  ],
  apply: { text: 'Record your full recital set, 15 to 20 minutes. Then ask your teacher, pastor or music director to listen to all of it and sign it off here.', record: true, signoff: true },
  challenge: pEx('mrecital', 'Recital path across three keys', [cT('C', 'major'), cT('F', 'major'), cT('C', 'major'), cT('G', '7'), cT('Ab', '7'), cT('Db', 'maj7'), cT('Bb', '7'), cT('Eb', 'm7'), cT('Ab', '7'), cT('A', '7'), cT('D', 'maj7'), cT('G', 'maj7'), cT('D', 'maj7')], 'Mastery test: the whole recital path, two beats per chord, no hints. 76, 92, 108 BPM.', { beats: 2, ladder: [76, 92, 108], hints: false }),
  quiz: [
    q('What should a recital set show above all?', ['Serving the songs and the people', 'Every trick you know in every bar', 'Only speed', 'Only loudness'], 0, 'Mastery is also restraint.'),
    q('How do you move from C to D♭ in the set?', ['Through A♭7, the V of D♭', 'Through G7', 'By stopping', 'Through Fmaj7'], 0, 'Pivot dominant.'),
    q('Why ask a teacher or music director to sign off?', ['An experienced listener hears what the app cannot', 'It is only a formality', 'To skip the test', 'No reason'], 0, 'Feel, taste and ministry need human ears.'),
    q('After the recital, mastery is…', ['A direction you keep growing in', 'Finished for ever', 'Only a certificate', 'Not important'], 0, 'Keep walking.')
  ]
});

MS.modules = [
  { id: 'm-md', level: 'M', title: 'Musical direction', blurb: 'Calling the band, arranging for band and choir, and medleys across keys.', lessons: ['m-direction', 'm-arranging', 'm-medley'] },
  { id: 'm-min', level: 'M', title: 'Spontaneous ministry', blurb: 'Deep worship vamps and reharmonizing live.', lessons: ['m-spontaneous', 'm-reharm-live'] },
  { id: 'm-voice', level: 'M', title: 'Your sound and your music', blurb: 'Your signature sound, recording to a click, and releasing your songs.', lessons: ['m-signature', 'm-click', 'm-release'] },
  { id: 'm-rec', level: 'M', title: 'Mastery recital', blurb: 'Lead a full worship set, recorded and signed off.', lessons: ['m-recital'] }
];
LESSONS.push.apply(LESSONS, MS.lessons);
MODULES.push(...MS.modules);
LEVELS.push({ id: 'M', name: 'Level 5', title: 'Mastery', goal: 'Lead, arrange and minister like a seasoned minister of music, and produce and release your own songs.' });

/* order the course: the instrument path first, then worship, advanced, songwriting and production, and mastery last */
const LEVEL_ORDER = ['1', '2', 'G', '3', 'H', 'W', 'A', 'S', 'P', 'M'];
LEVELS.sort((a, b) => LEVEL_ORDER.indexOf(a.id) - LEVEL_ORDER.indexOf(b.id));
MODULES.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

/* ---------- derived structure ---------- */
const byId = {};
LESSONS.forEach(l => { byId[l.id] = l; });
const order = [];
MODULES.forEach(m => m.lessons.forEach(id => order.push(id)));
MODULES.forEach((m, mi) => {
  m.lessons.forEach((id, i) => {
    const l = byId[id];
    l.module = m.id; l.level = m.level; l.index = i;
    if (!l.req) l.req = i > 0 ? [m.lessons[i - 1]] : [];
  });
});

/* a content check the build runs: returns a list of problems */
function validate(Engine) {
  const errs = [];
  const perfIds = new Set();
  const seen = new Set();
  LESSONS.forEach(l => {
    if (seen.has(l.id)) errs.push('duplicate id ' + l.id); seen.add(l.id);
    if (!order.includes(l.id)) errs.push(l.id + ' is not in a module');
    (l.req || []).forEach(r => { if (!byId[r]) errs.push(l.id + ' requires unknown ' + r); });
    ['objective', 'why'].forEach(k => { if (!l[k]) errs.push(l.id + ' missing ' + k); });
    if (!l.theory || !l.theory.length) errs.push(l.id + ' missing theory');
    if (!l.play) errs.push(l.id + ' missing play');
    if (!l.challenge) errs.push(l.id + ' missing challenge');
    if (!l.apply || !l.apply.text) errs.push(l.id + ' missing apply');
    if (!l.quiz || l.quiz.length < 3) errs.push(l.id + ' needs at least 3 quiz questions');
    const exercises = [l.play].concat(l.practice || [], [l.challenge]);
    exercises.forEach((ex, n) => {
      const tag = l.id + ' exercise ' + n;
      if (!ex) return;
      if (ex.type === 'seq') {
        ex.notes.forEach(t => { if (!Engine.parseToken(t)) errs.push(tag + ' bad token ' + t); });
        if (ex.fingers && ex.fingers.length !== ex.notes.length) errs.push(tag + ' fingers length');
        const range = ex.range || [60, 72];
        ex.notes.forEach(t => { const m = Engine.midiOf(t); if (m !== null && (m < range[0] || m > range[1])) errs.push(tag + ' note ' + t + ' outside keyboard range ' + range.join('-')); });
      } else if (ex.type === 'find') {
        ex.names.forEach(t => { if (Engine.pcOfName(t) === null) errs.push(tag + ' bad name ' + t); });
      } else if (ex.type === 'chord') {
        ex.targets.forEach(t => {
          if (t.notes) {
            if (!t.name) errs.push(tag + ' voicing needs a name');
            const ms = t.notes.map(tk => { if (!Engine.parseToken(tk) || Engine.midiOf(tk) === null) { errs.push(tag + ' bad voicing token ' + tk); return 0; } return Engine.midiOf(tk); });
            const r = ex.range || [48, 72];
            ms.forEach((m, i) => { if (m < r[0] || m > r[1]) errs.push(tag + ' voicing note ' + t.notes[i] + ' outside range ' + r.join('-')); });
            return;
          }
          if (!Engine.QUALITIES[t.quality]) errs.push(tag + ' bad quality ' + t.quality);
          if (Engine.pcOfName(t.root) === null) errs.push(tag + ' bad root ' + t.root);
          if (t.bass) {
            const lo = ex.range ? ex.range[0] : 60; const pc = Engine.pcOfName(t.root); let ok = false;
            for (let m = lo; m <= 58; m++) if (((m % 12) + 12) % 12 === pc) ok = true;
            if (!ok) errs.push(tag + ' bass ' + t.root + ' cannot be played low enough in range ' + lo + '-' + (ex.range ? ex.range[1] : 72));
          }
        });
      } else if (ex.type === 'perf') {
        if (!ex.id) errs.push(tag + ' perf needs an id');
        if (!ex.prog || !ex.prog.length) errs.push(tag + ' perf needs a progression');
        if (!ex.ladder || !ex.ladder.length || ex.ladder.some(b => !(b >= 30 && b <= 240))) errs.push(tag + ' perf ladder must be BPMs between 30 and 240');
        (ex.keys || []).forEach(k => { if (Engine.pcOfName(k) === null) errs.push(tag + ' perf bad key ' + k); });
        (ex.prog || []).forEach(t => {
          if (t.notes) { if (!t.name) errs.push(tag + ' perf voicing needs a name'); t.notes.forEach(tk => { if (Engine.midiOf(tk) === null) errs.push(tag + ' perf bad voicing token ' + tk); }); }
          else { if (!Engine.QUALITIES[t.quality]) errs.push(tag + ' perf bad quality ' + t.quality); if (Engine.pcOfName(t.root) === null) errs.push(tag + ' perf bad root ' + t.root); }
        });
        if (ex.id) { if (perfIds.has(ex.id)) errs.push(tag + ' duplicate perf id ' + ex.id); perfIds.add(ex.id); }
      } else if (ex.type === 'tap') {
        if (!ex.pattern || !ex.bpm) errs.push(tag + ' tap needs pattern and bpm');
      } else if (ex.type === 'read') {
        const r = ex.range || [60, 72];
        (ex.pool || []).forEach(it => {
          const ns = it && it.notes ? it.notes : (Array.isArray(it) ? it : [it]);
          ns.forEach(t => { const m = Engine.midiOf(t); if (m === null || m === undefined || !Engine.parseToken(t)) errs.push(tag + ' bad read token ' + t); else if (m < r[0] || m > r[1]) errs.push(tag + ' read note ' + t + ' outside range ' + r.join('-')); });
        });
        if (!ex.pool || !ex.pool.length || !ex.count) errs.push(tag + ' read needs pool and count');
      } else errs.push(tag + ' unknown type ' + ex.type);
    });
    l.quiz.forEach((qq, n) => {
      if (!(qq.a >= 0 && qq.a < qq.o.length)) errs.push(l.id + ' quiz ' + n + ' bad answer index');
      if (new Set(qq.o).size !== qq.o.length) errs.push(l.id + ' quiz ' + n + ' duplicate options');
      if (!qq.why) errs.push(l.id + ' quiz ' + n + ' missing explanation');
    });
    (l.listen || []).forEach(x => { const t = Engine.toEvents(x.spec); if (!t.events.length) errs.push(l.id + ' listen "' + x.label + '" is silent'); });
    l.quiz.forEach(qq => { if (qq.staff) (qq.staff.cols || []).forEach(c => (c.notes || []).forEach(t => { if (Engine.midiOf(t) === null || Engine.midiOf(t) === undefined) errs.push(l.id + ' quiz staff bad token ' + t); })); });
    l.quiz.forEach(qq => { if (qq.listen) { const t = Engine.toEvents(qq.listen); if (!t.events.length) errs.push(l.id + ' quiz listen is silent'); } });
    if (l.visual && l.visual.steps) l.visual.steps.forEach(s => {
      (s.hi || []).forEach(t => { if (!Engine.parseToken(t)) errs.push(l.id + ' visual bad token ' + t); });
      if (s.chord && !Engine.QUALITIES[s.chord.quality]) errs.push(l.id + ' visual bad chord');
      if (s.staff) (s.staff.cols || []).forEach(c => (c.notes || []).forEach(t => { if (Engine.midiOf(t) === null || Engine.midiOf(t) === undefined) errs.push(l.id + ' visual staff bad token ' + t); }));
    });
  });
  /* prerequisite graph must be acyclic */
  const state = {};
  const visit = id => {
    if (state[id] === 1) { errs.push('prerequisite cycle at ' + id); return; }
    if (state[id] === 2) return;
    state[id] = 1; byId[id].req.forEach(visit); state[id] = 2;
  };
  LESSONS.forEach(l => visit(l.id));
  return errs;
}

const Curriculum = { LESSONS, MODULES, LEVELS, ROADMAP, byId, order, validate };
if (typeof module !== 'undefined' && module.exports) module.exports = Curriculum;
else root.Curriculum = Curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
