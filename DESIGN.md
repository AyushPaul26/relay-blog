# Relay — the living intelligence tree

A public English build journal for Graph Hacks judges and developers. Explain the company-knowledge problem, Relay's real graph and approval workflows, and engineering lessons through an explorable living-tree metaphor. This content site is independent of the authenticated application.

## Visual direction

The user's living-tree reference guides one continuous illustrated world: a luminous tree at the upper right, an architectural terrace at middle left, and a platform with a glowing core at lower right. Scrolling travels from the canopy toward the roots and core while the light changes from day to night. Keep the surrounding interface quiet: editorial text, fine rules, native controls, no floating dashboard cards or invented metrics.

The portrait artwork is `public/assets/living-world.webp`, generated with AI from the supplied visual reference. Three.js presents it with WebGL depth effects, layered movement, lighting, and particles. This is an illustrated environment with depth effects, not a fully modeled or freely rotatable 3D tree. Scroll framing is reversible. Six chapters and function controls connect the metaphor to Research, Ripple, Finance, and Memory—real product functions, not invented autonomous agents. Below the world, the technical article reads as a forest field journal.

## Color, typography, and layout

Article tokens in `src/styles.css`: paper #edf0e6, ink #1b3025, muted #56665a, emerald #365f48, pale moss #dce5d8, mint #d9eadc, clay #9c4f36, borders #d0daca. Legacy variable names remain as aliases for existing article components. Scene tokens in `src/forest.css`: woodland #08110e, forest floor #15271e, fern #92bfa1, heart amber #d6ad6a, mist #c4cdbd, bark #7c7156. The WebGL scene uses corresponding woodland, fern, and amber values. Existing app screenshots retain their original colors.

Display: locally hosted Cormorant Garamond 500, normal and italic. Body and controls: locally hosted DM Sans. Utility and code: system monospace. Editorial display text is large and calm; technical diagrams stay sans serif. Article body is approximately 18px with a comfortable reading measure.

Compose each crop around the portrait artwork's landmarks, leaving readable space for the chapter text. The six chapters use normal document scrolling over a sticky scene, with direct scene-navigation buttons. Mobile framing preserves the same top-to-bottom journey with copy and controls kept clear of the image's focal points. The article keeps a sticky contents list on desktop and horizontal navigation on phones. Preserve reading and controls at narrow widths and short windows.

## Motion and interaction

Scroll updates the artwork framing, day-to-night color grade, and selected chapter. Function buttons select an explanation without automatically running work. WebGL depth effects, light, and particles should support the illustration without obscuring it. The frame loop stops offscreen and when the document is hidden. Pause motion and the operating-system reduced-motion preference stop continuous animation, while explicit scene and function changes remain usable.

The Finance example requires an explicit sample approval click before showing its receipt. Scrolling cannot grant approval. It is clearly fictional, local, and disconnected from live APIs. Reset restores the waiting state. Keep exact-version/tool/audience scope in the explanation and separate report/case review in the article.

## Accessibility, loading, and resilience

Use native buttons/links, visible focus, polite status, and meaningful text alternatives. All facts and navigation remain readable without JavaScript. Load the WebGL module progressively over the same portrait artwork; retain that image if WebGL is absent or its context is lost. Scene navigation, function descriptions, sample approval, and the full article do not depend on WebGL. No loading overlay blocks the page.

Clamp rendering resolution and keep shader, layer, and particle work modest on mobile. Reuse the local artwork for both enhanced rendering and fallback rather than loading a separate scene. No scroll capture or forced timed sequence. Keep text and controls readable over the scene. Video remains click-to-load with an external fallback; copy-link retains a selectable fallback.

## Content boundaries

Ground technical facts in the application README, graph and workflow implementations, and verification record. FalkorDB stores graph relationships, permissions, source references, approvals, workflow state, and memory; LangGraph coordinates stages. The tree is a metaphor, never a live activity monitor. Do not invent customers, autonomous agents, learning/training behavior, productivity statistics, payment actions, or participant expertise. Preserve limitations and the ordinary AI-assistance disclosure. Never publish demo passwords or API keys.

## Delivery and verification

Standalone `AyushPaul26/relay-blog`, branch main, deployed separately on Vercel. `npm ci` installs pinned Three.js and Cormorant font packages. The Node build copies static modules, two minified Three.js modules, licensed fonts, and local assets to dist; no backend or credentials are needed. Keep third-party licenses in the output.

Verify syntax/build, scene and branch controls, approval/reset, existing Ripple/video/copy, keyboard behavior, all local references, no-JS reading, reduced motion, unavailable WebGL/context loss, desktop/mobile/short-window layouts, security headers, and automated accessibility. Inspect real browser screenshots before pushing. Do not claim a live Vercel deployment until observed.
