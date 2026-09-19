/**
 * main.js — sahna, yorug'lik, kamera xoreografiyasi va animatsiya taymlayni.
 *
 * Kutish: avval assets/gerb.png yuklanadi, keyin kitob quriladi,
 * oxirida ilk kadr chizilib loader o'chiriladi.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Book, DIM } from './book.js';
import * as TX from './textures.js';

const PAGES = 5;
const BOOK_TITLE = 'ЖИНОЯТ КОДЕКСИ';

/* ------------------------------------------------------------------ */
/* yordamchilar                                                        */
/* ------------------------------------------------------------------ */

const D2R = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (x) => {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const proposeTitle = () => new Promise((res) => setTimeout(res, 0));

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/* ------------------------------------------------------------------ */
/* renderer / sahna                                                    */
/* ------------------------------------------------------------------ */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = TX.backgroundTexture(64, 512, '#1c2a24', '#101720', '#05070a');

/* muhit xaritasi */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(-1.6, 1.7, 3.6);

/* ------------------------------------------------------------------ */
/* yorug'lik                                                           */
/* ------------------------------------------------------------------ */

const keyLight = new THREE.DirectionalLight(0xfff2dc, 2.6);
keyLight.position.set(2.1, 4.4, 2.6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -2.4;
keyLight.shadow.camera.right = 2.4;
keyLight.shadow.camera.top = 2.8;
keyLight.shadow.camera.bottom = -2.8;
keyLight.shadow.camera.near = 1.2;
keyLight.shadow.camera.far = 12;
keyLight.shadow.bias = -0.0007;
keyLight.shadow.normalBias = 0.012;
keyLight.shadow.radius = 2.4;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xa8c8ff, 1.15);
rimLight.position.set(-3.2, 2.2, -2.8);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffd9b0, 0.5);
fillLight.position.set(-1.6, 1.1, 3.0);
scene.add(fillLight);

const topGlow = new THREE.PointLight(0xffe6c0, 4.2, 6, 2);
topGlow.position.set(0.35, 2.7, 0.4);
scene.add(topGlow);

/* ------------------------------------------------------------------ */
/* zamin: faqat soya                                                   */
/* ------------------------------------------------------------------ */

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.55, transparent: true })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const contact = new THREE.Mesh(
  new THREE.PlaneGeometry(3.6, 3.6),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    alphaMap: TX.radialFadeTexture(512, 0.2, 1.4),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })
);
contact.rotation.x = -Math.PI / 2;
contact.position.y = 0.0012;
scene.add(contact);

/* ------------------------------------------------------------------ */
/* post-processing                                                     */
/* ------------------------------------------------------------------ */

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.24, 0.7, 0.82
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------------ */
/* kamera                                                              */
/* ------------------------------------------------------------------ */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 1.5;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minPolarAngle = 0.1;
controls.enablePan = false;
controls.target.set(0, 0.14, 0);
// Doim yoqilgan lekin faqat foydalanuvchi tegganda update() chaqiriladi —
// shu orqali kinematik kamera va qo'lda boshqaruv birga ishlaydi.

const clock = new THREE.Clock();
let userActive = false;
let lastTouch = -10;
let blend = 1;
const userPos = new THREE.Vector3();
const userTarget = new THREE.Vector3();

/** Kamera kalit kadrlari: radius, azimut°, balandlik, nishon Y. */
const CAM_KEYS = [
  { t: 0.0,  r: 4.15, az: -30, y: 1.55, ty: 0.12 },
  { t: 3.0,  r: 4.70, az: -24, y: 1.88, ty: 0.13 },
  { t: 6.2,  r: 3.70, az: 2,   y: 2.34, ty: 0.17 },
  { t: 9.6,  r: 3.40, az: 10,  y: 2.46, ty: 0.17 },
  { t: 13.0, r: 3.35, az: 4,   y: 2.28, ty: 0.16 },
  { t: 16.6, r: 3.65, az: -6,  y: 1.98, ty: 0.14 },
  { t: 18.8, r: 4.35, az: -22, y: 1.62, ty: 0.12 },
  { t: 22.6, r: 4.15, az: -30, y: 1.55, ty: 0.12 },
];

