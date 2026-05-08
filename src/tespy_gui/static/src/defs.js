// ═══════════════════════════════════════════════════════
// COMPONENT AND CONNECTION DEFINITIONS (loaded from JSON)
// ═══════════════════════════════════════════════════════
export let COMPONENT_DEFS = {};
export let CONNECTION_DEFS = {};

export function deriveCategory(modulePath) {
  const seg = (modulePath || '').split('.')[2] || 'other';
  return seg.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export function boxSVG(w, h, typeName) {
  const words = typeName.replace(/([A-Z])/g, ' $1').trim().split(' ');
  const lines = [];
  let cur = '';
  words.forEach(word => {
    const next = cur ? cur + ' ' + word : word;
    if (next.length > 10 && cur) { lines.push(cur); cur = word; }
    else cur = next;
  });
  if (cur) lines.push(cur);
  const lh = 10;
  const ty = h / 2 - ((lines.length - 1) * lh) / 2;
  const textRows = lines.map((l, i) =>
    `<text x="${w/2}" y="${ty + i * lh}" text-anchor="middle" font-size="8" font-family="JetBrains Mono,monospace" fill="#8892a4">${l}</text>`
  ).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${w-2}" height="${h-2}" rx="4" fill="#1a1f2e" stroke="#4a5568" stroke-width="1.5"/>
    ${textRows}
  </svg>`;
}

// Build the default portConfig for a new node from portDefs.
// variable  → param: min count
// conditional → param: first 'when' value encountered (deterministic)
export function defaultPortConfig(portDefs) {
  const config = {};
  const condSeen = {};
  for (const pd of Object.values(portDefs || {})) {
    if (!pd) continue;
    if (pd.type === 'variable') {
      if (config[pd.parameter] === undefined) config[pd.parameter] = pd.min;
    } else if (pd.type === 'conditional') {
      if (!condSeen[pd.parameter]) {
        condSeen[pd.parameter] = true;
        config[pd.parameter] = pd.when;  // default to first option
      }
    }
  }
  return config;
}

// Compute the live connector list from portDefs + portConfig.
export function computeConnectors(portDefs, portConfig) {
  const groups = [
    ['inlets',      'inlet'],
    ['outlets',     'outlet'],
    ['powerinlets', 'power-in'],
    ['poweroutlets','power-out'],
  ];

  const collected = { inlet: [], outlet: [], 'power-in': [], 'power-out': [] };

  for (const [key, connType] of groups) {
    const pd = portDefs[key];
    if (!pd) continue;
    let ids = [];
    if (pd.type === 'fixed') {
      ids = pd.ports || [];
    } else if (pd.type === 'variable') {
      const n = (portConfig && portConfig[pd.parameter] !== undefined)
        ? portConfig[pd.parameter] : pd.min;
      ids = Array.from({ length: n }, (_, i) => pd.pattern.replace('{n}', i + 1));
    } else if (pd.type === 'conditional') {
      const sel = portConfig && portConfig[pd.parameter];
      ids = sel === pd.when ? (pd.ports || []) : [];
    }
    collected[connType].push(...ids);
  }

  const { inlet: ins, outlet: outs, 'power-in': pins, 'power-out': pouts } = collected;
  const conns = [];
  ins.forEach((id, i)   => conns.push({ id, type: 'inlet',     x: 0, y: (i + 1) / (ins.length   + 1) }));
  outs.forEach((id, i)  => conns.push({ id, type: 'outlet',    x: 1, y: (i + 1) / (outs.length  + 1) }));
  const tp = pins.length + pouts.length;
  pins.forEach((id, i)  => conns.push({ id, type: 'power-in',  x: (i + 1) / (tp + 1), y: 1 }));
  pouts.forEach((id, i) => conns.push({ id, type: 'power-out', x: (pins.length + i + 1) / (tp + 1), y: 1 }));
  return conns;
}

export function buildComponentDef(typeName, compData) {
  const portDefs = {
    inlets:       compData.inlets       || { type: 'fixed', ports: [] },
    outlets:      compData.outlets      || { type: 'fixed', ports: [] },
    powerinlets:  compData.powerinlets  || { type: 'fixed', ports: [] },
    poweroutlets: compData.poweroutlets || { type: 'fixed', ports: [] },
  };
  const defaultConns = computeConnectors(portDefs, defaultPortConfig(portDefs));
  const fluidRows = Math.max(
    defaultConns.filter(c => c.type === 'inlet').length,
    defaultConns.filter(c => c.type === 'outlet').length,
    1
  );
  const w = 80;
  const h = Math.max(fluidRows * 20 + 20, 40);

  return {
    type: typeName,
    label: typeName,
    w, h,
    draw: (s) => boxSVG(s.w, s.h, typeName),
    portDefs,
    parameters: compData.parameters || [],
    module: compData.module || '',
  };
}

export async function loadDefs() {
  const [compJson, connJson] = await Promise.all([
    fetch('/component.json').then(r => r.json()),
    fetch('/connection.json').then(r => r.json()),
  ]);
  CONNECTION_DEFS = connJson;
  Object.entries(compJson).forEach(([typeName, compData]) => {
    COMPONENT_DEFS[typeName] = buildComponentDef(typeName, compData);
  });
}
