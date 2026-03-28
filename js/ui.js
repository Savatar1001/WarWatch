// ─── ui.js — font size slider, scroll to top ───

// ─── TEXT SIZE SLIDER ───
const fontSlider = document.getElementById('fontSlider');
function applyFontScale(val) {
  // val is 0–100. Map to font size: 0 → 11px (small), 50 → 20px (default/mid), 100 → 26px (large)
  const fz = Math.round(11 + (val / 100) * 15);
  document.documentElement.style.setProperty('--fz', fz + 'px');
  const lbl=document.getElementById('font-size-val'); if(lbl) lbl.textContent=val+'%';
  try{localStorage.setItem('ww-font-scale',val);}catch(e){}
}
// font scale restored via DOMContentLoaded above
if(fontSlider) {
  fontSlider.addEventListener('input', () => applyFontScale(parseInt(fontSlider.value)));
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const saved = localStorage.getItem('ww-font-scale');
      if(saved) { fontSlider.value = saved; applyFontScale(parseInt(saved)); }
      else { fontSlider.value = 50; applyFontScale(50); }
    } catch(e) { fontSlider.value = 50; applyFontScale(50); }
  });
}
// Clear stale saved font scale so new default takes effect



// ─── SCROLL TO TOP BUTTON ───
(function() {
  function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    function checkScroll() {
      const threshold = document.documentElement.scrollHeight * 0.10;
      btn.classList.toggle('visible', window.scrollY > threshold);
    }
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('load', checkScroll);
    // Defer first check so scrollHeight is fully calculated
    setTimeout(checkScroll, 100);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollTop);
  } else {
    initScrollTop();
  }
})();

