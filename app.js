const linkList = document.getElementById('linkList');
const linkForm = document.getElementById('linkForm');
const uploadForm = document.getElementById('uploadForm');
const uploadResult = document.getElementById('uploadResult');
const curlCommand = document.getElementById('curlCommand');
const downloadLink = document.getElementById('downloadLink');
const fileInput = document.getElementById('fileInput');
const endpointInput = document.getElementById('endpoint');
const filterTag = document.getElementById('filterTag');
const filterType = document.getElementById('filterType');
const groupToggle = document.getElementById('groupToggle');
const emptyState = document.getElementById('emptyState');
const tabs = document.querySelectorAll('[data-tab-target]');
const panels = document.querySelectorAll('.panel');
const mapForm = document.getElementById('mapForm');
const mapTitle = document.getElementById('mapTitle');
const mapParent = document.getElementById('mapParent');
const mindmapTree = document.getElementById('mindmapTree');

const STORAGE_KEY = 'zelfgehoste-links';
const MAP_STORAGE_KEY = 'zelfgehoste-map';

function loadLinks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.warn('Kon links niet lezen, reset opslag', err);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function formatType(type) {
  const lookup = {
    web: { label: 'Website', icon: '🌐' },
    smb: { label: 'SMB share', icon: '📁' },
    minecraft: { label: 'Minecraft', icon: '🎮' },
    anders: { label: 'Overig', icon: '📦' },
  };
  return lookup[type] || lookup.web;
}

function createLinkCard(link) {
  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('role', 'listitem');

  const typeInfo = formatType(link.type);
  const hostLabel = link.host ? `${link.host}${link.port ? `:${link.port}` : ''}` : '';
  article.innerHTML = `
    <div class="card__header">
      <h3 class="card__title">${link.name}</h3>
    </div>
    <div class="badge-row">
      <span class="tag">${link.tag}</span>
      <span class="pill">${typeInfo.icon} ${typeInfo.label}</span>
      ${link.serverGroup ? `<span class="pill">Server: ${link.serverGroup}</span>` : ''}
      ${hostLabel ? `<span class="pill">Host: ${hostLabel}</span>` : ''}
    </div>
    <div class="card__meta">
      ${link.url ? `<a href="${link.url}" target="_blank" rel="noreferrer">Open link ↗</a>` : '<span class="muted">Geen url</span>'}
    </div>
    ${link.note ? `<p class="card__note">${link.note}</p>` : ''}
    ${link.type === 'minecraft' ? `<div class="status" aria-live="polite"><span class="dot"></span><span class="status-text">Nog niet gecheckt</span></div>` : ''}
    <div class="card__actions">
      ${link.url ? `<a class="btn primary small" href="${link.url}" target="_blank" rel="noreferrer">Open</a>` : ''}
      ${link.type === 'smb' && link.url ? `<button class="btn ghost small" type="button" data-action="copy" data-copy-value="${link.url}">Kopieer share</button>` : ''}
      ${link.type === 'minecraft' && hostLabel ? `<button class="btn ghost small" type="button" data-action="status" data-host="${link.host}" data-port="${link.port || ''}">Check status</button>` : ''}
    </div>
  `;
  return article;
}

function matchesFilters(link, tag, type) {
  const tagMatch = tag ? link.tag?.toLowerCase() === tag.toLowerCase() : true;
  const typeMatch = type ? link.type === type : true;
  return tagMatch && typeMatch;
}

function renderLinks(tag = filterTag.value, type = filterType.value, grouped = groupToggle.checked) {
  const links = loadLinks();
  const filtered = links.filter((link) => matchesFilters(link, tag, type));

  linkList.innerHTML = '';

  if (grouped) {
    const groups = filtered.reduce((acc, link) => {
      const key = link.serverGroup?.trim() || 'Overige servers';
      acc[key] = acc[key] || [];
      acc[key].push(link);
      return acc;
    }, {});

    Object.entries(groups).forEach(([groupName, items]) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'group';
      const header = document.createElement('div');
      header.className = 'group__header';
      header.innerHTML = `<h3>${groupName}</h3><span class="pill">${items.length} item(s)</span>`;
      const grid = document.createElement('div');
      grid.className = 'card-grid';
      items.forEach((link) => grid.appendChild(createLinkCard(link)));
      wrapper.appendChild(header);
      wrapper.appendChild(grid);
      linkList.appendChild(wrapper);
    });
  } else {
    filtered.forEach((link) => linkList.appendChild(createLinkCard(link)));
  }

  emptyState.hidden = filtered.length > 0;
  linkList.toggleAttribute('data-has-items', filtered.length > 0);
}

function refreshTagFilter() {
  const links = loadLinks();
  const tags = Array.from(new Set(links.map((link) => link.tag)));
  filterTag.innerHTML = '<option value="">Alle</option>' + tags.map((tag) => `<option value="${tag}">${tag}</option>`).join('');
}

function handleLinkSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const url = document.getElementById('url').value.trim();
  const type = document.getElementById('type').value;
  const tag = document.getElementById('tag').value.trim();
  const serverGroup = document.getElementById('serverGroup').value.trim();
  const host = document.getElementById('host').value.trim();
  const port = document.getElementById('port').value.trim();
  const note = document.getElementById('note').value.trim();

  if (!name || !url || !tag) return;

  if (type === 'minecraft' && !host) {
    alert('Vul een host in voor je Minecraft server.');
    return;
  }

  const links = loadLinks();
  links.push({ name, url, tag, note, type, serverGroup, host, port });
  saveLinks(links);

  linkForm.reset();
  refreshTagFilter();
  renderLinks(filterTag.value, filterType.value, groupToggle.checked);
  setActivePanel('#links');
}

