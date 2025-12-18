# Zelfgehoste hub

Een lichte, statische pagina om al je zelfgehoste websites te bundelen en snel een curl-commando te genereren voor bestanduploads.

## Functionaliteit
- Overzicht van links met type (website, SMB-share, Minecraft), omgeving/tag, servergroep en notities.
- Groeperen op server en filteren op tag of type.
- Status-check voor Minecraft-servers (via mcstatus.io) en kopieerknop voor SMB-paden.
- Mindmap-tabblad om relaties tussen servers, shares en diensten vast te leggen (opslag in `localStorage`).
- Upload-tabblad dat een curl-commando en downloadlink samenstelt op basis van het gekozen endpoint en bestand.
- Verkenner-tabblad om services/containers vast te leggen met host, permissies, folders, poorten en direct aan de mindmap te koppelen.
- Standalone-verkenner voor losse containers of stacks, met filters op type/status en zoeken op host of naam.
- Losse `standalone-explorer.html` die je elders kunt draaien en waarvan je een payload kunt kopiëren om in de hoofdsite te importeren.
- Headless CLI (`headless-explorer.js`) die dezelfde payload structuur gebruikt zodat je zonder HTML containers/VM’s kunt beheren en exporteren.

## Ontwikkeling
Start een eenvoudige server om de pagina lokaal te bekijken:

```bash
python -m http.server 8000
```

Open vervolgens http://localhost:8000 in je browser.

## Headless verkenner gebruiken

Gebruik de CLI als je zonder HTML een payload wilt opbouwen voor de standalone-verkenner in de hoofdsite.

```bash
# item toevoegen
node headless-explorer.js add --name db --host 10.0.0.5 --type stack --status running --ports "5432" --note "prod db"

# lijst met filters
node headless-explorer.js list --type stack --status running --search db

# exporteer payload naar een bestand
node headless-explorer.js export > payload.json

# importeer payload (bijv. vanuit remote script)
node headless-explorer.js import < payload.json
```

De data wordt lokaal opgeslagen in `headless-standalone.json`. De export bevat een `standalone`-veld dat je direct kunt plakken in de import van de hoofdsite.
