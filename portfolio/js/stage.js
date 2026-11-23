// The 3D stage: one particle system that carries the whole visual story.
// States: 0 portrait · 1 scattered data · 2 ordered cube · 3 workflow · 4 calm field · 5 portrait (centre)
// At rest in a portrait state the real photo is shown at full resolution; the particles take over
// the moment the pointer or the scroll disturbs it, so the picture is never soft.
import * as THREE from '../vendor/three.module.min.js';

const FOV = 35;
const DIST = 10;
const VH = 2 * DIST * Math.tan((FOV * Math.PI) / 360); // visible world height at z = 0
const TAU = Math.PI * 2;
const R = Math.random;
const MAX_STATE = 5;

const FIELD = /* glsl */ `
uniform vec3 uM[3];
uniform vec4 uBand;
uniform vec2 uBandC;
uniform float uAspect;
float field(vec2 ndc){
  float f = 0.;
  for (int i = 0; i < 3; i++) {
    vec2 d = (ndc - uM[i].xy) * vec2(uAspect, 1.);
    f = max(f, uM[i].z * smoothstep(.23, 0., length(d)));
  }
  float b = dot((ndc - uBandC) * vec2(uAspect, 1.), uBand.xy) - uBand.z;
  return max(f, uBand.w * smoothstep(.1, 0., abs(b)));
}`;

