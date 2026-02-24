# CLAUDE.md

## Project Overview

Personal digital garden website at https://anthony.krakow.pl. Built with Astro, bilingual (English + Polish), with a comment moderation system and external link click tracking. Uses SQLite for persistence and runs as a Node.js server.

## Tech Stack

- **Astro 5** with Node.js adapter (SSR, standalone mode)
- **TypeScript** (strict mode)
- **SQLite** via `better-sqlite3` for comments and link click counts
- **MDX** for content
- No UI framework (no React/Vue/Svelte) — plain Astro components

## Commands

```bash
npm run dev        # Start dev server on localhost:4321
npm run build      # Build to dist/
npm start          # Run production server (dist/server/entry.mjs)
npm run preview    # Preview built site locally
```

## Project Structure

```
src/
  pages/
    [locale]/         # Post listing, individual posts, tag pages
    admin/            # Login + comment moderation dashboard
    api/              # REST endpoints (comments, clicks)
  content/
    en/               # English markdown posts
    pl/               # Polish markdown posts
  components/         # Astro components (ExternalLink, CommentBubble, etc.)
  layouts/            # Main page layout
  lib/
    db.ts             # SQLite init and schema
    auth.ts           # Bearer token + cookie auth
    rehype-external-links.js  # Wraps markdown links for click tracking
  i18n/               # Translation JSON files + utilities
public/
  scripts/
    link-counter.js   # Client-side link click tracking
    comment-widget.js # Client-side text-selection comment UI
```

## Environment Variables

See `.env.example`. Required for running locally:

```
HOST=localhost
PORT=4321
ADMIN_TOKEN=change-me-to-a-long-random-secret
DB_PATH=./db.sqlite
```

## Database

SQLite at `./db.sqlite` (or `DB_PATH` env). Schema is auto-created on startup in `src/lib/db.ts`. Two tables:
- `link_clicks` — URL + click count
- `comments` — User comments with status (`pending`, `approved`, `rejected`)

## Adding Content

Add `.md` or `.mdx` files to `src/content/en/` or `src/content/pl/`. Required frontmatter:

```yaml
---
title: "Post Title"
description: "Short description"
pubDate: 2026-02-24
tags: ["tag1", "tag2"]
---
```

## Key Conventions

- Locale prefixing: all routes are under `/en/` or `/pl/`
- Default locale is `en`
- API endpoints requiring auth use Bearer token (same as `ADMIN_TOKEN`) or a session cookie set at `/admin/login`
- External links in markdown are automatically wrapped for click tracking via the rehype plugin
- Use the `<ExternalLink>` component for explicit tracked links in `.astro` files

## Deployment

Runs with Coolify via default Nixpack

```bash
docker build -t anthony-krakow-pl .
docker run -p 4321:4321 -v /data:/data -e ADMIN_TOKEN=secret anthony-krakow-pl
```
