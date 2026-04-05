// ─── casualties.js — counters, bars, strike slider ───

window.addEventListener('load', () => {
  setTimeout(() => {

  setTimeout(() => {
    // ── Animate casualty counters ──
    ['cas1','cas2','cas3','cas4'].forEach((id,i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const target = parseInt(el.dataset.target||'0');
      const suffix = i===3?'+':'';
      // If no data, show a clean unavailable message and hide the bar
      if (target === 0) {
        el.textContent = 'No data';
        el.style.fontSize = 'var(--text-lg)';
        el.style.color = 'var(--white3)';
        const bar = document.getElementById('bar'+(i+1));
        const track = bar?.parentElement;
        if (track) track.style.display = 'none';
      } else {
        animateCounter(id, target, suffix, 1800 + i*200);
      }
    });

    // ── Bars: set widths only for sources with data ──
    setTimeout(() => {
      const vals = ['cas1','cas2','cas3'].map(id => parseInt(document.getElementById(id)?.dataset.target||0));
      const max = Math.max(...vals) || 1;
      ['bar1','bar2','bar3','bar4'].forEach((id,i) => {
        const el = document.getElementById(id);
        const cas = document.getElementById('cas'+(i+1));
        if (!el || !cas) return;
        const target = parseInt(cas.dataset.target||0);
        if (target === 0) return; // bar already hidden above
        el.style.width = Math.round((target/max)*100) + '%';
      });

      // ── Initialise casualties chart after data-targets are confirmed ──
      initCasChart();
      updateTotalCasualties();
    }, 300);

    // ── Hide cas-row items whose value is — ──
    document.querySelectorAll('.cas-row').forEach(row => {
      const val = row.querySelector('.cas-row-val');
      if (val && (val.textContent.trim() === '—' || val.textContent.trim() === '')) {
        row.style.display = 'none';
      }
    });

    // ── Handle sh-items: hide dashes, stamp fallback labels ──
    document.querySelectorAll('.sh-item').forEach(item => {
      const valEl = item.querySelector('.sv');
      const lblEl = item.querySelector('.sh-fallback-label');
      if (!valEl) return;
      const val = valEl.textContent.trim();
      if (val === '—') {
        item.style.display = 'none';
        return;
      }
      // If item has a fallback attribute, check if current value matches it
      const fallback = item.dataset.fallback;
      const fbDate   = item.dataset.fallbackDate;
      if (lblEl && fallback && fbDate) {
        if (val === fallback) {
          // Still showing fallback — stamp the label
          lblEl.textContent = '⚠ Last known · ' + fbDate;
        } else {
          // Live data was injected — clear the label
          lblEl.textContent = '';
        }
      }
    });

    // ── Strike timeline slider ──
    (function() {
      // Cumulative strike estimates by day (based on Wikipedia/CENTCOM data)
      const strikesPerDay = [
        500,600,700,750,800,850,900,950,980,1010,  // D1-10 (D1 is the big 500-strike opening)
        1040,1070,1100,1120,1140,1160,1180,1200,1220,1240, // D11-20
        1260,1280 // D21-22
      ];
      // Running cumulative totals
      const cumulative = [];
      let total = 0;
      strikesPerDay.forEach(d => { total += d; cumulative.push(total); });

      const slider = document.getElementById('strike-day-slider');
      const dayVal = document.getElementById('slider-day-val');
      const estimateEl = document.getElementById('slider-strike-estimate');
      const shNum = document.getElementById('strike-total');
      const WAR_START = new Date('2026-02-28T00:00:00Z');

      // Set max to current war day
      const currentDay = Math.max(1, Math.floor((Date.now() - WAR_START) / 86400000) + 1);
      const cappedDay = Math.min(currentDay, cumulative.length);
      if (slider) {
        slider.max = cappedDay;
        slider.value = cappedDay;
        document.getElementById('slider-day-end').textContent = cappedDay;
      }

      function updateSlider(day) {
        const idx = Math.min(day - 1, cumulative.length - 1);
        const val = cumulative[idx];
        const date = new Date(WAR_START);
        date.setDate(date.getDate() + day - 1);
        const dateStr = date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
        if (dayVal) dayVal.textContent = day;
        if (estimateEl) estimateEl.textContent = `~${val.toLocaleString()}+ strikes by ${dateStr} · ⚠ cumulative estimate`;
        if (shNum) {
          // Only override with slider value if it's at current day (show live data otherwise)
          if (day === cappedDay) {
            shNum.textContent = shNum.dataset.live || shNum.textContent;
          } else {
            shNum.textContent = '~' + val.toLocaleString() + '+';
          }
        }
        // Update slider gradient
        const pct = ((day - 1) / (cappedDay - 1)) * 100;
        slider.style.background = `linear-gradient(90deg,var(--red) ${pct}%,var(--border2) ${pct}%)`;
      }

      if (slider) {
        // Save live value
        if (shNum) shNum.dataset.live = shNum.textContent;
        slider.addEventListener('input', () => updateSlider(parseInt(slider.value)));
        updateSlider(cappedDay);
      }
    })();

  }, 400);
});

document.addEventListener('DOMContentLoaded', () => {

  }, 400);
});