const VERT = /* glsl */ `
attribute vec3 aP0;
attribute vec4 aP1;
attribute vec4 aP2;
attribute vec4 aP3;
attribute vec4 aSeed;
attribute vec4 aCol;
uniform float uPhase, uTime, uDpr, uPhoto, uPx0, uPx5, uTravel;
uniform vec4 uMaskP, uMaskT;
uniform vec2 uMaskS;
uniform vec2 uView, uTilt;
uniform vec4 uL0, uL5, uL2, uL3;
varying vec3 vCol;
varying float vA;
varying float vRound;
${FIELD}

const vec3 CREAM = vec3(.22, .205, .1);   // olive ink
const vec3 GOLD = vec3(.5, .46, .34);   // warm olive grey
const vec3 EMBER = vec3(.88, .26, .56);   // hot pink, the one loud colour

vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c); }
vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y*c - p.z*s, p.y*s + p.z*c); }

vec3 chaos(){
  vec3 p = aP3.xyz;
  float f = aP3.w;
  p.x += sin(uTime*.11 + f*40.) * .16;
  p.y += cos(uTime*.13 + f*31.) * .13;
  p.z += sin(uTime*.09 + f*17.) * .2;
  return p;
}

void state(float s, out vec3 p, out vec3 c, out float a, out float sz, out float rd){
  if (s < .5 || s > 4.5) {
    vec4 L = s < .5 ? uL0 : uL5;
    if (aCol.a > .5) {
      vec3 q = aP0;
      float fade = L.w * (1. - smoothstep(-.5, -.34, q.y));
      q.x += fade * (aSeed.x - .5) * .05;
      q.y -= fade * aSeed.y * .06;
      q = rotX(rotY(q, uTilt.x * .1), -uTilt.y * .07);
      p = vec3(L.xy, 0.) + q * L.z;
      c = aCol.rgb;
      a = 1. - fade;
      sz = s < .5 ? uPx0 : uPx5;
      rd = 0.;
    } else {
      p = chaos();
      c = mix(CREAM, GOLD, aSeed.y) * (.5 + .4 * aSeed.x);
      a = .06 + .3 * aSeed.z * aSeed.z;
      sz = (1. + 3.2 * aSeed.x * aSeed.x) * uDpr;
      rd = 1.;
    }
  } else if (s < 1.5) {
    p = chaos();
    float spare = 1. - step(.5, aCol.a);
    float bad = step(.9, fract(aP3.w * 97.3 + floor(aSeed.y * 5.) * .2));
    c = mix(mix(CREAM * (.72 + .28 * fract(aP3.w * 13.7)), EMBER, bad), mix(CREAM, GOLD, aSeed.y) * .7, spare);
    a = mix(.9, .06 + .3 * aSeed.z * aSeed.z, spare);
    sz = mix(1.9, 1. + 3.2 * aSeed.x * aSeed.x, spare) * uDpr;
    rd = 1.;
  } else if (s < 2.5) {
    vec3 q = aP1.xyz;
    vec3 idx = clamp(floor((q + .5) * 4.), 0., 3.);
    vec3 ctr = (idx + .5) / 4. - .5;
    vec3 loc = q - ctr;
    float n = aP1.w;
    vec3 N = n < .5 ? vec3(1., 0., 0.) : n < 1.5 ? vec3(-1., 0., 0.) : n < 2.5 ? vec3(0., 1., 0.) : n < 3.5 ? vec3(0., -1., 0.) : n < 4.5 ? vec3(0., 0., 1.) : vec3(0., 0., -1.);
    float h = fract(sin(dot(idx + N * 7., vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    q = ctr * 1.17 + loc * .9 + N * (.035 * sin(uTime * .9 + h * 6.2831853));
    float ang = uTime * .2 + uTilt.x * .5;
    float tip = .5 + uTilt.y * .2;
    q = rotX(rotY(q, ang), tip);
    N = rotX(rotY(N, ang), tip);
    p = vec3(uL2.xy, 0.) + q * uL2.z;
    float facing = dot(N, normalize(vec3(0., 0., 10.) - p));
    float lit = .2 + .8 * max(dot(N, normalize(vec3(.42, .8, .43))), 0.);
    c = mix(CREAM, EMBER * 1.1, step(.9, h)) * lit;
    a = .95 * smoothstep(-.02, .14, facing);
    sz = 1.55 * uDpr;
    rd = 1.;
  } else if (s < 3.5) {
    vec3 q = vec3(aP2.xy * uL3.z, aP2.z);
    q = rotX(rotY(q, -.36 + uTilt.x * .3 + sin(uTime * .31) * .04), .12 + uTilt.y * .18);
    p = vec3(uL3.xy, 0.) + q;
    float u = aP2.w;
    float node = step(u, -1.5) * step(-2.5, u);
    float dust = step(u, -2.5);
    float pulse = u < 0. ? 0. : pow(.5 + .5 * cos(6.2831853 * (u * 1.15 - uTime * .33)), 16.);
    c = mix(CREAM * (.5 + .5 * node), EMBER * 1.2, pulse);
    a = (.55 + .4 * node + .45 * pulse) * (1. - dust * .8);
    sz = (1.2 + .5 * node + 1.5 * pulse) * uDpr;
    rd = 1.;
  } else {
    float gx = (floor(aSeed.x * 1500.) + .5) / 1500.;
    float gz = (floor(aSeed.y * 64.) + .5) / 64.;
    float x = (gx - .5) * uView.x * 3.;
    float z = -1.5 - pow(gz, 1.45) * 27.;
    float h = sin(x * .42 + uTime * .4 + z * .1) * .3 + sin(z * .33 - uTime * .55 + x * .17) * .34 + sin((x - z) * .9 + uTime * .7) * .07;
    p = vec3(x, -uView.y * .5 - .7 + h, z);
    float far = smoothstep(14., 36., 10. - z);
    c = mix(CREAM * .8, GOLD * 1.15, smoothstep(.1, .55, h)) * (1. - far * .35);
    a = (1. - far) * (.62 + .38 * smoothstep(-.4, .5, h));
    sz = 1.45 * uDpr;
    rd = 1.;
  }
}

float inRect(vec2 ndc, vec4 r){
  vec2 d = abs(ndc - r.xy) - r.zw;
  return 1. - smoothstep(-.03, .1, max(d.x, d.y));
}

void main(){
  vec3 p; vec3 c; float al; float sz; float rd;
  float wP = 0.;
  bool spare = aCol.a < .5;
  if (spare) {
    // the surroundings: dust that streams toward and past the camera as the journey moves forward
    float z = mod(aP3.z + uTravel, 90.) - 80.;
    p = vec3(aP3.xy, z);
    c = mix(CREAM, GOLD, aSeed.y) * (.55 + .45 * aSeed.x);
    al = (.1 + .5 * aSeed.z * aSeed.z) * smoothstep(-80., -55., z);
    sz = (1. + 2.6 * aSeed.x * aSeed.x) * uDpr;
    rd = 1.;
  } else {
    float ph = clamp(uPhase, 0., 5.);
    float s0 = floor(ph);
    float k = ph - s0;
    state(s0, p, c, al, sz, rd);
    wP = (s0 < .5 || s0 > 4.5) ? 1. : 0.;
    if (k > .0005) {
      // each particle leaves the old scene toward the camera, then arrives at the new one out of the distance
      float tt = clamp(k * 1.6 - aSeed.w * .6, 0., 1.);
      vec3 n = vec3(sin(aSeed.x * 37. + uTime * .4), cos(aSeed.y * 29. - uTime * .3), sin(aSeed.z * 41. + uTime * .2));
      if (tt < .5) {
        float o = smoothstep(0., .5, tt);
        p += n * o * (.3 + .8 * aSeed.z);
        p.z += o * o * (12. + 10. * aSeed.x);
        al *= 1. - smoothstep(.6, 1., o);
        rd = max(rd, clamp(o * 8., 0., 1.));
        wP *= 1. - o;
      } else {
        vec3 pB; vec3 cB; float aB; float zB; float rB;
        state(s0 + 1., pB, cB, aB, zB, rB);
        float i = smoothstep(.5, 1., tt);
        float far = (1. - i) * (1. - i);
        p = pB + n * far * (1.2 + 2. * aSeed.z);
        p.z -= far * (50. + 35. * aSeed.x);
        c = cB;
        al = aB * smoothstep(0., .4, i);
        sz = zB;
        rd = max(rB, 1. - smoothstep(.8, 1., i));
        wP = (s0 + 1. > 4.5 ? 1. : 0.) * i;
      }
    }
  }
  vec4 mv = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float depth = max(.2, -mv.z);
  float persp = min(10. / depth, 5.);
  al *= smoothstep(.4, 2.6, depth);
  vec2 ndc = gl_Position.xy / gl_Position.w;
  float f = field(ndc);
  float isP = (spare ? 0. : 1.) * wP;
  float show = mix(1., smoothstep(.02, .2, f), uPhoto * isP);
  if (spare) al *= (1. - inRect(ndc, uMaskP) * uMaskS.x) * (1. - inRect(ndc, uMaskT) * uMaskS.y);
  float ang = aSeed.x * 6.2831853 + uTime * (.5 + aSeed.y);
  vec2 rdir = normalize((ndc - uM[0].xy) * vec2(uAspect, 1.) + 1e-5);
  vec2 dsp = mix(rdir, vec2(cos(ang), sin(ang)), .72) * f * (.012 + .075 * aSeed.z * aSeed.z);
  gl_Position.xy += dsp * vec2(1. / uAspect, 1.) * gl_Position.w;
  gl_PointSize = max(1., sz * persp * (1. + f * .35 * aSeed.y));
  vCol = c - f * vec3(.03, .03, .01) * (1. - isP * .6);
  vA = al * show;
  vRound = max(rd, smoothstep(0., .25, f));
  if (vA < .012) gl_Position = vec4(2., 2., 2., 1.);
}`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vCol;
varying float vA;
varying float vRound;
void main(){
  float d = length(gl_PointCoord - .5);
  float a = vA * mix(1., smoothstep(.5, .3, d), vRound);
  if (a < .012) discard;
  gl_FragColor = vec4(vCol, a);
}`;

const QVERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

const QFRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform float uPhoto, uFade;
uniform vec2 uRes;
varying vec2 vUv;
${FIELD}
void main(){
  vec4 tx = texture2D(uTex, vUv);
  vec2 ndc = gl_FragCoord.xy / uRes * 2. - 1.;
  float f = field(ndc);
  float a = tx.a * uPhoto * (1. - .78 * smoothstep(.02, .2, f));
  a *= mix(1., smoothstep(0., .16, vUv.y), uFade);
  if (a < .004) discard;
  gl_FragColor = vec4(tx.rgb, a);
}`;

