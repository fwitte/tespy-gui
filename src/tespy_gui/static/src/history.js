// ═══════════════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════════════
import { state } from './state.js';
import { addNode, selectNone } from './nodes.js';
import { addConnection } from './connections.js';
import { updateStatus, statusMsg } from './ui.js';

export const history = { stack: [], index: -1, locked: false, maxSize: 50 };

export function takeSnapshot() {
  return {
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
}

export function pushHistory() {
  if (history.locked) return;
  // Discard any redo states
  history.stack.splice(history.index + 1);
  history.stack.push(takeSnapshot());
  if (history.stack.length > history.maxSize) history.stack.shift();
  history.index = history.stack.length - 1;
}

export function restoreSnapshot(snap) {
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

export function undo() {
  if (history.index <= 0) { statusMsg('Nothing to undo'); return; }
  history.index--;
  restoreSnapshot(history.stack[history.index]);
  statusMsg('Undo');
}

export function redo() {
  if (history.index >= history.stack.length - 1) { statusMsg('Nothing to redo'); return; }
  history.index++;
  restoreSnapshot(history.stack[history.index]);
  statusMsg('Redo');
}
