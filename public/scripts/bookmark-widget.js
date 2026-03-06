(function () {
  'use strict';

  // ── SVG icons ─────────────────────────────────────────────────────────────
  // SVG_BM_OUTLINE is duplicated from comment-widget.js (no module system available)
  const SVG_BM_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  const SVG_BM_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  const SVG_REMOVE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

  // ── localStorage helpers ──────────────────────────────────────────────────
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        alert('Storage quota exceeded. Please remove some bookmarks before adding new ones.');
      }
      return false;
    }
  }

  function parseJSON(raw, fallback) {
    if (!raw) return fallback;
    try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
  }

  // ── Slug derivation ───────────────────────────────────────────────────────
  // Include locale in key so /en/foo and /pl/foo are stored separately.
  // /en/some-page → en/some-page, /en → en, / → root
  function getSlug() {
    const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    return parts.join('/') || 'root';
  }

  // ── BookmarkManager ───────────────────────────────────────────────────────
  // Storage format: { [slug]: [{ text, nearestHeader }] }
  // `text` is the exact selected text string — used for matching on restore.
  const LS_KEY = 'bookmarks';

  const BookmarkManager = {
    getAll(slug) {
      const all = parseJSON(lsGet(LS_KEY), {});
      return Array.isArray(all[slug]) ? all[slug] : [];
    },
    save(slug, text, nearestHeader) {
      const all = parseJSON(lsGet(LS_KEY), {});
      if (!Array.isArray(all[slug])) all[slug] = [];
      if (all[slug].some((b) => b.text === text)) return; // no duplicates
      all[slug].push({ text, nearestHeader });
      lsSet(LS_KEY, JSON.stringify(all));
    },
    remove(slug, text) {
      const all = parseJSON(lsGet(LS_KEY), {});
      if (!Array.isArray(all[slug])) return;
      all[slug] = all[slug].filter((b) => b.text !== text);
      lsSet(LS_KEY, JSON.stringify(all));
    },
    isBookmarked(slug, text) {
      return this.getAll(slug).some((b) => b.text === text);
    },
  };

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function findNearestHeader(node, headings) {
    // Walk up to an element if given a text node, then find the last heading before it
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    let nearest = null;
    for (const h of headings) {
      if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
        nearest = h;
      }
    }
    return nearest;
  }

  function findMarkByText(text) {
    const marks = document.querySelectorAll('mark.bm-highlight');
    return Array.from(marks).find((m) => m.textContent === text) ?? null;
  }

  function removeMarkEl(markEl) {
    if (!markEl || !markEl.parentNode) return;
    const parent = markEl.parentNode;
    while (markEl.firstChild) parent.insertBefore(markEl.firstChild, markEl);
    parent.removeChild(markEl);
  }

  // ── CSS injection ─────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    mark.bm-highlight {
      background: #fef9c3;
      border-radius: 2px;
      cursor: pointer;
      outline: 1px solid #fde04780;
    }
    mark.bm-highlight:hover { background: #fef08a; }
    .bm-orphan-section {
      margin-top: 1.5rem;
      padding: 0.85rem 1rem;
      background: #f8f8f6;
      border-left: 3px solid #ccc;
      border-radius: 0 4px 4px 0;
    }
    .bm-orphan-label {
      font-size: 0.72rem;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.6rem;
    }
    .bm-orphan-entry {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .bm-orphan-entry:last-child { margin-bottom: 0; }
    .bm-orphan-content {
      flex: 1;
      font-style: italic;
      color: #777;
      font-size: 0.88rem;
      line-height: 1.5;
    }
    .bm-remove-btn {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: #bbb;
      padding: 0;
      display: flex;
      align-items: center;
      margin-top: 2px;
    }
    .bm-remove-btn:hover { color: #c00; }
    .bm-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bm-modal-box {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      width: min(380px, 90vw);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }
    .bm-modal-box p { font-size: 0.9rem; color: #555; margin-bottom: 0; }
    .bm-modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }
  `;
  document.head.appendChild(style);

  // ── State ─────────────────────────────────────────────────────────────────
  const slug = getSlug();
  // Set when user clicks an existing highlight to open the popup
  let activeBookmarkData = null; // { text, nearestHeader, markEl }

  // ── Highlight application ─────────────────────────────────────────────────

  // Attach click-to-toggle-popup behavior to a <mark class="bm-highlight"> element.
  function attachMarkClickHandler(markEl, text, nearestHeader) {
    markEl.addEventListener('click', function (e) {
      e.stopPropagation();

      // Toggle: if this mark's popup is already open, mousedown already hid it —
      // just clear state so we don't reopen it on the same click.
      if (activeBookmarkData && activeBookmarkData.markEl === markEl) {
        activeBookmarkData = null;
        return;
      }

      window.getSelection()?.removeAllRanges();
      activeBookmarkData = { text, nearestHeader, markEl };
      const rect = markEl.getBoundingClientRect();

      // Delay outlasts comment-widget's 10ms mouseup setTimeout, which would otherwise
      // call hideTooltip() and immediately close the popup we're about to show.
      setTimeout(function () {
        window._commentWidget?.showPopupAt(rect);
        window._commentWidget?.setBookmarkState(true);
      }, 20);
    });
  }

  // Wrap selected range in an inline <mark>. Falls back to text-search if surroundContents
  // throws (e.g. selection partially overlaps an element boundary).
  function applyRangeHighlight(range, text, nearestHeader) {
    const mark = document.createElement('mark');
    mark.className = 'bm-highlight';
    try {
      range.surroundContents(mark);
    } catch {
      // Fallback: find text in .prose and wrap first occurrence
      const prose = document.querySelector('.prose');
      if (!prose) return null;
      return applyTextHighlight(prose, text, nearestHeader);
    }
    attachMarkClickHandler(mark, text, nearestHeader);
    return mark;
  }

  // Find the first occurrence of `text` in `root` and wrap it in a <mark>.
  function applyTextHighlight(root, text, nearestHeader) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(text);
      if (idx === -1) continue;
      const r = document.createRange();
      r.setStart(node, idx);
      r.setEnd(node, idx + text.length);
      const mark = document.createElement('mark');
      mark.className = 'bm-highlight';
      try {
        r.surroundContents(mark);
      } catch {
        return null; // can't highlight (e.g. crosses element boundary)
      }
      attachMarkClickHandler(mark, text, nearestHeader);
      return mark;
    }
    return null;
  }

  // ── Orphaned bookmarks ────────────────────────────────────────────────────
  function createOrphanSection(nearestHeader, entries) {
    const prose = document.querySelector('.prose');
    if (!prose) return;

    const headings = Array.from(prose.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    let insertAfter = null;
    if (nearestHeader) {
      insertAfter = headings.find((h) => h.textContent.trim() === nearestHeader) ?? null;
    }

    const section = document.createElement('div');
    section.className = 'bm-orphan-section';

    const label = document.createElement('div');
    label.className = 'bm-orphan-label';
    label.textContent = 'Bookmarks from a previous version of this page';
    section.appendChild(label);

    for (const entry of entries) {
      const entryEl = document.createElement('div');
      entryEl.className = 'bm-orphan-entry';

      const content = document.createElement('div');
      content.className = 'bm-orphan-content';
      const displayText = entry.text ?? '';
      content.textContent = displayText.length > 200 ? displayText.slice(0, 200) + '…' : displayText;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'bm-remove-btn';
      removeBtn.title = 'Remove bookmark';
      removeBtn.innerHTML = SVG_REMOVE;
      removeBtn.addEventListener('click', () => {
        showRemoveModal(() => {
          BookmarkManager.remove(slug, entry.text);
          entryEl.remove();
          if (section.querySelectorAll('.bm-orphan-entry').length === 0) {
            section.remove();
          }
        });
      });

      entryEl.appendChild(content);
      entryEl.appendChild(removeBtn);
      section.appendChild(entryEl);
    }

    if (insertAfter) {
      insertAfter.insertAdjacentElement('afterend', section);
    } else {
      prose.appendChild(section);
    }
  }

  // ── Modal confirmation ────────────────────────────────────────────────────
  function showRemoveModal(onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'bm-modal-overlay';

    const box = document.createElement('div');
    box.className = 'bm-modal-box';

    const title = document.createElement('h3');
    title.style.cssText = 'margin-top:0;font-size:1rem;margin-bottom:0.5rem;';
    title.textContent = 'Remove bookmark?';

    const desc = document.createElement('p');
    desc.textContent = 'This cannot be undone.';

    const actions = document.createElement('div');
    actions.className = 'bm-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:0.4rem 0.9rem;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Remove';
    confirmBtn.style.cssText = 'padding:0.4rem 0.9rem;border:none;border-radius:4px;background:#c00;color:#fff;cursor:pointer;font-weight:600;';
    confirmBtn.addEventListener('click', () => { overlay.remove(); onConfirm(); });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // ── Page load restoration ─────────────────────────────────────────────────
  function restoreBookmarks() {
    const prose = document.querySelector('.prose');
    if (!prose) return;

    const bookmarks = BookmarkManager.getAll(slug);
    if (bookmarks.length === 0) return;

    const orphanedByHeader = new Map();

    for (const entry of bookmarks) {
      // Skip entries from old storage format (html-based, pre text-based migration)
      if (!entry.text) {
        const key = entry.nearestHeader ?? '';
        if (!orphanedByHeader.has(key)) orphanedByHeader.set(key, []);
        orphanedByHeader.get(key).push(entry);
        continue;
      }
      const mark = applyTextHighlight(prose, entry.text, entry.nearestHeader);
      if (!mark) {
        const key = entry.nearestHeader ?? '';
        if (!orphanedByHeader.has(key)) orphanedByHeader.set(key, []);
        orphanedByHeader.get(key).push(entry);
      }
    }

    for (const [header, entries] of orphanedByHeader) {
      createOrphanSection(header || null, entries);
    }
  }

  // ── Popup interaction hooks ───────────────────────────────────────────────

  // Called by comment-widget after showing popup for a text selection.
  window._onPopupShow = function (selectionData) {
    activeBookmarkData = null;
    if (!selectionData || !selectionData.text) {
      window._commentWidget?.setBookmarkState(false);
      return;
    }
    window._commentWidget?.setBookmarkState(BookmarkManager.isBookmarked(slug, selectionData.text));
  };

  // Called by comment-widget when the bookmark button is clicked.
  window._handleBookmarkClick = function () {
    const cw = window._commentWidget;

    if (activeBookmarkData) {
      // User opened popup by clicking an existing highlight, then clicked bookmark to remove
      removeMarkEl(activeBookmarkData.markEl);
      BookmarkManager.remove(slug, activeBookmarkData.text);
      activeBookmarkData = null;
      cw?.hidePopup();
      return;
    }

    const selectionData = cw?.getSelectionData();
    if (!selectionData?.text || !selectionData.range) return;

    const prose = document.querySelector('.prose');
    if (!prose) return;

    const text = selectionData.text;
    const headings = Array.from(prose.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    const nearestHeader = findNearestHeader(selectionData.range.startContainer, headings)?.textContent?.trim() ?? '';

    if (BookmarkManager.isBookmarked(slug, text)) {
      const markEl = findMarkByText(text);
      if (markEl) removeMarkEl(markEl);
      BookmarkManager.remove(slug, text);
    } else {
      applyRangeHighlight(selectionData.range, text, nearestHeader);
      BookmarkManager.save(slug, text, nearestHeader);
    }

    cw?.hidePopup();
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreBookmarks);
  } else {
    restoreBookmarks();
  }
})();
