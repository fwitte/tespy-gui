// ═══════════════════════════════════════════════════════
// NODE MANAGEMENT + SELECTION
// ═══════════════════════════════════════════════════════
import { COMPONENT_DEFS, computeConnectors, defaultPortConfig } from './defs.js';
import { state, snapEnabled, snapXY } from './state.js';
import { pushHistory } from './history.js';
import { redrawConnections, removeConnection } from './connections.js';
import { showEmptyProps, showNodeProps, showConnProps } from './properties.js';
import { updateStatus } from './ui.js';

export function getItemDef(type) {
  return COMPONENT_DEFS[type] || null;
}

// Returns the live connector list for a node based on its portConfig
export function getNodeConnectors(nodeData) {
  const def = getItemDef(nodeData.type);
  if (!def) return [];
  return computeConnectors(def.portDefs, nodeData.portConfig || {});
}

// Get the pixel dimensions of a node given its live portConfig.
// Width is always 80; height depends on how many fluid rows are active.
export function getNodeDims(nodeData) {
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

export function genId() { return 'n' + (state.nextId++); }

export function addNode(type, x, y, overrides = {}) {
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

  document.getElementById('canvas').appendChild(el);
  makeDraggable(el, nodeData);
  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('connector')) return;
    selectNode(id, e.shiftKey);
  });

  updateStatus();
  applyRotation(id);
  return id;
}

export function removeNode(id) {
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

export function applyRotation(nodeId) {
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

export function rebuildNodePorts(nodeId) {
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

export function rotateNode(id) {
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

export function mirrorNode(id) {
  const nodeData = state.nodes[id];
  nodeData.mirror = !nodeData.mirror;
  applyRotation(id);
  state.connections.forEach(c => {
    if (c.from.nodeId === id || c.to.nodeId === id) delete state.connPts[c.id];
  });
  redrawConnections();
}

// ─── DRAG NODES ───
export function makeDraggable(el, nodeData) {
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
export function selectNode(id, additive = false) {
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

export function selectNone() {
  state.selected.forEach(id => {
    const el = document.getElementById('node-' + id);
    if (el) el.classList.remove('selected');
  });
  document.querySelectorAll('.conn-path.selected').forEach(p => p.classList.remove('selected'));
  state.selected.clear();
  showEmptyProps();
}

export function selectAll() {
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

export function updatePropsForSelection() {
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
