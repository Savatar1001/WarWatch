// ─── warcost.js — war cost clock & currency converter ───

// ─── WAR COST CLOCK ───
// ─── WAR COST CLOCK ───
(function() {
  const WAR_START = new Date('2026-02-28T00:00:00Z');
  const FIRST_6_DAYS_COST = 11.3e9;   // $11.3 billion first 6 days
  const PER_SECOND = 1157;             // ~$1,157/sec ongoing

  // Approximate FX rates vs USD
  const FX = { eur: 0.92, gbp: 0.79, cny: 7.23, jpy: 149.5, zar: 18.6 };
  const FX_SYM = { eur: '€', gbp: '£', cny: '¥', jpy: '¥', zar: 'R' };

  function numberToWords(n) {
    const billions = Math.floor(n / 1e9);
    const millions = Math.floor((n % 1e9) / 1e6);
    const thousands = Math.floor((n % 1e6) / 1e3);

    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
                  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
                  'Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    function twoDigit(n) {
      if (n < 20) return ones[n];
      return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    }
    function threeDigit(n) {
      if (n >= 100) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + twoDigit(n%100) : '');
      return twoDigit(n);
    }

    const parts = [];
    if (billions)  parts.push(threeDigit(billions) + ' Billion');
    if (millions)  parts.push(threeDigit(millions) + ' Million');
    if (thousands) parts.push(threeDigit(thousands) + ' Thousand');
    return (parts.join(', ') || 'Zero') + ' Dollars';
  }

  function formatFX(usd, rate, sym) {
    const val = usd * rate;
    if (val >= 1e12) return sym + (val/1e12).toFixed(2) + 'T';
    if (val >= 1e9)  return sym + (val/1e9).toFixed(2) + 'B';
    return sym + (val/1e6).toFixed(0) + 'M';
  }

  function updateCost() {
    const elapsed = (Date.now() - WAR_START) / 1000; // seconds since start
    const firstPhase = Math.min(elapsed, 6 * 86400) / 86400 * (FIRST_6_DAYS_COST / 6);
    const ongoingPhase = Math.max(0, elapsed - 6 * 86400) * PER_SECOND;
    const total = firstPhase + ongoingPhase;

    const display = document.getElementById('cost-display');
    const words   = document.getElementById('cost-words');
    const perSec  = document.getElementById('cost-per-sec');
    const perMin  = document.getElementById('cost-per-min');

    if (display) display.textContent = '~$' + Math.floor(total).toLocaleString();
    if (words)   words.textContent   = numberToWords(Math.floor(total));
    if (perSec)  perSec.textContent  = '$' + PER_SECOND.toLocaleString();
    if (perMin)  perMin.textContent  = '$' + (PER_SECOND * 60).toLocaleString();

    // USD — truncated to match others
    const usdEl = document.getElementById('cost-usd');
    if (usdEl) usdEl.textContent = formatFX(total, 1, '$');

    // Currency conversions
    Object.entries(FX).forEach(([code, rate]) => {
      const el = document.getElementById('cost-' + code);
      if (el) el.textContent = formatFX(total, rate, FX_SYM[code]);
    });
  }

  updateCost();
  setInterval(updateCost, 1000);
})();

