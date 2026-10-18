import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = path.join(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "assets"), { recursive: true });
await cp(path.join(root, "public"), out, { recursive: true });
await cp(
  path.join(root, "src/styles.css"),
  path.join(out, "assets/styles.css"),
);
await cp(path.join(root, "src/main.js"), path.join(out, "assets/main.js"));
for (const name of [
  "forest.js",
  "forest.css",
  "tree-scene.js",
  "tree-geometry.js",
  "environment-effects.js",
]) {
  await cp(path.join(root, "src", name), path.join(out, "assets", name));
}
await mkdir(path.join(out, "assets/vendor"), { recursive: true });
for (const name of ["three.module.min.js", "three.core.min.js"]) {
  await cp(
    path.join(root, "node_modules/three/build", name),
    path.join(out, "assets/vendor", name),
  );
}
await cp(
  path.join(root, "node_modules/three/LICENSE"),
  path.join(out, "assets/vendor/THREE-LICENSE.txt"),
);
for (const name of [
  "cormorant-garamond-latin-500-normal.woff2",
  "cormorant-garamond-latin-500-italic.woff2",
]) {
  await cp(
    path.join(root, "node_modules/@fontsource/cormorant-garamond/files", name),
    path.join(out, "fonts", name),
  );
}
await cp(
  path.join(root, "node_modules/@fontsource/cormorant-garamond/LICENSE"),
  path.join(out, "fonts/Cormorant-Garamond-LICENSE.txt"),
);
let html = await readFile(path.join(root, "index.html"), "utf8");
const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
if (productionDomain && /^[a-z0-9.-]+$/i.test(productionDomain)) {
  const origin = `https://${productionDomain}`;
  html = html.replace(
    'content="/assets/social-cover.png"',
    `content="${origin}/assets/social-cover.png"`,
  );
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${origin}/" />\n<meta property="og:url" content="${origin}/" />\n</head>`,
  );
}
await writeFile(path.join(out, "index.html"), html);
await writeFile(
  path.join(out, "404.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found · Relay</title><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/forest.css"><main class="not-found"><a class="wordmark" href="/">relay.</a><h1>This path ends here.</h1><p>The story is still waiting for you.</p><a class="button button-primary" href="/">Back to the journal <span aria-hidden="true">↗</span></a></main></html>`,
);
console.log(
  "Built Relay journal → dist (static assets only; no credentials or runtime configuration).",
);
