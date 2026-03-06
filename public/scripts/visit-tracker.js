// visit-tracker.js
// Records per-date visit history and tracks/restores scroll position by heading.
//
// Slug derivation: strip locale prefix and trailing slash from pathname.
//   /en/some-page  -> some-page
//   /en            -> index
//   /pl/some-page  -> some-page
// This must stay consistent with the content collection filename convention.
(function () {
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function parseJSON(raw, fallback) {
    if (!raw) return fallback;
    try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
  }

  function getSlug() {
    const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    // parts[0] is locale (e.g. "en"), parts[1+] is slug
    if (parts.length >= 2) return parts.slice(1).join('/');
    return 'index';
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = getSlug();

  // Record visit date — accumulates across dates, never overwrites prior entries
  const history = parseJSON(lsGet('visit-history'), {});
  if (!Array.isArray(history[today])) history[today] = [];
  if (!history[today].includes(slug)) {
    history[today].push(slug);
    lsSet('visit-history', JSON.stringify(history));
  }

  // Scroll tracking and restore — only on notes pages (where .prose exists)
  const prose = document.querySelector('.prose');
  if (!prose) return;

  const headings = Array.from(prose.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length === 0) return;

  // Restore last scroll position before the page settles
  const positions = parseJSON(lsGet('scroll-position'), {});
  const savedHeading = positions[slug];
  if (savedHeading) {
    const target = headings.find(function (h) {
      return h.textContent.trim() === savedHeading;
    });
    if (target) {
      target.scrollIntoView({ behavior: 'instant' });
    }
    // If heading no longer exists, silently skip — no error
  }

  // Track the last heading whose top has scrolled above the viewport top.
  // If no heading has passed the top yet (user is near the top), clear the saved position.
  var debounceTimer = null;
  function onScroll() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      var lastAbove = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= 0) {
          lastAbove = headings[i];
        }
      }
      var pos = parseJSON(lsGet('scroll-position'), {});
      if (lastAbove) {
        pos[slug] = lastAbove.textContent.trim();
      } else {
        delete pos[slug];
      }
      lsSet('scroll-position', JSON.stringify(pos));
    }, 200);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
}());