const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

function camAt(t, outPos, outTarget) {
  let i = 0;
  while (i < CAM_KEYS.length - 2 && t > CAM_KEYS[i + 1].t) i++;
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[i + 1];
  const k = smoothstep((t - a.t) / Math.max(0.0001, b.t - a.t));

  const r = lerp(a.r, b.r, k) + 0.05 * Math.sin(t * 0.37);
  const az = (lerp(a.az, b.az, k) + 1.1 * Math.sin(t * 0.23)) * D2R;
  const y = lerp(a.y, b.y, k) + 0.018 * Math.sin(t * 0.31);
  const ty = lerp(a.ty, b.ty, k);

  outTarget.set(0, ty, 0);
  outPos.set(outTarget.x + r * Math.sin(az), y, outTarget.z + r * Math.cos(az));
}

/* ------------------------------------------------------------------ */
/* animatsiya taymlayni                                                */
/* ------------------------------------------------------------------ */

const PH = {
  intro: 3.0,
  open: 3.2,
  flip: 6.6,
  hold: 1.0,
  riffle: 2.6,
  close: 3.0,
  rest: 3.2,
};
PH.TOTAL = PH.intro + PH.open + PH.flip + PH.hold + PH.riffle + PH.close + PH.rest;

const FLIP_DUR = 1.7;
const FLIP_STEP = (PH.flip - FLIP_DUR) / (PAGES - 1);
const RIFFLE_DUR = 1.05;
const RIFFLE_STEP = (PH.riffle - RIFFLE_DUR) / (PAGES - 1);

const pageProgress = (k) => smoothstep(k);

function timelineState(t) {
  const out = { cover: 0, pages: new Array(PAGES).fill(0) };
  let cur = t;

  if (cur < PH.intro) return out;
  cur -= PH.intro;

  if (cur < PH.open) {
    const k = cur / PH.open;
    let e = easeInOutCubic(k);
    if (k > 0.86) e += 0.014 * Math.sin((k - 0.86) * 62) * (1 - (k - 0.86) / 0.14);
    out.cover = clamp(e, -0.02, 1.02);
    return out;
  }
  cur -= PH.open;
  out.cover = 1;

  if (cur < PH.flip) {
    for (let i = 0; i < PAGES; i++) {
      out.pages[i] = clamp(pageProgress((cur - i * FLIP_STEP) / FLIP_DUR), 0, 1);
    }
    return out;
  }
  cur -= PH.flip;
  out.pages.fill(1);

  if (cur < PH.hold) return out;
  cur -= PH.hold;

  if (cur < PH.riffle) {
    for (let i = 0; i < PAGES; i++) {
      const idx = PAGES - 1 - i;
      out.pages[idx] = clamp(1 - pageProgress((cur - i * RIFFLE_STEP) / RIFFLE_DUR), 0, 1);
    }
    return out;
  }
  cur -= PH.riffle;
  out.pages.fill(0);

  if (cur < PH.close) {
    const k = cur / PH.close;
    let e = easeInOutCubic(k);
    if (k > 0.88) e += 0.012 * Math.sin((k - 0.88) * 58) * (1 - (k - 0.88) / 0.12);
    out.cover = clamp(1 - e, 0, 1.02);
    return out;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* boshqarish holatlari                                                */
/* ------------------------------------------------------------------ */

const ui = {
  mode: 'auto',
  coverTarget: 0,
  pageTargets: new Array(PAGES).fill(0),
  cursor: 0,
  appliedCover: 0,
  appliedPages: new Array(PAGES).fill(0),
};

const state = { cover: 0, pages: new Array(PAGES).fill(0), pile: 0 };
let tl = 0;
let book = null;

const hint = document.getElementById('hint');
const status = document.getElementById('status');
const setStatus = (s) => {
  status.textContent = s;
  status.style.opacity = s ? '1' : '0';
};

function setMode(m) {
  ui.mode = m;
  ui.appliedCover = state.cover;
  for (let i = 0; i < PAGES; i++) ui.appliedPages[i] = state.pages[i];
  if (m === 'auto') tl = 0;
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.mode === m);
  });
  hint.textContent = m === 'auto'
    ? 'Kitob o‘zi ochiladi, varaqlanadi va yopiladi.'
    : 'Varaqlash: ◀ ▶ tugmalari · Aylantirish: sichqoncha bilan torting';
}

