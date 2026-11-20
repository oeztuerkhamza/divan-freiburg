/* Divan Ocakbaşı – Feuer-Effekte
   - WebGL flames (#fire) whose height follows scroll position ("heat keys") and scroll speed
   - 2D embers / gold dust / fuse sparks (#embers)
   - scroll-scrubbed CSS variables: --p (burning headlines), --lit/--py (cards lit by the fire), --prog (fuse)
   Everything degrades: reduced motion = static page, no WebGL = CSS glow + embers. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = root.classList.contains('fx-reduced');
  var fuse = document.querySelector('.fuse');
  var heroEl = document.querySelector('.hero');
  var heroFixed = document.querySelector('.hero__fixed');
  var heroBg = document.querySelector('.hero__bg');
  var heroContent = document.querySelector('.hero__content');
  var heroScroll = document.querySelector('.hero__scroll');
  var introEl = document.querySelector('[data-intro]');

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function put(el, name, v) { var c = el._c || (el._c = {}); if (c[name] === v) return; c[name] = v; el.style.setProperty(name, v); }
  function st(el, prop, v) { var c = el._s || (el._s = {}); if (c[prop] === v) return; c[prop] = v; el.style[prop] = v; }

  var vw = window.innerWidth, vh = window.innerHeight, docH = 0;

  /* ---------- Reduced motion: only the fuse tracks scroll ---------- */
  if (reduce) {
    var rp = function () {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      put(fuse, '--prog', clamp(window.pageYOffset / max, 0, 1).toFixed(4));
    };
    rp();
    window.addEventListener('scroll', rp, { passive: true });
    return;
  }

  /* ---------- Scroll-scrubbed items ---------- */
  var burnItems = [].slice.call(document.querySelectorAll('.burn:not([data-intro])')).map(function (el) { return { el: el, top: 0, h: 0 }; });
  var litItems = [].slice.call(document.querySelectorAll('.dish, .cat, .about__media, .feature__img, .visit__photo')).map(function (el) { return { el: el, top: 0, h: 0 }; });
  var heroRange = 1, keys = [[0, 0.8], [1, 1]], fuseX = 0, fuseTop = 0, fuseH = 1;

  function measure() {
    var sy = window.pageYOffset;
    vw = window.innerWidth; vh = window.innerHeight;
    docH = Math.max(root.scrollHeight, document.body.scrollHeight);
    var all = burnItems.concat(litItems), i, r;
    for (i = 0; i < all.length; i++) { r = all[i].el.getBoundingClientRect(); all[i].top = r.top + sy; all[i].h = r.height; }
    heroRange = Math.max(1, heroEl.offsetHeight - vh);
    r = fuse.getBoundingClientRect(); fuseX = r.left + r.width / 2; fuseTop = r.top; fuseH = Math.max(1, r.height);

    /* heat keys: scroll position -> flame strength */
    var maxY = Math.max(1, docH - vh);
    keys = [[0, 0.8], [heroRange * 0.92, 1.75], [heroRange + vh * 0.75, 0.42]];
    var spec = [['.facts', 0.45], ['.about', 0.38], ['.specialties', 0.5], ['.feature', 1.15], ['.menu', 0.42], ['.lunch', 0.6], ['.visit', 0.4]];
    for (i = 0; i < spec.length; i++) {
      var s = document.querySelector(spec[i][0]);
      if (!s) continue;
      r = s.getBoundingClientRect();
      var mid = r.top + sy + r.height / 2 - vh / 2;
      if (mid > keys[keys.length - 1][0] + vh * 0.15 && mid < maxY - vh * 0.15) keys.push([mid, spec[i][1]]);
    }
    keys.push([Math.max(maxY, keys[keys.length - 1][0] + 1), 1.2]);
  }

  function heatAt(y) {
    var k = keys;
    if (y <= k[0][0]) return k[0][1];
    for (var i = 1; i < k.length; i++) {
      if (y <= k[i][0]) {
        var t = (y - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
        t = t * t * (3 - 2 * t);
        return lerp(k[i - 1][1], k[i][1], t);
      }
    }
    return k[k.length - 1][1];
  }

  /* ---------- WebGL flames ---------- */
  var VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res; uniform float u_time; uniform float u_heat; uniform float u_flare;',
    'float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.,0.)), f.x), mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.02 + vec2(3.1, 1.7); a *= 0.5; } return v; }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  float asp = u_res.x / u_res.y;',
    '  float heat = u_heat + u_flare;',
    '  float H = mix(0.15, 0.85, clamp(heat / 1.9, 0.0, 1.0)) * 0.75;',
    '  if (uv.y > H * 1.5) { gl_FragColor = vec4(0.0); return; }',
    '  float t = u_time;',
    '  float x = uv.x * asp;',
    /* flame height varies across the width */
    '  float env = 0.55 + 0.45 * noise(vec2(x * 1.2 + 4.0, t * 0.10));',
    '  env *= 0.70 + 0.55 * noise(vec2(x * 3.6 + 17.0, t * 0.25));',
    '  env = max(env, 0.30);',
    '  float y = uv.y / (H * env);',
    /* tall, rising, domain-warped tongues (x frequency > y frequency stretches them vertically) */
    '  vec2 q = vec2(x * 4.2, uv.y * 1.7 - t * 1.05);',
    '  float w = fbm(q * 0.6 + vec2(t * 0.1, -t * 0.3));',
    '  float n = fbm(q + vec2((w - 0.5) * 2.2, (w - 0.5) * 1.0));',
    '  float tongue = noise(vec2(x * 7.0 + (n - 0.5) * 2.5 * y, uv.y * 1.1 - t * 0.9));',
    '  float d = n + tongue * 0.28 - y * 1.35 - 0.02;',
    '  float a = smoothstep(0.0, 0.2, d);',
    '  float f = clamp(d * 1.25 + 0.03, 0.0, 1.0);',
    '  vec3 c1 = vec3(0.30, 0.02, 0.01), c2 = vec3(0.78, 0.12, 0.02), c3 = vec3(1.0, 0.45, 0.05), c4 = vec3(1.0, 0.74, 0.22), c5 = vec3(1.0, 0.92, 0.62);',
    '  vec3 col = mix(c1, c2, smoothstep(0.0, 0.25, f));',
    '  col = mix(col, c3, smoothstep(0.20, 0.50, f));',
    '  col = mix(col, c4, smoothstep(0.45, 0.72, f));',
    '  col = mix(col, c5, smoothstep(0.75, 1.00, f));',
    /* soft ambient glow around the fire */
    '  float glow = exp(-uv.y / (H * 0.62)) * 0.225 * clamp(heat, 0.0, 1.5);',
    '  float top = 1.0 - smoothstep(H * 0.9, H * 1.5, uv.y);',
    '  vec3 gcol = vec3(1.0, 0.36, 0.06);',
    '  glow *= top;',
    '  vec3 outc = col * a + gcol * glow * (1.0 - a);',
    '  float oa = clamp(a + glow * (1.0 - a), 0.0, 1.0);',
    '  gl_FragColor = vec4(outc, oa);',
    '}'
  ].join('\n');

  var fireCanvas = document.getElementById('fire');
  var gl = null, uRes, uTime, uHeat, uFlare, fireScale = vw < 700 ? 0.45 : 0.7, fw = 1, fh = 1;

  function initGL() {
    try {
      gl = fireCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    } catch (e) { gl = null; }
    if (!gl) return false;
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    var pg = gl.createProgram();
    gl.attachShader(pg, vs); gl.attachShader(pg, fs); gl.linkProgram(pg);
    if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) return false;
    gl.useProgram(pg);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pg, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uRes = gl.getUniformLocation(pg, 'u_res');
    uTime = gl.getUniformLocation(pg, 'u_time');
    uHeat = gl.getUniformLocation(pg, 'u_heat');
    uFlare = gl.getUniformLocation(pg, 'u_flare');
    gl.disable(gl.BLEND);
    return true;
  }

  var glOK = initGL();
  if (glOK) {
    root.classList.add('fx-gl');
    fireCanvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); glOK = false; root.classList.remove('fx-gl'); });
  }

  function sizeFire() {
    if (!glOK) return;
    fw = Math.max(2, Math.floor(vw * fireScale));
    fh = Math.max(2, Math.floor(vh * fireScale));
    fireCanvas.width = fw; fireCanvas.height = fh;
    gl.viewport(0, 0, fw, fh);
  }

  /* ---------- Embers, gold dust, fuse sparks (2D) ---------- */
  var ec = document.getElementById('embers');
  var ectx = ec.getContext('2d');
  var edpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function sprite(r, g, b) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.16, 'rgba(' + r + ',' + g + ',' + b + ',0.95)');
    gr.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',0.26)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return c;
  }
  var SP = [sprite(255, 214, 120), sprite(255, 128, 34), sprite(205, 48, 14), sprite(236, 205, 135)];

  function sizeEmbers() {
    ec.width = Math.floor(vw * edpr); ec.height = Math.floor(vh * edpr);
    ectx.setTransform(edpr, 0, 0, edpr, 0, 0);
  }

  var parts = [], dust = [], emberAcc = 0, sparkAcc = 0;
  var maxParts = 170, dustCount = 34;

  function seedDust() {
    dust.length = 0;
    for (var i = 0; i < dustCount; i++) dust.push({ x: Math.random() * vw, y: Math.random() * vh, s: 0.7 + Math.random() * 1.6, d: 0.3 + Math.random() * 0.9, seed: Math.random() * 6.283 });
  }
  function addEmber() {
    parts.push({ k: 0, x: Math.random() * vw, y: vh + 10, vx: (Math.random() - 0.5) * 20, vy: -(70 + Math.random() * 190),
      life: 0, max: 3.2 + Math.random() * 4.5, s: 0.8 + Math.random() * 2.1, seed: Math.random() * 6.283, d: 0.15 + Math.random() * 0.7 });
  }
  function addSpark(x, y) {
    parts.push({ k: 1, x: x, y: y, vx: -(30 + Math.random() * 120), vy: -30 + Math.random() * 90,
      life: 0, max: 0.45 + Math.random() * 0.7, s: 0.8 + Math.random() * 1.3, seed: Math.random() * 6.283, d: 0 });
  }

  function drawEmbers(dt, t, dy, heat, vel, prog) {
    ectx.clearRect(0, 0, vw, vh);
    ectx.globalCompositeOperation = 'lighter';
    var i, p, f, sz, a, idx;

    emberAcc += 0.75 * (4 + 26 * heat) *(1 + clamp(Math.abs(vel) / 1400, 0, 1.6)) * dt;
    while (emberAcc >= 1) { emberAcc -= 1; if (parts.length < maxParts) addEmber(); }
    sparkAcc += (9 + clamp(Math.abs(vel) / 40, 0, 70)) * dt;
    while (sparkAcc >= 1) { sparkAcc -= 1; if (parts.length < maxParts + 40) addSpark(fuseX, fuseTop + prog * fuseH); }

    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      f = p.life / p.max;
      if (p.k === 0) {
        p.x += (p.vx + Math.sin(t * 1.6 + p.seed * 6 + p.y * 0.006) * 34) * dt;
        p.y += p.vy * dt - dy * p.d;
        a = Math.min(1, f * 8) * (1 - f * f) * 0.95;
        idx = f < 0.3 ? 0 : f < 0.65 ? 1 : 2;
        sz = p.s * 3.4 * (1 - f * 0.45);
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt - dy * 0.3; p.vy += 90 * dt;
        a = (1 - f) * 0.95; idx = f < 0.4 ? 0 : 1; sz = p.s * 2.6;
      }
      ectx.globalAlpha = a;
      ectx.drawImage(SP[idx], p.x - sz, p.y - sz, sz * 2, sz * 2);
    }

    for (i = 0; i < dust.length; i++) {
      p = dust[i];
      p.y -= dy * p.d + 6 * dt * p.d;
      p.x += Math.sin(t * 0.4 + p.seed) * 8 * dt;
      if (p.y < -12) p.y += vh + 24; else if (p.y > vh + 12) p.y -= vh + 24;
      if (p.x < -12) p.x += vw + 24; else if (p.x > vw + 12) p.x -= vw + 24;
      a = (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.7 + p.seed * 9))) * (0.55 + 0.3 * Math.min(heat, 1.2));
      sz = p.s * 3;
      ectx.globalAlpha = a;
      ectx.drawImage(SP[3], p.x - sz, p.y - sz, sz * 2, sz * 2);
    }
    ectx.globalAlpha = 1;
  }

  /* ---------- Main loop ---------- */
  var last = performance.now(), lastY = window.pageYOffset, vel = 0, flare = 0, heat = 0.03, start = last + 250;
  var frames = 0, accDt = 0, tuned = 0;
  var fuseEl = fuse;

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (dt <= 0) { requestAnimationFrame(frame); return; }
    /* the pane / window can be resized without a resize event reaching us (or start at 0x0) */
    if (!resizeTimer && (window.innerWidth !== vw || Math.abs(window.innerHeight - vh) > 120)) onResize();
    var y = window.pageYOffset, dy = y - lastY; lastY = y;
    vel += (dy / dt - vel) * Math.min(1, dt * 6);
    flare += (clamp(Math.abs(vel) / 2800, 0, 0.5) - flare) * Math.min(1, dt * 5);

    var intro = smooth(0, 2400, now - start);
    heat += (heatAt(y) * intro - heat) * Math.min(1, dt * 2.6);

    /* hero: photo dissolves into the flames while you scroll through it */
    var hp = clamp(y / heroRange, 0, 1);
    if (y < heroRange + vh) {
      var op = 1 - smooth(0.3, 0.95, hp);
      st(heroFixed, 'opacity', op.toFixed(3));
      st(heroFixed, 'visibility', op < 0.01 ? 'hidden' : 'visible');
      st(heroBg, 'transform', 'translate3d(0,' + (-hp * 4).toFixed(2) + '%,0) scale(' + (1.04 + hp * 0.18).toFixed(3) + ')');
      var cop = 1 - smooth(0.12, 0.58, hp);
      st(heroContent, 'opacity', cop.toFixed(3));
      st(heroContent, 'transform', 'translate3d(0,' + (-hp * 90).toFixed(1) + 'px,0)');
      st(heroContent, 'pointerEvents', cop < 0.15 ? 'none' : '');
      st(heroScroll, 'opacity', (1 - smooth(0.0, 0.08, hp)).toFixed(2));
    } else {
      st(heroFixed, 'visibility', 'hidden');
    }

    /* headline ignites once, after the page has loaded */
    if (introEl) {
      var ip = clamp((now - start - 500) / 2800, 0, 1);
      put(introEl, '--p', (1 - Math.pow(1 - ip, 3)).toFixed(3));
    }

    /* burning headlines + cards lit by the fire */
    var i, it, r, p;
    for (i = 0; i < burnItems.length; i++) {
      it = burnItems[i];
      r = it.top - y;
      if (r > vh * 1.2 || r < -it.h - 200) { if (r < 0) put(it.el, '--p', '1'); continue; }
      p = clamp((vh * 0.97 - r) / (vh * 0.46), 0, 1);
      put(it.el, '--p', (Math.round(p * 200) / 200).toString());
    }
    for (i = 0; i < litItems.length; i++) {
      it = litItems[i];
      r = it.top + it.h / 2 - y;
      if (r > vh * 1.6 || r < -vh * 0.6) continue;
      var dd = Math.abs(r - vh * 0.58) / (vh * 0.62);
      put(it.el, '--lit', (Math.round((1 - smooth(0, 1, dd)) * 100) / 100).toString());
      put(it.el, '--py', (Math.round(clamp((r - vh * 0.5) / (vh * 0.7), -1, 1) * 100) / 100).toString());
    }

    var prog = clamp(y / Math.max(1, docH - vh), 0, 1);
    put(fuseEl, '--prog', prog.toFixed(4));

    var t = (now / 1000) % 2000;
    if (glOK) {
      gl.uniform2f(uRes, fw, fh);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uHeat, heat * (1 + 0.05 * Math.sin(t * 2.3) + 0.03 * Math.sin(t * 5.1)));
      gl.uniform1f(uFlare, flare);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    drawEmbers(dt, t, dy, heat, vel, prog);

    /* adaptive quality: drop flame resolution if the device struggles */
    if (glOK && tuned < 3) {
      frames++; accDt += dt;
      if (frames === 90) {
        if (accDt / frames > 0.03 && fireScale > 0.3) { fireScale = Math.max(0.3, fireScale * 0.78); sizeFire(); tuned++; }
        else { tuned = 3; }
        frames = 0; accDt = 0;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Setup ---------- */
  var resizeTimer = 0;
  function layout() {
    measure();
    maxParts = vw < 700 ? 70 : 170;
    dustCount = vw < 700 ? 16 : 34;
    sizeFire(); sizeEmbers();
    if (dust.length !== dustCount) seedDust();
  }
  function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { resizeTimer = 0; layout(); }, 150); }

  layout();
  window.addEventListener('resize', onResize);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(document.body);

  if (introEl) put(introEl, '--p', '0');
  requestAnimationFrame(frame);
})();
