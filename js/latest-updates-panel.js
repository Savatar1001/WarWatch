// ─── latest-updates-panel.js — change tracker & tag cloud ───

// ─── ANCHOR TAG CLOUD ───
(function() {
  const SNAP_KEY  = 'ww-data-snapshot';
  const SEEN_KEY  = 'ww-seen-changes';   // ids the user has clicked/acknowledged

  // Sections to link to, with a function that reads their current value
  const sections = [
    { id: 'w-hero',       label: 'Key Stats',    emoji: '📊', readVal: () => document.getElementById('day-count')?.textContent },
    { id: 'w-casualties', label: 'Casualties',   emoji: '💀', readVal: () => document.getElementById('cas1')?.textContent + document.getElementById('cas2')?.textContent },
    { id: 'w-charts',     label: 'Charts',       emoji: '📈', readVal: () => null },
    { id: 'w-strikes',    label: 'Strikes',      emoji: '🎯', readVal: () => document.getElementById('strike-total')?.textContent },
    { id: 'w-events',     label: 'Headlines',       emoji: '⚡', readVal: () => document.getElementById('events-feed')?.textContent?.trim().slice(0,80) },
    { id: 'w-cost',       label: 'War Cost',     emoji: '💰', readVal: () => null },
    { id: 'w-oil',        label: 'Oil & Energy', emoji: '🛢', readVal: () => document.getElementById('oil-brent')?.textContent },
    { id: 'w-countries',  label: 'Countries',    emoji: '🌍', readVal: () => null },
    { id: 'w-nuclear',    label: 'Nuclear',      emoji: '☢️', readVal: () => document.querySelector('#w-nuclear .fac-status')?.textContent },
    { id: 'w-map',        label: 'Strike Map',   emoji: '🗺', readVal: () => null },
  ];

  function loadSnapshot() {
    try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '{}'); } catch(e) { return {}; }
  }
  function saveSnapshot(snap) {
    try { localStorage.setItem(SNAP_KEY, JSON.stringify(snap)); } catch(e) {}
  }

  // Colour map matching pb-pill colours
  const sectionColors = {
    'w-hero':       { bg: 'rgba(240,165,0,0.15)',  border: 'rgba(240,165,0,0.35)',  color: 'var(--gold)' },
    'w-casualties': { bg: 'rgba(232,69,60,0.15)',  border: 'rgba(232,69,60,0.35)',  color: '#f07070' },
    'w-charts':     { bg: 'rgba(61,155,233,0.15)', border: 'rgba(61,155,233,0.35)', color: 'var(--blue)' },
    'w-strikes':    { bg: 'rgba(240,165,0,0.15)',  border: 'rgba(240,165,0,0.35)',  color: 'var(--gold)' },
    'w-events':     { bg: 'rgba(232,69,60,0.15)',  border: 'rgba(232,69,60,0.35)',  color: '#f07070' },
    'w-cost':       { bg: 'rgba(232,69,60,0.15)',  border: 'rgba(232,69,60,0.35)',  color: '#f07070' },
    'w-oil':        { bg: 'rgba(240,165,0,0.15)',  border: 'rgba(240,165,0,0.35)',  color: 'var(--gold)' },
    'w-countries':  { bg: 'rgba(61,155,233,0.15)', border: 'rgba(61,155,233,0.35)', color: 'var(--blue)' },
    'w-nuclear':    { bg: 'rgba(232,69,60,0.15)',  border: 'rgba(232,69,60,0.35)',  color: '#f07070' },
    'w-map':        { bg: 'rgba(61,155,233,0.15)', border: 'rgba(61,155,233,0.35)', color: 'var(--blue)' },
  };

  function isCollapsed(id) {
    return document.getElementById(id)?.classList.contains('ww-collapsed') ?? false;
  }

  function handleTagClick(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (isCollapsed(id)) {
      WW.expand(id);
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Mark as seen — persist so next session knows this change was acknowledged
    if (_changedIds.has(id)) {
      _changedIds.delete(id);
      try {
        const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
        seen.add(id + ':' + (_currentSnapVals[id] || ''));
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
      } catch(e) {}
    }
    refreshTagCloud();                  // grey out pill instantly
    setTimeout(refreshTagCloud, 400);   // re-sync after expand animation
  }
  window.handleTagClick = handleTagClick;

  function buildTagCloud(changedIds) {
    const cloud = document.getElementById('tag-cloud');
    if (!cloud) return;
    cloud.innerHTML = sections.map(s => {
      const collapsed = isCollapsed(s.id);
      const isChanged = changedIds.has(s.id);
      const c = sectionColors[s.id] || {};

      // Coloured when changed (unread), grey once clicked (seen) — regardless of panel visibility
      const bg     = isChanged ? c.bg     : 'var(--white5)';
      const border = isChanged ? c.border : 'var(--border)';
      const color  = isChanged ? c.color  : 'var(--white3)';
      const opacity = isChanged ? '' : 'opacity:0.45;';
      const dot    = isChanged  ? `<span class="atag-dot" style="background:${c.color || 'var(--gold)'}"></span>` : '';
      const marker = isChanged  ? ' ⚡' : '';

      return `<button class="atag" data-tag-id="${s.id}"
        style="background:${bg};border-color:${border};color:${color};${opacity}"
        onclick="handleTagClick(event,'${s.id}')">
        ${dot}${s.emoji} ${s.label}${marker}
      </button>`;
    }).join('');
  }

  // Store changedIds so refreshTagCloud can reuse them
  let _changedIds = new Set();

  function refreshTagCloud() {
    buildTagCloud(_changedIds);
  }
  // Expose globally so WW IIFE (separate scope) can call it
  window.refreshTagCloud = refreshTagCloud;

  let _currentSnapVals = {};

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const oldSnap = loadSnapshot();
      const newSnap = {};
      const changedIds = new Set();
      const isFirstVisit = Object.keys(oldSnap).length === 0;

      // Load previously seen change signatures
      let seen = new Set();
      try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch(e) {}

      sections.forEach(s => {
        const val = s.readVal?.();
        if (isFirstVisit) {
          // First visit — light up everything regardless of whether we can read a value
          changedIds.add(s.id);
          if (val !== null && val !== undefined) {
            newSnap[s.id] = val;
            _currentSnapVals[s.id] = val;
          }
        } else if (val !== null && val !== undefined) {
          newSnap[s.id] = val;
          _currentSnapVals[s.id] = val;
          const changeKey = s.id + ':' + val;
          if (oldSnap[s.id] !== undefined && oldSnap[s.id] !== val && !seen.has(changeKey)) {
            changedIds.add(s.id);
          }
        }
      });

      // Only advance snapshot for sections the user has already seen,
      // so unseen changes persist as "changed" across sessions
      const mergedSnap = { ...oldSnap };
      sections.forEach(s => {
        const changeKey = s.id + ':' + (newSnap[s.id] || '');
        if (!changedIds.has(s.id)) {
          // Either unchanged, or seen — safe to advance
          if (newSnap[s.id] !== undefined) mergedSnap[s.id] = newSnap[s.id];
        }
        // If still changed (unseen), keep old snapshot value so next session still detects diff
      });
      saveSnapshot(mergedSnap);

      _changedIds = changedIds;
      buildTagCloud(changedIds);
    }, 1800);
  });
})();
