
const els = {
  city: document.getElementById('city'),
  searchBtn: document.getElementById('searchBtn'),
  locBtn: document.getElementById('locBtn'),
  unit: document.getElementById('unit'),
  location: document.getElementById('location'),
  current: document.getElementById('current'),
  today: document.getElementById('today'),
  dailyChart: document.getElementById('dailyChart')
};

let loadingStartedAt = 0;
const MIN_LOADING_MS = 600; // adjust to taste (400–800ms feels good)

function setLoading(isLoading, msg = 'Loading forecast…') {
  const el = document.getElementById('loading');
  if (!el) return;

  if (isLoading) {
    loadingStartedAt = performance.now();
    el.textContent = msg;
    el.hidden = false;
  } else {
    const elapsed = performance.now() - loadingStartedAt;
    const wait = Math.max(0, MIN_LOADING_MS - elapsed);
    setTimeout(() => { el.hidden = true; }, wait);
  }

  // Disable/enable controls to prevent spam clicks during load
  els.searchBtn.disabled = isLoading;
  els.locBtn.disabled = isLoading;
  els.unit.disabled = isLoading;
  els.city.disabled = isLoading;
}


function showError(message) {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function clearError() {
  const el = document.getElementById('error');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

let chart;

function toF(c) { return (c * 9/5) + 32; }
function fmtTemp(c, unit) { return unit === 'imperial' ? `${Math.round(toF(c))}°F` : `${Math.round(c)}°C`; }

async function geocode(name) {
  const r = await fetch(`/api/geocode?name=${encodeURIComponent(name)}`);
  if (!r.ok) throw new Error('geocode failed');
  const data = await r.json();
  if (!data || !data.results || data.results.length === 0) throw new Error('no results');
  return data.results[0]; // best match
}

async function forecast(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: 'true',
    hourly: 'temperature_2m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',         // <-- ensures times & current_weather match the location
    timeformat: 'iso8601'
  });
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error('forecast failed');
  return await r.json();
}

function updateCards(place, weather, unit) {
  const city = place.name;
  const admin = place.admin1 ? `, ${place.admin1}` : '';
  const country = place.country ? `, ${place.country}` : '';
  els.location.textContent = `${city}${admin}${country}`;

  // derive current temp from hourly closest to now
  const tMax = weather.daily.temperature_2m_max[0];
  const tMin = weather.daily.temperature_2m_min[0];
  els.today.textContent = `High ${fmtTemp(tMax, unit)} • Low ${fmtTemp(tMin, unit)}`;

  // If hourly exists, show latest hour
  if (weather.current_weather && typeof weather.current_weather.temperature === 'number') {
    const c = unit === 'imperial' ? toF(weather.current_weather.temperature) : weather.current_weather.temperature;
    els.current.textContent = `Now ${Math.round(c)}°${unit === 'imperial' ? 'F' : 'C'}`;
    return;
    } 
    else {
      els.current.textContent = '—';
  }
  if (weather.hourly && Array.isArray(weather.hourly.time) && Array.isArray(weather.hourly.temperature_2m) && weather.hourly.time.length) {
    const times = weather.hourly.time;
    const temps = weather.hourly.temperature_2m;

    const nowMs = Date.now();
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const tMs = new Date(times[i]).getTime();
      const diff = Math.abs(tMs - nowMs);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }

    const tempC = temps[bestIdx];
    els.current.textContent =
      (typeof tempC === 'number')
        ? `Now ${fmtTemp(tempC, unit)}`
        : '—';
  } else {
    els.current.textContent = '—';
  }
}

function drawChart(weather, unit) {
  const labels = weather.daily.time;
  const maxs = weather.daily.temperature_2m_max.map(v => unit === 'imperial' ? toF(v) : v);
  const mins = weather.daily.temperature_2m_min.map(v => unit === 'imperial' ? toF(v) : v);

  if (chart) chart.destroy();
  chart = new Chart(els.dailyChart, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'High', data: maxs },
        { label: 'Low', data: mins }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 150,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { intersect: false, mode: 'index' }
      },
      interaction: { intersect: false, mode: 'index' },
      scales: {
        y: { ticks: { callback: v => `${Math.round(v)}°` }, grace: '5%' },
        x: { ticks: { maxRotation: 0, autoSkip: true } }
      }
    }
  });
}

async function loadByCity(name) {
  clearError();
  setLoading(true, `Loading forecast for “${name}”…`);
  try {
    els.location.textContent = 'Searching…';
    const place = await geocode(name);
    const data = await forecast(place.latitude, place.longitude);
    updateCards(place, data, els.unit.value);
    drawChart(data, els.unit.value);
  } catch (e) {
    console.error(e);
    // Friendly messages
    const msg = /no results/i.test(String(e))
      ? `Couldn’t find “${name}”. Try a different city or include the state/country.`
      : `Couldn’t retrieve weather data. Please try again.`;
    showError(msg);

    els.location.textContent = '—';
    els.current.textContent = '—';
    els.today.textContent = '—';
    if (chart) chart.destroy();
  } finally {
    setLoading(false);
  }
}


async function loadByCoords(lat, lon) {
  clearError();
  setLoading(true, 'Loading forecast for your location…');
  try {
    els.location.textContent = 'Loading…';
    const place = { name: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}` };
    const data = await forecast(lat, lon);
    updateCards(place, data, els.unit.value);
    drawChart(data, els.unit.value);
  } catch (e) {
    console.error(e);
    showError('Could not get weather for your location. Please try again.');
    els.location.textContent = '—';
    els.current.textContent = '—';
    els.today.textContent = '—';
    if (chart) chart.destroy();
  } finally {
    setLoading(false);
  }
}


// Event listeners
els.searchBtn.addEventListener('click', () => {
  const name = els.city.value.trim();
  if (name) loadByCity(name);
});
els.city.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = els.city.value.trim();
    if (name) loadByCity(name);
  }
});
els.locBtn.addEventListener('click', () => {
  clearError();
  if (!navigator.geolocation) {
    showError('Geolocation is not supported in this browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude),
    (err) => {
      const m = err && err.code === err.PERMISSION_DENIED
        ? 'Location permission denied. You can still search by city.'
        : 'Could not get your location. Please try again.';
      showError(m);
    }
  );
});

els.unit.addEventListener('change', () => {
  // re-trigger last search if chart exists
  const name = els.location.textContent;
  if (chart && name && name !== '—' && name !== 'City not found.' && name !== 'Loading…' && name !== 'Searching…') {
    // Quick hack: redraw using stored weather would be ideal, but we refetch based on city field
    if (els.city.value.trim()) {
      loadByCity(els.city.value.trim());
    }
  }
});

// Default: load Austin to show something
loadByCity('Austin');

setLoading(true, 'Testing loading bar…');
setTimeout(() => setLoading(false), 1000);
