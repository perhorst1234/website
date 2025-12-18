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
- Remote koppeling: draai de headless CLI met `serve` op een externe host en verbind via HTTP(S) vanuit de hoofdsite om data te synchroniseren.
- Automatische discovery: laat de headless CLI docker-containers scannen en stuur de resultaten naar de hoofdsite.

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

# containers automatisch vinden (docker ps)
node headless-explorer.js discover --save

# start een lichte HTTP-bridge die de hoofdsite via internet kan aanroepen
node headless-explorer.js serve --port 4070
```

De data wordt lokaal opgeslagen in `headless-standalone.json`. De export bevat een `standalone`-veld dat je direct kunt plakken in de import van de hoofdsite.

## Verbind de hoofdsite via internet

1. Start de headless verkenner met `node headless-explorer.js serve --port 4070` op een host waar je containers draaien.
2. Open de hoofdsite en ga naar **Standalone verkenner** > **Verbind met remote verkenner**.
3. Vul het endpoint in (bijv. `http://ip-van-remote:4070`) en klik **Pull remote** om de standalone-lijst op te halen.
4. Klik **Discovery** om een live docker-scan van de remote host op te halen en te mengen in je lijst.
5. Zet de checkbox aan voor automatische discovery als je elke minuut wilt verversen.

Endpoints die de hoofdsite aanroept:
- `GET /standalone` – stuurt `{ standalone: [...] }` terug.
- `GET /discover` – voert docker-discovery uit en stuurt dezelfde payload terug.
- `POST /standalone` – (optioneel) laat scripts een payload pushen naar de headless opslag.
