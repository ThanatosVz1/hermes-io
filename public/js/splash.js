/**
 * Hermes.io — Cosmic Splash Page with Sliding Enter Control
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
    var track = document.getElementById('splash-slider-track');
    var thumb = document.getElementById('splash-slider-thumb');
    var progress = document.getElementById('splash-slider-progress');
    var label = document.querySelector('.splash-slider-label');
    var icon = document.getElementById('sst-icon');

    if (!splash || !track || !thumb) return;

    var isDragging = false;
    var startX = 0;
    var currentX = 0;
    var maxDrag = 0;
    var isUnlocked = false;

    function getMaxDrag() {
      return Math.max(0, track.clientWidth - thumb.clientWidth - 8);
    }

    function enterSite() {
      if (isUnlocked) return;
      isUnlocked = true;

      track.classList.add('unlocked');
      if (icon) {
        icon.className = 'ph-bold ph-check';
      }

      // Smooth cinematic transition out
      setTimeout(function() {
        splash.classList.add('splash-fade-out');
        setTimeout(function() {
          if (splash && splash.parentNode) {
            splash.remove();
          }
        }, 750);
      }, 250);
    }

    // Touch & Mouse Drag Handlers
    function onStart(e) {
      if (isUnlocked) return;
      isDragging = true;
      thumb.classList.add('dragging');
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      maxDrag = getMaxDrag();
      thumb.style.transition = 'none';
      if (progress) progress.style.transition = 'none';
    }

    function onMove(e) {
      if (!isDragging || isUnlocked) return;
      var clientX = (e.touches ? e.touches[0].clientX : e.clientX);
      var dx = clientX - startX;
      currentX = Math.max(0, Math.min(maxDrag, dx));

      thumb.style.transform = 'translateX(' + currentX + 'px)';
      if (progress) {
        progress.style.width = (currentX + 25) + 'px';
      }
      if (label && maxDrag > 0) {
        var ratio = currentX / maxDrag;
        label.style.opacity = Math.max(0, 1 - ratio * 1.5);
      }
    }

    function onEnd() {
      if (!isDragging || isUnlocked) return;
      isDragging = false;
      thumb.classList.remove('dragging');

      maxDrag = getMaxDrag();
      var ratio = maxDrag > 0 ? (currentX / maxDrag) : 0;

      // Threshold: dragged past 70% of the track unlocks
      if (ratio >= 0.70) {
        // Snap to end
        thumb.style.transition = 'transform 0.15s ease-out';
        thumb.style.transform = 'translateX(' + maxDrag + 'px)';
        if (progress) {
          progress.style.transition = 'width 0.15s ease-out';
          progress.style.width = '100%';
        }
        enterSite();
      } else {
        // Snap back to origin
        thumb.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        thumb.style.transform = 'translateX(0px)';
        if (progress) {
          progress.style.transition = 'width 0.25s ease';
          progress.style.width = '0px';
        }
        if (label) {
          label.style.opacity = '1';
        }
        currentX = 0;
      }
    }

    // Attach drag events to thumb
    thumb.addEventListener('mousedown', onStart);
    thumb.addEventListener('touchstart', onStart, { passive: true });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // Fallback: Click track or press Enter key
    track.addEventListener('click', function(e) {
      if (!isUnlocked && e.target !== thumb && !thumb.contains(e.target)) {
        // Slide across track automatically on direct click
        maxDrag = getMaxDrag();
        thumb.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        thumb.style.transform = 'translateX(' + maxDrag + 'px)';
        if (progress) {
          progress.style.transition = 'width 0.35s ease';
          progress.style.width = '100%';
        }
        if (label) label.style.opacity = '0';
        enterSite();
      }
    });

    window.addEventListener('keydown', function(e) {
      if ((e.key === 'Enter' || e.key === ' ') && !isUnlocked) {
        maxDrag = getMaxDrag();
        thumb.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        thumb.style.transform = 'translateX(' + maxDrag + 'px)';
        if (progress) progress.style.width = '100%';
        if (label) label.style.opacity = '0';
        enterSite();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplash);
  } else {
    initSplash();
  }
})();
