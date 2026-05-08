// ═══════════════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════════════
import { state } from './state.js';
import { CONNECTION_DEFS } from './defs.js';
import { getItemDef, getNodeConnectors, rotateNode, mirrorNode, rebuildNodePorts } from './nodes.js';
import { redrawConnections, removeConnection } from './connections.js';
import { pushHistory } from './history.js';

export function showEmptyProps() {
  document.getElementById('props-content').innerHTML =
    '<div class="props-empty">Select an element<br>to edit its properties</div>';
}

export function showNodeProps(id) {
  const node = state.nodes[id];
  const def = getItemDef(node.type);
  const pc = document.getElementById('props-content');

  const connectorColors = { inlet: 'var(--accent2)', outlet: 'var(--accent3)', 'power-in': 'var(--power-in)', 'power-out': 'var(--power-out)' };
  const editableParamTypes = ['ComponentProperty', 'SimpleDataContainer'];
  const params = (def && def.parameters || []).filter(p => editableParamTypes.includes(p.container_type));

  // ── Build port config UI descriptors ──────────────────
  const varPorts = {};   // paramName → { min, labels: [portGroupKey,...] }
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

export function showConnProps(connData) {
  const pc = document.getElementById('props-content');

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
