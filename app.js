const linkList = document.getElementById('linkList');
const linkForm = document.getElementById('linkForm');
const uploadForm = document.getElementById('uploadForm');
const uploadResult = document.getElementById('uploadResult');
const curlCommand = document.getElementById('curlCommand');
const downloadLink = document.getElementById('downloadLink');
const fileInput = document.getElementById('fileInput');
const endpointInput = document.getElementById('endpoint');
const filterTag = document.getElementById('filterTag');
const emptyState = document.getElementById('emptyState');
const tabs = document.querySelectorAll('[data-tab-target]');
const panels = document.querySelectorAll('.panel');

const STORAGE_KEY = 'zelfgehoste-links';

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

function createLinkCard(link) {
  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <div class="card__header">
      <h3 class="card__title">${link.name}</h3>
    </div>
    <div class="card__meta">
      <span class="tag">${link.tag}</span>
      <a href="${link.url}" target="_blank" rel="noreferrer">Open link ↗</a>
    </div>
    ${link.note ? `<p class="card__note">${link.note}</p>` : ''}
  `;
  return article;
}

function renderLinks(tag = '') {
  const links = loadLinks();
  const filtered = tag ? links.filter((link) => link.tag.toLowerCase() === tag.toLowerCase()) : links;

  linkList.innerHTML = '';
  filtered.forEach((link) => linkList.appendChild(createLinkCard(link)));

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
  const tag = document.getElementById('tag').value.trim();
  const note = document.getElementById('note').value.trim();

  if (!name || !url || !tag) return;

  const links = loadLinks();
  links.push({ name, url, tag, note });
  saveLinks(links);

  linkForm.reset();
  refreshTagFilter();
  renderLinks(filterTag.value);
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
  filterTag.addEventListener('change', (event) => renderLinks(event.target.value));
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy-target]').forEach((button) => {
    button.addEventListener('click', handleCopyClick);
  });
}

function bootstrap() {
  renderLinks();
  refreshTagFilter();
  linkForm.addEventListener('submit', handleLinkSubmit);
  uploadForm.addEventListener('submit', handleUploadSubmit);
  initTabs();
  initFilters();
  initCopyButtons();
}

document.addEventListener('DOMContentLoaded', bootstrap);
