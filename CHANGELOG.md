# Changelog

## 2.9.0 — The Song Lab becomes a gospel writing room

- `app/js/songcraft.js` (pure, Node-tested): song chords stored relative to the key `{ r, q, b, beats, push }` with
  any `CHORD_TYPES` quality and an optional bass; names, Roman numerals and Nashville numbers spelled in any key;
  the diatonic palette plus gospel colours (secondary dominants, borrowed iv/♭VII/♭VI/♭III, passing °7 chords,
  slash chords, ♭II7); next-chord suggestions; voice-led right-hand voicings (root left to the bass in big chords);
  `fromHit` for chords played on the keyboard (no chord is rejected any more); `framesToNotes` (sung pitch to
  notes, half-beat grid, steady-note and syllable-dip splitting, optional pull to the key); `choirParts` (alto and
  tenor on chord tones under the melody, smooth, thirds and sixths under passing notes); syllables for lyrics.
- Studio: per-chord lengths and pushes (comping patterns follow the bar grid and play every change; kick and crash on
  pushes), new comping styles (12/8 triplets, gospel ballad, shout stabs) and bass styles (gospel approach notes,
  octave pump, makossa). The song form (`P.form`): repeats, key change with V7 lead-in, tags (last two bars), vamps,
  band stop on the last bar, energy. Older projects migrate (`v: 3`), `degs`/`structure` stay in step for lessons
  and the Songbook. Changing the time signature keeps bar-long chords a bar long.
- Sing it in (Pitch tracker during the section's backing or the click only), words under the melody (shown in the
  note editor), choir parts in playback, MIDI (Soprano/Alto/Tenor tracks) and rehearsal WAVs with one part forward.
- Exports: lead sheet (staff with ties, chord symbols and syllables; key changes respelled), number chart and chord
  chart (bars, pushes, form notes). Staff notation gained ties and lyrics.
