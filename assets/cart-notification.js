/*
 * Cart notification drawer
 * Opens on the "cart:open" event, fetches /cart.js, and shows the most
 * recently added item plus subtotal and free-shipping progress.
 * Config (currency, free-shipping threshold) is read from data-* attributes
 * on #cart-notification.
 */
(function () {
  'use strict';

  var drawer = document.getElementById('cart-notification');
  if (!drawer) return;

  var backdrop  = document.getElementById('cart-notif-backdrop');
  var closeBtn  = document.getElementById('cart-notif-close');
  var closeBtn2 = document.getElementById('cart-notif-close-btn');

  var CURRENCY = drawer.dataset.currency || 'USD';
  var FREE_SHIPPING_THRESHOLD = parseInt(drawer.dataset.freeShippingThreshold, 10) || 0; // cents

  function formatMoney(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: CURRENCY });
  }

  function openDrawer(itemData, cartData) {
    // Product snapshot
    var img = document.getElementById('cart-notif-img');
    if (img && itemData.image) {
      img.src = itemData.image;
      img.alt = itemData.title;
    }

    var titleEl = document.getElementById('cart-notif-title');
    if (titleEl) titleEl.textContent = itemData.title;

    var variantEl = document.getElementById('cart-notif-variant');
    if (variantEl) variantEl.textContent = itemData.variant_title !== 'Default Title' ? itemData.variant_title : '';

    var priceEl = document.getElementById('cart-notif-price');
    if (priceEl) priceEl.textContent = formatMoney(itemData.final_price);

    // Subtotal
    var subtotalEl = document.getElementById('cart-notif-subtotal');
    if (subtotalEl && cartData) subtotalEl.textContent = formatMoney(cartData.total_price);

    // Free shipping progress
    if (cartData && FREE_SHIPPING_THRESHOLD > 0) {
      var remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartData.total_price);
      var pct = Math.min(100, (cartData.total_price / FREE_SHIPPING_THRESHOLD) * 100);
      var msgEl = document.getElementById('cart-notif-shipping-msg');
      var barEl = document.getElementById('cart-notif-shipping-progress');
      if (msgEl) {
        msgEl.textContent = remaining > 0
          ? (drawer.dataset.shippingRemainingTemplate || "You're {{amount}} away from free shipping!").replace('{{amount}}', formatMoney(remaining))
          : (drawer.dataset.shippingQualifiedMessage || '🎉 You qualify for free shipping!');
      }
      if (barEl) barEl.style.width = pct + '%';
    }

    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(function () {
      drawer.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-modal', 'true');
      document.body.classList.add('cart-notif--open');
      closeBtn.focus();
    });
  }

  function closeDrawer() {
    drawer.setAttribute('aria-modal', 'false');
    backdrop.setAttribute('aria-modal', 'false');
    document.body.classList.remove('cart-notif--open');
    setTimeout(function () {
      drawer.hidden = true;
      backdrop.hidden = true;
    }, 320);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (closeBtn2) closeBtn2.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // Opened by main-product.liquid (and other add-to-cart flows) via cart:open
  document.addEventListener('cart:open', function () {
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cartData) {
        var lastItem = cartData.items[0];
        if (lastItem) openDrawer(lastItem, cartData);
      })
      .catch(function (err) { console.error('Cart notification error:', err); });
  });
})();
