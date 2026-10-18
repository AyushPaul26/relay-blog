import * as THREE from "./vendor/three.module.min.js";
import { dropletTexture } from "./tree-geometry.js";

// Hand-mapped to existing painted waterfalls. Coordinates refer to the original
// 1024 × 1536 portrait, with a top-left origin; no new landscape is introduced.
const WATERFALLS = [
  { from: [472, 423], to: [475, 573], width: 11, strength: 0.84 },
  { from: [505, 413], to: [501, 550], width: 9, strength: 0.72 },
  { from: [601, 432], to: [597, 550], width: 12, strength: 0.88 },
  { from: [891, 637], to: [888, 790], width: 9, strength: 0.62 },
  { from: [138, 799], to: [144, 1002], width: 12, strength: 0.78 },
  { from: [236, 800], to: [230, 1136], width: 18, strength: 1 },
  { from: [547, 837], to: [550, 911], width: 8, strength: 0.76 },
  { from: [75, 510], to: [80, 650], width: 11, strength: 0.54 },
  { from: [190, 1306], to: [189, 1445], width: 13, strength: 0.64 },
  { from: [285, 1305], to: [287, 1450], width: 13, strength: 0.64 },
];

const waterfallVertex = `
  varying vec2 vFlowUv;
  void main() {
    vFlowUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterfallFragment = `
  varying vec2 vFlowUv;
  uniform float uTime;
  uniform float uNight;
  uniform float uSeed;
  uniform float uStrength;
  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 offset = fract(point);
    offset = offset * offset * (3.0 - 2.0 * offset);
    return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), offset.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), offset.x), offset.y);
  }
  void main() {
    vec2 uv = vFlowUv;
    float fallingTime = uTime * (13.0 + uSeed * 0.7);
    float wander = sin(uv.y * 13.0 + fallingTime * 0.14 + uSeed) * 0.025;
    float edge = 1.0 - smoothstep(0.22, 0.5, abs(uv.x - 0.5 + wander));
    float ends = smoothstep(0.0, 0.13, uv.y) * (1.0 - smoothstep(0.95, 1.0, uv.y));
    // Increasing texture Y moves every highlight toward the bottom of the fall.
    float water = noise(vec2(uv.x * 8.0 + uSeed, uv.y * 35.0 + fallingTime));
    float fine = noise(vec2(uv.x * 22.0 + uSeed, uv.y * 76.0 + fallingTime * 1.9));
    float rivulet = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(uv.x * 35.0 + uv.y * 3.0 + uSeed), 2.0);
    float highlight = smoothstep(0.4, 0.82, water) * rivulet;
    vec3 shadow = mix(vec3(0.45, 0.57, 0.65), vec3(0.24, 0.40, 0.61), uNight);
    vec3 whiteWater = mix(vec3(0.96, 0.94, 0.84), vec3(0.62, 0.76, 0.94), uNight);
    vec3 color = mix(shadow, whiteWater, highlight * 0.8 + fine * 0.2);
    float alpha = (0.12 + highlight * 0.56 + fine * 0.12) * edge * ends * uStrength;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

