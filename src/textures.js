/**
 * textures.js — barcha teksturalar brauzerda protsedura sifatida chiziladi.
 * Muqova: "ЖИНОЯТ КОДЕКСИ" uslubi — yashil charm, oltin ramka, gerb va matnlar.
 */
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* yordamchilar                                                        */
/* ------------------------------------------------------------------ */

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { c, ctx };
}

/** Yumshoq organik shovqin (bir necha oktava "blob" ustma-ust). */
function blobNoise(ctx, size, seed = 7, octaves = [3, 8, 20, 55, 140], base = 0.22, w = null, h = null, mode = 'soft-light') {
  const r = rng(seed);
  const W = w ?? ctx.canvas.width;
  const H = h ?? ctx.canvas.height;
  for (let i = 0; i < octaves.length; i++) {
    const cells = octaves[i];
    const { ctx: sc, c: small } = canvas2d(cells, Math.max(1, Math.round(cells * (H / W))));
    const img = sc.createImageData(small.width, small.height);
    for (let p = 0; p < small.width * small.height; p++) {
      const v = 80 + r() * 175;
      img.data[p * 4] = v; img.data[p * 4 + 1] = v; img.data[p * 4 + 2] = v; img.data[p * 4 + 3] = 255;
    }
    sc.putImageData(img, 0, 0);
    ctx.globalAlpha = base * (1 - i / (octaves.length + 1.2));
    ctx.globalCompositeOperation = mode;
    ctx.drawImage(small, 0, 0, W, H);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/** Balandlik (grayscale) xaritasidan normal map yasash (Sobel). */
export function heightToNormalTexture(heightCanvas, strength = 2.0) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const { c, ctx } = canvas2d(w, h);
  const out = ctx.createImageData(w, h);
  const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx, ny = -dy, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len; ny /= len; nz /= len;
      const i = (y * w + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255;
      out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      out.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function tex(canvas, { srgb = false, aniso = 8, wrap = THREE.RepeatWrapping } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = wrap;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------------------ */
/* charm / teri                                                        */
/* ------------------------------------------------------------------ */

export function leatherSet({ base = '#15502f', size = 1024, seed = 3, grain = 1 } = {}) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  blobNoise(ctx, size, seed, [3, 7, 16, 34, 70, 150], 0.30);

  const r = rng(seed + 11);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < size * grain * 5; i++) {
    const x = r() * size, y = r() * size;
    const s = 0.6 + r() * 1.6;
    ctx.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;

  ctx.lineWidth = 1;
  for (let i = 0; i < 260 * grain; i++) {
    const x = r() * size, y = r() * size;
    const len = 6 + r() * 34;
    const ang = r() * Math.PI * 2;
    ctx.globalAlpha = 0.05 + r() * 0.06;
    ctx.strokeStyle = r() > 0.5 ? '#0b2418' : '#2c6b4a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 10,
      y + Math.sin(ang) * len * 0.5 + (r() - 0.5) * 10,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const vg = ctx.createRadialGradient(size * 0.42, size * 0.38, size * 0.12, size * 0.5, size * 0.5, size * 0.78);
  vg.addColorStop(0, 'rgba(235,255,235,0.03)');
  vg.addColorStop(0.55, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, size, size);

  const map = tex(c, { srgb: true });

  const gs = Math.round(size / 2);
  const { c: hc, ctx: hctx } = canvas2d(gs, gs);
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, gs, gs);
  blobNoise(hctx, gs, seed + 5, [4, 12, 30, 70, 160], 0.35);
  const r2 = rng(seed + 21);
  hctx.globalAlpha = 0.22;
  for (let i = 0; i < gs * 6; i++) {
    const x = r2() * gs, y = r2() * gs, s = 1 + r2() * 3;
    hctx.fillStyle = r2() > 0.5 ? '#ffffff' : '#000000';
    hctx.beginPath();
    hctx.ellipse(x, y, s, s * (0.5 + r2()), r2() * 3, 0, Math.PI * 2);
    hctx.fill();
  }
  hctx.globalAlpha = 1;
  const normalMap = heightToNormalTexture(hc, 1.5 * grain);
  normalMap.repeat.set(3, 3);

  const { c: rc, ctx: rctx } = canvas2d(gs, gs);
  rctx.fillStyle = '#ababab';
  rctx.fillRect(0, 0, gs, gs);
  blobNoise(rctx, gs, seed + 31, [3, 9, 24, 60], 0.35);
  const roughnessMap = tex(rc, { aniso: 4 });
  roughnessMap.repeat.set(2, 2);

  return { map, normalMap, roughnessMap };
}

/* ------------------------------------------------------------------ */
/* qog'oz va matn sahifalari                                           */
/* ------------------------------------------------------------------ */

export function paperTexture({ size = 1024, tint = '#f7f0df', seed = 13, edgeDark = 0.0 } = {}) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, size, size);
  blobNoise(ctx, size, seed, [3, 9, 26, 80], 0.16);

  const r = rng(seed + 3);
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#b9a887';
  ctx.lineWidth = 1;
  for (let i = 0; i < size * 1.6; i++) {
    const x = r() * size, y = r() * size, len = 3 + r() * 16, a = r() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 60; i++) {
    const x = r() * size, y = r() * size, rad = 8 + r() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, r() > 0.5 ? 'rgba(160,130,80,0.9)' : 'rgba(220,205,175,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = 1;

  if (edgeDark > 0) {
    const g = ctx.createLinearGradient(0, 0, size * 0.35, 0);
    g.addColorStop(0, `rgba(70,58,38,${edgeDark})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return tex(c, { srgb: true, aniso: 8, wrap: THREE.ClampToEdgeWrapping });
}

/** Kitob varaqlarining chetdagi chiziqlari. */
export function pageEdgeTexture({ size = 1024, lines = 118, seed = 5 } = {}) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = '#e8dfc9';
  ctx.fillRect(0, 0, size, size);
  blobNoise(ctx, size, seed, [4, 12, 40], 0.2);
  const r = rng(seed + 9);
  const step = size / lines;
  for (let i = 0; i < lines; i++) {
    const y = i * step;
    const v = 0.35 + r() * 0.5;
    ctx.fillStyle = `rgba(90,78,58,${0.10 + r() * 0.16})`;
    ctx.fillRect(0, y, size, Math.max(1, step * 0.5 * v));
    ctx.fillStyle = `rgba(255,250,238,${0.20 + r() * 0.25})`;
    ctx.fillRect(0, y + step * 0.5, size, Math.max(1, step * 0.5));
  }
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = r() > 0.5 ? '#fff' : '#5c503c';
    ctx.fillRect(r() * size, 0, 1 + r() * 2, size);
  }
  ctx.globalAlpha = 1;
  return tex(c, { srgb: true, aniso: 8, wrap: THREE.RepeatWrapping });
}

/* ------------------------------------------------------------------ */
/* qonunchilik kitobi sahifalari                                       */
/* ------------------------------------------------------------------ */

const WORDS = ('модда қисм банд қонун жиноят жавобгарлик жазо айбдор шахс суд тергов иш жабрланган ' +
  'гувоҳ ҳуқуқ мажбурият тартиб ваколат давлат қабул белгиланган туман вилоят республика ' +
  'ирода масулият қоидалар норма ҳолат жиноятни содир этишдан айирлик бўлиш тамойил ' +
  'компенсация муддат миқдор буйруқ қарор иштирок ҳимоя эълон самара жиният жамиат ' +
  'ахир жавобгарликка тортилган шахс машълум тартибда огоҳлантирилган бўлади агарда').split(' ');

const ARTICLE_TITLES = ['Умумий қисм', 'Максус қисм', 'Жумҳурият законлари', 'Халқаро ҳуқуқ', 'Жиноят учун ҳуқуқий жавобгарлик',
  'Жазо тўғрисича умумий мавзу', 'Тергов тартиби', 'Судда иш кўриш'];

/**
 * Qonunchilik kodeksiga o'xshatilgan sahifa: "модда"lar, son qo'shimchalar.
 */
export function lawPageTexture({
  w = 768, h = 1152, seed = 1, pageNumber = 12, runningHead = 'ЖИНОЯТ КОДЕКСИ',
} = {}) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#f9f5ea';
  ctx.fillRect(0, 0, w, h);
  blobNoise(ctx, w, seed + 4, [3, 8, 22, 60], 0.045, w, h);

  const r = rng(seed * 977 + 13);
  const ml = w * 0.115, mr = w * 0.15, mt = h * 0.095, mb = h * 0.095;
  const colW = w - ml - mr;

  // sarlavha chizig'i
  ctx.fillStyle = 'rgba(40,36,30,0.5)';
  ctx.font = `600 ${Math.round(h * 0.0145)}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.fillText(runningHead, w / 2, mt - h * 0.028);
  ctx.fillRect(ml, mt - h * 0.012, colW, Math.max(1, h * 0.0011));

  const bodySize = Math.round(h * 0.0168);
  const lineH = bodySize * 1.38;
  let y = mt + lineH;

  const bodyFont = `400 ${bodySize}px Georgia, "Times New Roman", serif`;
  const boldFont = `700 ${Math.round(bodySize * 1.12)}px Georgia, "Times New Roman", serif`;

  let articleN = 100 + ((seed * 13) % 40);

  while (y < h - mb) {
    const isHeader = r() < 0.13;
    if (isHeader) {
      // "124-модда. Sarlavha"
      ctx.font = boldFont;
      ctx.fillStyle = 'rgba(38,34,28,0.92)';
      ctx.textAlign = 'left';
      const title = ARTICLE_TITLES[(r() * ARTICLE_TITLES.length) | 0];
      ctx.fillText(`${articleN}-модда. ${title}`, ml, y);
      y += lineH * 1.25;
      articleN += 1 + ((r() * 2) | 0);
      continue;
    }
    ctx.font = bodyFont;
    ctx.textAlign = 'left';
    const paraIndent = r() < 0.2 ? colW * 0.055 : 0;
    let x = ml + paraIndent;
    while (x < w - mr - colW * 0.04) {
      const word = WORDS[(r() * WORDS.length) | 0];
      const ww = ctx.measureText(word + ' ').width;
      if (x + ww > w - mr) break;
      ctx.fillStyle = `rgba(40,36,30,${0.6 + r() * 0.3})`;
      ctx.fillText(word, x, y);
      x += ww + h * 0.0026;
    }
    y += lineH;
  }

  // sahifa raqami
  ctx.fillStyle = 'rgba(40,36,30,0.55)';
  ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round(h * 0.016)}px Georgia, serif`;
  ctx.fillText(String(pageNumber), w / 2, h - mb * 0.42);

  // kitob ichi quyuqligi
  const g = ctx.createLinearGradient(0, 0, w * 0.2, 0);
  g.addColorStop(0, 'rgba(92,78,52,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const g2 = ctx.createLinearGradient(w, 0, w * 0.92, 0);
  g2.addColorStop(0, 'rgba(120,100,70,0.1)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  return tex(c, { srgb: true, aniso: 8, wrap: THREE.ClampToEdgeWrapping });
}

/** Orqa tomon uchun oyna-kxamma variant. */
export function mirrorX(texture) {
  const t = texture.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.repeat.x = -1;
  t.offset.x = 1;
  return t;
}

/* ------------------------------------------------------------------ */
/* MUQOVA — "ЖИНОЯТ КОДЕКСИ"                                           */
/* ------------------------------------------------------------------ */

/** Kvadrat spiral (meander) burchak naqshi — rimcha kalit naqsh. */
function drawMeander(g, x, y, s, flipX, flipY) {
  g.save();
  g.translate(x, y);
  g.scale(flipX, flipY);
  g.lineWidth = Math.max(1.4, s * 0.085);
  g.lineCap = 'square';
  g.lineJoin = 'miter';
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(s, 0);
  g.lineTo(s, s);
  g.lineTo(0.27 * s, s);
  g.lineTo(0.27 * s, 0.32 * s);
  g.lineTo(0.64 * s, 0.32 * s);
  g.lineTo(0.64 * s, 0.63 * s);
  g.stroke();
  g.restore();
}

/**
 * "ЖИНОЯТ КОДЕКСИ" uslubidagi muqova: yashil charm, oltin ramka,
 * gerb va sarlavhalar. gerbImage — HTMLImageElement yoki null.
 */
export function lawCover({
  w = 1024, h = 1524, gerbImage = null,
  title = ['ЎЗБЕКИСТОН', 'РЕСПУБЛИКАСИНИНГ'],
  bigTitle = ['ЖИНОЯТ', 'КОДЕКСИ'],
  ruTitle = ['УГОЛОВНЫЙ', 'КОДЕКС'],
  ruSub = 'РЕСПУБЛИКИ УЗБЕКИСТАН',
} = {}) {
  /* ---- yashil charm asos ---- */
  const grain = leatherSet({ base: '#175032', size: w, seed: 9, grain: 0.9 });
  const { c, ctx } = canvas2d(w, h);
  ctx.drawImage(grain.map.image, 0, 0, w, h);

  /* ---- yordamchi kanallar ---- */
  const { c: mc, ctx: mg } = canvas2d(w, h);   // oltin maskasi (metall)
  mg.fillStyle = '#000';
  mg.fillRect(0, 0, w, h);
  const { c: hc, ctx: hg } = canvas2d(w, h);   // balandlik (emboss)
  hg.fillStyle = '#000';
  hg.fillRect(0, 0, w, h);

  const goldPaint = (g, vertical = true) => {
    if (vertical) {
      const gr = g.createLinearGradient(0, h * 0.06, 0, h * 0.92);
      gr.addColorStop(0, '#f7e6b2');
      gr.addColorStop(0.38, '#dcae63');
      gr.addColorStop(0.62, '#c69a4d');
      gr.addColorStop(1, '#e9cd8d');
      return gr;
    }
    return '#e7c983';
  };

  /* ---- ramka va burchaklar ---- */
  const drawFrame = (g, fill) => {
    g.strokeStyle = fill;
    const m1 = w * 0.058;                 // tashqi chiziq siligi
    const m2 = w * 0.088;                 // ichki ramka siligi
    g.lineWidth = w * 0.0058;
    g.strokeRect(m1, m1, w - m1 * 2, h - m1 * 2);
    g.lineWidth = w * 0.0036;
    g.strokeRect(m2, m2, w - m2 * 2, h - m2 * 2);

    // burchak meanderlari (tashqi ramka burchaklariga o'tiradi)
    const s = w * 0.055;
    drawMeander(g, m1, m1, s, 1, 1);
    drawMeander(g, w - m1, m1, s, -1, 1);
    drawMeander(g, m1, h - m1, s, 1, -1);
    drawMeander(g, w - m1, h - m1, s, -1, -1);
  };

  drawFrame(ctx, goldPaint(ctx));
  drawFrame(mg, '#ffffff');

  /* ---- gerb ---- */
  const gerbDestY = h * 0.06;
  const gerbH = h * 0.172;
  if (gerbImage && gerbImage.width) {
    const gw = (gerbImage.width / gerbImage.height) * gerbH;
    const gx = w / 2 - gw / 2;
    ctx.drawImage(gerbImage, gx, gerbDestY, gw, gerbH);
    mg.drawImage(gerbImage, gx, gerbDestY, gw, gerbH);
  }

  /* ---- sarlavhalarni joylashtirish ---- */
  const drawText = (g, toMask) => {
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    const set = (txt, y, size, weight = 600, spacing = 0) => {
      g.font = `${weight} ${size}px Georgia, "Times New Roman", serif`;
      g.fillStyle = toMask ? '#ffffff' : goldPaint(g);
      if (spacing > 0) {
        const chars = [...txt];
        const widths = chars.map((ch) => g.measureText(ch).width);
        const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
        let x = w / 2 - total / 2;
        chars.forEach((ch, i) => {
          g.fillText(ch, x + widths[i] / 2, y);
          x += widths[i] + spacing;
        });
      } else {
        g.fillText(txt, w / 2, y);
      }
    };

    let y = gerbDestY + gerbH + h * 0.042;
    set(title[0], y, w * 0.043, 500, w * 0.012);          y += h * 0.031;
    set(title[1], y, w * 0.043, 500, w * 0.012);          y += h * 0.072;

    set(bigTitle[0], y, w * 0.112, 700, w * 0.011);       y += h * 0.088;
    set(bigTitle[1], y, w * 0.112, 700, w * 0.011);       y += h * 0.074;

    // ajratuvchi chiziq
    const ly = y - h * 0.02;
    g.strokeStyle = toMask ? '#ffffff' : goldPaint(g);
    g.lineWidth = w * 0.0042;
    g.beginPath();
    g.moveTo(w * 0.30, ly);
    g.lineTo(w * 0.70, ly);
    g.stroke();
    g.lineWidth = w * 0.0016;
    g.beginPath();
    g.moveTo(w * 0.34, ly + w * 0.009);
    g.lineTo(w * 0.66, ly + w * 0.009);
    g.stroke();

    set(ruTitle[0], y + h * 0.028, w * 0.062, 600, w * 0.004);
    set(ruTitle[1], y + h * 0.084, w * 0.062, 600, w * 0.004);
    set(ruSub, y + h * 0.132, w * 0.030, 500, w * 0.006);
  };

  drawText(mg, true);
  drawText(ctx, false);

  /* ---- emboss balandligi: charm doni + ko'tarilgan oltin ---- */
  blobNoise(hg, w, 77, [6, 14, 34, 80], 0.25, w, h);
  hg.save();
  hg.filter = 'blur(4px)';
  hg.globalAlpha = 0.92;
  hg.drawImage(mc, 0, 0);
  hg.restore();

  /* ---- yakuniy materiallar ---- */
  const metalnessMap = tex(mc, { aniso: 4, wrap: THREE.ClampToEdgeWrapping });

  // roughness: charm baza, oltin joylar — silliq (quyuq)
  const { c: ic, ctx: ix } = canvas2d(w, h);
  ix.fillStyle = '#ffffff';
  ix.fillRect(0, 0, w, h);
  ix.globalCompositeOperation = 'difference';
  ix.drawImage(mc, 0, 0);            // oltin → qora (silliq)
  ix.globalCompositeOperation = 'source-over';

  const { c: rc, ctx: rctx } = canvas2d(w, h);
  rctx.drawImage(grain.roughnessMap.image, 0, 0, w, h);
  rctx.globalAlpha = 0.75;
  rctx.globalCompositeOperation = 'multiply';   // qora oltin → silliqroq
  rctx.drawImage(ic, 0, 0);
  rctx.globalAlpha = 1;
  rctx.globalCompositeOperation = 'source-over';
  const roughnessMap = tex(rc, { aniso: 4, wrap: THREE.ClampToEdgeWrapping });

  // relief normali (emboss bostirish effekti)
  const normalMap = heightToNormalTexture(hc, 1.25);
  normalMap.wrapS = normalMap.wrapT = THREE.ClampToEdgeWrapping;

  return {
    map: tex(c, { srgb: true, wrap: THREE.ClampToEdgeWrapping }),
    metalnessMap,
    roughnessMap,
    normalMap,
  };
}

/**
 * Umurtqa (spine) uchun oltin tasmali charm tekstura.
 * Qaytaradi: { map, metalnessMap, roughnessMap }
 */
export function lawSpineTexture({ title = 'ЖИНОЯТ КОДЕКСИ', base = '#14442b', w = 256, h = 1024 } = {}) {
  const mk = (fn) => {
    const { c, ctx } = canvas2d(w, h);
    fn(ctx);
    return c;
  };

  const bands = [0.055, 0.098, 0.30, 0.70, 0.902, 0.945];

  const body = mk((g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // charm doni
    blobNoise(g, w, 21, [4, 10, 26, 70], 0.3, w, h);
  });

  const mask = mk((g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff';
    bands.forEach((b, i) => {
      const t = (i === 2 || i === 3) ? 0.016 : 0.011;
      g.fillRect(0, b * h - (t * h) / 2, w, t * h);
      g.fillRect(0, b * h + t * h * 1.05, w, t * h * 0.3);
    });
    g.save();
    g.translate(w / 2, h * 0.5);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `600 ${w * 0.14}px Georgia, "Times New Roman", serif`;
    g.fillText(title.toUpperCase(), 0, 0);
    g.restore();
  });

  // oltin: gradient maska shaklida pastdiriladi
  const gold = mk((g) => {
    const gr = g.createLinearGradient(0, 0, w, h * 0.2);
    gr.addColorStop(0, '#f7e4ae');
    gr.addColorStop(0.5, '#d9b06a');
    gr.addColorStop(1, '#c4974e');
    g.drawImage(body, 0, 0);

    // oltin maskasining yorug'ligini alfa kanaliga aylantiramiz
    const { c: am, ctx: ag } = canvas2d(w, h);
    ag.drawImage(mask, 0, 0);
    const im = ag.getImageData(0, 0, w, h);
    for (let p = 0; p < w * h; p++) {
      im.data[p * 4 + 3] = im.data[p * 4]; // R = oq/qora → alfa
    }
    ag.putImageData(im, 0, 0);

    const { c: lm, ctx: lg } = canvas2d(w, h);
    lg.fillStyle = gr;
    lg.fillRect(0, 0, w, h);
    lg.globalCompositeOperation = 'destination-in';
    lg.drawImage(am, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(lm, 0, 0);
  });

  const rough = mk((g) => {
    g.fillStyle = '#b4b4b4';
    g.fillRect(0, 0, w, h);
    // oltin qismlar silliqroq
    const { c: ic, ctx: ixc } = canvas2d(w, h);
    ixc.fillStyle = '#fff';
    ixc.fillRect(0, 0, w, h);
    ixc.globalCompositeOperation = 'difference';
    ixc.drawImage(mask, 0, 0);
    ixc.globalCompositeOperation = 'source-over';
    g.globalAlpha = 0.7;
    g.globalCompositeOperation = 'multiply';
    g.drawImage(ic, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  });

  const t = (canvas, srgb) => {
    const tt = new THREE.CanvasTexture(canvas);
    if (srgb) tt.colorSpace = THREE.SRGBColorSpace;
    tt.wrapS = THREE.RepeatWrapping;
    tt.wrapT = THREE.ClampToEdgeWrapping;
    tt.anisotropy = 8;
    return tt;
  };

  return { map: t(gold, true), metalnessMap: t(mask, false), roughnessMap: t(rough, false) };
}

/* ------------------------------------------------------------------ */
/* boshqalar                                                           */
/* ------------------------------------------------------------------ */

export function radialFadeTexture(size = 512, inner = 0.25, power = 1.5) {
  const { c, ctx } = canvas2d(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, size * inner * 0.2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(inner, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.62, `rgba(255,255,255,${0.35 ** power})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return tex(c, { aniso: 2, wrap: THREE.ClampToEdgeWrapping });
}

export function backgroundTexture(w = 32, h = 512, top = '#1b1a24', mid = '#101017', bottom = '#07070b') {
  const { c, ctx } = canvas2d(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return tex(c, { srgb: true, wrap: THREE.ClampToEdgeWrapping });
}

/** Rasmni "object-fit: cover" kabi joylashtirish. */
export function coverFit(texture, targetAspect) {
  const img = texture.image;
  const aspect = (img.width || 1) / (img.height || 1);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.center.set(0.5, 0.5);
  if (aspect > targetAspect) {
    texture.repeat.set(targetAspect / aspect, 1);
    texture.offset.set((1 - targetAspect / aspect) / 2, 0);
  } else {
    texture.repeat.set(1, aspect / targetAspect);
    texture.offset.set(0, (1 - aspect / targetAspect) / 2);
  }
  texture.needsUpdate = true;
  return texture;
}

/** Rasmning o'rtacha rangi. */
export function averageColor(texture) {
  const img = texture.image;
  if (!img) return new THREE.Color('#175032');
  const c = document.createElement('canvas');
  c.width = c.height = 24;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 24, 24);
  const d = ctx.getImageData(0, 0, 24, 24).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
}
