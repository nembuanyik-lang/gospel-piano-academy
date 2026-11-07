'use strict';
/* At your piano, part 5: Level 0, your keyboard (Yamaha YPT-240). Same shape: four blocks totalling 15 minutes. */
Object.assign(PIANO_ROUTINES, {

'k-setup': { f: 'Set up quickly and know every C.', b: [
  [3, 'Set up from cold', 'Switch off and unplug. Then: power in, switch on, [MASTER VOLUME] to half, music rest on, bench at the right height. Time yourself: aim for under one minute.'],
  [4, 'Every C, eyes half closed', 'Play all six Cs from bottom to top and back, saying "one, two, three (middle C), four, five, six". Then play only middle C ten times from anywhere on the keyboard.'],
  [4, 'Sockets by touch', 'Reach behind the keyboard and touch each socket while naming it: SUSTAIN, USB TO HOST, PHONES/OUTPUT, DC IN. Plug and unplug headphones and hear the speakers go quiet and come back.'],
  [4, 'Listen to the demo', 'Press [DEMO] and listen to two demo songs. Notice the sounds the keyboard can make. Press [DEMO] to stop.']
], r: 'You set up in under a minute and find middle C instantly.' },

'k-panel': { f: 'Find every button without searching.', b: [
  [4, 'Mode buttons', 'Press [VOICE], [STYLE] and [SONG] in turn, ten times, reading the screen each time. Say what the number buttons will change now.'],
  [4, 'Numbers and steps', 'In [VOICE], type 0 0 1, 0 0 3, 0 1 0, 0 2 0, then step with [+] and [-]. Each time press [PORTABLE GRAND] to come home.'],
  [4, 'The FUNCTION menu', 'Press [FUNCTION] and walk through the first ten settings, reading each name aloud. Leave with [VOICE]. Do it twice.'],
  [3, 'Blind button test', 'Look away from the panel. Say a button ("[METRONOME]", "[SYNC START]", "[PORTABLE GRAND]") and touch it, then check.']
], r: 'You can touch any button by name within two seconds.' },

'k-connect': { f: 'A reliable connection every time.', b: [
  [3, 'Connect from zero', 'USB cable unplugged. Plug in, switch on, open the app, Settings > Connect. Play a chord in Piano Lab and see it light up.'],
  [4, 'Play to the app', 'In Piano Lab, play C, F, G, Am and watch the chord detector name each one. Then play scales of C and G.'],
  [4, 'Local Control', 'Set Local Control OFF: only the app sounds. Play for a minute. Set it back ON. Repeat until it is quick and you never forget to set it ON.'],
  [4, 'Double sound', 'Turn the keyboard volume down and use the app\'s sound, then turn the app\'s sound off and use the keyboard\'s. Choose the one you prefer for practice.']
], r: 'You connect in under a minute and switch Local Control off and on without looking it up.' },

'k-voices': { f: 'Find any family of sound fast.', b: [
  [4, 'Explore', 'Step through voices 001 to 060 with [+], playing one chord on each. Write the numbers of the best piano, electric piano, organ, strings and choir in your notebook.'],
  [4, 'Explore more', 'Step through 061 to 139 the same way, and try the Dual voices 122 to 131. Add your favourites to the notebook.'],
  [4, 'Number recall', 'From your notebook, type each favourite number from memory: piano, organ, strings, choir, layer. Then [PORTABLE GRAND].'],
  [3, 'Speed round', 'Have the notebook closed: organ, strings, piano, choir, piano, as fast as you can, playing a chord on each.']
], r: 'You can call up your five favourite sounds from memory.' },

'k-worship-sounds': { f: 'Play each part of a service with its sound.', b: [
  [4, 'Praise on piano', 'Piano: play 1 – 4 – 5 – 1 in G with a bright rhythm at 100 BPM for two minutes.'],
  [4, 'Hymn on organ', 'Organ: play a hymn you know slowly, holding each chord. No sustain pedal. Fewer notes than on piano.'],
  [4, 'Prayer on strings or pad', 'Strings or pad: hold C – Am – F – G, eight beats each, very softly, for three minutes. Change chords smoothly.'],
  [3, 'Switch between', 'Play one line on piano, change to organ between lines, then to strings. Change only between lines.']
], r: 'You switch sounds between sections without a gap or a wrong sound.' },

'k-effects': { f: 'Choose effects with your ears.', b: [
  [4, 'Reverb tour', 'Press [FUNCTION] to Reverb Type. Play the same chord on each type and choose a room sound and a hall sound. Note them.'],
  [4, 'Chorus', 'With electric piano, try each chorus type. Then with piano. Hear why chorus suits electric piano more.'],
  [4, 'Ultra-Wide and EQ', 'In headphones switch [ULTRA-WIDE STEREO] on and off. Then try each Master EQ type through the speakers and choose the clearest.'],
  [3, 'Reset to clean', 'Set a room reverb, no Ultra-Wide, your speaker EQ, [PORTABLE GRAND]. This is your church setup: write it on your card.']
], r: 'You can set a clean church sound in under a minute.' },

'k-metronome': { f: 'Set and keep any tempo.', b: [
  [4, 'Tempo ladder', 'Metronome on. Play the C scale at 60, 72, 84, 96, changing the tempo with [TEMPO/TAP] and the number buttons each time.'],
  [4, 'Tap tempo', 'Sing a song in your head, then tap its tempo on [TEMPO/TAP]. Start the metronome: does it match? Do it for three songs.'],
  [4, 'Time signatures', 'Hold [METRONOME] and set 3: play a waltz (low C, then chords on beats 2 and 3). Set 4 again and play chords on 2 and 4.'],
  [3, 'Reset', 'Press [+] and [-] together to reset the tempo. Practise one chord per beat at the default tempo.']
], r: 'You can set any tempo in five seconds and play steadily with it.' },

'k-transpose': { f: 'Transpose with confidence, and never forget to reset.', b: [
  [4, 'Up and down', 'Play a song you know in C. Transpose +2 and play it again (it sounds in D). Then -2 (B♭). Reset to 00.'],
  [4, 'Singer\'s key', 'Sing a song. If it is too high or low, transpose until it is comfortable. Write the setting next to the song title.'],
  [4, 'Real keys too', 'Now play the same song without transpose in D (the real shapes). Compare: transpose helps today, real keys build skill.'],
  [3, 'Reset check', 'Five times: transpose to a random setting, play, then reset to 00 and play middle C to confirm.']
], r: 'You transpose for a singer and always return to 00.' },

'k-pedal': { f: 'Clean, connected pedalling.', b: [
  [4, 'Pedal timing', 'Play C, then lift and press the pedal on beat 2. Play F, pedal on beat 2. Slowly at 60, eight chords.'],
  [4, 'Hymn with pedal', 'Play a hymn line with a pedal change after every chord. Listen for no gaps and no blur.'],
  [4, 'Pedal and melody', 'Right hand plays a melody, left hand chords, pedal changes with each new chord only.'],
  [3, 'Without pedal', 'Play the same line without pedal, using your fingers to connect. Then with pedal again. Hear the difference.']
], r: 'Eight clean pedal changes in a row at 60.' },

'k-styles': { f: 'Choose good styles and set their tempo.', b: [
  [4, 'Explore styles', 'Step through the styles with [+], starting each one for a few seconds. Write down styles for slow worship, mid-tempo, fast praise, a 6/8 or waltz feel, and an Afro groove if you find one.'],
  [4, 'Pianist styles', 'Try styles 093 to 100 (no drums). Which ones suit hymns?'],
  [4, 'Tempo with a style', 'Choose your slow worship style. Set 66, 72 and 80 and play chords with it at each tempo.'],
  [3, 'Clean start and stop', 'Start and stop the style ten times, exactly at the end of a bar.']
], r: 'You have a written list of good styles with their numbers and tempos.' },

'k-acmp': { f: 'Left-hand chords that drive the band.', b: [
  [4, 'Sync start', 'ACMP on, [SYNC START], play C in the left hand. Practise this start ten times until the band comes in exactly with you.'],
  [4, 'Change on the beat', 'Play C – F – G – C, one chord per bar. Change exactly on beat 1 so the bass does not stumble.'],
  [4, 'Worship progression', 'C – G – Am – F with a slow style for three minutes. Right hand plays the melody or soft chords on top.'],
  [3, 'Minor and sevenths', 'Try Am, Dm, Em, G7 and Cmaj7 in the left hand. Hear the keyboard follow you.']
], r: 'A whole song\'s chords played in the left hand with no late changes.' },

'k-style-song': { f: 'Give a song a beginning, middle and end.', b: [
  [4, 'Intro start', 'Press [INTRO/ENDING/rit.], then start with a left-hand chord. Practise until the first verse comes in where you expect.'],
  [4, 'Verse A, chorus B', 'Play a song: verse on Main A, press [MAIN/AUTO FILL] one beat before the chorus, chorus on Main B.'],
  [4, 'Ending', 'Press [INTRO/ENDING/rit.] at the last line. Then try pressing it again for the ritardando.'],
  [3, 'Full run', 'Play one song with intro, verse, chorus, fill, chorus and ending, without stopping.']
], r: 'A complete song with intro, fills and ending, without stopping.' },

'k-songs-lessons': { f: 'Use the built-in teacher well.', b: [
  [4, 'Listen first', 'Choose a song. [R] and [1 LISTEN & LEARN]: listen and watch the right hand twice.'],
  [4, 'Waiting mode', '[3 WAITING] right hand, then left hand. Take your time; the song waits.'],
  [4, 'Timing mode', '[2 TIMING] right hand: now rhythm matters. Note your grade.'],
  [3, 'Loop the hard bit', 'Use [A-B REPEAT] on the hardest phrase and play along with the loop five times.']
], r: 'A better grade in Timing mode than yesterday.' },

'k-chord-dict': { f: 'Learn new chords on the spot.', b: [
  [4, 'Sevenths', 'Look up and play maj7, m7 and 7 chords on C, F and G.'],
  [4, 'Colour chords', 'Look up sus4, dim and aug on C and G. Play each and resolve sus4 to major.'],
  [4, 'Inversions', 'Look up Fmaj7 and press [+] and [-] to see its inversions. Play each one.'],
  [3, 'Chart test', 'Take a chord chart with a chord you do not know. Look it up, play it, and play the line.']
], r: 'You can look up and play any chord in under 20 seconds.' },

'k-church': { f: 'A calm, quick sound check.', b: [
  [4, 'Connection order', 'With headphones as practice: volume down, plug in, volume up slowly. Repeat five times until it is automatic.'],
  [4, 'Sound check list', 'Piano, organ, strings: play soft and loud on each for 20 seconds, as you would for the engineer.'],
  [4, 'Church setup', 'Set Ultra-Wide off, a room reverb and your external EQ. Write the settings on your card.'],
  [3, 'Hand signals', 'Practise signals for the engineer: point up (more), down (less), thumbs up (good).']
], r: 'You can run your full sound check in three minutes.' },

'k-fl': { f: 'Record clean parts into FL Studio.', b: [
  [4, 'Set up FL Studio', 'Close this app. Open FL Studio, enable the keyboard in Options > MIDI settings, load a piano.'],
  [4, 'Record four bars', 'Metronome on at 80. Record C – Am – F – G. Listen back.'],
  [4, 'Shape velocities', 'In the piano roll, lower the inner notes of each chord and any passing notes. Listen again.'],
  [3, 'Save and name', 'Save the project with a clear name and date. Make it a habit.']
], r: 'A saved four-bar recording with shaped velocities.' },

'k-mastery': { f: 'Everything, calmly, in one run.', b: [
  [4, 'Service simulation', 'Set up from cold, church sound, then play: praise on piano with a style, a hymn on organ, prayer on strings.'],
  [4, 'Problems drill', 'Have someone change a setting secretly (transpose, a voice, a style). Find and fix it, then [PORTABLE GRAND].'],
  [4, 'Pedal and time', 'Metronome at 72, a slow song on piano with clean pedal changes.'],
  [3, 'Your card', 'Update your notebook card: sounds, styles, tempos and church settings.']
], r: 'You run a whole simulated service without looking anything up.' }

});
