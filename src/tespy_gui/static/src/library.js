// ═══════════════════════════════════════════════════════
// COMPONENT AND CONNECTION DEFINITIONS (loaded from JSON)
// ═══════════════════════════════════════════════════════
let COMPONENT_DEFS = {};
let CONNECTION_DEFS = {};

function deriveCategory(modulePath) {
  const seg = (modulePath || '').split('.')[2] || 'other';
  return seg.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function boxSVG(w, h, typeName) {
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

// ── Port helpers ───────────────────────────────────────

// Build the default portConfig for a new node from portDefs.
// variable  → param: min count
// conditional → param: first 'when' value encountered (deterministic)
function defaultPortConfig(portDefs) {
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
function computeConnectors(portDefs, portConfig) {
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

// Get the pixel dimensions of a node given its live portConfig.
// Width is always 80; height depends on how many fluid rows are active.
function getNodeDims(nodeData) {
  const def = getItemDef(nodeData.type);
  if (!def) return { w: 80, h: 60 };
  const conns = getNodeConnectors(nodeData);
  const fluidRows = Math.max(
    conns.filter(c => c.type === 'inlet').length,
    conns.filter(c => c.type === 'outlet').length,
    1
  );
  return { w: def.w, h: Math.max(fluidRows * 20 + 20, 40) };
}

function buildComponentDef(typeName, compData) {
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

async function loadDefs() {
  const [compJson, connJson] = await Promise.all([
    fetch('/component.json').then(r => r.json()),
    fetch('/connection.json').then(r => r.json()),
  ]);
  CONNECTION_DEFS = connJson;
  Object.entries(compJson).forEach(([typeName, compData]) => {
    COMPONENT_DEFS[typeName] = buildComponentDef(typeName, compData);
  });
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
      portConfig: JSON.parse(JSON.stringify(n.portConfig || {})),
    })),
    connections: state.connections.map(c => ({
      id: c.id,
      label: c.label || c.id,
      connClass: c.connClass || 'fluid',
      props: JSON.parse(JSON.stringify(c.props || {})),
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
    addNode(n.type, n.x, n.y, { id: n.id, label: n.label, props: n.props || {}, rotation: n.rotation || 0, mirror: n.mirror || false, portConfig: n.portConfig || null });
  });
  (snap.connections || []).forEach(c => {
    addConnection(c.from.nodeId, c.from.connId, c.to.nodeId, c.to.connId, c.id, c.label);
    const conn = state.connections.find(x => x.id === c.id);
    if (conn && c.props) conn.props = JSON.parse(JSON.stringify(c.props));
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
  sb.innerHTML = '';

  // Group by category derived from module path
  const categories = {};
  Object.values(COMPONENT_DEFS).forEach(def => {
    const cat = deriveCategory(def.module);
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(def);
  });

  Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0])).forEach(([cat, items]) => {
    const title = document.createElement('div');
    title.className = 'lib-section-title';
    title.textContent = cat;
    sb.appendChild(title);

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'lib-item';
      el.draggable = true;
      el.dataset.type = item.type;

      const iconDiv = document.createElement('div');
      iconDiv.className = 'lib-icon';
      iconDiv.innerHTML = item.draw({ w: 32, h: 28 });

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
  const ry = (e.clientY - rect.top  - state.pan.y) / state.zoom - def.h / 2;  // def.h = default height
  const { x, y } = snapXY(rx, ry);
  addNode(type, x, y);
  pushHistory();
});

// ═══════════════════════════════════════════════════════
// NODE MANAGEMENT
// ═══════════════════════════════════════════════════════
function getItemDef(type) {
  return COMPONENT_DEFS[type] || null;
}

// Returns the live connector list for a node based on its portConfig
function getNodeConnectors(nodeData) {
  const def = getItemDef(nodeData.type);
  if (!def) return [];
  return computeConnectors(def.portDefs, nodeData.portConfig || {});
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
    portConfig: overrides.portConfig != null ? overrides.portConfig : defaultPortConfig(def.portDefs || {}),
  };
  state.nodes[id] = nodeData;

  const { w: dw, h: dh } = getNodeDims(nodeData);

  const el = document.createElement('div');
  el.className = 'node';
  el.id = 'node-' + id;
  el.style.left = nodeData.x + 'px';
  el.style.top  = nodeData.y + 'px';

  const body = document.createElement('div');
  body.className = 'node-body';
  body.style.width  = dw + 'px';
  body.style.height = dh + 'px';

  const svgWrap = document.createElement('div');
  svgWrap.className = 'node-svg';
  svgWrap.style.width  = dw + 'px';
  svgWrap.style.height = dh + 'px';
  svgWrap.innerHTML = def.draw({ w: dw, h: dh });
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
    dot.style.left = (conn.x * dw) + 'px';
    dot.style.top  = (conn.y * dh) + 'px';
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
  const { w: dw, h: dh } = getNodeDims(nodeData);
  const R = nodeData.rotation || 0;
  const steps = ((R / 90) % 4 + 4) % 4;
  const ew = steps % 2 === 0 ? dw : dh;
  const eh = steps % 2 === 0 ? dh : dw;

  const el = document.getElementById('node-' + nodeId);
  if (!el) return;
  const body = el.querySelector('.node-body');
  const svgWrap = el.querySelector('.node-svg');

  body.style.width  = ew + 'px';
  body.style.height = eh + 'px';

  svgWrap.style.width  = dw + 'px';
  svgWrap.style.height = dh + 'px';
  svgWrap.style.left = ((ew - dw) / 2) + 'px';
  svgWrap.style.top  = ((eh - dh) / 2) + 'px';
  svgWrap.innerHTML = def.draw({ w: dw, h: dh });
  const mirrorScale = nodeData.mirror ? ' scaleX(-1)' : '';
  svgWrap.style.transform = 'rotate(' + R + 'deg)' + mirrorScale;

  getNodeConnectors(nodeData).forEach(conn => {
    const dot = body.querySelector(`.connector[data-conn-id="${conn.id}"]`);
    if (!dot) return;
    let rx = conn.x * dw - dw / 2;
    let ry = conn.y * dh - dh / 2;
    if (nodeData.mirror) rx = -rx;
    for (let i = 0; i < steps; i++) { [rx, ry] = [-ry, rx]; }
    dot.style.left = (rx + ew / 2) + 'px';
    dot.style.top  = (ry + eh / 2) + 'px';
  });
}

function rebuildNodePorts(nodeId) {
  const nodeData = state.nodes[nodeId];
  // Remove connections whose ports no longer exist
  const validIds = new Set(getNodeConnectors(nodeData).map(c => c.id));
  state.connections = state.connections.filter(c => {
    const stale = (c.from.nodeId === nodeId && !validIds.has(c.from.connId)) ||
                  (c.to.nodeId   === nodeId && !validIds.has(c.to.connId));
    if (stale) { delete state.connPts[c.id]; document.getElementById('conn-g-' + c.id)?.remove(); }
    return !stale;
  });
  // Clear and re-add connector dots
  const body = document.querySelector(`#node-${nodeId} .node-body`);
  body.querySelectorAll('.connector').forEach(d => d.remove());
  getNodeConnectors(nodeData).forEach(conn => {
    const dot = document.createElement('div');
    dot.className = 'connector ' + conn.type;
    dot.dataset.nodeId = nodeId;
    dot.dataset.connId = conn.id;
    dot.dataset.connType = conn.type;
    dot.title = `${conn.type}: ${conn.id}`;
    body.appendChild(dot);
  });
  // Clear routed waypoints for affected connections
  state.connections.forEach(c => {
    if (c.from.nodeId === nodeId || c.to.nodeId === nodeId) delete state.connPts[c.id];
  });
  applyRotation(nodeId);
  redrawConnections();
  updateStatus();
}

function rotateNode(id) {
  const nodeData = state.nodes[id];
  const R = nodeData.rotation || 0;
  const { w: dw, h: dh } = getNodeDims(nodeData);
  const steps = ((R / 90) % 4 + 4) % 4;
  const ew_old = steps % 2 === 0 ? dw : dh;
  const eh_old = steps % 2 === 0 ? dh : dw;
  nodeData.rotation = (R + 90) % 360;
  const steps_new = (nodeData.rotation / 90) % 4;
  const ew_new = steps_new % 2 === 0 ? dw : dh;
  const eh_new = steps_new % 2 === 0 ? dh : dw;
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
  const conn = getNodeConnectors(nodeData).find(c => c.id === connId);
  if (!conn) return null;
  const { w: dw, h: dh } = getNodeDims(nodeData);
  const steps = (((nodeData.rotation || 0) / 90) % 4 + 4) % 4;
  const ew = steps % 2 === 0 ? dw : dh;
  const eh = steps % 2 === 0 ? dh : dw;
  let rx = conn.x * dw - dw / 2;
  let ry = conn.y * dh - dh / 2;
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
  const { w: dw, h: dh } = getNodeDims(nd);
  const steps = ((nd.rotation || 0) / 90 + 4) % 4;
  const ew = steps % 2 === 0 ? dw : dh;
  const eh = steps % 2 === 0 ? dh : dw;
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

  const connectorColors = { inlet: 'var(--accent2)', outlet: 'var(--accent3)', 'power-in': 'var(--power-in)', 'power-out': 'var(--power-out)' };
  const editableParamTypes = ['ComponentProperty', 'SimpleDataContainer'];
  const params = (def && def.parameters || []).filter(p => editableParamTypes.includes(p.container_type));

  // ── Build port config UI descriptors ──────────────────
  // variable ports: collect unique parameter names with their min
  const varPorts = {};   // paramName → { min, labels: [portGroupKey,...] }
  // conditional ports: collect parameter names with list of 'when' options
  const condPorts = {};  // paramName → ['inlet'|'outlet'|...]
  for (const [key, pd] of Object.entries(def ? def.portDefs : {})) {
    if (!pd) continue;
    if (pd.type === 'variable') {
      if (!varPorts[pd.parameter]) varPorts[pd.parameter] = { min: pd.min, keys: [] };
      varPorts[pd.parameter].keys.push(key);
    } else if (pd.type === 'conditional') {
      if (!condPorts[pd.parameter]) condPorts[pd.parameter] = [];
      condPorts[pd.parameter].push(pd.when);
    }
  }
  const portConfig = node.portConfig || {};

  const varPortsHtml = Object.entries(varPorts).map(([param, info]) => `
    <div class="prop-row" title="Number of ${info.keys.join('/')}">
      <div class="prop-label" style="color:var(--accent2)">${param}</div>
      <input class="prop-input" id="varport-${param}" type="number" min="${info.min}" value="${portConfig[param] ?? info.min}" style="width:56px">
    </div>`).join('');

  const condPortsHtml = Object.entries(condPorts).map(([param, options]) => `
    <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px;padding:4px 0">
      <div class="prop-label" style="color:var(--power-in)">${param}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:0 4px">
        <label style="display:flex;align-items:center;gap:4px;font-size:10px;cursor:pointer">
          <input type="radio" name="cond-${param}" value="__none__" ${!portConfig[param] || portConfig[param] === '__none__' ? 'checked' : ''}> none
        </label>
        ${options.map(opt => `
        <label style="display:flex;align-items:center;gap:4px;font-size:10px;cursor:pointer">
          <input type="radio" name="cond-${param}" value="${opt}" ${portConfig[param] === opt ? 'checked' : ''}> ${opt}
        </label>`).join('')}
      </div>
    </div>`).join('');

  const hasPortConfig = varPortsHtml || condPortsHtml;

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
    ${hasPortConfig ? `
    <div style="padding:8px 12px 4px;font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--border);margin-top:8px">Ports</div>
    <div style="padding:0 12px">${varPortsHtml}${condPortsHtml}</div>` : ''}
    ${params.length ? `
    <div style="padding:8px 12px 4px;font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--border);margin-top:8px">Parameters</div>
    ${params.map(p => `
      <div class="prop-row" title="${p.description || ''}">
        <div class="prop-label">${p.name}${p.quantity ? ' <span style="opacity:0.5;font-size:9px">[${p.quantity}]</span>' : ''}</div>
        <input class="prop-input" id="param-${p.name}" type="number" value="${node.props[p.name] !== undefined ? node.props[p.name] : ''}" placeholder="–" style="width:72px">
      </div>`).join('')}` : ''}
    <div style="padding:8px 12px 4px;font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--border);margin-top:8px">Connectors</div>
    ${getNodeConnectors(state.nodes[id]).map(c => `
      <div class="prop-row">
        <div class="prop-label" style="color:${connectorColors[c.type] || 'inherit'}">${c.id} <span style="opacity:0.5">(${c.type})</span></div>
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

  // Variable port inputs
  Object.keys(varPorts).forEach(param => {
    document.getElementById(`varport-${param}`)?.addEventListener('change', e => {
      const val = Math.max(varPorts[param].min, parseInt(e.target.value) || varPorts[param].min);
      e.target.value = val;
      node.portConfig[param] = val;
      rebuildNodePorts(id);
      showNodeProps(id);
      pushHistory();
    });
  });

  // Conditional port radio buttons
  Object.keys(condPorts).forEach(param => {
    pc.querySelectorAll(`input[name="cond-${param}"]`).forEach(radio => {
      radio.addEventListener('change', e => {
        const val = e.target.value;
        node.portConfig[param] = val === '__none__' ? null : val;
        rebuildNodePorts(id);
        showNodeProps(id);
        pushHistory();
      });
    });
  });

  params.forEach(p => {
    document.getElementById(`param-${p.name}`)?.addEventListener('change', e => {
      const raw = e.target.value.trim();
      if (raw === '') delete node.props[p.name];
      else node.props[p.name] = parseFloat(raw);
      pushHistory();
    });
  });
}

function showConnProps(connData) {
  const pc = document.getElementById('props-content');

  // Pick parameter list from connection.json based on fluid vs power connection
  const connDefKey = connData.connClass === 'power' ? 'PowerConnection' : 'Connection';
  const connParams = (CONNECTION_DEFS[connDefKey] && CONNECTION_DEFS[connDefKey].parameters || [])
    .filter(p => p.container_type === 'FluidProperties');

  if (!connData.props) connData.props = {};

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
    ${connParams.length ? `
    <div style="padding:8px 12px 4px;font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--border);margin-top:8px">Parameters</div>
    ${connParams.map(p => `
      <div class="prop-row" title="${p.description || ''}">
        <div class="prop-label">${p.name}${p.quantity ? ' <span style="opacity:0.5;font-size:9px">[${p.quantity}]</span>' : ''}</div>
        <input class="prop-input" id="conn-param-${p.name}" type="number" value="${connData.props[p.name] !== undefined ? connData.props[p.name] : ''}" placeholder="–" style="width:72px">
      </div>`).join('')}` : ''}
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
  connParams.forEach(p => {
    document.getElementById(`conn-param-${p.name}`)?.addEventListener('change', e => {
      const raw = e.target.value.trim();
      if (raw === '') delete connData.props[p.name];
      else connData.props[p.name] = parseFloat(raw);
      pushHistory();
    });
  });
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
      portConfig: n.portConfig || undefined,
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
      ...(c.props && Object.keys(c.props).length ? c.props : {}),
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
    addNode(n.type, n.x, n.y, { id: n.id, label: n.label, props: n.props || {}, rotation: n.rotation || 0, mirror: n.mirror || false, portConfig: n.portConfig || null });
  });

  // Add connections
  (json.connections || []).forEach(c => {
    addConnection(c.from.nodeId, c.from.connId, c.to.nodeId, c.to.connId, c.id, c.label);
    const conn = state.connections.find(x => x.id === c.id);
    if (conn && c.props) conn.props = JSON.parse(JSON.stringify(c.props));
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
applyTransform();
updateStatus();

loadDefs().then(() => {
  buildSidebar();
  pushHistory();
}).catch(err => {
  console.error('Failed to load component/connection definitions:', err);
  document.getElementById('sidebar').innerHTML =
    `<div style="padding:12px;color:#ff6b6b;font-size:11px">Failed to load definitions:<br>${err.message}<br><br>Serve via HTTP, not file://</div>`;
});
