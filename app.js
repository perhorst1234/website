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
const serviceForm = document.getElementById('serviceForm');
const serviceMapParent = document.getElementById('serviceMapParent');
const serviceList = document.getElementById('serviceList');
const serviceEmpty = document.getElementById('serviceEmpty');
const standaloneForm = document.getElementById('standaloneForm');
const standaloneList = document.getElementById('standaloneList');
const standaloneEmpty = document.getElementById('standaloneEmpty');
const standaloneTypeFilter = document.getElementById('standaloneTypeFilter');
const standaloneStatusFilter = document.getElementById('standaloneStatusFilter');
const standaloneSearch = document.getElementById('standaloneSearch');

const STORAGE_KEY = 'zelfgehoste-links';
const MAP_STORAGE_KEY = 'zelfgehoste-map';
const SERVICE_STORAGE_KEY = 'zelfgehoste-services';
const STANDALONE_STORAGE_KEY = 'zelfgehoste-standalone';

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

function loadServices() {
  const stored = localStorage.getItem(SERVICE_STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    localStorage.removeItem(SERVICE_STORAGE_KEY);
    return [];
  }
}

function saveServices(services) {
  localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(services));
}

function loadStandaloneServices() {
  const stored = localStorage.getItem(STANDALONE_STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    localStorage.removeItem(STANDALONE_STORAGE_KEY);
    return [];
  }
}

function saveStandaloneServices(entries) {
  localStorage.setItem(STANDALONE_STORAGE_KEY, JSON.stringify(entries));
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
    const parentTitle = child.parentId ? nodes.find((n) => n.id === child.parentId)?.title || 'root' : 'Bovenste laag';
    meta.textContent = `${parentTitle}${child.note ? ` • ${child.note}` : ''}`;
    li.appendChild(meta);
    const subtree = buildTree(nodes, child.id);
    if (subtree) li.appendChild(subtree);
    ul.appendChild(li);
  });
  return ul;
}

function syncMapSelectors(nodes) {
  const options = '<option value="">Geen (topniveau)</option>' + nodes.map((node) => `<option value="${node.id}">${node.title}</option>`).join('');
  mapParent.innerHTML = options;
  if (serviceMapParent) serviceMapParent.innerHTML = options;
}

function renderMindmap() {
  const nodes = loadMap();
  syncMapSelectors(nodes);
  mindmapTree.innerHTML = '';
  const tree = buildTree(nodes);
  mindmapTree.appendChild(tree || document.createTextNode('Nog geen knopen toegevoegd.'));
}

function addNodeToMap(title, parentId = '', note = '') {
  const nodes = loadMap();
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  nodes.push({ id, title, parentId, note });
  saveMap(nodes);
  renderMindmap();
}

function handleMapSubmit(event) {
  event.preventDefault();
  const title = mapTitle.value.trim();
  const parentId = mapParent.value;
  if (!title) return;
  addNodeToMap(title, parentId);
  mapForm.reset();
}

function formatServiceType(type) {
  const types = {
    docker: { label: 'Docker container', icon: '🐳' },
    vm: { label: 'VM', icon: '🖥️' },
    stack: { label: 'Stack', icon: '🧩' },
    service: { label: 'Service', icon: '🛠️' },
    share: { label: 'Share', icon: '📂' },
    game: { label: 'Game server', icon: '🎮' },
    anders: { label: 'Overig', icon: '📦' },
  };
  return types[type] || types.anders;
}

function formatServiceStatus(status) {
  const lookup = {
    running: { label: 'Aan', className: 'online' },
    stopped: { label: 'Uit', className: 'offline' },
    unknown: { label: 'Onbekend', className: '' },
  };
  return lookup[status] || lookup.unknown;
}

