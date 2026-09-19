/**
 * test/render.mjs — Node'da (napi-rs/canvas orqali) teksturalarni
 * real chizib PNG ko'rsatish + 3D kitob geometriyasini tekshirish.
 *
 * Ishga tushirish: node test/render.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const require = createRequire(import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'preview');
fs.mkdirSync(OUT, { recursive: true });

/* --- DejaVu Serif'ni browser'dagi Georgia o'rniga ro'yxatdan o'tkazamiz --- */
for (const [fam, file] of [
  ['Georgia', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'],
  ['Georgia', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'],
  ['Times New Roman', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'],
]) {
  try { GlobalFonts.registerFromPath(file, fam); } catch { /* yordamchi */ }
}

/* --- minimal DOM: document.createElement('canvas') --- */
globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error('unsupported tag ' + tag);
    return createCanvas(1, 1);
  },
};
globalThis.window = globalThis;
globalThis.self = globalThis;

/* --- THREE + modullar --- */
const THREE = await import(path.join(ROOT, 'vendor/three/build/three.module.js'));
globalThis.THREE = THREE;
const TX = await import(path.join(ROOT, 'src/textures.js'));

/* --- gerb --- */
const gerb = await loadImage(path.join(ROOT, 'assets/gerb.png'));
console.log('gerb', gerb.width, 'x', gerb.height);

/* ------------------------------------------------------------------ */
/* 1) Muqova teksturalari                                             */
/* ------------------------------------------------------------------ */

const t0 = Date.now();
const cover = TX.lawCover({ gerbImage: gerb });
console.log('lawCover built in', Date.now() - t0, 'ms');

const save = (canvas, name) => {
  fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png'));
  console.log('  ->', name, canvas.width + 'x' + canvas.height);
};

save(cover.map.image, 'cover-color.png');
save(cover.metalnessMap.image, 'cover-metal.png');
save(cover.roughnessMap.image, 'cover-rough.png');
save(cover.normalMap.image, 'cover-normal.png');

/* ------------------------------------------------------------------ */
/* 2) Sahifa teksturalari                                             */
/* ------------------------------------------------------------------ */

const p1 = TX.lawPageTexture({ w: 512, h: 768, seed: 1, pageNumber: 12 });
const p2 = TX.lawPageTexture({ w: 512, h: 768, seed: 2, pageNumber: 14, runningHead: 'ЖИНОЯТ КОДЕКСИ' });
save(p1.image, 'page-1.png');
save(p2.image, 'page-2.png');

const edge = TX.pageEdgeTexture({});
save(edge.image, 'page-edge.png');

const paper = TX.paperTexture({});
save(paper.image, 'paper.png');

/* charm */
const leather = TX.leatherSet({ base: '#175032', size: 512, seed: 9, grain: 0.7 });
save(leather.map.image, 'leather.png');

/* ------------------------------------------------------------------ */
/* 2b) Umurtqa teksturasi                                             */
/* ------------------------------------------------------------------ */

const spine = TX.lawSpineTexture({ title: 'ЖИНОЯТ КОДЕКСИ' });
save(spine.map.image, 'spine.png');

/* ------------------------------------------------------------------ */
/* 3) Book 3D geometriya tekshiruvlari                                 */
/* ------------------------------------------------------------------ */

const { Book, DIM } = await import(path.join(ROOT, 'src/book.js'));

let book;
try {
  book = new Book({ title: 'ЖИНОЯТ КОДЕКСИ', gerbImage: gerb });
  console.log('\nBook built OK');
} catch (e) {
  console.error('Book build FAILED', e);
  process.exit(1);
}

const bb = (obj, world = true) => {
  const b = new THREE.Box3().setFromObject(obj);
  return {
    min: b.min.toArray().map((v) => +v.toFixed(4)),
    max: b.max.toArray().map((v) => +v.toFixed(4)),
  };
};

const { T, BOARD, SHEET, W, COV_W } = DIM;

// orqa muqova
book.group.updateMatrixWorld(true);
console.log('\nbackBoard bbox', bb(book.backBoard));
console.log('spine bbox   ', bb(book.spine));

book.setCover(0);
book.group.updateMatrixWorld(true);
console.log('\nsetCover(0): hinge y =', +book.coverGroup.position.y.toFixed(4),
  '(kutilgan', +(T - BOARD / 2).toFixed(4) + ')');
console.log('  frontBoard world X', bb(book.frontBoard).min[0], '→', bb(book.frontBoard).max[0],
  ' Y', bb(book.frontBoard).min[1], '→', bb(book.frontBoard).max[1]);

book.setCover(1);
book.group.updateMatrixWorld(true);
console.log('\nsetCover(1): hinge y =', +book.coverGroup.position.y.toFixed(4),
  '(kutilgan', +(BOARD * 1.5 + 0.0007).toFixed(4) + ', umurtqa tepasi', +(BOARD * 2).toFixed(3) + ')');
console.log('  frontBoard world X', bb(book.frontBoard).min[0], '→', bb(book.frontBoard).max[0],
  ' Y', bb(book.frontBoard).min[1], '→', bb(book.frontBoard).max[1]);
book.setCover(0);

// varaq bukilishi: yoy uzunligi saqlanishi kerak (~W)
function arcCheck(p) {
  book.setPage(0, p);
  const geo = book.pages[0].geo;
  const pos = geo.attributes.position.array;
  const cols = geo.userData.cols; // har ustunda rows=2 vertex, har vertex 3 komponent
  let len = 0;
  for (let i = 1; i < cols; i++) {
    const a = ((i - 1) * 2) * 3, b = (i * 2) * 3;
    len += Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1]);
  }
  return len;
}
console.log('\npage arc length (W =', W + '):');
for (const p of [0.1, 0.25, 0.5, 0.75, 0.9]) {
  const L = arcCheck(p);
  console.log(`  p=${p}: ${L.toFixed(4)} ${L <= W * 1.005 ? 'OK' : 'FAIL (> 0.5% cho\'zilgan)'}`);
}

// NaN tekshiruvi
let nan = 0;
book.group.traverse((o) => {
  if (o.geometry?.attributes?.position) {
    const arr = o.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) nan++;
  }
});
console.log('NaN vertex soni:', nan, nan === 0 ? 'OK' : 'FAIL');

// UV chegarasi (muqova)
{
  const uv = book.backBoard.geometry.attributes.uv;
  let mn = [1e9, 1e9], mx = [-1e9, -1e9];
  for (let i = 0; i < uv.count; i++) {
    mn[0] = Math.min(mn[0], uv.getX(i)); mx[0] = Math.max(mx[0], uv.getX(i));
    mn[1] = Math.min(mn[1], uv.getY(i)); mx[1] = Math.max(mx[1], uv.getY(i));
  }
  console.log('cuvar UV:', mn.map((v) => +v.toFixed(3)), '→', mx.map((v) => +v.toFixed(3)));
}

// gerb muqova kanvar qismiga joylashganmi — piksel tekshiruvi:
{
  const ctx = cover.map.image.getContext('2d');
  const cw = cover.map.image.width, ch = cover.map.image.height;
  // gerb markaziy joylashuvi: w/2, gerb y ~ 0.068h..0.25h
  const px = ctx.getImageData(cw / 2, 0.16 * ch, 1, 1).data;
  console.log('muqova markaz yuqori piksel RGBa:', Array.from(px), '(oltin-sariq bo\'lishi kerak)');
}

console.log('\nHammasi tayyor. preview/ papkaga qarang.');
