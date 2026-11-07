'use strict';
/* ---------------------------------------------------------------- version, what's new, credits
   APP_VERSION must match "version" in package.json (a unit test checks this). */
const APP_VERSION = '2.6.1';
const CHANGES = [
  { v: '2.6.1', title: 'MIDI keyboards connect again', items: [
    'Fixed: Connect a MIDI keyboard said "The keyboard could not be opened" on new installs, because the app did not allow the new name Chrome now uses for keyboard access. USB keyboards such as the Yamaha YPT-240 connect again.'
  ] },
  { v: '2.6.0', title: 'The Vocal Studio', items: [
    'A new Vocal Studio (Voice, in the top bar) trains your singing with the microphone. It hears the note you sing to within a few cents and shows it live as a line against the target notes.',
    'Find your range once; every exercise is then pitched for your voice. Ten graded exercises: matching notes, five-note scale, arpeggio, major and minor scales, intervals, a long steady note, echo phrases, gospel runs in time, and harmony a third below.',
    'A daily 10-minute warm-up, eight short lessons (breathing, singing in tune, vowels and tone, chest and head voice, runs, harmony, leading worship, caring for your voice), and My voice: your range, voice type, how often you are in tune, whether you lean sharp or flat, and your best scores.',
    'The best key for your voice for each of your Song Lab songs, with the Transpose number for your keyboard.',
    'Fixed: practice routines kept listening to your keyboard only until the screen was redrawn, and a redraw stopped the routine metronome.'
  ] },
  { v: '2.5.0', title: 'Your keyboard, everywhere', items: [
    'At your piano routines now listen to your keyboard: each block counts your notes and playing minutes, names the chords you play, and measures your timing against the metronome. When you are steady, it offers to raise the tempo by 5 BPM.',
    'Blocks that name a tempo (for example "metronome 60") set the metronome for you. Your playing minutes and timing are saved with each session.',
    'Settings > My keyboard: choose the Yamaha YPT-240 and routines that ask for soft and loud playing explain how to practise them on your keyboard. You can also choose to hear only the keyboard, without the app\'s sound.',
    'Song Lab: play chords in from your keyboard. Each chord you play is added to the section as a chord of the key. Melodies can be recorded from the keyboard too.',
    'Song Lab: play the song through your keyboard, using its own speakers and sounds (piano, electric piano, organ, strings, choir or pad for the chords), with bass, melody and drums on their own channels.'
  ] },
  { v: '2.4.0', title: 'Level 0: Your keyboard', items: [
    'A new Level 0 teaches your Yamaha YPT-240 itself, in 17 lessons: setting up, the buttons, connecting, choosing voices and your worship sounds, effects, metronome and tempo, transpose, the sustain pedal, styles and left-hand accompaniment, intros and endings, the built-in songs and lesson modes, the Chord Dictionary, the church sound system and recording in FL Studio.',
    'Connect the keyboard by USB and the app listens as you work: it hears your keys and chords, which kind of sound you chose (piano, organ, strings, choir), the sustain pedal and clean pedal changes, when a style starts and stops, and your tempo.',
    'Steps the keyboard cannot report, like an effect setting, you tick yourself. Every Level 0 lesson also has a 20-minute At your piano routine.',
    'Level 0 is first in the course but does not block the other levels.'
  ] },
  { v: '2.3.0', title: 'At your piano', items: [
    'Every piano lesson now has a 20-minute routine for your own piano or keyboard: a warm-up, four focused blocks written for that lesson, and a close where you play it as music.',
    'A timer walks you through the blocks with a chime between them, with a metronome beside it. The time counts as practice even while you are away from the computer.',
    'Find it as the "At your piano" step in each lesson, or start it from Today\'s practice on Home.',
    'Fixed: in many chord exercises the on-screen keyboard was too short, so some chord notes could not be clicked. The keyboard now always stretches to fit every chord.'
  ] },
  { v: '2.2.1', title: 'Clearer guide recordings', items: [
    'Song Lab guide tracks now record with music settings: the voice is no longer chopped or muted by echo cancellation while the backing plays.',
    'Choose which microphone to use, test it first, and watch a level bar while you record.',
    'Quiet recordings are brought up to a good level automatically. If the microphone heard nothing, you are told how to fix it and your earlier guide is kept.',
    'Listen to the guide track on its own.'
  ] },
  { v: '2.2.0', title: 'The Song Lab studio', items: [
    'Every section of a song (intro, verse, pre-chorus, chorus, bridge, outro) now has its own chords, up to eight, with one, two or half a bar per chord.',
    'A melody for each section, as long as the section. Notes keep the length you hold them, earlier takes are kept, and a note editor lets you fix any note.',
    'Play the whole song with a moving position bar. Choose 4/4, 3/4 or 6/8, tempos from 40 to 200 BPM, and bass styles including walking bass.',
    'Record a guide track (your voice or instrument) in sync with the song.',
    'Save the song as an audio file (WAV): the full song, the backing only, or with your guide track. Rehearse with your team or sing over it anywhere.',
    'MIDI and chord-chart exports follow every section\'s own chords, and the time signature.'
  ] },
  { v: '2.1.0', title: 'From beginner to mastery', items: [
    'Two new levels: Level 4 Advanced keyboard (17 lessons) and Level 5 Mastery (9 lessons), from altered chords, shout music, hymns and playing by ear to musical direction, releasing your songs and a mastery recital.',
    'Mastery is now proved at the instrument: every new challenge is a timed performance test. Play in time with the click as the tempo rises, often in several or all 12 keys.',
    'Save any performance take as a MIDI file, record yourself through the microphone, and have your teacher or music director sign off key performances.',
    'Daily technique in the key of the day: scale, arpeggio and ii – V – I, each remembering your tempo in every key.',
    'Play it back: an ear-training drill where you hear a progression and play it back, rising through six levels.',
    'Guitar: the app can now listen to your guitar through the microphone, tick off chords as you play them, and count your chord changes in the drill.',
    'Progress reports and the class summary now show performance tests and teacher sign-offs.'
  ] },
  { v: '2.0.0', title: 'Gospel Music Academy', items: [
    'New name: Gospel Music Academy. Choose piano, guitar or both when you start.',
    'Your progress is now also saved to a file on your computer, with an automatic snapshot every day. You can restore a snapshot or undo an import under Profile > Your data.',
    'You are warned straight away if progress cannot be saved.',
    'Backup files are checked more strictly, so a damaged or tampered file cannot harm the app.',
    'Find any lesson with the new search box on Course. Finished modules fold away.',
    'The guitar course now unlocks lesson by lesson, like the piano course, with module tests to skip ahead.',
    'Practice has a Today card and tabs. A new Timing calibration makes play-along scores fair on every computer.',
    'Settings: light or dark theme and larger text. View > Larger text and Ctrl + / Ctrl - also work.',
    'Print a progress report for your music director or teacher, and see several learners side by side with Class summary.',
    'The back button on your mouse and Alt + Left now go back a screen.'
  ] },
  { v: '1.9.0', title: 'Choosing a sound', items: ['Seven sounds for playing and playback: grand piano, electric piano, organ, strings, trumpet, choir and flute.'] }
];

