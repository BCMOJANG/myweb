'use strict';
// ============================================================================
// 中文增强版的界面胶水层：使用说明面板 + 中英文切换。
// 这里只处理界面，不参与任何无线电协议逻辑。
// ============================================================================
(function () {
  const guide = document.getElementById('guideToggle');
  const panel = document.getElementById('helpPanel');

  function setGuide(open) {
    if (!panel || !guide) return;
    panel.hidden = !open;
    guide.setAttribute('aria-expanded', String(open));
    try { localStorage.setItem('espSdrGuide', open ? '1' : '0'); } catch (e) { /* 忽略 */ }
    if (open) panel.scrollIntoView({ block: 'nearest' });
  }

  if (guide && panel) {
    let open = false;
    try { open = localStorage.getItem('espSdrGuide') === '1'; } catch (e) { /* 忽略 */ }
    setGuide(open);
    guide.addEventListener('click', () => setGuide(panel.hidden));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) { setGuide(false); guide.focus(); }
    });
  }

  const lang = document.getElementById('langToggle');
  if (lang) lang.addEventListener('click', () => toggleLanguage());

  // 页面加载完成时按 localStorage 里记录的语言套用一遍文案，
  // 并让 app.js 重刷它自己生成的动态文案（状态、页脚、量测栏等）。
  applyI18n(document);
  if (typeof window.refreshTexts === 'function') window.refreshTexts();
})();