/* ------------------------------------------------------------------ */
/* asosiy tsikl                                                        */
/* ------------------------------------------------------------------ */

let frameAcc = 0, frameCount = 0, quality = 2;

function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.getElapsedTime();

  frameAcc += dt; frameCount++;
  if (frameAcc > 2.5) {
    const avg = (frameAcc / frameCount) * 1000;
    if (avg > 34 && quality === 2) {
      quality = 1;
      renderer.setPixelRatio(1);
      composer.setPixelRatio(1);
      bloom.enabled = false;
    }
    frameAcc = 0; frameCount = 0;
  }

  if (ui.mode === 'auto') {
    tl = (tl + dt) % PH.TOTAL;
    const want = timelineState(tl);
    state.cover = want.cover;
    for (let i = 0; i < PAGES; i++) state.pages[i] = want.pages[i];
  } else {
    const rateC = 1 - Math.exp(-dt * 3.4);
    const rateP = 1 - Math.exp(-dt * 2.8);
    ui.appliedCover += (ui.coverTarget - ui.appliedCover) * rateC;
    for (let i = 0; i < PAGES; i++) {
      ui.appliedPages[i] += (ui.pageTargets[i] - ui.appliedPages[i]) * rateP;
    }
    state.cover = ui.appliedCover;
    for (let i = 0; i < PAGES; i++) state.pages[i] = ui.appliedPages[i];
  }

  /* kitobga qo'llash */
  let pile = 0;
  for (let i = 0; i < PAGES; i++) if (state.pages[i] > 0.74) pile++;
  state.pile = pile;
  book.setPile(pile);
  book.setCover(clamp(state.cover, 0, 1));
  for (let i = 0; i < PAGES; i++) book.setPage(i, clamp(state.pages[i], 0, 1));

  const T = ui.mode === 'auto' ? tl : elapsed;
  book.group.rotation.y = 0.13 * Math.sin(T * 0.19) + 0.022 * Math.sin(T * 0.53);
  book.group.rotation.z = 0.004 * Math.sin(T * 0.41);
  contact.position.x = -0.30 * state.cover;
  contact.scale.setScalar(1 + 0.22 * state.cover);

  /* kamera */
  if (userActive && elapsed - lastTouch > 4.0) {
    userActive = false;
    blend = 0;
  }

  camAt(ui.mode === 'auto' ? tl : Math.min(tl, 8), _camPos, _camTarget);

  if (userActive) {
    controls.update();
    userPos.copy(camera.position);
    userTarget.copy(controls.target);
    blend = Math.max(0, blend - dt / 1.4);
  } else if (blend < 1) {
    blend = Math.min(1, blend + dt / 1.8);
  }

  if (blend < 1) {
    camera.position.lerpVectors(userPos, _camPos, blend);
    controls.target.lerpVectors(userTarget, _camTarget, blend);
    camera.lookAt(controls.target);
  } else {
    camera.position.copy(_camPos);
    controls.target.copy(_camTarget);
    camera.lookAt(_camTarget);
  }

  keyLight.position.set(
    2.1 + 0.35 * Math.sin(elapsed * 0.21),
    4.4,
    2.6 + 0.35 * Math.cos(elapsed * 0.19)
  );
  topGlow.position.x = 0.35 + 0.2 * Math.sin(elapsed * 0.27);

  composer.render();
}

