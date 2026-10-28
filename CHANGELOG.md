# Changelog

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
