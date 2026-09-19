/**
 * book.js — realistik 3D kitob: qattiq muqova, bukiladigan varaqlar, umurtqa.
 *
 * O'lchov: 1 birlik ≈ 10 sm. Kitob 15×22.5 sm.
 * O'qlar: X — kenglik, Y — balandlik, Z — kitob bo'yi.
 * Muqova tutqichi (hinge) Z o'qi bo'ylab, x = -COV_W/2 da.
 */
import * as THREE from 'three';
import * as TX from './textures.js';

export const DIM = {
  W: 1.5,          // varaq kengligi (tutqichdan chetiga)
  H: 2.25,         // varaq bo'yi
  BOARD: 0.04,     // muqova qalinligi
  SHEET: 0.0032,   // bitta varaq qalinligi
  LEAVES: 42,      // varaq soni
  OVER: 0.028,     // muqova varaqdan chiqib turishi
};
DIM.BLOCK_H = DIM.SHEET * DIM.LEAVES;
DIM.T = DIM.BOARD * 2 + DIM.BLOCK_H;
DIM.COV_W = DIM.W + DIM.OVER;
DIM.COV_H = DIM.H + DIM.OVER;

const PAGE_SEG = 56; // varaq bukilishining silliqligi

/* ------------------------------------------------------------------ */
/* geometriya yordamchilari                                            */
/* ------------------------------------------------------------------ */

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  s.moveTo(-hw, -h / 2);
  s.lineTo(hw, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
  s.lineTo(w / 2, hh);
  s.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
  s.lineTo(-hw, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
  s.lineTo(-w / 2, -hh);
  s.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
  return s;
}

/**
 * Muqova taxtasi: yumaloq qirrali plastina.
 * Yopiq holatda y = 0 dan y = thick gacha, ustki yuzasi +Y ga qaragan.
 * Muqova rasmi ustki yuzaga to'liq (0..1 UV) joylashadi.
 */
function boardGeometry(w, h, thick, radius, uvW, uvH) {
  const shape = roundedRectShape(w, h, radius * 0.7);
  const bevel = radius * 0.5;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, thick - bevel * 2),
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    UVGenerator: {
      generateTopUV(geometry, vertices, iA, iB, iC) {
        const uv = (i) => new THREE.Vector2(
          (vertices[i * 3] + w / 2) / (uvW || w),
          (vertices[i * 3 + 1] + h / 2) / (uvH || h)
        );
        return [uv(iA), uv(iB), uv(iC)];
      },
      generateSideWallUV(geometry, vertices, iA, iB, iC, iD) {
        const uv = (i) => new THREE.Vector2(
          (vertices[i * 3] + w / 2) / (uvW || w),
          (vertices[i * 3 + 1] + h / 2) / (uvH || h)
        );
        return [uv(iA), uv(iB), uv(iC), uv(iD)];
      },
    },
  });
  geo.rotateX(Math.PI / 2);      // shape Y -> dunyo Z (muqova to'g'ri turadi)
  // balandlikni aniq [0, thick] oralig'iga keltiramiz
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(0, -bb.min.y, 0);
  geo.scale(1, thick / Math.max(1e-5, bb.max.y - bb.min.y), 1);
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ */
/* Book                                                                */
/* ------------------------------------------------------------------ */

