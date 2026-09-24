/*
  L'île : le monde 3D du portfolio (Three.js).
  Chaque bâtiment correspond à une section. En faisant défiler la page, la caméra
  survole l'île de bâtiment en bâtiment, et le ciel passe du coucher de soleil à la nuit.

  Performance :
  - 60 images par seconde maximum, pause quand l'onglet est caché ou qu'une fenêtre recouvre la page
  - qualité adaptative (résolution, ombres, nuages) si l'appareil peine
  - lumières et effets lumineux calculés dans des shaders simples, sans post-traitement
*/
(function () {
  "use strict";

  var root = document.documentElement;
  var THREE = window.THREE;
  var canvas = document.querySelector(".world");
  if (!THREE || !canvas) { root.classList.add("no-webgl"); return; }

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var MOBILE = window.matchMedia("(max-width: 900px)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !MOBILE, powerPreference: "high-performance" });
  } catch (e) { root.classList.add("no-webgl"); return; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 220);

  /* ---------------------------------------------------------------
     Petits outils
  --------------------------------------------------------------- */
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function col(hex) { return new THREE.Color(hex); }

  function roundedRect(w, d, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    r = Math.min(r, w / 2, d / 2);
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  /* Bloc aux arêtes arrondies (aspect « argile »), base posée en y = 0 */
  function rbox(w, h, d, r, b) {
    b = b == null ? Math.min(0.06, h / 4) : b;
    var g = new THREE.ExtrudeGeometry(roundedRect(Math.max(0.01, w - 2 * b), Math.max(0.01, d - 2 * b), r), {
      depth: Math.max(0.01, h - 2 * b), bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 3, curveSegments: 6
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, b, 0);
    return g;
  }
  function mesh(geo, mat, x, y, z, parent) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    (parent || island).add(m);
    return m;
  }

  /* ---------------------------------------------------------------
     Palettes : coucher de soleil (0) et nuit (1)
  --------------------------------------------------------------- */
  var DUSK = {
    top: col("#2a2d6c"), mid: col("#7a5592"), coral: col("#e3866f"), horizon: col("#f8c89e"), sunGlow: col("#ffd9b0"),
    fog: col("#e8a390"), sun: col("#ffd3a8"), sunI: 2.6, hemiSky: col("#ffd9c4"), hemiGround: col("#6b4466"), hemiI: 1.15,
    cloud: col("#ffe0d4"), windows: 0.9, glow: 1.0, stars: 0
  };
  var NIGHT = {
    top: col("#060a24"), mid: col("#161946"), coral: col("#2c2558"), horizon: col("#3d2f6b"), sunGlow: col("#5d6cd0"),
    fog: col("#241f4d"), sun: col("#9fb2ff"), sunI: 0.55, hemiSky: col("#5a67b8"), hemiGround: col("#140f2c"), hemiI: 0.6,
    cloud: col("#6a64a8"), windows: 2.6, glow: 1.6, stars: 1
  };
  var TOD = {
    top: new THREE.Color(), mid: new THREE.Color(), coral: new THREE.Color(), horizon: new THREE.Color(), sunGlow: new THREE.Color(),
    fog: new THREE.Color(), sun: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), cloud: new THREE.Color()
  };

  var COLORSPACE = "#include <tonemapping_fragment>\n#include <colorspace_fragment>";

  /* ---------------------------------------------------------------
     Ciel, étoiles, brume
  --------------------------------------------------------------- */
  var skyU = {
    uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uCoral: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSun: { value: new THREE.Color() }, uRes: { value: new THREE.Vector2(1, 1) }
  };
  var sky = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: [
      "uniform vec3 uTop, uMid, uCoral, uHorizon, uSun; uniform vec2 uRes; varying vec3 vDir;",
      "void main(){",
      "  vec2 q = gl_FragCoord.xy / uRes;",
      "  float y = q.y;",
      "  vec3 c = mix(uHorizon, uCoral, smoothstep(0.0, 0.38, y));",
      "  c = mix(c, uMid, smoothstep(0.34, 0.66, y));",
      "  c = mix(c, uTop, smoothstep(0.6, 1.0, y));",
      "  vec2 d = (q - vec2(0.12, 0.34)) * vec2(uRes.x / uRes.y, 1.0);",
      "  c += uSun * (exp(-dot(d, d) * 3.2) * 0.32);",
      "  gl_FragColor = vec4(c, 1.0);",
      COLORSPACE,
      "}"
    ].join("\n")
  }));
  scene.add(sky);

  var starGeo = new THREE.BufferGeometry(), starPos = [];
  for (var si = 0; si < 500; si++) {
    var th = rnd() * Math.PI * 2, ph = Math.acos(0.15 + rnd() * 0.85);
    starPos.push(Math.sin(ph) * Math.cos(th) * 110, Math.cos(ph) * 110, Math.sin(ph) * Math.sin(th) * 110);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  scene.add(new THREE.Points(starGeo, starMat));

  scene.fog = new THREE.Fog(0xe8a390, 30, 95);

  /* ---------------------------------------------------------------
     Lumières
  --------------------------------------------------------------- */
  var hemi = new THREE.HemisphereLight(0xffd9c4, 0x6b4466, 1.1);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffd3a8, 2.6);
  sun.position.set(-7, 9, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun);

  /* ---------------------------------------------------------------
     Matériaux
  --------------------------------------------------------------- */
  var M = {
    grass: new THREE.MeshStandardMaterial({ color: "#bdb28c", roughness: 0.95 }),
    earth: new THREE.MeshStandardMaterial({ color: "#a2604c", roughness: 1 }),
    rock: new THREE.MeshStandardMaterial({ color: "#7b4a44", roughness: 1, flatShading: true }),
    wall: new THREE.MeshStandardMaterial({ color: "#aa9dc2", roughness: 0.85 }),
    wall2: new THREE.MeshStandardMaterial({ color: "#968ab2", roughness: 0.85 }),
    roof: new THREE.MeshStandardMaterial({ color: "#6f6390", roughness: 0.8 }),
    cream: new THREE.MeshStandardMaterial({ color: "#f1e6d8", roughness: 0.75 }),
    coral: new THREE.MeshStandardMaterial({ color: "#e0776a", roughness: 0.7 }),
    dark: new THREE.MeshStandardMaterial({ color: "#3b3358", roughness: 0.6 }),
    stone: new THREE.MeshStandardMaterial({ color: "#c7bcd4", roughness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: "#f2b64a", roughness: 0.28, metalness: 0.65, emissive: "#6a3a00", emissiveIntensity: 0.25 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#7a5a4e", roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#8aa27a", roughness: 0.9, flatShading: true }),
    glassBox: new THREE.MeshStandardMaterial({ color: "#9fe9ff", roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false }),
    lantern: new THREE.MeshStandardMaterial({ color: "#bff8ff", emissive: "#7ff4ff", emissiveIntensity: 2.2, roughness: 0.3 }),
    window: new THREE.MeshStandardMaterial({ color: "#3a2f55", emissive: "#ffcf7a", emissiveIntensity: 0.9, roughness: 0.6 })
  };

  var island = new THREE.Group();
  scene.add(island);

  /* ---------------------------------------------------------------
     L'île : prairie, terre, roche
  --------------------------------------------------------------- */
  var IW = 9.6, ID = 7.8;
  var top = mesh(rbox(IW, 0.34, ID, 1.5, 0.12), M.grass, 0, -0.34, 0);
  top.castShadow = false;
  var earth = mesh(rbox(IW - 0.14, 1.0, ID - 0.14, 1.45, 0.1), M.earth, 0, -1.3, 0);
  earth.castShadow = false;

  var rockGeo = new THREE.ConeGeometry(4.6, 3.6, 12, 5);
  rockGeo.rotateX(Math.PI);
  var rp = rockGeo.attributes.position;
  for (var ri = 0; ri < rp.count; ri++) {
    var ry = rp.getY(ri);
    if (ry > 1.7) continue;
    rp.setX(ri, rp.getX(ri) * (0.9 + rnd() * 0.25));
    rp.setZ(ri, rp.getZ(ri) * (0.9 + rnd() * 0.25));
    rp.setY(ri, ry + (rnd() - 0.5) * 0.35);
  }
  rockGeo.computeVertexNormals();
  var rock = mesh(rockGeo, M.rock, 0, -3.1, 0);
  rock.scale.set(1.05, 1, 0.86);
  rock.castShadow = false;

  /* ---------------------------------------------------------------
     Fenêtres (une seule géométrie instanciée pour toute l'île)
  --------------------------------------------------------------- */
  var windowSpots = [];
  function addWindows(x0, y0, z0, w, h, d, rows, cols, faces) {
    faces.forEach(function (f) {
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var u = (c + 0.5) / cols - 0.5, v = y0 + h * ((r + 0.6) / (rows + 0.4));
        if (f === "z") windowSpots.push([x0 + u * w * 0.8, v, z0 + d / 2 + 0.012, 0]);
        if (f === "x") windowSpots.push([x0 + w / 2 + 0.012, v, z0 + u * d * 0.8, Math.PI / 2]);
      }
    });
  }

  /* ---------------------------------------------------------------
     Bâtiments (un par section)
  --------------------------------------------------------------- */
  var ANCHORS = {};

  /* Usine protégée par un bouclier : le stage et l'étude de cas */
  var PL = new THREE.Vector3(-2.35, 0, 1.0);
  mesh(rbox(1.7, 0.8, 1.15, 0.12), M.wall, PL.x, 0, PL.z);
  mesh(rbox(0.8, 1.15, 0.85, 0.1), M.wall2, PL.x + 0.6, 0, PL.z - 0.2);
  addWindows(PL.x, 0, PL.z, 1.7, 0.8, 1.15, 1, 4, ["z"]);
  addWindows(PL.x + 0.6, 0, PL.z - 0.2, 0.8, 1.15, 0.85, 2, 2, ["x"]);
  [[-0.45, 1.5], [-0.05, 1.2]].forEach(function (c) {
    mesh(new THREE.CylinderGeometry(0.13, 0.16, c[1], 16), M.cream, PL.x + c[0], c[1] / 2 + 0.5, PL.z - 0.25);
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16), M.coral, PL.x + c[0], c[1] + 0.35, PL.z - 0.25);
  });
  var shieldU = { uTime: { value: 0 }, uGlow: { value: 1 }, uColor: { value: col("#46ecff") } };
  var dome = new THREE.Mesh(new THREE.SphereGeometry(1.65, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: shieldU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
    vertexShader: [
      "varying vec3 vP; varying vec3 vN; varying vec3 vV;",
      "void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.0);",
      "  vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz);",
      "  gl_Position = projectionMatrix * viewMatrix * w; }"
    ].join("\n"),
    fragmentShader: [
      "uniform float uTime, uGlow; uniform vec3 uColor; varying vec3 vP; varying vec3 vN; varying vec3 vV;",
      "float hexD(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.732))), p.x); }",
      "void main(){",
      "  vec3 n = normalize(vP);",
      "  vec2 uv = vec2(atan(n.z, n.x) * 2.6, n.y * 5.0);",
      "  vec2 r = vec2(1.0, 1.732); vec2 h = r * 0.5;",
      "  vec2 a = mod(uv, r) - h; vec2 b = mod(uv - h, r) - h;",
      "  vec2 g = dot(a, a) < dot(b, b) ? a : b; vec2 id = uv - g;",
      "  float line = smoothstep(0.41, 0.49, hexD(g));",
      "  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);",
      "  float twinkle = 0.5 + 0.5 * sin(uTime * 1.6 + id.x * 3.1 + id.y * 1.7);",
      "  float band = smoothstep(0.12, 0.0, abs(fract(n.y * 0.9 - uTime * 0.16) - 0.5));",
      "  float a2 = clamp((line * (0.45 + 0.4 * twinkle) + fres * 0.55 + band * 0.2 + 0.07) * uGlow, 0.0, 0.95);",
      "  gl_FragColor = vec4(mix(uColor, vec3(1.0), line * 0.25), a2);",
      "#include <colorspace_fragment>",
      "}"
    ].join("\n")
  }));
  dome.position.copy(PL);
  dome.position.y = 0.02;
  island.add(dome);
  ANCHORS.plant = { pos: new THREE.Vector3(PL.x, 1.9, PL.z), ring: 1.75 };

  /* Phare : le profil */
  var LH = new THREE.Vector3(0.2, 0, -2.55);
  mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.26, 24), M.stone, LH.x, 0.13, LH.z);
  mesh(new THREE.CylinderGeometry(0.36, 0.52, 2.3, 24), M.cream, LH.x, 1.41, LH.z);
  mesh(new THREE.CylinderGeometry(0.44, 0.47, 0.22, 24), M.coral, LH.x, 1.1, LH.z);
  mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.07, 24), M.dark, LH.x, 2.6, LH.z);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 16), M.lantern, LH.x, 2.85, LH.z).castShadow = false;
  mesh(new THREE.ConeGeometry(0.4, 0.4, 16), M.roof, LH.x, 3.26, LH.z);
  mesh(rbox(0.3, 0.42, 0.06, 0.05, 0.02), M.dark, LH.x, 0.26, LH.z + 0.5);
  var beamU = { uGlow: { value: 1 }, uColor: { value: col("#7ff4ff") } };
  var beamGeo = new THREE.ConeGeometry(1.25, 7, 32, 1, true);
  beamGeo.translate(0, -3.5, 0);
  beamGeo.rotateZ(Math.PI / 2 + 0.06);
  var beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
    uniforms: beamU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: [
      "uniform float uGlow; uniform vec3 uColor; varying vec2 vUv;",
      "void main(){ float a = pow(vUv.y, 1.6) * 0.42 * uGlow * (0.6 + 0.4 * sin(vUv.x * 6.2831) * sin(vUv.x * 6.2831));",
      "  gl_FragColor = vec4(uColor, a);", "#include <colorspace_fragment>", "}"
    ].join("\n")
  }));
  var beamPivot = new THREE.Group();
  beamPivot.position.set(LH.x, 2.85, LH.z);
  beamPivot.add(beam);
  island.add(beamPivot);
  ANCHORS.lighthouse = { pos: new THREE.Vector3(LH.x, 3.6, LH.z), ring: 0.95 };

  /* Centre de données : les compétences */
  var DC = new THREE.Vector3(2.75, 0, -0.9);
  mesh(rbox(1.85, 0.12, 1.4, 0.1, 0.03), M.stone, DC.x, 0, DC.z);
  for (var rk = 0; rk < 4; rk++) mesh(rbox(0.26, 0.95, 1.05, 0.04, 0.02), M.dark, DC.x - 0.6 + rk * 0.4, 0.12, DC.z);
  var glassBox = new THREE.Mesh(rbox(1.8, 1.25, 1.35, 0.1, 0.04), M.glassBox);
  glassBox.position.set(DC.x, 0.12, DC.z);
  island.add(glassBox);
  var glassEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.8, 1.25, 1.35)), new THREE.LineBasicMaterial({ color: "#8ff6ff", transparent: true, opacity: 0.55 }));
  glassEdges.position.set(DC.x, 0.745, DC.z);
  island.add(glassEdges);
  mesh(rbox(1.9, 0.1, 1.45, 0.1, 0.03), M.roof, DC.x, 1.37, DC.z);
  var LED_N = 64;
  var leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.03, 0.012), new THREE.MeshBasicMaterial({ color: 0xffffff }), LED_N);
  var dummy = new THREE.Object3D();
  var LED_COLORS = [col("#7ff4ff"), col("#7dff9c"), col("#5b6bd8"), col("#ffcf7a")];
  for (var li = 0; li < LED_N; li++) {
    var rack = li % 4, row = Math.floor(li / 4) % 8, side = li < 32 ? 1 : -1;
    dummy.position.set(DC.x - 0.6 + rack * 0.4, 0.3 + row * 0.1, DC.z + side * 0.535);
    dummy.updateMatrix();
    leds.setMatrixAt(li, dummy.matrix);
    leds.setColorAt(li, LED_COLORS[(rnd() * 4) | 0]);
  }
  island.add(leds);
  ANCHORS.datacenter = { pos: new THREE.Vector3(DC.x, 1.8, DC.z), ring: 1.3 };

  /* Monument de certification : les certifications */
  var MO = new THREE.Vector3(0.55, 0, 0.1);
  mesh(rbox(0.95, 0.2, 0.95, 0.12, 0.05), M.stone, MO.x, 0, MO.z);
  mesh(rbox(0.7, 0.28, 0.7, 0.1, 0.05), M.stone, MO.x, 0.2, MO.z);
  var badge = new THREE.Group();
  badge.position.set(MO.x, 1.02, MO.z);
  var hexGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 6);
  hexGeo.rotateX(Math.PI / 2);
  var hx = new THREE.Mesh(hexGeo, M.gold); hx.castShadow = true; badge.add(hx);
  var hexIn = new THREE.CylinderGeometry(0.33, 0.33, 0.14, 6); hexIn.rotateX(Math.PI / 2);
  var hi = new THREE.Mesh(hexIn, new THREE.MeshStandardMaterial({ color: "#ffd98a", roughness: 0.35, metalness: 0.5, emissive: "#8a5200", emissiveIntensity: 0.3 }));
  badge.add(hi);
  var checkPts = [new THREE.Vector3(-0.15, 0.0, 0.09), new THREE.Vector3(-0.04, -0.11, 0.09), new THREE.Vector3(0.17, 0.12, 0.09)];
  var check = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(checkPts, false, "catmullrom", 0.01), 16, 0.028, 8), new THREE.MeshStandardMaterial({ color: "#6a3d00", roughness: 0.5 }));
  badge.add(check);
  island.add(badge);
  ANCHORS.monument = { pos: new THREE.Vector3(MO.x, 1.7, MO.z), ring: 0.85 };

  /* Quartier : les projets */
  var CT = new THREE.Vector3(1.0, 0, 2.45);
  [[-0.7, 0.25, 0.9, 0.85, 0.9, M.wall], [0.35, -0.15, 0.8, 1.25, 0.8, M.wall2], [1.25, 0.55, 0.7, 0.62, 0.7, M.wall]].forEach(function (b) {
    var x = CT.x + b[0], z = CT.z + b[1];
    mesh(rbox(b[2], b[3], b[4], 0.1), b[5], x, 0, z);
    mesh(rbox(b[2] * 0.4, 0.14, b[4] * 0.4, 0.05, 0.03), M.roof, x + b[2] * 0.18, b[3], z - b[4] * 0.15);
    addWindows(x, 0, z, b[2], b[3], b[4], b[3] > 1 ? 3 : 2, 2, ["z", "x"]);
  });
  ANCHORS.city = { pos: new THREE.Vector3(CT.x, 1.6, CT.z), ring: 1.55 };

  /* Campus : le parcours */
  var CA = new THREE.Vector3(-2.75, 0, -2.0);
  mesh(rbox(1.5, 0.72, 1.0, 0.1), M.cream, CA.x, 0, CA.z);
  var roofShape = new THREE.Shape();
  roofShape.moveTo(-0.82, 0); roofShape.lineTo(0.82, 0); roofShape.lineTo(0, 0.5); roofShape.lineTo(-0.82, 0);
  var roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1.1, bevelEnabled: false });
  roofGeo.translate(0, 0, -0.55);
  mesh(roofGeo, M.coral, CA.x, 0.72, CA.z);
  addWindows(CA.x, 0, CA.z, 1.5, 0.72, 1.0, 1, 4, ["z"]);
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), M.dark, CA.x + 0.95, 0.75, CA.z + 0.45);
  var flag = mesh(new THREE.PlaneGeometry(0.42, 0.26, 6, 1), new THREE.MeshStandardMaterial({ color: "#7ff4ff", side: THREE.DoubleSide, emissive: "#2a8a95", emissiveIntensity: 0.35 }), CA.x + 1.16, 1.36, CA.z + 0.45);
  var flagBase = flag.geometry.attributes.position.array.slice();
  ANCHORS.campus = { pos: new THREE.Vector3(CA.x, 1.7, CA.z), ring: 1.2 };

  /* Kiosque à musique : hors écran */
  var KI = new THREE.Vector3(3.3, 0, 1.9);
  mesh(new THREE.CylinderGeometry(0.66, 0.7, 0.12, 24), M.stone, KI.x, 0.06, KI.z);
  for (var ci = 0; ci < 6; ci++) {
    var ca = ci / 6 * Math.PI * 2;
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), M.cream, KI.x + Math.cos(ca) * 0.52, 0.47, KI.z + Math.sin(ca) * 0.52);
  }
  mesh(new THREE.ConeGeometry(0.8, 0.45, 6), M.coral, KI.x, 1.04, KI.z);
  mesh(rbox(0.42, 0.24, 0.2, 0.03, 0.02), M.dark, KI.x, 0.12, KI.z);
  mesh(rbox(0.4, 0.02, 0.07, 0.01, 0.005), M.cream, KI.x, 0.37, KI.z + 0.07);
  ANCHORS.kiosk = { pos: new THREE.Vector3(KI.x, 1.5, KI.z), ring: 0.95 };

  /* Antenne : le contact */
  var AN = new THREE.Vector3(-3.55, 0, -0.35);
  mesh(rbox(0.6, 0.14, 0.6, 0.08, 0.03), M.stone, AN.x, 0, AN.z);
  mesh(new THREE.CylinderGeometry(0.04, 0.11, 2.4, 8), M.cream, AN.x, 1.34, AN.z);
  for (var bi = 0; bi < 4; bi++) mesh(new THREE.BoxGeometry(0.34 - bi * 0.06, 0.03, 0.03), M.coral, AN.x, 0.6 + bi * 0.45, AN.z);
  var antennaLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: "#ff8a7a" }));
  antennaLight.position.set(AN.x, 2.6, AN.z);
  island.add(antennaLight);
  var signalRings = [];
  for (var sr = 0; sr < 3; sr++) {
    var ringM = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 48), new THREE.MeshBasicMaterial({ color: "#8ff6ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    ringM.position.set(AN.x, 2.6, AN.z);
    ringM.rotation.x = Math.PI / 2;
    island.add(ringM);
    signalRings.push(ringM);
  }
  ANCHORS.antenna = { pos: new THREE.Vector3(AN.x, 2.9, AN.z), ring: 0.8 };
  ANCHORS.overview = { pos: new THREE.Vector3(0.2, 0.8, 0.3), ring: 0 };

  /* Fenêtres instanciées */
  var winGeo = new THREE.PlaneGeometry(0.1, 0.14);
  var wins = new THREE.InstancedMesh(winGeo, M.window, windowSpots.length);
  windowSpots.forEach(function (w, i) {
    dummy.position.set(w[0], w[1], w[2]);
    dummy.rotation.set(0, w[3], 0);
    dummy.updateMatrix();
    wins.setMatrixAt(i, dummy.matrix);
  });
  dummy.rotation.set(0, 0, 0);
  island.add(wins);

  /* Arbres (instanciés) */
  var TREE_SPOTS = [
    [-4.0, -2.9], [-3.6, 2.6], [-1.0, -3.2], [-0.8, 0.1], [-0.4, 3.2], [1.9, -3.1], [3.9, -2.6], [4.1, 0.6],
    [-1.4, -1.6], [2.1, 0.9], [-4.1, 1.2], [3.8, 3.0], [-2.6, 3.3], [1.4, -1.9], [-1.1, 2.3], [4.2, -1.6]
  ];
  var trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.34, 6), M.trunk, TREE_SPOTS.length);
  var leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 1), M.leaf, TREE_SPOTS.length);
  trunks.castShadow = leaves.castShadow = true;
  TREE_SPOTS.forEach(function (t, i) {
    var s = 0.75 + rnd() * 0.55;
    dummy.position.set(t[0], 0.17 * s, t[1]); dummy.scale.set(s, s, s); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(t[0], 0.52 * s, t[1]); dummy.scale.set(s, s * 1.15, s); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, new THREE.Color().setHSL(0.27 + rnd() * 0.06, 0.2 + rnd() * 0.12, 0.52 + rnd() * 0.1));
  });
  dummy.scale.set(1, 1, 1);
  island.add(trunks, leaves);

  /* Drones autour du centre de données */
  var drones = [];
  for (var di = 0; di < 2; di++) {
    var dr = new THREE.Group();
    var body = new THREE.Mesh(rbox(0.22, 0.06, 0.22, 0.04, 0.02), M.dark); dr.add(body);
    for (var pa = 0; pa < 4; pa++) {
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 12), new THREE.MeshBasicMaterial({ color: "#d9d4ee", transparent: true, opacity: 0.6 }));
      arm.position.set((pa < 2 ? 1 : -1) * 0.14, 0.05, (pa % 2 ? 1 : -1) * 0.14);
      dr.add(arm);
    }
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: "#7ff4ff" }));
    eye.position.set(0, 0, 0.12); dr.add(eye);
    island.add(dr);
    drones.push({ g: dr, phase: di * 2.2, r: 1.5 + di * 0.4, h: 2.1 + di * 0.35 });
  }

  /* ---------------------------------------------------------------
     Rivières de lumière (réseau) et cascades
  --------------------------------------------------------------- */
  var flowMats = [];
  function flowMaterial(cA, cB, repeat, speed, alpha, additive) {
    var m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uGlow: { value: 1 }, uA: { value: col(cA) }, uB: { value: col(cB) }, uRepeat: { value: repeat }, uSpeed: { value: speed }, uAlpha: { value: alpha } },
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform float uTime, uGlow, uRepeat, uSpeed, uAlpha; uniform vec3 uA, uB; varying vec2 vUv;",
        "void main(){",
        "  float f = fract(vUv.x * uRepeat - uTime * uSpeed);",
        "  float dash = smoothstep(0.0, 0.2, f) * smoothstep(0.55, 0.2, f);",
        "  vec3 c = mix(uA, uB, 0.5 + 0.5 * sin(vUv.x * 6.0 + uTime * 0.5));",
        "  float a = clamp((uAlpha + dash * 0.85 * uAlpha * 2.0) * uGlow, 0.0, 1.0);",
        "  c = mix(c, vec3(1.0), dash * 0.25);",
        "  gl_FragColor = vec4(c, a);", "#include <colorspace_fragment>",
        "}"
      ].join("\n")
    });
    flowMats.push(m);
    return m;
  }
  function stream(points, radius, cA, cB, speed, core) {
    var curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
    var len = curve.getLength();
    var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, Math.round(len * 18)), radius, 8, false), flowMaterial(cA, cB, len * 1.1, speed, core * 1.6, false));
    var halo = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, Math.round(len * 10)), radius * 3.2, 8, false), flowMaterial(cA, cB, len * 1.1, speed, core * 0.14, true));
    island.add(tube, halo);
    return curve;
  }
  var Y = 0.03;
  function v(x, y, z) { return new THREE.Vector3(x, y, z); }
  var curves = [
    stream([v(DC.x - 0.9, Y, DC.z + 0.4), v(1.6, Y, 0.2), v(MO.x + 0.5, Y, MO.z + 0.2), v(-0.6, Y, 0.8), v(PL.x + 1.4, Y, PL.z + 0.3)], 0.045, "#38e8ff", "#9b7bff", 0.45, 0.35),
    stream([v(LH.x, Y, LH.z + 0.8), v(0.4, Y, -1.2), v(MO.x, Y, MO.z - 0.5)], 0.04, "#38e8ff", "#7ea4ff", 0.4, 0.32),
    stream([v(MO.x + 0.3, Y, MO.z + 0.5), v(0.9, Y, 1.4), v(CT.x - 0.2, Y, CT.z - 0.7)], 0.04, "#9b7bff", "#38e8ff", 0.5, 0.32),
    stream([v(CA.x + 0.8, Y, CA.z + 0.6), v(-1.6, Y, -0.9), v(-0.4, Y, -0.6), v(MO.x - 0.5, Y, MO.z - 0.2)], 0.04, "#7ea4ff", "#38e8ff", 0.4, 0.3),
    stream([v(AN.x + 0.4, Y, AN.z + 0.1), v(-2.9, Y, 0.3), v(PL.x - 0.3, Y, PL.z - 1.4)], 0.035, "#38e8ff", "#9b7bff", 0.45, 0.28),
    stream([v(KI.x - 0.6, Y, KI.z - 0.3), v(2.4, Y, 1.2), v(DC.x - 0.4, Y, DC.z + 0.75)], 0.035, "#9b7bff", "#38e8ff", 0.45, 0.28)
  ];
  /* Cascades de lumière qui tombent du bord avant de l'île */
  [[-0.9, 0.9], [0.55, 1.6], [2.2, 1.1]].forEach(function (w) {
    var x = w[0], z0 = ID / 2 - 0.05;
    stream([v(x, Y, z0 - 0.9), v(x, 0.0, z0 - 0.1), v(x, -0.35, z0 + 0.12), v(x + 0.05, -1.6, z0 + 0.32), v(x + 0.1, -3.6, z0 + 0.42), v(x + 0.12, -6.8, z0 + 0.46)], 0.07, "#4ceeff", "#9b7bff", 1.0 + w[1] * 0.2, 0.36);
  });

  /* Paquets de données qui circulent sur les rivières */
  function glowTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,0.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  var GLOW = glowTexture();
  var packets = [];
  curves.forEach(function (cv, ci2) {
    for (var k = 0; k < 3; k++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: ci2 % 2 ? "#b79bff" : "#9ff8ff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.set(0.22, 0.22, 0.22);
      island.add(sp);
      packets.push({ s: sp, c: cv, o: k / 3 + rnd() * 0.1, v: 0.05 + rnd() * 0.04 });
    }
  });

  /* Notes de musique qui s'échappent du kiosque */
  function noteTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var x = c.getContext("2d"); x.fillStyle = "#ffffff"; x.font = "48px serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("\u266A", 32, 34);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  var NOTE = noteTexture(), notes = [];
  for (var ni = 0; ni < 4; ni++) {
    var ns = new THREE.Sprite(new THREE.SpriteMaterial({ map: NOTE, color: "#ffe2c4", transparent: true, depthWrite: false, opacity: 0 }));
    ns.scale.set(0.22, 0.22, 0.22);
    island.add(ns);
    notes.push({ s: ns, o: ni / 4 });
  }

  /* Anneaux lumineux au sol (bâtiment actif ou survolé) */
  var rings = {};
  Object.keys(ANCHORS).forEach(function (k) {
    if (!ANCHORS[k].ring) return;
    var rm = new THREE.Mesh(new THREE.RingGeometry(ANCHORS[k].ring, ANCHORS[k].ring + 0.08, 64), new THREE.MeshBasicMaterial({ color: "#8ff6ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    rm.rotation.x = -Math.PI / 2;
    rm.position.set(ANCHORS[k].pos.x, 0.035, ANCHORS[k].pos.z);
    island.add(rm);
    rings[k] = { m: rm, o: 0 };
  });

  /* ---------------------------------------------------------------
     Nuages (sprites doux générés à la volée)
  --------------------------------------------------------------- */
  function cloudTexture() {
    var c = document.createElement("canvas"); c.width = 256; c.height = 160;
    var x = c.getContext("2d");
    for (var k = 0; k < 18; k++) {
      var r = 20 + rnd() * 22;
      var cx = r + 6 + rnd() * (256 - 2 * r - 12), cy = r + 18 + rnd() * Math.max(1, 160 - 2 * r - 30);
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.6, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    var sh = x.createLinearGradient(0, 40, 0, 160);
    sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(80,40,90,0.35)");
    x.globalCompositeOperation = "source-atop"; x.fillStyle = sh; x.fillRect(0, 0, 256, 160);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  var CLOUD_TEX = [cloudTexture(), cloudTexture(), cloudTexture()];
  var cloudGroup = new THREE.Group();
  scene.add(cloudGroup);
  var cloudMats = [];
  function addCloud(x, y, z, s) {
    var m = new THREE.SpriteMaterial({ map: CLOUD_TEX[(rnd() * 3) | 0], color: "#ffe0d4", transparent: true, depthWrite: false, opacity: 0.92, fog: false });
    cloudMats.push(m);
    var c = new THREE.Sprite(m);
    c.position.set(x, y, z);
    c.scale.set(s, s * 0.62, 1);
    cloudGroup.add(c);
    return c;
  }
  var cloudCount = MOBILE ? 14 : 26;
  for (var cl = 0; cl < cloudCount; cl++) {
    var ang = rnd() * Math.PI * 2, far = cl % 3 === 0;
    var rad = far ? 24 + rnd() * 22 : 6 + rnd() * 9;
    addCloud(Math.cos(ang) * rad, far ? -7 + rnd() * 6 : -6.2 + rnd() * 2.6, Math.sin(ang) * rad, far ? 16 + rnd() * 14 : 5 + rnd() * 5);
  }

  /* ---------------------------------------------------------------
     Caméra : un point de vue par section
  --------------------------------------------------------------- */
  /* Chaque point de vue : cible (t), angle horizontal (az), hauteur (el) et distance (d) */
  var STOPS = {
    overview:   { t: [0.2, -0.8, 0.2],    az: 0.66, el: 0.44, d: 23.0 },
    lighthouse: { t: [0.2, 1.25, -2.55],  az: 0.5,  el: 0.38, d: 9.4 },
    campus:     { t: [-2.75, 0.45, -2.0], az: 0.12, el: 0.62, d: 12.0 },
    plant:      { t: [-2.35, 0.55, 1.0],  az: 0.4,  el: 0.48, d: 10.2 },
    city:       { t: [1.0, 0.45, 2.45],   az: 0.8,  el: 0.5,  d: 9.4 },
    datacenter: { t: [2.75, 0.55, -0.9],  az: 1.1,  el: 0.44, d: 9.2 },
    monument:   { t: [0.55, 0.7, 0.1],    az: 0.62, el: 0.42, d: 8.4 },
    kiosk:      { t: [3.3, 0.45, 1.9],    az: 0.95, el: 0.42, d: 8.4 },
    antenna:    { t: [-0.4, -0.5, 0.1],   az: 0.5,  el: 0.46, d: 22.5 }
  };
  Object.keys(STOPS).forEach(function (k) {
    var S = STOPS[k];
    /* Sur mobile (écran étroit), plus de recul pour que l'île tienne dans la largeur */
    if (MOBILE) S.d *= (k === "overview" || k === "antenna") ? 1.3 : 1.15;
    S.t = new THREE.Vector3().fromArray(S.t);
    S.p = new THREE.Vector3(
      S.t.x + S.d * Math.cos(S.el) * Math.sin(S.az),
      S.t.y + S.d * Math.sin(S.el),
      S.t.z + S.d * Math.cos(S.el) * Math.cos(S.az)
    );
  });

  var sections = [], tops = [];
  function measure() {
    sections = Array.prototype.slice.call(document.querySelectorAll("[data-stop]")).filter(function (s) { return !s.hidden; });
    tops = sections.map(function (s) { return s.getBoundingClientRect().top + window.scrollY; });
  }

  var camPos = new THREE.Vector3(26, 20, 34), camTgt = new THREE.Vector3(0, 0, 0);
  var wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3();
  var activeStop = "overview", activeIndex = 0, progress = 0;
  var tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();

  function computeCamera() {
    var y = window.scrollY, vh = window.innerHeight;
    var n = sections.length;
    if (!n) { wantPos.copy(STOPS.overview.p); wantTgt.copy(STOPS.overview.t); return; }
    var i = n - 1, t = 0;
    for (var k = 0; k < n - 1; k++) {
      var start = tops[k + 1] - vh * 0.95, end = tops[k + 1] - vh * 0.25;
      if (y < start) { i = k; t = 0; break; }
      if (y < end) { i = k; t = smooth((y - start) / (end - start)); break; }
    }
    var a = STOPS[sections[i].getAttribute("data-stop")] || STOPS.overview;
    var b = sections[i + 1] ? (STOPS[sections[i + 1].getAttribute("data-stop")] || a) : a;
    wantPos.copy(a.p).lerp(b.p, t);
    wantPos.y += Math.sin(Math.PI * t) * 2.2;
    wantTgt.copy(a.t).lerp(b.t, t);
    var cur = t < 0.5 ? i : Math.min(i + 1, n - 1);
    activeIndex = cur;
    activeStop = sections[cur].getAttribute("data-stop");
    var max = document.documentElement.scrollHeight - vh;
    progress = max > 0 ? clamp(y / max, 0, 1) : 0;
  }

  /* ---------------------------------------------------------------
     Repères cliquables (HTML) au-dessus des bâtiments
  --------------------------------------------------------------- */
  var layer = document.querySelector(".hotspots");
  var spots = [];
  function buildHotspots() {
    if (!layer) return;
    layer.innerHTML = "";
    spots = [];
    measure();
    sections.forEach(function (s) {
      var stop = s.getAttribute("data-stop");
      if (!ANCHORS[stop] || stop === "overview" || spots.some(function (x) { return x.stop === stop; })) return;
      var label = s.getAttribute("data-label") || stop;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hotspot";
      b.innerHTML = '<span class="hotspot__dot"></span><span class="hotspot__label">' + label + "</span>";
      b.setAttribute("aria-label", "Aller à la section " + label);
      b.addEventListener("click", function () { if (window.SZScrollTo) window.SZScrollTo(s); else s.scrollIntoView({ behavior: "smooth" }); });
      b.addEventListener("pointerenter", function () { hover = stop; });
      b.addEventListener("pointerleave", function () { if (hover === stop) hover = null; });
      layer.appendChild(b);
      spots.push({ el: b, stop: stop, section: s });
    });
  }
  var proj = new THREE.Vector3();
  function updateHotspots() {
    if (!spots.length) return;
    var W = window.innerWidth, H = window.innerHeight;
    spots.forEach(function (sp) {
      proj.copy(ANCHORS[sp.stop].pos);
      island.localToWorld(proj);
      proj.project(camera);
      var vis = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
      var x = (proj.x * 0.5 + 0.5) * W, yy = (-proj.y * 0.5 + 0.5) * H;
      sp.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + yy.toFixed(1) + "px,0)";
      sp.el.classList.toggle("is-hidden", !vis);
      sp.el.classList.toggle("is-active", sp.stop === activeStop);
      sp.el.classList.toggle("is-hover", sp.stop === hover);
    });
  }

  /* Survol direct des bâtiments dans la 3D */
  var hover = null;
  var ray = new THREE.Raycaster();
  var pointerNDC = new THREE.Vector2(), pointerDirty = false;
  var pick = [];
  Object.keys(ANCHORS).forEach(function (k) {
    if (!ANCHORS[k].ring) return;
    var r = ANCHORS[k].ring;
    var box = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, ANCHORS[k].pos.y, r * 1.6), new THREE.MeshBasicMaterial({ visible: false }));
    box.position.set(ANCHORS[k].pos.x, ANCHORS[k].pos.y / 2, ANCHORS[k].pos.z);
    box.userData.stop = k;
    island.add(box);
    pick.push(box);
  });
  if (FINE) {
    canvas.addEventListener("pointermove", function (e) {
      pointerNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      pointerDirty = true;
    });
    canvas.addEventListener("pointerleave", function () { hover = null; canvas.style.cursor = ""; });
    canvas.addEventListener("click", function () {
      if (!hover) return;
      var sp = spots.filter(function (s) { return s.stop === hover; })[0];
      if (sp) sp.el.click();
    });
  }

  /* ---------------------------------------------------------------
     Taille, qualité adaptative
  --------------------------------------------------------------- */
  var LEVELS = [
    { px: 1.5, shadow: 2048, clouds: 1 },
    { px: 1.25, shadow: 1024, clouds: 1 },
    { px: 1.0, shadow: 0, clouds: 1 },
    { px: 0.8, shadow: 0, clouds: 0.6 }
  ];
  var level = MOBILE ? 2 : 0;
  function applyLevel() {
    var L = LEVELS[level];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, L.px));
    renderer.shadowMap.enabled = !!L.shadow;
    if (L.shadow) {
      sun.castShadow = true;
      if (sun.shadow.mapSize.x !== L.shadow) {
        sun.shadow.mapSize.set(L.shadow, L.shadow);
        if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      }
    } else {
      sun.castShadow = false;
    }
    scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; });
    cloudGroup.children.forEach(function (c, i) { c.visible = i < Math.ceil(cloudGroup.children.length * L.clouds); });
    resize();
  }
  function resize() {
    var W = window.innerWidth, H = window.innerHeight;
    renderer.setSize(W, H, false);
    renderer.getDrawingBufferSize(skyU.uRes.value);
    camera.aspect = W / H;
    if (W > 900) camera.setViewOffset(W, H, -W * 0.18, 0, W, H);
    else camera.setViewOffset(W, H, 0, H * 0.2, W, H);
    camera.fov = W > 900 ? 32 : 40;
    camera.updateProjectionMatrix();
    measure();
  }
  var rT = 0;
  window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(resize, 120); });

  /* ---------------------------------------------------------------
     Boucle
  --------------------------------------------------------------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  var t0 = performance.now(), last = t0, raf = 0, paused = false, ready = false;
  var perf = { acc: 0, n: 0, since: t0, warm: t0 + 3500 };
  var right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3();
  var introT = 0;
  var lastLed = 0;

  function frame(now) {
    raf = 0;
    if (paused || document.hidden) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 15.5) return;
    var dt = Math.min((now - last) / 1000, 0.05);

    if (now > perf.warm) {
      perf.acc += now - last; perf.n++;
      if (now - perf.since > 1500) {
        if (perf.acc / perf.n > 24 && level < LEVELS.length - 1) { level++; applyLevel(); perf.warm = now + 1500; }
        perf.acc = 0; perf.n = 0; perf.since = now;
      }
    } else perf.since = now;
    var realDt = (now - last) / 1000;
    last = now;
    var t = (now - t0) / 1000;
    var anim = REDUCED ? 0 : 1;

    /* Caméra */
    computeCamera();
    introT = Math.min((now - t0) / 2600, 1);
    var damp = 1 - Math.exp(-Math.min(realDt, 0.25) * (introT < 1 ? 1.6 : 3.2));
    camPos.lerp(wantPos, REDUCED ? 1 : damp);
    camTgt.lerp(wantTgt, REDUCED ? 1 : damp);
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);
    fwd.subVectors(camTgt, camPos).normalize();
    right.crossVectors(fwd, up).normalize();
    camera.position.copy(camPos).addScaledVector(right, mouse.x * 0.45 * anim).addScaledVector(up, -mouse.y * 0.3 * anim);
    camera.lookAt(camTgt);

    /* Heure du jour : coucher de soleil au début, nuit au contact */
    var tod = smooth((progress - 0.3) / 0.7);
    ["top", "mid", "coral", "horizon", "sunGlow", "fog", "sun", "hemiSky", "hemiGround", "cloud"].forEach(function (k) {
      TOD[k].copy(DUSK[k]).lerp(NIGHT[k], tod);
    });
    skyU.uTop.value.copy(TOD.top); skyU.uMid.value.copy(TOD.mid); skyU.uCoral.value.copy(TOD.coral); skyU.uHorizon.value.copy(TOD.horizon); skyU.uSun.value.copy(TOD.sunGlow);
    scene.fog.color.copy(TOD.fog);
    sun.color.copy(TOD.sun); sun.intensity = lerp(DUSK.sunI, NIGHT.sunI, tod);
    hemi.color.copy(TOD.hemiSky); hemi.groundColor.copy(TOD.hemiGround); hemi.intensity = lerp(DUSK.hemiI, NIGHT.hemiI, tod);
    starMat.opacity = tod;
    M.window.emissiveIntensity = lerp(DUSK.windows, NIGHT.windows, tod);
    var glow = lerp(DUSK.glow, NIGHT.glow, tod);
    cloudMats.forEach(function (m) { m.color.copy(TOD.cloud); });

    /* Animations de l'île */
    island.position.y = Math.sin(t * 0.6) * 0.08 * anim;
    cloudGroup.rotation.y = t * 0.006 * anim;
    beamPivot.rotation.y = t * 0.55 * anim;
    beamU.uGlow.value = glow;
    shieldU.uTime.value = t * anim;
    shieldU.uGlow.value = glow * (activeStop === "plant" || hover === "plant" ? 1.35 : 1);
    flowMats.forEach(function (m) { m.uniforms.uTime.value = t * anim; m.uniforms.uGlow.value = glow; });
    badge.rotation.y = Math.sin(t * 0.8) * 0.5 * anim;
    badge.position.y = 1.02 + Math.sin(t * 1.2) * 0.04 * anim;

    packets.forEach(function (p) {
      var u = ((t * p.v * anim + p.o) % 1 + 1) % 1;
      p.c.getPointAt(u, tmpA);
      p.s.position.set(tmpA.x, tmpA.y + 0.05, tmpA.z);
      p.s.material.opacity = Math.sin(u * Math.PI) * glow;
    });
    notes.forEach(function (nn, i) {
      var u = (t * 0.18 * anim + nn.o) % 1;
      nn.s.position.set(KI.x + Math.sin(u * 6 + i) * 0.25, 0.7 + u * 1.3, KI.z + Math.cos(u * 5 + i) * 0.2);
      nn.s.material.opacity = Math.sin(u * Math.PI) * 0.9;
    });
    drones.forEach(function (d) {
      var a = t * 0.35 * anim + d.phase;
      d.g.position.set(DC.x + Math.cos(a) * d.r, d.h + Math.sin(t * 1.3 + d.phase) * 0.1, DC.z + Math.sin(a) * d.r * 0.7);
      d.g.rotation.y = -a;
    });
    signalRings.forEach(function (r, i) {
      var u = ((t * 0.45 * anim + i / 3) % 1);
      var s = 1 + u * 3.2;
      r.scale.set(s, s, s);
      r.material.opacity = (1 - u) * 0.8 * glow;
    });
    antennaLight.material.color.setRGB(1, 0.54 + 0.3 * Math.sin(t * 3), 0.48);
    var fp = flag.geometry.attributes.position;
    for (var fi = 0; fi < fp.count; fi++) {
      var fx = flagBase[fi * 3];
      fp.array[fi * 3 + 2] = flagBase[fi * 3 + 2] + Math.sin(fx * 12 - t * 5) * 0.04 * (fx + 0.21) * anim;
    }
    fp.needsUpdate = true;

    if (now - lastLed > 140 && anim) {
      lastLed = now;
      for (var k = 0; k < 6; k++) leds.setColorAt((Math.random() * LED_N) | 0, LED_COLORS[(Math.random() * 4) | 0]);
      leds.instanceColor.needsUpdate = true;
    }

    /* Survol */
    if (pointerDirty) {
      pointerDirty = false;
      ray.setFromCamera(pointerNDC, camera);
      var hit = ray.intersectObjects(pick, false)[0];
      var h = hit ? hit.object.userData.stop : null;
      if (h !== hover) { hover = h; canvas.style.cursor = h ? "pointer" : ""; }
    }
    Object.keys(rings).forEach(function (k) {
      var r = rings[k];
      var want = k === hover ? 0.9 : (k === activeStop ? 0.55 : 0);
      r.o = lerp(r.o, want, 0.1);
      r.m.material.opacity = r.o * (0.75 + 0.25 * Math.sin(t * 3));
    });

    renderer.render(scene, camera);
    updateHotspots();

    if (!ready) {
      ready = true;
      root.classList.add("world-ready");
    }
  }

  function loop() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (!paused) { last = performance.now(); loop(); }
  });

  window.SZWorld = {
    refresh: function () { measure(); buildHotspots(); },
    setPaused: function (v) {
      paused = !!v;
      if (paused) stop();
      else { last = performance.now(); perf.warm = last + 1000; loop(); }
    }
  };

  applyLevel();
  buildHotspots();
  computeCamera();
  loop();
})();
