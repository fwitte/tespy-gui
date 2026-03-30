// ═══════════════════════════════════════════════════════
// ELEMENT LIBRARY DEFINITIONS
// ═══════════════════════════════════════════════════════
const LIBRARY = [
  {
    category: 'Turbomachinery',
    items: [
      {
        type: 'turbine',
        label: 'Turbine',
        w: 64, h: 64,
        draw: (s) => turbineSVG(s, '#00d4aa'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0,    y: 0.5  },
          { id: 'out', type: 'outlet', x: 1,    y: 0.5  },
        ]
      },
      {
        type: 'Compressor',
        label: 'Compressor',
        w: 64, h: 64,
        draw: (s) => compressorSVG(s, '#0099ff'),
        connectors: [
          { id: 'in',    type: 'inlet',     x: 0,   y: 0.5 },
          { id: 'out',   type: 'outlet',    x: 1,   y: 0.5 },
          { id: 'power', type: 'power-in',  x: 0.5, y: 1   },
        ]
      },
      {
        type: 'pump',
        label: 'Pump',
        w: 60, h: 60,
        draw: (s) => pumpSVG(s, '#b388ff'),
        connectors: [
          { id: 'in',    type: 'inlet',    x: 0,   y: 0.5 },
          { id: 'out',   type: 'outlet',   x: 1,   y: 0.5 },
          { id: 'power', type: 'power-in', x: 0.5, y: 1   },
        ]
      },
      {
        type: 'fan',
        label: 'Fan',
        w: 60, h: 60,
        draw: (s) => fanSVG(s, '#80deea'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'out', type: 'outlet', x: 1,   y: 0.5 },
        ]
      },
    ]
  },
  {
    category: 'Heat Transfer',
    items: [
      {
        type: 'HeatExchanger',
        label: 'Heat Exchanger',
        w: 80, h: 56,
        draw: (s) => heatExchangerSVG(s, '#ff6b35'),
        connectors: [
          { id: 'shell_in',  type: 'inlet',  x: 0,   y: 0.3  },
          { id: 'shell_out', type: 'outlet', x: 1,   y: 0.3  },
          { id: 'tube_in',   type: 'inlet',  x: 1,   y: 0.7  },
          { id: 'tube_out',  type: 'outlet', x: 0,   y: 0.7  },
        ]
      },
      {
        type: 'condenser',
        label: 'Condenser',
        w: 76, h: 52,
        draw: (s) => condenserSVG(s, '#4dd0e1'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0.5, y: 0   },
          { id: 'out', type: 'outlet', x: 0.5, y: 1   },
        ]
      },
      {
        type: 'evaporator',
        label: 'Evaporator',
        w: 76, h: 52,
        draw: (s) => evaporatorSVG(s, '#ff8a65'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0.5, y: 1   },
          { id: 'out', type: 'outlet', x: 0.5, y: 0   },
        ]
      },
      {
        type: 'heater',
        label: 'Heater',
        w: 60, h: 52,
        draw: (s) => heaterSVG(s, '#ffca28'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'out', type: 'outlet', x: 1,   y: 0.5 },
        ]
      },
      {
        type: 'cooler',
        label: 'Cooler',
        w: 60, h: 52,
        draw: (s) => coolerSVG(s, '#4fc3f7'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'out', type: 'outlet', x: 1,   y: 0.5 },
        ]
      },
    ]
  },
  {
    category: 'Vessels',
    items: [
      {
        type: 'vessel',
        label: 'Vessel',
        w: 56, h: 80,
        draw: (s) => vesselSVG(s, '#a5d6a7'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0.5, y: 0   },
          { id: 'out', type: 'outlet', x: 0.5, y: 1   },
        ]
      },
      {
        type: 'separator',
        label: 'Separator',
        w: 72, h: 52,
        draw: (s) => separatorSVG(s, '#ce93d8'),
        connectors: [
          { id: 'in',    type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'vap',   type: 'outlet', x: 0.5, y: 0   },
          { id: 'liq',   type: 'outlet', x: 0.5, y: 1   },
        ]
      },
      {
        type: 'column',
        label: 'Column',
        w: 52, h: 100,
        draw: (s) => columnSVG(s, '#ef9a9a'),
        connectors: [
          { id: 'feed',    type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'top',     type: 'outlet', x: 0.5, y: 0   },
          { id: 'bottom',  type: 'outlet', x: 0.5, y: 1   },
          { id: 'reboiler',type: 'inlet',  x: 1,   y: 0.8 },
          { id: 'reflux',  type: 'inlet',  x: 1,   y: 0.2 },
        ]
      },
      {
        type: 'tank',
        label: 'Tank',
        w: 64, h: 64,
        draw: (s) => tankSVG(s, '#80cbc4'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0.5, y: 0   },
          { id: 'out', type: 'outlet', x: 0.5, y: 1   },
        ]
      },
    ]
  },
  {
    category: 'Utilities',
    items: [
      {
        type: 'Valve',
        label: 'Valve',
        w: 52, h: 36,
        draw: (s) => valveSVG(s, '#fff176'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'out', type: 'outlet', x: 1,   y: 0.5 },
        ]
      },
      {
        type: 'mixer',
        label: 'Mixer',
        w: 56, h: 56,
        draw: (s) => mixerSVG(s, '#b0bec5'),
        connectors: [
          { id: 'in1', type: 'inlet',  x: 0,   y: 0.3 },
          { id: 'in2', type: 'inlet',  x: 0,   y: 0.7 },
          { id: 'out', type: 'outlet', x: 1,   y: 0.5 },
        ]
      },
      {
        type: 'splitter',
        label: 'Splitter',
        w: 56, h: 56,
        draw: (s) => splitterSVG(s, '#f48fb1'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0,   y: 0.5 },
          { id: 'out1',type: 'outlet', x: 1,   y: 0.3 },
          { id: 'out2',type: 'outlet', x: 1,   y: 0.7 },
        ]
      },
      {
        type: 'Source',
        label: 'Source',
        w: 48, h: 48,
        draw: (s) => sourceSVG(s, '#a5d6a7'),
        connectors: [
          { id: 'out', type: 'outlet', x: 1,   y: 0.5 },
        ]
      },
      {
        type: 'Sink',
        label: 'Sink',
        w: 48, h: 48,
        draw: (s) => sinkSVG(s, '#ef9a9a'),
        connectors: [
          { id: 'in', type: 'inlet',  x: 0,   y: 0.5 },
        ]
      },
    ]
  },
  {
    category: 'Power',
    items: [
      {
        type: 'Motor',
        label: 'Motor',
        w: 52, h: 52,
        draw: (s) => motorSVG(s, '#ffc107'),
        connectors: [
          { id: 'power_in',  type: 'power-in',  x: 0,   y: 0.5 },
          { id: 'power_out', type: 'power-out', x: 1,   y: 0.5 },
        ]
      },
      {
        type: 'PowerBus',
        label: 'Power Bus',
        w: 88, h: 60,
        draw: (s) => powerBusSVG(s, '#ffc107'),
        connectors: [],  // generated dynamically via varPorts
        varPorts: { 'power-in': 1, 'power-out': 4 },
      },
      {
        type: 'PowerSource',
        label: 'Power Source',
        w: 48, h: 48,
        draw: (s) => powerSourceSVG(s, '#ffc107'),
        connectors: [
          { id: 'power', type: 'power-out', x: 1, y: 0.5 },
        ]
      },
      {
        type: 'CycleCloser',
        label: 'Cycle Closer',
        w: 36, h: 36,
        draw: (s) => cycleCloserSVG(s, '#80cbc4'),
        connectors: [
          { id: 'in',  type: 'inlet',  x: 0, y: 0.5 },
          { id: 'out', type: 'outlet', x: 1, y: 0.5 },
        ]
      },
    ]
  },
];

// ═══════════════════════════════════════════════════════
// SVG DRAWING FUNCTIONS
// ═══════════════════════════════════════════════════════
function makeSVG(w, h, inner) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function turbineSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-4;
  return makeSVG(w,h,`
    <polygon points="${cx-r},${cy-r} ${cx+r},${cy-r/2} ${cx+r},${cy+r/2} ${cx-r},${cy+r}"
      fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="${c}" stroke-width="1" stroke-dasharray="3 2" opacity="0.4"/>
    <text x="${cx}" y="${cy+3}" text-anchor="middle" fill="${c}" font-size="10" font-family="JetBrains Mono" font-weight="600">T</text>
  `);
}

function compressorSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-4;
  return makeSVG(w,h,`
    <polygon points="${cx-r},${cy-r/2} ${cx+r},${cy-r} ${cx+r},${cy+r} ${cx-r},${cy+r/2}"
      fill="none" stroke="${c}" stroke-width="2"/>
    <text x="${cx}" y="${cy+3}" text-anchor="middle" fill="${c}" font-size="10" font-family="JetBrains Mono" font-weight="600">C</text>
  `);
}

function pumpSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-4;
  return makeSVG(w,h,`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="${cx}" y1="${cy-r+4}" x2="${cx}" y2="${cy+r-4}" stroke="${c}" stroke-width="1.5"/>
    <polyline points="${cx-6},${cy-4} ${cx+6},${cy-4} ${cx},${cy+6}" fill="${c}" opacity="0.7"/>
  `);
}

function fanSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-4;
  return makeSVG(w,h,`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M${cx},${cy} Q${cx+r-2},${cy-r+2} ${cx+r-4},${cy}" fill="${c}" opacity="0.6"/>
    <path d="M${cx},${cy} Q${cx-r+2},${cy+r-2} ${cx-r+4},${cy}" fill="${c}" opacity="0.6"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="${c}"/>
  `);
}

function heatExchangerSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="4" fill="none" stroke="${c}" stroke-width="2"/>
    ${[0,1,2,3,4].map(i=>`<line x1="4" y1="${8+i*(h-16)/4}" x2="${w-4}" y2="${8+i*(h-16)/4}" stroke="${c}" stroke-width="1" opacity="0.35"/>`).join('')}
    <path d="M12,${h/2} Q${w/2},${h/2-10} ${w-12},${h/2}" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.5"/>
  `);
}

function condenserSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="6" fill="none" stroke="${c}" stroke-width="2"/>
    ${[0,1,2].map(i=>`<line x1="${10+i*(w-20)/2}" y1="8" x2="${10+i*(w-20)/2}" y2="${h-8}" stroke="${c}" stroke-width="1" opacity="0.35"/>`).join('')}
    <text x="${w/2}" y="${h/2+4}" text-anchor="middle" fill="${c}" font-size="9" font-family="JetBrains Mono">COND</text>
  `);
}

function evaporatorSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="6" fill="none" stroke="${c}" stroke-width="2"/>
    ${[0,1,2].map(i=>`<path d="M${12+i*(w-24)/2},${h-8} Q${16+i*(w-24)/2},${h/2} ${12+i*(w-24)/2},8" fill="none" stroke="${c}" stroke-width="1" opacity="0.4"/>`).join('')}
    <text x="${w/2}" y="${h/2+4}" text-anchor="middle" fill="${c}" font-size="9" font-family="JetBrains Mono">EVAP</text>
  `);
}

function heaterSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="4" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M12,${h/2+4} Q${w*0.3},${h/2-8} ${w/2},${h/2+4} Q${w*0.7},${h/2+14} ${w-12},${h/2+4}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
  `);
}

function coolerSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="4" fill="none" stroke="${c}" stroke-width="2"/>
    ${[-1,0,1].map(i=>`<line x1="${w/2+i*8}" y1="10" x2="${w/2+i*6}" y2="${h-10}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`).join('')}
  `);
}

function vesselSVG(s, c) {
  const {w,h} = s;
  const rx=w/2-4;
  return makeSVG(w,h,`
    <rect x="${4}" y="${12}" width="${w-8}" height="${h-24}" fill="none" stroke="${c}" stroke-width="2"/>
    <ellipse cx="${w/2}" cy="${12}" rx="${rx}" ry="${8}" fill="none" stroke="${c}" stroke-width="2"/>
    <ellipse cx="${w/2}" cy="${h-12}" rx="${rx}" ry="${8}" fill="none" stroke="${c}" stroke-width="2"/>
  `);
}

function separatorSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="8" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="4" y1="${h/2}" x2="${w-4}" y2="${h/2}" stroke="${c}" stroke-width="1" stroke-dasharray="3 2" opacity="0.5"/>
    <circle cx="${w/2}" cy="${h*0.3}" r="4" fill="${c}" opacity="0.5"/>
    <rect x="${w/2-8}" y="${h*0.6}" width="16" height="5" rx="2" fill="${c}" opacity="0.5"/>
  `);
}

function columnSVG(s, c) {
  const {w,h} = s;
  const rx=w/2-4;
  return makeSVG(w,h,`
    <rect x="${4}" y="${14}" width="${w-8}" height="${h-28}" fill="none" stroke="${c}" stroke-width="2"/>
    <ellipse cx="${w/2}" cy="${14}" rx="${rx}" ry="${9}" fill="none" stroke="${c}" stroke-width="2"/>
    <ellipse cx="${w/2}" cy="${h-14}" rx="${rx}" ry="${9}" fill="none" stroke="${c}" stroke-width="2"/>
    ${[1,2,3].map(i=>`<line x1="6" y1="${14+i*(h-28)/4}" x2="${w-6}" y2="${14+i*(h-28)/4}" stroke="${c}" stroke-width="1" opacity="0.3"/>`).join('')}
  `);
}

function tankSVG(s, c) {
  const {w,h} = s;
  const rx=w/2-4, cy=h/2;
  return makeSVG(w,h,`
    <ellipse cx="${w/2}" cy="${8}" rx="${rx}" ry="${7}" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="${4}" y1="${8}" x2="${4}" y2="${h-8}" stroke="${c}" stroke-width="2"/>
    <line x1="${w-4}" y1="${8}" x2="${w-4}" y2="${h-8}" stroke="${c}" stroke-width="2"/>
    <ellipse cx="${w/2}" cy="${h-8}" rx="${rx}" ry="${7}" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="${4}" y1="${cy}" x2="${w-4}" y2="${cy}" stroke="${c}" stroke-width="1" stroke-dasharray="3 2" opacity="0.3"/>
  `);
}

function valveSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2;
  return makeSVG(w,h,`
    <polygon points="${4},${4} ${w-4},${cy} ${4},${h-4}" fill="none" stroke="${c}" stroke-width="2"/>
    <polygon points="${w-4},${4} ${4},${cy} ${w-4},${h-4}" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${4}" stroke="${c}" stroke-width="1.5"/>
    <line x1="${cx-5}" y1="${4}" x2="${cx+5}" y2="${4}" stroke="${c}" stroke-width="1.5"/>
  `);
}

function mixerSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2;
  return makeSVG(w,h,`
    <polygon points="${4},${4} ${w-4},${cy} ${4},${h-4}" fill="${c}" opacity="0.15" stroke="${c}" stroke-width="2"/>
    <text x="${cx+4}" y="${cy+4}" text-anchor="middle" fill="${c}" font-size="11" font-family="JetBrains Mono">+</text>
  `);
}

function splitterSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2;
  return makeSVG(w,h,`
    <polygon points="${w-4},${4} ${4},${cy} ${w-4},${h-4}" fill="${c}" opacity="0.15" stroke="${c}" stroke-width="2"/>
    <text x="${cx-4}" y="${cy+4}" text-anchor="middle" fill="${c}" font-size="11" font-family="JetBrains Mono">÷</text>
  `);
}

function sourceSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)/2-4}" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M${w/2-8},${h/2} L${w/2+4},${h/2} M${w/2},${h/2-8} L${w/2},${h/2+8}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
  `);
}

function sinkSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)/2-4}" fill="none" stroke="${c}" stroke-width="2"/>
    <rect x="${w/2-8}" y="${h/2-8}" width="16" height="16" rx="3" fill="${c}" opacity="0.5"/>
  `);
}

function motorSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-4;
  return makeSVG(w,h,`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="2"/>
    <text x="${cx}" y="${cy+4}" text-anchor="middle" fill="${c}" font-size="13" font-family="JetBrains Mono" font-weight="600">M</text>
  `);
}

function powerBusSVG(s, c) {
  const {w,h} = s;
  return makeSVG(w,h,`
    <rect x="4" y="8" width="${w-8}" height="${h-16}" rx="3" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="${(w-8)*0.33+4}" y1="8" x2="${(w-8)*0.33+4}" y2="${h-8}" stroke="${c}" stroke-width="1" opacity="0.35"/>
    <line x1="${(w-8)*0.66+4}" y1="8" x2="${(w-8)*0.66+4}" y2="${h-8}" stroke="${c}" stroke-width="1" opacity="0.35"/>
    <text x="${w/2}" y="${h/2+4}" text-anchor="middle" fill="${c}" font-size="8" font-family="JetBrains Mono" opacity="0.8">BUS</text>
  `);
}

function powerSourceSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-4;
  return makeSVG(w,h,`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M${cx+3},${cy-9} L${cx-4},${cy+1} L${cx+2},${cy+1} L${cx-3},${cy+9} L${cx+5},${cy-1} L${cx-1},${cy-1} Z" fill="${c}"/>
  `);
}

function cycleCloserSVG(s, c) {
  const {w,h} = s;
  const cx=w/2, cy=h/2;
  return makeSVG(w,h,`
    <polygon points="${cx},${4} ${w-4},${cy} ${cx},${h-4} ${4},${cy}" fill="none" stroke="${c}" stroke-width="2"/>
  `);
}

// ═══════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════
const state = {
  nodes: {},          // id -> nodeObj
  connections: [],    // [{id, from:{nodeId,connId}, to:{nodeId,connId}}]
  selected: new Set(), // ids of selected nodes and connections
  connPts: {},        // id -> pts[] user-overridden waypoints
  zoom: 1,
  pan: { x: 100, y: 60 },
  nextId: 1,
  // connect mode
  connectStart: null, // {nodeId, connId, el}
};

// ═══════════════════════════════════════════════════════
// SNAP TO GRID
// ═══════════════════════════════════════════════════════
const GRID = 20;
let snapEnabled = false;

function snapVal(v) { return snapEnabled ? Math.round(v / GRID) * GRID : v; }
function snapXY(x, y) { return { x: snapVal(x), y: snapVal(y) }; }

function setSnap(on) {
  snapEnabled = on;
  document.getElementById('btn-snap').classList.toggle('active', on);
  // Move dot grid background with pan/zoom is handled via applyTransform
}

// ═══════════════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════════════
const history = { stack: [], index: -1, locked: false, maxSize: 50 };

function takeSnapshot() {
  const snap = {
    version: '1.0',
    nodes: Object.values(state.nodes).map(n => ({
      id: n.id, type: n.type, label: n.label,
      x: n.x, y: n.y, props: JSON.parse(JSON.stringify(n.props)),
      rotation: n.rotation || 0,
      mirror: n.mirror || false,
      varPorts: n.varPorts ? JSON.parse(JSON.stringify(n.varPorts)) : null,
    })),
    connections: state.connections.map(c => ({
      id: c.id,
      label: c.label || c.id,
      connClass: c.connClass || 'fluid',
      from: { nodeId: c.from.nodeId, connId: c.from.connId },
      to:   { nodeId: c.to.nodeId,   connId: c.to.connId },
    })),
    _nextId: state.nextId,
    _connPts: JSON.parse(JSON.stringify(state.connPts)),
  };
  return snap;
}

function pushHistory() {
  if (history.locked) return;
  // Discard any redo states
  history.stack.splice(history.index + 1);
  history.stack.push(takeSnapshot());
  if (history.stack.length > history.maxSize) history.stack.shift();
  history.index = history.stack.length - 1;
}

function restoreSnapshot(snap) {
  history.locked = true;
  // Clear current canvas
  Object.keys(state.nodes).forEach(id => document.getElementById('node-' + id)?.remove());
  state.nodes = {};
  state.connections = [];
  document.getElementById('connections-g').innerHTML = '';
  selectNone();
  state.nextId = 1;
  // Rebuild
  (snap.nodes || []).forEach(n => {
    addNode(n.type, n.x, n.y, { id: n.id, label: n.label, props: n.props || {}, rotation: n.rotation || 0, mirror: n.mirror || false, varPorts: n.varPorts || null });
  });
  (snap.connections || []).forEach(c => {
    addConnection(c.from.nodeId, c.from.connId, c.to.nodeId, c.to.connId, c.id, c.label);
  });
  state.nextId = snap._nextId;
  state.connPts = snap._connPts ? JSON.parse(JSON.stringify(snap._connPts)) : {};
  updateStatus();
  history.locked = false;
}

