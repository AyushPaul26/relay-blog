# Relay build journal

A standalone, public article about Relay for Graph Hacks. This is a static site, independent of the authenticated Relay application on Render. No database, API credentials, environment variables, or npm dependencies are required for the site.

## Build and preview

From the repository root, with Node.js 22+:

```sh
npm run check
npm run build
npm run preview
```

Preview uses Python 3. The production output is `dist/`.

## Deploy as a new Vercel project

Import `AyushPaul26/relay-blog`, branch `main`, and name the new project `relay-blog` (or an available alternative). Leave **Root Directory** at the repository root (`./`), set **Framework Preset** to `Other`, **Build Command** to `npm run build`, and **Output Directory** to `dist`. No environment variables are needed. The existing Render app is unaffected.

The `vercel.json` in this folder sets the build/output and security headers. Ensure the resulting production deployment is public so judges can read it without Vercel authentication. Use the actual production URL returned by Vercel; no URL is assumed here.

Open [Vercel's new project page](https://vercel.com/new), import `AyushPaul26/relay-blog`, and use the settings above. This repository contains only the blog; links in the article point to the main [Relay application repository](https://github.com/AyushPaul26/wemakedevs).

## Content and behavior

- Static article remains readable without JavaScript.
- A four-scene scroll story connects evidence, pauses at an auditor checkpoint, and shows a fictional receipt only after explicit sample approval. Scene buttons provide direct navigation; no live tools or workflows run.
- Short entrance and section animations respect reduced-motion preferences, with an additional Reduce motion control on the page.
- Dependency toggle is a labeled local illustration, not a live backend operation.
- YouTube player loads only after the reader presses Play; an ordinary YouTube link remains available.
- Core facts are grounded in the repository and verification documentation; limits and AI assistance are disclosed.
- The included product screenshot contains fictional demo data. Fonts use their included SIL Open Font Licenses.

Visual intent, design tokens, and accessibility requirements are recorded in `DESIGN.md`.