// ─── CUSTOM CURRENCY LOOKUP ───
(function() {
  // Comprehensive FX rates vs USD (approximate, static — update periodically)
  const ALL_FX = {
    USD:{r:1,s:'$',f:'🇺🇸',n:'US Dollar'},
    EUR:{r:0.92,s:'€',f:'🇪🇺',n:'Euro'},
    GBP:{r:0.79,s:'£',f:'🇬🇧',n:'British Pound'},
    CNY:{r:7.23,s:'¥',f:'🇨🇳',n:'Chinese Yuan'},
    JPY:{r:149.5,s:'¥',f:'🇯🇵',n:'Japanese Yen'},
    ZAR:{r:18.6,s:'R',f:'🇿🇦',n:'South African Rand'},
    AUD:{r:1.54,s:'A$',f:'🇦🇺',n:'Australian Dollar'},
    CAD:{r:1.36,s:'C$',f:'🇨🇦',n:'Canadian Dollar'},
    CHF:{r:0.90,s:'Fr',f:'🇨🇭',n:'Swiss Franc'},
    INR:{r:83.1,s:'₹',f:'🇮🇳',n:'Indian Rupee'},
    BRL:{r:4.97,s:'R$',f:'🇧🇷',n:'Brazilian Real'},
    MXN:{r:17.1,s:'$',f:'🇲🇽',n:'Mexican Peso'},
    RUB:{r:91.2,s:'₽',f:'🇷🇺',n:'Russian Ruble'},
    KRW:{r:1330,s:'₩',f:'🇰🇷',n:'Korean Won'},
    SGD:{r:1.34,s:'S$',f:'🇸🇬',n:'Singapore Dollar'},
    HKD:{r:7.82,s:'HK$',f:'🇭🇰',n:'Hong Kong Dollar'},
    NOK:{r:10.5,s:'kr',f:'🇳🇴',n:'Norwegian Krone'},
    SEK:{r:10.4,s:'kr',f:'🇸🇪',n:'Swedish Krona'},
    TRY:{r:32.1,s:'₺',f:'🇹🇷',n:'Turkish Lira'},
    SAR:{r:3.75,s:'﷼',f:'🇸🇦',n:'Saudi Riyal'},
    AED:{r:3.67,s:'د.إ',f:'🇦🇪',n:'UAE Dirham'},
    ILS:{r:3.72,s:'₪',f:'🇮🇱',n:'Israeli Shekel'},
    IRR:{r:42000,s:'﷼',f:'🇮🇷',n:'Iranian Rial'},
    IQD:{r:1310,s:'ع.د',f:'🇮🇶',n:'Iraqi Dinar'},
    QAR:{r:3.64,s:'ر.ق',f:'🇶🇦',n:'Qatari Riyal'},
    KWD:{r:0.31,s:'د.ك',f:'🇰🇼',n:'Kuwaiti Dinar'},
    BHD:{r:0.38,s:'.د.ب',f:'🇧🇭',n:'Bahraini Dinar'},
  };

  function formatFX(usd, rate, sym) {
    const val = usd * rate;
    if (val >= 1e12) return sym + (val/1e12).toFixed(2) + 'T';
    if (val >= 1e9)  return sym + (val/1e9).toFixed(2) + 'B';
    return sym + (val/1e6).toFixed(0) + 'M';
  }

  function getCurrentUSD() {
    const WAR_START = new Date('2026-02-28T00:00:00Z');
    const PER_SECOND = 1157;
    const FIRST_6_DAYS_COST = 11.3e9;
    const elapsed = (Date.now() - WAR_START) / 1000;
    const firstPhase = Math.min(elapsed, 6 * 86400) / 86400 * (FIRST_6_DAYS_COST / 6);
    const ongoingPhase = Math.max(0, elapsed - 6 * 86400) * PER_SECOND;
    return firstPhase + ongoingPhase;
  }

  // Populate datalist
  const dl = document.getElementById('cost-curr-list');
  if (dl) {
    Object.entries(ALL_FX).forEach(([code, d]) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.label = d.n;
      dl.appendChild(opt);
    });
  }

  const input = document.getElementById('cost-curr-input');
  const row   = document.getElementById('cost-custom-row');
  const flag  = document.getElementById('cost-custom-flag');
  const label = document.getElementById('cost-custom-label');
  const val   = document.getElementById('cost-custom-val');

  let customCode = null;
  let customInterval = null;

  function updateCustom() {
    if (!customCode || !ALL_FX[customCode]) return;
    const d = ALL_FX[customCode];
    const usd = getCurrentUSD();
    if (flag)  flag.textContent  = d.f;
    if (label) label.textContent = customCode;
    if (val)   val.textContent   = formatFX(usd, d.r, d.s);
    if (row)   row.style.display = 'flex';
  }

  if (input) {
    input.addEventListener('input', () => {
      const code = input.value.trim().toUpperCase();
      if (ALL_FX[code]) {
        customCode = code;
        if (customInterval) clearInterval(customInterval);
        updateCustom();
        customInterval = setInterval(updateCustom, 1000);
        input.style.borderColor = 'rgba(240,165,0,0.5)';
      } else {
        customCode = null;
        if (row) row.style.display = 'none';
        input.style.borderColor = '';
      }
    });
  }
})();

// ─── LIVE FX REFRESH (every 10 minutes) ───
// Hits open.er-api.com client-side to keep rates current between deploys
(function() {
  const FX_DISPLAY = { eur: '€', gbp: '£', cny: '¥', jpy: '¥', zar: 'R' };
  const FX_CODES   = ['eur', 'gbp', 'cny', 'jpy', 'zar'];

  function refreshFX() {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.result !== 'success') return;
        const rates = data.rates;
        // Update the FX object used by warcost clock
        FX_CODES.forEach(code => {
          const key = code.toUpperCase();
          if (rates[key]) window._liveFX = window._liveFX || {};
          if (rates[key]) window._liveFX[code] = rates[key];
        });
        console.log('[WarIntel] FX rates refreshed from open.er-api.com');
      })
      .catch(() => {}); // silent fail — stale rates still show
  }

  // Patch warcost.js FX object on refresh
  const origFX = window._liveFX;
  refreshFX();
  setInterval(refreshFX, 10 * 60 * 1000); // every 10 minutes
})();
