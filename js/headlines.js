// ─── headlines.js — source filter, article panel, AI summary ───

window.HF = (() => {
  let activeSources = new Set(); // empty = all

  const MONTHS = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

  function parseItemDate(item) {
    // Prefer data-date attribute (ISO: 2026-03-22), fall back to text content
    const iso = item.dataset.date;
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return new Date(iso + 'T00:00:00');
    }
    const timeEl = item.querySelector('.event-time');
    if (!timeEl) return null;
    const text = timeEl.textContent.trim();
    // Try ISO format directly from text
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return new Date(text + 'T00:00:00');
    }
    return null;
  }

  function applyFilters() {
    const fromVal = document.getElementById('hf-date-from')?.value;
    const toVal   = document.getElementById('hf-date-to')?.value;
    const fromDate = fromVal ? new Date(fromVal + 'T00:00:00') : null;
    const toDate   = toVal   ? new Date(toVal   + 'T23:59:59') : null;

    const items = [...document.querySelectorAll('#events-feed .event-item')];
    const maxRows = parseInt(document.getElementById('hf-rows')?.value || '10');
    let shown = 0, total = 0;

    items.forEach(item => {
      const sourceMatch = activeSources.size === 0 || activeSources.has(item.dataset.source);
      const itemDate = parseItemDate(item);
      const afterFrom = !fromDate || !itemDate || itemDate >= fromDate;
      const beforeTo  = !toDate  || !itemDate || itemDate <= toDate;
      const matches = sourceMatch && afterFrom && beforeTo;
      if (matches) total++;
      const show = matches && shown < maxRows;
      item.style.setProperty('display', show ? 'grid' : 'none', 'important');
      if (show) shown++;
    });

    const totalEl = document.getElementById('hf-total');
    if (totalEl) totalEl.textContent = total;

    const allItems = [...document.querySelectorAll('#events-feed .event-item')];
    const sourceLabel = document.getElementById('hf-source-label');
    const grandEl = document.getElementById('hf-grand-total');
    if (sourceLabel) sourceLabel.textContent = activeSources.size === 0 ? 'articles · ' + allItems.length + ' available' : 'articles · ' + total + ' available from sources selected above';
    if (grandEl) grandEl.textContent = activeSources.size === 0 ? '' : '(' + allItems.length + ' from all sources)';
  }

  function updatePillCounts() {
    const items = [...document.querySelectorAll('#events-feed .event-item')];
    const counts = {};
    items.forEach(item => {
      const src = item.dataset.source;
      counts[src] = (counts[src] || 0) + 1;
    });
    const total = items.length;

    // Update All count
    const allCount = document.getElementById('hfc-all');
    if (allCount) allCount.textContent = total ? `(${total})` : '';

    // Update each source pill count, hide pills with 0
    document.querySelectorAll('.hf-btn[data-source]').forEach(btn => {
      const src = btn.dataset.source;
      if (src === 'all') return;
      const count = counts[src] || 0;
      const span = btn.querySelector('.hf-count');
      if (span) span.textContent = count ? `(${count})` : '';
      btn.style.display = count ? '' : 'none';
    });
  }


  function filter(source, e) {
    if (e) e.stopPropagation();
    if (source === 'all') {
      activeSources.clear();
    } else {
      if (activeSources.has(source)) {
        activeSources.delete(source);
      } else {
        activeSources.add(source);
      }
    }
    // Update pill active states and reorder — selected float to top
    const bar = document.getElementById('hf-bar');
    document.querySelectorAll('.hf-btn').forEach(btn => {
      if (btn.dataset.source === 'all') {
        btn.classList.toggle('hf-active', activeSources.size === 0);
      } else {
        btn.classList.toggle('hf-active', activeSources.has(btn.dataset.source));
      }
    });
    // Selected pills collect after All in order clicked, separator then unselected
    const pillBar = document.getElementById('hf-bar');
    if (pillBar) {
      // Remove existing separator
      pillBar.querySelector('.hf-pill-sep')?.remove();

      if (activeSources.size > 0) {
        const allBtn = pillBar.querySelector('[data-source="all"]');
        const activePills   = [...pillBar.querySelectorAll('.hf-btn.hf-active:not([data-source="all"])')];
        const inactivePills = [...pillBar.querySelectorAll('.hf-btn:not(.hf-active):not([data-source="all"])')];

        // Active pills sit right after All (preserve their existing order)
        activePills.forEach(btn => allBtn.after(btn));
        // Wait — we want newly selected at BACK, so just append them in existing order
        // Re-append all active to maintain click order (they're already after All)

        // Add full-width horizontal separator
        const sep = document.createElement('div');
        sep.className = 'hf-pill-sep';
        pillBar.appendChild(sep);

        // Inactive pills after separator
        inactivePills.forEach(btn => pillBar.appendChild(btn));
      }
    }
    applyFilters();
  }

  function initHF() {
    const today = new Date().toISOString().slice(0, 10);
    const toInput = document.getElementById('hf-date-to');
    if (toInput) { toInput.value = today; toInput.max = today; }

    const fromInput = document.getElementById('hf-date-from');
    if (fromInput) { fromInput.value = '2026-02-28'; fromInput.max = today; }

    // Wire source buttons
    document.querySelectorAll('.hf-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        filter(btn.dataset.source, e);
      });
    });

    // Wire date inputs
    document.getElementById('hf-date-from')?.addEventListener('change', applyFilters);
    document.getElementById('hf-date-to')?.addEventListener('change', applyFilters);
    document.getElementById('hf-rows')?.addEventListener('change', applyFilters);

    // ── ARTICLE PANEL ──
    const overlay   = document.getElementById('ap-overlay');
    const apType    = document.getElementById('ap-type');
    const apSource  = document.getElementById('ap-source');
    const apDate    = document.getElementById('ap-date');
    const apHl      = document.getElementById('ap-headline');
    const apText    = document.getElementById('ap-summary-text');
    const apSpinner = document.getElementById('ap-spinner');
    const apBtn     = document.getElementById('ap-read-btn');

    function typeClass(tag) {
      if (!tag) return '';
      const t = tag.toLowerCase();
      if (t.includes('strike') || t.includes('air')) return 'et-strike';
      if (t.includes('energy') || t.includes('oil')) return 'et-energy';
      if (t.includes('intercept')) return 'et-intercept';
      return 'et-diplo';
    }

    async function fetchSummary(headline) {
      apSpinner.style.display = 'flex';
      apText.textContent = '';
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: 'You are a concise war correspondent summarising headlines about the 2026 Iran war. Given a headline, write exactly 2-3 sentences of neutral, factual context. Do not editorialize. Do not repeat the headline verbatim. Output plain text only.',
            messages: [{ role: 'user', content: `Headline: "${headline}"\n\nWrite a 2-3 sentence factual summary providing context for this event.` }]
          })
        });
        const data = await res.json();
        apText.textContent = data.content?.[0]?.text || 'Summary unavailable.';
      } catch {
        apText.textContent = 'Summary could not be loaded.';
      } finally {
        apSpinner.style.display = 'none';
      }
    }

    function openPanel(row) {
      const link    = row.querySelector('.event-link');
      const tagEl   = row.querySelector('.event-tag');
      const srcEl   = row.querySelector('.event-src');
      const dateEl  = row.querySelector('.event-time');
      const headline = link?.title || link?.textContent?.trim() || '';
      const href     = link?.href || '#';

      apHl.textContent     = headline;
      apSource.textContent = srcEl?.textContent || '';
      apDate.textContent   = dateEl?.textContent || '';
      apBtn.href           = href;
      apType.textContent   = tagEl?.firstChild?.textContent?.trim() || '';
      apType.className     = 'ap-type ' + typeClass(apType.textContent);

      // Position overlay starting from the top of the clicked row
      const widget   = document.getElementById('w-events');
      const rowTop   = row.offsetTop;
      overlay.style.top = rowTop + 'px';

      overlay.classList.add('visible');
      fetchSummary(headline);
    }

    document.querySelectorAll('.event-item').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.ap-close')) return;
        e.preventDefault();
        openPanel(row);
      });
    });

    document.getElementById('ap-close')?.addEventListener('click', () => {
      overlay.classList.remove('visible');
    });

    updatePillCounts();
    filter('all');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHF);
  } else {
    setTimeout(initHF, 0);
  }

  return { filter };
})();
