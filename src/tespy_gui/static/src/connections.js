// ═══════════════════════════════════════════════════════
// CONNECTIONS
// ═══════════════════════════════════════════════════════
import { state } from './state.js';
import { getItemDef, getNodeConnectors, getNodeDims, selectNone, updatePropsForSelection } from './nodes.js';
import { pushHistory } from './history.js';
import { updateStatus } from './ui.js';

const CONN_STUB     = 20;  // stub length from connector port
const CONN_CORNER_R = 8;   // rounded corner radius
const CONN_HOP_R    = 5;   // hop arc radius (bridge over crossing)

export function getConnectorPos(nodeId, connId) {
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

export function getConnectorType(nodeId, connId) {
  return getNodeConnectors(state.nodes[nodeId]).find(c => c.id === connId)?.type;
}

export function addConnection(fromNodeId, fromConnId, toNodeId, toConnId, overrideId, overrideLabel) {
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

export function screenToCanvas(clientX, clientY) {
  const rect = document.getElementById('canvas-wrap').getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.pan.x) / state.zoom,
    y: (clientY - rect.top  - state.pan.y) / state.zoom,
  };
}

export function drawConnection(connData) {
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
    const isFirst = dragSegIdx === 1;
    const isLast  = dragSegIdx === n - 3;

    let newPts;

    if (dragAxis === 'h') {
      const newY = snap[dragSegIdx].y + (cp.y - dragStart.y);
      if (isFirst) {
        const behind = dragD0 && dragD0.dy * (newY - snap[1].y) < 0;
        if (behind && dragB0) {
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
        const behind = dragD0 && dragD0.dx * (newX - snap[1].x) < 0;
        if (behind && dragB0) {
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
export function getConnectorTangent(nodeId, connId) {
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

function routeOrthogonal(p0, d0, p1, d1, b0, b1) {
  const sx = p0.x + d0.dx * CONN_STUB, sy = p0.y + d0.dy * CONN_STUB;
  const ex = p1.x + d1.dx * CONN_STUB, ey = p1.y + d1.dy * CONN_STUB;
  const horiz0 = d0.dy === 0, horiz1 = d1.dy === 0;
  let mids = [];

  if (horiz0 && horiz1) {
    if (d0.dx !== d1.dx) {
      if ((d0.dx > 0 && ex >= sx) || (d0.dx < 0 && ex <= sx)) {
        const mx = (sx + ex) / 2;
        mids = [{ x: mx, y: sy }, { x: mx, y: ey }];
      } else {
        const above_y = (b0 && b1 ? Math.min(b0.y, b1.y) : Math.min(p0.y, p1.y)) - CONN_STUB;
        const below_y = (b0 && b1 ? Math.max(b0.y + b0.h, b1.y + b1.h) : Math.max(p0.y, p1.y)) + CONN_STUB;
        const route_y = Math.abs(sy - above_y) < Math.abs(sy - below_y) ? above_y : below_y;
        mids = [{ x: sx, y: route_y }, { x: ex, y: route_y }];
      }
    } else {
      const xe = d0.dx > 0 ? Math.max(sx, ex) + CONN_STUB : Math.min(sx, ex) - CONN_STUB;
      mids = [{ x: xe, y: sy }, { x: xe, y: ey }];
    }
  } else if (!horiz0 && !horiz1) {
    if (d0.dy !== d1.dy) {
      if ((d0.dy > 0 && ey >= sy) || (d0.dy < 0 && ey <= sy)) {
        const my = (sy + ey) / 2;
        mids = [{ x: sx, y: my }, { x: ex, y: my }];
      } else {
        const left_x  = (b0 && b1 ? Math.min(b0.x, b1.x) : Math.min(p0.x, p1.x)) - CONN_STUB;
        const right_x = (b0 && b1 ? Math.max(b0.x + b0.w, b1.x + b1.w) : Math.max(p0.x, p1.x)) + CONN_STUB;
        const route_x = Math.abs(sx - left_x) < Math.abs(sx - right_x) ? left_x : right_x;
        mids = [{ x: route_x, y: sy }, { x: route_x, y: ey }];
      }
    } else {
      const ye = d0.dy > 0 ? Math.max(sy, ey) + CONN_STUB : Math.min(sy, ey) - CONN_STUB;
      mids = [{ x: sx, y: ye }, { x: ex, y: ye }];
    }
  } else if (horiz0) {
    const wrongSide    = d1.dy * (sy - p1.y) < 0;
    const behindSource = d0.dx * (ex - sx)   < 0;
    mids = (wrongSide || behindSource) ? [{ x: sx, y: ey }] : [{ x: ex, y: sy }];
  } else {
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

    let hopsHere = segHops[i];
    if (hopsHere.length > 0) {
      const sign = dx > 0 ? 1 : -1;
      const sweep = dx > 0 ? 0 : 1;
      hopsHere.slice().sort((p, q) => sign * (p - q)).forEach(hx => {
        cmds.push(`L${hx - HR * sign},${a.y}`);
        cmds.push(`A${HR},${HR} 0 0 ${sweep} ${hx + HR * sign},${a.y}`);
      });
    }

    cmds.push(`L${b.x - nx * r_end},${b.y - ny * r_end}`);

    if (hasTurn) {
      const sweep = (nx * ny2 - ny * nx2) > 0 ? 1 : 0;
      cmds.push(`A${r_end},${r_end} 0 0 ${sweep} ${b.x + nx2 * r_end},${b.y + ny2 * r_end}`);
    }
  }

  return cmds.join(' ');
}

export function getNodeBounds(nodeId) {
  const nd = state.nodes[nodeId];
  if (!nd) return null;
  const { w: dw, h: dh } = getNodeDims(nd);
  const steps = ((nd.rotation || 0) / 90 + 4) % 4;
  const ew = steps % 2 === 0 ? dw : dh;
  const eh = steps % 2 === 0 ? dh : dw;
  return { x: nd.x, y: nd.y, w: ew, h: eh };
}

export function redrawConnections() {
  // 1. Route all connections
  const routes = {};
  state.connections.forEach(c => {
    const from = getConnectorPos(c.from.nodeId, c.from.connId);
    const to   = getConnectorPos(c.to.nodeId,   c.to.connId);
    if (!from || !to) return;
    if (state.connPts[c.id]) {
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

  // 3. Collect hop positions
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

export function removeConnection(id) {
  state.connections = state.connections.filter(c => c.id !== id);
  delete state.connPts[id];
  const g = document.getElementById('conn-g-' + id);
  if (g) g.remove();
  state.selected.delete(id);
  updateStatus();
}

// ─── CONNECT MODE ───
export function initConnectMode() {
  const tempConn = document.getElementById('temp-conn');
  const canvas = document.getElementById('canvas');
  const canvasWrap = document.getElementById('canvas-wrap');

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
}
