import * as THREE from "./vendor/three.module.min.js";

// These positions belong to the existing 1024 × 1536 illustration. The tree,
// rock and architecture stay fixed; only light, flame and energy move.
const LAMPS = [
  [555, 309, 12, 21],
  [660, 300, 13, 22],
  [820, 311, 11, 20],
  [890, 300, 10, 18],
  [802, 379, 10, 18],
  [844, 431, 12, 22],
  [884, 520, 14, 25],
  [521, 628, 10, 19],
  [225, 747, 11, 20],
  [307, 744, 11, 20],
  [365, 797, 17, 29],
  [410, 776, 13, 24],
  [843, 1108, 12, 22],
  [978, 1257, 12, 27],
  [499, 1385, 11, 20],
  [560, 1417, 12, 23],
  [695, 1481, 14, 28],
];

const vertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const noise = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`;

const coreFragment = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uNight;
  ${noise}
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float edge = 1.0 - smoothstep(0.78, 0.98, r);
    // Moving, irregular filaments curl around a luminous volume. The mask ends
    // inside the root opening, so none of the wooden structure is displaced.
    float turbulence = noise(p * 5.0 + vec2(uTime * 0.23, -uTime * 0.17));
    vec3 sphere = vec3(p, sqrt(max(0.0, 1.0 - r * r)));
    float turn = uTime * 0.58;
    float c = cos(turn), s = sin(turn);
    vec3 q = vec3(sphere.x * c + sphere.z * s, sphere.y,
      sphere.z * c - sphere.x * s);
    float field = sin(q.x * 11.0 + sin(q.z * 7.0) * 1.1 + uTime * 0.3)
      * cos(q.y * 12.0 + q.z * 5.0);
    float filament = pow(1.0 - abs(field), 22.0);
    float crossing = pow(0.5 + 0.5 * sin(q.y * 16.0 + q.z * 9.0 - uTime * 1.3 + turbulence), 25.0);
    float movingFront = pow(0.5 + 0.5 * sin(r * 27.0 - uTime * 4.8 + turbulence * 2.0), 14.0);
    float center = exp(-r * r * 18.0);
    float shell = smoothstep(0.11, 0.32, r);
    float energy = filament * 0.8 + crossing * 0.38 + movingFront * 0.26;
    energy *= shell;
    float breathing = 0.86 + sin(uTime * 1.6) * 0.14;
    vec3 ember = vec3(0.50, 0.095, 0.006);
    vec3 gold = vec3(1.0, 0.57, 0.11);
    vec3 white = vec3(1.0, 0.95, 0.65);
    vec3 color = mix(ember, gold, clamp(energy * 1.7, 0.0, 1.0));
    color = mix(color, white, clamp(energy * 0.5 + center * breathing, 0.0, 1.0));
    float alpha = edge * (0.22 + energy * 0.54 + center * 0.15);
    gl_FragColor = vec4(color * (0.95 + uNight * 0.05), alpha);
    #include <colorspace_fragment>
  }
`;

const flameVertex = `
  attribute float aSeed;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    vUv = uv;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flameFragment = `
  varying vec2 vUv;
  varying float vSeed;
  uniform float uTime;
  uniform float uNight;
  ${noise}
  void main() {
    float y = vUv.y;
    float time = uTime * 2.8 + vSeed;
    float gust = sin(y * 7.0 - time * 1.7) * 0.12 * y;
    gust += sin(y * 12.0 - time * 2.1 + vSeed) * 0.045;
    float width = mix(0.33, 0.035, pow(y, 0.7));
    float flame = 1.0 - smoothstep(width * 0.3, width, abs(vUv.x - 0.5 - gust));
    float fuel = noise(vec2(vUv.x * 5.0 + vSeed, y * 7.0 - time * 2.2));
    float tip = 1.0 - smoothstep(0.58 + fuel * 0.3, 1.0, y);
    float base = smoothstep(0.0, 0.12, y);
    float flicker = 0.75 + 0.25 * sin(time * 3.3 + vSeed);
    float alpha = flame * tip * base * (0.55 + fuel * 0.35) * flicker;
    vec3 color = mix(vec3(1.0, 0.16, 0.008), vec3(1.0, 0.76, 0.27), flame * (1.0 - y * 0.7));
    gl_FragColor = vec4(color, alpha * (0.84 + uNight * 0.16));
    #include <colorspace_fragment>
  }
`;

const hologramFragment = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uNight;
  uniform float uSeed;
  void main() {
    vec2 uv = vUv;
    float edge = smoothstep(0.0, 0.09, uv.x) * (1.0 - smoothstep(0.91, 1.0, uv.x));
    edge *= smoothstep(0.0, 0.07, uv.y) * (1.0 - smoothstep(0.93, 1.0, uv.y));
    float scanPosition = fract(uTime * 0.35 + uSeed);
    float scan = exp(-pow((uv.y - scanPosition) * 15.0, 2.0));
    float line = pow(0.5 + 0.5 * sin(uv.y * 61.0 - uTime * 5.0), 6.0);
    float data = pow(0.5 + 0.5 * sin(uv.x * 16.0 + uv.y * 12.0 - uTime * 2.8), 5.0);
    vec3 color = mix(vec3(0.015, 0.22, 0.48), vec3(0.38, 0.94, 1.0), scan * 0.9 + line * 0.12);
    float alpha = (0.14 + scan * 0.7 + line * 0.12 + data * 0.08) * edge;
    gl_FragColor = vec4(color, alpha * (0.85 + uNight * 0.15));
    #include <colorspace_fragment>
  }
`;