function handleUploadSubmit(event) {
  event.preventDefault();
  const file = fileInput.files[0];
  const endpoint = endpointInput.value.trim();
  if (!file || !endpoint) return;

  const slug = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const uploadUrl = `${endpoint.replace(/\/$/, '')}/uploads/${slug}/${encodeURIComponent(file.name)}`;
  const curl = `curl -T "${file.name}" ${uploadUrl}`;

  curlCommand.textContent = curl;
  downloadLink.textContent = uploadUrl;
  uploadResult.hidden = false;
}

function handleCopyClick(event) {
  const targetId = event.currentTarget.dataset.copyTarget;
  const element = document.getElementById(targetId);
  if (!element) return;
  navigator.clipboard.writeText(element.textContent).then(() => {
    event.currentTarget.textContent = '✓';
    setTimeout(() => (event.currentTarget.textContent = '📋'), 900);
  });
}

function setActivePanel(targetSelector) {
  panels.forEach((panel) => panel.classList.toggle('active', `#${panel.id}` === targetSelector));
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tabTarget === targetSelector));
  const panel = document.querySelector(targetSelector);
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleTabClick(event) {
  const target = event.currentTarget.dataset.tabTarget;
  setActivePanel(target);
}

function initTabs() {
  tabs.forEach((tab) => tab.addEventListener('click', handleTabClick));
}

function initFilters() {
  filterTag.addEventListener('change', () => renderLinks(filterTag.value, filterType.value, groupToggle.checked));
  filterType.addEventListener('change', () => renderLinks(filterTag.value, filterType.value, groupToggle.checked));
  groupToggle.addEventListener('change', () => renderLinks(filterTag.value, filterType.value, groupToggle.checked));
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy-target]').forEach((button) => {
    button.addEventListener('click', handleCopyClick);
  });
}

function handleCardAction(event) {
  const action = event.target.dataset.action;
  if (!action) return;
  if (action === 'copy' && event.target.dataset.copyValue) {
    navigator.clipboard.writeText(event.target.dataset.copyValue).then(() => {
      event.target.textContent = 'Gekopieerd';
      setTimeout(() => (event.target.textContent = 'Kopieer share'), 1000);
    });
    return;
  }

  if (action === 'status') {
    const { host, port } = event.target.dataset;
    const card = event.target.closest('.card');
    updateMinecraftStatus(card, host, port);
  }
}

async function updateMinecraftStatus(card, host, port) {
  if (!card || !host) return;
  const dot = card.querySelector('.dot');
  const label = card.querySelector('.status-text');
  if (!dot || !label) return;
  dot.classList.remove('online', 'offline');
  label.textContent = 'Status opvragen...';
  try {
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${host}${port ? `:${port}` : ''}`);
    if (!response.ok) throw new Error('Geen status');
    const data = await response.json();
    const online = data?.online;
    dot.classList.add(online ? 'online' : 'offline');
    label.textContent = online ? `Online (${data?.players?.online ?? 0} spelers)` : 'Offline';
  } catch (error) {
    dot.classList.add('offline');
    label.textContent = 'Onbekend';
  }
}

function loadMap() {
  const stored = localStorage.getItem(MAP_STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    localStorage.removeItem(MAP_STORAGE_KEY);
    return [];
  }
}

function saveMap(nodes) {
  localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(nodes));
}

function buildTree(nodes, parentId = '') {
  const children = nodes.filter((node) => (node.parentId || '') === parentId);
  if (!children.length) return null;
  const ul = document.createElement('ul');
  children.forEach((child) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="node-title">${child.title}</span>`;
    const meta = document.createElement('div');
    meta.className = 'node-meta';
    meta.textContent = child.parentId ? `Onder ${nodes.find((n) => n.id === child.parentId)?.title || 'root'}` : 'Bovenste laag';
    li.appendChild(meta);
    const subtree = buildTree(nodes, child.id);
    if (subtree) li.appendChild(subtree);
    ul.appendChild(li);
  });
  return ul;
}

function renderMindmap() {
  const nodes = loadMap();
  mapParent.innerHTML = '<option value="">Geen (topniveau)</option>' + nodes.map((node) => `<option value="${node.id}">${node.title}</option>`).join('');
  mindmapTree.innerHTML = '';
  const tree = buildTree(nodes);
  mindmapTree.appendChild(tree || document.createTextNode('Nog geen knopen toegevoegd.'));
}

function handleMapSubmit(event) {
  event.preventDefault();
  const title = mapTitle.value.trim();
  const parentId = mapParent.value;
  if (!title) return;
  const nodes = loadMap();
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  nodes.push({ id, title, parentId });
  saveMap(nodes);
  mapForm.reset();
  renderMindmap();
}

function bootstrap() {
  renderLinks();
  refreshTagFilter();
  linkForm.addEventListener('submit', handleLinkSubmit);
  uploadForm.addEventListener('submit', handleUploadSubmit);
  initTabs();
  initFilters();
  initCopyButtons();
  mapForm.addEventListener('submit', handleMapSubmit);
  linkList.addEventListener('click', handleCardAction);
  renderMindmap();
}

document.addEventListener('DOMContentLoaded', bootstrap);
