# Gospel Piano Academy – Desktop Edition

The web app (`app/index.html`) wrapped in Electron. Works fully offline (fonts are bundled at build time),
keeps progress on the device, and supports MIDI keyboards.

## Build the installers

### Option A – on your own computer (needs Node.js 20+ from nodejs.org)
    npm install
    npm run dist:win      # Windows installer  -> dist/Gospel Piano Academy Setup 1.0.0.exe
    npm run dist:mac      # macOS (build on a Mac) -> .dmg
    npm run dist:linux    # Linux -> .AppImage and .deb
Try it without installing: `npm start`

### Option B – in the cloud with automatic updates (GitHub Releases)
1. Create a free GitHub account and a new **Public** repository (for example `gospel-piano-academy`). Public is needed so installed apps can check for updates without a password.
2. Upload this whole folder to the repository (Add file > Upload files; include the hidden-looking `.github` folder).
3. Open the **Actions** tab > **Build and publish Windows installer** > **Run workflow**. After about 5 to 10 minutes there is a new release under **Releases** on the repository page, containing `Gospel Piano Academy Setup x.y.z.exe`.
4. Download that installer once and install it (Windows may show "Windows protected your PC": choose **More info > Run anyway**).
5. **To publish an update later:** change the app (for example upload a new `app/index.html`), raise `"version"` in `package.json` (for example 1.2.0 to 1.2.1), then run the workflow again. Every installed copy checks GitHub when the app starts and every few hours while online, downloads the new version quietly, and asks "Restart now / Later". Progress is kept.
If the installed app is offline, or no newer release exists, it simply carries on as normal.

## Recorded piano sound (optional, recommended)
The app has a built-in synthesised piano (held notes, key release, touch, sustain pedal). For a real recorded piano:

    npm run get-samples      # downloads Salamander Grand Piano (CC BY 3.0) into app/samples, needs internet once
    npm run dist:win         # rebuild so the samples are included

The app detects `app/samples/manifest.json` automatically and shows "Recorded grand piano" on the Profile screen.
You can also supply your own recordings: put audio files (mp3/ogg/wav) in `app/samples` and list them in manifest.json,
for example `{"notes": {"C3": "C3.mp3", "Ds3": "Ds3.mp3"}, "credit": "..."}` (s or # = sharp). Eight or more notes are needed;
other notes are pitched from the nearest sample.

## Playing and the sustain pedal
- MIDI keyboards: key speed (velocity) and the sustain pedal are supported.
- Computer: hold **Shift** to sustain; the Piano Lab also has a Sustain pedal button.
- Keyboard users can Tab to the piano, move with the arrow keys (Page Up/Down = octave) and play with Enter or Space.

## Backing up progress
Profile -> Backup and restore: **Export progress** saves a .json file; **Import progress** restores it (after a confirmation).
The Home screen reminds you to back up if you have not done so for 14 days.

## Notes
- Windows will show a "Windows protected your PC" notice because the installer is not code-signed.
  Choose **More info -> Run anyway**. (Signing needs a paid certificate.)
- Progress is stored locally in the app, separate from the website version's browser storage,
  so existing web progress does not carry over.
- To update the app: replace `app/index.html`, raise `version` in package.json, rebuild.
- Replace `build/icon.png` (1024x1024) to change the icon.

## Learning features added in this version

- **Bigger quiz pools.** Most lessons now generate fresh questions each attempt, and questions you have seen recently are shown last.
- **Spaced review.** Finished lessons come back after 1, 3, 7, 14, 30 and 60 days. Practice > Review.
- **Reading music.** A nine-lesson "Reading music" module (staff, clefs, ledger lines, accidentals, key signatures, rhythm, chords on the staff, first sight-reading), staff notation in quizzes and lesson visuals, a staff display in the Piano Lab, and an adaptive sight-reading drill under Practice (six levels, moves up or down with your accuracy).

## Songbook (Practice > Songbook)

Six original practice pieces (no copyrighted tunes), each with a notated lead sheet and chord symbols, a backing track, and three modes: **Listen**, **Learn** (waits for each note) and **Play along** (four clicks, then the backing plays and your timing is scored with stars). Songs where you recorded a melody in the Song Lab get the same lead sheet and play-along from their melody step.

## First-time checklist on your own computer

These two steps need normal internet access, so they could not be done in the cloud workspace:

1. `npm install` then `npm run get-samples` (downloads the recorded piano samples and writes `app/samples/manifest.json`). Start the app (`npm start`) and check Settings shows the recorded piano.
2. `npm run dist:win` (or `dist:mac` / `dist:linux`). The installer appears in `dist/`. Or push the project to GitHub and run the "build" workflow to get all three.

## Taking a song out of the app (Song Lab > open a project > "Take it to your DAW")

- **Save MIDI file** writes a standard MIDI file: a Chords track, a Bass track and (if you recorded one) a Melody track, with your song sections (Intro, Verse, Chorus...) as markers and the tempo and time signature already set. Open it in Reaper, Cakewalk, GarageBand, FL Studio, Logic or any other DAW and give each track a sound.
- **Save chord chart** writes a clean page (.html) with the chords and Roman numbers for each section and your lyrics. Open it in any browser and print it or save it as a PDF for your singers and band.
- Every section in your song structure plays the four chords once. The melody goes in the Chorus sections, or in every section if you choose that (or if the structure has no Chorus).

## Choosing a sound

Pick a sound from the **Sound** menu in Piano Lab, Song Lab, a Songbook song or Profile: Grand piano, Electric piano, Organ, Strings, Trumpet, Choir (aah) or Flute. It applies to the keys you play (screen keys, computer keyboard and MIDI keyboard) and to the playback in Piano Lab, Song Lab, Songbook and your song projects. Lessons and ear training always use the piano so every exercise sounds the same.

- In Songbook and song projects the melody uses the sound you chose. The chords use it too when it suits chords (piano, electric piano, organ, strings, choir) and fall back to piano for Trumpet and Flute.
- All the extra sounds are synthesised in the app, so they need no downloads and work offline. They are good practice and writing sounds, not recordings of real instruments.
