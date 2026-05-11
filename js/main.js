document.addEventListener('DOMContentLoaded', async () => {

  /* ── Auth-aware header ── */
  async function updateAuthNav() {
    try {
      const { data: { session } } = await import('./supabase.js').then(m => m.default.auth.getSession());
      const user = session?.user;

      const loginLink = document.getElementById('nav-login-link');
      const registerLink = document.getElementById('nav-register-link');
      const accountLink = document.getElementById('nav-account-link');
      const logoutBtn = document.getElementById('nav-logout-btn');

      if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (accountLink) {
          accountLink.style.display = '';
          const nameEl = accountLink.querySelector('.nav-account-name');
          if (nameEl) {
            const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account';
            nameEl.textContent = name;
          }
        }
        if (logoutBtn) logoutBtn.style.display = '';
      } else {
        if (loginLink) loginLink.style.display = '';
        if (registerLink) registerLink.style.display = '';
        if (accountLink) accountLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    } catch (e) {
      // Supabase not available — keep default nav
    }
  }

  /* ── Logout handler ── */
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'nav-logout-btn' || e.target.closest('#nav-logout-btn')) {
      e.preventDefault();
      try {
        const { supabase } = await import('./supabase.js').then(m => ({ supabase: m.default }));
        await supabase.auth.signOut();
        sessionStorage.clear();
        window.location.href = 'index.html';
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
  });

  updateAuthNav();

  import('./supabase.js').then(m => m.default.auth.onAuthStateChange(() => {
    setTimeout(updateAuthNav, 100);
  }));

  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.pageYOffset > 50);
    }, { passive: true });
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const heroParticles = document.querySelector('.hero-particles');
  if (heroParticles) {
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        bottom: ${Math.random() * 40}%;
        width: ${1 + Math.random() * 3}px;
        height: ${1 + Math.random() * 3}px;
        animation-delay: ${Math.random() * 12}s;
        animation-duration: ${8 + Math.random() * 10}s;
        opacity: ${0.1 + Math.random() * 0.3};
      `;
      heroParticles.appendChild(p);
    }
  }

  /* ── Cart System ── */
  const CART_KEY = 'eebecco_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function updateCartUI() {
    const cart = getCart();
    const countEl = document.querySelector('.cart-count');
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

    if (countEl) {
      countEl.textContent = totalCount;
      countEl.classList.toggle('visible', totalCount > 0);
      countEl.style.transform = 'scale(1.4)';
      setTimeout(() => { countEl.style.transform = 'scale(1)'; }, 200);
    }

    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    const itemsEl = drawer.querySelector('.cart-items');
    const totalEl = drawer.querySelector('.cart-total-price');

    if (!itemsEl) return;

    if (cart.length === 0) {
      itemsEl.innerHTML = '<p style="text-align:center; color:rgba(245,236,215,0.4); padding:3rem 0; font-family:var(--font-display); font-size:1.1rem;">Your cart is empty</p>';
      if (totalEl) totalEl.textContent = 'S$0.00';
      return;
    }

    itemsEl.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-grade">${item.grade}</p>
          <p class="cart-item-price">S$${item.price.toFixed(2)}</p>
        </div>
        <div class="cart-item-actions">
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" data-action="minus" data-index="${i}">&minus;</button>
            <span class="cart-qty-value">${item.qty}</span>
            <button class="cart-qty-btn" data-action="plus" data-index="${i}">+</button>
          </div>
          <button class="cart-remove-btn" data-index="${i}" aria-label="Remove item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    if (totalEl) {
      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      totalEl.textContent = 'S$' + total.toFixed(2);
    }

    itemsEl.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        const cart = getCart();
        if (cart[idx]) {
          if (action === 'plus') cart[idx].qty++;
          else if (action === 'minus' && cart[idx].qty > 1) cart[idx].qty--;
          saveCart(cart);
          updateCartUI();
          updateHeaderCount();
        }
      });
    });

    itemsEl.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        updateCartUI();
        updateHeaderCount();
      });
    });
  }

  function updateHeaderCount() {
    const cart = getCart();
    const countEl = document.querySelector('.cart-count');
    if (countEl) {
      const total = cart.reduce((sum, item) => sum + item.qty, 0);
      countEl.textContent = total;
      countEl.classList.toggle('visible', total > 0);
    }
  }

  /* Cart Drawer */
  const cartBtn = document.querySelector('.cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCart = document.getElementById('close-cart');

  if (cartBtn && cartDrawer) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      updateCartUI();
    });
  }

  function closeCartDrawer() {
    cartDrawer?.classList.remove('open');
    cartOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeCart?.addEventListener('click', closeCartDrawer);
  cartOverlay?.addEventListener('click', closeCartDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer?.classList.contains('open')) closeCartDrawer();
  });

  /* Add to Cart — delegated for dynamic content (skip product-detail page — it has its own handler) */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    /* Skip on product.html — that page uses __addToCartFromDetail via onclick */
    if (document.querySelector('.product-detail')) return;
    const card = btn.closest('.product-card');
    if (!card) return;

    let name = card.querySelector('.product-card-title')?.textContent || '';
    let priceText = card.querySelector('.product-card-price, .product-info-price')?.textContent || '';
    let grade = card.querySelector('.product-card-grade, .product-info-grade')?.textContent || '';
    let image = card.querySelector('img')?.src || '';

    if (!name) {
      const titleEl = document.querySelector('.product-info-title');
      if (titleEl) name = titleEl.textContent;
    }
    if (!priceText) {
      const priceEl = document.querySelector('.product-info-price');
      if (priceEl) priceText = priceEl.textContent;
    }
    if (!grade) {
      const gradeEl = document.querySelector('.product-info-grade');
      if (gradeEl) grade = gradeEl.textContent;
    }

    const price = parseFloat(priceText.replace('S$', '').replace('$', '')) || 0;

    if (!name || price === 0) return;

    const cart = getCart();
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ name, price, grade, image, qty: 1 });
    }
    saveCart(cart);
    updateCartUI?.();
    updateHeaderCount?.();

    btn.textContent = 'Added ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
      btn.disabled = false;
    }, 1500);
  });

  /* Checkout button */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#checkout-btn');
    if (btn) {
      e.preventDefault();
      window.location.href = 'checkout.html';
    }
  });

  /* Initialize cart UI on page load */

  /* Quantity selector (product detail page) */
  document.querySelectorAll('.quantity-selector').forEach(qs => {
    const minus = qs.querySelector('.qty-minus');
    const plus  = qs.querySelector('.qty-plus');
    const val   = qs.querySelector('.qty-value');
    if (minus && plus && val) {
      minus.addEventListener('click', () => {
        const v = parseInt(val.textContent);
        if (v > 1) val.textContent = v - 1;
      });
      plus.addEventListener('click', () => {
        const v = parseInt(val.textContent);
        if (v < 10) val.textContent = v + 1;
      });
    }
  });

  const heroBg = document.querySelector('.hero-bg-img');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      heroBg.style.transform = `translateY(${window.pageYOffset * 0.25}px)`;
    }, { passive: true });
  }

  /* ── Reveal on scroll (IntersectionObserver) ── */
  function revealElements() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }
  window.revealElements = revealElements;
  revealElements();
});