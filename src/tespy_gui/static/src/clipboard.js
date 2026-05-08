// ═══════════════════════════════════════════════════════
// COPY / PASTE
// ═══════════════════════════════════════════════════════
import { state } from './state.js';
import { addNode, selectNone, updatePropsForSelection } from './nodes.js';
import { addConnection } from './connections.js';
import { pushHistory } from './history.js';
import { statusMsg } from './ui.js';

const clipboard = { nodes: [], connections: [] };
const PASTE_OFFSET = 20;

export function copySelected() {
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

export function pasteClipboard() {
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
