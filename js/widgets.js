// ─── widgets.js — widget system, panel bar, drag-to-reorder ───

// ─── WIDGET SYSTEM ───
const WW = (() => {
  const ORDER_KEY     = 'ww-widget-order';
  const COLLAPSED_KEY = 'ww-collapsed-widgets';
  const LAYOUT_VER    = 'ww-layout-ver';
  const CURRENT_VER   = '2'; // auto-set by fetch_data.py on each deploy

  // If layout version has changed, clear saved collapsed + order state
  try {
    if (localStorage.getItem(LAYOUT_VER) !== CURRENT_VER) {
      localStorage.removeItem(COLLAPSED_KEY);
      localStorage.removeItem('ww-widget-order');
      localStorage.setItem(LAYOUT_VER, CURRENT_VER);
    }
  } catch(e) {}

  const registry = [
    { id:'w-hero',       label:'Key stats',      emoji:'📊' },
    { id:'w-casualties', label:'Casualties',     emoji:'💀' },
    { id:'w-charts',     label:'Charts',         emoji:'📈' },
    { id:'w-strikes',    label:'Strikes',        emoji:'🎯' },
    { id:'w-events',     label:'Headlines',         emoji:'⚡' },
    { id:'w-cost',       label:'War cost',       emoji:'💰' },
    { id:'w-oil',        label:'Oil & energy',   emoji:'🛢' },
    { id:'w-countries',  label:'Countries',      emoji:'🌍' },
    { id:'w-nuclear',    label:'Nuclear',        emoji:'☢️' },
    { id:'w-map',        label:'Strike map',     emoji:'🗺' },
  ];
  const byId = Object.fromEntries(registry.map(w=>[w.id,w]));

  function loadOrder() {
    try { const s=JSON.parse(localStorage.getItem(ORDER_KEY)||'null'); if(Array.isArray(s)) return s; } catch(e){}
    return ['w-cost','w-hero','w-events','w-strikes','w-countries','w-oil','w-casualties','w-nuclear','w-map','w-charts'];
  }
  function saveOrder(o) { try{localStorage.setItem(ORDER_KEY,JSON.stringify(o));}catch(e){} }
  function loadCollapsed() { try{return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY)||'[]'));}catch(e){return new Set();} }
  function saveCollapsed(s) { try{localStorage.setItem(COLLAPSED_KEY,JSON.stringify([...s]));}catch(e){} }

  let collapsed = loadCollapsed();

  function getMain()    { return document.querySelector('main'); }
  function getPillBar() { return document.getElementById('panel-bar-pills'); }

  function applyOrder(order) {
    const container = document.getElementById('widgets-container');
    if (!container) return;
    order.forEach(id => { const el=document.getElementById(id); if(el) container.appendChild(el); });
  }
  function getCurrentOrder() { return [...document.querySelectorAll('.widget')].map(el=>el.id).filter(Boolean); }
  function getListOrder()    { return [...document.querySelectorAll('.pb-pill')].map(p=>p.dataset.id).filter(Boolean); }

  // ── Pill bar ──
  function renderPillBar() {
    const bar = getPillBar(); if(!bar) return;
    bar.innerHTML = getCurrentOrder().map(id => {
      const w=byId[id]; if(!w) return '';
      const isCollapsed=collapsed.has(id);
      return `<button class="pb-pill${isCollapsed?' pb-collapsed':''}" data-id="${id}" draggable="true"
        title="${isCollapsed?'Click to expand':'Click to collapse'} ${w.label}"
        onclick="if(!this._wasDragged) WW.toggle('${id}')">
        <span class="pb-emoji">${w.emoji}</span>${w.label}
      </button>`;
    }).join('');
    attachPillDrag(bar);
  }

  function updatePill(id) {
    const pill=getPillBar()?.querySelector(`[data-id="${id}"]`); if(!pill) return;
    const isCollapsed=collapsed.has(id);
    pill.classList.toggle('pb-collapsed',isCollapsed);
    pill.title=(isCollapsed?'Click to expand ':'Click to collapse ')+(byId[id]?.label||'');
  }

  function toggle(id) { collapsed.has(id)?expand(id):collapse(id); }

  function collapse(id) {
    const el=document.getElementById(id); if(!el) return;
    el.classList.add('ww-collapsed');
    collapsed.add(id); saveCollapsed(collapsed); updatePill(id);
    if (window.refreshTagCloud) window.refreshTagCloud();
    checkEmptyState();
  }

  function expand(id) {
    const el=document.getElementById(id); if(!el) return;
    el.classList.remove('ww-collapsed');
    collapsed.delete(id); saveCollapsed(collapsed); updatePill(id);
    if (window.refreshTagCloud) window.refreshTagCloud();
    checkEmptyState();
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }

  // ── Pill drag to reorder ──
  function attachPillDrag(bar) {
    let dragSrc=null;
    bar.querySelectorAll('.pb-pill').forEach(pill => {
      pill.addEventListener('dragstart', e => {
        dragSrc=pill; pill.classList.add('dragging');
        e.dataTransfer.effectAllowed='move';
        e.dataTransfer.setData('text/plain',pill.dataset.id);
      });
      pill.addEventListener('dragend', () => {
        pill.classList.remove('dragging');
        bar.querySelectorAll('.drag-over').forEach(p=>p.classList.remove('drag-over'));
        const newOrder=getListOrder(); applyOrder(newOrder); saveOrder(newOrder);
        pill._wasDragged = true;
        setTimeout(() => { pill._wasDragged = false; }, 300);
        dragSrc=null;
      });
      pill.addEventListener('dragover', e => {
        e.preventDefault(); if(!dragSrc||dragSrc===pill) return;
        bar.querySelectorAll('.drag-over').forEach(p=>p.classList.remove('drag-over'));
        pill.classList.add('drag-over');
        const pills=[...bar.querySelectorAll('.pb-pill')];
        if(pills.indexOf(dragSrc)<pills.indexOf(pill)) pill.after(dragSrc); else pill.before(dragSrc);
      });
      pill.addEventListener('dragleave',()=>pill.classList.remove('drag-over'));
      pill.addEventListener('drop',e=>{e.preventDefault();pill.classList.remove('drag-over');});

      // Touch
      let touchClone=null, touchStartX=0;
      pill.addEventListener('touchstart', e=>{
        dragSrc=pill; touchStartX=e.touches[0].clientX;
        const rect=pill.getBoundingClientRect();
        touchClone=pill.cloneNode(true);
        touchClone.style.cssText=`position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:0.8;pointer-events:none;z-index:9999;transition:none;`;
        document.body.appendChild(touchClone); pill.classList.add('dragging');
      },{passive:true});
      pill.addEventListener('touchmove', e=>{
        if(!touchClone) return; e.preventDefault();
        const t=e.touches[0], dx=t.clientX-touchStartX;
        touchClone.style.left=(dragSrc.getBoundingClientRect().left+dx)+'px';
        touchClone.style.display='none';
        const elUnder=document.elementFromPoint(t.clientX,t.clientY);
        touchClone.style.display='';
        const target=elUnder?.closest('.pb-pill');
        if(target&&target!==dragSrc){
          bar.querySelectorAll('.drag-over').forEach(p=>p.classList.remove('drag-over'));
          target.classList.add('drag-over');
          const pills=[...bar.querySelectorAll('.pb-pill')];
          if(pills.indexOf(dragSrc)<pills.indexOf(target)) target.after(dragSrc); else target.before(dragSrc);
        }
      },{passive:false});
      pill.addEventListener('touchend',()=>{
        if(touchClone){touchClone.remove();touchClone=null;}
        if(dragSrc){dragSrc.classList.remove('dragging');}
        bar.querySelectorAll('.drag-over').forEach(p=>p.classList.remove('drag-over'));
        const newOrder=getListOrder(); applyOrder(newOrder); saveOrder(newOrder); dragSrc=null;
      });
    });
  }

  // ── Legal section toggle ──
  function toggleLegal(id) {
    const el=document.getElementById(id); if(!el) return;
    const isOpen=el.classList.contains('open');
    document.querySelectorAll('.legal-section').forEach(s=>s.classList.remove('open'));
    if(!isOpen){ el.classList.add('open'); el.scrollIntoView({behavior:'smooth',block:'nearest'}); }
  }

  // ── Init ──
  function checkEmptyState() {
    const msg = document.getElementById('no-panels-msg');
    if (!msg) return;
    const anyVisible = [...document.querySelectorAll('.widget')]
      .some(el => !el.classList.contains('ww-collapsed'));
    msg.classList.toggle('no-panels-hidden', anyVisible);
  }

  function init() {
    applyOrder(loadOrder());
    collapsed.forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.classList.add('ww-collapsed');
    });
    renderPillBar();
    checkEmptyState();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { toggle, collapse, expand, toggleLegal };
})();
