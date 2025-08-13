# 🌦️ Weather Dashboard (Open-Meteo, no API key)

Live weather dashboard with search, “use my location,” °C/°F toggle, and a 7-day highs/lows chart.
Built with **Node.js + Express** (proxy) and **Chart.js** on the frontend.

![Node CI](https://github.com/jparker0517/weather_dashboard/actions/workflows/node-ci.yml/badge.svg?branch=main)

**Live demo:** _add your Render link here after deploy_

---

## ✨ Features
- City search with geocoding (top match)
- “Use My Location” (Geolocation API)
- 7-day forecast chart (high/low)
- Current temperature snapshot
- °C / °F unit toggle
- No API key required (Open-Meteo)

---

## 🧱 Tech Stack
- **Backend:** Node.js 18+, Express (uses built-in `fetch`)
- **Frontend:** HTML, CSS, Vanilla JS, Chart.js
- **Data:** Open-Meteo Geocoding + Forecast APIs
- **Deploy:** Render (Build: `npm install`, Start: `npm start`)
- **CI:** GitHub Actions (Node 20)

---

## ▶️ Run locally
```bash
npm install
npm start
# open http://localhost:3000
```

---

## 📡 API (via backend proxy)
- `GET /api/geocode?name={city}` → Open-Meteo geocoding results
- `GET /api/forecast?lat={lat}&lon={lon}` → 7-day temps + hourly snapshot

---

## 🗂 Project Structure
```
weather_dashboard/
├─ public/
│  ├─ index.html     # UI (search, unit toggle, chart)
│  └─ app.js         # fetch + render + Chart.js
├─ server.js         # Express proxy + static hosting
├─ package.json
└─ README.md
```

---

## 🚀 Deploy to Render
Create a Web Service from this repo:
- Build Command: `npm install`
- Start Command: `npm start`
- No env vars needed.

After it’s live, paste your URL at the top of this README.

---

## 📝 Roadmap (nice next steps)
- Favorites (save last 5 cities)
- Wind/precipitation chart tabs
- Dark mode
- Persist last city in localStorage

---

## 📄 License
MIT
