// ─── utils.js — shared helpers ───

const gridColor = 'rgba(255,255,255,0.05)';
const tickColor = 'rgba(238,242,247,0.35)';

// ─── TOTAL CONFIRMED CASUALTIES (hero card) ───
function updateTotalCasualties() {
  // Iranian: highest source (HRANA = cas3)
  const iranian = parseInt(document.getElementById('cas3')?.dataset.target || 7920);
  // Coalition: sum all known figures
  const parse = id => { const el = document.getElementById(id); if (!el) return 0; const n = parseInt(el.textContent.replace(/[^0-9]/g,'')); return isNaN(n) ? 0 : n; };
  const coalition = parse('cas4-us-mil') + parse('cas4-il-mil') + parse('cas4-il-civ') + parse('cas4-iq-civ') + parse('cas4-bh-mil');
  const total = iranian + coalition;
  const el = document.getElementById('hero-total-casualties');
  if (el) el.textContent = total.toLocaleString() + '+';
}

// ─── TIME & CLOCK ───
function updateTime() {
  const now = new Date();

  // UTC time for header
  const utcTime = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', timeZone:'UTC' });

  // Local time + timezone abbreviation
  const localTime = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  const tzAbbr = Intl.DateTimeFormat('en', { timeZoneName:'short' }).formatToParts(now)
    .find(p => p.type === 'timeZoneName')?.value || '';

  const hel = document.getElementById('htime');
  if (hel) {
    if (tzAbbr && tzAbbr !== 'UTC' && localTime !== utcTime) {
      hel.textContent = utcTime + ' UTC (' + localTime + ' ' + tzAbbr + ')';
    } else {
      hel.textContent = utcTime + ' UTC';
    }
  }

  // Dynamic day pill
  const WAR_START = new Date('2026-02-28T00:00:00Z');
  const dayNum = Math.floor((now - WAR_START) / 86400000) + 1;
  const endDate = now.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' })
    .toUpperCase().replace(',','');
  const pillEl = document.getElementById('day-pill-text');
  if (pillEl) pillEl.textContent = 'DAY ' + dayNum + ' · 28 FEB 2026 – ' + endDate + ' · ' + utcTime + ' UTC';
}
function initCasChart() {
  const el = document.getElementById('casChart');
  if (!el) return;
  const vals = ['cas1','cas2','cas3','cas4'].map(id =>
    parseInt(document.getElementById(id)?.dataset.target || 0)
  );
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['Iran Health Min.', 'Hengaw (NGO)', 'HRANA (NGO)', 'Regional (excl. Iran)'],
      datasets: [{
        data: vals,
        backgroundColor: ['rgba(61,155,233,0.7)','rgba(46,204,113,0.7)','rgba(240,165,0,0.7)','rgba(200,200,200,0.5)'],
        borderColor: ['#3d9be9','#2ecc71','#f0a500','#aaaaaa'],
        borderWidth: 1, borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.raw.toLocaleString() + ' (⚠ approx · unconfirmed)' }}},
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor }},
        y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: v => v>=1000?(v/1000)+'k':v }}
      }
    }
  });
}


document.addEventListener("DOMContentLoaded", () => { updateTime(); setInterval(updateTime, 60000); });

function animateCounter(id, target, suffix, duration) {
  const el = document.getElementById(id);
  if (!el || !target) return;
  const start = performance.now();
  const fmt = n => Math.floor(n).toLocaleString() + (suffix||'');
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(ease * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function formatFX(usd, rate, sym) {
  const val = usd * rate;
  if (val >= 1e12) return sym + (val/1e12).toFixed(2) + 'T';
  if (val >= 1e9)  return sym + (val/1e9).toFixed(2) + 'B';
  return sym + (val/1e6).toFixed(0) + 'M';
}

function initCasChart() {
  const el = document.getElementById('casChart');
  if (!el) return;
  const vals = ['cas1','cas2','cas3','cas4'].map(id =>
    parseInt(document.getElementById(id)?.dataset.target || 0)
  );
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['Iran Health Min.', 'Hengaw (NGO)', 'HRANA (NGO)', 'Regional (excl. Iran)'],
      datasets: [{
        data: vals,
        backgroundColor: ['rgba(61,155,233,0.7)','rgba(46,204,113,0.7)','rgba(240,165,0,0.7)','rgba(200,200,200,0.5)'],
        borderColor: ['#3d9be9','#2ecc71','#f0a500','#aaaaaa'],
        borderWidth: 1, borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.raw.toLocaleString() + ' (⚠ approx · unconfirmed)' }}},
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor }},
        y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: v => v>=1000?(v/1000)+'k':v }}
      }
    }
  });
}


document.addEventListener("DOMContentLoaded", () => { updateTime(); setInterval(updateTime, 60000); });
