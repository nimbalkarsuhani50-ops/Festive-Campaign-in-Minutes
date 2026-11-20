// Rich global festive poster generator — returns a 1080x1350 (4:5) or 1080x1920 (9:16) SVG string.
// Zero embedded text, zero external URLs — safe for direct DOM injection and high-res Canvas PNG export.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1080;

function getHeightForAspect(aspectRatio) {
  return aspectRatio === 'instagram_story' || aspectRatio === 'whatsapp_status'
    ? 1920
    : 1350;
}

const STYLE_THEMES = {
  'Festive Gold': {
    metalLight: '#fef08a',
    metalMid: '#eab308',
    metalDark: '#a16207',
    glow: '#f59e0b',
    accent: '#f28c38',
    accentSoft: '#fbbf24',
    frameOpacity: 0.44,
    isMinimal: false,
    darkOverrides: null,
  },
  Elegant: {
    metalLight: '#f5efe6',
    metalMid: '#d6be96',
    metalDark: '#8c6d46',
    glow: '#e2c799',
    accent: '#d99b66',
    accentSoft: '#e8d5b5',
    frameOpacity: 0.38,
    isMinimal: false,
    darkOverrides: {
      bgTop: '#0d0f17',
      bgMid: '#191826',
      bgBot: '#090a10',
    },
  },
  Vibrant: {
    metalLight: '#fde047',
    metalMid: '#f97316',
    metalDark: '#c2410c',
    glow: '#fb7185',
    accent: '#ec4899',
    accentSoft: '#38bdf8',
    frameOpacity: 0.46,
    isMinimal: false,
    darkOverrides: null,
  },
  Minimal: {
    metalLight: '#d4af37',
    metalMid: '#b45309',
    metalDark: '#78350f',
    glow: '#f59e0b',
    accent: '#c25e0a',
    accentSoft: '#1e293b',
    frameOpacity: 0.34,
    isMinimal: true,
    darkOverrides: null,
  },
};

function getTheme(stylePreset) {
  return STYLE_THEMES[stylePreset] || STYLE_THEMES['Festive Gold'];
}

function softGlow(id, dev = 22) {
  return `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${dev}"/></filter>`;
}

function grain(id, H, opacity = 0.042) {
  return `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${opacity} 0"/></filter><rect width="${W}" height="${H}" filter="url(#${id})"/>`;
}

function bokeh(rand, n, colors, rMin, rMax, yMax, yMin = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W;
    const y = yMin + rand() * (yMax - yMin);
    const r = rMin + rand() * (rMax - rMin);
    const c = colors[Math.floor(rand() * colors.length)];
    const o = 0.06 + rand() * 0.16;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${o.toFixed(2)}"/>`;
  }
  return s;
}

function sparkles(rand, n, color, yMin = 80, yMax = 1020) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = 60 + rand() * (W - 120);
    const y = yMin + rand() * (yMax - yMin);
    const r = 3 + rand() * 7;
    const op = 0.25 + rand() * 0.55;
    s += `<path d="M${x.toFixed(1)},${(y - r * 2.2).toFixed(1)} L${(x + r * 0.45).toFixed(1)},${(y - r * 0.45).toFixed(1)} L${(x + r * 2.2).toFixed(1)},${y.toFixed(1)} L${(x + r * 0.45).toFixed(1)},${(y + r * 0.45).toFixed(1)} L${x.toFixed(1)},${(y + r * 2.2).toFixed(1)} L${(x - r * 0.45).toFixed(1)},${(y + r * 0.45).toFixed(1)} L${(x - r * 2.2).toFixed(1)},${y.toFixed(1)} L${(x - r * 0.45).toFixed(1)},${(y - r * 0.45).toFixed(1)} Z" fill="${color}" opacity="${op.toFixed(2)}"/>`;
  }
  return s;
}

// 4 distinct architectural layout framing systems adapted to both 4:5 and 9:16 heights
function layoutFrame(variant, theme, rand, H) {
  const m = theme.metalMid;
  const ml = theme.metalLight;
  const op = theme.frameOpacity;
  const v = ((variant % 4) + 4) % 4;
  const safeBottom = H - Math.round(H * 0.16) - 24;
  const centerY = Math.round((safeBottom + 60) / 2);
  let s = '';

  if (v === 0) {
    // Scalloped Arch + Corner Lotus Rosettes
    s += `<path d="M74,${safeBottom} L74,360 Q74,140 540,74 Q1006,140 1006,360 L1006,${safeBottom}" fill="none" stroke="${m}" stroke-width="2.5" opacity="${op}"/>`;
    s += `<path d="M96,${safeBottom} L96,374 Q96,174 540,104 Q984,174 984,374 L984,${safeBottom}" fill="none" stroke="${ml}" stroke-width="1.2" opacity="${(op * 0.85).toFixed(2)}" stroke-dasharray="10 8"/>`;
    s += `<circle cx="540" cy="74" r="10" fill="${ml}" opacity="${(op * 1.4).toFixed(2)}"/>`;
    s += `<path d="M540,36 L552,60 L540,84 L528,60 Z" fill="${m}" opacity="${(op * 1.2).toFixed(2)}"/>`;
    [[112, 118], [968, 118]].forEach(([cx, cy]) => {
      s += `<g transform="translate(${cx},${cy})" opacity="${(op * 0.9).toFixed(2)}">`;
      for (let i = 0; i < 8; i++) {
        s += `<ellipse cx="0" cy="-22" rx="6" ry="14" fill="${ml}" transform="rotate(${i * 45})"/>`;
      }
      s += `<circle cx="0" cy="0" r="8" fill="${m}"/></g>`;
    });
  } else if (v === 1) {
    // Astrolabe Halo & 4-Corner Brass Brackets
    const cy = centerY + (rand() - 0.5) * 30;
    [340, 395, 450].forEach((r, idx) => {
      s += `<circle cx="540" cy="${cy.toFixed(0)}" r="${r}" fill="none" stroke="${idx % 2 ? ml : m}" stroke-width="${idx === 1 ? 2 : 1.2}" opacity="${(op * (0.75 - idx * 0.14)).toFixed(2)}" ${idx === 1 ? 'stroke-dasharray="6 12"' : ''}/>`;
    });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const x1 = 540 + Math.cos(a) * 355;
      const y1 = cy + Math.sin(a) * 355;
      const x2 = 540 + Math.cos(a) * 382;
      const y2 = cy + Math.sin(a) * 382;
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${ml}" stroke-width="1.6" opacity="${(op * 0.85).toFixed(2)}"/>`;
    }
    [[48, 48, 1, 1], [1032, 48, -1, 1], [48, safeBottom, 1, -1], [1032, safeBottom, -1, -1]].forEach(([x, y, sx, sy]) => {
      s += `<g transform="translate(${x},${y}) scale(${sx},${sy})" opacity="${(op * 1.15).toFixed(2)}">
        <path d="M0,78 L0,0 L78,0" fill="none" stroke="${m}" stroke-width="3"/>
        <path d="M16,58 L16,16 L58,16" fill="none" stroke="${ml}" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="5" fill="${ml}"/>
      </g>`;
    });
  } else if (v === 2) {
    // Sweeping Silk Ribbons & Diamond Lattice
    s += `<path d="M-80,${Math.round(H * 0.19)} C260,${Math.round(H * 0.09)} 740,${Math.round(H * 0.3)} 1160,${Math.round(H * 0.13)} L1160,${Math.round(H * 0.25)} C740,${Math.round(H * 0.42)} 260,${Math.round(H * 0.2)} -80,${Math.round(H * 0.31)} Z" fill="${m}" opacity="${(op * 0.24).toFixed(2)}"/>`;
    s += `<path d="M-80,${Math.round(H * 0.57)} C300,${Math.round(H * 0.47)} 780,${Math.round(H * 0.68)} 1160,${Math.round(H * 0.52)} L1160,${Math.round(H * 0.61)} C780,${Math.round(H * 0.77)} 300,${Math.round(H * 0.56)} -80,${Math.round(H * 0.66)} Z" fill="${ml}" opacity="${(op * 0.16).toFixed(2)}"/>`;
    s += `<rect x="44" y="44" width="${W - 88}" height="${safeBottom - 44}" rx="20" fill="none" stroke="${m}" stroke-width="1.6" opacity="${(op * 0.8).toFixed(2)}"/>`;
    for (let y = 180; y <= safeBottom - 120; y += 130) {
      s += `<path d="M44,${y - 8} L52,${y} L44,${y + 8} L36,${y} Z" fill="${ml}" opacity="${op}"/>`;
      s += `<path d="M${W - 44},${y - 8} L${W - 36},${y} L${W - 44},${y + 8} L${W - 52},${y} Z" fill="${ml}" opacity="${op}"/>`;
    }
  } else {
    // Architectural Gallery Double-Frame with Radial Sunbeams
    s += `<rect x="42" y="42" width="${W - 84}" height="${safeBottom - 42}" fill="none" stroke="${m}" stroke-width="2" opacity="${(op * 0.9).toFixed(2)}"/>`;
    s += `<rect x="60" y="60" width="${W - 120}" height="${safeBottom - 78}" fill="none" stroke="${ml}" stroke-width="1" opacity="${(op * 0.65).toFixed(2)}"/>`;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x2 = 540 + Math.cos(a) * 680;
      const y2 = centerY + Math.sin(a) * 680;
      s += `<line x1="540" y1="${centerY}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${ml}" stroke-width="1" opacity="${(op * 0.25).toFixed(2)}"/>`;
    }
    [[60, 60], [W - 60, 60], [60, safeBottom - 18], [W - 60, safeBottom - 18]].forEach(([x, y]) => {
      s += `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" fill="none" stroke="${ml}" stroke-width="2" opacity="${op}" transform="rotate(45 ${x} ${y})"/>`;
    });
  }

  return s;
}

// Reusable sculpted festive elements
function diya(cx, cy, s, body = '#b5651d', rim = '#f5b942', shadow = '#7c2d12') {
  const g = `translate(${cx},${cy}) scale(${s})`;
  return `<g transform="${g}">
    <ellipse cx="0" cy="-68" rx="36" ry="44" fill="#ffb63d" opacity="0.45" filter="url(#glow)"/>
    <path d="M0,-106 C14,-84 20,-66 0,-44 C-20,-66 -14,-84 0,-106 Z" fill="url(#flame)"/>
    <path d="M0,-88 C7,-74 10,-63 0,-49 C-10,-63 -7,-74 0,-88 Z" fill="#fff7d6"/>
    <rect x="-3.5" y="-47" width="7" height="11" rx="2.5" fill="#451a03"/>
    <path d="M-64,-36 C-64,-2 -34,20 0,20 C34,20 64,-2 64,-36 C44,-20 -44,-20 -64,-36 Z" fill="${body}"/>
    <path d="M-50,-14 C-24,14 24,14 50,-14 C34,6 -34,6 -50,-14 Z" fill="${shadow}" opacity="0.35"/>
    <path d="M-64,-36 C-44,-20 44,-20 64,-36 C64,-29 61,-24 56,-20 C32,-7 -32,-7 -56,-20 C-61,-24 -64,-29 -64,-36 Z" fill="${rim}"/>
    <ellipse cx="0" cy="-34" rx="58" ry="10" fill="#7a3d12"/>
    <ellipse cx="0" cy="-36" rx="50" ry="7.5" fill="#3d1f08"/>
    <path d="M-24,18 L24,18 L30,28 L-30,28 Z" fill="${rim}"/>
  </g>`;
}

