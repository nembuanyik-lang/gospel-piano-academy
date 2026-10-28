'use strict';
/* ---------------------------------------------------------------- recording yourself, and teacher sign-off
   AudioRecorder records the microphone (an acoustic piano, a guitar, singers, the whole room) so a learner
   can listen back and send the file to a teacher. Sign-offs record who listened and approved a performance. */
function mountAudioRecorder(host, opt) {
  opt = opt || {};
  let stream = null, mr = null, chunks = [], t0 = 0, iv = null, url = null, blob = null;
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  function draw(msg) {
    host.innerHTML = '<div class="recbox"><p class="eyebrow">Record yourself</p>' +
      (supported ? '<p class="muted">Records through the microphone. Put the computer near the instrument and play the whole piece.</p>' +
        '<div class="row wrap"><button class="btn ' + (mr ? 'danger' : 'primary') + '" type="button" data-r="toggle">' + (mr ? icon('stop') + 'Stop recording' : '● Start recording') + '</button>' +
        (blob && !mr ? '<button class="btn ghost" type="button" data-r="save">Save the recording</button>' : '') + '</div>' +
        '<p class="tiny" id="rectime" aria-live="polite">' + esc(msg || (mr ? 'Recording… 0:00' : blob ? 'Listen back below, then save the file to send it to your teacher.' : '')) + '</p>' +
        (url && !mr ? '<audio controls src="' + url + '"></audio>' : '')
        : '<p class="muted">Recording is not available on this device.</p>') + '</div>';
  }
  async function start() {
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }); }
    catch (e) { draw('The microphone could not be opened. Check that no other program is using it.'); return; }
    chunks = []; blob = null; if (url) { URL.revokeObjectURL(url); url = null; }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); url = URL.createObjectURL(blob);
      stream.getTracks().forEach(t => t.stop()); stream = null; mr = null; clearInterval(iv); draw();
    };
    mr.start(1000); t0 = Date.now(); draw();
    iv = setInterval(() => { const el = $('#rectime', host), s = Math.floor((Date.now() - t0) / 1000); if (el) el.textContent = 'Recording… ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500);
  }
  function stop() { if (mr && mr.state !== 'inactive') mr.stop(); }
  function save() {
    if (!blob) return;
    const who = (S.profile.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const ext = /ogg/.test(blob.type) ? 'ogg' : 'webm';
    saveFile((opt.name || 'recording') + (who ? '-' + who : '') + '-' + E.dateStr() + '.' + ext, blob.type, blob);
    toast('Recording saved. It plays in any web browser or media player.');
    if (opt.onSaved) opt.onSaved();
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    if (b.dataset.r === 'toggle') { if (mr) stop(); else start(); }
    else if (b.dataset.r === 'save') save();
  });
  draw();
  return { destroy() { stop(); clearInterval(iv); if (stream) stream.getTracks().forEach(t => t.stop()); if (url) URL.revokeObjectURL(url); } };
}

/* A teacher, pastor or music director signs off a performance after listening to it.
   The app cannot judge feel, taste or ministry; an experienced listener can. */
function signoffHtml(L) {
  const so = (S.signoffs || {})[L.id], passed = !!lessonRec(L.id).challenge;
  if (so) return '<div class="callout signoff"><p><b>Signed off by ' + esc(so.by) + '</b> on ' + esc(new Date(so.at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })) + '.</p>' + (so.note ? '<p class="muted">“' + esc(so.note) + '”</p>' : '') + '</div>';
  if (!passed) return '<div class="callout signoff"><p><b>Teacher sign-off</b></p><p class="muted">Pass the Challenge first. Then record your performance and ask your teacher or music director to listen and sign it off here.</p></div>';
  return '<div class="callout signoff"><p><b>Teacher sign-off</b></p><p class="muted">For your teacher, pastor or music director: listen to the whole recording, then sign it off. Your name and note appear on the learner\'s progress report.</p>' +
    '<label class="field"><span>Your name</span><input type="text" id="so-by" maxlength="60" autocomplete="off"></label>' +
    '<label class="field"><span>A note for the learner (optional)</span><textarea id="so-note" maxlength="500" rows="3"></textarea></label>' +
    '<button class="btn primary" type="button" data-act="signoff" data-id="' + esc(L.id) + '">Sign off this performance</button></div>';
}
function doSignoff(id) {
  const by = (($('#so-by') || {}).value || '').trim(), note = (($('#so-note') || {}).value || '').trim();
  if (!by) { toast('Please type your name to sign off.', 'warn'); return; }
  (S.signoffs || (S.signoffs = {}))[id] = { by: by.slice(0, 60), note: note.slice(0, 500), at: Date.now() };
  touch(); toast('Signed off. Thank you.'); render();
}
