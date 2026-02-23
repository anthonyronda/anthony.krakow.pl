(function () {
  'use strict';

  const locale = document.documentElement.lang || 'en';

  const i18n = {
    en: {
      leaveComment: 'Leave a comment',
      name: 'Your name',
      email: 'Your email (not published)',
      body: 'Comment',
      submit: 'Submit',
      cancel: 'Cancel',
      thanks: 'Thank you! Your comment is awaiting moderation.',
      error: 'Something went wrong. Please try again.',
      selectedText: 'Commenting on:',
    },
    pl: {
      leaveComment: 'Dodaj komentarz',
      name: 'Twoje imię',
      email: 'Twój email',
      body: 'Komentarz',
      submit: 'Wyślij',
      cancel: 'Anuluj',
      thanks: 'Dziękujemy! Twój komentarz czeka na moderację.',
      error: 'Coś poszło nie tak. Spróbuj ponownie.',
      selectedText: 'Komentarz do:',
    },
  };

  const strings = i18n[locale] || i18n.en;

  // ── Highlight approved comments ─────────────────────────────────────────
  function highlightApprovedComments() {
    const article = document.getElementById('article-content');
    if (!article) return;

    document.querySelectorAll('.comment-bubble[data-anchor]').forEach((bubble) => {
      const anchor = bubble.getAttribute('data-anchor');
      if (!anchor) return;
      highlightTextInElement(article, anchor);
    });
  }

  function highlightTextInElement(root, text) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(text);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + text.length);
      const mark = document.createElement('mark');
      mark.style.cssText = 'background:#fff3b0;border-radius:2px;';
      range.surroundContents(mark);
      break; // highlight first occurrence only
    }
  }

  // ── Tooltip on selection ─────────────────────────────────────────────────
  let tooltip = null;
  let selectionData = null;

  function createTooltip() {
    if (tooltip) return;
    tooltip = document.createElement('div');
    tooltip.id = 'comment-tooltip';
    tooltip.textContent = strings.leaveComment;
    tooltip.style.cssText = `
      position: absolute;
      background: #1a1a1a;
      color: #fff;
      padding: 0.35em 0.75em;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      z-index: 1000;
      user-select: none;
      white-space: nowrap;
    `;
    tooltip.addEventListener('click', openForm);
    document.body.appendChild(tooltip);
  }

  function positionTooltip(rect) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    tooltip.style.left = `${rect.left + scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top + scrollY - tooltip.offsetHeight - 8}px`;
    tooltip.style.display = 'block';
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
    selectionData = null;
  }

  document.addEventListener('mouseup', (e) => {
    const article = document.getElementById('article-content');
    if (!article) return;

    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!text || text.length < 5) { hideTooltip(); return; }

      // Check selection is inside the article
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!article.contains(range.commonAncestorContainer)) { hideTooltip(); return; }

      createTooltip();

      // Compute character offsets relative to article text content
      const articleText = article.textContent || '';
      const start = articleText.indexOf(text);
      const end = start >= 0 ? start + text.length : -1;

      selectionData = { text, start, end, rect: range.getBoundingClientRect() };
      positionTooltip(selectionData.rect);
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (tooltip && !tooltip.contains(e.target) && e.target.id !== 'comment-form-overlay') {
      hideTooltip();
    }
  });

  // ── Comment form ──────────────────────────────────────────────────────────
  let formOverlay = null;

  function openForm() {
    if (!selectionData) return;
    tooltip.style.display = 'none';

    if (formOverlay) formOverlay.remove();
    formOverlay = document.createElement('div');
    formOverlay.id = 'comment-form-overlay';
    formOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      width: min(480px, 90vw);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    `;

    box.innerHTML = `
      <p style="font-size:0.85rem;color:#555;margin-bottom:1rem;">
        <strong>${strings.selectedText}</strong> "${escapeHtml(selectionData.text.slice(0, 80))}${selectionData.text.length > 80 ? '…' : ''}"
      </p>
      <form id="comment-form" style="display:flex;flex-direction:column;gap:0.75rem;">
        <input type="text" name="author_name" placeholder="${strings.name}" required maxlength="100"
          style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;font-size:0.9rem;" />
        <input type="email" name="author_email" placeholder="${strings.email}" required maxlength="200"
          style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;font-size:0.9rem;" />
        <textarea name="body" placeholder="${strings.body}" required maxlength="2000" rows="4"
          style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;font-size:0.9rem;resize:vertical;"></textarea>
        <input type="text" name="honeypot" style="display:none;" tabindex="-1" autocomplete="off" />
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
          <button type="button" id="comment-cancel"
            style="padding:0.5rem 1rem;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;">
            ${strings.cancel}
          </button>
          <button type="submit"
            style="padding:0.5rem 1rem;border:none;border-radius:4px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;">
            ${strings.submit}
          </button>
        </div>
        <div id="comment-feedback" style="font-size:0.85rem;"></div>
      </form>
    `;

    formOverlay.appendChild(box);
    document.body.appendChild(formOverlay);

    document.getElementById('comment-cancel').addEventListener('click', closeForm);
    formOverlay.addEventListener('click', (e) => { if (e.target === formOverlay) closeForm(); });
    document.getElementById('comment-form').addEventListener('submit', submitComment);
  }

  function closeForm() {
    if (formOverlay) { formOverlay.remove(); formOverlay = null; }
  }

  async function submitComment(e) {
    e.preventDefault();
    const form = e.target;
    const feedback = document.getElementById('comment-feedback');

    const pathname = window.location.pathname; // e.g. /en/my-note
    const parts = pathname.replace(/^\//, '').split('/');
    const pageLoc = parts[0] || 'en';
    const pageSlug = parts.slice(1).join('/') || '';

    const payload = {
      page_slug: pageSlug,
      locale: pageLoc,
      anchor_text: selectionData.text,
      range_start: selectionData.start,
      range_end: selectionData.end,
      author_name: form.author_name.value.trim(),
      author_email: form.author_email.value.trim(),
      body: form.body.value.trim(),
      honeypot: form.honeypot.value,
    };

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 201) {
        feedback.style.color = '#2a7d2a';
        feedback.textContent = strings.thanks;
        form.querySelectorAll('input, textarea, button').forEach((el) => (el.disabled = true));
        setTimeout(closeForm, 3000);
      } else {
        feedback.style.color = '#c00';
        feedback.textContent = strings.error;
      }
    } catch {
      feedback.style.color = '#c00';
      feedback.textContent = strings.error;
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightApprovedComments);
  } else {
    highlightApprovedComments();
  }
})();
