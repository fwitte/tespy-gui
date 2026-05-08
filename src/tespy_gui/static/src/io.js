// ═══════════════════════════════════════════════════════
// JSON EXPORT / IMPORT
// ═══════════════════════════════════════════════════════
import { state } from './state.js';
import { addNode, getNodeConnectors, selectNone } from './nodes.js';
import { addConnection } from './connections.js';
import { updateStatus } from './ui.js';

export function exportJSON() {
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

export function exportTESPy() {
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

export function importJSON(json) {
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