function undo() {
  if (history.index <= 0) { statusMsg('Nothing to undo'); return; }
  history.index--;
  restoreSnapshot(history.stack[history.index]);
  statusMsg('Undo');
}

function redo() {
  if (history.index >= history.stack.length - 1) { statusMsg('Nothing to redo'); return; }
  history.index++;
  restoreSnapshot(history.stack[history.index]);
  statusMsg('Redo');
}

// ═══════════════════════════════════════════════════════
// BUILD SIDEBAR
// ═══════════════════════════════════════════════════════
function buildSidebar() {
  const sb = document.getElementById('sidebar');
  LIBRARY.forEach(cat => {
    const title = document.createElement('div');
    title.className = 'lib-section-title';
    title.textContent = cat.category;
    sb.appendChild(title);

    cat.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'lib-item';
      el.draggable = true;
      el.dataset.type = item.type;

      const iconDiv = document.createElement('div');
      iconDiv.className = 'lib-icon';
      iconDiv.innerHTML = item.draw({ w: item.w > 70 ? 36 : 32, h: item.h > 70 ? 32 : 28 });

      const label = document.createElement('div');
      label.className = 'lib-label';
      label.textContent = item.label;

      el.appendChild(iconDiv);
      el.appendChild(label);
      sb.appendChild(el);

      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('type', item.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  });
}

// ═══════════════════════════════════════════════════════
// CANVAS / PAN / ZOOM
// ═══════════════════════════════════════════════════════
const canvasWrap = document.getElementById('canvas-wrap');
const canvas = document.getElementById('canvas');

function applyTransform() {
  canvas.style.transform = `translate(${state.pan.x}px,${state.pan.y}px) scale(${state.zoom})`;
  document.getElementById('status-zoom').textContent = `Zoom: ${Math.round(state.zoom*100)}%`;
  const gs = GRID * state.zoom;
  const ox = ((state.pan.x % gs) + gs) % gs;
  const oy = ((state.pan.y % gs) + gs) % gs;
  canvasWrap.style.backgroundSize = `${gs}px ${gs}px`;
  canvasWrap.style.backgroundPosition = `${ox}px ${oy}px`;
}

// Zoom
canvasWrap.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = Math.max(0.2, Math.min(4, state.zoom * delta));

  const rect = canvasWrap.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  state.pan.x = mx - (mx - state.pan.x) * (newZoom / state.zoom);
  state.pan.y = my - (my - state.pan.y) * (newZoom / state.zoom);
  state.zoom = newZoom;
  applyTransform();
}, { passive: false });

// Pan + rectangle selection
let isPanning = false, panStart = {x:0,y:0};
const selRect = document.getElementById('select-rect');

canvasWrap.addEventListener('mousedown', e => {
  const onBackground = e.target === canvasWrap || e.target === canvas ||
    e.target.id === 'connections-svg' ||
    (e.target.closest('#connections-g') === null && e.target.tagName === 'svg');
  if (!onBackground) return;

  if (e.button === 1) {
    isPanning = true;
    panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
    e.preventDefault();
    return;
  }

  if (e.button === 0) {
    const wrapRect = canvasWrap.getBoundingClientRect();
    const startX = e.clientX - wrapRect.left;
    const startY = e.clientY - wrapRect.top;
    let hasMoved = false;

    selRect.style.left   = startX + 'px';
    selRect.style.top    = startY + 'px';
    selRect.style.width  = '0';
    selRect.style.height = '0';

    const onMove = ev => {
      hasMoved = true;
      selRect.style.display = 'block';
      const cx = ev.clientX - wrapRect.left;
      const cy = ev.clientY - wrapRect.top;
      selRect.style.left   = Math.min(cx, startX) + 'px';
      selRect.style.top    = Math.min(cy, startY) + 'px';
      selRect.style.width  = Math.abs(cx - startX) + 'px';
      selRect.style.height = Math.abs(cy - startY) + 'px';
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      selRect.style.display = 'none';

      if (!hasMoved) {
        if (!e.shiftKey) selectNone();
        return;
      }

      // Convert rect to canvas coords and select overlapping nodes
      const rl = parseFloat(selRect.style.left),  rt = parseFloat(selRect.style.top);
      const rr = rl + parseFloat(selRect.style.width), rb = rt + parseFloat(selRect.style.height);
      const cl = (rl - state.pan.x) / state.zoom, ct = (rt - state.pan.y) / state.zoom;
      const cr = (rr - state.pan.x) / state.zoom, cb = (rb - state.pan.y) / state.zoom;

      if (!e.shiftKey) selectNone();
      Object.values(state.nodes).forEach(nd => {
        const def = getItemDef(nd.type);
        const rSteps = ((nd.rotation || 0) / 90 + 4) % 4;
        const ew = rSteps % 2 === 0 ? def.w : def.h;
        const eh = rSteps % 2 === 0 ? def.h : def.w;
        if (nd.x < cr && nd.x + ew > cl && nd.y < cb && nd.y + eh > ct) {
          state.selected.add(nd.id);
          document.getElementById('node-' + nd.id)?.classList.add('selected');
        }
      });
      updatePropsForSelection();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
});
canvasWrap.addEventListener('mousemove', e => {
  if (isPanning) {
    state.pan.x = e.clientX - panStart.x;
    state.pan.y = e.clientY - panStart.y;
    applyTransform();
  }
});
canvasWrap.addEventListener('mouseup', () => { isPanning = false; });

// Drop
canvasWrap.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
canvasWrap.addEventListener('drop', e => {
  e.preventDefault();
  const type = e.dataTransfer.getData('type');
  if (!type) return;
  const def = getItemDef(type);
  if (!def) return;
  const rect = canvasWrap.getBoundingClientRect();
  const rx = (e.clientX - rect.left - state.pan.x) / state.zoom - def.w / 2;
  const ry = (e.clientY - rect.top  - state.pan.y) / state.zoom - def.h / 2;
  const { x, y } = snapXY(rx, ry);
  addNode(type, x, y);
  pushHistory();
});

// ═══════════════════════════════════════════════════════
// NODE MANAGEMENT
// ═══════════════════════════════════════════════════════
function getItemDef(type) {
  for (const cat of LIBRARY) for (const item of cat.items) if (item.type === type) return item;
  return null;
}

// Build connector list for a node, merging def base connectors with varPorts overrides
function buildVarConnectors(def, varPorts) {
  const result = [];
  // Gather all port types present in varPorts
  const portTypes = Object.keys(varPorts);
  // Group base connectors by type for positioning reference
  portTypes.forEach(ptype => {
    const count = varPorts[ptype];
    const side = (ptype === 'power-in') ? 'left' : 'right';
    const x = side === 'left' ? 0 : 1;
    for (let i = 0; i < count; i++) {
      const y = count === 1 ? 0.5 : (i + 1) / (count + 1);
      const idx = i + 1;
      const id = ptype === 'power-in' ? `power_in${idx}` : `power_out${idx}`;
      result.push({ id, type: ptype, x, y });
    }
  });
  // Append any fixed connectors from def that are not variable types
  def.connectors.forEach(c => {
    if (!portTypes.includes(c.type)) result.push(c);
  });
  return result;
}

// Returns the effective connector list for a node instance
function getNodeConnectors(nodeData) {
  const def = getItemDef(nodeData.type);
  if (!def) return [];
  if (nodeData.varPorts) return buildVarConnectors(def, nodeData.varPorts);
  return def.connectors;
}

function genId() { return 'n' + (state.nextId++); }

function addNode(type, x, y, overrides = {}) {
  const def = getItemDef(type);
  if (!def) return null;
  const id = overrides.id || genId();
  if (overrides.id) {
    const num = parseInt(id.replace('n',''));
    if (!isNaN(num) && num >= state.nextId) state.nextId = num + 1;
  }

  const nodeData = {
    id,
    type,
    x: overrides.x !== undefined ? overrides.x : x,
    y: overrides.y !== undefined ? overrides.y : y,
    label: overrides.label !== undefined ? overrides.label : id,
    props: overrides.props || {},
    rotation: overrides.rotation || 0,
    mirror: overrides.mirror || false,
    varPorts: overrides.varPorts || (def.varPorts ? JSON.parse(JSON.stringify(def.varPorts)) : null),
  };
  state.nodes[id] = nodeData;

  const el = document.createElement('div');
  el.className = 'node';
  el.id = 'node-' + id;
  el.style.left = nodeData.x + 'px';
  el.style.top  = nodeData.y + 'px';

  const body = document.createElement('div');
  body.className = 'node-body';
  body.style.width  = def.w + 'px';
  body.style.height = def.h + 'px';

  const svgWrap = document.createElement('div');
  svgWrap.className = 'node-svg';
  svgWrap.style.width  = def.w + 'px';
  svgWrap.style.height = def.h + 'px';
  svgWrap.innerHTML = def.draw({ w: def.w, h: def.h });
  body.appendChild(svgWrap);

  const lbl = document.createElement('div');
  lbl.className = 'node-label';
  lbl.textContent = nodeData.label;

  el.appendChild(body);
  el.appendChild(lbl);

  // Connectors
  getNodeConnectors(nodeData).forEach(conn => {
    const dot = document.createElement('div');
    dot.className = 'connector ' + conn.type;
    dot.dataset.nodeId = id;
    dot.dataset.connId = conn.id;
    dot.dataset.connType = conn.type;
    dot.style.left = (conn.x * def.w) + 'px';
    dot.style.top  = (conn.y * def.h) + 'px';
    dot.title = `${conn.type}: ${conn.id}`;
    body.appendChild(dot);
  });

  canvas.appendChild(el);
  makeDraggable(el, nodeData);
  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('connector')) return;
    selectNode(id, e.shiftKey);
  });

  updateStatus();
  applyRotation(id);
  return id;
}

function removeNode(id) {
  state.connections = state.connections.filter(c => {
    if (c.from.nodeId === id || c.to.nodeId === id) {
      const g = document.getElementById('conn-g-' + c.id);
      if (g) g.remove();
      return false;
    }
    return true;
  });
  const el = document.getElementById('node-' + id);
  if (el) el.remove();
  delete state.nodes[id];
  state.selected.delete(id);
  updateStatus();
}

