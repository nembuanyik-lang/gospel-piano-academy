# Changelog

## 2.6.1 — MIDI keyboards connect again

- Fixed: recent Chromium requests all Web MIDI access as the `midiSysex` permission, which the permission handlers
  refused, so `requestMIDIAccess` failed with "The keyboard could not be opened". Both `midi` and `midiSysex` are
  now allowed for the app's own page (the page still never requests or sends SysEx). The error now names the cause.

## 2.6.0 — The Vocal Studio

- Pitch tracking (`app/js/pitch.js`): YIN with parabolic interpolation, 65–1250 Hz, loudness gate, clarity > 0.8,
  5-frame median against octave slips. Unit test: within 10 cents from C2 to C6, including a weak fundamental; noise rejected.
- Vocal Studio (`app/js/voice.js`, route `voice`, nav "Voice"): range finder and voice-type guide; live note, cents needle
  and pitch trace; ten exercises (match, five-note, arpeggio, major scale, minor five-note, intervals, sustain, echo,
  gospel runs timed with a speed ladder, harmony a diatonic third below), all pitched from the singer's range,
  call-and-response so the reference does not leak into the microphone; octave-free grading (score 100 within 10 cents,
  "in tune" within 25); summary with sharp/flat tendency. Daily warm-up (Home > Today's practice), eight lessons,
  My voice (range, in-tune rate, tendency, longest note, best scores, recent sessions) and best key per Song Lab song.
- `S.voice` saved and cleaned by the sanitiser. Browser tests sing to the app through a fake microphone
  (`tests/fixtures/make-voice.py`): in tune scores ≥ 85, 40 cents flat is measured as about −40 and called flat.
- Fixed: routine listening now uses `Input.always` (survives redraws); a redraw no longer stops the routine metronome.

## 2.5.0 — Your keyboard, everywhere

- Routines listen (`app/js/routine-ui.js`): per block, notes, playing seconds, chords heard (`E.identifyChord`), and
  timing against the routine metronome (nearest beat or half beat, within 70 ms or 22 % of the grid). Rolling window of
  32 notes; at 90 % in time over 24+ notes a "Try +5 BPM" button appears. A tempo named in a block ("metronome 60",
  "80 BPM", "at 72") sets the metronome when the block starts. Sessions store `lastPlayed`, `played` and `lastTiming`.
- My keyboard (`Settings`): `prefs.keyboard` (`ypt240` / `touch`) and `prefs.midiSound` (`both` / `keyboard`).
  With the YPT-240, routine blocks that mention dynamics get a note on practising them without touch-sensitive keys;
  with "Only the keyboard", MIDI notes no longer sound in the app.
- Song Lab chord entry from the keyboard: a played chord (3+ notes, added on release) becomes the matching diatonic
  chord number; chords outside the key are explained and not added.
- Song Lab MIDI out (`MidiOut` in `app/js/input.js`): chords on channel 2 (choice of GM sound), bass on 3 (GM 33),
  melody on 4, drums on 10, scheduled 300 ms ahead with timestamps; Stop sends note-offs, sustain off and all notes off.
  Bass events are tagged `part: 'bass'` in the arrangement. Melody recording keeps the computer sound for exact timing.
- Settings and backups clean the new preferences and routine fields.

## 2.4.0 — Level 0: Your keyboard (Yamaha YPT-240)

- New Level 0 (6 modules, 17 lessons, `BATCH K` in `app/js/curriculum.js`) built from the YPT-240 / PSR-E243 owner's
  manual and MIDI reference: setup, panel, USB connection and Local Control, voices and worship sounds, effects,
  metronome and tempo, transpose and tuning, sustain pedal, styles, ACMP and Sync Start, intro/fill/ending,
  songs and lesson modes, Chord Dictionary, church sound system, recording into FL Studio, and a mastery check.
- New exercise type `kbd` (`app/js/lesson.js`): a list of keyboard tasks checked from MIDI — notes, chords
  (including left-hand chords below the split point), voice changes by General MIDI family, sustain pedal presses,
  legato pedalling (pedal changed after the new chord), style start/stop (FA/FC), and tempo from MIDI clock or keys
  played on the clicks. Self-ticked steps are reported as not heard. If the app hears nothing for 15 seconds a
  "tick it myself" button appears; without a keyboard connected, steps offer Connect.
- `Midi` (`app/js/input.js`) now reports program change with bank, sustain pedal changes, start/stop and clock tempo
  via `Midi.on()`; `gmFamily()` names the sound family.
- At your piano routines for all Level 0 lessons (`app/js/routines-5.js`); the content validator checks `kbd` tasks.
- Level 0 is first in the course order but does not gate Level 1.

## 2.3.0 — At your piano

- A 20-minute routine for the learner's own piano in every one of the 151 piano lessons (`app/js/routines-1.js` to
  `routines-4.js`): a 3-minute warm-up (five-finger patterns in Level 1, otherwise the key of the day), four
  lesson-specific blocks totalling 15 minutes, a 2-minute close, and a "ready to move on when" check.
- New lesson step "At your piano" (`app/js/routine-ui.js`): block timer with chimes, pause, next block, reset,
  a metronome, and a log (`routines` in progress and backups, cleaned by the sanitiser). Timer time counts as practice.
  Optional: mastery rules are unchanged.
- Home > Today's practice offers the routine for the current lesson.
- Fixed: chord, performance and note exercises (159 of 210 chord exercises) and lesson diagrams drew a keyboard
  too short for some chords (for example G or A major, inversions, sevenths in C4–C5). The keyboard now widens to
  include every key the exercise asks for. Browser test covers every exercise and diagram.

