/**
 * Hermes.io — Celestial Star & Planet Avatar Generator
 * Generates unique, deterministic procedural SVG profile pictures of planets, stars, and cosmic bodies.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CelestialAvatars = factory();
    // Expose convenience functions on window
    root.generateCelestialAvatar = root.CelestialAvatars.generate;
    root.getCelestialAvatarUrl = root.CelestialAvatars.getUrl;
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Seeded pseudo-random number generator
  function createRNG(seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    }
    return function () {
      h += h << 13;
      h ^= h >>> 7;
      h += h << 3;
      h ^= h >>> 17;
      return ((h += h << 5) >>> 0) / 4294967296;
    };
  }

  // 10 Distinct Cosmic Themes with rich palettes
  const COSMIC_PALETTES = [
    {
      type: 'saturn-ring',
      name: 'Chronos Gas Giant',
      spaceBg: ['#0A0612', '#140A26'],
      body: ['#F59E0B', '#D97706', '#78350F'],
      glow: '#FCD34D',
      ring: '#FDE68A',
      accent: '#FDE047',
      stars: '#FFFBEB'
    },
    {
      type: 'terrestrial-blue',
      name: 'Oceanic Kepler',
      spaceBg: ['#030712', '#081A36'],
      body: ['#38BDF8', '#0284C7', '#0369A1'],
      glow: '#7DD3FC',
      ring: null,
      accent: '#34D399',
      stars: '#F0F9FF'
    },
    {
      type: 'pulsar-star',
      name: 'Helios Flare Star',
      spaceBg: ['#120406', '#26080F'],
      body: ['#F43F5E', '#E11D48', '#881337'],
      glow: '#FDA4AF',
      ring: '#FECDD3',
      accent: '#FFE4E6',
      stars: '#FFF1F2'
    },
    {
      type: 'ice-giant',
      name: 'Neptunian Frost',
      spaceBg: ['#020E18', '#062038'],
      body: ['#22D3EE', '#0891B2', '#164E63'],
      glow: '#A5F3FC',
      ring: '#CFFAFE',
      accent: '#67E8F9',
      stars: '#ECFEFF'
    },
    {
      type: 'emerald-terra',
      name: 'Verdant Eden',
      spaceBg: ['#021208', '#062615'],
      body: ['#10B981', '#059669', '#064E3B'],
      glow: '#6EE7B7',
      ring: null,
      accent: '#A7F3D0',
      stars: '#ECFDF5'
    },
    {
      type: 'violet-nebula',
      name: 'Void Nebula World',
      spaceBg: ['#0F0619', '#1E0C33'],
      body: ['#A855F7', '#7E22CE', '#3B0764'],
      glow: '#D8B4FE',
      ring: '#E9D5FF',
      accent: '#C084FC',
      stars: '#FAF5FF'
    },
    {
      type: 'volcanic-magma',
      name: 'Pyros Core',
      spaceBg: ['#140804', '#261208'],
      body: ['#FB923C', '#C2410C', '#431407'],
      glow: '#FDBA74',
      ring: null,
      accent: '#EF4444',
      stars: '#FFF7ED'
    },
    {
      type: 'supernova-gold',
      name: 'Solar Corona',
      spaceBg: ['#100E04', '#241E08'],
      body: ['#EAB308', '#CA8A04', '#713F12'],
      glow: '#FEF08A',
      ring: '#FEF9C3',
      accent: '#FDE047',
      stars: '#FEFCE8'
    },
    {
      type: 'amethyst-pulsar',
      name: 'Astral Warp',
      spaceBg: ['#0C0617', '#1E0A38'],
      body: ['#6366F1', '#4338CA', '#312E81'],
      glow: '#A5B4FC',
      ring: '#C7D2FE',
      accent: '#818CF8',
      stars: '#EEF2FF'
    },
    {
      type: 'lunar-crater',
      name: 'Silica Moon',
      spaceBg: ['#0B0D11', '#161A22'],
      body: ['#94A3B8', '#64748B', '#334155'],
      glow: '#CBD5E1',
      ring: null,
      accent: '#E2E8F0',
      stars: '#F8FAFC'
    }
  ];

  function generate(seed, size = 120) {
    const seedStr = String(seed || 'hermes-cosmic-seed');
    const rng = createRNG(seedStr);

    const paletteIdx = Math.floor(rng() * COSMIC_PALETTES.length);
    const pal = COSMIC_PALETTES[paletteIdx];

    const cx = 60;
    const cy = 60;
    const planetRadius = 24 + Math.floor(rng() * 6); // 24 to 29
    const hasRing = pal.ring !== null && rng() > 0.3;
    const ringAngle = -25 + (rng() * 50); // -25 to +25 deg
    const ringThickness = 3.5 + (rng() * 2);
    const hasMoon = rng() > 0.4;
    const moonRadius = 3 + Math.floor(rng() * 3);
    const moonAngle = rng() * Math.PI * 2;
    const moonDist = planetRadius + 14 + (rng() * 8);
    const mx = cx + Math.cos(moonAngle) * moonDist;
    const my = cy + Math.sin(moonAngle) * moonDist;

    // Unique IDs for SVG definitions
    const uid = 'cel_' + Math.abs(Math.sin(rng()) * 10000000 | 0);

    // Generate 16-24 random twinkling stars
    const starCount = 18 + Math.floor(rng() * 10);
    let starsSvg = '';
    for (let i = 0; i < starCount; i++) {
      const sx = Math.floor(rng() * 110) + 5;
      const sy = Math.floor(rng() * 110) + 5;
      // Skip if star is inside the planet center
      const d = Math.hypot(sx - cx, sy - cy);
      if (d < planetRadius + 3) continue;

      const sr = (0.5 + rng() * 1.3).toFixed(1);
      const op = (0.35 + rng() * 0.65).toFixed(2);
      starsSvg += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${pal.stars}" opacity="${op}"/>`;
      // Occasional 4-point sparkle star
      if (i % 7 === 0) {
        starsSvg += `<path d="M ${sx} ${sy-3} Q ${sx} ${sy} ${sx+3} ${sy} Q ${sx} ${sy} ${sx} ${sy+3} Q ${sx} ${sy} ${sx-3} ${sy} Z" fill="${pal.glow}" opacity="0.7"/>`;
      }
    }

    // Band details or craters inside the planet
    let surfaceDetails = '';
    if (pal.type.includes('saturn') || pal.type.includes('ice') || pal.type.includes('pulsar')) {
      // Atmospheric bands
      const bandOffset = (rng() * 4 - 2);
      surfaceDetails += `
        <ellipse cx="${cx + bandOffset}" cy="${cy - 7}" rx="${planetRadius - 2}" ry="4" fill="${pal.body[1]}" opacity="0.6" />
        <ellipse cx="${cx - bandOffset}" cy="${cy + 5}" rx="${planetRadius - 3}" ry="3.5" fill="${pal.body[2]}" opacity="0.7" />
        <ellipse cx="${cx}" cy="${cy + 12}" rx="${planetRadius - 6}" ry="2.5" fill="${pal.accent}" opacity="0.3" />
      `;
    } else if (pal.type.includes('terrestrial') || pal.type.includes('emerald')) {
      // Continents / clouds
      surfaceDetails += `
        <path d="M ${cx-12} ${cy-8} Q ${cx-5} ${cy-16} ${cx+4} ${cy-10} Q ${cx+10} ${cy-4} ${cx+6} ${cy+8} Q ${cx-4} ${cy+6} ${cx-12} ${cy-8} Z" fill="${pal.accent}" opacity="0.65" />
        <path d="M ${cx-4} ${cy+6} Q ${cx+5} ${cy+12} ${cx+12} ${cy+4} Q ${cx+8} ${cy-2} ${cx+2} ${cy+2} Z" fill="${pal.accent}" opacity="0.5" />
      `;
    } else if (pal.type.includes('volcanic') || pal.type.includes('lunar')) {
      // Magma fissures / craters
      surfaceDetails += `
        <circle cx="${cx - 8}" cy="${cy - 6}" r="4.5" fill="${pal.body[2]}" opacity="0.8" />
        <circle cx="${cx + 9}" cy="${cy + 5}" r="3.5" fill="${pal.body[2]}" opacity="0.8" />
        <circle cx="${cx - 4}" cy="${cy + 10}" r="2" fill="${pal.accent}" opacity="0.9" />
        <circle cx="${cx + 6}" cy="${cy - 10}" r="2.5" fill="${pal.body[2]}" opacity="0.7" />
      `;
    }

    // Ring SVG if present
    const ringBack = hasRing
      ? `<ellipse cx="${cx}" cy="${cy}" rx="${planetRadius + 14}" ry="${(planetRadius + 14) * 0.32}"
          fill="none" stroke="${pal.ring}" stroke-width="${ringThickness}" stroke-dasharray="1 0" opacity="0.5"
          transform="rotate(${ringAngle} ${cx} ${cy})"/>`
      : '';

    const ringFront = hasRing
      ? `<ellipse cx="${cx}" cy="${cy}" rx="${planetRadius + 14}" ry="${(planetRadius + 14) * 0.32}"
          fill="none" stroke="${pal.ring}" stroke-width="${ringThickness}" opacity="0.9"
          clip-path="url(#clip-front-${uid})"
          transform="rotate(${ringAngle} ${cx} ${cy})"/>`
      : '';

    // Moon element
    const moonSvg = hasMoon
      ? `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${moonRadius}" fill="${pal.accent}" opacity="0.9" filter="url(#glow-${uid})" />
         <circle cx="${(mx + 1).toFixed(1)}" cy="${(my + 1).toFixed(1)}" r="${moonRadius * 0.4}" fill="${pal.body[2]}" opacity="0.5" />`
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" class="celestial-avatar" data-seed="${seedStr}">
      <defs>
        <!-- Deep Space Background Radial -->
        <radialGradient id="space-${uid}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${pal.spaceBg[1]}" />
          <stop offset="100%" stop-color="${pal.spaceBg[0]}" />
        </radialGradient>

        <!-- Planet Core Gradient -->
        <radialGradient id="body-${uid}" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stop-color="${pal.glow}" stop-opacity="1" />
          <stop offset="45%" stop-color="${pal.body[0]}" />
          <stop offset="85%" stop-color="${pal.body[1]}" />
          <stop offset="100%" stop-color="${pal.body[2]}" />
        </radialGradient>

        <!-- Atmospheric Glow Filter -->
        <filter id="glow-${uid}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Planet Shape Clip (for surface texturing) -->
        <clipPath id="planet-clip-${uid}">
          <circle cx="${cx}" cy="${cy}" r="${planetRadius}" />
        </clipPath>

        <!-- Clip to draw the ring in FRONT of the lower half only -->
        <clipPath id="clip-front-${uid}">
          <rect x="0" y="${cy - 2}" width="120" height="70" />
        </clipPath>
      </defs>

      <!-- Space Backdrop Circle -->
      <circle cx="60" cy="60" r="58" fill="url(#space-${uid})" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

      <!-- Starfield -->
      ${starsSvg}

      <!-- Distant Ring Half (behind planet) -->
      ${ringBack}

      <!-- Outer Corona Glow -->
      <circle cx="${cx}" cy="${cy}" r="${planetRadius + 3}" fill="${pal.glow}" opacity="0.22" filter="url(#glow-${uid})" />

      <!-- Planet Body Sphere -->
      <circle cx="${cx}" cy="${cy}" r="${planetRadius}" fill="url(#body-${uid})" filter="url(#glow-${uid})" />

      <!-- Surface Textures & Continents (clipped to sphere) -->
      <g clip-path="url(#planet-clip-${uid})">
        ${surfaceDetails}
        <!-- Shadow Crescent for 3D sphere volume -->
        <path d="M ${cx} ${cy-planetRadius} A ${planetRadius} ${planetRadius} 0 0 1 ${cx+planetRadius} ${cy} A ${planetRadius} ${planetRadius} 0 0 1 ${cx} ${cy+planetRadius} A ${planetRadius*0.75} ${planetRadius} 0 0 0 ${cx} ${cy-planetRadius} Z"
              fill="${pal.spaceBg[0]}" opacity="0.45" />
      </g>

      <!-- Front Ring Half (passes over lower body) -->
      ${ringFront}

      <!-- Natural Satellite (Moon) -->
      ${moonSvg}

      <!-- Specular Highlight -->
      <ellipse cx="${cx - planetRadius * 0.4}" cy="${cy - planetRadius * 0.4}" rx="${planetRadius * 0.3}" ry="${planetRadius * 0.18}"
               fill="#FFFFFF" opacity="0.28" transform="rotate(-30 ${cx - planetRadius * 0.4} ${cy - planetRadius * 0.4})" />
    </svg>`;
  }

  function getUrl(seed, size = 120) {
    const svg = generate(seed, size);
    if (typeof btoa === 'function') {
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  return {
    generate,
    getUrl,
    palettes: COSMIC_PALETTES
  };
}));