- Vocal studio (`app/js/vocalfx.js`, pure, plus `app/workers/vocalfx-worker.js`): 4th-order low-cut, STFT spectral
  noise reduction (profile from the room check, or the take's quietest frames), RBJ EQ, soft-knee compressor with
  make-up, zero-phase split-band de-esser, limiter, the app's modelled room (OfflineAudioContext); presets Natural,
  Worship lead, Warm ballad, Choir, Speaking and preaching; non-destructive, cached, run in a worker. Takes are 24-bit
  WAV (up to six, `P.guide.takes`, main take, per-part comping with 15 ms equal-power crossfades). Input monitoring
  through a live chain. Level and room check (noise floor, peak, clipping, voice-to-room) with advice; it also saves
  the noise profile. Microphone timing from 8 clicks (speakers) or claps (headphones) -> `prefs.micLatencyMs`, used
  by the guide recorder and Sing it in.
- Loops and beats (`app/js/looptools.js`, pure, plus `app/workers/loop-worker.js`): tempo from the file name, the
  loop's length (whole bars) or onset autocorrelation; key and role from the name; WSOLA time-stretch (pitch kept),
  resampling and pitch shift; MIDI file reader (format 0/1, tempo, notes, GM drums to the app's kit). `P.loops`:
  audio loops repeat in the chosen sections and follow key changes; a beat runs under the whole song from its
  first sound (bar-1 offset), with buttons to take its tempo and key; MIDI loops become events (and a MIDI track).
  Audio placements play on the beat grid each pass (`script.audio`) and in the WAV render, dry. `P.mix` switches
  the app's chords, bass, drums or melody off.
- Finishing a song: multitrack (`P.tracks`, up to 8 beside the guide; takes stored as `<pid>:t<id>:<n>`; each with
  takes, comping, vocal chain, gain, pan, mute, solo; recording plays the loops and every other track for overdubs).
  Mixer (`P.mixer` for chords/bass/drums/melody/choir/loops: volume, pan, mute, solo; per-part buses in live play
  and the render; master meter). Mastering (`app/js/mastering.js`, pure, in the worker): BS.1770 loudness with
  gating, 4x true peak, stereo-linked glue compressor, look-ahead limiter, targets −14/−16/−10 LUFS at −1 dBTP.
  MP3 through LAME (lamejs 1.2.1, LGPL), copied to `app/vendor` by `prepare.js` and loaded on demand, with an ID3v2
  tag (`app/js/mp3.js`); `scripts/check-mp3.js` loads the real encoder as the app does, encodes with the app's code
  and parses the result (ID3, Layer III frames, rate, length, bitrate), failing the GitHub build if it is broken;
  Profile > About shows whether the MP3 maker is present; WAV files carry a RIFF INFO list. Stems: every part, loop and track as 24-bit WAV of equal length in a stored
  ZIP with a README. Arrangement: per-part drum fills (snare and toms) with a crash into the next part, swells,
  endings (hold, ritardando by warping the last two bars, fade); loops and beats follow the ritardando through a
  time-varying WSOLA stretch (`LoopTools.stretchVar`) of their last two bars. Song details (`P.info`), copyright line on the
  charts and lead sheet, and a lyrics sheet.
- Song packages (`.gmasong`): a ZIP with manifest, the song JSON, every take of every track and every imported loop;
  opening one sanitises the song, gives it a new id when the same song is present (take keys rewritten), and stores
  the audio. The reader handles stored and deflated ZIPs (DecompressionStream), so re-zipped packages open too.
- Gospel ear training and licks (`app/js/gospel.js`, pure; `app/js/views-gospel.js`): four levels of progressions
  named with the app's Nashville numbering, cadence first, random key, level up/down from the last answers
  (`S.gear`); 17 licks and runs relative to the key, drilled round the circle of fourths, played back on the keys
  (note order checked by longest common subsequence) or sung (pitch tracker, octave-free), tempo rising by 4 BPM
  per clean take; a key counts once it is clean at 80% of the goal tempo (`S.licks`).
- Pre-release testing fixes: the offline render adds notes to the audio graph one second ahead and removes them
  when finished (Chromium processes every connected node each quantum, so whole-song scheduling made long exports
  quadratic: a 4-minute song went from over 10 minutes to about 30 seconds); stems and song packages are built as
  Blob-backed ZIPs (a 4-minute song's 600 MB of stems no longer sits in memory twice); recorded tracks and loops
  play on the computer when the song plays through the keyboard; Restore a backup on the welcome screen; the song
  page has a heading for screen readers; the release build tries both lamejs browser builds. New test suites:
  desktop policy walkthrough (`desktop.test.js`, the exact CSP and MIME types of main.js, every screen at two
  widths), upgrades from 2.0/2.7 backups and a 2.9 round trip (`upgrade.test.js`), and a four-minute session with
  three tracks, loops and choir (`stress.test.js`, with stand-in recorded piano and library sounds).
- Memory on 4 GB laptops (measured as proportional memory of every browser process, sampled twice a second through
  a four-minute, three-track session; `stress.test.js` now fails above 1400 MB): peak 1726 MB → about 1050 MB.
  - In the desktop app, stems and song packages are written straight to disk piece by piece (8 MB at a time) after
    choosing where to save (`file:save-open/-write/-close` in main.js: only .zip/.gmasong/.wav/.mp3, written to a
    `.part` file and renamed when complete; the browser keeps the download). The ZIP is written entry by entry.
  - Mastering measures loudness one channel at a time through one working buffer and limits in place, and the
    worker masters its own copies in place; the export lets go of the raw render and keeps the master as plain
    channels.
  - The vocal and loop workers are closed three seconds after their last job, so their memory returns at once.
  - Leaving a song frees its decoded and processed audio; unprocessed takes are dropped once processed.
  - Memory saver (Settings > Sound: Automatic, On, Off; automatic turns on when a song's recordings and loops would
    use more than about 15% of the computer's memory): tracks play through a live vocal chain instead of being
    processed ahead (playback starts in about 2 s instead of about 30 s), and exports mix one track at a time.
- Drums: 12/8 gospel ballad, Sunday slow gospel, praise break, shout, makossa feel; ghost snares, claps and crash.
- Tests: Songcraft unit tests (spelling in every key, suggestions, voicing, singing to notes, choir, syllables) and
  `tests/e2e/songlab.test.js` (chord editing, form, exports, choir, singing in through a fake microphone).

## 2.8.0 — Studio-quality sound

- Instrument library: `app/js/sf2.js` is a SoundFont 2 player (presets and instruments with global/local zones, key and
  velocity ranges, offsets, loops incl. until-release, root key, coarse/fine/scale tuning, attenuation ×0.4, the
  standard velocity curve, volume envelope with key scaling, low-pass filter, pan, exclusive classes).
  `scripts/get-sounds.js` downloads GeneralUser GS on GitHub Actions (several mirrors, retries, refuses web pages and
  truncated files) into `app/sounds` with `manifest.json`. Electric piano, guitar, strings, trumpet, choir and flute map
  to General MIDI programs; new Church pipe organ (19), Brass section (61), Warm pad (89); the Song Lab bass part uses
  GM 33 and its drums the standard kit. The grand piano keeps Salamander, then the library piano, then the synth.
  Without the library every sound falls back to its synthesised version.
- Gospel organ: nine-drawbar tonewheel model (88 8800 000), single-trigger second-harmonic percussion, key click,
  waveshaper overdrive, Leslie with separate horn and drum rotors (Doppler delay, tremolo, stereo pan) and inertia;
  the sustain pedal or Shift switches it fast while held; Leslie button next to the sound picker.
- Rooms: modelled stereo impulse responses (early reflections, RT60 decay, frequency-dependent damping, width);
  Church (default), Large hall, Studio room, Dry; `prefs.room`; also used by the offline render (WAV export).
- Tests: SoundFont parsing (unit), the library downloader against a local server, and browser renders checking pitch,
  zone pan and tuning, loops, velocity, drums with exclusive classes, organ tuning and Leslie speed, and room tails.

## 2.7.0 — Accurate, clear and authentic

- Sound: `scripts/prepare.js` downloads the Salamander Grand Piano samples on GitHub Actions (the release build runs
  `npm run prepare-fonts`), with retries; `get-piano-samples.js` exports `download()`/`haveSamples()` (tested against a
  local server). The synthesised piano switches to fewer partials when four or more notes sound, and long pedalled
  passages release their oldest notes past 24, so slower computers no longer crackle.
- Chord recognition rewritten (`E.identifyChord`): required and optional tones per chord type (35 types), root-in-bass
  and simplicity preferences, triad inversions, sus-type bass chords named as gospel slash chords with the full name as
  `alt`, `E.nameInterval` for two notes. Tests: 30 everyday voicings and all root-position chords in 12 keys.
- Piano Lab: detector follows held notes (plus sustain and a 450 ms roll window), keeps the last chord on screen,
  Hold notes mode for mouse input; 61-key keyboard (C2–C7); staff notation removed from all three tabs.
- Vocal Studio: per-exercise directions and Start; room-noise calibration sets the voice gate; a settle phase waits
  for the reference to fade before listening (speaker bleed could otherwise pass a note); LISTEN / WAIT / YOUR TURN
  banner; microphone level meter; notes must be held 0.5 s; brief octave slips are ignored by the tracker.
- `howTo()` panels (remember open/closed) on Piano Lab, Practice, Song Lab, song projects, routines, keyboard tasks,
  Settings > MIDI keyboard and the Vocal Studio.

## 2.6.2 — The piano sounds right from the first note

- Fixed: the recorded piano samples were fetched and decoded only when the first note was played, so notes played
  during loading used the synthesised stand-in piano and sounded different. The audio context and the samples now
  load 300 ms after start-up. `Snd.info().state` reports the sample state.

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
