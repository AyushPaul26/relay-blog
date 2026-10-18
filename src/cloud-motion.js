import * as THREE from "./vendor/three.module.min.js";

// Artwork coordinates (1024 × 1536, origin at top left). The moving regions
// follow the actual sky and cloud banks; silhouettes are explicitly protected.
const CLOUD_BANKS = [
  [
    [-30, -30],
    [425, -30],
    [397, 45],
    [367, 80],
    [348, 112],
    [330, 142],
    [345, 181],
    [385, 202],
    [385, 222],
    [320, 236],
    [125, 242],
    [-30, 241],
  ],
  [
    [-20, 310],
    [160, 310],
    [240, 331],
    [330, 318],
    [420, 325],
    [442, 392],
    [450, 470],
    [423, 548],
    [370, 573],
    [260, 563],
    [166, 539],
    [64, 553],
    [-20, 554],
  ],
  [
    [-20, 550],
    [112, 554],
    [202, 572],
    [292, 557],
    [349, 583],
    [420, 572],
    [438, 596],
    [374, 647],
    [313, 681],
    [275, 718],
    [190, 724],
    [114, 770],
    [-20, 807],
  ],
  [
    [957, 414],
    [1045, 374],
    [1045, 1036],
    [934, 1016],
    [886, 1001],
    [887, 950],
    [929, 921],
    [961, 856],
    [981, 785],
    [969, 716],
    [974, 647],
    [954, 575],
  ],
  [
    [593, 679],
    [638, 687],
    [717, 675],
    [756, 708],
    [807, 725],
    [874, 718],
    [907, 772],
    [939, 822],
    [946, 881],
    [900, 956],
    [827, 1007],
    [743, 973],
    [665, 949],
    [601, 910],
    [572, 882],
    [579, 834],
    [601, 782],
  ],
  [
    [-20, 797],
    [70, 810],
    [97, 854],
    [104, 916],
    [162, 935],
    [181, 956],
    [110, 980],
    [63, 1010],
    [-20, 999],
  ],
  [
    [346, 1070],
    [426, 1078],
    [496, 1054],
    [566, 1048],
    [606, 1039],
    [625, 1090],
    [610, 1172],
    [598, 1246],
    [566, 1300],
    [524, 1342],
    [466, 1371],
    [408, 1375],
    [331, 1335],
    [274, 1263],
    [310, 1213],
    [365, 1175],
  ],
  [
    [-20, 1162],
    [24, 1176],
    [51, 1220],
    [105, 1244],
    [174, 1222],
    [230, 1233],
    [256, 1286],
    [190, 1348],
    [166, 1401],
    [221, 1435],
    [325, 1405],
    [347, 1455],
    [334, 1548],
    [-20, 1550],
  ],
  [
    [261, 1347],
    [316, 1342],
    [366, 1371],
    [387, 1421],
    [344, 1453],
    [295, 1446],
    [247, 1411],
  ],
];

