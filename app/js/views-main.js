'use strict';
/* ---------------------------------------------------------------- HOME */
function viewHome() {
  const t = ensureToday(), nl = nextLesson();
  const streak = E.streak(S.practice.days, t.date), rk = E.rankFor(S.xp);
  const mins = Math.floor((S.practice.days[t.date] || 0) / 60), goal = S.prefs.dailyMin;
  const lvl = nl ? C.byId[nl].level : 'G', lp = levelProgress(lvl), L = C.LEVELS.find(x => x.id === lvl);
  const mod = nl ? C.MODULES.find(m => m.id === C.byId[nl].module) : null;
  const plan = warmupPlan(), ear = suggestEar();
  const week = Array.from({ length: 7 }, (_, i) => E.addDays(t.date, i - 6));
  const items = [
    { key: 'warm', title: 'Warm-up: ' + plan.title, sub: plan.sub, act: 'pview', attrs: 'data-view="warm"' },
    nl ? { key: 'lesson', title: 'Lesson: ' + C.byId[nl].title, sub: 'About ' + C.byId[nl].minutes + ' minutes', act: 'openlesson', attrs: 'data-id="' + nl + '"' } : { key: 'lesson', title: 'Review a lesson', sub: 'Replay any lesson from the course.', act: 'go', attrs: 'data-to="course"' },
    { key: 'ear', title: 'Ear training: ' + E.EAR_TYPES[ear].label, sub: '8 questions · ' + E.EAR_TYPES[ear].hint, act: 'pview', attrs: 'data-view="ear" data-type="' + ear + '"' }
  ];
  const inst = S.profile.instrument || 'piano';
  const gl = inst !== 'piano' ? gNextLesson() : null, gx = gl ? gFind(gl) : null;
  if (inst === 'guitar') {
    items[0] = { key: 'warm', title: 'Warm-up: tune your guitar', sub: 'Use the tuner, string by string.', act: 'gtunopen', attrs: '' };
    items[1] = gx ? { key: 'lesson', title: 'Guitar lesson: ' + gx.title, sub: 'About ' + gx.mins + ' minutes', act: 'gopen', attrs: 'data-id="' + esc(gl) + '"' } : { key: 'lesson', title: 'Review a guitar lesson', sub: 'Replay any lesson from the course.', act: 'ctab', attrs: 'data-t="guitar"' };
  }
  const guitarHero = gx
    ? '<section class="card hero-card"><p class="eyebrow">Continue the guitar course</p><h2>' + esc(gx.title) + '</h2><p class="muted">' + gDoneCount() + ' of ' + gOrder().length + ' guitar lessons done</p><p>' + esc(gx.why) + '</p><button class="btn primary lg" type="button" data-act="gopen" data-id="' + esc(gl) + '">Start lesson' + icon('chev') + '</button></section>'
    : (inst !== 'piano' ? '<section class="card hero-card"><p class="eyebrow">Guitar course complete</p><h2>You have finished every guitar lesson.</h2><p>Keep playing with the jam tracks and the chord-change drills in the guitar course.</p><button class="btn primary" data-act="ctab" data-t="guitar">Open the guitar course</button></section>' : '');
  const undoCard = ui.undoImport ? '<section class="card callout"><div class="split"><div><h3>Progress replaced from a backup</h3><p class="muted">If this was a mistake, put back what was on this device before the import.</p></div><button class="btn ghost" type="button" data-act="undoimport">Undo import</button></div></section>' : '';
  const dueHome = reviewDue().length;
  if (inst !== 'guitar' && techReady()) items.push({ key: 'tech', title: 'Technique: ' + fmt(keyOfDay()) + ' major, the key of the day', sub: 'Scale, arpeggio and ii – V – I', act: 'pview', attrs: 'data-view="technique"' });
  if (dueHome || t.items.review) items.splice(2, 0, { key: 'review', title: dueHome ? 'Review: ' + dueHome + ' skill' + (dueHome === 1 ? '' : 's') + ' due' : 'Review done', sub: 'Quick questions on lessons you finished', act: 'pview', attrs: 'data-view="review"' });
  const html = '<div class="screen home">' +
    '<div class="greet"><div><p class="eyebrow">' + greeting() + '</p><h1>' + esc(S.profile.name ? S.profile.name : 'Welcome back') + '</h1></div>' +
    '<div class="stats"><span class="stat" title="Practice streak">' + icon('flame') + '<b>' + streak + '</b><small>day' + (streak === 1 ? '' : 's') + '</small></span><span class="stat" title="Your level">' + icon('star') + '<small>Level</small><b>' + rk.level + '</b><small>' + esc(rk.name) + '</small></span></div></div>' +
    whatsNewCard() + undoCard + (inst === 'guitar' ? guitarHero : (nl ? '<section class="card hero-card"><p class="eyebrow">Continue learning</p><h2>' + esc(C.byId[nl].title) + '</h2><p class="muted">' + esc(mod.title) + (lessonStatus(nl) === 'progress' ? ' · in progress' : '') + '</p><p>' + esc(C.byId[nl].why) + '</p><button class="btn primary lg" type="button" data-act="openlesson" data-id="' + nl + '">' + (lessonStatus(nl) === 'progress' ? 'Continue lesson' : 'Start lesson') + icon('chev') + '</button></section>'
      : '<section class="card hero-card"><p class="eyebrow">Course complete</p><h2>You have finished every lesson in this release.</h2><p>Keep your hands in shape with the Practice screen, and turn your chords into songs in the Song Lab.</p><div class="row wrap"><button class="btn primary" data-act="go" data-to="practice">Practice</button><button class="btn ghost" data-act="go" data-to="song">Song Lab</button></div></section>') + (inst === 'both' ? guitarHero : '')) +
    '<section class="card"><div class="split"><h3>Today’s practice</h3><span class="tiny">' + mins + ' of ' + goal + ' min</span></div>' + bar(Math.min(100, pct(mins, goal))) +
    '<ul class="todo">' + items.map(i => '<li class="' + (t.items[i.key] ? 'done' : '') + '"><span class="tick">' + (t.items[i.key] ? icon('check') : '') + '</span><div><b>' + esc(i.title) + '</b><span class="tiny">' + esc(i.sub) + '</span></div><button class="btn ghost sm" type="button" data-act="' + i.act + '" ' + i.attrs + '>' + (t.items[i.key] ? 'Again' : 'Start') + '</button></li>').join('') + '</ul>' +
    '<div class="week" aria-label="Last seven days">' + week.map(d => '<span class="day' + ((S.practice.days[d] || 0) >= 60 ? ' on' : '') + (d === t.date ? ' today' : '') + '" title="' + d + '"><i></i><small>' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d + 'T12:00:00').getDay()] + '</small></span>').join('') + '</div></section>' +
    (inst === 'guitar' ? '' : '<section class="card"><div class="split"><h3>' + esc(L.name) + ' · ' + esc(L.title) + '</h3><span class="tiny">' + lp.done + ' of ' + lp.total + ' lessons</span></div>' + bar(pct(lp.done, lp.total)) +
    '<p class="muted">' + esc(L.goal) + '</p><p class="tiny">' + totalMastered() + ' of ' + C.order.length + ' lessons mastered overall.</p></section>') +
    (backupDue() ? '<section class="card"><div class="split"><div><h3>Back up your progress</h3><p class="muted">Save a backup file now and then and keep it somewhere safe, such as a flash drive or email, so you never lose your progress.</p></div><button class="btn primary" type="button" data-act="pexport">Back up now</button></div></section>' : '') +
    '<section class="tools"><button class="tool" data-act="go" data-to="lab">' + icon('piano') + '<b>Piano Lab</b><span>Chords, scales, free play</span></button>' +
    '<button class="tool" data-act="go" data-to="practice">' + icon('practice') + '<b>Practice</b><span>Ear training, sprints, metronome</span></button>' +
    '<button class="tool" data-act="go" data-to="song">' + icon('song') + '<b>Song Lab</b><span>Progressions and song projects</span></button></section></div>';
  return { html };
}

