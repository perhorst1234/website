#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { execSync } = require('child_process');

const STORAGE_PATH = path.join(__dirname, 'headless-standalone.json');

function loadEntries() {
  try {
    const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function saveEntries(entries) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(entries, null, 2));
}

function normalizeEntry(input) {
  return {
    name: input.name || '',
    host: input.host || '',
    type: input.type || 'anders',
    status: input.status || 'unknown',
    users: input.users || '',
    folders: input.folders || '',
    ports: input.ports || '',
    note: input.note || '',
  };
}

function merge(entries, incoming) {
  const combined = [...entries];
  incoming.forEach((entry) => {
    if (!entry?.name) return;
    const match = combined.find(
      (item) =>
        item.name === entry.name &&
        (item.host || '') === (entry.host || '') &&
        (item.type || 'anders') === (entry.type || 'anders')
    );
    if (!match) {
      combined.push(normalizeEntry(entry));
    }
  });
  return combined;
}

function parseArgs(argv) {
  const args = {};
  let currentKey = null;
  argv.forEach((token) => {
    if (token.startsWith('--')) {
      currentKey = token.slice(2);
      args[currentKey] = true;
    } else if (currentKey) {
      args[currentKey] = token;
      currentKey = null;
    }
  });
  return args;
}

function printHelp() {
  console.log(`Headless verkenner (standalone)
Gebruik:
  node headless-explorer.js list [--type web|smb|minecraft|vm|stack|anders] [--status running|stopped|unknown] [--search text]
  node headless-explorer.js add --name NAME --host HOST [--type TYPE] [--status STATUS] [--users USERS] [--folders PATHS] [--ports PORTS] [--note NOTE]
  node headless-explorer.js export > payload.json
  node headless-explorer.js import <payload.json
  node headless-explorer.js discover [--save]
  node headless-explorer.js serve [--port 4070]
`);
}

function listCommand(args) {
  const entries = loadEntries();
  const { type, status, search } = args;
  const filtered = entries.filter((entry) => {
    const typeMatch = type ? entry.type === type : true;
    const statusMatch = status ? entry.status === status : true;
    const searchMatch = search
      ? Object.values(entry).some((value) => String(value).toLowerCase().includes(String(search).toLowerCase()))
      : true;
    return typeMatch && statusMatch && searchMatch;
  });
  if (!filtered.length) {
    console.log('Geen items gevonden.');
    return;
  }
  console.table(filtered);
}

function addCommand(args) {
  if (!args.name) {
    console.error('Naam is verplicht (--name).');
    process.exit(1);
  }
  const entries = loadEntries();
  const next = merge(entries, [args]);
  saveEntries(next);
  console.log(`Toegevoegd of behouden: ${args.name}`);
}

function exportCommand() {
  const entries = loadEntries();
  const payload = { standalone: entries };
  process.stdout.write(JSON.stringify(payload, null, 2));
}

function importCommand() {
  const input = fs.readFileSync(0, 'utf8');
  let payload;
  try {
    payload = JSON.parse(input);
  } catch (error) {
    console.error('Kon JSON niet lezen van stdin.');
    process.exit(1);
  }
  if (!Array.isArray(payload?.standalone)) {
    console.error('Payload mist veld `standalone`.');
    process.exit(1);
  }
  const existing = loadEntries();
  const next = merge(existing, payload.standalone);
  saveEntries(next);
  console.log(`Geïmporteerd: ${next.length - existing.length} nieuw(e) item(s). Totaal ${next.length}.`);
}

function discoverDocker() {
  try {
    const raw = execSync("docker ps --format '{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}'", {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, statusRaw, ports, image] = line.split('|');
        const status = statusRaw?.toLowerCase().includes('up') ? 'running' : 'stopped';
        return normalizeEntry({
          name,
          host: os.hostname(),
          type: 'docker',
          status,
          users: '',
          folders: '',
          ports: ports || '',
          note: image ? `Image: ${image}` : '',
        });
      });
  } catch (error) {
    return [];
  }
}

function discoverCommand(args) {
  const discovered = discoverDocker();
  if (!discovered.length) {
    console.log('Geen containers gevonden of docker niet beschikbaar.');
    return;
  }
  console.table(discovered);
  if (args.save) {
    const merged = merge(loadEntries(), discovered);
    saveEntries(merged);
    console.log(`Opgeslagen ${discovered.length} gevonden item(s). Totaal ${merged.length}.`);
  }
}

function startServer(args) {
  const port = Number(args.port || 4070);
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/standalone') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ standalone: loadEntries() }));
      return;
    }

    if (req.method === 'GET' && req.url === '/discover') {
      const discovered = discoverDocker();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ standalone: discovered, host: os.hostname(), scannedAt: new Date().toISOString() }));
      return;
    }

    if (req.method === 'POST' && req.url === '/standalone') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (!Array.isArray(payload?.standalone)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Payload mist standalone-array' }));
            return;
          }
          const next = merge(loadEntries(), payload.standalone);
          saveEntries(next);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ stored: next.length }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Kon payload niet lezen' }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Niet gevonden' }));
  });

  server.listen(port, () => {
    console.log(`Remote verkenner API draait op http://0.0.0.0:${port}`);
    console.log('Endpoints: GET /standalone, POST /standalone, GET /discover');
  });
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case 'list':
      listCommand(args);
      break;
    case 'add':
      addCommand(args);
      break;
    case 'export':
      exportCommand();
      break;
    case 'import':
      importCommand();
      break;
    case 'discover':
      discoverCommand(args);
      break;
    case 'serve':
      startServer(args);
      break;
    default:
      printHelp();
  }
}

main();