## 2.2.1 — Clearer guide recordings

- Guide recording uses music capture settings: echo cancellation, noise suppression and automatic gain off
  (echo cancellation was chopping or muting singing over the backing).
- Microphone picker (remembered), Test the microphone with advice, live level bar while recording.
- Takes are normalised (peak 0.9, at most 12x boost); a silent take is not saved and the earlier guide is kept,
  with Windows microphone-privacy guidance.
- Listen to the guide alone; guide volume up to 200 %.

## 2.2.0 — The Song Lab studio

- One arrangement engine (`app/js/studio.js`) drives playback, MIDI, WAV and the chord chart, so they always match.
- Each section type has its own chords (up to 8; one, two or half a bar per chord); copy chords between sections.
- Melodies per section, as long as the section; held note lengths are recorded; up to three earlier takes are kept;
  a piano-roll note editor (mouse or keyboard) fixes notes.
- Whole-song player with a position bar; section energy (gentle intro and outro, full chorus).
- 4/4, 3/4 and 6/8 songs (with waltz and 6/8 drum patterns); tempo 40–200 BPM; bass styles: root, root and fifth,
  octaves, walking.
- Guide track: record voice or instrument through the microphone in sync with the song (calibrated, with a
  timing nudge and volume); kept in this computer's audio store and savable as a file.
- Audio export (44.1 kHz stereo WAV) rendered faster than real time: full song, backing only, or with the guide track.
- Older projects open unchanged: their four chords become every section's chords and their melody the chorus melody.


## 2.1.0 — From beginner to mastery

Curriculum
- Level 4 · Advanced keyboard (17 lessons): ii – V – I in all 12 keys, the turnaround in the church keys, numbers at speed,
  altered dominants, upper-structure triads, diminished and whole-tone runs, the 12/8 ballad, shout and praise break,
  walking bass, African praise grooves, four-part hymn playing, hymn reharmonization, leading congregational singing,
  playing by ear, soloing over changes, technique, and a recorded project with a key change.
- Level 5 · Mastery (9 lessons): musical direction, arranging for band and choir, medleys across keys, spontaneous worship,
  reharmonizing live, your signature sound, recording to a click, releasing your music, and the mastery recital.
- The course order is now: Levels 1–3 with Gospel piano and Gospel harmony, Worship and ministry, Level 4, Songwriting,
  Music production, Level 5.

Performance and practice
- New timed performance test: play a progression in time with the click through a tempo ladder, optionally in several keys.
  Every Level 4 and Level 5 challenge uses it, so mastery means playing in time, in any key, at church tempo.
- Save a performance take as a MIDI file; record yourself through the microphone; teacher or music director sign-off.
- Daily technique in the key of the day (round the circle of fourths), remembered per key.
- Play it back: an adaptive play-by-ear drill with six levels.
- Guitar: microphone chord recognition ticks off chords in each lesson and can count changes in the one-minute drill.
- Reports and the class summary show performance tests and sign-offs.

Fixes
- Spelled scales with C♭ or B♯ (for example G♭ major) no longer drop an octave in the middle.


## 2.0.0

**Renamed to Gospel Music Academy.** Existing installs update in place; progress, the data folder and backups are kept.

Security and data safety
- Fixed: a crafted backup file could run its own code inside the app (song ids were written into the page unescaped).
  Every state object read from storage or a backup is now cleaned field by field (`app/js/sanitize.js`).
- Content-Security-Policy on every page, sent by the app's protocol handler.
- Microphone only (no camera), no MIDI SysEx, and only for the app's own page. External links limited to an allow-list.
- Progress is also written to `progress/state.json` (atomic writes, last good copy kept) with daily snapshots
  and snapshots before every import, restore or reset.
- A warning banner appears whenever a save fails, with Export and Try again.
- Undo import, restore any snapshot, and a typed confirmation (RESET) before erasing progress.

Desktop
- About screen with version and update status, Check for updates, What is new after an update, release notes in the update prompt.
- Menu with zoom (larger and smaller text), full screen, Settings, Open progress folder.
- The window no longer opens off-screen after a monitor is unplugged; its size and position are saved while you work.
- Mouse back button and Alt + Left go back a screen.
- Small log file for support.

Learning
- Choose piano, guitar or both at the start; Home follows your choice.
- Guitar lessons unlock one by one (module tests skip ahead); guitar XP and progress are included in backups.
- Lesson search and an "only unfinished" filter on Course; finished modules fold away. The outdated "Coming next" panel is gone.
- Compact lesson stepper ("Step 3 of 10") with Back and Continue always in reach.
- Practice: a Today card and tabs. New Timing calibration applied to tap-along and play-along scoring.
- Profile split into Profile, Settings (theme, text size, sound, MIDI), Your data and About.
- Printable progress report and Class summary for teachers and music directors.
- Clearer level and XP labels; friendlier error screen with Copy details.
- Computer-keyboard notes follow key position, so AZERTY keyboards work; no more stuck notes after switching windows.

Engineering
- The single 788 KB `index.html` is split into a CSS file and 20 script files.
- Unit tests, main-process tests and browser tests; `npm run check`; CI runs them on every push.
- Tag-triggered releases for Windows, macOS and Linux, with optional code signing.
- Exact dependency versions and a lockfile (`npm run pin`).

## 1.9.0

- Choosing a sound: grand piano, electric piano, organ, strings, trumpet, choir and flute.
