import * as THREE from "./vendor/three.module.min.js";

export function seededRandom(seed = 713) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

export function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.16, "rgba(255,255,255,.65)");
  gradient.addColorStop(0.4, "rgba(255,255,255,.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function mistTexture(random) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  for (let puff = 0; puff < 50; puff += 1) {
    const x = 35 + random() * 442;
    const y = 42 + random() * 44;
    const radius = 22 + random() * 35;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,.24)");
    gradient.addColorStop(0.5, "rgba(255,255,255,.09)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  // Feather the texture boundary so drifting cloud banks never reveal a quad.
  context.globalCompositeOperation = "destination-in";
  const feather = context.createLinearGradient(0, 0, 0, 128);
  feather.addColorStop(0, "rgba(255,255,255,0)");
  feather.addColorStop(0.22, "rgba(255,255,255,1)");
  feather.addColorStop(0.78, "rgba(255,255,255,1)");
  feather.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = feather;
  context.fillRect(0, 0, 512, 128);
  const horizontalFeather = context.createLinearGradient(0, 0, 512, 0);
  horizontalFeather.addColorStop(0, "rgba(255,255,255,0)");
  horizontalFeather.addColorStop(0.1, "rgba(255,255,255,1)");
  horizontalFeather.addColorStop(0.9, "rgba(255,255,255,1)");
  horizontalFeather.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = horizontalFeather;
  context.fillRect(0, 0, 512, 128);
  return new THREE.CanvasTexture(canvas);
}

export function dropletTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  context.save();
  context.translate(32, 32);
  context.scale(0.19, 1);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 30);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,.7)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(-32, -32, 64, 64);
  context.restore();
  return new THREE.CanvasTexture(canvas);
}

export function disposeScene(scene) {
  const geometries = new Set();
  const materials = new Set();
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => materials.add(material));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
