// ─── intel.js — Intelligence Summaries expand/collapse ───

(function () {

  function init() {
    document.querySelectorAll('.intel-row').forEach(function (row) {
      row.addEventListener('click', function () {
        const event = row.closest('.intel-event');
        const expanded = event.dataset.expanded === 'true';
        event.dataset.expanded = expanded ? 'false' : 'true';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
