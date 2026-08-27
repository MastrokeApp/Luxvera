/**
 * Header — assets/lv-header.js
 *
 */
(function () {
  'use strict';

  var els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheEls() {
    els.hamburger = byId('lvHamburger');
    els.mobileMenu = byId('lvMobileMenu');
    els.drawerClose = byId('lvDrawerClose');
    els.searchBtn = byId('lvSearchBtn');
    els.searchOverlay = byId('lvSearchOverlay');
    els.searchClose = byId('lvSearchClose');
    els.searchInput = byId('lvSearchInput');
    els.predictiveResults = byId('lvPredictiveResults');
    els.stickyHeader = document.querySelector('.lv-header-wrap--sticky');
  }

  function openDrawer() {
    if (els.mobileMenu) {
      els.mobileMenu.classList.add('open');
      els.mobileMenu.setAttribute('aria-hidden', 'false');
    }
    if (els.hamburger) {
      els.hamburger.classList.add('open');
      els.hamburger.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      if (els.drawerClose) els.drawerClose.focus();
    }, 50);
  }

  function closeDrawer() {
    var wasOpen = els.mobileMenu && els.mobileMenu.classList.contains('open');
    if (els.mobileMenu) {
      els.mobileMenu.classList.remove('open');
      els.mobileMenu.setAttribute('aria-hidden', 'true');
    }
    if (els.hamburger) {
      els.hamburger.classList.remove('open');
      els.hamburger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
    if (wasOpen && els.hamburger) els.hamburger.focus();
  }

  function openSearch() {
    if (els.searchOverlay) els.searchOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      if (els.searchInput) els.searchInput.focus();
    }, 50);
  }

  function closeSearch() {
    var wasOpen = els.searchOverlay && els.searchOverlay.classList.contains('open');
    if (els.searchOverlay) els.searchOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (wasOpen && els.searchBtn) els.searchBtn.focus();
    clearPredictive();
  }

  var predictiveTimer = null;
  var predictiveController = null;

  function clearPredictive() {
    if (!els.predictiveResults) return;
    els.predictiveResults.innerHTML = '';
    els.predictiveResults.hidden = true;
  }

  function runPredictiveSearch(term) {
    if (!els.predictiveResults || !window.fetch) return;
    if (predictiveController) predictiveController.abort();
    predictiveController = ('AbortController' in window) ? new AbortController() : null;

    fetch('/search/suggest?q=' + encodeURIComponent(term) + '&section_id=predictive-search', {
      signal: predictiveController ? predictiveController.signal : undefined
    })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var section = doc.getElementById('shopify-section-predictive-search');
        var content = section ? section.innerHTML.trim() : '';
        els.predictiveResults.innerHTML = content;
        els.predictiveResults.hidden = content === '';
      })
      .catch(function () {});
  }

  function handleSearchInput() {
    var term = els.searchInput.value.trim();
    clearTimeout(predictiveTimer);
    if (term.length < 2) {
      clearPredictive();
      return;
    }
    predictiveTimer = setTimeout(function () { runPredictiveSearch(term); }, 300);
  }

  function closeAllDropdowns() {
    document.querySelectorAll('[data-lv-dropdown].open').forEach(function (el) {
      el.classList.remove('open');
      var b = el.querySelector('.lv-nav__caret');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    closeAllSubmenus();
  }

  // Level 3 — flyout submenus inside a standard (non-mega) dropdown.
  function closeAllSubmenus() {
    document.querySelectorAll('[data-lv-submenu].open').forEach(function (el) {
      el.classList.remove('open', 'lv-dropdown__item--flip');
      var b = el.querySelector('.lv-dropdown__caret');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  function openSubmenu(item, btn) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');

    // Flip the flyout to the left if it would overflow the viewport
    // on the right — measured after 'open' so the flyout has layout.
    var flyout = item.querySelector('.lv-dropdown__flyout');
    if (flyout) {
      var rect = flyout.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        item.classList.add('lv-dropdown__item--flip');
      }
    }
  }

  function bindOnce(el, evt, handler) {
    if (!el || el.dataset.lvBound) return;
    el.dataset.lvBound = '1';
    el.addEventListener(evt, handler);
  }

  // Single delegated handler covers desktop dropdown toggles, mobile
  // drawer accordion toggles, and click-outside-closes-dropdown — all
  // in one document-level listener instead of one per menu item.
  function handleDocumentClick(e) {
    var dropdownBtn = e.target.closest('[data-lv-dropdown] .lv-nav__caret');
    if (dropdownBtn) {
      e.stopPropagation();
      e.preventDefault();
      var item = dropdownBtn.closest('[data-lv-dropdown]');
      var isOpen = item.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        item.classList.add('open');
        dropdownBtn.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    var submenuBtn = e.target.closest('[data-lv-submenu] .lv-dropdown__caret');
    if (submenuBtn) {
      e.stopPropagation();
      e.preventDefault();
      var submenuItem = submenuBtn.closest('[data-lv-submenu]');
      var submenuIsOpen = submenuItem.classList.contains('open');
      // Close sibling submenus within the same dropdown panel before
      // opening this one, so only one flyout is open at a time.
      var panel = submenuItem.closest('.lv-dropdown');
      if (panel) {
        panel.querySelectorAll('[data-lv-submenu].open').forEach(function (el) {
          if (el !== submenuItem) {
            el.classList.remove('open', 'lv-dropdown__item--flip');
            var siblingBtn = el.querySelector('.lv-dropdown__caret');
            if (siblingBtn) siblingBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      if (submenuIsOpen) {
        submenuItem.classList.remove('open', 'lv-dropdown__item--flip');
        submenuBtn.setAttribute('aria-expanded', 'false');
      } else {
        openSubmenu(submenuItem, submenuBtn);
      }
      return;
    }

    var drawerToggle = e.target.closest('[data-lv-drawer-toggle]');
      if (drawerToggle) {
        e.stopPropagation();
        e.preventDefault();
        var drawerItem = drawerToggle.closest('.lv-drawer-item');
        var drawerIsOpen = drawerItem.classList.contains('open');

        // Only close sibling items at the SAME nesting level -- never an
        // ancestor, or opening a nested item (e.g. BOHO inside Best Seller)
        // would immediately collapse its own parent and hide it.
        var parentList = drawerItem.parentElement;
        Array.prototype.forEach.call(parentList.children, function (sibling) {
          if (
            sibling !== drawerItem &&
            sibling.classList &&
            sibling.classList.contains('lv-drawer-item') &&
            sibling.classList.contains('open')
          ) {
            sibling.classList.remove('open');
            var siblingBtn = sibling.querySelector('[data-lv-drawer-toggle]');
            if (siblingBtn) siblingBtn.setAttribute('aria-expanded', 'false');
          }
        });

        drawerItem.classList.toggle('open', !drawerIsOpen);
        drawerToggle.setAttribute('aria-expanded', String(!drawerIsOpen));
        return;
      }

    // Any other click closes open desktop dropdowns (preserves the
    // original document-level "click closes dropdowns" behaviour).
    closeAllDropdowns();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      closeSearch();
      closeDrawer();
    }
  }

  function handleCartUpdated() {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        document.querySelectorAll('.lv-cart-badge').forEach(function (b) {
          b.textContent = cart.item_count;
          b.style.display = cart.item_count > 0 ? 'flex' : 'none';
        });
      });
  }

  function setupSticky() {
    var el = els.stickyHeader;
    if (!el) return;

    // The header is position:fixed (not CSS position:sticky) because
    // Shopify auto-wraps every section in a .shopify-section div sized
    // to exactly that section's own height -- sticky can only stay
    // "stuck" within the bounds of its parent, so with zero spare room
    // in that wrapper it would never actually stay pinned while
    // scrolling. Fixed positioning sidesteps that, but then we have to
    // reimplement sticky's behavior by hand: track the header's natural
    // (in-flow) offset -- however tall any header-group content
    // rendered above it is -- and slide its `top` from that offset down
    // to 0 as the page scrolls, clamping there. That reproduces native
    // sticky: content above the header stays visible until scrolled
    // past, then the header sticks to the very top for the rest of the
    // page.
    var naturalTop = 0;

    function measureNaturalTop() {
      var prevPosition = el.style.position;
      var prevTop = el.style.top;
      el.style.position = 'static';
      el.style.top = 'auto';
      var value = el.getBoundingClientRect().top + window.scrollY;
      el.style.position = prevPosition;
      el.style.top = prevTop;
      return value;
    }

    function positionHeader() {
      var top = naturalTop - window.scrollY;
      if (top < 0) top = 0;
      el.style.top = top + 'px';
    }

    function updateOffset() {
      naturalTop = measureNaturalTop();
      positionHeader();
      document.body.style.paddingTop = (naturalTop + el.offsetHeight) + 'px';
    }

    updateOffset();

    // Keep the offset in sync whenever the header's actual rendered
    // height (or the height of anything rendered above it) changes --
    // e.g. a wrapped nav row makes the header taller, or the window is
    // resized across a breakpoint.
    if (!el.dataset.lvResizeBound) {
      el.dataset.lvResizeBound = '1';

      if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(function () {
          updateOffset();
        });
        ro.observe(el);
      } else {
        window.addEventListener('resize', updateOffset);
      }
    }

    var ticking = false;
    function applyScrollState() {
      positionHeader();

      if (window.scrollY > 10) {
        el.classList.add('is-scrolled');
      } else {
        el.classList.remove('is-scrolled');
      }
      ticking = false;
    }

    applyScrollState();

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(applyScrollState);
      },
      { passive: true }
    );
  }

  function initHeader() {
    cacheEls();

    // Controls (each binds once per element instance, safe across
    // theme-editor reloads since bindOnce checks a per-node flag).
    bindOnce(els.hamburger, 'click', openDrawer);
    bindOnce(els.drawerClose, 'click', closeDrawer);
    bindOnce(els.searchBtn, 'click', openSearch);
    bindOnce(els.searchClose, 'click', closeSearch);
    bindOnce(els.searchInput, 'input', handleSearchInput);

    if (els.mobileMenu && !els.mobileMenu.dataset.lvBoundBackdrop) {
      els.mobileMenu.dataset.lvBoundBackdrop = '1';
      els.mobileMenu.addEventListener('click', function (e) {
        if (e.target === els.mobileMenu) closeDrawer();
      });
    }

    if (els.searchOverlay && !els.searchOverlay.dataset.lvBoundBackdrop) {
      els.searchOverlay.dataset.lvBoundBackdrop = '1';
      els.searchOverlay.addEventListener('click', function (e) {
        if (e.target === els.searchOverlay) closeSearch();
      });
    }

    setupSticky();

    // Document-level handlers — bind only once for the whole page,
    // regardless of how many times the section re-initialises.
    if (!window.__lvHeaderGlobalsBound) {
      window.__lvHeaderGlobalsBound = true;
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('keydown', handleKeydown);
      document.addEventListener('cart:updated', handleCartUpdated);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }

  // Re-initialise when the header is reloaded inside the theme editor
  document.addEventListener('shopify:section:load', function () {
    initHeader();
  });
})();