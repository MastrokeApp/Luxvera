/**
 * Luxvera — Global JavaScript v3
 * FIX: cart:open is only fired when event detail has action:'add'
 *      Remove/update from cart page no longer triggers the drawer.
 */
'use strict';

(function () {

  /* ── Cart badge update ── */
  function updateCartBadge(count) {
    document.querySelectorAll('.lv-cart-badge').forEach(function (b) {
      b.textContent = count > 0 ? count : '';
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /* ── Refresh badge only ── */
  function refreshBadge() {
    fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartBadge(cart.item_count); })
      .catch(function () {});
  }

  /* ── Refresh badge AND open drawer ── */
  function refreshAndOpen() {
    fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartBadge(cart.item_count);
        document.dispatchEvent(new CustomEvent('cart:open', { bubbles: true }));
      })
      .catch(function () {});
  }

  /*
   * Listen for cart:updated.
   * Only open the drawer when action === 'add' (product added to cart).
   * Remove / update / qty-change from the cart page use action:'remove'
   * or action:'update', which should only refresh the badge silently.
   * If no action is specified, default to badge-only refresh.
   */
  document.addEventListener('cart:updated', function (e) {
    var action = e.detail && e.detail.action;
    if (action === 'add') {
      refreshAndOpen();
    } else {
      /* remove / update / unspecified — just update the badge */
      refreshBadge();
    }
  });

  /* ── Badge on page load ── */
  document.addEventListener('DOMContentLoaded', function () {
    var badge = document.querySelector('.lv-cart-badge');
    if (badge) {
      var count = parseInt(badge.textContent, 10) || 0;
      updateCartBadge(count);
    }
  });

})();

/* ---- cart drawer open code */
  document.addEventListener('click', function(e) {

  const cartBtn = e.target.closest('.js-cart-drawer-open');

  if (!cartBtn) return;

  e.preventDefault();

  document.dispatchEvent(
    new CustomEvent('cart:open')
  );

});

// Footer Accordion
document.addEventListener('DOMContentLoaded', function () {
  var footer = document.querySelector('.lv-footer');

  if (!footer || footer.dataset.accordionEnabled !== 'true') return;

  var mobileBreakpoint = 768;

  function initAccordion() {
    var isMobile = window.innerWidth < mobileBreakpoint;

    footer.querySelectorAll('.lv-accordion-item').forEach(function (item) {
      var trigger = item.querySelector('.lv-accordion-trigger');
      var panel = item.querySelector('.lv-accordion-panel');

      if (!trigger || !panel) return;

      if (!isMobile) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
        item.classList.remove('is-open');
        return;
      }

      if (!trigger.dataset.bound) {
        trigger.dataset.bound = 'true';

        trigger.addEventListener('click', function () {
          var expanded = trigger.getAttribute('aria-expanded') === 'true';

          trigger.setAttribute('aria-expanded', String(!expanded));
          item.classList.toggle('is-open', !expanded);

          if (expanded) {
            panel.setAttribute('hidden', '');
          } else {
            panel.removeAttribute('hidden');
          }
        });
      }

      if (item.classList.contains('is-open')) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
      } else {
        trigger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
      }
    });
  }

  initAccordion();
  window.addEventListener('resize', initAccordion);
});