'use strict';
/* ---------------------------------------------------------------- spaced review */
const REV_DAYS = [1, 3, 7, 14, 30, 60];
const reviewMap = () => S.review || (S.review = {});
function scheduleReview(id, box) {
  const R = reviewMap(); if (R[id] || !C.byId[id]) return;
  box = box || 0;
  R[id] = { box, due: E.addDays(E.dateStr(), REV_DAYS[box]), n: 0, lapses: 0 };
  touch();
}
function reviewBackfill() {
  const R = reviewMap(); let i = 0, changed = false;
  C.order.forEach(id => {
    const st = (S.lessons[id] || {}).status;
    if ((st === 'done' || st === 'mastered') && !R[id]) { R[id] = { box: 1, due: E.addDays(E.dateStr(), 1 + (i++ % 4)), n: 0, lapses: 0 }; changed = true; }
  });
  if (changed) touch();
}
function reviewDue() {
  reviewBackfill();
  const R = reviewMap(), today = E.dateStr();
  return Object.keys(R).filter(id => C.byId[id] && R[id].due <= today).sort((a, b) => R[a].due < R[b].due ? -1 : R[a].due > R[b].due ? 1 : R[a].box - R[b].box);
}
function reviewNext() {
  const R = reviewMap(), ds = Object.keys(R).filter(id => C.byId[id]).map(id => R[id].due).sort();
  return ds.length ? ds[0] : null;
}
function buildReview() {
  const ids = reviewDue().slice(0, 6), qs = [];
  ids.forEach(id => { QG.buildQuiz(C.byId[id], 2).forEach(q => qs.push(q)); });
  return E.shuffle(qs).slice(0, 12);
}
function applyReview(answers) {
  const R = reviewMap(), today = E.dateStr(), per = {};
  answers.forEach(a => { const p = per[a.lid] || (per[a.lid] = { c: 0, t: 0 }); p.t++; if (a.ok) p.c++; });
  const weak = [];
  Object.keys(per).forEach(id => {
    const r = R[id] || (R[id] = { box: 0, due: today, n: 0, lapses: 0 }), p = per[id];
    r.n = (r.n || 0) + 1; r.last = today;
    if (p.c === p.t) r.box = Math.min(REV_DAYS.length - 1, r.box + 1);
    else if (p.c === 0) { r.box = Math.max(0, r.box - 1); r.lapses = (r.lapses || 0) + 1; }
    r.due = E.addDays(today, p.c === 0 ? 1 : REV_DAYS[r.box]);
    if (p.c < p.t) weak.push(id);
  });
  touch();
  return weak;
}

const ACH = [
  { id: 'first-note', name: 'First note', desc: 'Play a key.', test: () => !!S.events.firstNote },
  { id: 'first-lesson', name: 'First lesson', desc: 'Complete a lesson.', test: () => C.order.some(isDone) },
  { id: 'navigator', name: 'Keyboard navigator', desc: 'Finish Keyboard basics.', test: () => C.MODULES.find(m => m.id === 'keys').lessons.every(isDone) },
  { id: 'rhythm', name: 'Rhythm keeper', desc: 'Finish the Rhythm module.', test: () => C.MODULES.find(m => m.id === 'rhythm').lessons.every(isDone) },
  { id: 'first-scale', name: 'First scale', desc: 'Complete the C major scale lesson.', test: () => isDone('c-major-scale') },
  { id: 'first-chord', name: 'First chord', desc: 'Complete Major triads.', test: () => isDone('triad-major') },
  { id: 'level1', name: 'Level 1 complete', desc: 'Finish every Level 1 lesson.', test: () => C.order.filter(i => C.byId[i].level === '1').every(isDone) },
  { id: 'gospel-door', name: 'Gospel door', desc: 'Complete the first gospel lesson.', test: () => isDone('g-what') },
  { id: 'perfect', name: 'Perfect score', desc: 'Score 100% on an assessment.', test: () => !!S.events.perfectQuiz },
  { id: 'mastery5', name: 'Five skills mastered', desc: 'Master five lessons.', test: () => C.order.filter(i => lessonStatus(i) === 'mastered').length >= 5 },
  { id: 'ear20', name: 'Good ears', desc: '20 correct ear-training answers.', test: () => Object.values(S.ear).reduce((a, x) => a + (x.correct || 0), 0) >= 20 },
  { id: 'streak3', name: 'Three-day streak', desc: 'Practise three days in a row.', test: () => E.streak(S.practice.days, E.dateStr()) >= 3 },
  { id: 'streak7', name: 'Seven-day streak', desc: 'Practise seven days in a row.', test: () => E.streak(S.practice.days, E.dateStr()) >= 7 },
  { id: 'hour', name: 'One hour', desc: 'One hour of total practice.', test: () => S.practice.total >= 3600 },
  { id: 'testout', name: 'Tested out', desc: 'Pass a module test-out.', test: () => Object.keys(S.testouts).length > 0 },
  { id: 'song-start', name: 'Songwriter', desc: 'Start a song project.', test: () => S.songs.length > 0 },
  { id: 'song-done', name: 'Finished song', desc: 'Complete all four steps of a song project.', test: () => S.songs.some(s => s.done) }
];
function checkAch() {
  ACH.forEach(a => {
    if (!S.ach[a.id] && a.test()) { S.ach[a.id] = Date.now(); touch(); toast('Badge earned: ' + a.name, 'ach'); }
  });
}
function levelProgress(levelId) {
  const ids = C.order.filter(i => C.byId[i].level === levelId);
  return { done: ids.filter(isDone).length, total: ids.length, mastered: ids.filter(i => lessonStatus(i) === 'mastered').length };
}
function nextLesson() {
  const open = C.order.filter(i => !isDone(i) && isUnlocked(i));
  return open.find(i => lessonStatus(i) === 'progress') || open[0] || null;
}
const totalMastered = () => C.order.filter(i => lessonStatus(i) === 'mastered').length;

/* ---------------------------------------------------------------- practice time + streak */
let route = { name: 'home' };
const TRACKED = new Set(['lesson', 'lab', 'practice', 'song', 'testout']);
setInterval(() => {
  if (document.hidden || !TRACKED.has(route.name)) return;
  if (Date.now() - Act.last > 45000) return;
  const t = ensureToday(), d = t.date;
  S.practice.days[d] = (S.practice.days[d] || 0) + 1; S.practice.total++;
  if (!t.goalMet && S.practice.days[d] >= S.prefs.dailyMin * 60) { t.goalMet = true; award(20, 'daily goal reached'); }
  if (S.practice.total % 15 === 0) { touch(); checkAch(); }
}, 1000);