function applyRotation(nodeId) {
  const nodeData = state.nodes[nodeId];
  const def = getItemDef(nodeData.type);
  const R = nodeData.rotation || 0;
  const steps = ((R / 90) % 4 + 4) % 4;
  const ew = steps % 2 === 0 ? def.w : def.h;
  const eh = steps % 2 === 0 ? def.h : def.w;

  const el = document.getElementById('node-' + nodeId);
  if (!el) return;
  const body = el.querySelector('.node-body');
  const svgWrap = el.querySelector('.node-svg');

  body.style.width  = ew + 'px';
  body.style.height = eh + 'px';

  svgWrap.style.left = ((ew - def.w) / 2) + 'px';
  svgWrap.style.top  = ((eh - def.h) / 2) + 'px';
  const mirrorScale = nodeData.mirror ? ' scaleX(-1)' : '';
  svgWrap.style.transform = 'rotate(' + R + 'deg)' + mirrorScale;

  getNodeConnectors(nodeData).forEach(conn => {
    const dot = body.querySelector(`.connector[data-conn-id="${conn.id}"]`);
    if (!dot) return;
    let rx = conn.x * def.w - def.w / 2;
    let ry = conn.y * def.h - def.h / 2;
    if (nodeData.mirror) rx = -rx;
    for (let i = 0; i < steps; i++) { [rx, ry] = [-ry, rx]; }
    dot.style.left = (rx + ew / 2) + 'px';
    dot.style.top  = (ry + eh / 2) + 'px';
  });
}

function rebuildNodePorts(nodeId) {
  const nodeData = state.nodes[nodeId];
  if (!nodeData.varPorts) return;
  // Remove connections on ports that no longer exist
  const validIds = new Set(getNodeConnectors(nodeData).map(c => c.id));
  state.connections = state.connections.filter(c => {
    const stale = (c.from.nodeId === nodeId && !validIds.has(c.from.connId)) ||
                  (c.to.nodeId   === nodeId && !validIds.has(c.to.connId));
    if (stale) { delete state.connPts[c.id]; document.getElementById('conn-g-' + c.id)?.remove(); }
    return !stale;
  });
  // Remove all existing connector dots from the body
  const body = document.querySelector(`#node-${nodeId} .node-body`);
  body.querySelectorAll('.connector').forEach(d => d.remove());
  // Re-add dots
  getNodeConnectors(nodeData).forEach(conn => {
    const dot = document.createElement('div');
    dot.className = 'connector ' + conn.type;
    dot.dataset.nodeId = nodeId;
    dot.dataset.connId = conn.id;
    dot.dataset.connType = conn.type;
    dot.title = `${conn.type}: ${conn.id}`;
    body.appendChild(dot);
  });
  applyRotation(nodeId);
  redrawConnections();
  updateStatus();
}

function rotateNode(id) {
  const nodeData = state.nodes[id];
  const def = getItemDef(nodeData.type);
  const R = nodeData.rotation || 0;
  const steps = ((R / 90) % 4 + 4) % 4;
  const ew_old = steps % 2 === 0 ? def.w : def.h;
  const eh_old = steps % 2 === 0 ? def.h : def.w;
  nodeData.rotation = (R + 90) % 360;
  const steps_new = (nodeData.rotation / 90) % 4;
  const ew_new = steps_new % 2 === 0 ? def.w : def.h;
  const eh_new = steps_new % 2 === 0 ? def.h : def.w;
  // Keep visual center fixed
  nodeData.x += (ew_old - ew_new) / 2;
  nodeData.y += (eh_old - eh_new) / 2;
  const el = document.getElementById('node-' + id);
  el.style.left = nodeData.x + 'px';
  el.style.top  = nodeData.y + 'px';
  applyRotation(id);
  state.connections.forEach(c => {
    if (c.from.nodeId === id || c.to.nodeId === id) delete state.connPts[c.id];
  });
  redrawConnections();
}

function mirrorNode(id) {
  const nodeData = state.nodes[id];
  nodeData.mirror = !nodeData.mirror;
  applyRotation(id);
  state.connections.forEach(c => {
    if (c.from.nodeId === id || c.to.nodeId === id) delete state.connPts[c.id];
  });
  redrawConnections();
}

// ─── DRAG NODES ───
function makeDraggable(el, nodeData) {
  let dragging = false, hasDragged = false, startMouse = {}, startPositions = {};

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('connector')) return;
    if (e.button !== 0) return;
    dragging = true;
    hasDragged = false;
    startMouse = { x: e.clientX, y: e.clientY };
    // If this node is part of the selection, drag all selected nodes together
    const ids = state.selected.has(nodeData.id)
      ? [...state.selected].filter(id => state.nodes[id])
      : [nodeData.id];
    startPositions = {};
    ids.forEach(id => { startPositions[id] = { x: state.nodes[id].x, y: state.nodes[id].y }; });
    // Clear user-routed waypoints for connections attached to any dragged node
    state.connections.forEach(c => {
      if (ids.includes(c.from.nodeId) || ids.includes(c.to.nodeId)) delete state.connPts[c.id];
    });
    e.stopPropagation();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    hasDragged = true;
    const dx = (e.clientX - startMouse.x) / state.zoom;
    const dy = (e.clientY - startMouse.y) / state.zoom;
    Object.entries(startPositions).forEach(([id, start]) => {
      const nd = state.nodes[id];
      if (!nd) return;
      nd.x = start.x + dx;
      nd.y = start.y + dy;
      const ndEl = document.getElementById('node-' + id);
      if (ndEl) { ndEl.style.left = nd.x + 'px'; ndEl.style.top = nd.y + 'px'; }
    });
    redrawConnections();
  });

  document.addEventListener('mouseup', () => {
    if (dragging && hasDragged) {
      if (snapEnabled) {
        Object.keys(startPositions).forEach(id => {
          const nd = state.nodes[id];
          if (!nd) return;
          const snapped = snapXY(nd.x, nd.y);
          nd.x = snapped.x; nd.y = snapped.y;
          const ndEl = document.getElementById('node-' + id);
          if (ndEl) { ndEl.style.left = nd.x + 'px'; ndEl.style.top = nd.y + 'px'; }
        });
        redrawConnections();
      }
      pushHistory();
    }
    dragging = false;
  });
}

// ─── SELECTION ───
function selectNode(id, additive = false) {
  if (!additive) selectNone();
  if (additive && state.selected.has(id)) {
    // toggle off
    state.selected.delete(id);
    const el = document.getElementById('node-' + id);
    if (el) el.classList.remove('selected');
    updatePropsForSelection();
    return;
  }
  state.selected.add(id);
  const el = document.getElementById('node-' + id);
  if (el) el.classList.add('selected');
  updatePropsForSelection();
}

function selectNone() {
  state.selected.forEach(id => {
    const el = document.getElementById('node-' + id);
    if (el) el.classList.remove('selected');
  });
  document.querySelectorAll('.conn-path.selected').forEach(p => p.classList.remove('selected'));
  state.selected.clear();
  showEmptyProps();
}

function selectAll() {
  selectNone();
  Object.keys(state.nodes).forEach(id => {
    state.selected.add(id);
    document.getElementById('node-' + id)?.classList.add('selected');
  });
  state.connections.forEach(c => {
    state.selected.add(c.id);
    document.getElementById('conn-g-' + c.id)?.querySelector('.conn-path')?.classList.add('selected');
  });
  updatePropsForSelection();
}

function updatePropsForSelection() {
  if (state.selected.size === 0) { showEmptyProps(); return; }
  if (state.selected.size === 1) {
    const id = [...state.selected][0];
    if (state.nodes[id]) showNodeProps(id);
    else { const c = state.connections.find(c => c.id === id); if (c) showConnProps(c); }
    return;
  }
  document.getElementById('props-content').innerHTML =
    `<div class="props-empty">${state.selected.size} items selected</div>`;
}

// ═══════════════════════════════════════════════════════
// CONNECTIONS
// ═══════════════════════════════════════════════════════
function getConnectorPos(nodeId, connId) {
  const nodeData = state.nodes[nodeId];
  const def = getItemDef(nodeData.type);
  const conn = getNodeConnectors(nodeData).find(c => c.id === connId);
  if (!conn) return null;
  const steps = (((nodeData.rotation || 0) / 90) % 4 + 4) % 4;
  const ew = steps % 2 === 0 ? def.w : def.h;
  const eh = steps % 2 === 0 ? def.h : def.w;
  let rx = conn.x * def.w - def.w / 2;
  let ry = conn.y * def.h - def.h / 2;
  if (nodeData.mirror) rx = -rx;
  for (let i = 0; i < steps; i++) { [rx, ry] = [-ry, rx]; }
  return {
    x: nodeData.x + rx + ew / 2,
    y: nodeData.y + ry + eh / 2,
  };
}

function getConnectorType(nodeId, connId) {
  return getNodeConnectors(state.nodes[nodeId]).find(c => c.id === connId)?.type;
}

function addConnection(fromNodeId, fromConnId, toNodeId, toConnId, overrideId, overrideLabel) {
  // Normalise direction: outlet→inlet or power-out→power-in
  const fromType = getConnectorType(fromNodeId, fromConnId);
  if (fromType === 'inlet' || fromType === 'power-in') {
    [fromNodeId, toNodeId] = [toNodeId, fromNodeId];
    [fromConnId, toConnId] = [toConnId, fromConnId];
  }
  const connClass = (getConnectorType(fromNodeId, fromConnId) === 'power-out') ? 'power' : 'fluid';

  // Prevent reuse of any port (each connector accepts exactly one connection)
  const portUsed = state.connections.find(c =>
    (c.from.nodeId === fromNodeId && c.from.connId === fromConnId) ||
    (c.to.nodeId   === toNodeId   && c.to.connId   === toConnId)
  );
  if (portUsed) return;

  const id = overrideId || ('c' + (state.nextId++));
  const connData = { id, label: overrideLabel || id, connClass, from: { nodeId: fromNodeId, connId: fromConnId }, to: { nodeId: toNodeId, connId: toConnId } };
  state.connections.push(connData);
  drawConnection(connData);
  updateStatus();
}

function screenToCanvas(clientX, clientY) {
  const rect = canvasWrap.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.pan.x) / state.zoom,
    y: (clientY - rect.top  - state.pan.y) / state.zoom,
  };
}

