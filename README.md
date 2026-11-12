# iGolf Website — Current Production Source

Production: https://igolf32.com · Vercel project: `igolf32-emergency-site`.

## Current release (2026-11-12)

The deployable source matches production deployment `dpl_BEMbmZBNxYrTSzgcK2ifc7xEjWSD`. All 59 deployed source files were checked by SHA-1 before this sync.

- Current redesign, inline menu, events page, membership rates, and booking links are included.
- `igolf-next.css` / `igolf-next.js` (added after this release): the "midnight clubhouse" layer. Home, events, pricing and memberships bodies use its `.ig-*` components and the per-person price check; other marketing pages load the stylesheet for the shared display face and buttons.
- Event inquiries are stored through `api/inquiry.js` and emailed through Resend.
- Production configuration requires `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `INQUIRY_ALERT_FROM`, and `INQUIRY_ALERT_TO`. Values live in Vercel / the automation vault, never in Git.
- The sending domain is `mail.igolf32.com`; alerts go to `hello@igolf32.com`.
- `.vercelignore` excludes historical captures and local-only files from deployment.
- GitHub is the versioned source. This sync does not establish automatic deployment or a recurring mirror.

The notes below are historical recovery/design documentation and may describe superseded UI or behavior.

---

# i Golf Website Backup

Public website recovery snapshot for `igolf32.com`, captured on 2026-06-04.

## Contents

- `homepage.html` — captured public homepage HTML.
- `meta/` — response headers, robots.txt, and sitemap endpoints.
- `public-api/` — public WordPress REST API responses available without credentials.
- `dns/` — public DNS readouts for A, NS, and www CNAME.
- `SNAPSHOT-MANIFEST.md` — portfolio snapshot manifest and limitations.

## Notes

This is a public-surface backup, not a credentialed WordPress or hosting backup. It does not include the database export, full uploads directory, theme/plugin source, `wp-config.php`, hosting files, Cloudflare settings, or registrar/account metadata.

Use this repo as a design and recovery reference for AI agents, developers, and human designers.

## Deployable Redesigned Site

A full static redesign of igolf32.com built from the original site's content, assets, and brand research:

- `index.html` - home page: video hero (original `iGolf2023.mp4` via CDN with photo fallback), stats, experience cards, simulator/bar features, gallery, Space Hospitality family, FAQ.
- `pricing.html` - hourly bay rates plus food, liquor, and event menu links (official PDFs).
- `lessons.html` - instructor profiles (Carlos Medina, KJ Lee, Sean Kim) and consultation CTAs.
- `memberships.html` - Individual / Family / Premium tiers wired to the venue's live Square checkout links.
- `reserve.html` - online booking (book.igolf32.com) plus a private-event inquiry form (mailto-based, no backend).
- `contact.html` - location, hours, Google Maps embed, transit directions.
- `terms.html` - Terms of Use regenerated from the original site's legal copy.
- `styles.css` / `main.js` - shared dark-luxe neon design system (brand gold/magenta/cyan), self-hosted Rubik + Space Mono webfonts, scroll-reveal animations, count-up stats, mobile nav, sticky mobile CTA.
- `assets/img/` + `assets/fonts/` - cleaned-up venue photos, logos, and webfonts copied from the original-site capture.
- `_verification/` - desktop and mobile screenshots generated during preview checks.

Vercel project: `igolf32-emergency-site`

Current menu PDFs are committed locally under `assets/menus/` from the verified `SP32-MEDIA / 6 Menu Design + Recipe R&D / 골프장 메뉴 / iGolf Menu 2026 Winter` Drive folder. `/menu` and `/menu.pdf` open the combined current menu PDF directly.

This repo preserves the original public-surface recovery snapshot and adds a deployable redesigned static site for continuity, AI agents, developers, and human designers.

## Latest Original Site Capture

- `original-site-capture/20260612-0420-live/` - live public capture from the restored original website.
- Includes homepage HTML, headers, robots/sitemaps, DNS, public WordPress REST structure, media/page indexes, and homepage-linked public assets.
- Use this folder as the current original-site reference while building the replacement site.