function pixelPoint(x, y, width, height, z = 0.15) {
  return new THREE.Vector3(
    (x / 1024 - 0.5) * width,
    (0.5 - y / 1536) * height,
    z,
  );
}

function quadGeometry(quads, worldWidth, worldHeight) {
  const position = [];
  const uv = [];
  const seeds = [];
  const indices = [];
  quads.forEach((quad, index) => {
    quad.forEach(([x, y], corner) => {
      const p = pixelPoint(x, y, worldWidth, worldHeight);
      position.push(p.x, p.y, p.z);
      uv.push(corner === 0 || corner === 3 ? 0 : 1, corner < 2 ? 1 : 0);
      seeds.push(index * 1.71);
    });
    const start = index * 4;
    indices.push(start, start + 3, start + 1, start + 1, start + 3, start + 2);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(position, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  geometry.setIndex(indices);
  return geometry;
}

export function createEnergyEffects({
  scene,
  worldWidth,
  worldHeight,
  random,
  mobile,
}) {
  const time = { value: 0 };
  const night = { value: 0 };
  const meshes = [];
  const create = (
    geometry,
    fragmentShader,
    extra = {},
    vertexShader = vertex,
  ) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uNight: night, ...extra },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 4;
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  };

  const core = create(
    new THREE.PlaneGeometry(
      (132 / 1024) * worldWidth,
      (142 / 1536) * worldHeight,
    ),
    coreFragment,
  );
  core.position.copy(pixelPoint(818, 1328, worldWidth, worldHeight));

  const lampQuads = LAMPS.map(([x, y, width, height]) => [
    [x - width / 2, y - height],
    [x + width / 2, y - height],
    [x + width / 2, y + 2],
    [x - width / 2, y + 2],
  ]);
  create(
    quadGeometry(lampQuads, worldWidth, worldHeight),
    flameFragment,
    {},
    flameVertex,
  );

  // Perspective corners follow the two painted screens, rather than adding
  // unrelated floating UI or changing the stable platform beneath them.
  [
    [
      [674, 1076],
      [688, 1079],
      [693, 1096],
      [679, 1094],
    ],
    [
      [863, 1078],
      [883, 1084],
      [880, 1103],
      [860, 1097],
    ],
  ].forEach((corners, index) => {
    create(quadGeometry([corners], worldWidth, worldHeight), hologramFragment, {
      uSeed: { value: index * 0.42 },
    });
  });

  const sparks = [];
  LAMPS.forEach(([x, y], lamp) => {
    for (let i = 0; i < (mobile ? 2 : 4); i += 1) {
      sparks.push({
        x,
        y,
        phase: random(),
        speed: 0.19 + random() * 0.2,
        drift: (random() - 0.5) * 16,
        height: 15 + random() * 28,
        lamp,
      });
    }
  });
  const orbitCount = mobile ? 14 : 24;
  const count = sparks.length + orbitCount;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 point = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * point;
        gl_PointSize = clamp(aSize * 650.0 / -point.z, 1.0, 9.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float radius = length(p);
        float glow = exp(-radius * radius * 23.0) * (1.0 - smoothstep(0.38, 0.5, radius));
        gl_FragColor = vec4(vColor, glow);
        #include <colorspace_fragment>
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  particles.renderOrder = 5;
  meshes.push(particles);
  scene.add(particles);

  return {
    update(elapsed, nightAmount) {
      time.value = elapsed;
      night.value = nightAmount;
      sparks.forEach((spark, index) => {
        const age = (elapsed * spark.speed + spark.phase) % 1;
        const x =
          spark.x + Math.sin(age * 4.0 + spark.lamp) * spark.drift * age;
        const y = spark.y - age * spark.height;
        const p = pixelPoint(x, y, worldWidth, worldHeight, 0.17);
        positions.set([p.x, p.y, p.z], index * 3);
        const fade = Math.sin(age * Math.PI);
        colors.set([fade, fade * 0.48, fade * 0.075], index * 3);
        sizes[index] = 0.035 + fade * 0.045;
      });
      for (let i = 0; i < orbitCount; i += 1) {
        const index = sparks.length + i;
        const phase = (i / orbitCount) * Math.PI * 2;
        const orbit = phase + elapsed * (i % 2 ? 0.72 : -0.49);
        const radius = 24 + (i % 4) * 8;
        const x = 818 + Math.cos(orbit) * radius;
        const y = 1328 + Math.sin(orbit) * radius * (0.64 + (i % 3) * 0.16);
        const p = pixelPoint(x, y, worldWidth, worldHeight, 0.19);
        positions.set([p.x, p.y, p.z], index * 3);
        const glow = 0.5 + 0.5 * Math.sin(orbit + phase);
        colors.set([1, 0.58 + glow * 0.25, 0.16 + glow * 0.21], index * 3);
        sizes[index] = 0.055 + glow * 0.035;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
    },
    dispose() {
      // Scene teardown owns geometry/material disposal, matching waterfalls.
      // There are no extra textures or private animation loops to release.
    },
  };
}