// These contours stop advection at ridgelines, islands, and vegetation. They
// are deliberately a little wider than the painted silhouettes.
const STILL_SILHOUETTES = [
  // Small lower islands and the distant rocky river channel are scenery too,
  // even where their silhouettes sit entirely inside a broad bank of clouds.
  [
    [160, 1400],
    [345, 1400],
    [345, 1550],
    [160, 1550],
  ],
  [
    [350, 1048],
    [600, 1030],
    [604, 1115],
    [552, 1145],
    [525, 1171],
    [495, 1208],
    [454, 1214],
    [412, 1190],
    [366, 1180],
    [330, 1130],
  ],
  [
    [390, 1245],
    [405, 1235],
    [421, 1245],
    [430, 1260],
    [445, 1261],
    [467, 1290],
    [493, 1305],
    [500, 1332],
    [462, 1350],
    [414, 1350],
    [387, 1325],
  ],
  // Foreground canopy above the lower bridge, including its wispy leaves.
  [
    [560, 850],
    [650, 850],
    [740, 930],
    [840, 950],
    [920, 1040],
    [920, 1120],
    [560, 1120],
  ],
  [
    [995, 875],
    [1040, 850],
    [1040, 1040],
    [919, 1040],
    [931, 991],
    [957, 955],
    [980, 925],
  ],
  [
    [953, 596],
    [1040, 550],
    [1040, 790],
    [987, 809],
    [970, 750],
  ],
  [
    [16, 348],
    [39, 319],
    [61, 315],
    [84, 277],
    [101, 272],
    [119, 301],
    [131, 327],
    [140, 376],
    [129, 392],
    [87, 401],
    [35, 386],
  ],
  [
    [161, 431],
    [162, 388],
    [181, 356],
    [197, 344],
    [215, 355],
    [230, 386],
    [242, 441],
    [218, 455],
    [178, 460],
  ],
  [
    [87, 451],
    [94, 429],
    [109, 406],
    [122, 408],
    [135, 433],
    [151, 453],
  ],
  [
    [241, 354],
    [255, 329],
    [274, 308],
    [293, 310],
    [306, 287],
    [321, 279],
    [341, 302],
    [350, 341],
    [333, 366],
    [297, 374],
  ],
  [
    [324, 401],
    [342, 363],
    [355, 325],
    [370, 310],
    [385, 317],
    [400, 346],
    [417, 397],
    [402, 414],
    [361, 419],
  ],
  [
    [237, 436],
    [243, 416],
    [251, 406],
    [263, 430],
    [264, 444],
  ],
  [
    [300, 393],
    [308, 376],
    [320, 369],
    [331, 392],
  ],
  [
    [-10, 471],
    [19, 464],
    [41, 474],
    [56, 464],
    [80, 479],
    [101, 471],
    [126, 491],
    [154, 497],
    [154, 561],
    [139, 600],
    [96, 620],
    [56, 603],
    [48, 551],
    [-10, 530],
  ],
  [
    [155, 573],
    [167, 541],
    [182, 523],
    [194, 528],
    [204, 548],
    [219, 572],
    [216, 590],
    [173, 598],
  ],
  [
    [308, 551],
    [325, 509],
    [339, 485],
    [351, 476],
    [368, 482],
    [388, 524],
    [415, 544],
    [414, 567],
    [375, 587],
    [333, 584],
  ],
  [
    [-20, 731],
    [26, 682],
    [53, 652],
    [77, 640],
    [93, 653],
    [103, 685],
    [128, 696],
    [141, 719],
    [161, 694],
    [176, 653],
    [196, 625],
    [215, 612],
    [237, 622],
    [254, 650],
    [277, 681],
    [291, 714],
    [267, 736],
    [232, 735],
    [173, 755],
    [113, 786],
    [49, 789],
    [-20, 790],
  ],
  [
    [631, 754],
    [639, 716],
    [660, 680],
    [676, 668],
    [696, 681],
    [714, 711],
    [729, 748],
    [734, 774],
    [702, 789],
    [652, 777],
  ],
  [
    [585, 761],
    [597, 727],
    [612, 708],
    [625, 719],
    [635, 753],
    [623, 767],
  ],
  [
    [743, 803],
    [751, 778],
    [772, 760],
    [793, 753],
    [815, 764],
    [836, 779],
    [830, 815],
    [811, 840],
    [772, 850],
    [749, 830],
  ],
  [
    [740, 967],
    [749, 924],
    [764, 889],
    [779, 866],
    [793, 872],
    [802, 889],
    [815, 930],
    [831, 962],
    [811, 988],
    [770, 990],
  ],
  [
    [-10, 1107],
    [26, 1064],
    [58, 1029],
    [83, 1001],
    [107, 974],
    [134, 973],
    [159, 1007],
    [178, 1067],
    [181, 1122],
    [155, 1188],
    [115, 1209],
    [63, 1221],
    [10, 1208],
    [-10, 1174],
  ],
  [
    [159, 1163],
    [177, 1117],
    [201, 1087],
    [227, 1073],
    [248, 1095],
    [264, 1122],
    [292, 1151],
    [312, 1171],
    [304, 1216],
    [267, 1244],
    [212, 1240],
    [181, 1210],
  ],
  [
    [267, 1271],
    [284, 1231],
    [306, 1214],
    [324, 1208],
    [345, 1228],
    [363, 1251],
    [381, 1274],
    [377, 1307],
    [346, 1328],
    [305, 1322],
  ],
  [
    [178, 1321],
    [190, 1287],
    [210, 1265],
    [234, 1258],
    [264, 1271],
    [285, 1292],
    [295, 1324],
    [286, 1350],
    [257, 1379],
    [209, 1376],
    [181, 1353],
  ],
  [
    [-20, 1300],
    [12, 1281],
    [33, 1304],
    [46, 1357],
    [48, 1408],
    [18, 1433],
    [-20, 1413],
  ],
  [
    [43, 1389],
    [57, 1342],
    [75, 1322],
    [91, 1327],
    [106, 1363],
    [123, 1395],
    [117, 1415],
    [91, 1436],
    [64, 1424],
  ],
];