/* ------------------------------------------------------------------ */
/* hodisalar                                                           */
/* ------------------------------------------------------------------ */

document.querySelectorAll('[data-mode]').forEach((b) => {
  b.addEventListener('click', () => setMode(b.dataset.mode));
});

document.getElementById('btn-cover')?.addEventListener('click', () => {
  setMode('manual');
  ui.coverTarget = ui.coverTarget > 0.5 ? 0 : 1;
  if (ui.coverTarget === 0) {
    ui.cursor = 0;
    ui.pageTargets.fill(0);
  }
});

document.getElementById('btn-next')?.addEventListener('click', () => {
  setMode('manual');
  if (ui.cursor >= PAGES) return;
  ui.pageTargets[ui.cursor] = 1;
  ui.cursor++;
  ui.coverTarget = 1;
});

document.getElementById('btn-prev')?.addEventListener('click', () => {
  setMode('manual');
  if (ui.cursor <= 0) return;
  ui.cursor--;
  ui.pageTargets[ui.cursor] = 0;
});

document.getElementById('btn-replay')?.addEventListener('click', () => setMode('auto'));

const fileInput = document.getElementById('cover-file');
document.getElementById('btn-cover-image')?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!book) {
    setStatus('Sahna hali tayyor emas…');
    setTimeout(() => fileInput.click(), 400);
    return;
  }
  setStatus('Muqova rasmi yuklanmoqda…');
  const url = URL.createObjectURL(f);
  new THREE.TextureLoader().load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    book.setCoverTexture(tex, { aspect: (tex.image.width || 1) / (tex.image.height || 1) });
    book.tintSpine(TX.averageColor(tex));
    setStatus('');
    URL.revokeObjectURL(url);
  }, undefined, () => setStatus('Rasmni o‘qib bo‘lmadi'));
});

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
});

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    setMode('auto');
  } else if (e.key === 'ArrowRight') document.getElementById('btn-next')?.click();
  else if (e.key === 'ArrowLeft') document.getElementById('btn-prev')?.click();
});

controls.addEventListener('start', () => {
  userActive = true;
  lastTouch = clock.getElapsedTime();
});
controls.addEventListener('change', () => {
  userPos.copy(camera.position);
  userTarget.copy(controls.target);
  lastTouch = clock.getElapsedTime();
});

/* ------------------------------------------------------------------ */
/* ishga tushirish (gerb yuklanganida kitob quriladi)                  */
/* ------------------------------------------------------------------ */

async function init() {
  let gerb = null;
  try {
    gerb = await loadImage('assets/gerb.png');
  } catch {
    console.warn('assets/gerb.png topilmadi — muqovasiz gerb bilan davom etiladi');
  }

  book = new Book({ title: BOOK_TITLE, gerbImage: gerb });
  book.group.position.y = 0.0005;
  scene.add(book.group);

  /* assets/ ichida haqiqiy muqova rasmi bo'lsa — uni ishlatamiz */
  const CANDIDATES = ['assets/cover.png', 'assets/cover.jpg', 'assets/cover.jpeg', 'assets/cover.webp'];
  (function tryCover(i) {
    if (i >= CANDIDATES.length) return;
    new THREE.TextureLoader().load(CANDIDATES[i], (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      book.setCoverTexture(tex, { aspect: (tex.image.width || 1) / (tex.image.height || 1) });
      book.tintSpine(TX.averageColor(tex));
    }, undefined, () => tryCover(i + 1));
  })(0);

  setMode('auto');
  renderer.setAnimationLoop(tick);

  // ilk kadrlar chizilgach loader'ni o'chiramiz
  await proposeTitle();
  await proposeTitle();
  document.getElementById('loader')?.classList.add('is-hidden');
  console.log(
    `%c3D kitob: ${BOOK_TITLE} · ${PAGES} varaq`,
    'color:#d9b36c;font-weight:600'
  );
}

init();
