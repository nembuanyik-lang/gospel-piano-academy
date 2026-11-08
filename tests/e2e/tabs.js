'use strict';
/* The Song Lab page now has tabs. A real person taps the tab first; this does the same for the tests:
   before touching an element that sits in a tab that is not showing, it taps that tab. */
const METHODS = ['click', 'waitForSelector', 'fill', 'selectOption', 'check', 'uncheck', 'setInputFiles', 'hover', 'dispatchEvent', 'press', 'type'];
function auto(page) {
  const reveal = sel => page.evaluate(s => {
    try {
      const el = document.querySelector(s); if (!el) return false;
      const pane = el.closest('.ptab'); if (!pane || pane.classList.contains('on')) return false;
      const b = document.querySelector('[data-act=ptab][data-t="' + pane.dataset.tab + '"]'); if (b) { b.click(); return true; }
    } catch (e) { /* not a plain css selector */ }
    return false;
  }, sel).then(r => (r ? page.waitForTimeout(150) : null)).catch(() => null);
  METHODS.forEach(m => {
    const orig = page[m].bind(page);
    page[m] = async (sel, ...a) => { if (typeof sel === 'string') await reveal(sel); return orig(sel, ...a); };
  });
  return page;
}
module.exports = { auto };
