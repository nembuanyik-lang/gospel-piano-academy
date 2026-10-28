'use strict';
/* ---------------------------------------------------------------- progress report and class summary
   Both work from plain state objects, so the same code describes this learner or a learner's backup file. */
const stStatus = (st, id) => { const r = (st.lessons || {})[id]; return r && r.status ? r.status : 'new'; };
function learnerFacts(st) {
  const done = id => { const s = stStatus(st, id); return s === 'done' || s === 'mastered'; };
  const g = st.guitar || {}, gIds = gOrder();
  const days = (st.practice && st.practice.days) || {}, today = E.dateStr();
  const last30 = Object.keys(days).filter(d => d > E.addDays(today, -30)).reduce((a, d) => a + (days[d] || 0), 0);
  const rk = E.rankFor(st.xp || 0);
  return {
    name: (st.profile && st.profile.name) || '',
    instrument: (st.profile && st.profile.instrument) || 'piano',
    xp: st.xp || 0, level: rk.level, rank: rk.name,
    pianoDone: C.order.filter(done).length, pianoMastered: C.order.filter(id => stStatus(st, id) === 'mastered').length, pianoTotal: C.order.length,
    guitarDone: gIds.filter(id => (g[id] || {}).done).length, guitarTotal: gIds.length,
    minutes: Math.round(((st.practice && st.practice.total) || 0) / 60), minutes30: Math.round(last30 / 60),
    streak: E.streak(days, today),
    levels: C.LEVELS.map(L => { const ids = C.order.filter(i => C.byId[i].level === L.id); return { name: L.name + ' · ' + L.title, done: ids.filter(done).length, mastered: ids.filter(i => stStatus(st, i) === 'mastered').length, total: ids.length }; }),
    scores: (st.scores || []).slice(-10).reverse(),
    ear: Object.keys(st.ear || {}).filter(k => E.EAR_TYPES[k] && st.ear[k].total).map(k => ({ label: E.EAR_TYPES[k].label, pct: pct(st.ear[k].correct, st.ear[k].total), total: st.ear[k].total })),
    perf: Object.keys(st.perf || {}).map(k => Object.assign({ id: k }, st.perf[k])).filter(r => r.best).sort((a, b) => (b.last || 0) - (a.last || 0)),
    perfMastered: Object.keys(st.perf || {}).filter(k => st.perf[k].passedAll).length,
    signoffs: Object.keys(st.signoffs || {}).map(k => Object.assign({ id: k, title: (C.byId[k] || {}).title || k }, st.signoffs[k])),
    updated: st.updated || 0
  };
}
const PRINT_CSS = 'body{font:15px/1.5 system-ui,sans-serif;color:#17181C;max-width:820px;margin:2rem auto;padding:0 1rem}h1{margin:0 0 .2rem}h2{margin:1.6rem 0 .4rem;font-size:1.1rem}' +
  'table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid #ddd}th{background:#f3f3ef}td.n,th.n{text-align:right}' +
  '.kpis{display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0}.kpis div{border:1px solid #ddd;border-radius:8px;padding:.5rem .8rem}.kpis b{display:block;font-size:1.3rem}' +
  '.foot{color:#777;font-size:.8rem;margin-top:2rem}@media print{body{margin:0}}';
