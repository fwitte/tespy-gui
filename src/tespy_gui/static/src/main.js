// ═══════════════════════════════════════════════════════
// MAIN ENTRY POINT
// Wires together canvas, sidebar, keyboard, toolbar, and init
// ═══════════════════════════════════════════════════════
import { state, GRID, snapEnabled, setSnap, snapXY } from './state.js';
import { COMPONENT_DEFS, loadDefs, deriveCategory } from './defs.js';
import { pushHistory, undo, redo } from './history.js';
import { updateStatus, statusMsg } from './ui.js';
import { getItemDef, addNode, removeNode, selectNode, selectNone, selectAll, rotateNode, mirrorNode, updatePropsForSelection } from './nodes.js';
import { addConnection, removeConnection, redrawConnections, initConnectMode } from './connections.js';
import { copySelected, pasteClipboard } from './clipboard.js';
import { exportTESPy, importJSON } from './io.js';

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

// Drop from sidebar
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
// KEYBOARD SHORTCUTS
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
// CONSOLE PANEL
// ═══════════════════════════════════════════════════════
const consolePanel  = document.getElementById('console-panel');
const consoleOutput = document.getElementById('console-output');
const consoleStatus = document.getElementById('console-status');

function consolePrint(text, cls = '') {
  const el = document.createElement('span');
  if (cls) el.className = cls;
  el.textContent = text;
  consoleOutput.appendChild(el);
  consoleOutput.appendChild(document.createTextNode('\n'));
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function consoleOpen() {
  consolePanel.classList.remove('console-collapsed');
  document.getElementById('console-toggle').textContent = '▼';
}

document.getElementById('console-header').addEventListener('click', e => {
  if (e.target.id === 'console-clear' || e.target.id === 'console-toggle') return;
  consolePanel.classList.toggle('console-collapsed');
  const collapsed = consolePanel.classList.contains('console-collapsed');
  document.getElementById('console-toggle').textContent = collapsed ? '▲' : '▼';
});
document.getElementById('console-toggle').addEventListener('click', () => {
  consolePanel.classList.toggle('console-collapsed');
  const collapsed = consolePanel.classList.contains('console-collapsed');
  document.getElementById('console-toggle').textContent = collapsed ? '▲' : '▼';
});
document.getElementById('console-clear').addEventListener('click', e => {
  e.stopPropagation();
  consoleOutput.textContent = '';
  consoleStatus.textContent = '';
  consoleStatus.className = '';
});

// ─── RUN SIMULATION ───
document.getElementById('btn-run').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run');
  const json = exportTESPy();

  // Open console and show running state
  consoleOpen();
  consoleOutput.textContent = '';
  consoleStatus.textContent = 'Running…';
  consoleStatus.className = 'console-info';
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const response = await fetch('/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    });
    const result = await response.json();

    // Print logs
    if (result.logs) {
      result.logs.split('\n').forEach(line => {
        const cls = line.startsWith('ERROR') || line.startsWith('Traceback') || line.includes('Error:')
          ? 'console-error'
          : line.startsWith('WARNING') ? '' : '';
        consolePrint(line, cls);
      });
    }

    if (result.converged) {
      consoleStatus.textContent = '✓ Converged';
      consoleStatus.style.color = 'var(--accent2)';
    } else if (result.success) {
      consoleStatus.textContent = '✗ Did not converge';
      consoleStatus.style.color = '#ff6b6b';
    } else {
      consoleStatus.textContent = '✗ Error';
      consoleStatus.style.color = '#ff6b6b';
    }
  } catch (err) {
    consolePrint('Failed to reach server: ' + err.message, 'console-error');
    consoleStatus.textContent = '✗ Error';
    consoleStatus.style.color = '#ff6b6b';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2l7 4-7 4V2z" fill="currentColor"/></svg> RUN';
  }
});

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
initConnectMode();

loadDefs().then(() => {
  buildSidebar();
  pushHistory();
}).catch(err => {
  console.error('Failed to load component/connection definitions:', err);
  document.getElementById('sidebar').innerHTML =
    `<div style="padding:12px;color:#ff6b6b;font-size:11px">Failed to load definitions:<br>${err.message}<br><br>Serve via HTTP, not file://</div>`;
});