function drawConnection(connData) {
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.id = 'conn-g-' + connData.id;

  const hitPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  hitPath.setAttribute('class','conn-path-hit');

  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('class', connData.connClass === 'power' ? 'conn-path power' : 'conn-path');
  path.setAttribute('marker-end', connData.connClass === 'power' ? 'url(#arrow-power)' : 'url(#arrow)');

  g.appendChild(hitPath);
  g.appendChild(path);
  document.getElementById('connections-g').appendChild(g);

  let segDragging = false, dragMoved = false;
  let dragSegIdx = -1, dragAxis = '', dragStart = {}, dragSnapshot = null;
  let dragD0 = null, dragD1 = null, dragB0 = null, dragB1 = null;

  hitPath.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const cp = screenToCanvas(e.clientX, e.clientY);
    // Get current pts for this connection
    const c = connData;
    const from = getConnectorPos(c.from.nodeId, c.from.connId);
    const to   = getConnectorPos(c.to.nodeId,   c.to.connId);
    if (!from || !to) return;
    let pts = state.connPts[c.id];
    if (!pts) {
      const d0 = getConnectorTangent(c.from.nodeId, c.from.connId);
      const d1 = getConnectorTangent(c.to.nodeId,   c.to.connId);
      pts = routeOrthogonal(from, d0, to, d1, getNodeBounds(c.from.nodeId), getNodeBounds(c.to.nodeId));
    }

    // Find the closest draggable segment (skip first and last — the stubs)
    const threshold = 8 / state.zoom;
    let bestDist = threshold, bestIdx = -1, bestAxis = '';
    for (let i = 1; i < pts.length - 2; i++) {
      const a = pts[i], b = pts[i + 1];
      if (Math.abs(a.y - b.y) < 0.5) { // horizontal segment
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
        if (cp.x >= minX && cp.x <= maxX) {
          const d = Math.abs(cp.y - a.y);
          if (d < bestDist) { bestDist = d; bestIdx = i; bestAxis = 'h'; }
        }
      } else if (Math.abs(a.x - b.x) < 0.5) { // vertical segment
        const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
        if (cp.y >= minY && cp.y <= maxY) {
          const d = Math.abs(cp.x - a.x);
          if (d < bestDist) { bestDist = d; bestIdx = i; bestAxis = 'v'; }
        }
      }
    }

    segDragging = true;
    dragMoved = false;
    dragSegIdx = bestIdx;
    dragAxis = bestAxis;
    dragStart = cp;
    dragD0 = getConnectorTangent(c.from.nodeId, c.from.connId);
    dragD1 = getConnectorTangent(c.to.nodeId,   c.to.connId);
    dragB0 = getNodeBounds(c.from.nodeId);
    dragB1 = getNodeBounds(c.to.nodeId);
    // Deep-copy pts as the baseline for this drag
    dragSnapshot = pts.map(p => ({ x: p.x, y: p.y }));
    // Store into connPts so redraw uses them
    state.connPts[c.id] = dragSnapshot.map(p => ({ x: p.x, y: p.y }));
  });

  document.addEventListener('mousemove', e => {
    if (!segDragging || dragSegIdx === -1) return;
    dragMoved = true;
    const cp = screenToCanvas(e.clientX, e.clientY);
    const snap = dragSnapshot;
    const n = snap.length;
    // dragSegIdx===1 means the segment starts at the source stub end;
    // dragSegIdx===n-3 means it ends at the target stub end.
    // Both cases require inserting an extra corner to keep the stub orthogonal.
    const isFirst = dragSegIdx === 1;
    const isLast  = dragSegIdx === n - 3;

    let newPts;

    if (dragAxis === 'h') {
      const newY = snap[dragSegIdx].y + (cp.y - dragStart.y);
      if (isFirst) {
        // stub is vertical (d0.dy != 0); dragging the first horizontal seg up/down
        const behind = dragD0 && dragD0.dy * (newY - snap[1].y) < 0;
        if (behind && dragB0) {
          // Loop left or right of the source component
          const lx = dragB0.x - CONN_STUB;
          const rx = dragB0.x + dragB0.w + CONN_STUB;
          const routeX = Math.abs(snap[1].x - lx) <= Math.abs(snap[1].x - rx) ? lx : rx;
          newPts = [snap[0], snap[1],
            { x: routeX, y: snap[1].y }, { x: routeX, y: newY }, { x: snap[2].x, y: newY },
            ...snap.slice(3)];
        } else {
          newPts = [snap[0], snap[1],
            { x: snap[1].x, y: newY }, { x: snap[2].x, y: newY },
            ...snap.slice(3)];
        }
      } else if (isLast) {
        // stub is vertical (d1.dy != 0); dragging the last horizontal seg up/down
        const behind = dragD1 && dragD1.dy * (newY - snap[n - 2].y) < 0;
        if (behind && dragB1) {
          const lx = dragB1.x - CONN_STUB;
          const rx = dragB1.x + dragB1.w + CONN_STUB;
          const routeX = Math.abs(snap[n - 2].x - lx) <= Math.abs(snap[n - 2].x - rx) ? lx : rx;
          newPts = [...snap.slice(0, n - 3),
            { x: snap[n - 3].x, y: newY }, { x: routeX, y: newY }, { x: routeX, y: snap[n - 2].y },
            snap[n - 2], snap[n - 1]];
        } else {
          newPts = [...snap.slice(0, n - 3),
            { x: snap[n - 3].x, y: newY }, { x: snap[n - 2].x, y: newY },
            snap[n - 2], snap[n - 1]];
        }
      } else {
        newPts = snap.map(p => ({ x: p.x, y: p.y }));
        newPts[dragSegIdx].y     = newY;
        newPts[dragSegIdx + 1].y = newY;
      }
    } else { // axis === 'v'
      const newX = snap[dragSegIdx].x + (cp.x - dragStart.x);
      if (isFirst) {
        // stub is horizontal (d0.dx != 0); dragging the first vertical seg left/right
        const behind = dragD0 && dragD0.dx * (newX - snap[1].x) < 0;
        if (behind && dragB0) {
          // Loop above or below the source component
          const ty = dragB0.y - CONN_STUB;
          const by = dragB0.y + dragB0.h + CONN_STUB;
          const routeY = Math.abs(snap[1].y - ty) <= Math.abs(snap[1].y - by) ? ty : by;
          newPts = [snap[0], snap[1],
            { x: snap[1].x, y: routeY }, { x: newX, y: routeY }, { x: newX, y: snap[2].y },
            ...snap.slice(3)];
        } else {
          newPts = [snap[0], snap[1],
            { x: newX, y: snap[1].y }, { x: newX, y: snap[2].y },
            ...snap.slice(3)];
        }
      } else if (isLast) {
        // stub is horizontal (d1.dx != 0); dragging the last vertical seg left/right
        const behind = dragD1 && dragD1.dx * (newX - snap[n - 2].x) < 0;
        if (behind && dragB1) {
          const ty = dragB1.y - CONN_STUB;
          const by = dragB1.y + dragB1.h + CONN_STUB;
          const routeY = Math.abs(snap[n - 2].y - ty) <= Math.abs(snap[n - 2].y - by) ? ty : by;
          newPts = [...snap.slice(0, n - 3),
            { x: newX, y: snap[n - 3].y }, { x: newX, y: routeY }, { x: snap[n - 2].x, y: routeY },
            snap[n - 2], snap[n - 1]];
        } else {
          newPts = [...snap.slice(0, n - 3),
            { x: newX, y: snap[n - 3].y }, { x: newX, y: snap[n - 2].y },
            snap[n - 2], snap[n - 1]];
        }
      } else {
        newPts = snap.map(p => ({ x: p.x, y: p.y }));
        newPts[dragSegIdx].x     = newX;
        newPts[dragSegIdx + 1].x = newX;
      }
    }

    state.connPts[connData.id] = newPts;
    redrawConnections();
  });

  document.addEventListener('mouseup', e => {
    if (!segDragging) return;
    const wasDragging = segDragging;
    segDragging = false;
    if (!dragMoved) {
      // Treat as a click: select the connection
      if (!e.shiftKey) selectNone();
      state.selected.add(connData.id);
      path.classList.add('selected');
      updatePropsForSelection();
    } else if (wasDragging) {
      pushHistory();
    }
  });

  redrawConnections();
}

// Returns the unit outward tangent vector for a connector based on
// which edge of the component bounding box it sits on.
function getConnectorTangent(nodeId, connId) {
  const nodeData = state.nodes[nodeId];
  const def = getItemDef(nodeData.type);
  const conn = getNodeConnectors(nodeData).find(c => c.id === connId);
  if (!conn) return { dx: 1, dy: 0 };
  const dLeft   = conn.x;
  const dRight  = 1 - conn.x;
  const dTop    = conn.y;
  const dBottom = 1 - conn.y;
  const min = Math.min(dLeft, dRight, dTop, dBottom);
  let dx, dy;
  if (min === dLeft)       { dx = -1; dy =  0; }
  else if (min === dRight) { dx =  1; dy =  0; }
  else if (min === dTop)   { dx =  0; dy = -1; }
  else                     { dx =  0; dy =  1; }
  if (nodeData.mirror) dx = -dx;
  const rotation = nodeData.rotation || 0;
  const steps = ((rotation / 90) % 4 + 4) % 4;
  for (let i = 0; i < steps; i++) { [dx, dy] = [-dy, dx]; }
  return { dx, dy };
}

// ─── ORTHOGONAL ROUTING ───
const CONN_STUB     = 20;  // stub length from connector port
const CONN_CORNER_R = 8;   // rounded corner radius
const CONN_HOP_R    = 5;   // hop arc radius (bridge over crossing)