export function createCloudMask() {
  const silhouette = document.createElement("canvas");
  silhouette.width = 1024;
  silhouette.height = 1536;
  const ink = silhouette.getContext("2d");
  ink.fillStyle = "black";
  ink.fillRect(0, 0, 1024, 1536);
  function polygon(points, color) {
    ink.fillStyle = color;
    ink.beginPath();
    points.forEach(([x, y], index) =>
      index ? ink.lineTo(x, y) : ink.moveTo(x, y),
    );
    ink.closePath();
    ink.fill();
  }
  CLOUD_BANKS.forEach((points) => polygon(points, "white"));
  STILL_SILHOUETTES.forEach((points) => polygon(points, "black"));
  // Keep the sun itself fixed while the surrounding sky evolves.
  ink.fillStyle = "black";
  ink.beginPath();
  ink.ellipse(229, 249, 34, 18, 0, 0, Math.PI * 2);
  ink.fill();
  const hardMask = ink.getImageData(0, 0, 1024, 1536);
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.filter = "blur(9px)";
  context.drawImage(silhouette, 0, 0);
  context.filter = "none";
  const pixels = context.getImageData(0, 0, 1024, 1536);
  for (let index = 0; index < pixels.data.length; index += 4) {
    // Feather INWARD only: no blurred mask can spill onto a fixed mountain.
    const value = THREE.MathUtils.clamp(
      (pixels.data[index] / 255 - 0.52) / 0.46,
      0,
      1,
    );
    // Intersect with the original silhouette as well: blur can otherwise leak
    // into a narrow peak even when its outer boundary is feathered inward.
    const soft =
      hardMask.data[index] < 250 ? 0 : value * value * (3 - 2 * value);
    pixels.data[index] =
      pixels.data[index + 1] =
      pixels.data[index + 2] =
        soft * 255;
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

// Two overlapping advection phases let cloud details continuously travel in
// one direction. Crossfades conceal wrapping; masked source samples prevent
// rock or branch pixels being dragged into the clouds.
export const cloudMotionShader = `
  uniform sampler2D uCloudMask;
  float cloudMaskAt(vec2 uv) {
    // No clamped source pixels at the image boundary: those become streaks.
    float edge = smoothstep(0.0, 0.035, uv.x) * (1.0 - smoothstep(0.965, 1.0, uv.x));
    edge *= smoothstep(0.0, 0.012, uv.y) * (1.0 - smoothstep(0.988, 1.0, uv.y));
    return texture2D(uCloudMask, uv).r * edge;
  }
  vec4 movingClouds(vec2 uv) {
    vec4 still = texture2D(uArtwork, uv);
    float mask = cloudMaskAt(uv);
    if (mask < 0.001) return still;
    float sky = smoothstep(0.81, 0.88, uv.y);
    float speed = mix(0.071, 0.055, sky);
    float phaseA = fract(uTime * speed);
    float phaseB = fract(uTime * speed + 0.5);
    vec2 wind = vec2(mix(0.092, 0.11, sky), 0.006 * sin(uv.x * 9.0 + uv.y * 13.0));
    // Gentle uneven flow changes cloud contours without shaking the scene.
    vec2 curl = vec2(
      sin(uv.y * 35.0 + uTime * 0.24) * 0.0025,
      sin(uv.x * 27.0 + uTime * 0.29) * 0.0015
    );
    vec2 a = uv - wind * (phaseA - 0.5) + curl;
    vec2 b = uv - wind * (phaseB - 0.5) + curl;
    float safeA = cloudMaskAt(a);
    float safeB = cloudMaskAt(b);
    vec4 first = mix(still, texture2D(uArtwork, a), mask * safeA);
    vec4 second = mix(still, texture2D(uArtwork, b), mask * safeB);
    float blend = abs(phaseA * 2.0 - 1.0);
    return mix(first, second, blend);
  }
`;
