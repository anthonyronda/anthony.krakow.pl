(function () {
  'use strict';

  const origin = window.location.origin;

  function getTrackedLinks() {
    const links = [];
    document.querySelectorAll('a[data-track-url]').forEach((linkEl) => {
      const url = linkEl.getAttribute('data-track-url');
      if (!url || url.startsWith(origin)) return;
      links.push(linkEl);
    });
    return links;
  }

  function renderBadge(wrap, url, count) {
    if (count <= 0) return;
    let badgeEl = wrap.querySelector('.click-badge');
    if (!badgeEl) {
      badgeEl = document.createElement('span');
      badgeEl.className = 'click-badge';
      badgeEl.dataset.url = url;
      wrap.appendChild(badgeEl);
    }
    badgeEl.dataset.initial = String(count);
    badgeEl.textContent = String(count);
  }

  function trackLink(url, wrap) {
    navigator.sendBeacon(
      '/api/clicks',
      new Blob([JSON.stringify({ url })], { type: 'application/json' })
    );
    // Update the badge optimistically
    if (!wrap) return;
    let badgeEl = wrap.querySelector('.click-badge');
    if (!badgeEl) {
      badgeEl = document.createElement('span');
      badgeEl.className = 'click-badge';
      badgeEl.dataset.url = url;
      badgeEl.dataset.initial = '0';
      wrap.appendChild(badgeEl);
    }
    const current = parseInt(badgeEl.dataset.initial ?? '0', 10);
    const next = current + 1;
    badgeEl.dataset.initial = String(next);
    badgeEl.textContent = String(next);
  }

  function init() {
    const links = getTrackedLinks();
    if (links.length === 0) return;

    const urls = [...new Set(links.map((l) => l.getAttribute('data-track-url')))];
    const query = urls.join(',');

    fetch('/api/clicks?urls=' + encodeURIComponent(query))
      .then((r) => r.json())
      .then((counts) => {
        links.forEach((linkEl) => {
          const url = linkEl.getAttribute('data-track-url');
          const wrap = linkEl.closest('.external-link-wrap');
          if (wrap && counts[url]) renderBadge(wrap, url, counts[url]);
          linkEl.addEventListener('click', () => trackLink(url, wrap), { passive: true });
        });
      })
      .catch(() => {
        // fallback: still attach click handlers even if count fetch fails
        links.forEach((linkEl) => {
          const url = linkEl.getAttribute('data-track-url');
          const wrap = linkEl.closest('.external-link-wrap');
          linkEl.addEventListener('click', () => trackLink(url, wrap), { passive: true });
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
