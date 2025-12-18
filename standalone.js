const REMOTE_STORAGE_KEY = 'zelfgehoste-remote';
const remoteForm = document.getElementById('remoteForm');
const remoteList = document.getElementById('remoteList');
const remoteEmpty = document.getElementById('remoteEmpty');
const remoteTypeFilter = document.getElementById('remoteTypeFilter');
const remoteStatusFilter = document.getElementById('remoteStatusFilter');
const remoteSearch = document.getElementById('remoteSearch');
const exportOutput = document.getElementById('exportOutput');
const exportCopy = document.getElementById('exportCopy');

function loadRemoteEntries() {
  const stored = localStorage.getItem(REMOTE_STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    localStorage.removeItem(REMOTE_STORAGE_KEY);
    return [];
  }
}

function saveRemoteEntries(entries) {
  localStorage.setItem(REMOTE_STORAGE_KEY, JSON.stringify(entries));
}

function renderRemote(entries) {
  remoteList.innerHTML = '';
  if (!entries.length) {
    remoteEmpty.hidden = false;
    return;
  }
  remoteEmpty.hidden = true;

  entries.forEach((entry) => {
    const article = document.createElement('article');
    article.className = 'card';
    const statusIcon = entry.status === 'running' ? '🟢' : entry.status === 'stopped' ? '🔴' : '⚪️';
    const statusLabel = entry.status === 'running' ? 'Aan' : entry.status === 'stopped' ? 'Uit' : 'Onbekend';
    article.innerHTML = `
      <div class="card__header">
        <h3 class="card__title">${entry.name}</h3>
      </div>
      <div class="badge-row">
        <span class="pill">${entry.type}</span>
        ${entry.host ? `<span class="pill">Host: ${entry.host}</span>` : ''}
        <span class="pill">${statusIcon} ${statusLabel}</span>
      </div>
      ${entry.note ? `<p class="card__note">${entry.note}</p>` : ''}
      <div class="card__meta">
        ${entry.users ? `<span class="muted">${entry.users}</span>` : ''}
      </div>
      <div class="card__meta">
        ${entry.folders ? `<span class="muted">${entry.folders}</span>` : ''}
      </div>
      <div class="card__meta">
        ${entry.ports ? `<span class="muted">${entry.ports}</span>` : ''}
      </div>
    `;
    remoteList.appendChild(article);
  });
}

function generatePayload(entries) {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    standalone: entries,
  };
  const encoded = btoa(JSON.stringify(payload));
  exportOutput.value = encoded;
}

function filterRemote() {
  const entries = loadRemoteEntries();
  const type = remoteTypeFilter.value;
  const status = remoteStatusFilter.value;
  const term = remoteSearch.value.toLowerCase().trim();

  const filtered = entries.filter((entry) => {
    const typeMatch = type ? entry.type === type : true;
    const statusMatch = status ? entry.status === status : true;
    const searchMatch = term
      ? entry.name.toLowerCase().includes(term) || (entry.host || '').toLowerCase().includes(term)
      : true;
    return typeMatch && statusMatch && searchMatch;
  });

  renderRemote(filtered);
  generatePayload(entries);
}

remoteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const entries = loadRemoteEntries();
  const newEntry = {
    name: document.getElementById('remoteName').value.trim(),
    host: document.getElementById('remoteHost').value.trim(),
    type: document.getElementById('remoteType').value,
    status: document.getElementById('remoteStatus').value,
    users: document.getElementById('remoteUsers').value.trim(),
    folders: document.getElementById('remoteFolders').value.trim(),
    ports: document.getElementById('remotePorts').value.trim(),
    note: document.getElementById('remoteNote').value.trim(),
  };
  entries.push(newEntry);
  saveRemoteEntries(entries);
  remoteForm.reset();
  filterRemote();
});

[remoteTypeFilter, remoteStatusFilter, remoteSearch].forEach((el) => {
  el.addEventListener('input', filterRemote);
});

exportCopy.addEventListener('click', () => {
  exportOutput.select();
  document.execCommand('copy');
  exportCopy.textContent = 'Gekopieerd!';
  setTimeout(() => {
    exportCopy.textContent = 'Kopieer payload';
  }, 2000);
});

filterRemote();
