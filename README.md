# notion-wiki-shadcn

A Next.js wiki template that renders your public Notion workspace as a fast, beautifully styled website — built from scratch with shadcn/ui, Tailwind CSS v4, and React Server Components.

> Use Notion as your CMS. No third-party sync service, no webhook setup, no database required for public pages. Point the template at your Notion page and deploy.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)

---

## Table of contents

- [Features](#features)
- [Gated content: the private block system](#gated-content-the-private-block-system)
- [How to structure your Notion workspace](#how-to-structure-your-notion-workspace)
- [Getting started](#getting-started)
- [Debug scripts](#debug-scripts)
- [Project structure](#project-structure)
- [Stack](#stack)
- [Customization](#customization)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## Features

### Notion blocks supported

**Text**

| Block | Notes |
|-------|-------|
| Paragraph | Full inline formatting (bold, italic, underline, strikethrough, inline code, color) |
| Heading 1 / 2 / 3 | Also supports legacy `header` / `sub_header` / `sub_sub_header` types |
| Quote | Styled blockquote |
| Bulleted list | Nested levels |
| Numbered list | Nested levels |
| Toggle list | Collapsible, nested content |
| To-do list | Checkbox state rendered |

**Layout**

| Block | Notes |
|-------|-------|
| Columns | Multi-column layout, any column count |
| Callout | Icon + colored background, all Notion callout colors |
| Divider | Horizontal rule |
| Table of contents | Floating sidebar on desktop, smooth scroll, auto-highlights active heading |
| Page (child page) | Rendered as a styled page link card |

**Media**

| Block | Notes |
|-------|-------|
| Image | Next.js `<Image>` with caption, respects `block_width` and `block_full_width` |
| Video | YouTube, Vimeo, native video files |
| Audio | Same layout as video |
| Embed | iFrame embed, respects aspect ratio |
| Bookmark | URL preview card with title, description, favicon |
| Link preview | Similar to bookmark, sourced from Notion's link preview block |
| File | Download link with file name and extension |
| PDF | Download link (PDF viewer not embedded) |

**Data**

| Block | Notes |
|-------|-------|
| Simple table | Inline Notion table block (not a database) |
| Code | Syntax highlighting, copy button, language label |
| Equation | KaTeX rendering, inline and block |
| Form | Graceful unsupported notice (Notion native forms cannot be embedded) |

**Collections (databases)**

| Feature | Notes |
|---------|-------|
| Table view | Sortable columns, all property types rendered |
| Gallery view | Page cover or page icon as thumbnail, configurable grid |
| List view | Compact list with icon and title |
| Inline database | Rendered inline within a page |
| Linked database | Resolves and renders the source database |
| Page properties panel | Displays all database properties below a collection page title |
| View switcher | UI to switch between available views |
| Per-view rendering | Each view is rendered independently with its own settings |

**Inline text formatting**

Bold, italic, underline, strikethrough, inline code, colored text, colored background, links, mentions (`@page`, `@user`, dates), and equation inline.

---

### Architecture & performance

- **React Server Components** — zero client-side data fetching; every page renders on the server
- **Two-layer caching** — `unstable_cache` (disk/Redis persistent) + React `cache()` (per-request deduplication), 1h revalidation by default
- **Skeleton loading states** — instant visual feedback during SPA navigation between pages
- **Relation page fetcher** — automatically fetches relation target pages absent from the initial API payload
- **Mention page fetcher** — resolves `@page` mentions embedded in block text
- **Broken collection repair** — auto-detects empty collection queries (caused by relation-based group-by, a known bug in the Notion internal API) and re-fetches with a simpler reducer fallback
- **Signed image URLs** — Notion file URLs are signed and time-limited; the template fetches signed URLs at render time
- **Retry logic** — exponential backoff on transient Notion API errors (3 attempts, skips `not_found` / `unauthorized`)

### Site features

- **Auto-built navigation** — top nav and optional sidebar generated from your root Notion page structure (heading-based, see below)
- **Full-text search** — powered by Notion's internal search API, exposed as a Next.js route handler with highlighted results
- **Dark mode** — system-aware, user-toggleable, via `next-themes`
- **Sitemap** — auto-generated from your Notion page tree at `GET /sitemap.xml`
- **robots.txt** — at `GET /robots.txt`
- **SEO metadata** — page title and description pulled from Notion page content

---

## Gated content: the private block system

The template ships with an **opt-in private content system** that lets you restrict specific blocks or entire pages to authenticated members — without changing how you write in Notion.

### How it works

Any Notion block can be wrapped in a **Callout block with the `private` type** (or any convention you configure). When the page is rendered:

- **Authenticated members** see the content normally
- **Unauthenticated visitors** see a styled lock placeholder with a login link

Authentication is handled by a lightweight JWT system:

1. A visitor enters their email on the login page
2. The server checks if that email exists in a **Notion database you own** (the member list)
3. If found, a short-lived access token + long-lived refresh token are issued as HTTP-only cookies
4. On subsequent requests, middleware validates the access token and injects `x-user-email` and `x-user-roles` headers for RSC to consume
5. When the access token expires, it is transparently refreshed against the Notion member list — if the member has been removed, the session is invalidated

### Member list database structure

Create a Notion database with at least:

| Property | Type | Description |
|----------|------|-------------|
| `email` | Title | Member email address |
| `roles` | Relation | Links to a separate "Roles" database (optional, for role-based access) |

Set `NOTION_ACCESS_LIST_DB_ID` to this database's ID and `NOTION_TOKEN` to an integration token with read access to it.

### Role-based access

Each page or block can require a specific role. Roles are stored as linked pages in the member's `roles` relation property. The role ID is the page ID of the corresponding role page (without dashes). If a member's roles do not include the required role, the content is hidden.

### Disabling auth entirely

Leave `PRIVATE_ACCESS_ENABLED` unset or empty. The middleware becomes a no-op, all pages render publicly, and the login route still exists but serves no auth function.

---

## How to structure your Notion workspace

The template reads your root Notion page and builds navigation automatically. The structure of that page determines the site structure.

### Root page

`NEXT_PUBLIC_ROOT_NOTION_PAGE_ID` points to your root Notion page. This page is your homepage. Its content structure drives navigation.

### Navigation: heading-based

The template scans the root page and uses **H1 headings as top-nav groups**, **H2/H3 headings as dropdown sections**, and **sub-pages / text links as nav items**.

**Simple structure (top nav only)**

```
Root page
├── Heading 1 — "Guides"
│   ├── 📄 Getting started
│   ├── 📄 Advanced usage
├── Heading 1 — "Reference"
│   ├── Heading 2 — "API"
│   │   ├── 📄 Authentication
│   │   ├── 📄 Endpoints
│   ├── Heading 2 — "Concepts"
│   │   ├── 📄 Architecture
```

Result: a top nav with **Guides** (flat list) and **Reference** (sectioned dropdown with API and Concepts sections).

**Two-column structure (top nav + sidebar)**

If the **first block of your root page is a two-column layout**, the template splits it:

- **Left column** → top navigation (same heading-based logic)
- **Right column** → sidebar (H2 as section titles, sub-pages as links)

```
Root page
└── [Column layout — must be the first block]
    ├── Left column
    │   ├── Heading 1 — "Docs"
    │   │   ├── 📄 Introduction
    │   │   ├── 📄 Configuration
    ├── Right column
    │   ├── Heading 2 — "Resources"
    │   │   ├── 📄 Changelog
    │   │   ├── 📄 Roadmap
```

### Tips for organizing your Notion

- **Emoji icons** on pages and databases appear in the navigation and page headers — use them for visual hierarchy
- **Page descriptions** (the grey subtitle Notion shows under the title) are used as SEO `<meta description>`
- External links placed as text blocks in the root page are included in navigation as external links (open in new tab)
- Databases with **relation-based group-by** are supported — the template repairs them automatically on first load
- The template fetches up to **100 collection items** by default (configurable in `lib/notion.ts` → `collectionReducerLimit`)
- Sub-pages of sub-pages work fine — users navigate hierarchically through in-page links

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm

### 1. Clone and install

```bash
git clone https://github.com/shug0/notion-wiki-template.git
cd notion-wiki-template
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Required
NEXT_PUBLIC_ROOT_NOTION_PAGE_ID=   # ID of your root Notion page
NEXT_PUBLIC_SITE_URL=https://your-site.com

# Optional — only needed for private/gated content
NOTION_TOKEN=                       # Notion integration token (read access to member DB)
PRIVATE_ACCESS_ENABLED=true
JWT_SECRET=                         # Random secret, min 32 chars
NOTION_ACCESS_LIST_DB_ID=           # Notion DB ID used as member list
NEXT_PUBLIC_ACCESS_REQUEST_PAGE_ID= # Notion page ID shown as the access request form
```

**Finding your Notion page ID**

Open your page in Notion. The URL looks like:
```
https://notion.so/My-Page-Title-abc123def456...
```
The page ID is the last 32-character hex string (with or without dashes).

**Making your page public**

Go to your Notion page → **Share** → enable **Share to web**. No token is needed for public pages.

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Debug scripts

The `scripts/` directory contains a set of developer scripts for inspecting raw Notion API responses. All scripts use `tsx` and accept a page or block ID as argument.

```bash
# Inspect all blocks and metadata for a given page
pnpm tsx scripts/debug-page.ts <pageId>

# Print the nav tree built from the root page
pnpm tsx scripts/debug-nav-tree.ts <pageId>

# Inspect raw DOM structure rendered from Notion blocks
pnpm tsx scripts/debug-dom.ts <pageId>

# Test the Notion search API
pnpm tsx scripts/debug-search.ts <query> [ancestorId]

# Inspect a specific block by ID
pnpm tsx scripts/inspect-block.ts <blockId>

# Inspect collection query results for a page
pnpm tsx scripts/inspect-collection-query.ts <pageId>

# Inspect embed block data
pnpm tsx scripts/inspect-embed.ts

# Inspect first content blocks (useful for SEO description extraction)
pnpm tsx scripts/inspect-first-blocks.ts <pageId>

# Measure payload sizes to estimate cache usage
pnpm tsx scripts/measure-cache.ts

# Test collection metadata extraction (for generateMetadata)
pnpm tsx scripts/test-collection-metadata.ts <pageId>
```

These scripts read directly from the Notion API without going through Next.js, making them useful for diagnosing rendering issues or understanding the raw data shape before writing a new block component.

---

## Project structure

```
app/
  (main)/[id]/       # Wiki page routes
  (widget)/          # Standalone widget routes (e.g. random roll)
  api/
    search/          # Full-text search route handler
    auth/            # Login / logout route handlers
    download/        # File download proxy (avoids CORS on Notion file URLs)
  login/             # Login page (opt-in auth)

notion/
  blocks/
    data/            # Collection, code, table, equation, page-properties blocks
    layout/          # Callout, columns, toggle, TOC, page, private-content blocks
    media/           # Image, video, embed, bookmark, link-preview, file blocks
    text/            # Paragraph, heading, list, quote, todo blocks
  lib/
    block-children   # Child block resolution helpers
    colors           # Notion color → Tailwind class mapping
    conversion       # Notion block → normalized data converters
    data             # Page title, icon, cover, collection data extraction
    nav-tree         # Navigation tree builder (heading-based)
    notion-compat    # Shims for double-nested recordMap entries
    random-roll      # Random page picker utility
    registry         # Block type → component mapping
    styles           # Shared CSS class helpers
  renderers/
    header           # Page header renderer (title, icon, cover, breadcrumb)
    text             # Inline rich text renderer (decorations, links, mentions)
  types/             # Shared TypeScript types
  ui/
    collection-header         # Database header (title, view switcher)
    collection-header-url     # URL-based collection header variant
    collection-random-roll    # Random entry picker UI
    collection-toolbar        # View toolbar
    design-system             # All shared style tokens and variants
    figure                    # Figure + caption wrapper
    icon                      # Notion page icon renderer (emoji / image)
    page-link                 # Styled page link card
    page-title-row            # Canonical H1 row (icon + title + action slot)
    video-embed               # Responsive video embed wrapper
    view-switcher-url         # URL-based view switcher buttons
  orchestrator.tsx   # Maps block.type → component
  renderer.tsx       # Page-level renderer (block tree traversal)

lib/
  notion.ts          # Notion API wrapper (caching, retry, repair, relation/mention fetchers)
  auth/
    access-list      # Notion DB member lookup
    constants        # Cookie names, JWT options
    session          # Session read/write helpers
    session-cache    # Per-request session memoization
    tokens           # JWT sign/verify
  logger.ts          # Server-side logger
  utils.ts           # cn() helper

components/
  shared/            # Nav menu, search command, theme toggle, auth/user buttons
  ui/                # shadcn/ui components

scripts/             # Notion API debug scripts (see above)
```

---

## Stack

| | |
|--|--|
| Framework | Next.js 16 (App Router, RSC) |
| UI | shadcn/ui + Tailwind CSS v4 (OKLch color tokens) |
| Icons | Tabler Icons |
| Notion data | `notion-client` + `notion-types` (unofficial internal API) |
| Auth | `jose` (JWT) — no external auth provider |
| Date formatting | `date-fns` |
| Linter / Formatter | Biome |
| Package manager | pnpm |

---

## Customization

### Theming

Design tokens live in `app/globals.css` (Tailwind v4 `@theme inline` with OKLch colors). Edit colors, radius, and font variables there.

Notion-specific style tokens (icon sizes, text size variants, spacing) are centralized in `notion/ui/design-system.ts` — this is the single source of truth for all visual consistency across block components.

### Typography debug panel

A floating dev tool is included at `components/dev/typo-debug.tsx` for visually tuning typography and spacing tokens in real time.

Mount it anywhere in your layout (e.g. `app/layout.tsx`) during development:

```tsx
import { TypoDebug } from "@/components/dev/typo-debug"

// inside your layout
<TypoDebug />
```

The panel appears as a small icon in the bottom-right corner. Expand it to get live sliders for:

- Body font size and line height
- H1 / H2 / H3 / H4 sizes and heading line height
- Block gap and large block gap
- Vertical space before each heading level
- Max content container width

Hit **Copy values** to get the resulting CSS variable declarations, ready to paste into `app/globals.css`. Remove the component before shipping to production.

### Adding a block type

1. Create your component in `notion/blocks/<category>/your-block.tsx`
2. Register it in `notion/lib/registry.ts`
3. The orchestrator picks it up automatically — no other changes needed

### Cache duration

Pages are cached for 1h by default (`revalidate: 3600` in `lib/notion.ts`). To trigger on-demand revalidation, call `revalidateTag("notion")` from an API route or a webhook handler.

---

## Deployment

### Vercel (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shug0/notion-wiki-template)

Add the required environment variables in your Vercel project settings.

### Self-hosted

```bash
pnpm build
pnpm start
```

The custom cache handler (`cache-handler.js`) uses the local filesystem by default. For multi-instance deployments, swap it for a Redis adapter (e.g. `@neshca/cache-handler-redis-stack`).

---

## Known limitations

- Uses the **unofficial Notion internal API** (`notion-client`). This is stable in practice and widely used, but Notion provides no SLA or versioning guarantee. Breaking changes are possible without notice.
- **Public pages only** by default — the `NOTION_TOKEN` is only required for the private access system.
- Collections with **relation-based group-by** trigger a secondary fetch on first load (adds ~200–500ms, then cached for 1h).
- **Notion native forms** are not supported — they render as a placeholder notice.
- **Comment blocks** are not rendered.
- The private auth system uses a Notion database as its member list — suitable for small teams, not for large-scale user management.

---

## License

MIT
