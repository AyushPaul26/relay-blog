import * as THREE from "./vendor/three.module.min.js";
import { createWaterfallEffects } from "./environment-effects.js";
import {
  seededRandom,
  glowTexture,
  mistTexture,
  disposeScene,
} from "./tree-geometry.js";

const clamp = THREE.MathUtils.clamp;
const smooth = (value) => value * value * (3 - 2 * value);
const BRANCHES = {
  research: new THREE.Vector2(0.69, 0.79),
  ripple: new THREE.Vector2(0.36, 0.49),
  finance: new THREE.Vector2(0.78, 0.265),
  memory: new THREE.Vector2(0.8, 0.135),
};
const EMPTY_SCENE = {
  setProgress() {},
  setBranch() {},
  setReducedMotion() {},
  setVisible() {},
  dispose() {},
};

const artworkVertex = `
  varying vec2 vArtworkUv;
  uniform vec2 uPointer;
  uniform float uMotion;
  void main() {
    vArtworkUv = uv;
    vec3 point = position;
    // The surface relief is shallow; the artwork composition stays intact.
    float relief = sin(uv.x * 3.14159) * sin(uv.y * 3.14159);
    point.z += relief * 0.08;
    point.x += uPointer.x * relief * 0.025 * uMotion;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
  }
`;

const artworkFragment = `
  uniform sampler2D uArtwork;
  uniform float uProgress;
  uniform float uTime;
  uniform float uMotion;
  uniform vec2 uSelected;
  varying vec2 vArtworkUv;
  void main() {
    vec2 uv = vArtworkUv;
    vec4 source = texture2D(uArtwork, uv);
    vec3 color = source.rgb;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float twilight = smoothstep(0.27, 0.72, uProgress);
    float night = smoothstep(0.56, 1.0, uProgress);
    float gold = sin(clamp(uProgress / 0.5, 0.0, 1.0) * 3.14159);
    vec3 daylight = color * vec3(1.02, 1.045, 1.075);
    daylight *= vec3(1.0 + gold * 0.04, 1.0, 1.0 - gold * 0.045);
    vec3 blueHour = mix(color, vec3(luminance), 0.12) * vec3(0.56, 0.69, 0.94);
    blueHour += vec3(0.008, 0.013, 0.025) * (1.0 - luminance);
    color = mix(daylight, blueHour, twilight);
    vec3 midnight = mix(source.rgb, vec3(luminance), 0.25) * vec3(0.32, 0.46, 0.73);
    midnight += vec3(0.009, 0.018, 0.038) * (1.0 - luminance);
    color = mix(color, midnight, night * 0.78);
    // Preserve lights already painted into the same world, without geometric overlays.
    float amber = smoothstep(0.045, 0.19, source.r - source.b)
      * smoothstep(0.15, 0.42, source.r)
      * smoothstep(0.02, 0.10, source.r - source.g);
    float awayFromSun = smoothstep(0.30, 0.48, uv.x) + (1.0 - smoothstep(0.60, 0.75, uv.y));
    amber *= clamp(awayFromSun, 0.0, 1.0);
    vec2 coreDistance = (uv - vec2(0.80, 0.135)) / vec2(0.07, 0.06);
    float core = exp(-dot(coreDistance, coreDistance) * 2.0);
    float breath = 1.0 + sin(uTime * 1.25) * 0.13;
    color = mix(color, source.rgb * breath, clamp((amber * 0.78 + core * 0.65) * twilight, 0.0, 0.94));
    vec2 region = (uv - uSelected) / vec2(0.11, 0.085);
    float selection = exp(-dot(region, region) * 1.5);
    color += source.rgb * selection * amber * 0.075;
    color += vec3(0.013, 0.009, 0.002) * core * (0.5 + night * 0.5);
    color += source.rgb * core * sin(uTime * 1.25) * 0.06;
    gl_FragColor = vec4(color, source.a);
    #include <colorspace_fragment>
  }
`;

