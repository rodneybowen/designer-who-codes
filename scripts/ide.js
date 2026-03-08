/* ============================================
   THE DESIGNER WHO CODES — In-Browser IDE
   Ace Editor + sandboxed iframe preview
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // Wait for Ace to be available (it's loaded from CDN in the HTML)
  if (typeof ace === 'undefined') {
    console.warn('IDE: Ace editor library not loaded — check the CDN script tag.');
    return;
  }

  document.querySelectorAll('.ide').forEach(function (ide) {
    var starterEl = ide.querySelector('.ide__starter');
    var starterCode = starterEl ? starterEl.textContent.trim() : '';
    var editorEl = ide.querySelector('.ide__editor');
    var previewEl = ide.querySelector('.ide__preview');
    var runBtn = ide.querySelector('.ide__btn--run');
    var resetBtn = ide.querySelector('.ide__btn--reset');
    var mode = ide.dataset.mode || 'html';

    if (!editorEl || !previewEl) return;

    // Init Ace editor
    var editor = ace.edit(editorEl);
    editor.session.setMode('ace/mode/' + mode);
    editor.setOptions({
      fontSize: '13px',
      showPrintMargin: false,
      wrap: true,
      tabSize: 2,
      useSoftTabs: true,
      showGutter: true,
      highlightActiveLine: true
    });
    editor.setValue(starterCode, -1); // -1 = place cursor at top

    // Sync Ace theme with the site's light/dark mode
    function syncTheme() {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      editor.setTheme(isLight ? 'ace/theme/chrome' : 'ace/theme/tomorrow_night');
    }
    syncTheme();

    // Watch for theme toggle changes
    var observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Run: push editor content into iframe srcdoc
    function run() {
      previewEl.srcdoc = editor.getValue();
    }

    // Auto-run on load to show starter code result
    run();

    if (runBtn) {
      runBtn.addEventListener('click', run);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        editor.setValue(starterCode, -1);
        run();
      });
    }
  });

});
