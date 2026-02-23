(function () {
  'use strict';

  const origin = window.location.origin;

  function trackLink(url, badgeEl) {
    navigator.sendBeacon(
      '/api/clicks',
      new Blob([JSON.stringify({ url })], { type: 'application/json' })
    );
    // Update the badge optimistically (number only)
    if (badgeEl) {
      const current = parseInt(badgeEl.dataset.initial ?? '0', 10);
      const next = current + 1;
      badgeEl.dataset.initial = String(next);
      badgeEl.textContent = String(next);
      badgeEl.style.display = '';
    }
  }

  function init() {
    document.querySelectorAll('a[data-track-url]').forEach((linkEl) => {
      const url = linkEl.getAttribute('data-track-url');
      if (!url || url.startsWith(origin)) return;
      const wrap = linkEl.closest('.external-link-wrap');
      const badge = wrap ? wrap.querySelector('.click-badge') : null;
      linkEl.addEventListener('click', () => trackLink(url, badge), { passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
