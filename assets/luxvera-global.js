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