function routeOrthogonal(p0, d0, p1, d1, b0, b1) {
  const sx = p0.x + d0.dx * CONN_STUB, sy = p0.y + d0.dy * CONN_STUB;
  const ex = p1.x + d1.dx * CONN_STUB, ey = p1.y + d1.dy * CONN_STUB;
  const horiz0 = d0.dy === 0, horiz1 = d1.dy === 0;
  let mids = [];

  if (horiz0 && horiz1) {
    if (d0.dx !== d1.dx) {
      // Opposing directions: Z-route if stubs face each other, else loop around
      if ((d0.dx > 0 && ex >= sx) || (d0.dx < 0 && ex <= sx)) {
        const mx = (sx + ex) / 2;
        mids = [{ x: mx, y: sy }, { x: mx, y: ey }];
      } else {
        // Backwards: stubs point away from each other — loop above or below both boxes
        const above_y = (b0 && b1 ? Math.min(b0.y, b1.y) : Math.min(p0.y, p1.y)) - CONN_STUB;
        const below_y = (b0 && b1 ? Math.max(b0.y + b0.h, b1.y + b1.h) : Math.max(p0.y, p1.y)) + CONN_STUB;
        const route_y = Math.abs(sy - above_y) < Math.abs(sy - below_y) ? above_y : below_y;
        mids = [{ x: sx, y: route_y }, { x: ex, y: route_y }];
      }
    } else {
      // Same direction: route around via extreme x
      const xe = d0.dx > 0 ? Math.max(sx, ex) + CONN_STUB : Math.min(sx, ex) - CONN_STUB;
      mids = [{ x: xe, y: sy }, { x: xe, y: ey }];
    }
  } else if (!horiz0 && !horiz1) {
    if (d0.dy !== d1.dy) {
      // Opposing vertical: Z-route if stubs face each other, else loop around
      if ((d0.dy > 0 && ey >= sy) || (d0.dy < 0 && ey <= sy)) {
        const my = (sy + ey) / 2;
        mids = [{ x: sx, y: my }, { x: ex, y: my }];
      } else {
        // Backwards: loop left or right of both boxes
        const left_x  = (b0 && b1 ? Math.min(b0.x, b1.x) : Math.min(p0.x, p1.x)) - CONN_STUB;
        const right_x = (b0 && b1 ? Math.max(b0.x + b0.w, b1.x + b1.w) : Math.max(p0.x, p1.x)) + CONN_STUB;
        const route_x = Math.abs(sx - left_x) < Math.abs(sx - right_x) ? left_x : right_x;
        mids = [{ x: route_x, y: sy }, { x: route_x, y: ey }];
      }
    } else {
      // Same vertical direction: route around via extreme y
      const ye = d0.dy > 0 ? Math.max(sy, ey) + CONN_STUB : Math.min(sy, ey) - CONN_STUB;
      mids = [{ x: sx, y: ye }, { x: ex, y: ye }];
    }
  } else if (horiz0) {
    // d0 horizontal, d1 vertical.
    // Normal L: corner at (ex, sy). Reversed-L: corner at (sx, ey).
    // Use reversed-L if:
    //   (a) sy is on the wrong side of the target inlet (normal corner would cut through target), OR
    //   (b) ex is behind the source stub (normal horizontal segment would cut back through source).
    const wrongSide    = d1.dy * (sy - p1.y) < 0;
    const behindSource = d0.dx * (ex - sx)   < 0;
    mids = (wrongSide || behindSource) ? [{ x: sx, y: ey }] : [{ x: ex, y: sy }];
  } else {
    // d0 vertical, d1 horizontal.
    // Normal L: corner at (sx, ey). Reversed-L: corner at (ex, sy).
    // Use reversed-L if:
    //   (a) sx is on the wrong side of the target inlet (normal corner would cut through target), OR
    //   (b) ey is behind the source stub (normal vertical segment would cut back through source).
    const wrongSide    = d1.dx * (sx - p1.x) < 0;
    const behindSource = d0.dy * (ey - sy)   < 0;
    mids = (wrongSide || behindSource) ? [{ x: ex, y: sy }] : [{ x: sx, y: ey }];
  }

  return [p0, { x: sx, y: sy }, ...mids, { x: ex, y: ey }, p1];
}

function getSegments(pts) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (Math.abs(a.y - b.y) < 0.5) segs.push({ type: 'h', y: a.y, x1: a.x, x2: b.x });
    else if (Math.abs(a.x - b.x) < 0.5) segs.push({ type: 'v', x: a.x, y1: a.y, y2: b.y });
  }
  return segs;
}

function getHopPositions(segsA, segsB) {
  // Hops go on A's horizontal segments where B's vertical segments cross
  const TOL = CONN_CORNER_R + CONN_HOP_R + 2;
  const hops = [];
  for (const h of segsA.filter(s => s.type === 'h')) {
    for (const v of segsB.filter(s => s.type === 'v')) {
      const minX = Math.min(h.x1, h.x2), maxX = Math.max(h.x1, h.x2);
      const minY = Math.min(v.y1, v.y2), maxY = Math.max(v.y1, v.y2);
      if (v.x > minX + TOL && v.x < maxX - TOL &&
          h.y > minY + TOL && h.y < maxY - TOL) {
        hops.push({ x: v.x, y: h.y });
      }
    }
  }
  return hops;
}

function buildPathD(pts, hops) {
  const R = CONN_CORNER_R, HR = CONN_HOP_R;
  if (pts.length < 2) return 'M0,0';

  // Assign hop x-positions to each horizontal segment
  const segHops = pts.slice(0, -1).map((a, i) => {
    const b = pts[i + 1];
    if (Math.abs(a.y - b.y) > 0.5) return [];
    const mn = Math.min(a.x, b.x), mx = Math.max(a.x, b.x);
    return hops.filter(h => Math.abs(h.y - a.y) < 1 && h.x > mn + 1 && h.x < mx - 1).map(h => h.x);
  });

  const cmds = [`M${pts[0].x},${pts[0].y}`];

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], next = pts[i + 2] || null;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) continue;
    const nx = dx / len, ny = dy / len;

    // Determine if the next segment is a real direction change
    let r_end = 0, nx2 = 0, ny2 = 0, hasTurn = false;
    if (next) {
      const dx2 = next.x - b.x, dy2 = next.y - b.y;
      const len2 = Math.hypot(dx2, dy2);
      if (len2 > 0.01) {
        nx2 = dx2 / len2; ny2 = dy2 / len2;
        const cross = nx * ny2 - ny * nx2;
        hasTurn = Math.abs(cross) > 0.01;
        if (hasTurn) r_end = Math.min(R, len / 2, len2 / 2);
      }
    }

    // Insert bridge hops on horizontal segments
    let hopsHere = segHops[i];
    if (hopsHere.length > 0) {
      const sign = dx > 0 ? 1 : -1;
      const sweep = dx > 0 ? 0 : 1; // sweep=0 → counterclockwise → bump upward on screen
      hopsHere.slice().sort((p, q) => sign * (p - q)).forEach(hx => {
        cmds.push(`L${hx - HR * sign},${a.y}`);
        cmds.push(`A${HR},${HR} 0 0 ${sweep} ${hx + HR * sign},${a.y}`);
      });
    }

    // Line to end of segment (shortened only when a corner arc follows)
    cmds.push(`L${b.x - nx * r_end},${b.y - ny * r_end}`);

    // Rounded corner arc (only on real turns)
    if (hasTurn) {
      const sweep = (nx * ny2 - ny * nx2) > 0 ? 1 : 0;
      cmds.push(`A${r_end},${r_end} 0 0 ${sweep} ${b.x + nx2 * r_end},${b.y + ny2 * r_end}`);
    }
  }

  return cmds.join(' ');
}

function getNodeBounds(nodeId) {
  const nd = state.nodes[nodeId];
  if (!nd) return null;
  const def = getItemDef(nd.type);
  const steps = ((nd.rotation || 0) / 90 + 4) % 4;
  const ew = steps % 2 === 0 ? def.w : def.h;
  const eh = steps % 2 === 0 ? def.h : def.w;
  return { x: nd.x, y: nd.y, w: ew, h: eh };
}

function redrawConnections() {
  // 1. Route all connections
  const routes = {};
  state.connections.forEach(c => {
    const from = getConnectorPos(c.from.nodeId, c.from.connId);
    const to   = getConnectorPos(c.to.nodeId,   c.to.connId);
    if (!from || !to) return;
    if (state.connPts[c.id]) {
      // User-dragged route: update only the connector endpoints (stubs stay as stored)
      const pts = state.connPts[c.id];
      pts[0] = from;
      pts[pts.length - 1] = to;
      routes[c.id] = pts;
    } else {
      const d0 = getConnectorTangent(c.from.nodeId, c.from.connId);
      const d1 = getConnectorTangent(c.to.nodeId,   c.to.connId);
      const b0 = getNodeBounds(c.from.nodeId);
      const b1 = getNodeBounds(c.to.nodeId);
      routes[c.id] = routeOrthogonal(from, d0, to, d1, b0, b1);
    }
  });

  // 2. Extract axis-aligned segments per connection
  const segMap = {};
  for (const [id, pts] of Object.entries(routes)) segMap[id] = getSegments(pts);

  // 3. Collect hop positions: A's horizontal segs hop over B's vertical segs
  const hopMap = {};
  state.connections.forEach(c => { hopMap[c.id] = []; });
  for (const cA of state.connections) {
    for (const cB of state.connections) {
      if (cA.id === cB.id) continue;
      hopMap[cA.id].push(...getHopPositions(segMap[cA.id], segMap[cB.id]));
    }
  }

  // 4. Build SVG path for each connection
  state.connections.forEach(c => {
    const pts = routes[c.id];
    if (!pts) return;
    const g = document.getElementById('conn-g-' + c.id);
    if (!g) return;
    const d = buildPathD(pts, hopMap[c.id]);
    g.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
  });
}

function removeConnection(id) {
  state.connections = state.connections.filter(c => c.id !== id);
  delete state.connPts[id];
  const g = document.getElementById('conn-g-' + id);
  if (g) g.remove();
  state.selected.delete(id);
  updateStatus();
}

// ─── CONNECT MODE ───
const tempConn = document.getElementById('temp-conn');

canvas.addEventListener('mousedown', e => {
  if (!e.target.classList.contains('connector')) return;
  e.stopPropagation();
  e.preventDefault();

  const nodeId = e.target.dataset.nodeId;
  const connId = e.target.dataset.connId;
  const connType = e.target.dataset.connType;
  state.connectStart = { nodeId, connId, connType };

  const pos = getConnectorPos(nodeId, connId);
  tempConn.setAttribute('x1', pos.x);
  tempConn.setAttribute('y1', pos.y);
  tempConn.setAttribute('x2', pos.x);
  tempConn.setAttribute('y2', pos.y);
  tempConn.style.display = 'block';
});