/* ---------------------------------------------------------------- COURSE */
function lockReason(id) {
  const need = C.byId[id].req.filter(r => !isDone(r));
  return need.length ? 'Finish ' + need.map(r => '“' + C.byId[r].title + '”').join(' and ') + ' first' : '';
}
function courseTabs(active) {
  return '<div class="row" role="tablist" aria-label="Choose a course" style="gap:.5rem;margin-bottom:.8rem">' + [['piano', 'Piano course'], ['guitar', 'Guitar course']].map(t => '<button type="button" role="tab" aria-selected="' + (t[0] === active) + '" class="btn ' + (t[0] === active ? 'primary' : 'ghost') + '" style="flex:1" data-act="ctab" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
}
function lessonRow(id) {
  const l = C.byId[id], st = lessonStatus(id), un = isUnlocked(id);
  const ic = !un ? icon('lock') : st === 'mastered' ? icon('star') : st === 'done' ? icon('check') : st === 'progress' ? '<i class="half"></i>' : '<i class="ring"></i>';
  return '<li class="lrow ' + (un ? st : 'locked') + '"><span class="lstat" title="' + (!un ? 'Locked' : st) + '">' + ic + '</span><div class="lmain"><b>' + esc(l.title) + '</b><span class="tiny">' + esc(l.cat) + ' · ' + l.minutes + ' min' + (st === 'mastered' ? ' · mastered' : st === 'done' ? ' · complete' : '') + (!un ? ' · ' + esc(lockReason(id)) : '') + '</span></div>' +
    '<button class="btn sm ' + (un && st !== 'done' && st !== 'mastered' ? 'primary' : 'ghost') + '" type="button" data-act="openlesson" data-id="' + id + '"' + (un ? '' : ' disabled') + '>' + (!un ? 'Locked' : st === 'new' ? 'Start' : st === 'progress' ? 'Continue' : 'Review') + '</button></li>';
}
/* search box shared by both courses; typing updates only the list below it so focus stays in the box */
function courseSearch(kind) {
  return '<div class="csearch"><label class="field"><span>Find a lesson</span><input id="csearch" type="search" placeholder="Type a lesson name or topic" value="' + esc(ui.courseQ || '') + '" data-bind="csearch" data-kind="' + kind + '" autocomplete="off"></label>' +
    '<label class="switch"><input type="checkbox" data-bind="cunfin"' + (ui.courseUnfinished ? ' checked' : '') + '><span>Only lessons I have not finished</span></label></div>';
}
function pianoCourseBody() {
  const q = (ui.courseQ || '').trim().toLowerCase(), unfin = !!ui.courseUnfinished;
  if (q || unfin) {
    const hits = C.order.filter(id => {
      const l = C.byId[id], m = C.MODULES.find(x => x.id === l.module);
      if (unfin && isDone(id)) return false;
      return !q || (l.title + ' ' + l.cat + ' ' + (m ? m.title : '')).toLowerCase().indexOf(q) >= 0;
    });
    return '<section class="card"><div class="split"><h3>' + hits.length + (hits.length === 1 ? ' lesson' : ' lessons') + '</h3><button class="btn ghost sm" type="button" data-act="cclear">Clear</button></div>' +
      (hits.length ? '<ul class="lessons">' + hits.slice(0, 80).map(lessonRow).join('') + '</ul>' : '<p class="muted">No lessons match. Try a shorter word, such as “chord” or “rhythm”.</p>') + '</section>';
  }
  const nl = nextLesson(), curLvl = nl ? C.byId[nl].level : 'G';
  const open = ui.courseOpen || (ui.courseOpen = {});
  return C.LEVELS.map(L => {
    const lp = levelProgress(L.id);
    const isOpen = open[L.id] !== undefined ? open[L.id] : L.id === curLvl;
    const mods = C.MODULES.filter(m => m.level === L.id);
    return '<section class="card level"><button type="button" class="lvl-head" data-act="toglevel" data-id="' + L.id + '" aria-expanded="' + isOpen + '"><div><p class="eyebrow">' + esc(L.name) + '</p><h3>' + esc(L.title) + '</h3></div><div class="lvl-meta"><span class="tiny">' + lp.done + ' of ' + lp.total + '</span>' + icon('chev', isOpen ? 'rot' : '') + '</div></button>' + bar(pct(lp.done, lp.total)) +
      (isOpen ? '<p class="muted">' + esc(L.goal) + '</p>' + mods.map(m => {
        const done = m.lessons.filter(isDone).length, first = m.lessons[0];
        const canTest = isUnlocked(first) && done < m.lessons.length && !S.testouts[m.id];
        const list = '<ul class="lessons">' + m.lessons.map(lessonRow).join('') + '</ul>';
        if (done === m.lessons.length) // finished modules fold away so the open work stands out
          return '<details class="module done-mod"><summary><span><b>' + esc(m.title) + '</b><span class="tiny"> · all ' + done + ' lessons finished' + (S.testouts[m.id] ? ' (test-out)' : '') + '</span></span></summary>' + list + '</details>';
        return '<div class="module"><div class="split"><div><h4>' + esc(m.title) + '</h4><p class="tiny">' + esc(m.blurb) + '</p></div><span class="tiny nowrap">' + done + '/' + m.lessons.length + '</span></div>' +
          (S.recommend[m.id] && canTest ? '<p class="tag ok">Your placement check suggests you may be ready to test out.</p>' : '') + list +
          (canTest ? '<div class="testout"><span class="tiny">Already know this? Prove it with a short test and keyboard check.</span><button class="btn ghost sm" type="button" data-act="testout" data-id="' + m.id + '">Test out of this module</button></div>' : '') + '</div>';
      }).join('') : '') + '</section>';
  }).join('');
}
function viewCourse() {
  if (ui.courseTab === 'guitar') return viewGuitar();
  ui.courseTab = 'piano';
  return { html: '<div class="screen">' + courseTabs('piano') + '<div class="pagehead"><h1>Piano course</h1><p class="muted">Learn, play, practise, apply, test, master. Each lesson unlocks the next.</p></div>' + courseSearch('piano') + '<div id="cresults">' + pianoCourseBody() + '</div></div>' };
}

/* ---------------------------------------------------------------- TEST-OUT */
function openTestout(id) { ui.testout = { id, stage: 'quiz', ex: 0, picks: null }; go('testout'); }
function viewTestout() {
  const st = ui.testout; if (!st) return viewCourse();
  const M = C.MODULES.find(m => m.id === st.id);
  if (!st.qs) {
    const pool = []; M.lessons.forEach(id => C.byId[id].quiz.forEach(q => pool.push(Object.assign({ _cat: C.byId[id].cat }, q))));
    st.qs = E.shuffle(pool).slice(0, Math.min(8, pool.length));
    st.tasks = E.shuffle(M.lessons).slice(0, 2).map(id => ({ id, ex: C.byId[id].challenge }));
  }
  const head = '<div class="pagehead"><button class="btn ghost sm" type="button" data-act="go" data-to="course">' + icon('back') + 'Course</button><h1>Test out: ' + esc(M.title) + '</h1><p class="muted">Part 1 is a short quiz (80% to pass). Part 2 is two keyboard challenges with no hints. Passing marks every lesson in the module as mastered.</p></div>';
  let body = '';
  if (st.stage === 'quiz') body = '<div class="card"><p class="eyebrow">Part 1 of 2 · Quiz</p><div id="tq"></div></div>';
  if (st.stage === 'play') body = '<div class="card"><p class="eyebrow">Part 2 of 2 · Keyboard ' + (st.ex + 1) + ' of ' + st.tasks.length + ' · ' + esc(C.byId[st.tasks[st.ex].id].title) + '</p><div id="exh"></div></div>';
  if (st.stage === 'fail') body = '<div class="card"><h2>Not this time.</h2><p>' + esc(st.msg) + '</p><p class="muted">Nothing is lost. Work through the lessons and come back when you are ready.</p><div class="row wrap"><button class="btn primary" data-act="openlesson" data-id="' + M.lessons[0] + '">Start the first lesson</button><button class="btn ghost" data-act="testout" data-id="' + st.id + '">Try the test again</button></div></div>';
  if (st.stage === 'pass') body = '<div class="card hero-card"><p class="eyebrow">Passed</p><h2>Module skipped, with proof.</h2><p>Every lesson in “' + esc(M.title) + '” is now marked mastered.</p><button class="btn primary" data-act="go" data-to="course">Back to the course</button></div>';
  return {
    html: '<div class="screen">' + head + body + '</div>',
    mount(root) {
      let h = null;
      if (st.stage === 'quiz') {
        h = Quiz($('#tq', root), st.qs, {
          passMark: 80, shuffleQuestions: false,
          onAnswer: (q, ok) => recordAnswer(q._cat, ok),
          onFinish: res => {
            if (res.pct >= 80) { st.quizPct = res.pct; }
            else { S.scores.push({ kind: 'testout', id: st.id, title: M.title + ' test-out', pct: res.pct, at: Date.now() }); touch(); }
          },
          nextHtml: pc => pc >= 80 ? '<button class="btn primary" type="button" data-act="toplay">Continue to the keyboard check</button>' : ''
        });
      }
      if (st.stage === 'play') {
        h = mountExercise($('#exh', root), st.tasks[st.ex].ex, {
          hints: false,
          onDone: () => {
            setTimeout(() => {
              if (st.ex + 1 < st.tasks.length) { st.ex++; render(); } else { finishTestout(); }
            }, 900);
          }
        });
      }
      return () => h && h.destroy();
    }
  };
}
function finishTestout() {
  const st = ui.testout, M = C.MODULES.find(m => m.id === st.id);
  M.lessons.forEach(id => { const r = lessonRec(id); if (!isDone(id)) { r.status = 'mastered'; r.src = 'testout'; r.at = Date.now(); scheduleReview(id, 1); } });
  S.testouts[M.id] = Date.now();
  S.scores.push({ kind: 'testout', id: M.id, title: M.title + ' test-out', pct: st.quizPct || 80, at: Date.now() });
  award(60, 'module tested out'); touch(); checkAch();
  st.stage = 'pass'; render();
}

/* ---------------------------------------------------------------- ONBOARDING + placement check */
const DIAG = [
  { m: 'keys', q: 'Which white key sits just left of a group of two black keys?', o: ['C', 'D', 'F', 'A'], a: 0, why: 'C is always just left of the pair of black keys.' },
  { m: 'keys', q: 'What is the black key just right of F called?', o: ['F♯ (or G♭)', 'E♭', 'A♭', 'D♯'], a: 0, why: 'One half step above F is F♯, also written G♭.' },
  { m: 'rhythm', q: 'How many beats does a half note last in 4/4?', o: ['1', '2', '3', '4'], a: 1, why: 'Whole = 4, half = 2, quarter = 1.' },
  { m: 'rhythm', q: 'Which time signature feels like two groups of three?', o: ['4/4', '3/4', '6/8', '2/2'], a: 2, why: '6/8 is felt as ONE two three FOUR five six.' },
  { m: 'scales', q: 'Which note does G major need that C major does not?', o: ['B♭', 'F♯', 'C♯', 'E♭'], a: 1, why: 'G major has one sharp: F♯.' },
  { m: 'scales', q: 'How many sharps does D major have?', o: ['0', '1', '2', '3'], a: 2, why: 'F♯ and C♯.' },
  { m: 'chords', q: 'Which notes make an A minor triad?', o: ['A C E', 'A C♯ E', 'A D E', 'A C F'], a: 0, why: 'A, C, E.' },
  { m: 'chords', q: 'In C major, which chord is the vi?', o: ['Dm', 'Em', 'Am', 'Bdim'], a: 2, why: 'The sixth note is A, so the vi chord is Am.' },
  { m: 'chords', q: 'Listen. Is this chord major or minor?', o: ['Major', 'Minor'], a: 1, why: 'D minor has the lower third.', listen: { kind: 'chord', root: 'D', quality: 'minor', oct: 4 } },
  { m: 'found', q: 'What interval is C up to G?', o: ['Perfect 4th', 'Perfect 5th', 'Major 3rd', 'Octave'], a: 1, why: 'Seven half steps: a perfect 5th.' },
  { m: 'found', q: 'C/E means…', o: ['A C chord with E in the bass', 'C and E chords together', 'E minor', 'C major 7th'], a: 0, why: 'The note after the slash is the lowest note.' },
  { m: 'gospel1', q: 'Which chord leans strongly toward resolving to C?', o: ['Cmaj7', 'Am7', 'G7', 'Fmaj7'], a: 2, why: 'G7 is the dominant 7th in C.' }
];
const GOALS = ['Accompany singers', 'Play in church', 'Lead worship', 'Write songs', 'Produce music', 'Play for enjoyment'];
function viewOnboarding() {
  const ob = ui.onboarding || (ui.onboarding = { step: 0, self: {}, goals: S.profile.goals.slice(), name: S.profile.name, instrument: S.profile.instrument || 'piano' });
  const total = ob.instrument === 'guitar' ? 1 : 3;
  let body = '';
  if (ob.step === 0) body = '<div class="welcome"><p class="eyebrow">Gospel Music Academy</p><h1>Become the musician your church can lean on.</h1><p class="lede">Learn gospel piano or guitar from the very first note, or prove what you already know. Every lesson has you play, hear and test the idea. Mastery is earned at your instrument, not by tapping Next.</p><ul class="bul"><li>A short setup and a 12-question check (about 4 minutes).</li><li>You can skip it and start from the beginning.</li><li>Nothing is skipped for you. To jump ahead you pass a test.</li></ul><div class="row wrap"><button class="btn primary lg" data-act="obnext">Get started</button><button class="btn ghost" data-act="obskip">Skip, start at the beginning</button></div></div>';
  if (ob.step === 1) body = '<div class="card"><p class="eyebrow">Step 1 of ' + total + ' · About you</p><h2>What should we call you?</h2><label class="field"><span>Your name</span><input id="ob-name" type="text" maxlength="40" value="' + esc(ob.name || '') + '" autocomplete="given-name" data-bind="obname"></label>' +
    '<h3>Which instrument are you learning?</h3><div class="seg" role="group" aria-label="Instrument">' + [['piano', 'Piano or keyboard'], ['guitar', 'Guitar'], ['both', 'Both']].map(o => '<button type="button" class="' + (ob.instrument === o[0] ? 'on' : '') + '" aria-pressed="' + (ob.instrument === o[0]) + '" data-act="obinst" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div><p class="tiny">You can open both courses at any time from Course.</p>' +
    '<h3>What do you want to do with your music?</h3><div class="chips">' + GOALS.map(g => '<button type="button" class="chip' + (ob.goals.includes(g) ? ' on' : '') + '" data-act="obgoal" data-g="' + esc(g) + '" aria-pressed="' + ob.goals.includes(g) + '">' + esc(g) + '</button>').join('') + '</div>' +
    '<div class="row wrap"><button class="btn ghost" data-act="obback">Back</button>' + (ob.instrument === 'guitar' ? '<button class="btn primary" data-act="obfinish">Start learning</button>' : '<button class="btn primary" data-act="obnext">Continue</button>') + '</div></div>';
  if (ob.step === 2) {
    const rows = [['piano', 'Piano playing'], ['gospel', 'Gospel or church playing'], ['songwriting', 'Songwriting'], ['production', 'Music production']];
    body = '<div class="card"><p class="eyebrow">Step 2 of 3 · Your experience</p><h2>How much have you done before?</h2><p class="muted">This only shapes suggestions. Your skills are checked in the next step.</p>' +
      rows.map(r => '<div class="selfrow"><span>' + r[1] + '</span><div class="seg" role="group" aria-label="' + r[1] + '">' + [['none', 'None'], ['some', 'Some'], ['lots', 'Experienced']].map(o => '<button type="button" class="' + (ob.self[r[0]] === o[0] ? 'on' : '') + '" data-act="obself" data-r="' + r[0] + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div></div>').join('') +
      '<div class="row wrap"><button class="btn ghost" data-act="obback">Back</button><button class="btn primary" data-act="obnext">Start the skills check</button></div></div>';
  }
  if (ob.step === 3) body = '<div class="card"><p class="eyebrow">Step 3 of 3 · Skills check</p><h2>Twelve quick questions</h2><p class="muted">Guess if you are unsure. A wrong answer costs nothing.</p><div id="dq"></div></div>';
  if (ob.step === 4) {
    const d = ob.result;
    body = '<div class="card hero-card"><p class="eyebrow">Your starting point</p><h2>' + esc(d.headline) + '</h2><p>' + esc(d.text) + '</p><ul class="checks">' + d.mods.map(m => '<li class="' + (m.pct >= 75 ? 'ok' : '') + '">' + (m.pct >= 75 ? icon('check') : '<i class="dot"></i>') + '<span><b>' + esc(m.title) + '</b> · ' + m.pct + '%' + (m.pct >= 75 ? ' · test-out suggested' : '') + '</span></li>').join('') + '</ul><p class="tiny">To skip a module you still pass its test-out in the Course. Suggested ones are marked there.</p><button class="btn primary lg" data-act="obfinish">Begin</button></div>';
  }
  return {
    html: '<div class="screen narrow">' + body + '</div>',
    mount(root) {
      if (ob.step !== 3) return;
      const h = Quiz($('#dq', root), DIAG, {
        onFinish: res => {
          const per = {}; DIAG.forEach((q, i) => { const a = res.answers[i]; per[q.m] = per[q.m] || { c: 0, t: 0 }; per[q.m].t++; if (a && a.ok) per[q.m].c++; });
          const mods = ['keys', 'rhythm', 'scales', 'chords', 'found', 'gospel1'].map(id => ({ id, title: C.MODULES.find(m => m.id === id).title, pct: pct(per[id].c, per[id].t) }));
          const l1 = mods.slice(0, 4), l1avg = l1.reduce((a, m) => a + m.pct, 0) / 4;
          let headline, text;
          if (res.pct >= 80) { headline = 'You already know a lot.'; text = 'Your answers suggest you can test out of many modules. Take the test-outs in the Course to skip ahead with proof, and start the first one you cannot pass.'; }
          else if (l1avg >= 50) { headline = 'You have some foundations.'; text = 'Start at the beginning at your own pace. Where a module feels easy, test out of it from the Course.'; }
          else { headline = 'A fresh start.'; text = 'The first lessons take about six minutes each. Take them in order and you will be playing chords within a few sessions.'; }
          ob.result = { headline, text, mods, pct: res.pct, per };
          ob.diag = { pct: res.pct, per: mods.reduce((o, m) => { o[m.id] = m.pct; return o; }, {}) };
          const btn = $('#dq .btn.primary');
          if (!btn) $('#dq .row').insertAdjacentHTML('beforeend', '<button class="btn primary" type="button" data-act="obnext">See my starting point</button>');
        },
        resultExtra: () => '', nextHtml: () => '<button class="btn primary" type="button" data-act="obnext">See my starting point</button>'
      });
      return () => h.destroy();
    }
  };
}
