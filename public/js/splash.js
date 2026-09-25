/**
 * Hermes.io — Cosmic Splash Page Engine
 * Controlled by `window.HERMES_SPLASH_ENABLED` (true = active, false = disabled/removed)
 */
(function() {
  'use strict';

  function initSplash() {
    // If feature toggle is disabled, instantly remove the splash overlay
    if (window.HERMES_SPLASH_ENABLED === false) {
      var existing = document.getElementById('hermes-splash-screen');
      if (existing) existing.remove();
      return;
    }

    var splash = document.getElementById('hermes-splash-screen');
    var enterBtn = document.getElementById('btn-splash-enter');

    if (!splash || !enterBtn) return;

    function enterSite() {
      enterBtn.disabled = true;
      splash.classList.add('splash-fade-out');

      // Remove after transition finishes
      setTimeout(function() {
        if (splash && splash.parentNode) {
          splash.remove();
        }
      }, 700);
    }

    enterBtn.addEventListener('click', enterSite);

    // Also allow pressing 'Enter' key while on splash screen
    function onKeyDown(e) {
      if (e.key === 'Enter') {
        window.removeEventListener('keydown', onKeyDown);
        enterSite();
      }
    }
    window.addEventListener('keydown', onKeyDown);
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplash);
  } else {
    initSplash();
  }
})();