function page(title, body) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + PRINT_CSS + '</style></head><body>' + body +
    '<p class="foot">Made with Gospel Music Academy on ' + esc(new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })) + '. Print this page or save it as a PDF from the print dialog.</p></body></html>';
}
function reportHtml(st) {
  const f = learnerFacts(st);
  const kpi = (v, l) => '<div><b>' + esc(v) + '</b>' + esc(l) + '</div>';
  const body = '<h1>Progress report' + (f.name ? ': ' + esc(f.name) : '') + '</h1><p>Level ' + f.level + ' · ' + esc(f.rank) + ' · ' + f.xp + ' XP</p>' +
    '<div class="kpis">' + (f.instrument !== 'guitar' ? kpi(f.pianoDone + ' / ' + f.pianoTotal, 'piano lessons finished') + kpi(f.pianoMastered, 'piano lessons mastered') : '') +
    (f.instrument !== 'piano' || f.guitarDone ? kpi(f.guitarDone + ' / ' + f.guitarTotal, 'guitar lessons finished') : '') +
    kpi(f.minutes + ' min', 'practised in total') + kpi(f.minutes30 + ' min', 'in the last 30 days') + kpi(f.streak + (f.streak === 1 ? ' day' : ' days'), 'current streak') + (f.perfMastered ? kpi(f.perfMastered, 'performance tests mastered') : '') + '</div>' +
    (f.instrument !== 'guitar' ? '<h2>Piano course by level</h2><table><tr><th>Level</th><th class="n">Finished</th><th class="n">Mastered</th><th class="n">Lessons</th></tr>' +
      f.levels.map(l => '<tr><td>' + esc(l.name) + '</td><td class="n">' + l.done + '</td><td class="n">' + l.mastered + '</td><td class="n">' + l.total + '</td></tr>').join('') + '</table>' : '') +
    (f.scores.length ? '<h2>Recent assessments</h2><table><tr><th>Assessment</th><th>Date</th><th class="n">Score</th></tr>' +
      f.scores.map(s => '<tr><td>' + esc(s.title) + '</td><td>' + esc(new Date(s.at).toLocaleDateString()) + '</td><td class="n">' + s.pct + '%</td></tr>').join('') + '</table>' : '') +
    (f.perf.length ? '<h2>Performance tests (played in time with the click)</h2><table><tr><th>Test</th><th class="n">Best tempo passed</th><th class="n">Accuracy</th><th>Status</th></tr>' +
      f.perf.slice(0, 40).map(r => '<tr><td>' + esc(r.title || r.id) + '</td><td class="n">' + r.best + ' BPM</td><td class="n">' + r.acc + '%</td><td>' + (r.passedAll ? 'Mastered (top tempo ' + r.top + ' BPM)' : 'In progress, aiming for ' + (r.top || '') + ' BPM') + '</td></tr>').join('') + '</table>' : '') +
    (f.signoffs.length ? '<h2>Teacher sign-offs</h2><table><tr><th>Performance</th><th>Signed off by</th><th>Date</th><th>Note</th></tr>' +
      f.signoffs.map(r => '<tr><td>' + esc(r.title) + '</td><td>' + esc(r.by) + '</td><td>' + esc(new Date(r.at).toLocaleDateString()) + '</td><td>' + esc(r.note || '') + '</td></tr>').join('') + '</table>' : '') +
    (f.ear.length ? '<h2>Ear training</h2><table><tr><th>Drill</th><th class="n">Answers</th><th class="n">Correct</th></tr>' +
      f.ear.map(e => '<tr><td>' + esc(e.label) + '</td><td class="n">' + e.total + '</td><td class="n">' + e.pct + '%</td></tr>').join('') + '</table>' : '');
  return page('Progress report' + (f.name ? ' - ' + f.name : ''), body);
}
function exportReport() {
  const who = (S.profile.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  saveFile('progress-report' + (who ? '-' + who : '') + '-' + E.dateStr() + '.html', 'text/html', reportHtml(S));
  toast('Progress report saved. Open it to print or save as PDF.');
}

/* Class summary: a teacher or music director opens several learners' backup files and sees them side by side.
   Nothing is imported; the files are only read. */
function readClassFiles(files) {
  const list = Array.from(files || []).slice(0, 60);
  if (!list.length) return;
  ui.classRows = ui.classRows || [];
  let left = list.length;
  list.forEach(file => {
    const done = () => { if (--left === 0) render(); };
    if (file.size > Backup.MAX_BYTES) { ui.classRows.push({ file: file.name, error: 'too large' }); done(); return; }
    const fr = new FileReader();
    fr.onload = () => { const r = Backup.parse(String(fr.result || ''), sanCtx()); ui.classRows.push(r.ok ? Object.assign({ file: file.name }, learnerFacts(r.state)) : { file: file.name, error: r.msg }); done(); };
    fr.onerror = () => { ui.classRows.push({ file: file.name, error: 'could not be read' }); done(); };
    fr.readAsText(file);
  });
}
function classTable(rows, forPrint) {
  const ok = rows.filter(r => !r.error).sort((a, b) => b.xp - a.xp);
  const head = '<tr><th>Learner</th><th class="n">Level</th><th class="n">XP</th><th class="n">Piano finished</th><th class="n">Mastered</th><th class="n">Guitar finished</th><th class="n">Tests mastered</th><th class="n">Sign-offs</th><th class="n">Minutes (30 days)</th><th>Last active</th></tr>';
  const body = ok.map(r => '<tr><td>' + esc(r.name || r.file) + '</td><td class="n">' + r.level + '</td><td class="n">' + r.xp + '</td><td class="n">' + r.pianoDone + '</td><td class="n">' + r.pianoMastered + '</td><td class="n">' + r.guitarDone + '</td><td class="n">' + r.perfMastered + '</td><td class="n">' + r.signoffs.length + '</td><td class="n">' + r.minutes30 + '</td><td>' + (r.updated ? esc(new Date(r.updated).toLocaleDateString()) : '–') + '</td></tr>').join('');
  return '<table' + (forPrint ? '' : ' class="dtable"') + '>' + head + body + '</table>';
}
function classCard() {
  const rows = ui.classRows || [];
  const bad = rows.filter(r => r.error);
  return '<section class="card"><h3>Class summary</h3><p class="muted">For teachers and music directors: ask each learner for their exported backup file, then open them all here to compare progress. Nothing is imported into this app.</p>' +
    '<div class="row wrap"><button class="btn ghost" type="button" data-act="classpick">Open learners’ backup files…</button>' + (rows.length ? '<button class="btn ghost" type="button" data-act="classsave">Save as a page</button><button class="btn ghost" type="button" data-act="classclear">Clear</button>' : '') + '</div>' +
    '<input id="classfiles" type="file" accept=".json,application/json" multiple hidden data-bind="classfiles" aria-label="Choose backup files">' +
    (rows.filter(r => !r.error).length ? '<div class="dtable-wrap">' + classTable(rows) + '</div>' : '') +
    (bad.length ? '<p class="tiny">Skipped: ' + bad.map(r => esc(r.file) + ' (' + esc(r.error) + ')').join(', ') + '</p>' : '') + '</section>';
}
function exportClass() {
  saveFile('class-summary-' + E.dateStr() + '.html', 'text/html', page('Class summary', '<h1>Class summary</h1>' + classTable(ui.classRows || [], true)));
}
