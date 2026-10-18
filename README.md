# Relay build journal

A standalone, public article about Relay for Graph Hacks. This is a static site, independent of the authenticated Relay application on Render. No database, API credentials, or environment variables are required. Three.js adds depth and light to a continuous illustrated world; the artwork, fonts, and rendering modules are served locally.

## Build and preview

From the repository root, with Node.js 22+:

```sh
npm ci
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
- Six scroll chapters travel down one portrait world: from a luminous tree, past an architectural terrace, to a platform and glowing core. WebGL depth effects, particles, and a day-to-night grade accompany the journey. Scene buttons provide direct navigation.
- `public/assets/living-world.webp` is AI-generated artwork based on the supplied visual reference. It is an illustrated environment with depth effects, not a fully modeled or freely rotatable 3D tree.
- Research, Ripple, Finance, and Memory branches explain actual product functions. The tree is a visual metaphor, not a live activity monitor.
- A fictional receipt appears only after explicit sample approval. No live tools or workflows run.
- The same artwork and all written content remain available if WebGL fails. The article also remains readable without JavaScript.
- The scene pauses offscreen. Scroll and ambient effects respect system motion preferences, with an additional Pause motion control on the page.
- Dependency toggle is a labeled local illustration, not a live backend operation.
- YouTube player loads only after the reader presses Play; an ordinary YouTube link remains available.
- Core facts are grounded in the repository and verification documentation; limits and AI assistance are disclosed.
- The included product screenshot contains fictional demo data. Fonts use their included SIL Open Font Licenses; Three.js uses the MIT license. Both license texts are included in the build.

Visual intent, design tokens, and accessibility requirements are recorded in `DESIGN.md`.
