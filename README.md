# Weather Dashboard

A live weather dashboard using **Open‑Meteo** (no API key required). Search by city or use your location, and view a 7‑day forecast with an interactive chart.

## Features
- City search with geocoding (top 1 match)
- 7‑day highs/lows chart (Chart.js)
- Current temp approximation from latest hourly
- Celsius/Fahrenheit toggle
- Geolocation button to use your current position
- Node+Express backend proxy to avoid CORS issues

## Run locally
```bash
npm install
npm start
# open http://localhost:3000
```

## Deploy to Render
- Build: `npm install`
- Start: `npm start`
- No environment variables required.

## Tech
- Backend: Node 18+/Express (uses global fetch)
- Frontend: HTML/CSS/JS + Chart.js
- Data: Open‑Meteo Geocoding + Forecast APIs
