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

## Ontwikkeling
Start een eenvoudige server om de pagina lokaal te bekijken:

```bash
python -m http.server 8000
```

Open vervolgens http://localhost:8000 in je browser.
