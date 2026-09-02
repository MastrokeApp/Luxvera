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

  var backdrop = document.getElementById('cart-notif-backdrop');
  var closeBtn = document.getElementById('cart-notif-close');
  var closeBtn2 = document.getElementById('cart-notif-close-btn');

  var CURRENCY = drawer.dataset.currency || 'USD';

  var FREE_SHIPPING_THRESHOLD =
    parseInt(drawer.dataset.freeShippingThreshold, 10) || 0;

  function formatMoney(cents) {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: CURRENCY
    });
  }

  /*
   * Render all cart products
   */
  function renderCartProducts(cartData) {
    var productsEl = document.getElementById('cart-notif-products');

    if (!productsEl || !cartData || !cartData.items) return;

    productsEl.innerHTML = '';

    cartData.items.forEach(function (item) {
      var product = document.createElement('div');
      product.className = 'cart-notif__product';
      product.dataset.key = item.key;

      /*
       * Product image
       */
      var imageWrap = document.createElement('div');
      imageWrap.className = 'cart-notif__product-img-wrap';

      if (item.image) {
        var img = document.createElement('img');

        img.src = item.image;
        img.alt = item.product_title || item.title;
        img.width = 72;
        img.height = 90;
        img.className = 'cart-notif__product-img';
        img.loading = 'lazy';

        imageWrap.appendChild(img);
      }

      /*
       * Product details
       */
      var details = document.createElement('div');
      details.className = 'cart-notif__product-details';

      /*
       * Product title
       */
      var titleEl = document.createElement('p');
      titleEl.className = 'cart-notif__product-title';
      titleEl.textContent = item.product_title || item.title;

      /*
       * Variant
       */
      var variantEl = document.createElement('p');
      variantEl.className = 'cart-notif__product-variant';

      if (
        item.variant_title &&
        item.variant_title !== 'Default Title'
      ) {
        variantEl.textContent = item.variant_title;
      }

      /*
       * Quantity
       */
      var quantityEl = document.createElement('p');
      quantityEl.className = 'cart-notif__product-quantity';
      quantityEl.textContent = 'Qty: ' + item.quantity;

      /*
       * Price
       */
      var priceEl = document.createElement('p');
      priceEl.className = 'cart-notif__product-price';
      priceEl.textContent = formatMoney(item.final_line_price);

      /*
       * Product content
       */
      details.appendChild(titleEl);
      details.appendChild(variantEl);
      details.appendChild(quantityEl);
      details.appendChild(priceEl);

      /*
       * Delete button
       */
      var removeBtn = document.createElement('button');

      removeBtn.type = 'button';
      removeBtn.className = 'cart-notif__remove';
      removeBtn.textContent = 'Remove';

      removeBtn.setAttribute(
        'aria-label',
        'Remove ' + (item.product_title || item.title) + ' from cart'
      );

      /*
       * Store Shopify line item key
       */
      removeBtn.dataset.lineKey = item.key;

      /*
       * Remove product
       */
      removeBtn.addEventListener('click', function () {
        removeCartItem(item.key, removeBtn);
      });

      details.appendChild(removeBtn);

      product.appendChild(imageWrap);
      product.appendChild(details);

      productsEl.appendChild(product);
    });
  }

  /*
   * Remove item from cart
   */
  function removeCartItem(lineKey, button) {
    if (!lineKey) return;

    /*
     * Prevent multiple clicks
     */
    button.disabled = true;
    button.textContent = 'Removing...';

    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: lineKey,
        quantity: 0
      })
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Failed to remove cart item');
        }

        return res.json();
      })
      .then(function (cartData) {
        /*
         * Re-render products
         */
        renderCartProducts(cartData);

        /*
         * Update subtotal
         */
        updateCartSummary(cartData);

        /*
         * Update free shipping
         */
        updateShippingProgress(cartData);

        /*
         * If cart is empty, close drawer
         */
        if (
          !cartData.items ||
          cartData.items.length === 0
        ) {
          closeDrawer();
        }

        /*
         * Dispatch cart update event
         * so other Shopify theme components can update.
         */
        document.dispatchEvent(
          new CustomEvent('cart:updated', {
            detail: {
              cart: cartData
            }
          })
        );
      })
      .catch(function (err) {
        console.error(
          'Cart item removal error:',
          err
        );

        button.disabled = false;
        button.textContent = 'Remove';
      });
  }

  /*
   * Update subtotal
   */
  function updateCartSummary(cartData) {
    var subtotalEl =
      document.getElementById('cart-notif-subtotal');

    if (subtotalEl && cartData) {
      subtotalEl.textContent =
        formatMoney(cartData.total_price);
    }
  }

  /*
   * Update free shipping progress
   */
  function updateShippingProgress(cartData) {
    if (
      !cartData ||
      FREE_SHIPPING_THRESHOLD <= 0
    ) {
      return;
    }

    var remaining = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - cartData.total_price
    );

    var pct = Math.min(
      100,
      (cartData.total_price /
        FREE_SHIPPING_THRESHOLD) *
        100
    );

    var msgEl =
      document.getElementById(
        'cart-notif-shipping-msg'
      );

    var barEl =
      document.getElementById(
        'cart-notif-shipping-progress'
      );

    /*
     * Message
     */
    if (msgEl) {
      msgEl.textContent =
        remaining > 0
          ? (
              drawer.dataset.shippingRemainingTemplate ||
              "You're {{amount}} away from free shipping!"
            ).replace(
              '{{amount}}',
              formatMoney(remaining)
            )
          : (
              drawer.dataset.shippingQualifiedMessage ||
              '🎉 You qualify for free shipping!'
            );
    }

    /*
     * Progress bar
     */
    if (barEl) {
      barEl.style.width = pct + '%';
    }
  }

  /*
   * Open drawer
   */
  function openDrawer(cartData) {
    if (!cartData) return;

    renderCartProducts(cartData);

    updateCartSummary(cartData);

    updateShippingProgress(cartData);

    drawer.hidden = false;

    if (backdrop) {
      backdrop.hidden = false;
    }

    requestAnimationFrame(function () {
      drawer.setAttribute('aria-modal', 'true');

      if (backdrop) {
        backdrop.setAttribute('aria-modal', 'true');
      }

      document.body.classList.add(
        'cart-notif--open'
      );

      if (closeBtn) {
        closeBtn.focus();
      }
    });
  }

  /*
   * Close drawer
   */
  function closeDrawer() {
    drawer.setAttribute('aria-modal', 'false');

    if (backdrop) {
      backdrop.setAttribute('aria-modal', 'false');
    }

    document.body.classList.remove(
      'cart-notif--open'
    );

    setTimeout(function () {
      drawer.hidden = true;

      if (backdrop) {
        backdrop.hidden = true;
      }
    }, 320);
  }

  /*
   * Close buttons
   */
  if (closeBtn) {
    closeBtn.addEventListener(
      'click',
      closeDrawer
    );
  }

  if (closeBtn2) {
    closeBtn2.addEventListener(
      'click',
      closeDrawer
    );
  }

  if (backdrop) {
    backdrop.addEventListener(
      'click',
      closeDrawer
    );
  }

  /*
   * ESC key
   */
  document.addEventListener(
    'keydown',
    function (e) {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    }
  );

  /*
   * Open cart notification
   */
  document.addEventListener(
    'cart:open',
    function () {
      fetch('/cart.js')
        .then(function (res) {
          if (!res.ok) {
            throw new Error(
              'Failed to fetch cart'
            );
          }

          return res.json();
        })
        .then(function (cartData) {
          if (
            cartData.items &&
            cartData.items.length > 0
          ) {
            openDrawer(cartData);
          } else {
            window.location.href = drawer.dataset.cartUrl || '/cart';
          }
        })
        .catch(function (err) {
          console.error(
            'Cart notification error:',
            err
          );
        });
    }
  );
})();