function ribbonGeometry(fall, width, height) {
  const positions = [];
  const uv = [];
  const indices = [];
  const segments = 18;
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = THREE.MathUtils.lerp(fall.from[0], fall.to[0], t);
    const y = THREE.MathUtils.lerp(fall.from[1], fall.to[1], t);
    const halfWidth = (fall.width * (0.84 + t * 0.24)) / 2;
    for (const side of [-1, 1]) {
      positions.push(
        ((x + side * halfWidth) / 1024 - 0.5) * width,
        (0.5 - y / 1536) * height,
        0.105,
      );
      uv.push(side === -1 ? 0 : 1, 1 - t);
    }
    if (index < segments) {
      const start = index * 2;
      indices.push(
        start,
        start + 2,
        start + 1,
        start + 1,
        start + 2,
        start + 3,
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  return geometry;
}

export function createWaterfallEffects({
  scene,
  worldWidth,
  worldHeight,
  random,
  mobile,
  cloudTexture,
}) {
  const clock = { value: 0 };
  const night = { value: 0 };
  const plumes = [];
  const drops = [];
  const dropsPerFall = mobile ? 9 : 16;
  WATERFALLS.forEach((fall, index) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: clock,
        uNight: night,
        uSeed: { value: index * 1.47 },
        uStrength: { value: fall.strength },
      },
      vertexShader: waterfallVertex,
      fragmentShader: waterfallFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const ribbon = new THREE.Mesh(
      ribbonGeometry(fall, worldWidth, worldHeight),
      material,
    );
    ribbon.renderOrder = 1;
    scene.add(ribbon);
    const plumeMaterial = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      color: 0xe8e7df,
      transparent: true,
      opacity: 0.28 * fall.strength,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });
    const plume = new THREE.Mesh(
      new THREE.PlaneGeometry((fall.width / 1024) * worldWidth * 4.6, 0.42),
      plumeMaterial,
    );
    plume.position.set(
      (fall.to[0] / 1024 - 0.5) * worldWidth,
      (0.5 - fall.to[1] / 1536) * worldHeight + 0.05,
      0.13,
    );
    plume.userData.origin = plume.position.clone();
    plume.userData.phase = index * 2.7;
    plume.userData.strength = fall.strength;
    plume.renderOrder = 2;
    plumes.push(plume);
    scene.add(plume);
    for (let drop = 0; drop < dropsPerFall; drop += 1)
      drops.push({
        fall,
        phase: random(),
        lane: (random() - 0.5) * 0.62,
        speed: 0.32 + random() * 0.26,
      });
  });
  const position = new Float32Array(drops.length * 3);
  const dropGeometry = new THREE.BufferGeometry();
  dropGeometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  const texture = dropletTexture();
  const dropMaterial = new THREE.PointsMaterial({
    map: texture,
    color: 0xf0f5ed,
    size: 0.105,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const fallingDrops = new THREE.Points(dropGeometry, dropMaterial);
  fallingDrops.frustumCulled = false;
  fallingDrops.renderOrder = 2;
  scene.add(fallingDrops);
  const dayColor = new THREE.Color(0xe8e7df);
  const nightColor = new THREE.Color(0x839fbb);
  return {
    update(elapsed, nightAmount) {
      clock.value = elapsed;
      night.value = nightAmount;
      drops.forEach((drop, index) => {
        const t = (elapsed * drop.speed + drop.phase) % 1;
        const fall = drop.fall;
        const x =
          THREE.MathUtils.lerp(fall.from[0], fall.to[0], t) +
          fall.width * drop.lane +
          Math.sin(elapsed * 1.7 + drop.phase * 9) * 0.6;
        const y = THREE.MathUtils.lerp(fall.from[1], fall.to[1], t);
        position[index * 3] = (x / 1024 - 0.5) * worldWidth;
        position[index * 3 + 1] = (0.5 - y / 1536) * worldHeight;
        position[index * 3 + 2] = 0.12;
      });
      dropGeometry.attributes.position.needsUpdate = true;
      dropMaterial.color.copy(dayColor).lerp(nightColor, nightAmount * 0.7);
      plumes.forEach((plume) => {
        const phase = elapsed * 0.68 + plume.userData.phase;
        plume.position.x =
          plume.userData.origin.x + Math.sin(phase * 0.6) * 0.1;
        plume.position.y = plume.userData.origin.y + Math.sin(phase) * 0.055;
        plume.scale.set(
          1 + Math.sin(phase * 0.7) * 0.13,
          1 + Math.cos(phase * 0.8) * 0.18,
          1,
        );
        plume.material.opacity =
          (0.29 + Math.sin(phase) * 0.065) * plume.userData.strength;
        plume.material.color.copy(dayColor).lerp(nightColor, nightAmount);
      });
    },
    dispose() {
      texture.dispose();
    },
  };
}
