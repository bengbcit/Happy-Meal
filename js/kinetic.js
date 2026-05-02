(function () {
  'use strict';

  // ── Scroll progress bar (drives .topbar::after via CSS var) ──
  var topbar = document.querySelector('.topbar');
  if (topbar) {
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var p = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      topbar.style.setProperty('--scroll-p', p);
    }, { passive: true });
  }

  // ── Cursor follower (desktop pointer only) ───────────────────
  if (!window.matchMedia('(pointer: fine)').matches || window.innerWidth < 768) return;

  var cursor = document.createElement('div');
  cursor.className = 'kinetic-cursor';
  document.body.appendChild(cursor);

  var mx = window.innerWidth / 2;
  var my = window.innerHeight / 2;
  var cx = mx, cy = my;
  var raf = null;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  function tick() {
    cx += (mx - cx) * 0.1;
    cy += (my - cy) * 0.1;
    cursor.style.transform = 'translate(' + (cx - 18) + 'px,' + (cy - 18) + 'px)';
    var dist = Math.abs(mx - cx) + Math.abs(my - cy);
    raf = dist > 0.3 ? requestAnimationFrame(tick) : null;
  }

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest('button, a, input, select, [role="button"]')) {
      cursor.classList.add('kinetic-cursor--hover');
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (e.target.closest('button, a, input, select, [role="button"]')) {
      cursor.classList.remove('kinetic-cursor--hover');
    }
  });
})();