document.addEventListener('mousemove', e => {
  if (!state.connectStart) return;
  const rect = canvasWrap.getBoundingClientRect();
  const x = (e.clientX - rect.left - state.pan.x) / state.zoom;
  const y = (e.clientY - rect.top  - state.pan.y) / state.zoom;
  tempConn.setAttribute('x2', x);
  tempConn.setAttribute('y2', y);
  // highlight nearby connectors
  const oppositeTypes = { outlet: 'inlet', inlet: 'outlet', 'power-out': 'power-in', 'power-in': 'power-out' };
  const oppositeType = oppositeTypes[state.connectStart.connType];
  const usedPorts = new Set(state.connections.flatMap(c => [
    c.from.nodeId + '/' + c.from.connId, c.to.nodeId + '/' + c.to.connId
  ]));
  document.querySelectorAll('.connector').forEach(el => {
    const nid = el.dataset.nodeId;
    const cid = el.dataset.connId;
    if (nid === state.connectStart.nodeId) return;
    if (el.dataset.connType !== oppositeType) return;
    const occupied = usedPorts.has(nid + '/' + cid);
    el.classList.toggle('occupied', occupied);
    if (occupied) { el.classList.remove('hovered'); return; }
    const pos = getConnectorPos(nid, cid);
    const dist = Math.hypot(pos.x - x, pos.y - y);
    el.classList.toggle('hovered', dist < 16);
  });
});

document.addEventListener('mouseup', e => {
  if (!state.connectStart) return;
  if (e.target.classList.contains('connector')) {
    const toNodeId = e.target.dataset.nodeId;
    const toConnId = e.target.dataset.connId;
    const toConnType = e.target.dataset.connType;
    const compatMap = { outlet: 'inlet', inlet: 'outlet', 'power-out': 'power-in', 'power-in': 'power-out' };
    const isCompatible = compatMap[state.connectStart.connType] === toConnType;
    if (toNodeId !== state.connectStart.nodeId && isCompatible) {
      addConnection(state.connectStart.nodeId, state.connectStart.connId, toNodeId, toConnId);
      pushHistory();
    }
  }
  state.connectStart = null;
  tempConn.style.display = 'none';
  document.querySelectorAll('.connector.hovered, .connector.occupied').forEach(el => {
    el.classList.remove('hovered'); el.classList.remove('occupied');
  });
});


// ═══════════════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════════════
function showEmptyProps() {
  document.getElementById('props-content').innerHTML =
    '<div class="props-empty">Select an element<br>to edit its properties</div>';
}

function showNodeProps(id) {
  const node = state.nodes[id];
  const def = getItemDef(node.type);
  const pc = document.getElementById('props-content');

  pc.innerHTML = `
    <div class="prop-row">
      <div class="prop-label">ID</div>
      <input class="prop-input" value="${node.id}" readonly style="opacity:0.5;cursor:default">
    </div>
    <div class="prop-row">
      <div class="prop-label">Type</div>
      <input class="prop-input" value="${node.type}" readonly style="opacity:0.5;cursor:default">
    </div>
    <div class="prop-row">
      <div class="prop-label">Label</div>
      <input class="prop-input" id="prop-label" value="${node.label}">
    </div>
    <div class="prop-row">
      <div class="prop-label">X</div>
      <input class="prop-input" id="prop-x" type="number" value="${Math.round(node.x)}">
    </div>
    <div class="prop-row">
      <div class="prop-label">Y</div>
      <input class="prop-input" id="prop-y" type="number" value="${Math.round(node.y)}">
    </div>
    <div class="prop-row">
      <div class="prop-label">Rotation</div>
      <input class="prop-input" id="prop-rotation" value="${node.rotation || 0}°" readonly style="opacity:0.5;cursor:default">
    </div>
    <div style="padding:4px 12px 8px">
      <button class="btn-secondary" id="rotate-node-btn" style="width:48%;font-size:10px">↻ Rotate 90°</button>
      <button class="btn-secondary" id="mirror-node-btn" style="width:48%;font-size:10px;margin-left:4%">↔ Mirror</button>
    </div>
    <div style="padding:8px 12px 4px;font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--border);margin-top:8px">Connectors</div>
    ${node.varPorts ? Object.entries(node.varPorts).map(([ptype, count]) => `
      <div class="prop-row">
        <div class="prop-label" style="color:${ptype==='power-in'?'var(--power-in)':'var(--power-out)'}">${ptype}</div>
        <input class="prop-input" type="number" min="1" max="16" value="${count}" id="varport-${ptype.replace('-','_')}" style="width:56px">
      </div>`).join('') : ''}
    ${getNodeConnectors(state.nodes[id]).map(c => `
      <div class="prop-row">
        <div class="prop-label" style="color:${
          c.type==='inlet'?'var(--accent2)':c.type==='outlet'?'var(--accent3)':c.type==='power-in'?'var(--power-in)':'var(--power-out)'
        }">${c.id} (${c.type})</div>
      </div>`).join('')}
  `;

  document.getElementById('prop-label').addEventListener('input', e => {
    const val = e.target.value.trim();
    const duplicate = val !== '' && Object.values(state.nodes).some(n => n.id !== id && n.label === val);
    e.target.style.borderColor = duplicate ? '#ff6b6b' : '';
    if (!duplicate && val !== '') {
      node.label = val;
      const lbl = document.querySelector(`#node-${id} .node-label`);
      if (lbl) lbl.textContent = node.label;
    }
  });
  document.getElementById('prop-label').addEventListener('change', () => { pushHistory(); });
  document.getElementById('prop-x').addEventListener('change', e => {
    node.x = parseFloat(e.target.value);
    document.getElementById('node-'+id).style.left = node.x + 'px';
    redrawConnections();
    pushHistory();
  });
  document.getElementById('prop-y').addEventListener('change', e => {
    node.y = parseFloat(e.target.value);
    document.getElementById('node-'+id).style.top = node.y + 'px';
    redrawConnections();
    pushHistory();
  });
  document.getElementById('rotate-node-btn').addEventListener('click', () => {
    rotateNode(id);
    document.getElementById('prop-rotation').value = (state.nodes[id].rotation || 0) + '°';
    pushHistory();
  });
  document.getElementById('mirror-node-btn').addEventListener('click', () => {
    mirrorNode(id);
    pushHistory();
  });
  if (node.varPorts) {
    Object.keys(node.varPorts).forEach(portType => {
      const inputId = 'varport-' + portType.replace('-', '_');
      document.getElementById(inputId)?.addEventListener('change', e => {
        const count = Math.max(1, Math.min(16, parseInt(e.target.value) || 1));
        e.target.value = count;
        node.varPorts[portType] = count;
        rebuildNodePorts(id);
        showNodeProps(id); // refresh connector list
        pushHistory();
      });
    });
  }
}

function showConnProps(connData) {
  const pc = document.getElementById('props-content');
  pc.innerHTML = `
    <div class="prop-row">
      <div class="prop-label">Label</div>
      <input class="prop-input" id="conn-label-input" value="${connData.label || connData.id}">
    </div>
    <div class="prop-row">
      <div class="prop-label">ID</div>
      <input class="prop-input" value="${connData.id}" readonly style="opacity:0.5;cursor:default">
    </div>
    <div class="prop-row">
      <div class="prop-label">From</div>
      <input class="prop-input" value="${connData.from.nodeId} · ${connData.from.connId}" readonly style="opacity:0.5;cursor:default">
    </div>
    <div class="prop-row">
      <div class="prop-label">To</div>
      <input class="prop-input" value="${connData.to.nodeId} · ${connData.to.connId}" readonly style="opacity:0.5;cursor:default">
    </div>
    <div style="padding:8px 12px">
      <button class="btn-secondary" id="del-conn-btn" style="width:100%;font-size:10px;color:#ff6b6b;border-color:#ff6b6b44">Delete Connection</button>
    </div>
  `;
  const labelInput = document.getElementById('conn-label-input');
  labelInput.addEventListener('input', e => {
    const val = e.target.value.trim();
    const duplicate = val !== '' && state.connections.some(c => c.id !== connData.id && c.label === val);
    e.target.style.borderColor = duplicate ? '#ff6b6b' : '';
    if (!duplicate && val !== '') connData.label = val;
  });
  labelInput.addEventListener('change', () => { pushHistory(); });
  document.getElementById('del-conn-btn').addEventListener('click', () => { removeConnection(connData.id); pushHistory(); });
}


// ═══════════════════════════════════════════════════════
// COPY / PASTE
// ═══════════════════════════════════════════════════════
const clipboard = { nodes: [], connections: [] };
const PASTE_OFFSET = 20;

function copySelected() {
  const nodeIds = new Set([...state.selected].filter(id => state.nodes[id]));
  if (nodeIds.size === 0) return;
  clipboard.nodes = [...nodeIds].map(id => {
    const n = state.nodes[id];
    return { type: n.type, label: n.label, x: n.x, y: n.y, props: JSON.parse(JSON.stringify(n.props)), rotation: n.rotation || 0 };
  });
  // Copy connections where both endpoints are in the selection
  clipboard.connections = state.connections
    .filter(c => nodeIds.has(c.from.nodeId) && nodeIds.has(c.to.nodeId))
    .map(c => ({
      fromIdx: [...nodeIds].indexOf(c.from.nodeId),
      toIdx:   [...nodeIds].indexOf(c.to.nodeId),
      fromConnId: c.from.connId,
      toConnId:   c.to.connId,
    }));
  statusMsg(`Copied ${clipboard.nodes.length} node${clipboard.nodes.length !== 1 ? 's' : ''}`);
}

function pasteClipboard() {
  if (clipboard.nodes.length === 0) return;
  selectNone();
  const newIds = clipboard.nodes.map(n =>
    addNode(n.type, n.x + PASTE_OFFSET, n.y + PASTE_OFFSET, {
      label: n.label, props: JSON.parse(JSON.stringify(n.props)), rotation: n.rotation,
    })
  );
  clipboard.connections.forEach(c => {
    addConnection(newIds[c.fromIdx], c.fromConnId, newIds[c.toIdx], c.toConnId);
  });
  newIds.forEach(id => { state.selected.add(id); document.getElementById('node-' + id)?.classList.add('selected'); });
  updatePropsForSelection();
  pushHistory();
  // Shift clipboard so repeated pastes cascade
  clipboard.nodes.forEach(n => { n.x += PASTE_OFFSET; n.y += PASTE_OFFSET; });
}

