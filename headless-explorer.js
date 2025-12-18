#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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
    default:
      printHelp();
  }
}

main();
