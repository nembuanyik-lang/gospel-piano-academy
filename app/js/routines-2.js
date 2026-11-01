'use strict';
/* At your piano, part 2: Level 3 and Gospel harmony (progressions, sevenths, colour, harmony, passing chords, voicings, arranging, runs). */
Object.assign(PIANO_ROUTINES, {

/* ============ Progressions ============ */
'progs-keys': { f: 'Play the common progressions in every key.', b: [
  [5, 'I – IV – V – I round the circle', 'C, G, D, A, E, then F, B♭, E♭, A♭, D♭. Right hand closest shapes, left hand roots, 2 beats per chord at 70. Pause between keys only to think, not during.'],
  [4, '1 – 5 – 6m – 4', 'In the church keys: C, D♭, E♭, F, G, A♭, B♭. Two rounds each.'],
  [3, '1 – 6m – 2m – 5', 'In the same keys. Say the chord names before you play each key.'],
  [3, 'Weak key', 'Pick the key that felt slowest today and play all three progressions in it five times.']
], r: 'All three progressions in at least six keys at 70 without stopping inside a key.' },

'progs-minor': { f: 'Minor-key progressions with a strong V7.', b: [
  [4, 'i – iv – V7 – i', 'Am – Dm – E7 – Am, then Em – Am – B7 – Em, Dm – Gm – A7 – Dm. Left hand roots, 2 beats each at 70.'],
  [4, 'i – VI – III – VII', 'Am – F – C – G, then Em – C – G – D. A common worship sound in minor.'],
  [4, 'ii° – V – i', 'Bm7♭5 – E7 – Am, then F♯m7♭5 – B7 – Em. Play slowly and listen to the pull.'],
  [3, 'Song in minor', 'Play a minor gospel song you know, or make a four-bar loop with i – iv – V7 – i and sing over it.']
], r: 'Three minor progressions in A, E and D minor at 70.' },

'chord-charts': { f: 'Read and play from a chord chart, including slash chords.', b: [
  [4, 'Slash chords', 'C/E, F/A, G/B, C/G, F/C: right hand plays the chord, left hand the note after the slash. Play C – G/B – Am – F, a common descending bass.'],
  [4, 'Read a chart', 'Write (or open) a chart with 16 bars and repeat signs. Play through it with the metronome at 70, counting bars.'],
  [4, 'Number chart', 'Convert the chart to numbers (C = 1, F = 4, G = 5…), then play it in F and G using only the numbers.'],
  [3, 'Two passes', 'Play the chart twice without stopping: first simple (roots + triads), second with sevenths.']
], r: 'You play a 16-bar chord chart with slash chords, in two keys, without stopping.' },

'transpose-basic': { f: 'Move a simple song to a new key.', b: [
  [4, 'Numbers first', 'Take a song in C (C – F – G – Am). Write it in numbers: 1 – 4 – 5 – 6m.'],
  [5, 'Move it', 'Play it in D, E♭, F, G and A♭ using the numbers. Say the chord names aloud for each key before playing.'],
  [3, 'Singer\'s key', 'Sing the song. If it is too high or low, move it down or up one step and play it there.'],
  [3, 'Melody too', 'Play the first line of the melody in the new key (start on the same scale number).']
], r: 'You can move a four-chord song to any of five keys within a minute.' },

'transpose-sevenths': { f: 'Transpose a seventh-chord turnaround to any key.', b: [
  [4, 'Shape memory', 'Cmaj7 – Am7 – Dm7 – G7 with smooth voicings. Feel the hand shape, not the note names.'],
  [5, 'Move by half steps', 'Play the same turnaround in D♭, D, E♭, E and F, keeping the same shape. Metronome 60.'],
  [3, 'Jump keys', 'Play it in F, then B♭, then E♭, then A♭ (round the circle of fourths).'],
  [3, 'Key of the day', 'Use the app\'s key of the day and play the turnaround there 8 times.']
], r: 'The seventh-chord turnaround in six keys at 60.' },

/* ============ Seventh chords ============ */
'sevenths-deep': { f: 'Half-diminished and diminished sevenths, and their use.', b: [
  [4, 'Build them', 'Bm7♭5 (B D F A) and B°7 (B D F A♭). Then on C, D, E, F♯ and G♯.'],
  [4, 'Diminished is symmetrical', 'C°7 = C E♭ G♭ A. Move it up a minor 3rd: same notes. There are only three diminished-7th chords. Play all three.'],
  [4, 'In progressions', 'Bm7♭5 – E7 – Am (minor ii – V – i). Then C – C♯°7 – Dm7 (passing). Then F – F♯°7 – C/G.'],
  [3, 'Hear them', 'Play each type with eyes closed and name it: m7♭5 sounds dark but open; °7 sounds tense.']
], r: 'You build any m7♭5 or °7 and use both in a progression.' },

'sevenths-in-key': { f: 'Seventh chords on every degree of the key.', b: [
  [4, 'Up the scale in C', 'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5 Cmaj7. Right hand, then hands together with root in the left. Say "1 2 3 4 5 6 7".'],
  [4, 'In F and G', 'Same in F (Fmaj7 Gm7 Am7 B♭maj7 C7 Dm7 Em7♭5) and in G.'],
  [4, 'Number calls', 'Call 1 – 4 – 2 – 5, 1 – 6 – 2 – 5, 3 – 6 – 2 – 5 – 1 and play them in C, F and G with sevenths.'],
  [3, 'Voicing smoothly', 'Choose voicings so each chord moves to the next by the smallest step. Play 1 – 6 – 2 – 5 – 1 eight times.']
], r: 'Seventh chords on all seven degrees in C, F and G, and number calls with sevenths.' },

'dominant-resolution': { f: 'Resolve dominant sevenths smoothly.', b: [
  [4, 'The tritone', 'G7: B and F are the tension. Play B–F, then resolve to C–E. Hear the "home" feel. Do it on every V7 – I in the circle.'],
  [4, 'V7 – I in keys', 'G7 – C, D7 – G, A7 – D, C7 – F, F7 – B♭, B♭7 – E♭, E♭7 – A♭. Smooth voicings, 2 beats each.'],
  [4, 'Secondary pull', 'C – A7 – Dm (A7 pulls to Dm), C – E7 – Am, C – D7 – G.'],
  [3, 'In a hymn', 'Find V7 – I endings in a hymn and play them with the 7th resolving down a step.']
], r: 'V7 – I in seven keys with the 7th moving down a step every time.' },

'seventh-inversions': { f: 'Seventh chords in all four positions.', b: [
  [4, 'G7 four ways', 'G B D F, B D F G, D F G B, F G B D. Up and down at 60. Then Cmaj7 and Am7.'],
  [4, 'Smooth ii – V – I', 'Dm7 (root) → G7 (3rd inversion: F G B D) → Cmaj7/E (1st inversion). Find the shapes where fingers barely move.'],
  [4, 'Bass with inversions', 'Left hand plays the bass note of each inversion: C – C7/B♭ – F/A – Fm/A♭ – C/G. A gospel descending line.'],
  [3, 'Keys', 'The ii – V – I with inversions in F and B♭.']
], r: 'All four positions of G7, Cmaj7 and Am7, and a ii – V – I with no big jumps.' },

/* ============ Colour chords ============ */
'sus-chords': { f: 'Use sus2 and sus4 for colour and lift.', b: [
  [4, 'Build', 'Csus2 (C D G), Csus4 (C F G), C. Play sus4 → major, then sus2 → major, on C, F, G and D.'],
  [4, 'The lift', 'Gsus4 – G – C. Then G7sus4 – G7 – C. Slowly and softly, like the end of a prayer.'],
  [4, 'Pads', 'Hold Csus2 – Fsus2 – Gsus4 – G for 8 beats each with a low octave: a worship pad sound.'],
  [3, 'In keys', 'Play 5sus4 – 5 – 1 in F, B♭, E♭ and A♭.']
], r: 'sus4 – major resolutions in five keys and a worship pad progression.' },

'sixth-chords': { f: 'Sixth and minor sixth chords in gospel endings and grooves.', b: [
  [4, 'Build', 'C6 (C E G A), Cm6 (C E♭ G A), F6, Fm6. Hear how the 6th is sweet and the minor 6th is warm.'],
  [4, 'Endings', 'C – C6 for a final chord; F – Fm6 – C (the gospel "minor four" ending).'],
  [4, 'Groove', 'Left hand C, right hand alternates C and C6 on eighths (C E G / C E A). Then on F and G. A shuffle-style vamp.'],
  [3, 'Keys', 'IV – iv6 – I in F, B♭, E♭ and A♭.']
], r: 'IV – iv6 – I in five keys, and a C – C6 vamp at 90.' },

'ninth-chords': { f: 'Add9, maj9, m9 and dominant 9 voicings.', b: [
  [4, 'Build on C', 'Cadd9 (C E G D), Cmaj9 (C E G B D), Cm9 (C E♭ G B♭ D), C9 (C E G B♭ D). Left hand root, right hand the rest (drop the 5th if it is too much).'],
  [4, 'Turnaround with 9ths', 'Cmaj9 – Am9 – Dm9 – G9 (or G13). Right-hand shapes close together. 8 rounds at 70.'],
  [4, 'Keys', 'Same turnaround in F and B♭.'],
  [3, 'Worship pad', 'Fmaj9 (low F, right hand A C E G) held under a slow song. Then Gadd9 and Am9.']
], r: 'A 9th-chord turnaround in C, F and B♭ at 70.' },

'extended-chords': { f: 'Elevenths and thirteenths that sound good.', b: [
  [4, 'G13', 'Left hand G (and F), right hand B E (13th) and the 9th A: G – F | A B E. Play G13 – Cmaj9 eight times.'],
  [4, 'Sus11 colour', 'Left hand C, right hand B♭ D F (C11 = C9sus4). Then resolve to C9. Use it as a 5-chord: C11 – Fmaj9.'],
  [4, 'Turnaround with extensions', 'Dm11 – G13 – Cmaj9 – A7(♭13). Smooth top notes.'],
  [3, 'Keys', 'G13 – Cmaj9 in F (C13 – Fmaj9) and B♭ (F13 – B♭maj9).']
], r: 'G13 → Cmaj9 and a full 2 – 5 – 1 with extensions in three keys.' },

/* ============ Harmony ============ */
'roman-numerals': { f: 'Think and play in Roman numerals.', b: [
  [4, 'Say and play', 'In C: I ii iii IV V vi vii°. Say each numeral and play the chord. Then with sevenths.'],
  [4, 'Analyse a song', 'Take a song you play at church. Write its chords as Roman numerals. Play it from the numerals in C.'],
  [4, 'Different keys', 'Play the same numerals in D and A♭.'],
  [3, 'Common patterns', 'I – IV – V, ii – V – I, I – vi – IV – V, IV – V – iii – vi. Play each in E♭.']
], r: 'You analyse a church song in numerals and play it in three keys.' },

'number-borrowed': { f: 'Number system and borrowed chords.', b: [
  [4, 'Numbers fast', 'In G, call 1 – 4 – 6 – 5, 2 – 5 – 1, 1 – 3 – 4 – 5 and play instantly.'],
  [4, 'Borrowed 4 minor', 'In C: F – Fm – C (4 – 4m – 1). In G: C – Cm – G.'],
  [4, 'Flat 7 and flat 6', 'C – B♭ – F – C (♭7). C – A♭ – B♭ – C (♭6 – ♭7 – 1): the "victory" ending.'],
  [3, 'Use them', 'Play a song ending with 4 – 4m – 1, then with ♭6 – ♭7 – 1.']
], r: 'Borrowed 4m, ♭7 and ♭6 – ♭7 – 1 in C and G, on call.' },

'voice-leading': { f: 'Move between chords with the smallest finger movement.', b: [
  [4, 'Common tones', 'C → Am: keep C and E, move G to A. C → F: keep C, move E to F and G to A. Play each change 8 times.'],
  [4, 'Turnaround', 'Cmaj7 – Am7 – Dm7 – G7 with the top note moving by step only. Then the same with a different top note.'],
  [4, 'Contrary motion', 'Left hand walks down C, B, A, F while the right-hand top note walks up E, G, A, C: C (C E G) – G/B (B D G) – Am (C E A) – F (F A C). Play slowly and listen to the two lines moving apart.'],
  [3, 'Hymn', 'Play a hymn line with your own chords, choosing every voicing for the smallest movement.']
], r: 'A turnaround where no voice jumps more than a step.' },

'two-five-one': { f: 'The ii – V – I in the main keys.', b: [
  [4, 'Shapes', 'Dm7 – G7 – Cmaj7. Shape A: Dm7 (F A C E) – G7 (F A B D) – Cmaj7 (E G B D). Left hand roots. 8 rounds at 70.'],
  [4, 'Second shape', 'Start from the other position: Dm7 (C E F A) – G7 (B D F A)… Find it and play 8 rounds.'],
  [4, 'Keys', 'In F (Gm7 – C7 – Fmaj7), B♭ (Cm7 – F7 – B♭maj7), E♭ (Fm7 – B♭7 – E♭maj7).'],
  [3, 'Down in whole steps', 'C, B♭, A♭, G♭, E, D: ii – V – I in each, one bar per chord.']
], r: 'ii – V – I with both shapes in C, F, B♭ and E♭ at 70.' },

'minor-two-five-one': { f: 'The minor ii – V – i.', b: [
  [4, 'In A minor', 'Bm7♭5 – E7(♭9) – Am7. Left hand roots. 8 rounds at 60.'],
  [4, 'Keys', 'In D minor (Em7♭5 – A7 – Dm7), E minor (F♯m7♭5 – B7 – Em7), C minor (Dm7♭5 – G7 – Cm7).'],
  [4, 'Major and minor', 'Play Dm7 – G7 – C, then Dm7♭5 – G7 – Cm. Hear the difference.'],
  [3, 'Use it', 'In C major, go to the 6m chord with its own minor ii – V: Bm7♭5 – E7 – Am7.']
], r: 'Minor ii – V – i in four keys at 60.' },

'bass-movement': { f: 'Bass lines that move between chords.', b: [
  [4, 'Descending bass', 'C – G/B – Am – Am/G – F – C/E – Dm – G. Left hand walks down the scale. 8 bars at 70.'],
  [4, 'Ascending bass', 'C – C/E – F – F♯°7 – C/G – A7 – Dm7 – G7.'],
  [4, 'Pedal', 'Left hand holds G while right hand plays F/G – C/G – Dm/G – G. Then on C.'],
  [3, 'Your own', 'Make an 8-bar bass line for 1 – 6 – 4 – 5 that moves by step as much as possible.']
], r: 'Descending, ascending and pedal bass lines at 70 in C, then in F.' },

/* ============ Passing chords ============ */
'g-passing-dim': { f: 'Passing diminished chords between scale chords.', b: [
  [4, 'Up the scale', 'C – C♯°7 – Dm7 – D♯°7 – Em7. Left hand moves up by half step. 2 beats each at 70.'],
  [4, 'Inside the turnaround', 'Cmaj7 – C♯°7 – Dm7 – G7. Then F – F♯°7 – C/G.'],
  [4, 'Keys', 'In F: F – F♯°7 – Gm7 – C7. In B♭: B♭ – B°7 – Cm7 – F7.'],
  [3, 'In a song', 'Choose a song with 1 to 2m and add the passing diminished every time.']
], r: 'Passing diminished chords in three keys inside a turnaround.' },

'g-chromatic-approach': { f: 'Chromatic approach chords (from a half step above or below).', b: [
  [4, 'From above', 'D♭7 – C, E♭m7 – Dm7, A♭7 – G7. Play each target with its approach chord a half step above.'],
  [4, 'From below', 'B – C, C♯m7 – Dm7, F♯7 – G7.'],
  [4, 'In a progression', 'Cmaj7 – E♭m7 – Dm7 – D♭7 – Cmaj7. Smooth and short approach chords (half a beat or one beat).'],
  [3, 'Keys', 'The same pattern in F and E♭.']
], r: 'Approach chords from above and below at 80 without losing the beat.' },

'g-secondary-dominants': { f: 'Secondary dominants: the "five of" each chord.', b: [
  [4, 'Five of each', 'A7 → Dm, B7 → Em, C7 → F, D7 → G, E7 → Am. Play each pair 4 times in C.'],
  [4, 'Chain', 'C – E7 – Am – A7 – Dm – D7 – G7 – C: dominants leading to dominants.'],
  [4, 'Keys', 'In F: F – A7 – Dm – D7 – Gm – C7 – F. In B♭.'],
  [3, 'Song', 'Add a secondary dominant before the 6m or 2m chord in a song you play.']
], r: 'The chain of secondary dominants in C, F and B♭.' },

'g-tritone-sub': { f: 'Tritone substitution: D♭7 for G7.', b: [
  [4, 'Hear it', 'Dm7 – G7 – C, then Dm7 – D♭7 – C. The bass slides down by half step.'],
  [4, 'Every V', 'In a turnaround, replace each V with its tritone sub: Cmaj7 – E♭7 – Dm7 – D♭7 – Cmaj7.'],
  [4, 'Keys', 'In F: Gm7 – G♭7 – Fmaj7. In B♭: Cm7 – B7 – B♭maj7. In E♭: Fm7 – E7 – E♭maj7.'],
  [3, 'Mix', 'Alternate: first time G7, second time D♭7. Choose which sounds best for the song.']
], r: 'Tritone subs in four keys inside a ii – V – I.' },

'g-walk-up': { f: 'Bass walk-ups from 1 to 4 and 1 to 6.', b: [
  [4, '1 to 4', 'C – C/E – F: left hand C D E F with chords on top. Then with passing chords: C – Dm7 – C/E – F.'],
  [4, '1 to 6m', 'C – C/E – F – F♯°7 – G – G♯°7 – Am. A classic church walk.'],
  [4, 'Keys', 'In F (F – F/A – B♭) and B♭ (B♭ – B♭/D – E♭).'],
  [3, 'In time', 'Walk-up in the last beat of a bar only, so the chord change lands on beat 1. Metronome 80.']
], r: 'Walk-ups to 4 and to 6m in three keys landing on beat 1.' },

'g-walk-down': { f: 'Bass walk-downs that lead to 4, 6m and 2m.', b: [
  [4, '1 to 6m', 'C – G/B – Am: left hand C B A. Then C – Em/B – Am.'],
  [4, '1 to 4', 'C – C/B♭ – F/A – Fm/A♭ – C/G – G7 – C. The famous gospel descending line.'],
  [4, 'Keys', 'In F (F – C/E – Dm) and E♭ (E♭ – B♭/D – Cm).'],
  [3, 'Mix up and down', 'Play 8 bars: walk up to 4, walk down back to 1.']
], r: 'The C – C/B♭ – F/A – Fm/A♭ – C/G line in three keys at 70.' },

'g-substitution': { f: 'Reharmonize a simple progression.', b: [
  [4, 'Plain to rich', 'Play C – F – G – C. Then Cmaj7 – Fmaj9 – G13 – Cmaj9. Then add a passing chord: Cmaj7 – C7 – Fmaj7 – Fm6 – C/G – G7 – C.'],
  [4, 'Relative swap', 'Replace I with vi or iii (C → Am or Em), IV with ii (F → Dm7). Play the same melody note on top.'],
  [4, 'Keep the melody', 'Play a hymn melody note on top and try three chords under it. Choose the one that fits the words.'],
  [3, 'Record and compare', 'Record the plain and the rich version of one line on your phone. Keep what serves the song.']
], r: 'Three different reharmonizations of the same line, with the melody on top.' },

/* ============ Voicings ============ */
'g-closed-open': { f: 'Closed and open (spread) voicings.', b: [
  [4, 'Closed', 'Cmaj7 as C E G B in the right hand. Play the turnaround with closed voicings.'],
  [4, 'Open', 'Spread it: left hand C G, right hand E B. Then Dm7: D A | F C. G7: G F | B D. Feel the bigger sound.'],
  [4, 'Switch', 'Play 4 bars closed, 4 bars open of the same progression. Listen to the difference.'],
  [3, 'Keys', 'Open voicings in F and B♭.']
], r: 'Open voicings through a turnaround in three keys.' },

'g-shell': { f: 'Shell voicings: root, 3rd and 7th.', b: [
  [4, 'Left-hand shells', 'Dm7: D + C (root + 7th). G7: G + F. Cmaj7: C + B. Then root + 3rd: D + F, G + B, C + E.'],
  [4, 'Right-hand melody', 'Left hand shells, right hand plays a simple melody or the 3rd and 9th on top.'],
  [4, 'Keys', 'Shell ii – V – I in F, B♭, E♭.'],
  [3, 'Speed', 'Shells through the cycle (C7 – F7 – B♭7 – E♭7 …) one per beat at 60.']
], r: 'Shell ii – V – I in four keys with melody on top.' },

'g-rootless': { f: 'Rootless voicings for the hands.', b: [
  [4, 'A and B shapes', 'Dm9 rootless: F A C E. G13 rootless: F A B E. Cmaj9 rootless: E G B D. Play ii – V – I. Then the other shape starting from C E F A.'],
  [4, 'Bass plays the root', 'Left hand plays roots low, right hand rootless voicings. Then left hand rootless, right hand melody.'],
  [4, 'Keys', 'In F and B♭.'],
  [3, 'Song', 'Accompany a slow worship song with rootless voicings and a bass note.']
], r: 'Rootless ii – V – I in three keys using both shapes.' },

'g-quartal': { f: 'Voicings built in fourths.', b: [
  [4, 'Stack fourths', 'D G C, E A D, A D G. Move the stack up and down the C scale.'],
  [4, 'Over bass notes', 'Low C with E A D on top (C6/9 sound). Low D with G C F (Dm11). Low F with A D G.'],
  [4, 'Worship vamp', 'Left hand C, right hand D G C; left hand F, right hand E A D. Two beats each, then move the stacks up (E A D over C, G C F over F). All notes stay in C major. Make an 8-bar vamp.'],
  [3, 'Keys', 'Quartal vamp in F and E♭.']
], r: 'A quartal vamp that stays in key, in three keys.' },

'g-voicing-251': { f: 'Full gospel ii – V – I voicings.', b: [
  [4, 'Big voicing', 'Left hand plays root and 7th, right hand plays the colour notes. Dm9: D C | E F A. G13: G F | A B E. Cmaj9: C B | D E G. Play the three in a row 8 times at 60.'],
  [4, 'Altered colour', 'Replace G13 with G7♯5♯9: left hand G F, right hand B E♭ B♭. Play Dm9 – G7♯5♯9 – Cmaj9 and hear the tension resolve. Then alternate G13 and G7♯5♯9.'],
  [4, 'Keys', 'Full voicings in F, B♭ and E♭.'],
  [3, 'Slow and lush', 'Play the ii – V – I 8 times at 60, holding each chord and listening to every note.']
], r: 'Full gospel ii – V – I voicings in four keys.' },

/* ============ Arranging ============ */
'g-turnarounds-adv': { f: 'Colourful turnarounds.', b: [
  [4, '3 – 6 – 2 – 5', 'Em7 – A7 – Dm7 – G7 – C. Then Em7 – E♭7 – Dm7 – D♭7 – C (with tritone subs).'],
  [4, 'Diminished turn', 'C – C♯°7 – Dm7 – D♯°7 – C/E – A7 – Dm7 – G7.'],
  [4, 'Keys', 'Your two favourite turnarounds in F and A♭.'],
  [3, 'End of a song', 'Play a song\'s last line and use a colourful turnaround to go back to the top.']
], r: 'Three colourful turnarounds in three keys at 70.' },

'g-modulation': { f: 'Key changes: up a half step, a whole step, and to the 4.', b: [
  [4, 'Up a half step', 'C → D♭ via A♭7: C – A♭7 – D♭. Then D♭ → D via A7.'],
  [4, 'Up a whole step', 'C → D via A7 (or Em7 – A7): C – Em7 – A7 – D.'],
  [4, 'To the 4', 'C → F via C7: C – C7 – F. Common in medleys.'],
  [3, 'Song', 'Play a chorus in C, modulate up a half step, play it again in D♭.']
], r: 'Three kinds of modulation landing cleanly on beat 1.' },

'g-intros': { f: 'Play introductions that set the key and the mood.', b: [
  [4, 'Last line intro', 'Play the last line of a song as the intro, ending on the 5 chord so the singers know when to come in.'],
  [4, '2 – 5 intro', 'Dm7 – G7 – Dm7 – G7 – C, softly, then start the song.'],
  [4, 'Pad intro', 'Hold the 1 chord with sus colour (Csus2 – C) for 4 bars, then cue the singer.'],
  [3, 'Three songs', 'Play an intro for three different songs in three keys.']
], r: 'Three intro styles, each ending ready for the singer.' },

'g-endings': { f: 'Song endings that sound finished.', b: [
  [4, 'Plagal', 'F – Fm6 – C. Then F/G – C.'],
  [4, '♭6 – ♭7 – 1', 'A♭maj7 – B♭13 – Cmaj9. The big church ending.'],
  [4, 'Tag ending', 'Repeat the last line three times: the 3rd time slow down and end on a held chord.'],
  [3, 'Keys', 'The ♭6 – ♭7 – 1 ending in F (D♭ – E♭ – F) and E♭ (C♭ – D♭ – E♭).']
], r: 'Three endings in three keys.' },

'g-pedal': { f: 'Pedal tones and transitions.', b: [
  [4, 'Dominant pedal', 'Left hand holds G; right hand plays C/G – F/G – C/G – G7. Build tension before a chorus.'],
  [4, 'Tonic pedal', 'Left hand holds C; right hand: C – B♭/C – F/C – C.'],
  [4, 'Transition', 'Use a 4-bar G pedal to move from verse to chorus, then a C pedal to end.'],
  [3, 'Keys', 'Pedal transitions in F and B♭.']
], r: 'Dominant and tonic pedals used to connect sections in three keys.' },

/* ============ Runs and fills ============ */
'g-runs': { f: 'Pentatonic and blues runs.', b: [
  [4, 'Major pentatonic', 'C D E G A, up and down two octaves. Fingering: 1 2 3 1 2, 1 2 3 1 2. Metronome 60 in eighth notes.'],
  [4, 'Blues scale', 'C E♭ F G♭ G B♭ C. Up and down, then play a short run from the top down to C.'],
  [4, 'Runs to a chord', 'End a run on the next chord: run down the C pentatonic, land on F on beat 1.'],
  [3, 'Keys', 'Pentatonic runs in F and B♭.']
], r: 'A clean pentatonic run that lands on the next chord in three keys.' },

'g-fills': { f: 'Fills between the singer\'s phrases.', b: [
  [4, 'Leave space', 'Play chords while you sing a line; play a 1-bar fill only when the voice stops.'],
  [4, 'Fill ideas', 'Three fills: a pentatonic run, a 3rds run (E G – D F – C E), and a chord-tone arpeggio. Practise each in C.'],
  [4, 'Short and on time', 'Fills last one or two beats and stop before the next phrase. Metronome 70.'],
  [3, 'Real song', 'Play a song with a fill between every line.']
], r: 'Fills between every phrase of a song, never covering the voice.' },

/* ============ Projects (level 3 and gospel harmony) ============ */
'l3-verse': { f: 'Accompany a full verse.', b: [
  [4, 'Chart', 'Write the verse chords and numbers. Mark where each line starts and ends.'],
  [4, 'Accompaniment', 'Play the verse with bass and full chords, metronome 70, singing the melody.'],
  [4, 'Add colour', 'Add sevenths, one passing chord and one fill.'],
  [3, 'Record', 'Record one full take. Listen and note one thing to improve tomorrow.']
], r: 'One full verse, singing and playing, with no stops.' },

'g-capstone': { f: 'Arrange a full chorus with gospel harmony.', b: [
  [4, 'Plan', 'Choose a chorus. Write the plain chords, then mark where you will use passing chords, substitutions and a turnaround.'],
  [4, 'Build', 'Play the chorus line by line with your new harmony. Fix any chord that fights the melody.'],
  [4, 'Shape', 'Play it once softly (pad style) and once full (octave bass, rhythm). Add an intro and ending.'],
  [3, 'Perform', 'Play the whole arrangement from intro to ending without stopping, and record it.']
], r: 'A complete chorus arrangement played and recorded from start to finish.' }

});