function changesHtml(limit) {
  return CHANGES.slice(0, limit || CHANGES.length).map(c => '<div class="chg"><h4>Version ' + esc(c.v) + ' · ' + esc(c.title) + '</h4><ul>' + c.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('');
}
/* shown once on Home after the app was updated to a new version (not on a fresh install) */
function whatsNewCard() {
  const seen = S.events.lastVersion;
  if (seen === APP_VERSION || !S.profile.onboarded) return '';
  if (!seen && !(S.xp > 0 || Object.keys(S.lessons).length)) return '';   // a fresh start, nothing was updated
  return '<section class="card callout whatsnew"><div class="split"><h3>What is new in version ' + esc(APP_VERSION) + '</h3><button class="btn ghost sm" type="button" data-act="wndismiss">Got it</button></div>' + changesHtml(1) + '</section>';
}
function markVersionSeen() { if (S.events.lastVersion !== APP_VERSION) { S.events.lastVersion = APP_VERSION; touch(); } }

/* desktop details (version, updates) arrive asynchronously from the main process */
const AppInfo = { info: null, update: null };
async function loadAppInfo() {
  if (!Desk) return;
  try { const r = await Desk.info(); if (r && r.ok) { AppInfo.info = r; AppInfo.update = r.update; } } catch (e) { /* ignore */ }
  Desk.onUpdateStatus(s => { AppInfo.update = s; const el = $('#updstate'); if (el) el.innerHTML = updateText(); });
}
function updateText() {
  const u = AppInfo.update;
  if (!Desk) return 'This is the browser version. It is always up to date when you reload the page.';
  if (!u || u.status === 'dev') return 'Updates are checked only in the installed app.';
  const when = u.lastCheck ? ' Last checked ' + new Date(u.lastCheck).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '.' : '';
  return esc(({
    idle: 'Updates are checked automatically when you are online.',
    checking: 'Checking for updates…',
    current: 'You have the latest version.' + when,
    downloading: 'Downloading version ' + (u.version || '') + '… ' + (u.percent || 0) + '%',
    ready: 'Version ' + (u.version || '') + ' is ready. It installs when you restart the app.',
    error: (u.error || 'The update check did not work.') + when
  })[u.status] || '');
}
function aboutCard() {
  const i = AppInfo.info, snd = Snd.info();
  return '<section class="card"><h3>Gospel Music Academy</h3><p>Version ' + esc(i ? i.version : APP_VERSION) + (i ? ' · Electron ' + esc(i.electron) + ' · ' + esc(i.platform) : ' · browser version') + '</p>' +
    '<p id="updstate" class="muted" aria-live="polite">' + updateText() + '</p>' +
    (Desk ? '<div class="row wrap"><button class="btn primary" type="button" data-act="updcheck">Check for updates</button></div>' : '') + '</section>' +
    '<section class="card"><h3>What is new</h3>' + changesHtml(2) + '</section>' +
    '<section class="card"><h3>Privacy</h3><p class="muted">Your name and progress stay on this computer. The app only goes online to check for updates; it has no account and sends no data about you anywhere.</p></section>' +
    '<section class="card"><h3>Credits</h3><ul class="tiny">' +
    (snd.credit ? '<li>' + esc(snd.credit) + '</li>' : '<li>Piano sound: built-in synthesised piano.</li>') +
    '<li>Fonts: Bricolage Grotesque, Hanken Grotesk and IBM Plex Mono, under the SIL Open Font License.</li>' +
    '<li>Lessons, songbook pieces and exercises are original to Gospel Music Academy.</li></ul></section>';
}
