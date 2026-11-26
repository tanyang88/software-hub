/* 卡片区右侧「回到顶部 / 滑到底部」快捷按钮 */
(function () {
  'use strict';

  var panel = document.getElementById('cardScroll');
  var rail = document.getElementById('scrollJump');
  var topBtn = document.getElementById('scrollTopBtn');
  var bottomBtn = document.getElementById('scrollBottomBtn');
  if (!panel || !rail || !topBtn || !bottomBtn) return;

  function isPanelScrollable() {
    if (panel.scrollHeight - panel.clientHeight <= 4) return false;
    var overflowY = window.getComputedStyle(panel).overflowY;
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  }

  function currentScroller() {
    return isPanelScrollable()
      ? panel
      : (document.scrollingElement || document.documentElement);
  }

  function scrollPosition(scroller) {
    if (scroller === panel) return panel.scrollTop;
    return window.pageYOffset || scroller.scrollTop || 0;
  }

  function maxScroll(scroller) {
    return Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  }

  function update() {
    var scroller = currentScroller();
    var max = maxScroll(scroller);

    if (max <= 20) {
      rail.hidden = true;
      return;
    }

    rail.hidden = false;
    var position = scrollPosition(scroller);
    topBtn.disabled = position <= 2;
    bottomBtn.disabled = position >= max - 2;
  }

  var scheduled = false;
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      update();
    });
  }

  function jumpTo(position) {
    var scroller = currentScroller();
    if (scroller === panel) {
      panel.scrollTo({ top: position, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  }

  topBtn.addEventListener('click', function () {
    jumpTo(0);
  });

  bottomBtn.addEventListener('click', function () {
    var scroller = currentScroller();
    jumpTo(maxScroll(scroller));
  });

  panel.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);

  var grid = document.getElementById('cardGrid');
  if (grid && window.MutationObserver) {
    new MutationObserver(scheduleUpdate).observe(grid, { childList: true, subtree: true });
  }
  if (window.ResizeObserver) {
    new ResizeObserver(scheduleUpdate).observe(panel);
  }

  scheduleUpdate();
})();