export class Book {
  constructor({ title = 'ЖИНОЯТ КОДЕКСИ', gerbImage = null } = {}) {
    const { W, H, BOARD, SHEET, LEAVES, BLOCK_H: blockH, T, COV_W, COV_H } = DIM;
    this.title = title;
    this.dim = DIM;

    this.group = new THREE.Group();
    this.group.name = 'Book';

    /* ---------------- materiallar ---------------- */
    const leather = TX.leatherSet({ base: '#175032', size: 512, seed: 9, grain: 0.7 });
    leather.normalMap.repeat.set(6, 6);
    this.leather = leather;

    const coverArt = TX.lawCover({ gerbImage });
    this.coverMat = new THREE.MeshPhysicalMaterial({
      map: coverArt.map,
      metalnessMap: coverArt.metalnessMap,
      roughnessMap: coverArt.roughnessMap,
      normalMap: coverArt.normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      metalness: 1.0,
      roughness: 1.0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.7,
      envMapIntensity: 1.0,
    });
    this.coverMat.userData.procedural = coverArt;

    /* ---------------- orqa muqova ---------------- */
    const boardGeo = boardGeometry(COV_W, COV_H, BOARD, 0.018, COV_W, COV_H);
    this.backBoard = new THREE.Mesh(boardGeo, this.coverMat);
    this.backBoard.castShadow = true;
    this.backBoard.receiveShadow = true;
    this.group.add(this.backBoard);

    /* ---------------- umurtqa (spine) ---------------- */
    const spineR = T / 2;
    const spineGeo = new THREE.CylinderGeometry(spineR, spineR, COV_H, 44, 1, true, Math.PI, Math.PI);
    spineGeo.rotateX(Math.PI / 2);  // yarim silindr kitobning chap tomoniga qaraydi
    const spineTex = TX.lawSpineTexture({ title });
    this.spineMat = new THREE.MeshPhysicalMaterial({
      map: spineTex.map,
      metalnessMap: spineTex.metalnessMap,
      roughnessMap: spineTex.roughnessMap,
      metalness: 1.0,
      roughness: 1.0,
      normalMap: leather.normalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
      clearcoat: 0.18,
      side: THREE.DoubleSide,
      envMapIntensity: 1.0,
    });
    this.spine = new THREE.Mesh(spineGeo, this.spineMat);
    this.spine.position.set(-COV_W / 2, T / 2, 0);
    this.spine.castShadow = true;
    this.spine.receiveShadow = true;
    this.group.add(this.spine);

    // umurtqaning uchlari
    const capGeo = new THREE.CircleGeometry(spineR, 32, Math.PI / 2, Math.PI);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x3a1618, roughness: 0.85, metalness: 0, side: THREE.DoubleSide,
    });
    [COV_H / 2 - 0.0004, -COV_H / 2 + 0.0004].forEach((z) => {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(-COV_W / 2, T / 2, z);
      this.group.add(cap);
    });

    /* ---------------- varaqlar to'plami ---------------- */
    this.paperMat = new THREE.MeshStandardMaterial({
      color: 0xefe6d3, roughness: 0.95, metalness: 0, side: THREE.DoubleSide,
    });

    const blockGroup = new THREE.Group();
    this.group.add(blockGroup);
    this.blockGroup = blockGroup;

    for (let i = 0; i < LEAVES; i++) {
      const t = i / (LEAVES - 1);
      const shrink = 0.01 * Math.sin(Math.PI * t);      // old qirra botiqligi
      const gr = new THREE.BoxGeometry(W * (1 - shrink), SHEET, H * (1 - shrink * 0.25));
      const leaf = new THREE.Mesh(gr, this.paperMat);
      leaf.position.set(-W / 2 + (W * (1 - shrink)) / 2, BOARD + SHEET * (i + 0.5), 0);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      blockGroup.add(leaf);
    }

    /* ---- varaq chetlarining chiziqli teksturasi (fore / head / tail) ---- */
    const edgeTex = TX.pageEdgeTexture({ seed: 5, lines: 150 });
    const edgeMat = new THREE.MeshStandardMaterial({
      map: edgeTex, roughness: 0.92, metalness: 0, side: THREE.FrontSide,
    });
    {
      // old qirra
      const g = new THREE.PlaneGeometry(blockH, H * 0.997);
      g.rotateY(Math.PI / 2);
      const m = new THREE.Mesh(g, edgeMat);
      m.position.set(W / 2 - 0.0072, BOARD + blockH / 2, 0);
      m.receiveShadow = true;
      this.group.add(m);
    }
    {
      // ustki va pastki qirralar
      for (const [z, rotY] of [[-H / 2 + 0.006, Math.PI], [H / 2 - 0.006, 0]]) {
        const g = new THREE.PlaneGeometry(W * (1 - 0.008), blockH);
        g.rotateY(rotY);
        const m = new THREE.Mesh(g, edgeMat);
        m.position.set(-W / 2 + (W * (1 - 0.008)) / 2, BOARD + blockH / 2, z);
        m.receiveShadow = true;
        this.group.add(m);
      }
    }

    /* ---------------- sahifa teksturalari ---------------- */
    this.pageTextures = [];
    for (let i = 0; i < 5; i++) {
      this.pageTextures.push(TX.lawPageTexture({
        w: 512, h: 768, seed: i + 1, pageNumber: 12 + i * 2,
        runningHead: i % 2 ? 'ЖИНОЯТ КОДЕКСИ' : 'ЎЗБЕКИСТОН РЕСПУБЛИКАСИНИНГ ҚОНУНЧИЛИГИ',
      }));
    }

    // ochiq kitobning ustki sahifasi
    const topGeo = new THREE.PlaneGeometry(W, H);
    topGeo.rotateX(-Math.PI / 2);
    this.topPage = new THREE.Mesh(
      topGeo,
      new THREE.MeshStandardMaterial({
        map: this.pageTextures[0], roughness: 0.93, metalness: 0,
      })
    );
    this.topPage.position.set(0, BOARD + blockH + 0.0002, 0);
    this.topPage.receiveShadow = true;
    this.topPage.visible = false;
    this.group.add(this.topPage);

    /* ---------------- old muqova (ochiladigan) ---------------- */
    this.coverGroup = new THREE.Group();
    this.coverGroup.position.set(-COV_W / 2, T - BOARD / 2, 0);
    this.group.add(this.coverGroup);

    this.frontBoard = new THREE.Mesh(boardGeo, this.coverMat);
    this.frontBoard.position.set(COV_W / 2, -BOARD / 2, 0); // tutqich taxtaning o'rtasida
    this.frontBoard.castShadow = true;
    this.frontBoard.receiveShadow = true;
    this.coverGroup.add(this.frontBoard);

    // ichki qog'oz (endpaper)
    const endTex = TX.paperTexture({ size: 512, tint: '#e7ddc5', seed: 22, edgeDark: 0.3 });
    const endMat = new THREE.MeshStandardMaterial({
      map: endTex, roughness: 0.9, metalness: 0,
    });

    const endGeo = new THREE.PlaneGeometry(COV_W * 0.9, COV_H * 0.9);
    endGeo.rotateX(Math.PI / 2);                             // pastga qaraydi
    const endPaper = new THREE.Mesh(endGeo, endMat);
    endPaper.position.set(COV_W / 2, -BOARD / 2 - 0.0022, 0);
    endPaper.receiveShadow = true;
    this.coverGroup.add(endPaper);

    const endGeo2 = new THREE.PlaneGeometry(COV_W * 0.9, COV_H * 0.9);
    endGeo2.rotateX(-Math.PI / 2);                           // yuqoriga qaraydi
    const endPaper2 = new THREE.Mesh(endGeo2, endMat);
    endPaper2.position.set(0, BOARD + 0.0016, 0);
    endPaper2.receiveShadow = true;
    this.group.add(endPaper2);

    /* ---------------- aylanadigan varaqlar ---------------- */
    this.maxPages = 5;
    this.pages = [];
    const pageGeo = this._pageGeometry(W, H);
    for (let i = 0; i < this.maxPages; i++) {
      const recto = this.pageTextures[(i + 1) % this.pageTextures.length];
      const verso = TX.mirrorX(this.pageTextures[(i + 2) % this.pageTextures.length]);
      const front = new THREE.Mesh(pageGeo, new THREE.MeshStandardMaterial({
        map: recto, roughness: 0.92, metalness: 0, side: THREE.FrontSide,
      }));
      const back = new THREE.Mesh(pageGeo, new THREE.MeshStandardMaterial({
        map: verso, roughness: 0.92, metalness: 0, side: THREE.BackSide,
      }));
      front.castShadow = true; front.receiveShadow = true;
      back.castShadow = true; back.receiveShadow = true;

      const holder = new THREE.Group();
      holder.add(front, back);
      holder.position.set(-W / 2, BOARD + blockH + 0.0012, 0);
      this.group.add(holder);
      this.pages.push({ holder, geo: pageGeo, p: 0 });
    }

    /* chap tomonda yig'ilgan varaqlar (qalinlik illyuziyasi) */
    // ochiq kitobda chap to'plam shu sathdan boshlanadi:
    // stol(0) → orqa muqova → old muqova → ichki qog'oz
    this.pileBase = DIM.BOARD * 2 + 0.0028;

    this.pile = new THREE.Group();
    this.group.add(this.pile);
    const pileMat = new THREE.MeshStandardMaterial({ color: 0xece3cd, roughness: 0.95, metalness: 0 });
    for (let i = 0; i < this.maxPages; i++) {
      const r = TX.rng(100 + i * 7);
      const m = new THREE.Mesh(new THREE.BoxGeometry(W * 0.985, SHEET, H * 0.985), pileMat);
      m.position.set(
        -W / 2 - W / 2 + (r() - 0.5) * 0.006,
        this.pileBase + SHEET * (i + 0.5),
        (r() - 0.5) * 0.007
      );
      m.rotation.y = (r() - 0.5) * 0.035;
      m.castShadow = true;
      m.receiveShadow = true;
      m.visible = false;
      this.pile.add(m);
    }

    this.pileCount = 0;
    this.coverOpen = 0;
    this.setCover(0);
    this.setPile(0);
  }

  /* ---------------------------------------------------------------- */

  _pageGeometry(W, H) {
    const cols = PAGE_SEG + 1;
    const rows = 2;
    const pos = new Float32Array(cols * rows * 3);
    const uv = new Float32Array(cols * rows * 2);
    const idx = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const k = i * rows + j;
        uv[k * 2] = i / (cols - 1);
        uv[k * 2 + 1] = j;                   // v=1 — kitob boshi (+Z)
        pos[k * 3] = (i / (cols - 1)) * W;   // tutqichdan chetga
        pos[k * 3 + 1] = 0;
        pos[k * 3 + 2] = (j - 0.5) * H;
      }
    }
    for (let i = 0; i < cols - 1; i++) {
      const a = i * rows, b = (i + 1) * rows;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    geo.userData.cols = cols;
    geo.userData.rows = rows;
    return geo;
  }

  /* ---------------------------------------------------------------- */
  /* holat                                                             */
  /* ---------------------------------------------------------------- */

  /**
   * p: 0 — muqova yopiq, 1 — to'liq ochiq (180°).
   * Ochiq holatda old muqova orqa muqova ustiga yotadi (tutqich = taxta o'rtasi).
   */
  setCover(p) {
    const { T, BOARD } = DIM;
    this.coverOpen = p;
    const yClosed = T - BOARD / 2;          // yopiq: kitob tepasi
    const yOpen = BOARD * 1.5 + 0.0007;     // ochiq: orqa muqova ustida
    this.coverGroup.position.y = yClosed + (yOpen - yClosed) * p;
    this.coverGroup.rotation.z = p * Math.PI;
    this.topPage.visible = p > 0.05;
    this.pile.visible = p > 0.25;
    this._hingeY = this.coverGroup.position.y;
  }

  /** i — varaq raqami, p — 0 (o'ngda) .. 1 (chapda). */
  setPage(i, p) {
    const page = this.pages[i];
    if (!page) return;
    page.p = p;

    const { BOARD, SHEET } = DIM;
    const yRight = BOARD + DIM.BLOCK_H + 0.0012;             // blok ustida
    const yLeft = this.pileBase + SHEET * (i + 1) + 0.0005;  // chap to'plam ustida
    page.holder.position.y = yRight + (yLeft - yRight) * smoothstep(p);

    if (p <= 0.0001) { this._bend(page, 0, 0, 0); return; }
    if (p >= 0.9999) { this._bend(page, 1, 0, 0); return; }
    // bukilish: burchak tutqichdan chetga qarab ortadi
    this._bend(page, p, 1.15 * Math.sin(Math.PI * p), 0.026 * Math.sin(Math.PI * p));
  }

  _bend(page, p, delta, sag) {
    const W = DIM.W, H = DIM.H;
    const geo = page.geo;
    const pos = geo.attributes.position.array;
    const cols = geo.userData.cols;
    const rows = geo.userData.rows;
    const alpha = p * Math.PI;
    const flat = Math.abs(delta) < 1e-4;

    // yoy uzunligini saqlovchi egri chiziq:
    //   th(u) = alpha + delta * u   — urinma burchagi
    //   x,y   — shu burchak bo'ylab integral (delta=0 da to'g'ri chiziq)
    for (let i = 0; i < cols; i++) {
      const u = i / (cols - 1);
      const s = u * W;
      const th = alpha + delta * u;
      let x, y;
      if (flat) {
        x = s * Math.cos(th);
        y = s * Math.sin(th);
      } else {
        const R = W / delta;
        x = R * (Math.sin(th) - Math.sin(alpha));
        y = -R * (Math.cos(th) - Math.cos(alpha));
      }
      // o'z normali bo'ylab ozgina osilish
      const off = -sag * Math.sin(Math.PI * u);
      x += off * -Math.sin(th);
      y += off * Math.cos(th);

      for (let j = 0; j < rows; j++) {
        const k = i * rows + j;
        pos[k * 3] = x;
        pos[k * 3 + 1] = y;
        pos[k * 3 + 2] = (j - 0.5) * H;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  /** Chap tomonda yig'ilgan varaqlar soni. */
  setPile(n) {
    this.pileCount = n;
    this.pile.children.forEach((m, i) => { m.visible = i < n; });
  }

  /** Muqovaga rasm o'rnatish (yuklangandan keyin). */
  setCoverTexture(texture, { aspect = DIM.COV_W / DIM.COV_H } = {}) {
    TX.coverFit(texture, aspect);
    const m = this.coverMat;
    m.map = texture;
    m.metalnessMap = null;
    m.metalness = 0.0;
    m.roughnessMap = this.leather.roughnessMap;
    m.normalMap = this.leather.normalMap;
    m.normalScale.set(0.14, 0.14);
    m.roughness = 0.55;
    m.clearcoat = 0.3;
    m.clearcoatRoughness = 0.45;
    m.needsUpdate = true;
    this.coverTexture = texture;
  }

  /** Muqovaning o'rtacha rangiga umurtqani moslash. */
  tintSpine(color) {
    const hex = '#' + color.clone().multiplyScalar(0.42).getHexString();
    const tex = TX.lawSpineTexture({ title: this.title, base: hex });
    this.spineMat.map.dispose();
    this.spineMat.metalnessMap.dispose();
    this.spineMat.roughnessMap.dispose();
    this.spineMat.map = tex.map;
    this.spineMat.metalnessMap = tex.metalnessMap;
    this.spineMat.roughnessMap = tex.roughnessMap;
    this.spineMat.needsUpdate = true;
  }
}

function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}
