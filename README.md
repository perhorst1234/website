# Zelfgehoste hub

Een lichte, statische pagina om al je zelfgehoste websites te bundelen en snel een curl-commando te genereren voor bestanduploads.

## Functionaliteit
- Overzicht van links met omgeving/tag en notities.
- Tabblad om nieuwe links toe te voegen (opslag in `localStorage`).
- Upload-tabblad dat een curl-commando en downloadlink samenstelt op basis van het gekozen endpoint en bestand.

## Ontwikkeling
Start een eenvoudige server om de pagina lokaal te bekijken:

```bash
python -m http.server 8000
```

Open vervolgens http://localhost:8000 in je browser.
