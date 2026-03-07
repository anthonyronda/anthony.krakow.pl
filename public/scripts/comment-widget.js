(function () {
  "use strict";

  const locale = document.documentElement.lang || "en";

  const _dateIntlLocale = document.documentElement.dataset.dateIntlLocale || "en-GB";
  const _dateOptions = JSON.parse(document.documentElement.dataset.dateOptions || "{}");
  const _dateSuffix = document.documentElement.dataset.dateSuffix || "";

  function formatDate(date) {
    return date.toLocaleDateString(_dateIntlLocale, _dateOptions) + _dateSuffix;
  }

  const i18n = {
    en: {
      leaveComment: "Leave a comment",
      name: "Your name",
      email: "Your email (not published)",
      body: "Comment",
      submit: "Submit",
      cancel: "Cancel",
      thanks: "Thank you! Your comment is awaiting moderation.",
      error: "Something went wrong. Please try again.",
      selectedText: "Commenting on:",
    },
    pl: {
      leaveComment: "Dodaj komentarz",
      name: "Twoje imię",
      email: "Twój email",
      body: "Komentarz",
      submit: "Wyślij",
      cancel: "Anuluj",
      thanks: "Dziękujemy! Twój komentarz czeka na moderację.",
      error: "Coś poszło nie tak. Spróbuj ponownie.",
      selectedText: "Komentarz do:",
    },
  };

  const strings = i18n[locale] || i18n.en;

  const SVG_COMMENT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  // SVG_BM_OUTLINE/FILLED are also defined in bookmark-widget.js; kept here for button creation
  const SVG_BM_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  const SVG_BM_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

  // ── Context HTML serialisation ────────────────────────────────────────────
  // Captures the outerHTML of the nearest block-level ancestor of the selection.
  // Saved as context_html on comment submission so we can detect stale comments
  // when the article is later edited.
  const BLOCK_TAGS_CW = new Set([
    "P",
    "LI",
    "BLOCKQUOTE",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "PRE",
    "FIGURE",
    "DIV",
    "TD",
    "TH",
  ]);

  function getContextHtml(range) {
    if (!range) return "";
    let el = range.commonAncestorContainer;
    if (el.nodeType !== Node.ELEMENT_NODE) el = el.parentElement;
    while (el && !BLOCK_TAGS_CW.has(el.tagName)) el = el.parentElement;
    return el ? el.outerHTML : "";
  }

  // ── Stale comment styles ──────────────────────────────────────────────────
  const staleStyle = document.createElement("style");
  staleStyle.textContent = `
    mark.comment-draft-mark {
      background: #dbeafe;
      border-radius: 2px;
      outline: 1px solid #93c5fd80;
    }
    .stale-comments-section {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e2e2;
    }
    .stale-comments-section h2 {
      font-size: 1rem;
      color: #888;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stale-comment-entry {
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    .stale-comment-entry .stale-label {
      color: #888;
      font-size: 0.8rem;
      margin-bottom: 0.4rem;
    }
    .stale-comment-entry .stale-context {
      border-left: 3px solid #ddd;
      padding: 0.5rem 0.75rem;
      color: #666;
      font-style: italic;
      background: #f8f8f6;
      border-radius: 0 4px 4px 0;
      margin: 0.4rem 0 0.75rem;
      font-size: 0.85rem;
    }
    .stale-comment-entry .stale-body {
      color: #333;
      line-height: 1.6;
    }
  `;
  document.head.appendChild(staleStyle);

  // ── Highlight approved comments ─────────────────────────────────────────
  function highlightApprovedComments() {
    const prose = document.querySelector(".prose");
    const article = document.getElementById("article-content");
    if (!article) return;

    const proseHtml = prose ? prose.innerHTML : "";
    const staleBubbles = [];

    document
      .querySelectorAll(".comment-bubble[data-anchor]")
      .forEach((bubble) => {
        const anchor = bubble.getAttribute("data-anchor");
        const contextHtml = bubble.getAttribute("data-context-html") ?? "";

        // A comment is live if it has no context_html (legacy) or if the context
        // block still exists verbatim in the current page HTML.
        // NOTE: This is an HTML substring match — see context_html notes in db.ts.
        const isLive = !contextHtml || proseHtml.includes(contextHtml);

        if (isLive) {
          if (anchor) highlightTextInElement(article, anchor);
        } else {
          staleBubbles.push(bubble);
        }
      });

    if (staleBubbles.length > 0 && prose) {
      renderStaleComments(staleBubbles, prose);
    }
  }

  function renderStaleComments(bubbles, prose) {
    const section = document.createElement("section");
    section.className = "stale-comments-section";

    const heading = document.createElement("h2");
    heading.textContent =
      locale === "pl"
        ? "Komentarze do wcześniejszych wersji"
        : "Comments on earlier versions";
    section.appendChild(heading);

    for (const bubble of bubbles) {
      const contextHtml = bubble.getAttribute("data-context-html") ?? "";
      const authorEl = bubble.querySelector(".comment-meta strong");
      const bodyEl = bubble.querySelector(".comment-body");
      const timeEl = bubble.querySelector("time");

      const authorName = authorEl ? authorEl.textContent : "";
      const bodyText = bodyEl ? bodyEl.textContent : "";
      const dateStr = timeEl
        ? formatDate(new Date(timeEl.getAttribute("datetime") || ""))
        : "";

      // Safely extract plain text from the stored context HTML
      const temp = document.createElement("div");
      temp.innerHTML = contextHtml;
      const contextText = temp.textContent.trim();

      const entry = document.createElement("div");
      entry.className = "stale-comment-entry";

      const prevLabel = document.createElement("p");
      prevLabel.className = "stale-label";
      prevLabel.textContent =
        locale === "pl"
          ? "W poprzedniej wersji ta notatka zawierała…"
          : "In a previous version this note read…";

      const contextBlock = document.createElement("blockquote");
      contextBlock.className = "stale-context";
      contextBlock.textContent =
        contextText.length > 300
          ? contextText.slice(0, 300) + "…"
          : contextText;

      const commentLabel = document.createElement("p");
      commentLabel.className = "stale-label";
      commentLabel.textContent =
        locale === "pl"
          ? `…i ${authorName} skomentował(a) ${dateStr}…`
          : `…and ${authorName} commented on ${dateStr}…`;

      const commentBody = document.createElement("p");
      commentBody.className = "stale-body";
      commentBody.textContent = bodyText;

      entry.appendChild(prevLabel);
      entry.appendChild(contextBlock);
      entry.appendChild(commentLabel);
      entry.appendChild(commentBody);
      section.appendChild(entry);

      // Hide the original bubble from the approved comments list
      bubble.style.display = "none";
    }

    prose.appendChild(section);
  }

  function highlightTextInElement(root, text) {
    // Build the concatenated text content from all text nodes.
    // Cross-element selections produce text with \n between elements (from
    // getSelection().toString()), but text nodes themselves have no such separators.
    // Stripping \n from the search text lets us locate it in the concatenated content.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let fullText = "";
    let node;
    while ((node = walker.nextNode())) {
      nodes.push({ node, nodeStart: fullText.length });
      fullText += node.nodeValue;
    }

    const normalizedText = text.replace(/\n/g, "");
    const idx = fullText.indexOf(normalizedText);
    if (idx === -1) return;

    const start = idx;
    const end = idx + normalizedText.length;

    for (const { node: textNode, nodeStart } of nodes) {
      const nodeEnd = nodeStart + textNode.nodeValue.length;
      if (nodeEnd <= start || nodeStart >= end) continue;

      const localStart = Math.max(0, start - nodeStart);
      const localEnd = Math.min(textNode.nodeValue.length, end - nodeStart);
      const before = textNode.nodeValue.slice(0, localStart);
      const highlighted = textNode.nodeValue.slice(localStart, localEnd);
      const after = textNode.nodeValue.slice(localEnd);

      const mark = document.createElement("mark");
      mark.style.cssText = "background:#fff3b0;border-radius:2px;";
      mark.textContent = highlighted;

      const parent = textNode.parentNode;
      if (before)
        parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(mark, textNode);
      if (after) parent.insertBefore(document.createTextNode(after), textNode);
      parent.removeChild(textNode);
    }
  }

  // ── Tooltip on selection ─────────────────────────────────────────────────
  let tooltip = null;
  let selectionData = null;

  function createTooltip() {
    if (tooltip) return;
    tooltip = document.createElement("div");
    tooltip.id = "selection-popup";
    tooltip.style.cssText = `position:absolute;background:#1a1a1a;color:#fff;padding:0.25em 0.4em;border-radius:6px;font-size:0.8rem;z-index:1000;user-select:none;white-space:nowrap;display:none;align-items:center;gap:0.1em;`;

    const commentBtn = document.createElement("button");
    commentBtn.id = "popup-comment-btn";
    commentBtn.title = strings.leaveComment;
    commentBtn.style.cssText = `background:none;border:none;color:#fff;cursor:pointer;padding:0.25em 0.35em;border-radius:4px;display:flex;align-items:center;`;
    commentBtn.innerHTML = SVG_COMMENT;
    commentBtn.addEventListener("click", openForm);

    const bookmarkBtn = document.createElement("button");
    bookmarkBtn.id = "popup-bookmark-btn";
    bookmarkBtn.title = "Bookmark";
    bookmarkBtn.style.cssText = `background:none;border:none;color:#fff;cursor:pointer;padding:0.25em 0.35em;border-radius:4px;display:flex;align-items:center;`;
    bookmarkBtn.innerHTML = SVG_BM_OUTLINE;
    bookmarkBtn.addEventListener("click", () =>
      window._handleBookmarkClick?.(),
    );

    tooltip.appendChild(bookmarkBtn);
    tooltip.appendChild(commentBtn);
    document.body.appendChild(tooltip);
  }

  function positionTooltip(rect) {
    tooltip.style.display = "flex"; // set before reading offsetWidth so dimensions are valid
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    tooltip.style.left = `${rect.left + scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top + scrollY - tooltip.offsetHeight - 8}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = "none";
    selectionData = null;
  }

  // Returns the character offset of (node, nodeOffset) within root's text content,
  // by walking text nodes in order. Works correctly for cross-element selections.
  function getTextOffset(root, node, nodeOffset) {
    if (node.nodeType !== Node.TEXT_NODE) return -1;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let total = 0;
    let current;
    while ((current = walker.nextNode())) {
      if (current === node) return total + nodeOffset;
      total += current.nodeValue.length;
    }
    return -1;
  }

  document.addEventListener("mouseup", (e) => {
    const article = document.getElementById("article-content");
    if (!article) return;

    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (!text || text.length < 5) {
        hideTooltip();
        return;
      }

      // Check selection is inside the article
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!article.contains(range.commonAncestorContainer)) {
        hideTooltip();
        return;
      }

      createTooltip();

      // Compute character offsets via TreeWalker so cross-element selections work.
      // article.textContent.indexOf(text) fails for multi-element selections because
      // getSelection().toString() inserts \n at element boundaries but textContent does not.
      const start = getTextOffset(
        article,
        range.startContainer,
        range.startOffset,
      );
      const end = getTextOffset(article, range.endContainer, range.endOffset);

      selectionData = {
        text,
        start,
        end,
        rect: range.getBoundingClientRect(),
        range: range.cloneRange(),
      };
      positionTooltip(selectionData.rect);
      window._onPopupShow?.(selectionData);
    }, 10);
  });

  document.addEventListener("mousedown", (e) => {
    // Don't clear the selection when the user clicks inside the comment form
    if (formOverlay && formOverlay.contains(e.target)) return;
    if (tooltip && !tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

  // ── Comment form ──────────────────────────────────────────────────────────
  let formOverlay = null;
  // Snapshot of selectionData taken when the form opens — survives mousedown clearing selectionData
  let capturedData = null;
  // Temporary highlight mark applied while the form is open
  let draftMarkEl = null;

  function applyDraftMark(range) {
    if (!range) return;
    const mark = document.createElement("mark");
    mark.className = "comment-draft-mark";
    try {
      range.surroundContents(mark);
      draftMarkEl = mark;
    } catch {
      // Selection spans element boundaries — skip the visual mark, form still works
    }
  }

  function removeDraftMark() {
    if (!draftMarkEl || !draftMarkEl.parentNode) {
      draftMarkEl = null;
      return;
    }
    const parent = draftMarkEl.parentNode;
    while (draftMarkEl.firstChild)
      parent.insertBefore(draftMarkEl.firstChild, draftMarkEl);
    parent.removeChild(draftMarkEl);
    draftMarkEl = null;
  }

  function openForm() {
    if (!selectionData) return;

    // Snapshot before anything can clear selectionData (e.g. mousedown on form inputs)
    capturedData = selectionData;
    tooltip.style.display = "none";

    // Show a draft highlight so the user can see what they're commenting on
    applyDraftMark(capturedData.range);

    if (formOverlay) formOverlay.remove();
    formOverlay = document.createElement("div");
    formOverlay.id = "comment-form-overlay";
    formOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      width: min(480px, 90vw);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    `;

    box.innerHTML = `
      <p style="font-size:0.85rem;color:#555;margin-bottom:1rem;">
        <strong>${strings.selectedText}</strong> "${escapeHtml(capturedData.text.slice(0, 80))}${capturedData.text.length > 80 ? "…" : ""}"
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

    document
      .getElementById("comment-cancel")
      .addEventListener("click", closeForm);
    formOverlay.addEventListener("click", (e) => {
      if (e.target === formOverlay) closeForm();
    });
    document
      .getElementById("comment-form")
      .addEventListener("submit", submitComment);
  }

  function closeForm() {
    if (formOverlay) {
      formOverlay.remove();
      formOverlay = null;
    }
    removeDraftMark();
    capturedData = null;
  }

  async function submitComment(e) {
    e.preventDefault();
    const form = e.target;
    const feedback = document.getElementById("comment-feedback");

    if (!capturedData) {
      feedback.style.color = "#c00";
      feedback.textContent = strings.error;
      return;
    }

    const pathname = window.location.pathname; // e.g. /en/my-note
    const parts = pathname.replace(/^\//, "").split("/");
    const pageLoc = parts[0] || "en";
    const pageSlug = parts.slice(1).join("/") || "";

    const payload = {
      page_slug: pageSlug,
      locale: pageLoc,
      anchor_text: capturedData.text,
      range_start: capturedData.start,
      range_end: capturedData.end,
      context_html: getContextHtml(capturedData.range),
      author_name: form.author_name.value.trim(),
      author_email: form.author_email.value.trim(),
      body: form.body.value.trim(),
      honeypot: form.honeypot.value,
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 201) {
        feedback.style.color = "#2a7d2a";
        feedback.textContent = strings.thanks;
        form
          .querySelectorAll("input, textarea, button")
          .forEach((el) => (el.disabled = true));
        setTimeout(closeForm, 3000);
      } else {
        feedback.style.color = "#c00";
        feedback.textContent = strings.error;
      }
    } catch {
      feedback.style.color = "#c00";
      feedback.textContent = strings.error;
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Exposed API for bookmark-widget.js ──────────────────────────────────
  window._commentWidget = {
    getSelectionData: () => selectionData,
    // Show popup anchored to an existing highlight element (no text selection)
    showPopupAt(rect) {
      createTooltip();
      selectionData = null;
      positionTooltip(rect);
      // Caller is responsible for setting bookmark button state after this returns
    },
    hidePopup: hideTooltip,
    setBookmarkState(isBookmarked) {
      const btn = document.getElementById("popup-bookmark-btn");
      if (!btn) return;
      btn.innerHTML = isBookmarked ? SVG_BM_FILLED : SVG_BM_OUTLINE;
      btn.style.color = isBookmarked ? "#60a5fa" : "#fff";
    },
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", highlightApprovedComments);
  } else {
    highlightApprovedComments();
  }
})();