function kandil(cx, cy, s, colA = '#f59e0b', colB = '#dc2626', rim = '#fde047') {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <line x1="0" y1="-160" x2="0" y2="0" stroke="${rim}" stroke-width="2.5" opacity="0.75"/>
    <circle cx="0" cy="56" r="44" fill="${colA}" opacity="0.32" filter="url(#glow)"/>
    <polygon points="0,0 -38,44 0,126 38,44" fill="${colA}" opacity="0.92"/>
    <polygon points="0,0 -38,44 0,126 38,44" fill="none" stroke="${rim}" stroke-width="3"/>
    <polygon points="0,18 -21,46 0,104 21,46" fill="${colB}" opacity="0.9"/>
    <polygon points="0,34 -9,48 0,78 9,48" fill="#fffbeb" opacity="0.85"/>
    <line x1="-18" y1="126" x2="-24" y2="174" stroke="${rim}" stroke-width="2"/>
    <line x1="0" y1="126" x2="0" y2="188" stroke="${rim}" stroke-width="2.5"/>
    <line x1="18" y1="126" x2="24" y2="174" stroke="${rim}" stroke-width="2"/>
    <circle cx="0" cy="192" r="5.5" fill="${rim}"/>
    <circle cx="-24" cy="177" r="4" fill="${colA}"/><circle cx="24" cy="177" r="4" fill="${colA}"/>
  </g>`;
}

function garland(x1, y1, x2, y2, sag, n, seed, cols) {
  const rand = mulberry32(seed);
  const palette = cols || ['#f59e0b', '#fbbf24', '#ea580c', '#f97316', '#fde047'];
  let s = `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${Math.max(y1, y2) + sag} ${x2},${y2}" stroke="#3f6212" stroke-width="5" fill="none" opacity="0.75"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + sag) + t * t * y2;
    const r = 13 + rand() * 9;
    const c = palette[Math.floor(rand() * palette.length)];
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}"/>`;
    s += `<circle cx="${(x - r * 0.25).toFixed(1)}" cy="${(y - r * 0.25).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="#fffbeb" opacity="0.38"/>`;
    if (i % 3 === 0) {
      s += `<ellipse cx="${(x + 2).toFixed(1)}" cy="${(y + r + 10).toFixed(1)}" rx="5" ry="9" fill="#fef3c7" opacity="0.9"/>`;
    }
  }
  return s;
}

function pookalam(cx, cy, rings, seed) {
  const rand = mulberry32(seed);
  let s = '';
  const palettes = [
    ['#fde047', '#fbbf24'],
    ['#fb923c', '#ea580c'],
    ['#f472b6', '#db2777'],
    ['#ffffff', '#fef3c7'],
    ['#a3e635', '#65a30d'],
    ['#f87171', '#dc2626'],
    ['#f59e0b', '#d97706'],
  ];
  rings.forEach((ring, ri) => {
    const col = palettes[ri % palettes.length];
    for (let i = 0; i < ring.petals; i++) {
      const a = (i / ring.petals) * Math.PI * 2 + (ri % 2 ? Math.PI / ring.petals : 0);
      const px = cx + Math.cos(a) * ring.r;
      const py = cy + Math.sin(a) * ring.r;
      const deg = (a * 180) / Math.PI + 90;
      s += `<g transform="translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${deg.toFixed(1)})"><ellipse cx="0" cy="0" rx="${ring.pw || 16}" ry="${ring.pl || 34}" fill="${col[Math.floor(rand() * 2)]}" opacity="0.96"/></g>`;
    }
  });
  s += `<circle cx="${cx}" cy="${cy}" r="34" fill="#fbbf24"/><circle cx="${cx}" cy="${cy}" r="20" fill="#dc2626"/><circle cx="${cx}" cy="${cy}" r="9" fill="#fef3c7"/>`;
  return s;
}

function snowflake(cx, cy, r, col = '#e0f2fe', op = 0.85) {
  let s = `<g stroke="${col}" stroke-width="${Math.max(2, r / 10)}" opacity="${op}" stroke-linecap="round">`;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    s += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    const bx = cx + Math.cos(a) * r * 0.58;
    const by = cy + Math.sin(a) * r * 0.58;
    const a1 = a + 0.52;
    const a2 = a - 0.52;
    s += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + Math.cos(a1) * r * 0.32).toFixed(1)}" y2="${(by + Math.sin(a1) * r * 0.32).toFixed(1)}"/>`;
    s += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + Math.cos(a2) * r * 0.32).toFixed(1)}" y2="${(by + Math.sin(a2) * r * 0.32).toFixed(1)}"/>`;
  }
  return s + '</g>';
}

function stringLights(x1, y1, x2, y2, sag, n, cols) {
  const palette = cols || ['#fbbf24', '#f87171', '#4ade80', '#60a5fa', '#f472b6'];
  let s = `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${Math.max(y1, y2) + sag} ${x2},${y2}" stroke="#14532d" stroke-width="4" fill="none"/>`;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + sag) + t * t * y2;
    const c = palette[i % palette.length];
    s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 16).toFixed(1)}" stroke="#14532d" stroke-width="3"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${(y + 26).toFixed(1)}" r="18" fill="${c}" opacity="0.38" filter="url(#glow)"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${(y + 26).toFixed(1)}" r="9" fill="${c}"/>`;
  }
  return s;
}

function fanoos(cx, cy, s, col = '#f59e0b', rim = '#fde68a') {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <line x1="0" y1="-150" x2="0" y2="-62" stroke="${rim}" stroke-width="3" opacity="0.8"/>
    <circle cx="0" cy="-58" r="6" fill="${col}"/>
    <circle cx="0" cy="4" r="46" fill="#fbbf24" opacity="0.28" filter="url(#glow)"/>
    <path d="M-36,-52 L36,-52 L28,-38 L-28,-38 Z" fill="${col}"/>
    <path d="M-28,-38 C-46,-10 -46,22 -28,46 L28,46 C46,22 46,-10 28,-38 Z" fill="url(#lanternGlow)"/>
    <path d="M-28,-38 C-46,-10 -46,22 -28,46 L28,46 C46,22 46,-10 28,-38 Z" fill="none" stroke="${rim}" stroke-width="3.5"/>
    <line x1="-14" y1="-36" x2="-14" y2="44" stroke="${col}" stroke-width="2.5" opacity="0.85"/>
    <line x1="14" y1="-36" x2="14" y2="44" stroke="${col}" stroke-width="2.5" opacity="0.85"/>
    <line x1="0" y1="-38" x2="0" y2="46" stroke="${col}" stroke-width="2.5" opacity="0.85"/>
    <path d="M-22,46 L22,46 L14,62 L-14,62 Z" fill="${col}"/>
    <path d="M0,62 L0,84" stroke="${rim}" stroke-width="2.5"/>
    <circle cx="0" cy="88" r="5" fill="${rim}"/>
  </g>`;
}

function fireworkBurst(cx, cy, r, cols, seed) {
  const rand = mulberry32(seed);
  let s = `<circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="${cols[0]}" opacity="0.22" filter="url(#glow)"/>`;
  const rays = 22;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + (rand() - 0.5) * 0.1;
    const len = r * (0.65 + rand() * 0.35);
    const x2 = cx + Math.cos(a) * len;
    const y2 = cy + Math.sin(a) * len;
    const c = cols[i % cols.length];
    s += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="2.6" stroke-linecap="round" opacity="0.85"/>`;
    s += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="4.5" fill="${c}"/>`;
  }
  return s;
}

function svgWrap(defs, body, H, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}${softGlow('glow')}${extraDefs}</defs>${body}</svg>`;
}

// Wraps 1080x1350 hero artwork so it sits gracefully centered inside 1080x1920 vertical ratios
function heroGroup(H, inner, extraShift = 0) {
  if (H <= 1350) return inner;
  const dy = Math.round((H - 1350) * 0.42) + extraShift;
  return `<g transform="translate(0,${dy})">${inner}</g>`;
}

