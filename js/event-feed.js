// ─── event-feed.js — renders event-based feed from events_cache.json ───

(function () {

  const TYPE_LABELS = {
    strike:    'Strike / Attack',
    invasion:  'Ground Invasion Threat',
    nuclear:   'Nuclear / IAEA',
    diplomacy: 'Diplomacy / Talks',
    economic:  'Economic / Energy',
    houthi:    'Houthi Activity',
    casualty:  'Casualties',
    protest:   'Protest',
    update:    'Situation Update',
  };

  const STATUS_COLOURS = {
    New:        '#e74c3c',
    Developing: '#e67e22',
    Stable:     '#27ae60',
  };

  function formatTimestamp(isoStr) {
    const dt = new Date(isoStr);
    const now = new Date();
    const diffMs = now - dt;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const h = Math.floor(diffHours);
      return h <= 0 ? 'Just now' : `${h}h ago`;
    }

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[dt.getMonth()]} ${dt.getDate()}`;
  }

  function renderEvent(ev) {
    const label = TYPE_LABELS[ev.type] || ev.type;
    const colour = STATUS_COLOURS[ev.status] || '#888';
    const time = formatTimestamp(ev.timestamp_first_seen);
    const sourcesText = ev.sources_count === 1 ? '1 source' : `${ev.sources_count} sources`;

    const el = document.createElement('div');
    el.style.cssText = [
      'padding: 10px 14px',
      'border-bottom: 1px solid rgba(255,255,255,0.06)',
      'display: grid',
      'grid-template-columns: 1fr auto',
      'gap: 4px 12px',
      'align-items: start',
    ].join(';');

    el.innerHTML = `
      <div style="font-size:0.92em;font-weight:600;color:#e0e0e0;line-height:1.3">
        ${label} <span style="color:#888;font-weight:400">— ${ev.location}</span>
      </div>
      <div style="font-size:0.78em;color:#888;text-align:right;white-space:nowrap">${time}</div>
      <div style="font-size:0.78em;color:#aaa;display:flex;gap:8px;align-items:center">
        <span style="
          background:${colour}22;
          color:${colour};
          border:1px solid ${colour}55;
          border-radius:3px;
          padding:1px 6px;
          font-size:0.85em;
          font-weight:600;
        ">${ev.status}</span>
        <span>${sourcesText}</span>
      </div>
      <div></div>
    `;

    return el;
  }

  function init() {
    const container = document.getElementById('event-feed-container');
    if (!container) return;

    fetch('events/events_cache.json')
      .then(r => r.json())
      .then(events => {
        // Sort newest first, render first 15
        const sorted = events
          .slice()
          .sort((a, b) => new Date(b.timestamp_first_seen) - new Date(a.timestamp_first_seen))
          .slice(0, 15);

        sorted.forEach(ev => container.appendChild(renderEvent(ev)));
      })
      .catch(err => {
        container.innerHTML = '<div style="padding:12px;color:#888;font-size:0.85em">Event feed unavailable.</div>';
        console.warn('[event-feed] Failed to load events_cache.json:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
