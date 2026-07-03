/**
 * Dynamic Currency Switcher
 * Intercepts the localization form submit, uses fetch PUT to switch
 * currency without a full page reload where possible.
 * Syncs all switcher instances on the page (topbar + footer + mobile).
 */
(function () {
  'use strict';

  function initCurrencySwitchers() {
    var selects = document.querySelectorAll('[data-lv-currency-select]');
    if (!selects.length) return;

    selects.forEach(function (select) {
      select.addEventListener('change', function () {
        var selectedValue = select.value;

        // Sync all other instances to the same value visually
        document.querySelectorAll('[data-lv-currency-select]').forEach(function (s) {
          if (s !== select) s.value = selectedValue;
        });

        // Find the parent form and submit it
        var form = select.closest('form');
        if (!form) return;

        var formData = new FormData(form);
        var params = new URLSearchParams();
        formData.forEach(function (value, key) {
          params.append(key, value);
        });

        // Use fetch to submit; on success reload to refresh prices
        fetch(form.action || '/localization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: params.toString()
        })
        .then(function (res) {
          // Shopify returns a redirect — reload current page to show new currency
          if (res.ok || res.redirected || res.status === 302) {
            window.location.reload();
          } else {
            form.submit();
          }
        })
        .catch(function () {
          // Fallback to native form submit
          form.submit();
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrencySwitchers);
  } else {
    initCurrencySwitchers();
  }

})();