function shuffle(n) {
  const a = new Uint32Array(n);
  for (let i = 0; i < n; i++) a[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// A cube whose six sides are each 4 x 4 tiles, every tile a regular grid of points
function cubePoints(N) {
  const g = Math.max(10, Math.floor(Math.sqrt(N / 96 / 2.6)));
  const len = 96 * g * g;
  const src = new Float32Array(len * 4);
  let n = 0;
  for (let f = 0; f < 6; f++) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
    const u = (a + 0.03 + ((i + 0.5) / g) * 0.94) / 4 - 0.5, v = (b + 0.03 + ((j + 0.5) / g) * 0.94) / 4 - 0.5, h = 0.4999;
    let x, y, z;
    if (f === 0) { x = h; y = u; z = v; } else if (f === 1) { x = -h; y = u; z = v; }
    else if (f === 2) { x = u; y = h; z = v; } else if (f === 3) { x = u; y = -h; z = v; }
    else if (f === 4) { x = u; y = v; z = h; } else { x = u; y = v; z = -h; }
    src[n++] = x; src[n++] = y; src[n++] = z; src[n++] = f;
  }
  const out = new Float32Array(N * 4);
  const order = shuffle(len);
  for (let i = 0; i < N; i++) {
    const k = order[i % len] * 4;
    out[i * 4] = src[k]; out[i * 4 + 1] = src[k + 1]; out[i * 4 + 2] = src[k + 2]; out[i * 4 + 3] = src[k + 3];
  }
  return out;
}

// An automation workflow drawn the way n8n draws one: steps, connectors, a branch, tools under the agent.
// Coordinates live in a 2 x 0.92 box and are scaled uniformly, so circles stay round.
function flowPoints(N) {
  const nodes = [
    { x: -0.80, y: 0.04, w: 0.105, h: 0.095, z: 0.12 },   // trigger
    { x: -0.37, y: 0.04, w: 0.175, h: 0.115, z: 0.34 },   // AI agent
    { x: 0.12, y: 0.33, w: 0.105, h: 0.095, z: -0.2 },    // look up
    { x: 0.12, y: -0.24, w: 0.105, h: 0.095, z: 0.1 },    // check
    { x: 0.56, y: 0.33, w: 0.105, h: 0.095, z: -0.2 },    // reply
    { x: 0.56, y: -0.24, w: 0.105, h: 0.095, z: 0.1 },    // hand to a person
  ];
  const subs = [{ x: -0.53, y: -0.36 }, { x: -0.37, y: -0.36 }, { x: -0.21, y: -0.36 }];
  const end = { x: 0.9, y: 0.04, r: 0.06, z: -0.08 };
  const links = [
    [nodes[0], nodes[1]], [nodes[1], nodes[2]], [nodes[1], nodes[3]], [nodes[2], nodes[4]], [nodes[3], nodes[5]],
    [nodes[4], end], [nodes[5], end],
  ];
  const out = new Float32Array(N * 4);
  let n = 0;
  const put = (x, y, z, u) => { if (n < N) { out[n * 4] = x; out[n * 4 + 1] = y; out[n * 4 + 2] = z; out[n * 4 + 3] = u; n++; } };
  const outline = (w, h, t) => {       // point on a rounded rectangle, t in 0..1, clockwise from the top edge
    const r = Math.min(w, h) * 0.38, sx = 2 * (w - r), sy = 2 * (h - r), arc = (Math.PI / 2) * r;
    let d = t * (2 * sx + 2 * sy + 4 * arc), a;
    if (d < sx) return [-(w - r) + d, h];
    d -= sx;
    if (d < arc) { a = Math.PI / 2 - d / r; return [w - r + Math.cos(a) * r, h - r + Math.sin(a) * r]; }
    d -= arc;
    if (d < sy) return [w, h - r - d];
    d -= sy;
    if (d < arc) { a = -d / r; return [w - r + Math.cos(a) * r, -(h - r) + Math.sin(a) * r]; }
    d -= arc;
    if (d < sx) return [w - r - d, -h];
    d -= sx;
    if (d < arc) { a = -Math.PI / 2 - d / r; return [-(w - r) + Math.cos(a) * r, -(h - r) + Math.sin(a) * r]; }
    d -= arc;
    if (d < sy) return [-w, -(h - r) + d];
    d -= sy;
    a = Math.PI - d / r;
    return [-(w - r) + Math.cos(a) * r, h - r + Math.sin(a) * r];
  };
  const nOutline = Math.floor(N * 0.3), nFill = Math.floor(N * 0.05), nLink = Math.floor(N * 0.5), nSub = Math.floor(N * 0.07);
  const unit = nOutline / (nodes.length + 1.6);
  nodes.forEach((nd) => {
    const cnt = Math.floor(unit * (nd.w > 0.15 ? 1.6 : 1));
    for (let i = 0; i < cnt; i++) {
      const inset = (i % 3) * 0.0045;
      const [x, y] = outline(nd.w - inset, nd.h - inset, (i + R() * 0.5) / cnt);
      put(nd.x + x, nd.y + y, nd.z, -2);
    }
  });
  for (let i = 0, cnt = Math.floor(unit); i < cnt; i++) {
    const a = (i / cnt) * TAU, r = end.r - (i % 3) * 0.0045;
    put(end.x + Math.cos(a) * r, end.y + Math.sin(a) * r, end.z, -2);
  }
  for (let i = 0; i < nFill; i++) {    // sparse dots inside each step
    const nd = nodes[i % nodes.length];
    const gx = (Math.floor(R() * 7) + 0.5) / 7 - 0.5, gy = (Math.floor(R() * 5) + 0.5) / 5 - 0.5;
    put(nd.x + gx * nd.w * 1.4, nd.y + gy * nd.h * 1.4, nd.z - 0.01, -1);
  }
  const perLink = Math.floor(nLink / links.length);
  links.forEach(([a, b]) => {
    const x0 = a.x + (a.w || a.r), y0 = a.y, x3 = b.x - (b.w || b.r), y3 = b.y, dx = (x3 - x0) * 0.55;
    for (let i = 0; i < perLink; i++) {
      const t = (i + R()) / perLink, m = 1 - t;
      const x = m * m * m * x0 + 3 * m * m * t * (x0 + dx) + 3 * m * t * t * (x3 - dx) + t * t * t * x3;
      const y = m * m * m * y0 + 3 * m * m * t * y0 + 3 * m * t * t * y3 + t * t * t * y3;
      put(x, y + (R() - 0.5) * 0.009, a.z + (b.z - a.z) * t - 0.02, x + 0.8);
    }
  });
  const perSub = Math.floor(nSub / subs.length), bottom = nodes[1].y - nodes[1].h;
  subs.forEach((s) => {
    for (let i = 0; i < perSub; i++) {
      if (i < perSub * 0.66) {
        const a = (i / (perSub * 0.66)) * TAU, r = 0.05 - (i % 2) * 0.0045;
        put(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, 0.34, -2);
      } else {                         // dashed stem up to the agent
        const t = (Math.floor(R() * 6) + R() * 0.5) / 6;
        put(s.x, s.y + 0.05 + (bottom - s.y - 0.05) * t, 0.34, -1);
      }
    }
  });
  while (n < N) {                      // spare particles double the connectors, a few drift as dust
    if (R() < 0.12) put((R() * 2 - 1) * 1.15, (R() * 2 - 1) * 0.75, (R() * 2 - 1) * 1.4, -3);
    else { const k = (nOutline + nFill + ((R() * nLink) | 0)) * 4; put(out[k], out[k + 1], out[k + 2], out[k + 3]); }
  }
  const order = shuffle(N), mixed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const s = order[i] * 4; mixed.set(out.subarray(s, s + 4), i * 4); }
  return mixed;
}

