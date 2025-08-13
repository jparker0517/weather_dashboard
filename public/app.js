
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
  const r = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
  if (!r.ok) throw new Error('forecast failed');
  return await r.json();
}

function updateCards(place, weather, unit) {
  const city = place.name;
  const admin = place.admin1 ? `, ${place.admin1}` : '';
  const country = place.country ? `, ${place.country}` : '';
  els.location.textContent = `${city}${admin}${country}`;

  // derive current temp from hourly closest to now
  const nowIndex = 0;
  const tMax = weather.daily.temperature_2m_max[0];
  const tMin = weather.daily.temperature_2m_min[0];
  els.today.textContent = `High ${fmtTemp(tMax, unit)} • Low ${fmtTemp(tMin, unit)}`;

  // If hourly exists, show latest hour
  if (weather.hourly && weather.hourly.temperature_2m && weather.hourly.temperature_2m.length) {
    const last = weather.hourly.temperature_2m[weather.hourly.temperature_2m.length - 1];
    els.current.textContent = `Now ${fmtTemp(last, unit)}`;
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
  try {
    els.location.textContent = 'Searching…';
    const place = await geocode(name);
    const data = await forecast(place.latitude, place.longitude);
    updateCards(place, data, els.unit.value);
    drawChart(data, els.unit.value);
  } catch (e) {
    console.error(e);
    els.location.textContent = 'City not found.';
    els.current.textContent = '—';
    els.today.textContent = '—';
    if (chart) chart.destroy();
  }
}

async function loadByCoords(lat, lon) {
  try {
    els.location.textContent = 'Loading…';
    const place = { name: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}` };
    const data = await forecast(lat, lon);
    updateCards(place, data, els.unit.value);
    drawChart(data, els.unit.value);
  } catch (e) {
    console.error(e);
    els.location.textContent = 'Location failed.';
    els.current.textContent = '—';
    els.today.textContent = '—';
    if (chart) chart.destroy();
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
  if (!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(
    (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude),
    () => alert('Could not get your location')
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
