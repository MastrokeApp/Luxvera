/* ============================================================
   LUXVERA — Global JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Mobile nav toggle ── */
  document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const navDrawer = document.querySelector('[data-nav-drawer]');

    if (navToggle && navDrawer) {
      navToggle.addEventListener('click', function () {
        const isOpen = navDrawer.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', isOpen);
        document.body.classList.toggle('nav-open', isOpen);
      });
    }

    /* ── Close nav on overlay click ── */
    const navOverlay = document.querySelector('[data-nav-overlay]');
    if (navOverlay) {
      navOverlay.addEventListener('click', function () {
        if (navDrawer) navDrawer.classList.remove('is-open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    }

    /* ── Announcement bar close ── */
    const announcementClose = document.querySelector('[data-announcement-close]');
    const announcementBar = document.querySelector('[data-announcement-bar]');
    if (announcementClose && announcementBar) {
      announcementClose.addEventListener('click', function () {
        announcementBar.style.display = 'none';
      });
    }
  });

})();
