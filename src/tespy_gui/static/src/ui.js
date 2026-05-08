// ═══════════════════════════════════════════════════════
// STATUS BAR
// ═══════════════════════════════════════════════════════
import { state } from './state.js';

export function updateStatus() {
  document.getElementById('status-nodes').textContent = `Nodes: ${Object.keys(state.nodes).length}`;
  document.getElementById('status-conns').textContent = `Connections: ${state.connections.length}`;
}

let msgTimer;
export function statusMsg(msg) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.textContent = '', 3000);
}
