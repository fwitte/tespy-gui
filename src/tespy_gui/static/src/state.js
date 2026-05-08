// ═══════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════
export const state = {
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
export const GRID = 20;
export let snapEnabled = false;

export function snapVal(v) { return snapEnabled ? Math.round(v / GRID) * GRID : v; }
export function snapXY(x, y) { return { x: snapVal(x), y: snapVal(y) }; }

export function setSnap(on) {
  snapEnabled = on;
  document.getElementById('btn-snap').classList.toggle('active', on);
}