const POSTERS = {
  diwali(seed = 7, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f4efe6' : theme.darkOverrides?.bgTop || (theme.accent === '#ec4899' ? '#1e0838' : '#140826');
    const bgMid = theme.isMinimal ? '#ebe2d3' : theme.darkOverrides?.bgMid || (theme.accent === '#ec4899' ? '#4a1045' : '#351034');
    const bgBot = theme.isMinimal ? '#dfd3be' : theme.darkOverrides?.bgBot || '#0c0519';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.52" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.55" r="0.6">
        <stop offset="0" stop-color="${theme.glow}" stop-opacity="${theme.isMinimal ? 0.22 : 0.34}"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="0.45" stop-color="#fbbf24"/><stop offset="1" stop-color="#ea580c"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    if (!theme.isMinimal) {
      for (let i = 0; i < 75; i++) {
        body += `<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * (H - 350)).toFixed(0)}" r="${(0.8 + rand() * 2.2).toFixed(1)}" fill="${theme.metalLight}" opacity="${(0.2 + rand() * 0.55).toFixed(2)}"/>`;
      }
      body += bokeh(rand, 32, [theme.glow, theme.metalLight, theme.accent], 12, 52, H - 180, 180);
    }

    let hero = '';
    const mandalaCy = 700 + (seed % 2) * 35;
    for (let r = 0; r < 5; r++) {
      const rad = 110 + r * 68;
      hero += `<circle cx="540" cy="${mandalaCy}" r="${rad}" fill="none" stroke="${[theme.metalLight, theme.accent, '#dc2626', theme.metalMid, '#f472b6'][r]}" stroke-width="${r === 2 ? 4 : 2.5}" opacity="${theme.isMinimal ? 0.45 : 0.65}" ${r % 2 ? 'stroke-dasharray="10 10"' : ''}/>`;
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = 540 + Math.cos(a) * 230;
      const py = mandalaCy + Math.sin(a) * 230;
      const deg = (a * 180) / Math.PI + 90;
      hero += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="14" ry="34" fill="${i % 2 ? theme.accent : theme.metalMid}" opacity="${theme.isMinimal ? 0.55 : 0.72}" transform="rotate(${deg.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`;
    }

    const lanternSets = [
      [[155, 110, 0.95], [345, 72, 0.78], [735, 72, 0.78], [925, 110, 0.95]],
      [[190, 86, 1.0], [890, 86, 1.0], [540, 58, 0.85]],
    ];
    lanternSets[seed % 2].forEach(([x, y, sc], idx) => {
      hero += kandil(x, y, sc, idx % 2 ? theme.accent : theme.metalMid, idx % 2 ? '#be123c' : '#dc2626', theme.metalLight);
    });

    for (let r = 0; r < 4; r++) {
      hero += `<path d="M${-80 + r * 32},1255 A${620 - r * 62},${340 - r * 36} 0 0 1 ${W + 80 - r * 32},1255" fill="none" stroke="${['#dc2626', theme.metalMid, theme.metalLight, theme.accent][r]}" stroke-width="9" opacity="${theme.isMinimal ? 0.65 : 0.88}"/>`;
    }

    hero += diya(540, 880, 1.85, '#9a4d12', theme.metalMid);
    hero += diya(255, 995, 1.25, '#b5651d', theme.metalMid);
    hero += diya(825, 995, 1.25, '#b5651d', theme.metalMid);
    hero += diya(415, 1060, 1.05, '#8a4a16', theme.metalLight);
    hero += diya(665, 1060, 1.05, '#8a4a16', theme.metalLight);

    body += heroGroup(H, hero);
    body += sparkles(rand, theme.isMinimal ? 14 : 30, theme.metalLight, 180, H - 320);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  ganesh(seed = 21, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f2efe6' : theme.darkOverrides?.bgTop || '#042f24';
    const bgMid = theme.isMinimal ? '#e7e2d3' : theme.darkOverrides?.bgMid || '#084c36';
    const bgBot = theme.isMinimal ? '#dbd3be' : theme.darkOverrides?.bgBot || '#031d16';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.46" r="0.58">
        <stop offset="0" stop-color="${theme.glow}" stop-opacity="0.26"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.metalLight}"/><stop offset="0.5" stop-color="${theme.metalMid}"/><stop offset="1" stop-color="${theme.metalDark}"/>
      </linearGradient>
      <pattern id="mandala" width="120" height="120" patternUnits="userSpaceOnUse">
        <circle cx="60" cy="60" r="46" fill="none" stroke="${theme.metalMid}" stroke-width="1.3" opacity="${theme.isMinimal ? 0.12 : 0.18}"/>
        <circle cx="60" cy="60" r="26" fill="none" stroke="${theme.metalLight}" stroke-width="1.1" opacity="${theme.isMinimal ? 0.1 : 0.15}"/>
        <circle cx="60" cy="60" r="6" fill="${theme.metalMid}" opacity="0.14"/>
      </pattern>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#mandala)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    const gCols = theme.accent === '#ec4899' ? ['#f59e0b', '#ec4899', '#fbbf24', '#f97316'] : null;
    body += garland(-20, 46, 380, 34, 145, 16, seed + 5, gCols);
    body += garland(340, 34, 740, 44, 165, 17, seed + 9, gCols);
    body += garland(700, 44, 1100, 36, 145, 16, seed + 13, gCols);
    for (let x = 50; x < W; x += 66) {
      body += `<path d="M${x},${120 + (x % 3) * 8} q12,38 -7,58 q-14,-28 7,-58 Z" fill="#15803d" opacity="0.88"/>`;
    }

    if (!theme.isMinimal) {
      body += bokeh(rand, 24, [theme.metalLight, theme.metalMid], 8, 32, H - 240, 260);
    }

    let hero = '';
    hero += `<circle cx="540" cy="690" r="240" fill="none" stroke="${theme.metalLight}" stroke-width="2" opacity="0.35" stroke-dasharray="6 10"/>`;
    hero += `<circle cx="540" cy="690" r="210" fill="${theme.glow}" opacity="0.12" filter="url(#glow)"/>`;

    const arc = (ry, n, r, y0) => {
      let g = '';
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = 145 + t * (W - 290);
        const y = y0 + Math.sin(t * Math.PI) * ry;
        g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#gold)" stroke="#7c2d12" stroke-width="1"/>`;
      }
      return g;
    };
    hero += arc(150, 28, 12, 470);
    hero += arc(220, 32, 14, 455);
    hero += arc(295, 36, 16, 440);

    hero += `<g transform="translate(540,805)">
      <path d="M0,-68 C58,-44 78,12 0,98 C-78,12 -58,-44 0,-68 Z" fill="url(#gold)" stroke="#7c2d12" stroke-width="3.5"/>
      <circle cx="0" cy="8" r="32" fill="#be123c" stroke="${theme.metalLight}" stroke-width="5"/>
      <circle cx="0" cy="8" r="12" fill="#ffe4e6"/>
      <circle cx="0" cy="-96" r="11" fill="url(#gold)"/>
      <circle cx="-18" cy="118" r="7.5" fill="url(#gold)"/><circle cx="18" cy="118" r="7.5" fill="url(#gold)"/><circle cx="0" cy="132" r="8" fill="url(#gold)"/>
    </g>`;

    const modak = (cx, cy, s) => `<g transform="translate(${cx},${cy}) scale(${s})">
      <path d="M0,-62 C44,-36 56,8 36,38 C16,64 -16,64 -36,38 C-56,8 -44,-36 0,-62 Z" fill="url(#gold)" stroke="#92400e" stroke-width="3.5"/>
      <path d="M0,-62 C13,-30 17,6 0,48 M0,-62 C-13,-30 -17,6 0,48 M0,-62 C32,-34 42,2 32,34 M0,-62 C-32,-34 -42,2 -32,34" stroke="#92400e" stroke-width="2.5" fill="none" opacity="0.65"/>
    </g>`;
    hero += modak(155, 1020, 1.2) + modak(925, 1020, 1.2) + modak(265, 1070, 0.85) + modak(815, 1070, 0.85);

    body += heroGroup(H, hero);
    body += sparkles(rand, 20, theme.metalLight, 200, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  christmas(seed = 33, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f4f2eb' : theme.darkOverrides?.bgTop || '#072418';
    const bgMid = theme.isMinimal ? '#eae6da' : theme.darkOverrides?.bgMid || '#103c28';
    const bgBot = theme.isMinimal ? '#ded8c8' : theme.darkOverrides?.bgBot || '#061a11';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.6" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.34" r="0.6">
        <stop offset="0" stop-color="${theme.glow}" stop-opacity="0.22"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cakeG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed + 2, theme, rand, H);

    if (!theme.isMinimal) {
      for (let i = 0; i < 85; i++) {
        body += `<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * (H - 350)).toFixed(0)}" r="${(1 + rand() * 2.5).toFixed(1)}" fill="#ffffff" opacity="${(0.18 + rand() * 0.5).toFixed(2)}"/>`;
      }
    }

    body += stringLights(-10, 74, 545, 52, 125, 8);
    body += stringLights(535, 52, 1090, 78, 125, 8);

    [[110, 140, 1], [970, 140, -1]].forEach(([bx, by, dir]) => {
      body += `<g transform="translate(${bx},${by}) scale(${dir},1)">
        <path d="M-80,0 Q20,-35 120,24 Q20,38 -80,0 Z" fill="#14532d" opacity="0.9"/>
        <path d="M-60,30 Q30,10 110,72 Q15,72 -60,30 Z" fill="#166534" opacity="0.85"/>
        <circle cx="40" cy="24" r="8" fill="#dc2626"/><circle cx="58" cy="34" r="7" fill="#ef4444"/><circle cx="32" cy="40" r="6" fill="#b91c1c"/>
      </g>`;
    });

    const ornament = (cx, cy, r, c) =>
      `<line x1="${cx}" y1="0" x2="${cx}" y2="${cy - r}" stroke="${theme.metalLight}" stroke-width="2" opacity="0.8"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>` +
      `<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.3}" fill="#ffffff" opacity="0.45"/>` +
      `<rect x="${cx - 7}" y="${cy - r - 9}" width="14" height="10" rx="3" fill="${theme.metalMid}"/>`;
    body += ornament(175, 310, 36, '#dc2626') + ornament(895, 295, 42, theme.metalMid) + ornament(710, 385, 28, '#e11d48') + ornament(335, 415, 26, theme.accent);

    const flakeColor = theme.isMinimal ? '#64748b' : '#e0f2fe';
    let hero = '';
    [[145, 610, 42], [925, 650, 48], [295, 760, 32], [795, 795, 36], [540, 490, 34]].forEach(([x, y, r]) => {
      hero += snowflake(x, y, r, flakeColor, theme.isMinimal ? 0.45 : 0.82);
    });

    hero += `<path d="M0,990 Q240,930 480,975 Q740,1020 1080,955 L1080,1520 L0,1520 Z" fill="#f8fafc"/>`;
    hero += `<path d="M0,1055 Q300,1010 580,1045 Q860,1080 1080,1030 L1080,1520 L0,1520 Z" fill="#e2e8f0" opacity="0.78"/>`;

    hero += `<g transform="translate(540,955)">
      <ellipse cx="0" cy="118" rx="195" ry="26" fill="#cbd5e1"/>
      <rect x="-152" y="-32" width="304" height="142" rx="18" fill="url(#cakeG)"/>
      <path d="M-152,-24 L152,-24 L152,8 C130,34 110,-2 90,18 C70,38 50,0 30,20 C10,40 -10,2 -30,22 C-50,42 -70,4 -90,20 C-110,36 -130,0 -152,16 Z" fill="#fff7ed"/>
      <rect x="-162" y="104" width="324" height="16" rx="8" fill="#f8fafc"/>
      <rect x="-10" y="-114" width="20" height="88" rx="8" fill="${theme.metalMid}"/>
      <ellipse cx="0" cy="-126" rx="18" ry="24" fill="#ffb63d" filter="url(#glow)" opacity="0.85"/>
      <path d="M0,-142 C9,-128 10,-120 0,-108 C-10,-120 -9,-128 0,-142 Z" fill="#fde047"/>
      <circle cx="-72" cy="-42" r="13" fill="#16a34a"/><circle cx="72" cy="-42" r="13" fill="#16a34a"/><circle cx="0" cy="-46" r="14" fill="#dc2626"/>
    </g>`;

    hero += `<g transform="translate(230,1020)">
      <circle cx="0" cy="-58" r="26" fill="#b45309"/><rect x="-20" y="-38" width="40" height="58" rx="16" fill="#b45309"/>
      <rect x="-52" y="-30" width="32" height="14" rx="7" fill="#b45309"/><rect x="20" y="-30" width="32" height="14" rx="7" fill="#b45309"/>
      <rect x="-20" y="16" width="16" height="34" rx="8" fill="#b45309"/><rect x="4" y="16" width="16" height="34" rx="8" fill="#b45309"/>
      <circle cx="-9" cy="-62" r="3.5" fill="#fff"/><circle cx="9" cy="-62" r="3.5" fill="#fff"/>
      <path d="M-8,-50 Q0,-44 8,-50" stroke="#fff" stroke-width="3" fill="none"/>
    </g>`;
    hero += `<g transform="translate(860,1030) rotate(12)"><path d="M0,0 L0,-110 C0,-140 44,-140 44,-112" stroke="#dc2626" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M0,0 L0,-110 C0,-140 44,-140 44,-112" stroke="#fff" stroke-width="22" fill="none" stroke-linecap="round" stroke-dasharray="16 20"/></g>`;

    body += heroGroup(H, hero);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  navratri(seed = 41, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f5eff8' : theme.darkOverrides?.bgTop || '#2e0654';
    const bgMid = theme.isMinimal ? '#ebe1f2' : theme.darkOverrides?.bgMid || '#6b1bb8';
    const bgBot = theme.isMinimal ? '#dfd1eb' : theme.darkOverrides?.bgBot || '#360442';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.52" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.48" r="0.6">
        <stop offset="0" stop-color="${theme.glow}" stop-opacity="0.32"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/>
      </radialGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed + 3, theme, rand, H);

    let hero = '';
    const cols = ['#f472b6', '#fbbf24', '#fb923c', '#e879f9', '#fde047'];
    for (let ring = 0; ring < 5; ring++) {
      const r = 135 + ring * 92;
      const n = 12 + ring * 8;
      hero += `<circle cx="540" cy="545" r="${r}" fill="none" stroke="${theme.metalLight}" stroke-width="1.5" opacity="${theme.isMinimal ? 0.35 : 0.22}"/>`;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.35 + (seed % 5) * 0.1;
        const x = 540 + Math.cos(a) * r;
        const y = 545 + Math.sin(a) * r * 0.92;
        hero += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(20 - ring * 1.4).toFixed(0)}" fill="${cols[(i + ring) % 5]}"/>`;
        hero += `<circle cx="${(x - 4).toFixed(1)}" cy="${(y - 5).toFixed(1)}" r="${(6.5 - ring * 0.4).toFixed(0)}" fill="#ffffff" opacity="0.48"/>`;
      }
    }

    hero += `<g transform="translate(540,545)">
      <circle cx="0" cy="0" r="85" fill="${theme.glow}" opacity="0.42" filter="url(#glow)"/>
      <path d="M0,-76 C52,-50 66,8 36,44 C14,72 -14,72 -36,44 C-66,8 -52,-50 0,-76 Z" fill="${theme.metalMid}" stroke="#92400e" stroke-width="4.5"/>
      <path d="M0,-76 C14,-42 18,-2 0,56 M0,-76 C-14,-42 -18,-2 0,56 M0,-76 C36,-42 46,-4 34,40 M0,-76 C-36,-42 -46,-4 -34,40" stroke="#92400e" stroke-width="3" fill="none" opacity="0.65"/>
      <circle cx="-18" cy="-16" r="5" fill="#fffbeb"/><circle cx="18" cy="-16" r="5" fill="#fffbeb"/><circle cx="0" cy="10" r="6" fill="#fffbeb"/>
    </g>`;

    const stick = (rot) =>
      `<g transform="translate(540,1010) rotate(${rot})">
        <rect x="-340" y="-16" width="680" height="32" rx="16" fill="${theme.metalMid}"/>
        <rect x="-340" y="-16" width="90" height="32" rx="16" fill="#dc2626"/>
        <rect x="250" y="-16" width="90" height="32" rx="16" fill="#dc2626"/>
        <circle cx="-195" cy="0" r="9" fill="#fde047"/><circle cx="195" cy="0" r="9" fill="#fde047"/>
        <circle cx="-100" cy="0" r="6" fill="#7c2d12"/><circle cx="100" cy="0" r="6" fill="#7c2d12"/>
      </g>`;
    hero += `<g opacity="0.98">${stick(17)}${stick(-18)}</g>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 26, '#fde047', 120, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  durgapuja(seed = 44, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fbf5f0' : theme.darkOverrides?.bgTop || '#3b0712';
    const bgMid = theme.isMinimal ? '#f4e6de' : theme.darkOverrides?.bgMid || '#7f1d1d';
    const bgBot = theme.isMinimal ? '#ebd4c8' : theme.darkOverrides?.bgBot || '#24050c';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.5" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.46" r="0.58">
        <stop offset="0" stop-color="#fbbf24" stop-opacity="0.3"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#f97316"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    // Sacred Pandal Chala Arch & Lotus Crown
    hero += `<path d="M140,1040 L140,480 Q140,220 540,140 Q940,220 940,480 L940,1040" fill="none" stroke="${theme.metalLight}" stroke-width="5" opacity="0.72"/>`;
    hero += `<path d="M180,1040 L180,500 Q180,265 540,195 Q900,265 900,500 L900,1040" fill="none" stroke="${theme.metalMid}" stroke-width="2.5" stroke-dasharray="12 8" opacity="0.68"/>`;

    // Sacred Alpona lotus mandala
    for (let r = 0; r < 4; r++) {
      hero += `<circle cx="540" cy="560" r="${120 + r * 72}" fill="none" stroke="${r % 2 ? '#fef3c7' : theme.metalMid}" stroke-width="${r === 1 ? 4 : 2}" opacity="0.65" ${r % 2 ? 'stroke-dasharray="8 8"' : ''}/>`;
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = 540 + Math.cos(a) * 235;
      const py = 560 + Math.sin(a) * 235;
      const deg = (a * 180) / Math.PI + 90;
      hero += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="18" ry="46" fill="${i % 2 ? '#fef3c7' : '#f59e0b'}" opacity="0.88" transform="rotate(${deg.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`;
    }

    // Stylized Trinetra & Sacred Crown Lotus Emblem
    hero += `<g transform="translate(540,560)">
      <circle cx="0" cy="0" r="108" fill="#fef3c7" opacity="0.92"/>
      <path d="M-86,0 Q0,-56 86,0 Q0,56 -86,0 Z" fill="#991b1b" stroke="#7c2d12" stroke-width="4"/>
      <circle cx="0" cy="0" r="28" fill="#fde047"/>
      <circle cx="0" cy="0" r="14" fill="#1e1b4b"/>
      <path d="M0,-82 Q16,-54 0,-34 Q-16,-54 0,-82 Z" fill="#dc2626"/>
      <circle cx="-110" cy="0" r="10" fill="#dc2626"/><circle cx="110" cy="0" r="10" fill="#dc2626"/>
    </g>`;

    // Glowing Dhunuchi & Diya pair at base
    hero += diya(320, 990, 1.3, '#b5651d', theme.metalMid);
    hero += diya(760, 990, 1.3, '#b5651d', theme.metalMid);
    hero += diya(540, 1025, 1.55, '#9a4d12', theme.metalLight);

    body += heroGroup(H, hero);
    body += sparkles(rand, 24, '#fef3c7', 160, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  holi(seed = 55, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.darkOverrides ? theme.darkOverrides.bgTop : theme.isMinimal ? '#faf7f0' : '#fff7ed';
    const bgBot = theme.darkOverrides ? theme.darkOverrides.bgBot : theme.isMinimal ? '#efe9dc' : '#fef3c7';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    const bursts = [
      [220, 280, '#ec4899'],
      [840, 240, '#8b5cf6'],
      [540, 560, '#f59e0b'],
      [210, 880, '#06b6d4'],
      [860, 860, '#22c55e'],
      [540, 1020, '#e11d48'],
      [890, 520, '#f97316'],
      [170, 560, '#a855f7'],
    ];

    let hero = '';
    bursts.forEach(([cx, cy, col]) => {
      const R = (theme.isMinimal ? 65 : 95) + rand() * 85;
      hero += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${col}" opacity="${theme.isMinimal ? 0.22 : 0.34}" filter="url(#glow)"/>`;
      const count = theme.isMinimal ? 16 : 30;
      for (let i = 0; i < count; i++) {
        const a = rand() * Math.PI * 2;
        const d = R * (0.35 + rand() * 1.15);
        hero += `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" r="${(3 + rand() * 15).toFixed(1)}" fill="${col}" opacity="${(0.32 + rand() * 0.45).toFixed(2)}"/>`;
      }
      hero += `<circle cx="${cx}" cy="${cy}" r="${(R * 0.44).toFixed(1)}" fill="${col}" opacity="${theme.isMinimal ? 0.42 : 0.62}" filter="url(#glow)"/>`;
    });

    body += heroGroup(H, hero);
    body += sparkles(rand, 20, theme.metalMid, 120, H - 300);
    body += grain('gr', H, 0.04);
    return svgWrap(defs, body, H);
  },

  eid(seed = 63, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#eef3f5' : theme.darkOverrides?.bgTop || '#031a26';
    const bgMid = theme.isMinimal ? '#e1eaee' : theme.darkOverrides?.bgMid || '#083344';
    const bgBot = theme.isMinimal ? '#d2dfe6' : theme.darkOverrides?.bgBot || '#021018';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.6" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.72" cy="0.3" r="0.55">
        <stop offset="0" stop-color="${theme.glow}" stop-opacity="0.28"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="lanternGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.metalLight}"/><stop offset="1" stop-color="${theme.metalMid}"/>
      </linearGradient>
      <pattern id="arab" width="140" height="140" patternUnits="userSpaceOnUse">
        <path d="M70,14 L126,70 L70,126 L14,70 Z" fill="none" stroke="${theme.metalMid}" stroke-width="1.3" opacity="${theme.isMinimal ? 0.12 : 0.16}"/>
        <circle cx="70" cy="70" r="22" fill="none" stroke="${theme.metalLight}" stroke-width="1.1" opacity="0.13"/>
      </pattern>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#arab)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    if (!theme.isMinimal) {
      for (let i = 0; i < 95; i++) {
        body += `<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * (H - 380)).toFixed(0)}" r="${(0.8 + rand() * 2.2).toFixed(1)}" fill="#fef9c3" opacity="${(0.2 + rand() * 0.6).toFixed(2)}"/>`;
      }
    }

    let hero = '';
    const moonX = seed % 2 === 0 ? 740 : 760;
    hero += `<g transform="translate(${moonX},315)">
      <circle cx="0" cy="0" r="145" fill="${theme.metalMid}"/>
      <circle cx="0" cy="0" r="145" fill="${theme.metalLight}" filter="url(#glow)" opacity="0.45"/>
      <circle cx="50" cy="-24" r="124" fill="${bgMid}"/>
      <path d="M180,-124 l10,26 26,10 -26,10 -10,26 -10,-26 -26,-10 26,-10 Z" fill="${theme.metalLight}"/>
    </g>`;

    hero += fanoos(215, 390, 1.45, theme.metalMid, theme.metalLight);
    hero += fanoos(415, 240, 1.0, theme.metalDark, theme.metalLight);
    hero += fanoos(120, 640, 0.88, theme.metalDark, theme.metalLight);

    const silColor = theme.isMinimal ? '#1e293b' : '#02121b';
    hero += `<g fill="${silColor}">
      <rect x="0" y="1020" width="1080" height="520"/>
      <rect x="120" y="905" width="58" height="125"/><rect x="902" y="905" width="58" height="125"/>
      <path d="M120,905 q29,-68 58,0 Z"/><path d="M902,905 q29,-68 58,0 Z"/>
      <path d="M405,1020 q135,-200 270,0 Z"/>
      <rect x="536" y="810" width="8" height="40"/><circle cx="540" cy="804" r="8"/>
    </g>`;
    hero += `<circle cx="149" cy="872" r="5.5" fill="${theme.metalLight}"/><circle cx="931" cy="872" r="5.5" fill="${theme.metalLight}"/><circle cx="540" cy="790" r="5.5" fill="${theme.metalLight}"/>`;

    body += heroGroup(H, hero);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  pongal(seed = 71, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.darkOverrides ? theme.darkOverrides.bgTop : theme.isMinimal ? '#faf5e8' : '#fef3c7';
    const bgMid = theme.darkOverrides ? theme.darkOverrides.bgMid : theme.isMinimal ? '#f3e9d2' : '#fde68a';
    const bgBot = theme.darkOverrides ? theme.darkOverrides.bgBot : theme.isMinimal ? '#e7d7b5' : '#f59e0b';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.5" cy="0.28" r="0.42">
        <stop offset="0" stop-color="#fff7ed"/><stop offset="0.6" stop-color="#fdba74"/><stop offset="1" stop-color="#fdba74" stop-opacity="0"/>
      </radialGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#sun)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    hero += `<circle cx="540" cy="315" r="145" fill="#fb923c"/><circle cx="540" cy="315" r="115" fill="#fdba74"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      hero += `<line x1="${(540 + Math.cos(a) * 168).toFixed(1)}" y1="${(315 + Math.sin(a) * 168).toFixed(1)}" x2="${(540 + Math.cos(a) * 222).toFixed(1)}" y2="${(315 + Math.sin(a) * 222).toFixed(1)}" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>`;
    }

    hero += `<path d="M0,790 Q270,720 540,770 Q810,820 1080,750 L1080,1520 L0,1520 Z" fill="#65a30d"/>`;
    hero += `<path d="M0,895 Q300,845 620,890 Q880,925 1080,880 L1080,1520 L0,1520 Z" fill="#4d7c0f"/>`;

    [135, 945].forEach((x) => {
      hero += `<g transform="translate(${x},655)">
        <rect x="-14" y="0" width="28" height="420" rx="12" fill="#a16207"/>
        <rect x="-14" y="70" width="28" height="10" fill="#713f12"/><rect x="-14" y="170" width="28" height="10" fill="#713f12"/><rect x="-14" y="270" width="28" height="10" fill="#713f12"/>
        <path d="M0,0 C-40,-60 -90,-80 -140,-70 C-90,-50 -50,-30 0,10 Z" fill="#65a30d"/>
        <path d="M0,0 C40,-70 90,-95 150,-85 C95,-60 50,-35 0,10 Z" fill="#84cc16"/>
      </g>`;
    });

    hero += `<g transform="translate(540,945)">
      <path d="M-120,-40 C-150,30 -120,120 0,120 C120,120 150,30 120,-40 Z" fill="#b45309"/>
      <path d="M-120,-40 L120,-40 L108,-10 L-108,-10 Z" fill="#92400e"/>
      <ellipse cx="0" cy="-44" rx="120" ry="22" fill="#78350f"/>
      <path d="M-90,-52 C-70,-110 -30,-96 -20,-60 C0,-120 50,-110 44,-58 C70,-100 100,-80 92,-50 C60,-34 -60,-34 -90,-52 Z" fill="#fff7ed"/>
      <path d="M-30,-80 q6,-24 0,-44 M10,-86 q-6,-26 2,-48" stroke="#d6d3d1" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.72"/>
      <path d="M-120,10 L120,10" stroke="#fde047" stroke-width="8"/><path d="M-112,34 L112,34" stroke="#dc2626" stroke-width="8"/>
      <circle cx="-40" cy="60" r="10" fill="#fde047"/><circle cx="40" cy="60" r="10" fill="#fde047"/><circle cx="0" cy="82" r="10" fill="#dc2626"/>
    </g>`;

    for (let gx = 0; gx < 9; gx++) {
      for (let gy = 0; gy < 3; gy++) {
        hero += `<circle cx="${180 + gx * 90}" cy="${680 + gy * 38}" r="5" fill="#ffffff" opacity="0.82"/>`;
      }
    }

    body += heroGroup(H, hero);
    body += bokeh(rand, 16, ['#ffffff', '#fde047'], 6, 22, H - 300, 340);
    body += grain('gr', H, 0.04);
    return svgWrap(defs, body, H);
  },

  onam(seed = 77, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f0f5ef' : theme.darkOverrides?.bgTop || '#114a28';
    const bgBot = theme.isMinimal ? '#dfeadc' : theme.darkOverrides?.bgBot || '#042713';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.58" r="0.55">
        <stop offset="0" stop-color="${theme.glow}" stop-opacity="0.24"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#f97316"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed + 2, theme, rand, H);

    const leaf = (x, y, rot, s) =>
      `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">
        <path d="M0,0 C120,-60 260,-60 380,10 C260,50 120,50 0,0 Z" fill="#16a34a"/>
        <path d="M0,0 C120,-60 260,-60 380,10" stroke="#052e16" stroke-width="4" fill="none"/>
        <path d="M40,-8 L360,8 M90,-22 L340,4 M150,-32 L300,0 M210,-36 L250,-2" stroke="#052e16" stroke-width="2.5" opacity="0.55"/>
      </g>`;

    let hero = '';
    hero += leaf(-40, 120, 18, 1.1) + leaf(1120, 90, 160, 1.1) + leaf(-60, 1140, -24, 1.0) + leaf(1140, 1160, 200, 1.0);
    hero += pookalam(540, 650, [
      { r: 82, petals: 12, pw: 17, pl: 40 },
      { r: 155, petals: 16, pw: 19, pl: 48 },
      { r: 235, petals: 20, pw: 21, pl: 54 },
      { r: 320, petals: 24, pw: 22, pl: 58 },
      { r: 405, petals: 30, pw: 23, pl: 56 },
    ], seed + 99);
    hero += diya(170, 1020, 0.95) + diya(910, 1020, 0.95);

    body += heroGroup(H, hero);
    body += sparkles(rand, 18, theme.metalLight, 140, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  rakhi(seed = 88, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.darkOverrides ? theme.darkOverrides.bgTop : theme.isMinimal ? '#fdf8f8' : '#fff1f2';
    const bgMid = theme.darkOverrides ? theme.darkOverrides.bgMid : theme.isMinimal ? '#f7ecee' : '#ffe4e6';
    const bgBot = theme.darkOverrides ? theme.darkOverrides.bgBot : theme.isMinimal ? '#eedde0' : '#fecdd3';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.5" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.metalLight}"/><stop offset="1" stop-color="${theme.metalDark}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 3, theme, rand, H);

    let hero = '';
    hero += `<path d="M-100,280 L1180,40 L1180,200 L-100,440 Z" fill="#fb7185" opacity="0.16"/>`;
    hero += `<path d="M-100,720 L1180,480 L1180,600 L-100,840 Z" fill="#f43f5e" opacity="0.12"/>`;
    hero += `<path d="M-100,1040 L1180,800 L1180,920 L-100,1160 Z" fill="#fb7185" opacity="0.14"/>`;

    hero += `<path d="M-20,540 Q540,420 1100,580" stroke="#dc2626" stroke-width="26" fill="none"/>`;
    hero += `<path d="M-20,540 Q540,420 1100,580" stroke="#fbbf24" stroke-width="8" fill="none" stroke-dasharray="2 26"/>`;
    hero += `<g transform="translate(540,485)">
      <circle cx="0" cy="0" r="160" fill="url(#gold)" stroke="#b45309" stroke-width="6"/>
      <circle cx="0" cy="0" r="120" fill="#dc2626"/>
      <circle cx="0" cy="0" r="120" fill="none" stroke="#fde68a" stroke-width="5" stroke-dasharray="4 14"/>
      <circle cx="0" cy="0" r="64" fill="#fde047"/>
      <circle cx="0" cy="0" r="64" fill="none" stroke="#b45309" stroke-width="3"/>
      <circle cx="0" cy="0" r="24" fill="#dc2626"/>
      <circle cx="-190" cy="-16" r="18" fill="url(#gold)"/><circle cx="190" cy="16" r="18" fill="url(#gold)"/>
      <circle cx="-240" cy="-24" r="13" fill="#fbbf24"/><circle cx="240" cy="24" r="13" fill="#fbbf24"/>
    </g>`;

    body += heroGroup(H, hero);
    for (let i = 0; i < 46; i++) {
      const x = rand() * W;
      const y = rand() * (H - 250);
      const r = 6 + rand() * 10;
      const a = rand() * 360;
      body += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${r.toFixed(0)}" ry="${(r * 0.55).toFixed(0)}" fill="${['#fb7185', '#f43f5e', '#fda4af'][i % 3]}" opacity="${(0.25 + rand() * 0.35).toFixed(2)}" transform="rotate(${a.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
    }
    body += grain('gr', H, 0.04);
    return svgWrap(defs, body, H);
  },

  makarsankranti(seed = 91, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#eff6ff' : theme.darkOverrides?.bgTop || '#0c4a6e';
    const bgMid = theme.isMinimal ? '#e0f2fe' : theme.darkOverrides?.bgMid || '#0284c7';
    const bgBot = theme.isMinimal ? '#fde68a' : theme.darkOverrides?.bgBot || '#f59e0b';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.62" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    const kite = (cx, cy, s, rot, colA, colB) =>
      `<g transform="translate(${cx},${cy}) rotate(${rot}) scale(${s})">
        <path d="M0,120 Q-30,220 20,310 Q-15,380 18,450" stroke="#fef3c7" stroke-width="3.5" fill="none" opacity="0.82"/>
        <polygon points="0,-120 96,0 0,120 -96,0" fill="${colA}"/>
        <polygon points="0,-120 96,0 0,120" fill="${colB}" opacity="0.85"/>
        <line x1="-96" y1="0" x2="96" y2="0" stroke="#fffbeb" stroke-width="3"/>
        <path d="M-96,0 Q0,-45 96,0" stroke="#fffbeb" stroke-width="3" fill="none"/>
        <polygon points="0,120 -26,158 26,158" fill="${colA}"/>
      </g>`;

    let hero = '';
    hero += `<circle cx="540" cy="840" r="190" fill="#fde047" opacity="0.35" filter="url(#glow)"/>`;
    hero += `<circle cx="540" cy="840" r="135" fill="#fbbf24" opacity="0.9"/>`;
    hero += kite(280, 390, 1.1, -18, '#ec4899', '#be185d');
    hero += kite(690, 310, 1.35, 14, '#f97316', '#dc2626');
    hero += kite(500, 620, 0.9, -8, '#eab308', '#16a34a');
    hero += kite(830, 690, 0.85, 22, '#8b5cf6', '#6d28d9');

    body += heroGroup(H, hero);
    body += sparkles(rand, 20, '#fffbeb', 120, H - 300);
    body += grain('gr', H, 0.035);
    return svgWrap(defs, body, H);
  },

  baisakhi(seed = 102, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fbf7eb' : theme.darkOverrides?.bgTop || '#78350f';
    const bgMid = theme.isMinimal ? '#f4ead2' : theme.darkOverrides?.bgMid || '#b45309';
    const bgBot = theme.isMinimal ? '#ead9b3' : theme.darkOverrides?.bgBot || '#451a03';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.5" cy="0.4" r="0.5">
        <stop offset="0" stop-color="#fde047" stop-opacity="0.45"/><stop offset="1" stop-color="#fde047" stop-opacity="0"/>
      </radialGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#sun)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Golden wheat sheaves
    for (let i = -5; i <= 5; i++) {
      const rot = i * 6.5;
      hero += `<g transform="translate(540,990) rotate(${rot})">
        <line x1="0" y1="0" x2="0" y2="-480" stroke="#fbbf24" stroke-width="5"/>`;
      for (let g = 0; g < 9; g++) {
        const y = -280 - g * 24;
        hero += `<ellipse cx="-14" cy="${y}" rx="9" ry="18" fill="#fde047" transform="rotate(-28 -14 ${y})"/>`;
        hero += `<ellipse cx="14" cy="${y}" rx="9" ry="18" fill="#f59e0b" transform="rotate(28 14 ${y})"/>`;
      }
      hero += `</g>`;
    }
    // Festive Dhol Drum Centerpiece
    hero += `<g transform="translate(540,835)">
      <ellipse cx="0" cy="0" rx="190" ry="118" fill="#991b1b" stroke="${theme.metalLight}" stroke-width="6"/>
      <ellipse cx="-155" cy="0" rx="34" ry="96" fill="#fef3c7" stroke="#b45309" stroke-width="5"/>
      <ellipse cx="155" cy="0" rx="34" ry="96" fill="#fef3c7" stroke="#b45309" stroke-width="5"/>
      <path d="M-130,-96 L-65,105 L0,-116 L65,105 L130,-96" fill="none" stroke="${theme.metalLight}" stroke-width="5"/>
      <circle cx="0" cy="0" r="24" fill="${theme.metalMid}"/>
    </g>`;

    body += heroGroup(H, hero);
    body += bokeh(rand, 22, ['#fde047', '#f97316'], 8, 30, H - 250, 220);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  lohri(seed = 109, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f7f1e8' : theme.darkOverrides?.bgTop || '#0f081e';
    const bgMid = theme.isMinimal ? '#efe2d0' : theme.darkOverrides?.bgMid || '#431407';
    const bgBot = theme.isMinimal ? '#e2cdb1' : theme.darkOverrides?.bgBot || '#1c0a04';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.58" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="fireGlow" cx="0.5" cy="0.65" r="0.55">
        <stop offset="0" stop-color="#f97316" stop-opacity="0.5"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/>
      </radialGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#fireGlow)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    // Rising ember sparks
    for (let i = 0; i < 55; i++) {
      const x = 220 + rand() * 640;
      const y = 140 + rand() * 580;
      hero += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + rand() * 6).toFixed(1)}" fill="${i % 2 ? '#fde047' : '#fb923c'}" opacity="${(0.35 + rand() * 0.6).toFixed(2)}"/>`;
    }
    // Layered Sacred Bonfire Flames
    hero += `<circle cx="540" cy="740" r="240" fill="#f97316" opacity="0.28" filter="url(#glow)"/>`;
    hero += `<path d="M310,960 C270,740 410,590 540,360 C670,590 810,740 770,960 Z" fill="#ea580c"/>`;
    hero += `<path d="M365,960 C340,780 445,650 540,465 C635,650 740,780 715,960 Z" fill="#f59e0b"/>`;
    hero += `<path d="M425,960 C410,835 480,730 540,600 C600,730 670,835 655,960 Z" fill="#fef08a"/>`;
    // Crossed Wooden Logs
    hero += `<g transform="translate(540,985)">
      <rect x="-240" y="-18" width="480" height="44" rx="18" fill="#57260b" transform="rotate(10)"/>
      <rect x="-240" y="-18" width="480" height="44" rx="18" fill="#7c2d12" transform="rotate(-10)"/>
    </g>`;

    body += heroGroup(H, hero);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  janmashtami(seed = 115, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#eff4fb' : theme.darkOverrides?.bgTop || '#091034';
    const bgMid = theme.isMinimal ? '#e0e9f7' : theme.darkOverrides?.bgMid || '#1e1b6b';
    const bgBot = theme.isMinimal ? '#cddbf2' : theme.darkOverrides?.bgBot || '#050821';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.metalLight}"/><stop offset="1" stop-color="${theme.metalDark}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Luminous Peacock Feather (Mor Pankh)
    hero += `<g transform="translate(540,490) rotate(-14)">
      <line x1="0" y1="360" x2="0" y2="-230" stroke="#fde047" stroke-width="5"/>`;
    for (let i = -24; i <= 24; i++) {
      const y = i * 9;
      hero += `<path d="M0,${y} Q${-130 + Math.abs(i) * 2},${y - 30} ${-160 + Math.abs(i) * 4},${y - 70}" stroke="#10b981" stroke-width="3.5" fill="none" opacity="0.65"/>`;
      hero += `<path d="M0,${y} Q${130 - Math.abs(i) * 2},${y - 30} ${160 - Math.abs(i) * 4},${y - 70}" stroke="#10b981" stroke-width="3.5" fill="none" opacity="0.65"/>`;
    }
    hero += `<ellipse cx="0" cy="-120" rx="88" ry="128" fill="#0d9488" opacity="0.9"/>
      <ellipse cx="0" cy="-128" rx="64" ry="96" fill="#0284c7"/>
      <ellipse cx="0" cy="-136" rx="44" ry="64" fill="#fbbf24"/>
      <ellipse cx="0" cy="-140" rx="28" ry="42" fill="#1e1b4b"/>
    </g>`;

    // Golden Bansuri Flute
    hero += `<g transform="translate(540,860) rotate(12)">
      <rect x="-340" y="-18" width="680" height="36" rx="18" fill="url(#gold)"/>
      <rect x="-280" y="-18" width="24" height="36" fill="#dc2626"/><rect x="240" y="-18" width="24" height="36" fill="#dc2626"/>
      ${[-120, -60, 0, 60, 120, 180].map((x) => `<circle cx="${x}" cy="0" r="8" fill="#451a03"/>`).join('')}
    </g>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 28, '#fde047', 120, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  chhath(seed = 121, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fff4e6' : theme.darkOverrides?.bgTop || '#7c2d12';
    const bgMid = theme.isMinimal ? '#ffe2c2' : theme.darkOverrides?.bgMid || '#ea580c';
    const bgBot = theme.isMinimal ? '#fdd09e' : theme.darkOverrides?.bgBot || '#1e1b4b';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.58" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#f97316"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    // Sacred Surya Sun rising over Ganga waters
    hero += `<circle cx="540" cy="540" r="220" fill="#fde047" opacity="0.3" filter="url(#glow)"/>`;
    hero += `<circle cx="540" cy="540" r="155" fill="#fbbf24"/>`;
    hero += `<rect x="0" y="640" width="${W}" height="620" fill="#1e3a8a" opacity="0.88"/>`;
    for (let i = 0; i < 8; i++) {
      const y = 685 + i * 44;
      const w = 280 - i * 24;
      hero += `<rect x="${540 - w / 2}" y="${y}" width="${w}" height="10" rx="5" fill="#fde047" opacity="${(0.85 - i * 0.08).toFixed(2)}"/>`;
    }
    hero += diya(330, 960, 1.15) + diya(540, 930, 1.4) + diya(750, 960, 1.15);

    body += heroGroup(H, hero);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  bihu(seed = 127, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#faf7f2' : theme.darkOverrides?.bgTop || '#fdf8f3';
    const bgMid = theme.isMinimal ? '#f4ede4' : theme.darkOverrides?.bgMid || '#f7efe5';
    const bgBot = theme.isMinimal ? '#ebe0d2' : theme.darkOverrides?.bgBot || '#efe1d1';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.5" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    // Traditional Assamese Gamosa crimson woven bands
    body += `<rect x="0" y="95" width="${W}" height="48" fill="#be123c" opacity="0.9"/>`;
    body += `<rect x="0" y="${H - Math.round(H * 0.16) - 68}" width="${W}" height="48" fill="#be123c" opacity="0.9"/>`;
    for (let x = 40; x < W; x += 64) {
      body += `<polygon points="${x},105 ${x + 14},119 ${x},133 ${x - 14},119" fill="#fffbeb"/>`;
    }
    body += layoutFrame(seed + 2, theme, rand, H);

    let hero = '';
    // Kopou Orchid Sprays + Jaapi Sun Hat Centerpiece
    hero += `<g transform="translate(540,560)">
      <circle cx="0" cy="0" r="245" fill="#be123c" stroke="#d97706" stroke-width="10"/>
      <circle cx="0" cy="0" r="195" fill="#fffbeb" stroke="#be123c" stroke-width="6"/>
      <circle cx="0" cy="0" r="145" fill="#15803d"/>
      <circle cx="0" cy="0" r="95" fill="#fbbf24"/>
      <circle cx="0" cy="0" r="44" fill="#be123c"/>
    </g>`;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = 540 + Math.cos(a) * 285;
      const y = 560 + Math.sin(a) * 285;
      hero += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="#d946ef" opacity="0.88"/>`;
    }

    body += heroGroup(H, hero);
    body += grain('gr', H, 0.035);
    return svgWrap(defs, body, H);
  },

  gudipadwa(seed = 133, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fff8eb' : theme.darkOverrides?.bgTop || '#4a044e';
    const bgMid = theme.isMinimal ? '#fef0d6' : theme.darkOverrides?.bgMid || '#831843';
    const bgBot = theme.isMinimal ? '#fde4b8' : theme.darkOverrides?.bgBot || '#2e022d';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.metalLight}"/><stop offset="1" stop-color="${theme.metalDark}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += garland(-20, 48, 540, 32, 130, 18, seed + 2);
    body += garland(540, 32, 1100, 48, 130, 18, seed + 7);
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    // Ceremonial Gudi Pole, Silk Cloth, Marigold Wreath & Inverted Brass Kalash
    hero += `<rect x="528" y="250" width="24" height="820" rx="8" fill="#a16207"/>`;
    hero += `<path d="M530,300 L310,650 L530,580 Z" fill="#f97316"/>`;
    hero += `<path d="M550,300 L770,650 L550,580 Z" fill="#ec4899"/>`;
    hero += `<path d="M530,300 L345,620 L405,640 L530,320 Z" fill="#fde047" opacity="0.65"/>`;
    hero += `<circle cx="540" cy="255" r="74" fill="url(#gold)" stroke="#92400e" stroke-width="5"/>`;
    hero += `<ellipse cx="540" cy="182" rx="46" ry="18" fill="url(#gold)"/>`;
    // Mango leaf ring at crown
    for (let i = -3; i <= 3; i++) {
      hero += `<ellipse cx="${540 + i * 24}" cy="310" rx="11" ry="34" fill="#16a34a" transform="rotate(${i * 14} ${540 + i * 24} 310)"/>`;
    }

    body += heroGroup(H, hero);
    body += sparkles(rand, 22, theme.metalLight, 140, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  karvachauth(seed = 141, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fbf2f4' : theme.darkOverrides?.bgTop || '#1e0521';
    const bgMid = theme.isMinimal ? '#f4e0e5' : theme.darkOverrides?.bgMid || '#580a35';
    const bgBot = theme.isMinimal ? '#ebd0d8' : theme.darkOverrides?.bgBot || '#110315';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#f97316"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Full Moon behind Ornate Chhalni Sieve
    hero += `<circle cx="540" cy="450" r="185" fill="#fef9c3" opacity="0.25" filter="url(#glow)"/>`;
    hero += `<circle cx="540" cy="450" r="130" fill="#fef9c3"/>`;
    hero += `<circle cx="540" cy="450" r="220" fill="none" stroke="${theme.metalLight}" stroke-width="14"/>`;
    for (let x = -180; x <= 180; x += 36) {
      hero += `<line x1="${540 + x}" y1="250" x2="${540 + x}" y2="650" stroke="${theme.metalMid}" stroke-width="2" opacity="0.45"/>`;
      hero += `<line x1="340" y1="${450 + x}" x2="740" y2="${450 + x}" stroke="${theme.metalMid}" stroke-width="2" opacity="0.45"/>`;
    }
    hero += diya(540, 910, 1.7, '#be123c', theme.metalLight);

    body += heroGroup(H, hero);
    body += sparkles(rand, 26, '#fef9c3', 120, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  vishu(seed = 148, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fbf9ef' : theme.darkOverrides?.bgTop || '#064e3b';
    const bgMid = theme.isMinimal ? '#f4f0dc' : theme.darkOverrides?.bgMid || '#065f46';
    const bgBot = theme.isMinimal ? '#eae2c4' : theme.darkOverrides?.bgBot || '#022c22';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#f97316"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    // Cascading Konna (Golden Shower) blossoms
    for (let s = 0; s < 5; s++) {
      const sx = 180 + s * 180;
      for (let b = 0; b < 9; b++) {
        const bx = sx + (rand() - 0.5) * 34;
        const by = 140 + b * 42;
        hero += `<circle cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="${(18 - b * 1.1).toFixed(0)}" fill="#fde047" opacity="0.92"/>`;
      }
    }
    // Brass Uruli bowl + Aranmula Kannadi Mirror
    hero += `<ellipse cx="540" cy="690" rx="135" ry="175" fill="#fde047" stroke="#92400e" stroke-width="10"/>`;
    hero += `<ellipse cx="540" cy="690" rx="95" ry="132" fill="#e2e8f0"/>`;
    hero += `<path d="M310,870 Q540,1040 770,870 Z" fill="#b45309"/>`;
    hero += diya(240, 960, 1.1) + diya(840, 960, 1.1);

    body += heroGroup(H, hero);
    body += sparkles(rand, 22, '#fde047', 140, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  mahashivratri(seed = 155, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#eef2f7' : theme.darkOverrides?.bgTop || '#020617';
    const bgMid = theme.isMinimal ? '#dde5f0' : theme.darkOverrides?.bgMid || '#1e1b4b';
    const bgBot = theme.isMinimal ? '#cbd7e8' : theme.darkOverrides?.bgBot || '#090d24';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.58" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Cosmic Crescent Moon & Himalayan Peaks
    hero += `<circle cx="540" cy="400" r="190" fill="#38bdf8" opacity="0.18" filter="url(#glow)"/>`;
    hero += `<path d="M440,290 A120,120 0 1,0 650,430 A95,95 0 1,1 440,290 Z" fill="#f8fafc"/>`;
    hero += `<polygon points="0,1150 280,680 540,980 820,640 1080,1150" fill="#0f172a" opacity="0.92"/>`;
    hero += `<polygon points="280,680 375,805 245,795 200,825" fill="#e2e8f0" opacity="0.78"/>`;
    hero += `<polygon points="820,640 915,790 770,775 720,810" fill="#e2e8f0" opacity="0.78"/>`;
    // Sacred Damaru & Trishul Crest
    hero += `<line x1="540" y1="450" x2="540" y2="960" stroke="${theme.metalLight}" stroke-width="10"/>`;
    hero += `<path d="M460,470 Q460,570 540,570 Q620,570 620,470" fill="none" stroke="${theme.metalLight}" stroke-width="9" stroke-linecap="round"/>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 32, '#e0f2fe', 100, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  // === INTERNATIONAL FESTIVALS & MOMENTS ===

  newyear(seed = 201, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f4f4f6' : theme.darkOverrides?.bgTop || '#04081a';
    const bgMid = theme.isMinimal ? '#e6e8ee' : theme.darkOverrides?.bgMid || '#111a3e';
    const bgBot = theme.isMinimal ? '#d8dce6' : theme.darkOverrides?.bgBot || '#02040d';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 3, theme, rand, H);

    let hero = '';
    // Art Deco Sunburst Horizon
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      hero += `<line x1="540" y1="620" x2="${(540 + Math.cos(a) * 560).toFixed(1)}" y2="${(620 + Math.sin(a) * 560).toFixed(1)}" stroke="${theme.metalLight}" stroke-width="2" opacity="0.22"/>`;
    }
    hero += fireworkBurst(290, 340, 175, [theme.metalLight, theme.accent, '#ffffff'], seed + 1);
    hero += fireworkBurst(790, 310, 195, ['#fde047', '#f472b6', '#38bdf8'], seed + 2);
    hero += fireworkBurst(540, 580, 240, [theme.metalLight, theme.metalMid, '#fb923c'], seed + 3);
    hero += fireworkBurst(260, 820, 140, ['#fde047', '#38bdf8'], seed + 4);
    hero += fireworkBurst(820, 840, 150, ['#fbbf24', '#ec4899'], seed + 5);

    body += heroGroup(H, hero);
    body += sparkles(rand, 34, theme.metalLight, 100, H - 280);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  valentines(seed = 211, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fff5f7' : theme.darkOverrides?.bgTop || '#3b071b';
    const bgMid = theme.isMinimal ? '#ffe4e9' : theme.darkOverrides?.bgMid || '#831843';
    const bgBot = theme.isMinimal ? '#fecdd6' : theme.darkOverrides?.bgBot || '#240410';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.48" r="0.55">
        <stop offset="0" stop-color="#fb7185" stop-opacity="0.38"/><stop offset="1" stop-color="#fb7185" stop-opacity="0"/>
      </radialGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    const heart = (cx, cy, sc, fill, op = 1) =>
      `<g transform="translate(${cx},${cy}) scale(${sc})" opacity="${op}">
        <path d="M0,120 C-150,20 -180,-110 -85,-145 C-25,-168 0,-112 0,-85 C0,-112 25,-168 85,-145 C180,-110 150,20 0,120 Z" fill="${fill}"/>
      </g>`;

    let hero = '';
    hero += heart(540, 585, 1.95, '#fb7185', 0.28);
    hero += heart(540, 575, 1.55, '#e11d48', 0.92);
    hero += heart(540, 565, 1.12, '#be123c', 0.95);
    hero += `<g transform="translate(540,565) scale(1.65)"><path d="M0,120 C-150,20 -180,-110 -85,-145 C-25,-168 0,-112 0,-85 C0,-112 25,-168 85,-145 C180,-110 150,20 0,120 Z" fill="none" stroke="${theme.metalLight}" stroke-width="2.5"/></g>`;
    hero += heart(230, 320, 0.42, '#fda4af', 0.72) + heart(860, 340, 0.36, '#fbcfe8', 0.72) + heart(270, 910, 0.35, '#fb7185', 0.65) + heart(820, 890, 0.45, '#f43f5e', 0.7);

    body += heroGroup(H, hero);
    body += sparkles(rand, 24, theme.metalLight, 140, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  easter(seed = 219, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.darkOverrides ? theme.darkOverrides.bgTop : '#eefcf6';
    const bgMid = theme.darkOverrides ? theme.darkOverrides.bgMid : '#fdf2f8';
    const bgBot = theme.darkOverrides ? theme.darkOverrides.bgBot : '#fef9c3';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    const egg = (cx, cy, sc, colA, colB, rot = 0) =>
      `<g transform="translate(${cx},${cy}) rotate(${rot}) scale(${sc})">
        <path d="M0,-145 C82,-145 112,-10 112,55 C112,125 64,160 0,160 C-64,160 -112,125 -112,55 C-112,-10 -82,-145 0,-145 Z" fill="${colA}"/>
        <path d="M-104,10 L104,10 L108,38 L-108,38 Z" fill="${colB}" opacity="0.85"/>
        <path d="M-90,-45 L90,-45" stroke="#fff" stroke-width="6" stroke-dasharray="10 14"/>
        <circle cx="0" cy="-18" r="14" fill="${theme.metalLight}"/>
        <circle cx="-48" cy="-18" r="10" fill="#fff"/><circle cx="48" cy="-18" r="10" fill="#fff"/>
      </g>`;

    let hero = '';
    hero += `<path d="M0,910 Q270,835 540,885 Q810,935 1080,865 L1080,1520 L0,1520 Z" fill="#86efac" opacity="0.72"/>`;
    hero += egg(325, 760, 0.92, '#a7f3d0', '#10b981', -12);
    hero += egg(755, 760, 0.92, '#bae6fd', '#0284c7', 12);
    hero += egg(540, 725, 1.25, '#fbcfe8', '#ec4899', 0);

    body += heroGroup(H, hero);
    body += bokeh(rand, 22, ['#fde047', '#f9a8d4', '#a7f3d0'], 10, 32, H - 280, 180);
    body += grain('gr', H, 0.03);
    return svgWrap(defs, body, H);
  },

  hanukkah(seed = 225, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#eff4fb' : theme.darkOverrides?.bgTop || '#071438';
    const bgMid = theme.isMinimal ? '#dfe8f7' : theme.darkOverrides?.bgMid || '#102a68';
    const bgBot = theme.isMinimal ? '#ccd9f0' : theme.darkOverrides?.bgBot || '#040c24';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${theme.metalLight}"/><stop offset="1" stop-color="${theme.metalDark}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Star of David geometric halo
    hero += `<g transform="translate(540,420)" opacity="0.22">
      <polygon points="0,-240 208,120 -208,120" fill="none" stroke="${theme.metalLight}" stroke-width="5"/>
      <polygon points="0,240 208,-120 -208,-120" fill="none" stroke="${theme.metalLight}" stroke-width="5"/>
    </g>`;

    // 9-Branch Golden Hanukkiah Menorah
    hero += `<rect x="528" y="450" width="24" height="520" rx="8" fill="url(#gold)"/>`;
    hero += `<path d="M400,970 L680,970 L650,940 L430,940 Z" fill="url(#gold)"/>`;
    const branches = [-260, -195, -130, -65, 65, 130, 195, 260];
    branches.forEach((bx) => {
      hero += `<path d="M540,740 Q${540 + bx},740 ${540 + bx},510" fill="none" stroke="url(#gold)" stroke-width="14" stroke-linecap="round"/>`;
      hero += `<rect x="${540 + bx - 10}" y="470" width="20" height="44" rx="4" fill="#f8fafc"/>`;
      hero += `<circle cx="${540 + bx}" cy="445" r="24" fill="#fbbf24" opacity="0.35" filter="url(#glow)"/>`;
      hero += `<path d="M${540 + bx},424 C${540 + bx + 10},442 ${540 + bx + 12},456 ${540 + bx},466 C${540 + bx - 12},456 ${540 + bx - 10},442 ${540 + bx},424 Z" fill="#fde047"/>`;
    });
    // Shamash center candle
    hero += `<rect x="528" y="400" width="24" height="58" rx="4" fill="#f8fafc"/>`;
    hero += `<circle cx="540" cy="370" r="30" fill="#fbbf24" opacity="0.45" filter="url(#glow)"/>`;
    hero += `<path d="M540,342 C553,365 556,384 540,398 C524,384 527,365 540,342 Z" fill="#fef08a"/>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 28, theme.metalLight, 120, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  chinesenewyear(seed = 233, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fef2f2' : theme.darkOverrides?.bgTop || '#5c060b';
    const bgMid = theme.isMinimal ? '#fee2e2' : theme.darkOverrides?.bgMid || '#991b1b';
    const bgBot = theme.isMinimal ? '#fecaca' : theme.darkOverrides?.bgBot || '#3d0407';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>
      <radialGradient id="glowC" cx="0.5" cy="0.45" r="0.55">
        <stop offset="0" stop-color="#fde047" stop-opacity="0.3"/><stop offset="1" stop-color="#fde047" stop-opacity="0"/>
      </radialGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    const palaceLantern = (cx, cy, sc) =>
      `<g transform="translate(${cx},${cy}) scale(${sc})">
        <line x1="0" y1="-260" x2="0" y2="-110" stroke="#fde047" stroke-width="5"/>
        <ellipse cx="0" cy="0" rx="115" ry="96" fill="#dc2626" stroke="#fbbf24" stroke-width="5"/>
        <ellipse cx="0" cy="0" rx="68" ry="96" fill="none" stroke="#fde047" stroke-width="3.5"/>
        <ellipse cx="0" cy="0" rx="28" ry="96" fill="none" stroke="#fde047" stroke-width="2.5"/>
        <rect x="-54" y="-110" width="108" height="20" rx="6" fill="#fbbf24"/>
        <rect x="-54" y="90" width="108" height="20" rx="6" fill="#fbbf24"/>
        <line x1="-22" y1="110" x2="-26" y2="195" stroke="#fde047" stroke-width="4"/>
        <line x1="0" y1="110" x2="0" y2="215" stroke="#fde047" stroke-width="5"/>
        <line x1="22" y1="110" x2="26" y2="195" stroke="#fde047" stroke-width="4"/>
      </g>`;

    let hero = '';
    hero += palaceLantern(540, 440, 1.35);
    hero += palaceLantern(205, 580, 0.85);
    hero += palaceLantern(875, 580, 0.85);

    // Golden cloud scrolls & plum blossom branch
    hero += `<path d="M0,1040 Q180,960 360,1030 Q540,1095 720,1020 Q900,955 1080,1040 L1080,1220 L0,1220 Z" fill="#fbbf24" opacity="0.22"/>`;
    hero += `<path d="M-40,260 Q140,290 290,210" stroke="#451a03" stroke-width="10" fill="none"/>`;
    [[110, 260], [185, 240], [260, 215], [95, 220]].forEach(([bx, by]) => {
      hero += `<circle cx="${bx}" cy="${by}" r="16" fill="#fda4af"/><circle cx="${bx}" cy="${by}" r="6" fill="#fde047"/>`;
    });

    body += heroGroup(H, hero);
    body += sparkles(rand, 28, '#fde047', 120, H - 280);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  halloween(seed = 241, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f4f0f8' : theme.darkOverrides?.bgTop || '#130724';
    const bgMid = theme.isMinimal ? '#e7dff0' : theme.darkOverrides?.bgMid || '#2e1065';
    const bgBot = theme.isMinimal ? '#d7cae6' : theme.darkOverrides?.bgBot || '#090314';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 2, theme, rand, H);

    let hero = '';
    // Luminous Harvest Moon
    hero += `<circle cx="540" cy="400" r="215" fill="#fde68a" opacity="0.28" filter="url(#glow)"/>`;
    hero += `<circle cx="540" cy="400" r="165" fill="#fef3c7"/>`;
    // Silhouetted Bats
    [[340, 320, 1], [690, 270, 0.85], [470, 230, 0.65]].forEach(([bx, by, sc]) => {
      hero += `<path d="M-40,0 Q-20,-24 0,-6 Q20,-24 40,0 Q18,-4 0,12 Q-18,-4 -40,0 Z" fill="#1e1b4b" transform="translate(${bx},${by}) scale(${sc})"/>`;
    });
    // Glowing Jack-o'-Lantern Centerpiece
    hero += `<g transform="translate(540,835)">
      <rect x="-18" y="-175" width="36" height="54" rx="10" fill="#15803d"/>
      <ellipse cx="-85" cy="0" rx="88" ry="135" fill="#ea580c"/>
      <ellipse cx="85" cy="0" rx="88" ry="135" fill="#ea580c"/>
      <ellipse cx="0" cy="0" rx="98" ry="145" fill="#f97316"/>
      <polygon points="-68,-45 -22,-32 -48,-68" fill="#fef08a"/>
      <polygon points="68,-45 22,-32 48,-68" fill="#fef08a"/>
      <polygon points="0,-10 -18,18 18,18" fill="#fef08a"/>
      <path d="M-92,42 Q0,104 92,42 L68,78 L42,58 L16,84 L-16,84 L-42,58 L-68,78 Z" fill="#fef08a"/>
    </g>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 22, '#fb923c', 120, H - 300);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  thanksgiving(seed = 249, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#fbf5ee' : theme.darkOverrides?.bgTop || '#431407';
    const bgMid = theme.isMinimal ? '#f5e8d8' : theme.darkOverrides?.bgMid || '#7c2d12';
    const bgBot = theme.isMinimal ? '#ebd5bc' : theme.darkOverrides?.bgBot || '#270b03';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    // Autumn Maple Leaves
    const leaf = (x, y, sc, rot, col) =>
      `<g transform="translate(${x},${y}) rotate(${rot}) scale(${sc})">
        <path d="M0,-80 L18,-34 L68,-42 L38,0 L64,40 L12,32 L0,80 L-12,32 L-64,40 L-38,0 L-68,-42 L-18,-34 Z" fill="${col}"/>
      </g>`;
    hero += leaf(230, 320, 1.0, -24, '#f59e0b');
    hero += leaf(840, 340, 1.1, 22, '#dc2626');
    hero += leaf(200, 660, 0.85, 16, '#ea580c');
    hero += leaf(870, 680, 0.9, -18, '#fbbf24');
    // Harvest Pumpkin & Wheat Halo
    hero += `<circle cx="540" cy="640" r="245" fill="none" stroke="${theme.metalLight}" stroke-width="3" stroke-dasharray="10 10" opacity="0.55"/>`;
    hero += `<g transform="translate(540,780)">
      <rect x="-18" y="-175" width="36" height="58" rx="10" fill="#78350f"/>
      <ellipse cx="-100" cy="0" rx="95" ry="135" fill="#c2410c"/>
      <ellipse cx="100" cy="0" rx="95" ry="135" fill="#c2410c"/>
      <ellipse cx="-48" cy="0" rx="90" ry="142" fill="#ea580c"/>
      <ellipse cx="48" cy="0" rx="90" ry="142" fill="#ea580c"/>
      <ellipse cx="0" cy="0" rx="78" ry="146" fill="#f97316"/>
    </g>`;

    body += heroGroup(H, hero);
    body += bokeh(rand, 22, ['#fbbf24', '#fb923c'], 10, 34, H - 280, 180);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  blackfriday(seed = 257, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f4f4f5' : '#050508';
    const bgMid = theme.isMinimal ? '#e4e4e7' : '#12131d';
    const bgBot = theme.isMinimal ? '#d4d4d8' : '#020204';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.5" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 3, theme, rand, H);

    let hero = '';
    // Geometric Luxury Prism Rays & Faceted Diamond
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      hero += `<line x1="540" y1="560" x2="${(540 + Math.cos(a) * 620).toFixed(1)}" y2="${(560 + Math.sin(a) * 620).toFixed(1)}" stroke="${i % 2 ? theme.metalLight : theme.accent}" stroke-width="${i % 3 ? 2 : 5}" opacity="0.38"/>`;
    }
    hero += `<g transform="translate(540,560)">
      <polygon points="0,-240 240,0 0,240 -240,0" fill="${theme.accent}" opacity="0.16" stroke="${theme.metalLight}" stroke-width="4"/>
      <polygon points="0,-175 175,0 0,175 -175,0" fill="${theme.metalMid}" opacity="0.22" stroke="${theme.accent}" stroke-width="3"/>
      <polygon points="0,-105 105,0 0,105 -105,0" fill="${theme.metalLight}" opacity="0.88"/>
    </g>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 26, theme.metalLight, 120, H - 280);
    body += grain('gr', H);
    return svgWrap(defs, body, H);
  },

  oktoberfest(seed = 265, theme, H) {
    const rand = mulberry32(seed);
    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0369a1"/><stop offset="1" stop-color="#0c4a6e"/>
      </linearGradient>
      <pattern id="bavaria" width="120" height="160" patternUnits="userSpaceOnUse">
        <polygon points="60,0 120,80 60,160 0,80" fill="#f8fafc" opacity="0.18"/>
      </pattern>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#bavaria)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Golden Barley Wreath & Heraldic Shield
    hero += `<circle cx="540" cy="590" r="245" fill="none" stroke="${theme.metalLight}" stroke-width="14" stroke-dasharray="22 14"/>`;
    hero += `<circle cx="540" cy="590" r="195" fill="#0c4a6e" stroke="${theme.metalMid}" stroke-width="6"/>`;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = 540 + Math.cos(a) * 245;
      const y = 590 + Math.sin(a) * 245;
      hero += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="12" ry="26" fill="#fbbf24" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    hero += `<path d="M440,480 L640,480 L640,630 Q540,740 440,630 Z" fill="#f8fafc" stroke="${theme.metalMid}" stroke-width="8"/>`;
    hero += `<path d="M440,480 L640,630 M640,480 L440,630" stroke="#0284c7" stroke-width="18" opacity="0.85"/>`;

    body += heroGroup(H, hero);
    body += grain('gr', H, 0.035);
    return svgWrap(defs, body, H);
  },

  mothersday(seed = 273, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.darkOverrides ? theme.darkOverrides.bgTop : '#fff1f2';
    const bgMid = theme.darkOverrides ? theme.darkOverrides.bgMid : '#ffe4e6';
    const bgBot = theme.darkOverrides ? theme.darkOverrides.bgBot : '#fce7f3';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed, theme, rand, H);

    let hero = '';
    hero += `<circle cx="540" cy="580" r="240" fill="none" stroke="${theme.metalMid}" stroke-width="5"/>`;
    const roseCols = ['#fb7185', '#f472b6', '#fda4af', '#f43f5e'];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = 540 + Math.cos(a) * 240;
      const y = 580 + Math.sin(a) * 240;
      hero += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="44" fill="${roseCols[i % 4]}" opacity="0.92"/>`;
      hero += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="#ffe4e6" opacity="0.65"/>`;
    }
    hero += `<circle cx="540" cy="580" r="95" fill="#fb7185" opacity="0.24" filter="url(#glow)"/>`;

    body += heroGroup(H, hero);
    body += sparkles(rand, 22, theme.metalMid, 140, H - 300);
    body += grain('gr', H, 0.03);
    return svgWrap(defs, body, H);
  },

  fathersday(seed = 281, theme, H) {
    const rand = mulberry32(seed);
    const bgTop = theme.isMinimal ? '#f1f5f9' : '#0f172a';
    const bgMid = theme.isMinimal ? '#e2e8f0' : '#1e293b';
    const bgBot = theme.isMinimal ? '#cbd5e1' : '#090f1d';

    const defs = `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bgTop}"/><stop offset="0.55" stop-color="${bgMid}"/><stop offset="1" stop-color="${bgBot}"/>
      </linearGradient>`;

    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    body += layoutFrame(seed + 1, theme, rand, H);

    let hero = '';
    // Tailored Geometric Crest & Star Compass
    hero += `<circle cx="540" cy="580" r="225" fill="none" stroke="${theme.metalMid}" stroke-width="5"/>`;
    hero += `<circle cx="540" cy="580" r="185" fill="none" stroke="${theme.metalLight}" stroke-width="2" stroke-dasharray="8 8"/>`;
    hero += `<path d="M540,340 L580,540 L780,580 L580,620 L540,820 L500,620 L300,580 L500,540 Z" fill="${theme.metalMid}" opacity="0.88"/>`;
    hero += `<circle cx="540" cy="580" r="32" fill="${theme.metalLight}"/>`;

    body += heroGroup(H, hero);
    body += grain('gr', H, 0.04);
    return svgWrap(defs, body, H);
  },
};

export const FESTIVAL_KEY = {
  // Indian & Regional Festivals
  Diwali: 'diwali',
  Holi: 'holi',
  Navratri: 'navratri',
  'Durga Puja': 'durgapuja',
  'Ganesh Chaturthi': 'ganesh',
  'Raksha Bandhan': 'rakhi',
  Eid: 'eid',
  Christmas: 'christmas',
  Pongal: 'pongal',
  Onam: 'onam',
  Baisakhi: 'baisakhi',
  Lohri: 'lohri',
  'Makar Sankranti': 'makarsankranti',
  Janmashtami: 'janmashtami',
  Chhath: 'chhath',
  Bihu: 'bihu',
  'Gudi Padwa': 'gudipadwa',
  'Karva Chauth': 'karvachauth',
  Ugadi: 'gudipadwa',
  Vishu: 'vishu',
  Dussehra: 'navratri',
  'Maha Shivratri': 'mahashivratri',
  // International Festivals & Moments
  'New Year': 'newyear',
  "Valentine's Day": 'valentines',
  Easter: 'easter',
  Ramadan: 'eid',
  Hanukkah: 'hanukkah',
  'Chinese New Year': 'chinesenewyear',
  Halloween: 'halloween',
  Thanksgiving: 'thanksgiving',
  'Black Friday': 'blackfriday',
  'Cyber Monday': 'blackfriday',
  Oktoberfest: 'oktoberfest',
  "Mother's Day": 'mothersday',
  "Father's Day": 'fathersday',
  "Singles' Day": 'blackfriday',
};

export function makePosterSVG(
  festival,
  seed = 7,
  stylePreset = 'Festive Gold',
  aspectRatio = 'instagram_feed'
) {
  const key = FESTIVAL_KEY[festival] || 'diwali';
  const theme = getTheme(stylePreset);
  const H = getHeightForAspect(aspectRatio);
  return POSTERS[key](seed || 7, theme, H);
}