// ═══════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    selectAll();
  }
  if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    copySelected();
  }
  if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    pasteClipboard();
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selected.size > 0) {
      const ids = [...state.selected];
      selectNone();
      ids.forEach(id => {
        if (state.nodes[id]) removeNode(id);
        else { const c = state.connections.find(c => c.id === id); if (c) removeConnection(c.id); }
      });
      pushHistory();
    }
  }
  if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey) {
    const nodeIds = [...state.selected].filter(id => state.nodes[id]);
    if (nodeIds.length > 0) {
      nodeIds.forEach(id => rotateNode(id));
      pushHistory();
    }
  }
  if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
    const nodeIds = [...state.selected].filter(id => state.nodes[id]);
    if (nodeIds.length > 0) {
      nodeIds.forEach(id => mirrorNode(id));
      pushHistory();
    }
  }
  if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
    zoomToFit();
  }
  if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
    setSnap(!snapEnabled);
    statusMsg(snapEnabled ? 'Snap on' : 'Snap off');
  }
  if (e.key === 'Escape') { selectNone(); }
});

// ═══════════════════════════════════════════════════════
// TOOLBAR BUTTONS
// ═══════════════════════════════════════════════════════
document.getElementById('btn-snap').addEventListener('click', () => {
  setSnap(!snapEnabled);
  statusMsg(snapEnabled ? 'Snap on' : 'Snap off');
});

document.getElementById('btn-fit').addEventListener('click', () => zoomToFit());

function zoomToFit() {
  const nodes = Object.values(state.nodes);
  if (nodes.length === 0) return;
  const PAD = 60;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(nd => {
    const def = getItemDef(nd.type);
    const steps = ((nd.rotation || 0) / 90 + 4) % 4;
    const ew = steps % 2 === 0 ? def.w : def.h;
    const eh = steps % 2 === 0 ? def.h : def.w;
    minX = Math.min(minX, nd.x);
    minY = Math.min(minY, nd.y);
    maxX = Math.max(maxX, nd.x + ew);
    maxY = Math.max(maxY, nd.y + eh);
  });
  const wrapW = canvasWrap.clientWidth;
  const wrapH = canvasWrap.clientHeight;
  const zoom = Math.min(4, Math.max(0.2,
    Math.min((wrapW - PAD * 2) / (maxX - minX), (wrapH - PAD * 2) / (maxY - minY))
  ));
  state.zoom = zoom;
  state.pan.x = (wrapW - (maxX - minX) * zoom) / 2 - minX * zoom;
  state.pan.y = (wrapH - (maxY - minY) * zoom) / 2 - minY * zoom;
  applyTransform();
}

document.getElementById('btn-delete').addEventListener('click', () => {
  if (state.selected.size > 0) {
    const ids = [...state.selected];
    selectNone();
    ids.forEach(id => {
      if (state.nodes[id]) removeNode(id);
      else { const c = state.connections.find(c => c.id === id); if (c) removeConnection(c.id); }
    });
    pushHistory();
  }
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (!confirm('Clear entire flowsheet?')) return;
  Object.keys(state.nodes).forEach(id => {
    document.getElementById('node-' + id)?.remove();
  });
  state.nodes = {};
  state.connections = [];
  state.connPts = {};
  document.getElementById('connections-g').innerHTML = '';
  selectNone();
  updateStatus();
  pushHistory();
});

// ─── EXPORT ───
document.getElementById('btn-export').addEventListener('click', () => {
  const json = exportTESPy();
  document.getElementById('export-ta').value = JSON.stringify(json, null, 2);
  document.getElementById('modal-export').style.display = 'flex';
});
['close-export','close-export2'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('modal-export').style.display = 'none';
  });
});
document.getElementById('copy-export').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('export-ta').value);
  statusMsg('Copied to clipboard!');
});
document.getElementById('download-export').addEventListener('click', () => {
  const blob = new Blob([document.getElementById('export-ta').value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'flowsheet.json';
  a.click();
});

// ─── IMPORT ───
document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-ta').value = '';
  document.getElementById('modal-import').style.display = 'flex';
});
['close-import','close-import2'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('modal-import').style.display = 'none';
  });
});
document.getElementById('load-file-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    document.getElementById('import-ta').value = evt.target.result;
  };
  reader.readAsText(file);
  e.target.value = '';
});
document.getElementById('apply-import').addEventListener('click', () => {
  try {
    const json = JSON.parse(document.getElementById('import-ta').value);
    importJSON(json);
    pushHistory();
    document.getElementById('modal-import').style.display = 'none';
    statusMsg('Flowsheet imported!');
  } catch(err) {
    alert('Invalid JSON: ' + err.message);
  }
});

// ═══════════════════════════════════════════════════════
// JSON EXPORT / IMPORT
// ═══════════════════════════════════════════════════════
function exportJSON() {
  return {
    version: '1.0',
    nodes: Object.values(state.nodes).map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      x: Math.round(n.x),
      y: Math.round(n.y),
      props: n.props,
      rotation: n.rotation || 0,
      varPorts: n.varPorts || undefined,
    })),
    connections: state.connections.map(c => ({
      id: c.id,
      label: c.label || c.id,
      connClass: c.connClass || 'fluid',
      from: { nodeId: c.from.nodeId, connId: c.from.connId },
      to:   { nodeId: c.to.nodeId,   connId: c.to.connId   },
    })),
  };
}

function exportTESPy() {
  function toPascalCase(type) {
    return type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
  }

  // Build connectorId → indexed TESPy id map for a node (e.g. shell_in → in1, tube_in → in2)
  function connectorIndexMap(nodeData) {
    const conns = getNodeConnectors(nodeData);
    const typePrefix = { 'inlet': 'in', 'outlet': 'out', 'power-in': 'power_in', 'power-out': 'power_out' };
    const counters = {};
    const map = {};
    conns.forEach(c => {
      const prefix = typePrefix[c.type] || c.type;
      counters[prefix] = (counters[prefix] || 0) + 1;
      map[c.id] = prefix + counters[prefix];
    });
    return map;
  }

  // Component section: group by TESPy class name, keyed by node label
  const Component = {};
  Object.values(state.nodes).forEach(n => {
    const typeName = toPascalCase(n.type);
    if (!Component[typeName]) Component[typeName] = {};
    Component[typeName][n.label] = n.props && Object.keys(n.props).length ? { ...n.props } : {};
  });

  // Connection sections
  const FluidConns = {};
  const PowerConns = {};
  state.connections.forEach(c => {
    const fromNode = state.nodes[c.from.nodeId];
    const toNode   = state.nodes[c.to.nodeId];
    if (!fromNode || !toNode) return;
    const fromMap = connectorIndexMap(fromNode);
    const toMap   = connectorIndexMap(toNode);
    const entry = {
      source:    fromNode.label,
      target:    toNode.label,
      source_id: fromMap[c.from.connId] || c.from.connId,
      target_id: toMap[c.to.connId]     || c.to.connId,
    };
    const key = c.label || c.id;
    if (c.connClass === 'power') PowerConns[key] = entry;
    else FluidConns[key] = entry;
  });

  const connSection = Object.keys(PowerConns).length > 0
    ? { Connection: FluidConns, PowerConnection: PowerConns }
    : { Connection: FluidConns };
  return { Component, Connection: connSection };
}

function importJSON(json) {
  // Clear
  Object.keys(state.nodes).forEach(id => document.getElementById('node-' + id)?.remove());
  state.nodes = {};
  state.connections = [];
  state.connPts = {};
  document.getElementById('connections-g').innerHTML = '';
  selectNone();
  state.nextId = 1;

  // Add nodes
  (json.nodes || []).forEach(n => {
    addNode(n.type, n.x, n.y, { id: n.id, label: n.label, props: n.props || {}, rotation: n.rotation || 0, mirror: n.mirror || false, varPorts: n.varPorts || null });
  });

  // Add connections
  (json.connections || []).forEach(c => {
    addConnection(c.from.nodeId, c.from.connId, c.to.nodeId, c.to.connId, c.id, c.label);
  });

  updateStatus();
}

// ═══════════════════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════════════════
function updateStatus() {
  document.getElementById('status-nodes').textContent = `Nodes: ${Object.keys(state.nodes).length}`;
  document.getElementById('status-conns').textContent = `Connections: ${state.connections.length}`;
}

let msgTimer;
function statusMsg(msg) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.textContent = '', 3000);
}

// ─── Close modals on overlay click ───
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
buildSidebar();
applyTransform();
updateStatus();

// Demo: add a small example flowsheet
setTimeout(() => {
  const co2  = addNode('Compressor',     500, 150);
  const hx2  = addNode('HeatExchanger', 300,  50);
  const va2  = addNode('Valve',          100, 150);
  const cc2  = addNode('CycleCloser',   450, 250);
  const so2  = addNode('Source',         100,   0);
  const si2  = addNode('Sink',           500,   0);

  const ihx  = addNode('HeatExchanger', 300, 250);

  const co1  = addNode('Compressor',     500, 350);
  const hx1  = addNode('HeatExchanger', 300, 450);
  const va1  = addNode('Valve',          100, 350);
  const cc1  = addNode('CycleCloser',   450, 450);
  const so1  = addNode('Source',         500, 500);
  const si1  = addNode('Sink',           100, 500);

  // Upper cycle (cycle 2)
  addConnection(so2,  'out',       hx2,  'tube_in');
  addConnection(hx2,  'tube_out',  si2,  'in');

  addConnection(hx1, 'shell_out', cc1, 'in');
  addConnection(cc1, 'out', co1, 'in');
  addConnection(co1, 'out', ihx, 'shell_in');
  addConnection(ihx, 'shell_out', va1, 'in');
  addConnection(va1, 'out', hx1, 'shell_in');

  addConnection(ihx, 'tube_out', cc2, 'in');
  addConnection(cc2, 'out', co2, 'in');
  addConnection(co2, 'out', hx2, 'shell_in');
  addConnection(hx2, 'shell_out', va2, 'in');
  addConnection(va2, 'out', ihx, 'tube_in');

  addConnection(so1,  'out',       hx1,  'tube_in');
  addConnection(hx1,  'tube_out',  si1,  'in');

  pushHistory(); // initial state
}, 100);