/** One continuous illustration with camera travel and layered 3D atmosphere. */
export async function createTreeScene({
  container,
  artworkUrl = "/assets/living-world.webp",
  onSelect = () => {},
  onReady = () => {},
  onFallback = () => {},
}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch (error) {
    onFallback(error);
    return { ...EMPTY_SCENE };
  }
  renderer.setClearColor(0x10202c, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth <= 760 ? 1.25 : 1.5,
    ),
  );
  renderer.domElement.className = "living-tree-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);
  let artwork;
  try {
    artwork = await new THREE.TextureLoader().loadAsync(artworkUrl);
    if (!artwork.image?.width || !artwork.image?.height)
      throw new Error("Artwork has no valid dimensions");
  } catch (error) {
    artwork?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    onFallback(error);
    return { ...EMPTY_SCENE };
  }
  artwork.colorSpace = THREE.SRGBColorSpace;
  artwork.minFilter = THREE.LinearMipmapLinearFilter;
  artwork.magFilter = THREE.LinearFilter;
  artwork.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
  const random = seededRandom(724);
  const mobile = window.innerWidth <= 760;
  const worldWidth = 20;
  const worldHeight = (worldWidth * artwork.image.height) / artwork.image.width;
  const uniforms = {
    uArtwork: { value: artwork },
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uMotion: { value: 1 },
    uSelected: { value: BRANCHES.research.clone() },
    uPointer: { value: new THREE.Vector2() },
  };
  const artworkMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: artworkVertex,
    fragmentShader: artworkFragment,
    toneMapped: false,
  });
  const world = new THREE.Mesh(
    new THREE.PlaneGeometry(worldWidth, worldHeight, 20, 30),
    artworkMaterial,
  );
  scene.add(world);

  // These cloud layers occupy separate depths; the connected world never changes images.
  const cloudTexture = mistTexture(random);
  const clouds = [];
  const cloudPositions = [
    [-6.5, 9, 0.8, 13, 2.3],
    [5.8, 6.4, 1.1, 9, 1.8],
    [-7, 2.0, 1.8, 13, 2.5],
    [7.7, -2.8, 0.9, 9, 2.1],
    [-5.8, -7.3, 1.4, 12, 2.8],
    [2.2, -13.4, 2.0, 13, 2.5],
  ];
  cloudPositions.forEach(([x, y, z, width, height], index) => {
    const material = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      color: 0xfff3d8,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      toneMapped: false,
    });
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      material,
    );
    cloud.position.set(x, y, z);
    cloud.userData.baseX = x;
    cloud.userData.baseY = y;
    cloud.userData.phase = index * 1.8;
    cloud.userData.speed = 0.12 + (index % 3) * 0.035;
    clouds.push(cloud);
    scene.add(cloud);
  });
  const waterfalls = createWaterfallEffects({
    scene,
    worldWidth,
    worldHeight,
    random,
    mobile,
    cloudTexture,
  });
  const pointTexture = glowTexture();
  const flyCount = mobile ? 30 : 56;
  const flyPositions = new Float32Array(flyCount * 3);
  const flyOrigins = [];
  for (let index = 0; index < flyCount; index += 1) {
    const uv = Object.values(BRANCHES)[index % 4];
    const point = [
      (uv.x - 0.5) * worldWidth + (random() - 0.5) * 3.4,
      (uv.y - 0.5) * worldHeight + (random() - 0.5) * 3.8,
      0.18 + random() * 1.2,
    ];
    flyOrigins.push(point);
    flyPositions.set(point, index * 3);
  }
  const flyGeometry = new THREE.BufferGeometry();
  flyGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(flyPositions, 3),
  );
  const flyMaterial = new THREE.PointsMaterial({
    map: pointTexture,
    color: 0xffcb71,
    size: 0.06,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  scene.add(new THREE.Points(flyGeometry, flyMaterial));
  const starCount = mobile ? 35 : 70;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions.set(
      [-9.7 + random() * 7.3, -14 + random() * 28, 0.12 + random() * 0.35],
      index * 3,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3),
  );
  const starMaterial = new THREE.PointsMaterial({
    map: pointTexture,
    color: 0xc9e0ff,
    size: 0.025,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  let progress = 0;
  let selected = "research";
  let hovered = null;
  let reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let visible = true;
  let disposed = false;
  let failed = false;
  let width = 1;
  let height = 1;
  let frame = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let rendered = false;
  let hoverTime = 0;
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const dayMist = new THREE.Color(0xfff3d8);
  const nightMist = new THREE.Color(0x718eab);

  function positionCamera() {
    const aspect = width / height;
    const viewHeight =
      width <= 760 ? Math.min(20, worldWidth / aspect) : worldWidth / aspect;
    const safeHeight = Math.min(worldHeight * 0.88, viewHeight);
    const viewWidth = safeHeight * aspect;
    const travel = Math.max(0, (worldHeight - safeHeight) / 2);
    const p = progress;
    const y = travel * (1 - p * 2);
    const maxX = Math.max(0, (worldWidth - viewWidth) / 2);
    const focusPoints = [0.73, 0.63, 0.4, 0.49, 0.73, 0.8];
    const segment = Math.min(4, Math.floor(p * 5));
    const focus = THREE.MathUtils.lerp(
      focusPoints[segment],
      focusPoints[segment + 1],
      smooth(p * 5 - segment),
    );
    const x = clamp((focus - 0.5) * worldWidth, -maxX, maxX);
    const z =
      safeHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const driftX = reducedMotion ? 0 : uniforms.uPointer.value.x * 0.018;
    const cameraX = clamp(x + driftX, -maxX, maxX);
    camera.position.set(cameraX, y, z);
    camera.lookAt(cameraX, y, 0);
  }

  function draw(now = performance.now()) {
    if (disposed || failed || !visible || document.hidden) return;
    const delta = Math.min((now - lastFrame) / 1000 || 0, 0.08);
    lastFrame = now;
    if (!reducedMotion) elapsed += delta;
    uniforms.uTime.value = elapsed;
    uniforms.uProgress.value = progress;
    uniforms.uMotion.value = reducedMotion ? 0 : 1;
    uniforms.uSelected.value.copy(BRANCHES[hovered || selected]);
    positionCamera();
    const night = smooth(clamp((progress - 0.4) / 0.6, 0, 1));
    clouds.forEach((cloud) => {
      cloud.position.x =
        cloud.userData.baseX +
        Math.sin(elapsed * cloud.userData.speed + cloud.userData.phase) * 1.65;
      cloud.position.y =
        cloud.userData.baseY +
        Math.sin(elapsed * 0.11 + cloud.userData.phase) * 0.13;
      cloud.scale.set(
        1 + Math.sin(elapsed * 0.09 + cloud.userData.phase) * 0.045,
        1 + Math.cos(elapsed * 0.14 + cloud.userData.phase) * 0.1,
        1,
      );
      cloud.material.color.copy(dayMist).lerp(nightMist, night);
      cloud.material.opacity =
        0.43 -
        night * 0.07 +
        Math.sin(elapsed * 0.26 + cloud.userData.phase) * 0.055;
    });
    waterfalls.update(elapsed, night);
    flyMaterial.opacity = 0.32 + night * 0.34;
    starMaterial.opacity = night * 0.32;
    if (!reducedMotion) {
      flyOrigins.forEach((point, index) => {
        flyPositions[index * 3] =
          point[0] + Math.sin(elapsed * 0.43 + index * 1.7) * 0.25;
        flyPositions[index * 3 + 1] =
          point[1] + Math.cos(elapsed * 0.31 + index) * 0.29;
      });
      flyGeometry.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
    if (!rendered) {
      rendered = true;
      onReady();
    }
  }
  function tick(now) {
    frame = 0;
    if (disposed || failed || !visible || document.hidden || reducedMotion)
      return;
    if (now - lastFrame >= 1000 / 30) draw(now);
    frame = requestAnimationFrame(tick);
  }
  function requestDraw() {
    if (disposed || failed || !visible || document.hidden) return;
    draw();
    if (!reducedMotion && !frame) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const bounds = container.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    requestDraw();
  }
  function hitBranch(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(world, false)[0];
    if (!hit?.uv) return null;
    let closest = null;
    let distance = Infinity;
    for (const [id, uv] of Object.entries(BRANCHES)) {
      const dx = (hit.uv.x - uv.x) * worldWidth;
      const dy = (hit.uv.y - uv.y) * worldHeight;
      const current = Math.hypot(dx, dy);
      if (current < distance) {
        closest = id;
        distance = current;
      }
    }
    return distance < 2.3 ? closest : null;
  }
  function click(event) {
    const id = hitBranch(event);
    if (!id) return;
    selected = id;
    onSelect(id);
    requestDraw();
  }
  function move(event) {
    if (!visible || event.pointerType === "touch") return;
    const bounds = renderer.domElement.getBoundingClientRect();
    if (!reducedMotion)
      uniforms.uPointer.value.set(
        (event.clientX - bounds.left) / bounds.width - 0.5,
        (event.clientY - bounds.top) / bounds.height - 0.5,
      );
    if (performance.now() - hoverTime < 120) return;
    hoverTime = performance.now();
    const next = hitBranch(event);
    renderer.domElement.style.cursor = next ? "pointer" : "";
    if (hovered !== next) {
      hovered = next;
      requestDraw();
    }
  }
  function leave() {
    hovered = null;
    uniforms.uPointer.value.set(0, 0);
    renderer.domElement.style.cursor = "";
    requestDraw();
  }
  function visibilityChange() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden) {
      lastFrame = performance.now();
      requestDraw();
    }
  }
  function contextLost(event) {
    event.preventDefault();
    failed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    onFallback(
      new Error("WebGL context lost; the illustration remains available."),
    );
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  renderer.domElement.addEventListener("click", click);
  renderer.domElement.addEventListener("pointermove", move, { passive: true });
  renderer.domElement.addEventListener("pointerleave", leave);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", visibilityChange);
  resize();
  return {
    setProgress(value) {
      progress = clamp(Number(value) || 0, 0, 1);
      requestDraw();
    },
    setBranch(id) {
      if (BRANCHES[id]) {
        selected = id;
        requestDraw();
      }
    },
    setReducedMotion(value) {
      reducedMotion = Boolean(value);
      cancelAnimationFrame(frame);
      frame = 0;
      uniforms.uPointer.value.set(0, 0);
      lastFrame = performance.now();
      requestDraw();
    },
    setVisible(value) {
      visible = Boolean(value);
      cancelAnimationFrame(frame);
      frame = 0;
      if (visible) {
        lastFrame = performance.now();
        requestDraw();
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("click", click);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerleave", leave);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", visibilityChange);
      disposeScene(scene);
      artwork.dispose();
      cloudTexture.dispose();
      pointTexture.dispose();
      waterfalls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
