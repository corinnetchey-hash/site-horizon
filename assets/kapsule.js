/**
 * Kapsule storefront behaviour.
 *
 * Plain script (no build step), loaded with `defer` from layout/theme.liquid.
 * Configuration and translated strings come from `window.Kapsule`, written by
 * snippets/kapsule-config.liquid.
 */
(function () {
  'use strict';

  const K = window.Kapsule || {};
  const config = K.config || {};
  const strings = K.strings || {};
  const routes = K.routes || {};

  /* ---------------------------------------------------------------- utils */

  /** Shopify HTML-escapes translations; decode them before using them as text. */
  function decode(value) {
    if (typeof value !== 'string' || value.indexOf('&') === -1) return value;
    return new DOMParser().parseFromString('<!doctype html><body>' + value, 'text/html').body.textContent;
  }

  function t(key, vars) {
    let value = decode(strings[key] || key);
    if (vars) {
      Object.keys(vars).forEach((name) => {
        value = value.replace(new RegExp('{{\\s*' + name + '\\s*}}', 'g'), vars[name]);
      });
    }
    return value;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const moneyFormatter = new Intl.NumberFormat(document.documentElement.lang || 'fr', {
    style: 'currency',
    currency: config.currency || 'EUR',
  });

  /** Formats an amount in cents: `65,00 €` in French, `€65.00` in English. */
  function money(cents) {
    return moneyFormatter.format((Number(cents) || 0) / 100);
  }

  function sizedImage(url, width) {
    if (!url) return '';
    const separator = url.indexOf('?') === -1 ? '?' : '&';
    return url + separator + 'width=' + width;
  }

  function freeShippingThreshold() {
    const rate = (window.Shopify && window.Shopify.currency && Number(window.Shopify.currency.rate)) || 1;
    return Math.round((config.freeShipping || 0) * rate);
  }

  function setOverlayState() {
    const open = document.querySelector('.k-drawer:not([hidden]), .k-modal:not([hidden])');
    document.body.classList.toggle('k-overlay-open', Boolean(open));
  }

  let lastFocus = null;

  function openLayer(layer) {
    if (!layer) return;
    lastFocus = document.activeElement;
    layer.hidden = false;
    setOverlayState();
    const focusTarget = layer.querySelector('[data-k-autofocus]') || layer.querySelector('button, a, input');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function closeLayer(layer) {
    if (!layer || layer.hidden) return;
    layer.hidden = true;
    setOverlayState();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.k-drawer:not([hidden]), .k-modal:not([hidden])').forEach(closeLayer);
    const search = document.querySelector('[data-k-search]:not([hidden])');
    if (search) toggleSearch(false);
  });

  /* ---------------------------------------------------------- free shipping */

  function renderShipping(subtotal) {
    const threshold = freeShippingThreshold();
    if (!threshold) return;
    const reached = subtotal >= threshold;
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    document.querySelectorAll('[data-k-ship]').forEach((el) => {
      const message = el.querySelector('[data-k-ship-message]');
      const remaining = el.querySelector('[data-k-ship-remaining]');
      const fill = el.querySelector('[data-k-ship-fill]');
      if (message) message.textContent = reached ? t('ship_free') : t('ship_to', { amount: money(threshold) });
      if (remaining) remaining.textContent = reached ? '' : t('ship_remaining', { amount: money(threshold - subtotal) });
      if (fill) fill.style.width = pct + '%';
    });
  }

  /* ------------------------------------------------------------------ cart */

  const drawer = document.querySelector('[data-k-cart-drawer]');
  let cartState = null;

  async function fetchCart() {
    const response = await fetch(routes.cart + '.js', { headers: { Accept: 'application/json' } });
    cartState = await response.json();
    renderCart();
    return cartState;
  }

  function renderCart() {
    if (!cartState) return;
    const count = cartState.item_count;

    document.querySelectorAll('[data-k-cart-count]').forEach((el) => {
      el.textContent = count;
    });
    document.querySelectorAll('[data-k-cart-pill]').forEach((el) => {
      el.classList.toggle('has-items', count > 0);
    });

    renderShipping(cartState.items_subtotal_price);

    if (!drawer) return;
    const lines = drawer.querySelector('[data-k-cart-lines]');
    const empty = drawer.querySelector('[data-k-cart-empty]');
    const foot = drawer.querySelector('[data-k-cart-foot]');
    const subtotal = drawer.querySelector('[data-k-cart-subtotal]');

    empty.hidden = count > 0;
    foot.hidden = count === 0;
    subtotal.textContent = money(cartState.total_price);

    lines.innerHTML = cartState.items
      .map((item) => {
        const variant = item.product_has_only_default_variant ? '' : item.variant_title || '';
        const image = item.image
          ? '<img src="' + escapeHtml(sizedImage(item.image, 200)) + '" alt="" width="74" height="90" loading="lazy">'
          : '<img alt="" width="74" height="90">';
        return (
          '<div class="k-line">' +
          '<a href="' + escapeHtml(item.url) + '" tabindex="-1">' + image + '</a>' +
          '<div class="k-line__body">' +
          '<div class="k-line__brand">' + escapeHtml(item.vendor) + '</div>' +
          '<a class="k-line__name" href="' + escapeHtml(item.url) + '">' + escapeHtml(item.product_title) + '</a>' +
          (variant ? '<div class="k-line__variant">' + escapeHtml(variant) + '</div>' : '') +
          '<div class="k-line__foot">' +
          '<div class="k-qty k-qty--sm">' +
          '<button type="button" data-k-line-change="' + escapeHtml(item.key) + '" data-qty="' + (item.quantity - 1) + '" aria-label="' + escapeHtml(t('decrease')) + '">−</button>' +
          '<span>' + item.quantity + '</span>' +
          '<button type="button" data-k-line-change="' + escapeHtml(item.key) + '" data-qty="' + (item.quantity + 1) + '" aria-label="' + escapeHtml(t('increase')) + '">+</button>' +
          '</div>' +
          '<span class="k-line__total">' + money(item.final_line_price) + '</span>' +
          '</div></div></div>'
        );
      })
      .join('');
  }

  async function changeLine(key, quantity) {
    drawer && drawer.classList.add('is-loading');
    try {
      const response = await fetch(routes.cart_change + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: Math.max(0, quantity) }),
      });
      cartState = await response.json();
      renderCart();
      /* The /cart page is server-rendered: reload it so lines and totals match */
      if (document.querySelector('[data-k-cart-page]')) window.location.reload();
    } finally {
      drawer && drawer.classList.remove('is-loading');
    }
  }

  /**
   * Adds items to the cart and opens the drawer.
   * @param {Array<{id: number|string, quantity: number}>} items
   */
  async function addToCart(items) {
    const response = await fetch(routes.cart_add + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: items }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.description || t('cart_error'));
    }
    await fetchCart();
    openCart();
  }

  function openCart() {
    if (!drawer) {
      window.location.href = routes.cart;
      return;
    }
    closeLayer(document.querySelector('[data-k-quiz]'));
    openLayer(drawer);
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('[data-k-cart-open]')) {
      event.preventDefault();
      fetchCart();
      openCart();
      return;
    }
    if (target.closest('[data-k-cart-close]')) {
      event.preventDefault();
      closeLayer(drawer);
      return;
    }
    const lineButton = target.closest('[data-k-line-change]');
    if (lineButton) {
      event.preventDefault();
      changeLine(lineButton.getAttribute('data-k-line-change'), Number(lineButton.getAttribute('data-qty')));
    }
  });

  /* Quick add forms — add to cart without navigating */
  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-k-add')) return;
    event.preventDefault();
    event.stopPropagation();

    const data = new FormData(form);
    const button = form.querySelector('[type="submit"]');
    const id = data.get('id');
    if (!id) return;
    const quantity = Number(data.get('quantity') || 1);

    if (button) button.setAttribute('aria-disabled', 'true');
    try {
      await addToCart([{ id: id, quantity: quantity }]);
      form.dispatchEvent(new CustomEvent('kapsule:added', { bubbles: true }));
    } catch (error) {
      window.alert(error.message);
    } finally {
      if (button) button.removeAttribute('aria-disabled');
    }
  });

  /* ---------------------------------------------------------------- header */

  const header = document.querySelector('[data-k-header]');

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toggle = target.closest('[data-k-menu-toggle]');
    if (toggle && header) {
      const open = header.classList.toggle('is-menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    }

    const lang = target.closest('[data-k-locale]');
    if (lang) {
      const form = document.querySelector('[data-k-locale-form]');
      if (form) {
        form.querySelector('input[name="locale_code"]').value = lang.getAttribute('data-k-locale');
        form.submit();
      }
    }
  });

  /* ---------------------------------------------------------------- search */

  const search = document.querySelector('[data-k-search]');
  const searchInput = search && search.querySelector('input[type="search"]');
  const searchResults = search && search.querySelector('[data-k-search-results]');
  let searchTimer = null;
  let searchController = null;

  function toggleSearch(force) {
    if (!search) return;
    const open = typeof force === 'boolean' ? force : search.hidden;
    search.hidden = !open;
    document.querySelectorAll('[data-k-search-toggle]').forEach((el) => el.setAttribute('aria-expanded', String(open)));
    if (open) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      searchResults.innerHTML = '';
    }
  }

  async function runSearch(query) {
    if (searchController) searchController.abort();
    if (!query.trim()) {
      searchResults.innerHTML = '';
      return;
    }
    searchController = new AbortController();
    const params = new URLSearchParams({
      q: query,
      'resources[type]': 'product',
      'resources[limit]': '8',
      'resources[options][fields]': 'title,vendor,product_type,tag,variants.title',
    });
    try {
      const response = await fetch(routes.predictive_search + '.json?' + params.toString(), {
        signal: searchController.signal,
      });
      const data = await response.json();
      const products = (data.resources && data.resources.results && data.resources.results.products) || [];
      if (!products.length) {
        searchResults.innerHTML = '<p class="k-search__empty">' + escapeHtml(t('search_empty')) + '</p>';
        return;
      }
      searchResults.innerHTML = products
        .map((product) => {
          const price = Math.round(parseFloat(product.price) * 100);
          return (
            '<a class="k-search__item" href="' + escapeHtml(product.url) + '">' +
            (product.image ? '<img src="' + escapeHtml(sizedImage(product.image, 120)) + '" alt="" width="52" height="52" loading="lazy">' : '<img alt="" width="52" height="52">') +
            '<span><span class="k-search__brand">' + escapeHtml(product.vendor) + '</span><br>' +
            '<span class="k-search__name">' + escapeHtml(product.title) + '</span><br>' +
            '<span class="k-search__price">' + money(price) + '</span></span></a>'
          );
        })
        .join('');
    } catch (error) {
      if (error.name !== 'AbortError') searchResults.innerHTML = '';
    }
  }

  if (search) {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-k-search-toggle]')) toggleSearch();
      if (target.closest('[data-k-search-close]')) toggleSearch(false);
    });
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => runSearch(searchInput.value), 180);
    });
  }

  /* ------------------------------------------------------------- boutique */

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toggle = target.closest('[data-k-filters-toggle]');
    if (!toggle) return;
    const shop = toggle.closest('.k-shop');
    const open = shop.classList.toggle('is-filters-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? t('hide_filters') : t('filter');
  });

  /* ---------------------------------------------------------- product page */

  function initProduct(root) {
    const dataEl = root.querySelector('[data-k-product-json]');
    if (!dataEl) return;
    const product = JSON.parse(dataEl.textContent);
    const form = root.querySelector('[data-k-product-form]');
    const idInput = form.querySelector('input[name="id"]');
    const qtyInput = form.querySelector('input[name="quantity"]');
    const addButton = form.querySelector('[data-k-add-button]');
    const priceEl = root.querySelector('[data-k-price]');
    const unitEl = root.querySelector('[data-k-unit]');
    const mainImage = root.querySelector('[data-k-main-image]');
    const thumbs = Array.from(root.querySelectorAll('[data-k-thumb]'));
    const variantButtons = Array.from(root.querySelectorAll('[data-k-variant]'));
    const sticky = document.querySelector('[data-k-sticky-atc]');
    const stickyPrice = sticky && sticky.querySelector('[data-k-sticky-price]');
    const stickyButton = sticky && sticky.querySelector('[data-k-sticky-add]');

    let variant = product.variants.find((v) => String(v.id) === idInput.value) || product.variants[0];

    function quantity() {
      return Math.max(1, parseInt(qtyInput.value, 10) || 1);
    }

    function selectImage(src, srcset) {
      if (!mainImage || !src) return;
      mainImage.src = src;
      if (srcset) mainImage.srcset = srcset;
      else mainImage.removeAttribute('srcset');
      thumbs.forEach((thumb) => {
        thumb.setAttribute('aria-current', String(thumb.getAttribute('data-src') === src));
      });
    }

    function render() {
      idInput.value = variant.id;
      priceEl.textContent = money(variant.price * quantity());
      if (unitEl) {
        const label = product.variants.length > 1 ? variant.title + ' · ' : '';
        unitEl.textContent = label + t('each', { price: money(variant.price) });
      }
      variantButtons.forEach((button) => {
        button.setAttribute('aria-checked', String(button.getAttribute('data-k-variant') === String(variant.id)));
      });
      const available = variant.available;
      addButton.disabled = !available;
      addButton.textContent = available ? t('add_to_cart') : t('sold_out');
      if (stickyPrice) stickyPrice.textContent = money(variant.price);
      if (stickyButton) stickyButton.disabled = !available;
      if (variant.image) selectImage(variant.image, variant.image_srcset);
    }

    variantButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const next = product.variants.find((v) => String(v.id) === button.getAttribute('data-k-variant'));
        if (!next) return;
        variant = next;
        render();
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      });
    });

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => selectImage(thumb.getAttribute('data-src'), thumb.getAttribute('data-srcset')));
    });

    root.querySelectorAll('[data-k-qty]').forEach((button) => {
      button.addEventListener('click', () => {
        qtyInput.value = Math.max(1, quantity() + Number(button.getAttribute('data-k-qty')));
        render();
      });
    });
    qtyInput.addEventListener('change', render);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      addButton.disabled = true;
      try {
        await addToCart([{ id: variant.id, quantity: quantity() }]);
        addButton.textContent = t('added');
        setTimeout(() => {
          addButton.disabled = !variant.available;
          addButton.textContent = variant.available ? t('add_to_cart') : t('sold_out');
        }, 1400);
      } catch (error) {
        addButton.disabled = false;
        window.alert(error.message);
      }
    });

    if (stickyButton) {
      stickyButton.addEventListener('click', () => {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    }

    /* The sticky bar appears once the main add-to-cart button scrolls out of view */
    if (sticky && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        sticky.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
      observer.observe(addButton);
    }

    render();
  }

  document.querySelectorAll('[data-k-product]').forEach(initProduct);

  /* Bundle: adds this product and up to two from the same house */
  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('[data-k-add-many]');
    if (!button) return;
    const ids = button.getAttribute('data-k-add-many').split(',').filter(Boolean);
    button.setAttribute('aria-disabled', 'true');
    try {
      await addToCart(ids.map((id) => ({ id: id, quantity: 1 })));
    } catch (error) {
      window.alert(error.message);
    } finally {
      button.removeAttribute('aria-disabled');
    }
  });

  /* Product recommendations (À associer) */
  document.querySelectorAll('[data-k-recommendations]').forEach(async (el) => {
    const url = el.getAttribute('data-url');
    if (!url) return;
    try {
      const response = await fetch(url);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = doc.querySelector('[data-k-recommendations]');
      if (fresh && fresh.innerHTML.trim()) {
        el.innerHTML = fresh.innerHTML;
        el.hidden = false;
      }
    } catch (error) {
      /* Recommendations are optional — leave the block hidden */
    }
  });

  /* ----------------------------------------------------------------- quiz */

  const quiz = document.querySelector('[data-k-quiz]');

  function initQuiz() {
    const dataEl = document.querySelector('[data-k-quiz-json]');
    const data = JSON.parse(dataEl.textContent);
    const stepLabel = quiz.querySelector('[data-k-quiz-step]');
    const asking = quiz.querySelector('[data-k-quiz-asking]');
    const question = quiz.querySelector('[data-k-quiz-question]');
    const options = quiz.querySelector('[data-k-quiz-options]');
    const result = quiz.querySelector('[data-k-quiz-result]');
    const picks = quiz.querySelector('[data-k-quiz-picks]');
    const addAll = quiz.querySelector('[data-k-quiz-add-all]');
    let step = 0;
    let answers = [];

    function cardHtml(product) {
      return (
        '<div class="k-card k-card--compact">' +
        '<a class="k-card__media" href="' + escapeHtml(product.url) + '">' +
        (product.image ? '<img src="' + escapeHtml(product.image) + '" alt="" loading="lazy">' : '') +
        '</a>' +
        '<div class="k-card__body">' +
        '<div class="k-card__brand">' + escapeHtml(product.vendor) + '</div>' +
        '<a class="k-card__name" href="' + escapeHtml(product.url) + '">' + escapeHtml(product.title) + '</a>' +
        '<div class="k-card__foot"><span class="k-card__price">' + money(product.price) + '</span>' +
        '<form data-k-add><input type="hidden" name="id" value="' + escapeHtml(product.variant) + '">' +
        '<button type="submit" class="k-text-add">' + escapeHtml(t('quick_add')) + '</button></form>' +
        '</div></div></div>'
      );
    }

    function render() {
      const done = step >= data.questions.length;
      asking.hidden = done;
      result.hidden = !done;
      if (!done) {
        const current = data.questions[step];
        stepLabel.textContent = t('quiz_step', { step: step + 1, total: data.questions.length });
        question.textContent = decode(current.q);
        options.innerHTML = current.options
          .map((option, index) => '<button type="button" class="k-quiz__option" data-index="' + index + '">' + escapeHtml(decode(option.label)) + '</button>')
          .join('');
        return;
      }
      stepLabel.textContent = t('quiz_result');
      /* As in the design: the first three products, in collection order, matching any answered concern */
      const wanted = answers.filter(Boolean);
      const matches = data.products
        .filter((product) => product.concerns.some((concern) => wanted.indexOf(concern) !== -1))
        .slice(0, 3);
      const selection = matches.length ? matches : data.products.slice(0, 3);
      picks.innerHTML = selection.map(cardHtml).join('');
      addAll.setAttribute('data-k-add-many', selection.map((p) => p.variant).join(','));
    }

    options.addEventListener('click', (event) => {
      const button = event.target instanceof Element && event.target.closest('[data-index]');
      if (!button) return;
      const option = data.questions[step].options[Number(button.getAttribute('data-index'))];
      answers.push(option.concern);
      step += 1;
      render();
    });

    quiz.querySelector('[data-k-quiz-restart]').addEventListener('click', () => {
      step = 0;
      answers = [];
      render();
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-k-quiz-open]')) {
        event.preventDefault();
        step = 0;
        answers = [];
        render();
        closeLayer(drawer);
        openLayer(quiz);
      }
      if (target.closest('[data-k-quiz-close]')) closeLayer(quiz);
    });
  }

  if (quiz) initQuiz();

  /* Open the quiz from a `#diagnostic` link (e.g. menu items or buttons) */
  if (quiz && window.location.hash === '#diagnostic') {
    const opener = document.querySelector('[data-k-quiz-open]');
    if (opener) opener.click();
  }

  /* ------------------------------------------------------ institut booking */

  document.querySelectorAll('[data-k-booking]').forEach((root) => {
    const buttons = Array.from(root.querySelectorAll('[data-k-treatment]'));
    const selected = root.querySelector('[data-k-treatment-selected]');
    const field = root.querySelector('[data-k-treatment-field]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
        const label = button.getAttribute('data-k-treatment');
        if (selected) selected.textContent = t('treatment_selected', { treatment: label });
        if (field) field.value = label;
      });
    });
  });

  /* ------------------------------------------------------------ load more */

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-k-load-more-link]');
    if (!link) return;
    const block = link.closest('[data-k-load-more]');
    const grid = document.querySelector('.k-grid--shop');
    if (!block || !grid) return;
    event.preventDefault();
    link.setAttribute('aria-busy', 'true');
    fetch(link.href, { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const nextGrid = doc.querySelector('.k-grid--shop');
        const nextBlock = doc.querySelector('[data-k-load-more]');
        if (!nextGrid) throw new Error('grid');
        const firstNew = nextGrid.firstElementChild;
        Array.from(nextGrid.children).forEach((card) => grid.appendChild(document.importNode(card, true)));
        if (nextBlock) {
          const back = nextBlock.querySelector('.k-load-more__back');
          if (back) back.remove();
          block.replaceWith(document.importNode(nextBlock, true));
        } else {
          block.remove();
        }
        /* Move focus to the first new product for keyboard and screen-reader users */
        const focusTarget = firstNew && grid.children[grid.children.length - nextGrid.children.length] && grid.children[grid.children.length - nextGrid.children.length].querySelector('.k-card__name');
        if (focusTarget) focusTarget.focus({ preventScroll: true });
      })
      .catch(() => {
        window.location.href = link.href;
      });
  });

  /* --------------------------------------------------------- hero carousel */

  function initCarousel(root) {
    if (root.dataset.kCarouselReady) return;
    root.dataset.kCarouselReady = 'true';
    const track = root.querySelector('[data-k-carousel-track]');
    const slides = Array.from(root.querySelectorAll('[data-k-carousel-slide]'));
    const dots = Array.from(root.querySelectorAll('[data-k-carousel-dot]'));
    if (!track || slides.length < 2) return;
    let current = 0;
    let timer = null;
    const delay = Number(root.getAttribute('data-k-carousel-autoplay')) || 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function sync() {
      const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      current = Math.min(Math.max(index, 0), slides.length - 1);
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
      slides.forEach((slide, i) => slide.toggleAttribute('inert', i !== current));
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (delay && !reduceMotion) timer = window.setInterval(() => goTo(current + 1), delay);
    }

    let frame = null;
    track.addEventListener('scroll', () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(sync);
    });
    const prev = root.querySelector('[data-k-carousel-prev]');
    const next = root.querySelector('[data-k-carousel-next]');
    if (prev) prev.addEventListener('click', () => { goTo(current - 1); start(); });
    if (next) next.addEventListener('click', () => { goTo(current + 1); start(); });
    dots.forEach((dot) => dot.addEventListener('click', () => { goTo(Number(dot.getAttribute('data-k-carousel-dot'))); start(); }));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    /* Theme editor: show the slide being edited */
    document.addEventListener('shopify:block:select', (event) => {
      const index = slides.indexOf(event.target);
      if (index > -1) { stop(); goTo(index); }
    });
    document.addEventListener('shopify:block:deselect', start);

    sync();
    start();
  }

  document.querySelectorAll('[data-k-carousel]').forEach(initCarousel);
  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll('[data-k-carousel]').forEach(initCarousel);
  });

  /* ------------------------------------------------------------------ init */

  window.Kapsule = Object.assign(K, { addToCart: addToCart, openCart: openCart, fetchCart: fetchCart, money: money });

  if (document.querySelector('[data-k-ship]') || drawer) fetchCart();
})();
