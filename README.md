# Gospel Music Academy – Desktop Edition

Learn gospel piano and guitar, offline, from the first note to mastery: 151 piano lessons in ten levels
(ending with Level 4 Advanced and Level 5 Mastery), a 57-lesson guitar course, timed performance tests, daily technique,
play-by-ear drills, song writing and production. The app (`app/`) runs inside Electron on Windows, macOS and Linux,
keeps progress on the computer with automatic daily snapshots, supports MIDI keyboards, and updates itself
from GitHub Releases.

Version 2.0 was previously called *Gospel Piano Academy*. Existing installs update in place and keep all progress.

## First-time setup (once, on your computer)

You need Node.js 20 or newer from nodejs.org.

    npm run pin        # installs the tools at their current versions and locks them (creates package-lock.json)
    npm test           # unit tests
    npm start          # try the app

Commit `package.json` and `package-lock.json` after `npm run pin`. From then on everyone (and the GitHub
build) uses exactly the same versions; use `npm ci` instead of `npm install` on other computers.
To upgrade the tools later, run `npm run pin` again, test, and commit.

## Build the installers on your computer

    npm run dist:win      # Windows installer   -> dist/Gospel Music Academy Setup 2.0.0.exe
    npm run dist:mac      # macOS (build on a Mac) -> .dmg
    npm run dist:linux    # Linux -> .AppImage and .deb

Each build first runs `npm run check` (syntax, version numbers, files) and stops if the bundled fonts are missing.

## Releases and automatic updates (GitHub)

The repository must be **public** so installed apps can check for updates without a password.

1. Change the app, then raise `version` in `package.json` **and** `APP_VERSION` in `app/js/about.js`
   (the checks fail if they differ). Add a line to `CHANGELOG.md` and to `CHANGES` in `app/js/about.js`.
2. Commit and push. GitHub runs the checks and tests on every push.
3. Create and push a tag that matches the version, for example:

       git tag v2.0.1
       git push origin v2.0.1

4. GitHub builds the Windows, macOS and Linux installers and publishes a Release. Every installed copy checks
   for it when it starts and every six hours, downloads it quietly and asks "Restart now / Later".

The full checklist, including code signing, is in [RELEASING.md](RELEASING.md).

## Where progress is kept

Progress is saved in two places on the computer: the app's own storage and a file
(`progress/state.json` in the app's data folder, written safely so a crash cannot leave half a file).
A snapshot is kept every day and before every import, restore or reset; the last ten of each kind are kept.

- **Profile > Your data** lists the snapshots (Restore), exports and imports backup files, undoes an import,
  saves a printable progress report and opens the progress folder.
- If progress ever cannot be saved, a warning appears at the top of the window with an Export button.
- Backup files from version 1.x can be imported. Every backup is checked and cleaned before it is used.

Data folder: Windows `%APPDATA%\Gospel Piano Academy`, macOS `~/Library/Application Support/Gospel Piano Academy`,
Linux `~/.config/Gospel Piano Academy`. (The folder keeps its old name so existing progress is found.)
A small log file for support is in the `logs` folder there.

## Recorded piano sound (optional)

The app has a built-in synthesised piano. For a recorded grand piano:

    npm run get-samples      # downloads Salamander Grand Piano (CC BY 3.0) into app/samples
    npm run dist:win         # rebuild so the samples are included

The GitHub release build does this automatically. You can also supply your own recordings: put audio files
(mp3/ogg/wav) in `app/samples` and list them in `manifest.json`, for example
`{"notes": {"C3": "C3.mp3", "Ds3": "Ds3.mp3"}, "credit": "..."}` (s or # = sharp). Eight or more notes are needed.

## Playing

- MIDI keyboards: key speed (velocity) and the sustain pedal are supported. Connect under Profile > Settings.
- Computer keyboard: the middle letter row plays the white keys and the row above plays the black keys
  (by position, so QWERTY and AZERTY keyboards work the same). Hold **Shift** to sustain.
- **Practice > Challenges and tools > Timing calibration** measures the delay of your speakers and keyboard
  so play-along scores are fair.

## The Song Lab studio (Song Lab > a song project)

- Each section (intro, verse, pre-chorus, chorus, bridge, outro) has its own chords and its own melody,
  with earlier takes kept and a note editor to fix notes.
- **Play the song** plays every section in order with a position bar. Choose 4/4, 3/4 or 6/8, the tempo,
  keyboard rhythm, bass style and drums.
- **Guide track:** sing or play along while the app records through the microphone, in sync with the song.
  Guide recordings stay in the app's audio store on this computer (not in progress backups); save them as files to keep.
- **Save audio** makes a WAV file (full song, backing only, or with the guide) to rehearse with or share.
  **Save MIDI file** opens in any DAW with chords, bass, melody and drums on separate tracks and the sections as markers.
  **Save chord chart** prints for singers and band.

## Project layout

    main.js            Electron main process: window, app:// protocol and security policy, progress files, updates, menu
    preload.js         the small API the page may use (window.gpaDesktop)
    app/index.html     page shell; loads the files below in order
    app/css/app.css    all styles
    app/js/engine.js       music theory (pure functions)
    app/js/curriculum.js   all piano lessons as data, plus validate()
    app/js/sanitize.js     cleans every state object read from storage or a backup
    app/js/backup.js       reads backup files
    app/js/core-state.js   state, saving, snapshots
    app/js/studio.js       the Song Lab arrangement engine (playback, MIDI, WAV, chord chart) and guide recording
    app/js/audio.js … views-*.js, guitar.js, about.js, reports.js, actions-boot.js   the app itself
    tests/             unit tests (npm test) and browser tests (npm run e2e)
    scripts/           font copying, sample download, project checks

## Tests

    npm test           # engine, curriculum, sanitiser, backup parser, progress files (no browser needed)
    npx playwright install chromium
    npm run e2e        # every screen and lesson in Chromium, performance tests played in time, microphone chord
                       # recognition with synthetic guitar strums (needs python3), hostile backup, undo import, save warning

## Notes

- Until code signing is set up (see RELEASING.md), Windows shows "Windows protected your PC" on the first install:
  choose **More info > Run anyway**. macOS needs right-click > Open.
- Replace `build/icon.png` (1024x1024) to change the icon.
