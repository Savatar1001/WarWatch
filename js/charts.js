// ─── charts.js — all Chart.js initialisations ───

document.addEventListener('DOMContentLoaded', () => {
// ─── CHART SETUP ───
const vw = window.innerWidth;
const baseFontSize = Math.max(10, Math.min(14, vw * 0.009));
Chart.defaults.color = 'rgba(238,242,247,0.7)';
Chart.defaults.font = { family: "'DM Mono', monospace", size: baseFontSize };
if (vw >= 1800) {
  document.querySelectorAll('.chart-wrap').forEach(el => {
    el.style.height = Math.min(Math.round(vw * 0.13), 380) + 'px';
  });
}

new Chart(document.getElementById('strikeChart'), {
  type: 'line',
  data: {
    labels: ['D1','D3','D5','D7','D9','D11','D13','D15','D17','D19','D21','Now'],
    datasets: [{
      label: 'Cumulative targets struck (⚠ approx)',
      data: [500,1100,1800,2600,3500,4400,5100,5800,6400,6900,7400,
             parseInt(document.getElementById('strike-total')?.textContent?.replace(/[^0-9]/g,'')||7800)],
      borderColor: '#e8453c', backgroundColor: 'rgba(232,69,60,0.08)',
      borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#e8453c',
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }},
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor }},
      y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: v => v>=1000?(v/1000)+'k':v }}
    }
  }
});

new Chart(document.getElementById('waveChart'), {
  type: 'bar',
  data: {
    labels: ['Wk1','Wk2','Wk3','Latest'],
    datasets: [
      { label: 'Missile waves (⚠ approx)', data: [18,22,20,10], backgroundColor: 'rgba(232,69,60,0.75)', borderRadius: 3 },
      { label: 'Drone waves (⚠ approx)',   data: [12,15,18,8],  backgroundColor: 'rgba(240,165,0,0.65)',  borderRadius: 3 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { boxWidth: 10, padding: 12, color: tickColor }}},
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor }},
      y: { grid: { color: gridColor }, ticks: { color: tickColor }}
    }
  }
});

new Chart(document.getElementById('interceptChart'), {
  type: 'doughnut',
  data: {
    labels: ['Bahrain','Saudi Arabia','Israel','UAE','Qatar','US Navy','Other'],
    datasets: [{
      data: [143,95,210,67,34,180,71],
      backgroundColor: ['rgba(61,155,233,0.8)','rgba(240,165,0,0.8)','rgba(46,204,113,0.8)',
        'rgba(240,112,48,0.8)','rgba(232,69,60,0.8)','rgba(238,242,247,0.5)','rgba(255,255,255,0.2)'],
      borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position:'right', labels: { boxWidth:10, padding:8, color:tickColor, font:{size:10}}},
      tooltip: { callbacks: { label: ctx => ' '+ctx.label+': '+ctx.raw+' intercepted (⚠ approx)' }}
    },
    cutout: '55%'
  }
});

new Chart(document.getElementById('costChart'), {
  type: 'bar',
  data: {
    labels: ['D1-6','D7','D8','D9','D10','D11','D12','D13','D14','D15','D16','D17','D18','D19','D20','D21','Now'],
    datasets: [{
      label: 'Daily cost estimate ($B) ⚠ approx',
      data: [1.88,1.0,1.0,1.0,1.0,1.0,1.0,1.05,1.05,1.1,1.1,1.1,1.15,1.15,1.2,1.2,1.25],
      backgroundColor: ctx => {
        const g = ctx.chart.ctx.createLinearGradient(0,0,0,200);
        g.addColorStop(0,'rgba(232,69,60,0.8)'); g.addColorStop(1,'rgba(232,69,60,0.2)'); return g;
      },
      borderColor: '#e8453c', borderWidth: 0, borderRadius: 3,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend:{display:false}, tooltip:{callbacks:{label: ctx=>' $'+ctx.raw+'B (⚠ approx)'}}},
    scales: {
      x: { grid:{color:gridColor}, ticks:{color:tickColor, maxRotation:0}},
      y: { grid:{color:gridColor}, ticks:{color:tickColor, callback: v=>'$'+v+'B'}}
    }
  }
});

new Chart(document.getElementById('oilChart'), {
  type: 'line',
  data: {
    labels: ['Jan 1','Jan 15','Feb 1','Feb 15','Feb 28\n(Start)','Mar 5','Mar 10','Mar 15','Latest'],
    datasets: [{
      label: 'Brent crude $/bbl (⚠ approx)',
      data: [70,69,71,68,67,82,94,104,112],
      borderColor: '#f0a500', backgroundColor: 'rgba(240,165,0,0.08)',
      borderWidth: 2.5, fill: true, tension: 0.4,
      pointRadius: [3,3,3,3,6,3,3,3,6],
      pointBackgroundColor: ctx => ctx.dataIndex===4?'#e8453c':'#f0a500',
      pointBorderColor:     ctx => ctx.dataIndex===4?'#e8453c':'#f0a500',
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend:{display:false},
      tooltip:{callbacks:{label: ctx=>' $'+ctx.raw+'/bbl (⚠ approx · source: oilpriceapi.com)'}},
      annotation:{}
    },
    scales: {
      x: { grid:{color:gridColor}, ticks:{color:tickColor, maxRotation:0, font:{size:9}}},
      y: { grid:{color:gridColor}, ticks:{color:tickColor, callback: v=>'$'+v}, min:60}
    }
  }
});


});
