'use strict';
/* At your piano, part 4: Level 4 Advanced keyboard and Level 5 Mastery. */
Object.assign(PIANO_ROUTINES, {

/* ============ Level 4 · Fluency ============ */
'a-251-keys': { f: 'ii – V – I in all 12 keys.', b: [
  [5, 'Circle of fourths', 'C, F, B♭, E♭, A♭, D♭, G♭, B, E, A, D, G. Rootless or shell voicings, left hand roots, one chord per bar at 70.'],
  [4, 'Down in whole steps', 'C, B♭, A♭, G♭, E, D, then D♭, B, A, G, F, E♭.'],
  [3, 'Tempo ladder', 'Your weakest four keys at 60, 70, 80, 90.'],
  [3, 'Minor too', 'Minor ii – V – i in six keys.']
], r: 'All 12 keys at 80 without stopping.' },

'a-turnaround-keys': { f: 'The 1 – 6 – 2 – 5 turnaround in every church key.', b: [
  [5, 'Church keys', 'C, D♭, D, E♭, E, F, G, A♭, A, B♭. Sevenths, smooth voicings, at 70.'],
  [4, 'Colour', 'Add the 9th and 13th in every key.'],
  [3, 'Tempo ladder', '70, 80, 90, 100 in your three most-used keys.'],
  [3, 'Key changes', 'Turnaround in E♭, modulate up a half step, turnaround in E.']
], r: 'The turnaround in every church key at 90.' },

'a-numbers-speed': { f: 'Nashville numbers at speed.', b: [
  [4, 'Number calls', 'Have someone (or a random app) call numbers; play in A♭ at once: 1 – 4 – 5 – 6m – 2m – 3m – ♭7.'],
  [4, 'Charts', 'Read a number chart and play it in three keys back to back.'],
  [4, 'Speed', 'Play 1 – 6 – 2 – 5 – 3 – 6 – 2 – 5 – 1 in B♭ at 100.'],
  [3, 'Real song', 'Play a song by numbers in a key you have never used for it.']
], r: 'Instant number calls in A♭, E♭ and B♭.' },

/* ============ Advanced harmony ============ */
'a-altered': { f: 'Altered dominants: ♭9, ♯9 and ♯5.', b: [
  [4, 'G7♭9', 'Left hand G F, right hand B D A♭. Resolve to Cmaj9 (C B | D E G). 8 times.'],
  [4, 'G7♯9 and G7♯5', 'G F | B B♭ (♯9). G F | B E♭ (♯5). Hear each resolve.'],
  [4, 'In ii – V – I', 'Dm9 – G7alt – Cmaj9 in C, F, B♭, E♭.'],
  [3, 'Minor', 'Dm7♭5 – G7♭9 – Cm9 in two keys.']
], r: 'Altered V chords resolving cleanly in four keys.' },

'a-upper-structure': { f: 'Upper-structure triads over a dominant.', b: [
  [4, 'D over G7', 'Left hand F and B (the 7th and 3rd of G7), right hand a D major triad (D F♯ A): G9♯11. Resolve to Cmaj9 (left hand C, right hand E G B D). 8 times.'],
  [4, 'E♭ over G7', 'Left hand F B, right hand E♭ major (E♭ G B♭): G7♯5♯9, dark and strong. Resolve to Cmaj9. Then play D/G7 and E♭/G7 one after the other.'],
  [4, 'A and E over G7', 'Left hand F B, right hand A major (A C♯ E): G13♯11. Then E major (E G♯ B): G13♭9. Resolve each to Cmaj9 and listen to the colour.'],
  [3, 'Keys', 'In F (left hand B♭ E under C7, triads G, A♭, D, A) and B♭ (left hand E♭ A under F7, triads C, D♭, G, D).']
], r: 'Four upper-structure dominants resolving cleanly in C, F and B♭.' },

'a-dim-wholetone': { f: 'Diminished and whole-tone runs.', b: [
  [4, 'Diminished scale', 'Half–whole from G: G A♭ B♭ B C♯ D E F G. Up and down at 60 over G7.'],
  [4, 'Whole-tone', 'G A B C♯ D♯ F G. Over G7♯5. Up and down at 60.'],
  [4, 'Runs to the 1', 'Run the diminished or whole-tone scale down for one beat and land on C on beat 1.'],
  [3, 'Patterns', 'Diminished in minor 3rds: G B♭ D♭ E, played as a cascading run.']
], r: 'Diminished and whole-tone runs landing on the 1 chord at 80.' },

/* ============ Gospel styles ============ */
'a-128-ballad': { f: 'The 12/8 gospel ballad.', b: [
  [4, 'The feel', 'Metronome 60 = one beat (dotted quarter). Count "1 2 3 4 5 6 7 8 9 10 11 12". Left hand root on 1 and 7, right hand chords on every triplet.'],
  [4, 'Progression', 'C – C/B♭ – F/A – Fm6/A♭ – C/G – G7 – C at 60.'],
  [4, 'Shouts and triplets', 'Add a right-hand triplet run every 2 bars.'],
  [3, 'Song', 'Play a traditional hymn ("What a Friend", "Blessed Assurance") as a 12/8 ballad.']
], r: 'A hymn in 12/8 at 60 with steady triplets.' },

'a-shout': { f: 'Shout and praise-break playing.', b: [
  [4, 'Tempo', 'Metronome 130: left hand octaves on every beat, right hand chords on the off-beat.'],
  [4, 'Shout progression', '1 – 4 – 1 – 5 – 1 in C, then 1 – 6 – 2 – 5 vamp. Chromatic runs into each chord.'],
  [4, 'Stamina', 'Play 2 minutes without stopping. Rest 30 seconds. Repeat.'],
  [3, 'Keys', 'Shout pattern in E♭ and A♭ (common for praise breaks).']
], r: 'Two minutes of steady praise-break at 130.' },

'a-walking-bass': { f: 'Walking and octave bass lines.', b: [
  [4, 'Walk 4 to the bar', 'C – Am – Dm – G: walk quarter notes in the left hand (C E G A, A C E D…). Root on beat 1.'],
  [4, 'Approach notes', 'On beat 4 play a half step above or below the next root.'],
  [4, 'Octave bass', 'Octave left hand on 1 and the "&" of 2 under right-hand chords.'],
  [3, 'Song', 'Walk the bass for a whole chorus at 90.']
], r: 'Walking bass through a chorus at 90.' },

'a-afro-praise': { f: 'African praise grooves on keys.', b: [
  [4, 'Makossa / highlife feel', 'Right hand plays syncopated chords on the off-beats; left hand bouncing octaves. Metronome 110.'],
  [4, 'Two-chord loops', '1 – 5 (C – G) and 1 – 4 – 5 – 4 grooves with lots of repetition.'],
  [4, 'Runs', 'Right-hand thirds runs between chords.'],
  [3, 'Call and response', 'Play a praise chorus with call and response at 120.']
], r: 'A two-chord praise groove for 3 minutes at 120.' },

/* ============ Hymns ============ */
'a-hymn-texture': { f: 'Hymn playing in four parts.', b: [
  [4, 'SATB', 'Right hand soprano and alto, left hand tenor and bass. Play one hymn line slowly.'],
  [4, 'Voices', 'Play each part alone, then add one at a time.'],
  [4, 'Legato', 'Connect each voice; lift together at the end of each phrase.'],
  [3, 'Whole hymn', 'Play one verse at singing tempo.']
], r: 'One hymn verse in four parts at singing tempo.' },

'a-hymn-reharm': { f: 'Reharmonize a hymn line.', b: [
  [4, 'Original', 'Play the hymn line as written.'],
  [4, 'Gospel chords', 'Keep the melody on top; add 7ths, a secondary dominant and a walk-down.'],
  [4, 'Ending', 'End with 4 – 4m6 – 1 or ♭6 – ♭7 – 1.'],
  [3, 'Compare', 'Play the original then your version.']
], r: 'A reharmonized hymn line with the melody always on top.' },

'a-congregation': { f: 'Lead congregational singing.', b: [
  [4, 'Clear intro', 'Play the last line as intro, with a clear count before the first word.'],
  [4, 'Strong melody', 'Play the melody in the right hand on top so people can follow.'],
  [4, 'Breaths', 'Hold the end of each line for the breath, then lead into the next.'],
  [3, 'Verses', 'Play 3 verses, changing texture each time.']
], r: 'Three hymn verses with clear intros and breaths.' },

/* ============ Ear and soloing ============ */
'a-by-ear': { f: 'Play songs by ear.', b: [
  [4, 'Bass first', 'Play a recorded song and find its bass notes on the piano.'],
  [4, 'Chords', 'Build major or minor chords on those bass notes until it sounds right.'],
  [4, 'Melody', 'Find the first line of the melody.'],
  [3, 'Play it', 'Play the song along with the recording.']
], r: 'One new song learned by ear and played along with the recording.' },

'a-soloing': { f: 'Soloing over changes.', b: [
  [4, 'Chord tones', 'Over C – Am – Dm – G, right hand plays only chord tones in eighth notes.'],
  [4, 'Pentatonic', 'Use C major pentatonic over the whole progression.'],
  [4, 'Phrases', 'Play 2-bar phrases with 2 bars of rest.'],
  [3, 'Build', 'Make a 16-bar solo that grows in range and rhythm.']
], r: 'A 16-bar solo with clear phrases over a turnaround.' },

'a-technique': { f: 'Evenness, speed and dynamics.', b: [
  [4, 'Scales', 'Two octaves in the key of the day at 80, 100, 120 (two notes per beat).'],
  [4, 'Hanon-style', 'C D E F G F E D, moving up one step each bar, both hands, at 80.'],
  [4, 'Dynamics', 'Scale crescendo up, diminuendo down.'],
  [3, 'Chords', 'Block chord inversions at 100.']
], r: 'Two-octave scales at 120 evenly with dynamics.' },

'a-project': { f: 'A full song in two keys.', b: [
  [4, 'Key 1', 'Play the song in its first key, start to end.'],
  [4, 'Modulation', 'Practise the key change bars 8 times.'],
  [4, 'Key 2', 'Play the final chorus in the new key.'],
  [3, 'Record', 'Record a full performance.']
], r: 'A full recorded performance with a clean key change.' },

/* ============ Level 5 · Mastery ============ */
'm-direction': { f: 'Musical direction from the keyboard.', b: [
  [4, 'Cue words', 'Practise saying cues on time while playing: "Chorus!", "Bridge!", "Up a step!", "Hold!".'],
  [4, 'Hand signals', 'Practise showing numbers with your left hand while the right hand plays.'],
  [4, 'Stops and hits', 'Play a band hit on beat 1 and silence for 2 beats, then back in.'],
  [3, 'Lead a track', 'Play along with a song and call each section before it comes.']
], r: 'You call every section on time while playing.' },

'm-arranging': { f: 'Arrange for band and choir from the piano.', b: [
  [4, 'Voices', 'Play the choir parts (S, A, T) for one chorus.'],
  [4, 'Band', 'Play the bass line, then the keys part, then a guitar rhythm on the piano.'],
  [4, 'Hits and stops', 'Write and play the band hits for the bridge.'],
  [3, 'Chart', 'Write a one-page chart with sections, keys, cues and hits.']
], r: 'A chart and parts you can play for band and choir.' },

'm-medley': { f: 'Medleys across keys.', b: [
  [4, 'Three songs', 'Choose three songs in three keys.'],
  [4, 'Joins', 'Practise each modulation into the next song.'],
  [4, 'Tempo', 'Practise changing tempo between songs smoothly.'],
  [3, 'Full medley', 'Play the full medley without stopping.']
], r: 'A three-song medley across keys without a break.' },

'm-signature': { f: 'Develop your signature sound.', b: [
  [4, 'Favourite moves', 'List and play your five favourite voicings, runs and endings.'],
  [4, 'Use them', 'Play a song using all five.'],
  [4, 'New idea', 'Invent one new move and practise it in three keys.'],
  [3, 'Record', 'Record and compare with a month ago.']
], r: 'A song played with your own recognisable moves.' },

'm-click': { f: 'Record to a click like a session player.', b: [
  [4, 'Click on 2 and 4', 'Metronome at half tempo on 2 and 4; play a song.'],
  [4, 'Drop-outs', 'Use a click that drops out for 4 bars; stay in time.'],
  [4, 'Takes', 'Record three takes of a chorus and compare timing.'],
  [3, 'Final', 'Record one clean take.']
], r: 'A clean take with a click on 2 and 4.' },

'm-release': { f: 'Prepare a song for release.', b: [
  [4, 'Final parts', 'Play your final keys parts for the song.'],
  [4, 'Live version', 'Play a live version for social media: intro, chorus, ending.'],
  [4, 'Teach it', 'Play it slowly as a tutorial for other keyboard players.'],
  [3, 'Record', 'Record the live version.']
], r: 'A recorded live version and a tutorial version of your song.' },

'm-recital': { f: 'Mastery recital: lead a worship set.', b: [
  [4, 'Full set', 'Play your recital set from start to finish.'],
  [4, 'Weak spots', 'Repeat transitions and hard passages.'],
  [4, 'Performance', 'Play again as if in church: no stopping, full feeling.'],
  [3, 'Record', 'Record the full set.']
], r: 'A recorded worship set played without stopping.' }

});