// Scattered data: table fragments floating at odd angles, with clear zones where text and portrait sit.
// The first M particles share the fragment cells; the spare ones become loose dust.
function chaosPoints(N, M, W, V, narrow) {
  const cells = [];
  const frags = narrow ? 90 : 170;
  for (let f = 0; f < frags; f++) {
    let rx, ry, z, tries = 0;
    do {
      rx = R() * 2 - 1; ry = R() * 2 - 1; z = -6.5 + R() * 7.1; tries++;
      const inText = narrow ? ry < -0.02 : (rx < 0 && Math.abs(ry) < 0.56);
      if (!inText) break;
    } while (tries < 40);
    const sc = (DIST - z) / DIST;
    const cx = rx * (W / 2) * sc * 1.1, cy = ry * (V / 2) * sc * 1.1;
    const rows = 4 + ((R() * 10) | 0), cols = 7 + ((R() * 18) | 0), sx = 0.07, sy = 0.047;
    const yaw = (R() - 0.5) * 1.9, pit = (R() - 0.5) * 1.3, rol = (R() - 0.5) * 1.0, seed = R();
    const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit), cr = Math.cos(rol), sr = Math.sin(rol);
    const badRow = R() < 0.5 ? ((R() * rows) | 0) : -1;
    for (let r = 0; r < rows; r++) {
      const shift = r === badRow ? sx * (0.4 + R()) : 0;       // one row out of line
      for (let c = 0; c < cols; c++) {
        if (R() < 0.13) continue;                               // missing values
        let x = (c - (cols - 1) / 2) * sx + shift, y = (r - (rows - 1) / 2) * sy, zz = 0, t;
        t = x * cr - y * sr; y = x * sr + y * cr; x = t;
        t = y * cp - zz * sp; zz = y * sp + zz * cp; y = t;
        t = x * cy1 + zz * sy1; zz = -x * sy1 + zz * cy1; x = t;
        cells.push(cx + x, cy + y, z + zz, seed);
      }
    }
  }
  const out = new Float32Array(N * 4), len = cells.length / 4, order = shuffle(len);
  for (let i = 0; i < M; i++) {
    const k = order[i % len] * 4;
    out[i * 4] = cells[k]; out[i * 4 + 1] = cells[k + 1]; out[i * 4 + 2] = cells[k + 2]; out[i * 4 + 3] = cells[k + 3];
  }
  for (let i = M; i < N; i++) {          // lanes of dust running along the direction of travel
    let x, y;
    do { x = (R() * 2 - 1) * W * 2.6; y = (R() * 2 - 1) * V * 2.6; } while (Math.hypot(x, y) < 1.3);
    out[i * 4] = x; out[i * 4 + 1] = y; out[i * 4 + 2] = R() * 90; out[i * 4 + 3] = R();
  }
  return out;
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ok = false;
    this.mode = 'journey';
    this.staticState = 0;
    this.phase = 0.999;
    this.target = 0;
    this.photo = 0;
    this.time = 0;
    this.slow = 3;           // seconds of slow easing after a mount
    this.visible = true;
    this.pointer = { x: 9, y: 9, inside: false, s: 0 };
    this.trail = [new THREE.Vector3(9, 9, 0), new THREE.Vector3(9, 9, 0), new THREE.Vector3(9, 9, 0)];
    this.tilt = new THREE.Vector2();
    this.band = { next: 1.4, t: -1 };
    this.narrow = false;
    this.travel = 0;          // how far the journey has moved, set by the page
    this.text = null;         // where the current caption sits, so dust stays off it
  }

  async init(imageUrl) {
    const canvas = this.canvas;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    this.renderer = renderer;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(this.dpr);
    renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
    this.camera.position.z = DIST;

    const img = new Image();
    img.src = imageUrl;
    await img.decode();
    this.ar = img.naturalWidth / img.naturalHeight;

    const small = Math.min(window.innerWidth, window.innerHeight) < 620 || window.innerWidth < 760;
    const rows = Math.max(300, Math.min(small ? 470 : 775, Math.round(window.innerHeight * (small ? 0.55 : 0.86))));
    const cols = Math.round(rows * this.ar);
    this.rows = rows;
    const cv = document.createElement('canvas');
    cv.width = cols; cv.height = rows;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, 0, 0, cols, rows);
    const data = cx.getImageData(0, 0, cols, rows).data;
    let M = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 127) M++;
    const N = M + Math.round(M * 0.11);
    this.N = N;
    this.M = M;
    const p0 = new Float32Array(N * 3), col = new Uint8Array(N * 4), seed = new Float32Array(N * 4);
    let n = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      if (data[k + 3] > 127) {
        p0[n * 3] = ((i + 0.5) / cols - 0.5) * this.ar;
        p0[n * 3 + 1] = 0.5 - (j + 0.5) / rows;
        col[n * 4] = data[k]; col[n * 4 + 1] = data[k + 1]; col[n * 4 + 2] = data[k + 2]; col[n * 4 + 3] = 255;
        n++;
      }
    }
    for (let i = 0; i < N * 4; i++) seed[i] = R();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p0, 3));
    geo.setAttribute('aP0', new THREE.BufferAttribute(p0, 3));
    geo.setAttribute('aP1', new THREE.BufferAttribute(cubePoints(N), 4));
    geo.setAttribute('aP2', new THREE.BufferAttribute(flowPoints(N), 4));
    this.chaosAttr = new THREE.BufferAttribute(new Float32Array(N * 4), 4);
    geo.setAttribute('aP3', this.chaosAttr);
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    geo.setAttribute('aCol', new THREE.BufferAttribute(col, 4, true));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);

    const shared = {
      uM: { value: this.trail },
      uBand: { value: new THREE.Vector4(0.86, -0.5, 9, 0) },
      uBandC: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uPhoto: { value: 0 },
    };
    this.u = {
      ...shared,
      uPhase: { value: this.phase }, uTime: { value: 0 }, uDpr: { value: this.dpr },
      uPx0: { value: 2 }, uPx5: { value: 2 },
      uView: { value: new THREE.Vector2(VH, VH) }, uTilt: { value: this.tilt },
      uL0: { value: new THREE.Vector4() }, uL5: { value: new THREE.Vector4() },
      uL2: { value: new THREE.Vector4() }, uL3: { value: new THREE.Vector4() },
      uTravel: { value: 0 }, uMaskP: { value: new THREE.Vector4(9, 9, 0, 0) }, uMaskT: { value: new THREE.Vector4(9, 9, 0, 0) },
      uMaskS: { value: new THREE.Vector2(0, 0) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthTest: false, depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;

    const tex = new THREE.Texture(img);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.needsUpdate = true;
    this.qu = { ...shared, uTex: { value: tex }, uFade: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } };
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(this.ar, 1),
      new THREE.ShaderMaterial({ uniforms: this.qu, vertexShader: QVERT, fragmentShader: QFRAG, transparent: true, depthTest: false, depthWrite: false }),
    );
    this.quad.renderOrder = 1;
    this.scene.add(this.quad, this.points);

    window.addEventListener('pointermove', (e) => this.onPointer(e), { passive: true });
    window.addEventListener('pointerdown', (e) => this.onPointer(e), { passive: true });
    document.addEventListener('pointerleave', () => { this.pointer.inside = false; });
    this.ro = new ResizeObserver(() => this.resize());
    this.io = new IntersectionObserver((es) => { this.visible = es[es.length - 1].isIntersecting; }, { threshold: 0 });
    this.ok = true;
    this.last = performance.now();
    const loop = (now) => { this.frame(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return true;
  }

  onPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    this.pointer.inside = Math.abs(x) <= 1 && Math.abs(y) <= 1;
    this.pointer.x = x; this.pointer.y = y;
    this.pointer.touch = e.pointerType === 'touch';
    this.pointer.at = performance.now();
  }

  // Put the canvas into a slot and choose what it plays there
  mount(slot, { mode = 'journey', state = 0 } = {}) {
    if (!this.ok) return;
    if (this.slot) { this.ro.unobserve(this.slot); this.io.unobserve(this.slot); }
    this.slot = slot;
    slot.appendChild(this.canvas);
    this.mode = mode;
    this.staticState = state;
    if (mode === 'journey') { this.phase = 0.999; this.target = 0; }
    else { this.phase = state === 0 ? 0.999 : state - 0.999; this.target = state; }
    this.photo = 0;
    this.slow = 3;
    this.band.next = this.time + 3.6;
    this.band.t = -1;
    this.ro.observe(slot);
    this.io.observe(slot);
    this.visible = true;
    this.resize();
  }

  setPhase(p) { if (this.mode === 'journey') this.target = Math.max(0, Math.min(MAX_STATE, p)); }

  // rect = [centre x, centre y, half width, half height] in -1..1 screen units; strength 0..1
  setText(rect, strength) { this.text = rect; this.textS = strength; }

  resize() {
    if (!this.ok || !this.slot) return;
    const w = this.slot.clientWidth, h = this.slot.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const V = VH, W = VH * aspect, narrow = this.isNarrow ? this.isNarrow() : aspect < 0.85;
    const bufH = h * this.dpr;
    this.u.uView.value.set(W, V);
    this.u.uAspect.value = aspect;
    this.qu.uRes.value.set(w * this.dpr, bufH);
    const journey = this.mode === 'journey';
    // portrait, hero
    let h0, x0, y0, f0;
    if (narrow) { h0 = V * 0.5; x0 = 0; y0 = V * 0.2; f0 = 1; }
    else {
      h0 = V * (journey ? 0.86 : 0.84);
      if (h0 * this.ar > W * 0.42) h0 = (W * 0.42) / this.ar;
      x0 = W * 0.235; y0 = -V / 2 - V * 0.025 + h0 / 2; f0 = 0;
    }
    this.L0 = [x0, y0, h0, f0];
    // portrait, centred between the two columns
    let h5 = narrow ? V * 0.36 : Math.min(V * 0.62, (W * 0.26) / this.ar);
    this.L5 = [0, narrow ? V * 0.24 : -V * 0.02, h5, 1];
    this.u.uL0.value.set(...this.L0);
    this.u.uL5.value.set(...this.L5);
    // whole pixels with overlap: some GPUs round point sizes, and a rounded-down size leaves seams
    this.u.uPx0.value = Math.ceil((h0 / this.rows) * (bufH / V) * 1.25);
    this.u.uPx5.value = Math.ceil((h5 / this.rows) * (bufH / V) * 1.25);
    // cube: left in the journey, right in a tab header
    const side = narrow ? Math.min(V * 0.21, W * 0.42) : Math.min(V * 0.33, W * 0.215);
    this.u.uL2.value.set(narrow ? 0 : W * (journey ? -0.225 : 0.235), narrow ? V * 0.2 : 0, side, 0);
    // workflow: right
    if (narrow) this.u.uL3.value.set(0, V * 0.2, Math.min(W * 0.44, (V * 0.2) / 0.46), 0);
    else this.u.uL3.value.set(W * 0.2, 0, Math.min(W * 0.235, (V * 0.3) / 0.46), 0);
    if (this.chaosKey !== `${narrow}|${aspect.toFixed(1)}`) {
      this.chaosKey = `${narrow}|${aspect.toFixed(1)}`;
      this.chaosAttr.array.set(chaosPoints(this.N, this.M, W, V, narrow));
      this.chaosAttr.needsUpdate = true;
    }
    this.narrow = narrow;
    this.V = V; this.W = W;
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.slot || !this.visible || document.hidden) return;
    this.time += dt;
    const u = this.u;
    // phase follows its target; slowly right after a mount so the entrance reads
    this.slow = Math.max(0, this.slow - dt);
    const rate = this.slow > 0 ? 1.7 : 9;
    this.phase += (this.target - this.phase) * (1 - Math.exp(-dt * rate));
    if (Math.abs(this.target - this.phase) < 0.0004) this.phase = this.target;
    u.uPhase.value = this.phase;
    u.uTime.value = this.time;

    // which portrait layout is in play, and whether the photo is in charge
    const at0 = Math.abs(this.phase) < 0.004, at5 = Math.abs(this.phase - 5) < 0.004;
    if (at0) this.pl = 0; else if (at5) this.pl = 5;
    const L = this.pl === 5 ? this.L5 : this.L0;
    const want = at0 || at5 ? 1 : 0;
    this.photo += (want - this.photo) * (1 - Math.exp(-dt * (want ? 4 : 40)));
    if (this.photo < 0.002) this.photo = 0;
    u.uPhoto.value = this.photo;
    u.uTravel.value = this.travel + this.time * (this.mode === 'journey' ? 0.5 : 1.3);
    const near = Math.max(0, 1 - Math.min(Math.abs(this.phase), Math.abs(this.phase - 5)) * 2.5);
    u.uMaskP.value.set((L[0] / this.W) * 2, (L[1] / this.V) * 2, (L[2] * this.ar) / this.W + 0.02, L[2] / this.V + 0.02);
    if (this.text) u.uMaskT.value.set(this.text[0], this.text[1], this.text[2], this.text[3]);
    u.uMaskS.value.set(near, this.text ? this.textS : 0);

    // pointer: a lagging trail of three samples
    const p = this.pointer;
    const live = p.inside && (!p.touch || now - p.at < 900);
    p.s += ((live ? 1 : 0) - p.s) * (1 - Math.exp(-dt * 5));
    const tr = this.trail, k = [1 - Math.exp(-dt * 14), 1 - Math.exp(-dt * 6), 1 - Math.exp(-dt * 3)];
    let px = p.x, py = p.y;
    for (let i = 0; i < 3; i++) {
      if (tr[i].x > 5) { tr[i].x = px; tr[i].y = py; }
      tr[i].x += (px - tr[i].x) * k[i]; tr[i].y += (py - tr[i].y) * k[i];
      tr[i].z = p.s * [1, 0.7, 0.45][i];
      px = tr[i].x; py = tr[i].y;
    }
    const tx = live ? p.x : 0, ty = live ? p.y : 0;
    this.tilt.x += (tx - this.tilt.x) * (1 - Math.exp(-dt * 3));
    this.tilt.y += (ty - this.tilt.y) * (1 - Math.exp(-dt * 3));

    // a band of light crosses the portrait now and then, so it is clear what it is made of
    const b = this.band, bu = u.uBand.value;
    if (this.photo > 0.95 && b.t < 0 && this.time > b.next && p.s < 0.2) b.t = 0;
    if (b.t >= 0) {
      b.t += dt / 2.1;
      const range = (L[2] / this.V) * 1.5;
      bu.z = -range + b.t * 2 * range;
      bu.w = 0.34 * Math.sin(Math.PI * Math.min(1, b.t));
      if (b.t >= 1) { b.t = -1; bu.w = 0; b.next = this.time + 6.5; }
    } else bu.w = 0;
    u.uBandC.value.set((L[0] / this.W) * 2, (L[1] / this.V) * 2);

    this.quad.visible = this.photo > 0;
    if (this.quad.visible) {
      this.quad.position.set(L[0], L[1], 0);
      this.quad.scale.set(L[2], L[2], 1);
      this.quad.rotation.set(-this.tilt.y * 0.07, this.tilt.x * 0.1, 0);
      this.qu.uFade.value = L[3];
    }
    this.renderer.render(this.scene, this.camera);
  }
}