function createServiceCard(service) {
  const article = document.createElement('article');
  article.className = 'card grid-row';
  article.dataset.serviceId = service.id;
  const typeInfo = formatServiceType(service.type);
  const statusInfo = formatServiceStatus(service.status);

  article.innerHTML = `
    <div class="card__header">
      <h3 class="card__title">${service.name}</h3>
    </div>
    <div class="badge-row">
      <span class="pill">${typeInfo.icon} ${typeInfo.label}</span>
      ${service.host ? `<span class="pill">Host: ${service.host}</span>` : ''}
      ${service.ports ? `<span class="pill">${service.ports}</span>` : ''}
      <span class="status-chip"><span class="dot ${statusInfo.className}"></span>${statusInfo.label}</span>
    </div>
    <div class="card__meta card__meta--two-col">
      ${service.users ? `<span class="muted"><strong>Users:</strong> ${service.users}</span>` : ''}
      ${service.folders ? `<span class="muted"><strong>Folders:</strong> ${service.folders}</span>` : ''}
    </div>
    ${service.note ? `<p class="card__note">${service.note}</p>` : ''}
    <div class="card__actions">
      <button class="btn ghost small" type="button" data-action="toggle-status">Status wisselen</button>
      <button class="btn primary small" type="button" data-action="map-service">Naar mindmap</button>
    </div>
  `;

  return article;
}

function createStandaloneCard(entry) {
  const article = document.createElement('article');
  article.className = 'card grid-row';
  article.dataset.standaloneId = entry.id;
  const typeInfo = formatServiceType(entry.type);
  const statusInfo = formatServiceStatus(entry.status);

  article.innerHTML = `
    <div class="card__header">
      <h3 class="card__title">${entry.name}</h3>
    </div>
    <div class="badge-row">
      <span class="pill">${typeInfo.icon} ${typeInfo.label}</span>
      ${entry.host ? `<span class="pill">Host: ${entry.host}</span>` : ''}
      ${entry.ports ? `<span class="pill">${entry.ports}</span>` : ''}
      <span class="status-chip"><span class="dot ${statusInfo.className}"></span>${statusInfo.label}</span>
    </div>
    <div class="card__meta card__meta--two-col">
      ${entry.users ? `<span class="muted"><strong>Users:</strong> ${entry.users}</span>` : ''}
      ${entry.folders ? `<span class="muted"><strong>Folders:</strong> ${entry.folders}</span>` : ''}
    </div>
    ${entry.note ? `<p class="card__note">${entry.note}</p>` : ''}
    <div class="card__actions">
      <button class="btn ghost small" type="button" data-action="toggle-standalone-status">Status wisselen</button>
      ${entry.host ? `<button class="btn primary small" type="button" data-action="copy-host" data-copy-value="${entry.host}">Kopieer host</button>` : ''}
    </div>
  `;

  return article;
}

function renderServices() {
  const services = loadServices();
  serviceList.innerHTML = '';
  services.forEach((service) => serviceList.appendChild(createServiceCard(service)));
  const hasItems = services.length > 0;
  serviceEmpty.hidden = hasItems;
  serviceList.toggleAttribute('data-has-items', hasItems);
}

function filterStandalone(entry, typeFilter, statusFilter, searchTerm) {
  const matchesType = typeFilter ? entry.type === typeFilter : true;
  const matchesStatus = statusFilter ? entry.status === statusFilter : true;
  const matchesSearch = searchTerm
    ? (entry.name + entry.host + entry.note + entry.ports + entry.users)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    : true;
  return matchesType && matchesStatus && matchesSearch;
}

function renderStandalone() {
  if (!standaloneList) return;
  const entries = loadStandaloneServices();
  const typeFilter = standaloneTypeFilter?.value || '';
  const statusFilter = standaloneStatusFilter?.value || '';
  const searchTerm = standaloneSearch?.value.trim() || '';

  const filtered = entries.filter((entry) => filterStandalone(entry, typeFilter, statusFilter, searchTerm));

  standaloneList.innerHTML = '';
  filtered.forEach((entry) => standaloneList.appendChild(createStandaloneCard(entry)));
  const hasItems = filtered.length > 0;
  if (standaloneEmpty) standaloneEmpty.hidden = hasItems;
  standaloneList?.toggleAttribute('data-has-items', hasItems);
}

function handleServiceSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('serviceName').value.trim();
  const host = document.getElementById('serviceHost').value.trim();
  const type = document.getElementById('serviceType').value;
  const status = document.getElementById('serviceStatus').value;
  const users = document.getElementById('serviceUsers').value.trim();
  const folders = document.getElementById('serviceFolders').value.trim();
  const ports = document.getElementById('servicePorts').value.trim();
  const note = document.getElementById('serviceNote').value.trim();
  const mapParentId = serviceMapParent?.value || '';

  if (!name) return;

  const services = loadServices();
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const service = { id, name, host, type, status, users, folders, ports, note, mapParentId };
  services.push(service);
  saveServices(services);
  renderServices();
  serviceForm.reset();

  if (mapParentId !== undefined) {
    const mapNote = [formatServiceType(type).label, host || null, ports || null].filter(Boolean).join(' • ');
    addNodeToMap(name, mapParentId, mapNote);
  }
}

function pushServiceToMap(service) {
  const mapNote = [formatServiceType(service.type).label, service.host || null, service.ports || null].filter(Boolean).join(' • ');
  addNodeToMap(service.name, service.mapParentId || '', mapNote);
}

function toggleServiceStatus(service) {
  const order = ['running', 'stopped', 'unknown'];
  const currentIndex = order.indexOf(service.status);
  const nextStatus = order[(currentIndex + 1) % order.length];
  service.status = nextStatus;
  return service;
}

function handleServiceAction(event) {
  const action = event.target.dataset.action;
  if (!action) return;
  const article = event.target.closest('[data-service-id]');
  if (!article) return;
  const serviceId = article.dataset.serviceId;
  const services = loadServices();
  const service = services.find((item) => item.id === serviceId);
  if (!service) return;

  if (action === 'toggle-status') {
    toggleServiceStatus(service);
    saveServices(services);
    renderServices();
    return;
  }

  if (action === 'map-service') {
    pushServiceToMap(service);
  }
}

function handleStandaloneSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('standaloneName').value.trim();
  const host = document.getElementById('standaloneHost').value.trim();
  const type = document.getElementById('standaloneType').value;
  const status = document.getElementById('standaloneStatus').value;
  const users = document.getElementById('standaloneUsers').value.trim();
  const folders = document.getElementById('standaloneFolders').value.trim();
  const ports = document.getElementById('standalonePorts').value.trim();
  const note = document.getElementById('standaloneNote').value.trim();

  if (!name) return;

  const entries = loadStandaloneServices();
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  entries.push({ id, name, host, type, status, users, folders, ports, note });
  saveStandaloneServices(entries);
  renderStandalone();
  standaloneForm.reset();
}

function handleStandaloneAction(event) {
  const action = event.target.dataset.action;
  if (!action) return;
  const article = event.target.closest('[data-standalone-id]');
  if (!article) return;
  const entries = loadStandaloneServices();
  const entry = entries.find((item) => item.id === article.dataset.standaloneId);
  if (!entry) return;

  if (action === 'toggle-standalone-status') {
    toggleServiceStatus(entry);
    saveStandaloneServices(entries);
    renderStandalone();
    return;
  }

  if (action === 'copy-host' && event.target.dataset.copyValue) {
    navigator.clipboard.writeText(event.target.dataset.copyValue).then(() => {
      event.target.textContent = 'Gekopieerd';
      setTimeout(() => (event.target.textContent = 'Kopieer host'), 1000);
    });
  }
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
  if (serviceForm) serviceForm.addEventListener('submit', handleServiceSubmit);
  if (serviceList) serviceList.addEventListener('click', handleServiceAction);
  renderServices();
  if (standaloneForm) standaloneForm.addEventListener('submit', handleStandaloneSubmit);
  if (standaloneList) standaloneList.addEventListener('click', handleStandaloneAction);
  if (standaloneTypeFilter) standaloneTypeFilter.addEventListener('change', renderStandalone);
  if (standaloneStatusFilter) standaloneStatusFilter.addEventListener('change', renderStandalone);
  if (standaloneSearch) standaloneSearch.addEventListener('input', renderStandalone);
  renderStandalone();
}

document.addEventListener('DOMContentLoaded', bootstrap);
