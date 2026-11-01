/**
 * js/render.js
 * Quản lý kết xuất giao diện HTML và thông báo (Toast)
 */

import { getCartTotal } from './cart.js';

const CATEGORY_EMOJIS = {
  chicken: '🍗',
  burger: '🍔',
  side: '🍟',
  drink: '🥤',
  dessert: '🍦'
};

/**
 * Định dạng số thành tiền tệ VNĐ chuẩn
 * @param {number} number
 * @returns {string}
 */
export function formatPrice(number) {
  return new Intl.NumberFormat('vi-VN').format(number || 0) + ' ₫';
}

/**
 * Thoát mã HTML chống lỗi bảo mật XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Hiển thị thông báo Toast góc màn hình
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 */
export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast toast-show toast-${type}`;

  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

/**
 * Hiển thị danh sách khuyến mãi
 * @param {Array} promotions
 */
export function renderPromotions(promotions) {
  const container = document.getElementById('promotions-list');
  if (!container) return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const activePromos = promotions.filter(p => p.end_date >= todayStr);

  if (activePromos.length === 0) {
    container.innerHTML = '<p class="empty-msg">Hiện chưa có khuyến mãi mới.</p>';
    return;
  }

  container.innerHTML = activePromos.map(createPromoCard).join('');
}

function createPromoCard(promo) {
  const safeTitle = escapeHTML(promo.title);
  const safeDesc = escapeHTML(promo.description);
  const safeCode = escapeHTML(promo.code);
  const promoDetails = [];
  if (promo.min_order > 0) {
    promoDetails.push(`Đơn từ: ${formatPrice(promo.min_order)}`);
  }
  if (promo.max_discount) {
    promoDetails.push(`Tối đa: ${formatPrice(promo.max_discount)}`);
  }
  if (promo.date_rule === 'day_equals_month') {
    promoDetails.push('Áp dụng ngày trùng tháng');
  } else {
    promoDetails.push(`HSD: ${escapeHTML(promo.end_date)}`);
  }

  return `
    <article class="promo-card">
      <div class="promo-badge">${promo.discount_type === 'percent' ? `GIẢM ${promo.discount_value}%` : `GIẢM ${formatPrice(promo.discount_value)}`}</div>
      <h3 class="promo-title">${safeTitle}</h3>
      <p class="promo-desc">${safeDesc}</p>
      <div class="promo-meta">
        ${promoDetails.map(detail => `<span>${detail}</span>`).join('')}
      </div>
      <div class="promo-action">
        <code class="promo-code">${safeCode}</code>
        <button class="btn btn-secondary btn-copy-code" data-code="${safeCode}" aria-label="Sao chép mã ${safeCode}">
          Sao chép
        </button>
      </div>
    </article>
  `;
}

/**
 * Hiển thị thực đơn món ăn
 * @param {Array} items
 */
export function renderMenu(items) {
  const container = document.getElementById('menu-grid');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="empty-msg">Không tìm thấy món phù hợp 😢</p>';
    return;
  }

  container.innerHTML = items.map(createMenuItemCard).join('');
}

function createMenuItemCard(item) {
  const safeName = escapeHTML(item.name);
  const safeDesc = escapeHTML(item.description);
  const categoryEmoji = CATEGORY_EMOJIS[item.category] || '🍗';

  const tagsHTML = (item.tags || []).map(tag => {
    if (tag === 'bestseller') return '<span class="tag tag-bestseller">🔥 Bán chạy</span>';
    if (tag === 'spicy') return '<span class="tag tag-spicy">🌶️ Cay</span>';
    if (tag === 'new') return '<span class="tag tag-new">🆕 Mới</span>';
    return '';
  }).join('');

  const imageHTML = item.image 
    ? `<img src="${escapeHTML(item.image)}" alt="${safeName}" width="400" height="400" loading="lazy" class="item-img">`
    : `<div class="item-placeholder-img" aria-label="${safeName}"><span class="item-emoji">${categoryEmoji}</span></div>`;

  const buttonHTML = item.is_available
    ? `<button class="btn btn-primary btn-add-cart" data-id="${escapeHTML(item.id)}" data-type="item" aria-label="Thêm ${safeName} vào giỏ">+ Thêm</button>`
    : `<button class="btn btn-disabled" disabled aria-disabled="true">Tạm hết</button>`;

  return `
    <article class="menu-card ${item.is_available ? '' : 'is-unavailable'}">
      <div class="card-media">
        ${imageHTML}
        <div class="card-tags">${tagsHTML}</div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${safeName}</h3>
        <p class="card-desc">${safeDesc}</p>
        <div class="card-footer">
          <span class="card-price">${formatPrice(item.price)}</span>
          ${buttonHTML}
        </div>
      </div>
    </article>
  `;
}

/**
 * Hiển thị danh sách Combo tiết kiệm
 * @param {Array} combos
 * @param {Array} menu
 */
export function renderCombos(combos, menu) {
  const container = document.getElementById('combos-grid');
  if (!container) return;

  const featured = combos.filter(c => c.is_featured);
  container.innerHTML = featured.map(combo => createComboCard(combo, menu)).join('');
}

function createComboCard(combo, menu) {
  const safeName = escapeHTML(combo.name);
  const parsedItems = parseComboItems(combo.items, menu);
  const originalPrice = parsedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const savingsPercent = originalPrice > 0 
    ? Math.round(((originalPrice - combo.combo_price) / originalPrice) * 100) 
    : 0;

  const itemsListHTML = parsedItems.map(item => `
    <li><strong>${item.qty}x</strong> ${escapeHTML(item.name)}</li>
  `).join('');

  return `
    <article class="combo-card">
      <div class="combo-header">
        <span class="combo-badge">Tiết kiệm ${savingsPercent}%</span>
        <h3 class="combo-title">${safeName}</h3>
      </div>
      <ul class="combo-items-list">${itemsListHTML}</ul>
      <div class="combo-footer">
        <div class="combo-pricing">
          <del class="original-price">${formatPrice(originalPrice)}</del>
          <span class="combo-price">${formatPrice(combo.combo_price)}</span>
        </div>
        <button class="btn btn-primary btn-add-cart" data-id="${escapeHTML(combo.id)}" data-type="combo" aria-label="Thêm ${safeName} vào giỏ">
          + Thêm Combo
        </button>
      </div>
    </article>
  `;
}

function parseComboItems(itemsStr, menu) {
  if (!itemsStr) return [];
  return itemsStr.split('|').map(segment => {
    const [itemId, qtyStr] = segment.split(':');
    const menuItem = menu.find(m => m.id === itemId);
    return {
      id: itemId,
      qty: Number(qtyStr) || 1,
      name: menuItem ? menuItem.name : itemId,
      price: menuItem ? menuItem.price : 0
    };
  });
}

/**
 * Hiển thị danh sách Cửa hàng
 * @param {Array} stores
 * @param {string} district
 */
export function renderStores(stores, district = 'all') {
  const container = document.getElementById('stores-grid');
  if (!container) return;

  const filtered = (district === 'all' || !district)
    ? stores
    : stores.filter(s => s.district === district);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-msg">Không tìm thấy cửa hàng tại khu vực này.</p>';
    return;
  }

  container.innerHTML = filtered.map(createStoreCard).join('');
}

function createStoreCard(store) {
  const safeName = escapeHTML(store.name);
  const safeAddress = escapeHTML(store.address);
  const safeDistrict = escapeHTML(store.district);
  const safePhone = escapeHTML(store.phone);
  const isOpen = checkStoreOpenStatus(store.open_time, store.close_time);

  return `
    <article class="store-card">
      <div class="store-top">
        <span class="district-badge">${safeDistrict}</span>
        <span class="status-badge ${isOpen ? 'status-open' : 'status-closed'}">
          ${isOpen ? '🟢 Đang mở cửa' : '🔴 Đã đóng cửa'}
        </span>
      </div>
      <h3 class="store-name">${safeName}</h3>
      <p class="store-address">📍 ${safeAddress}</p>
      <div class="store-info">
        <p class="store-hours">⏰ ${store.open_time} – ${store.close_time}</p>
        <p class="store-phone">
          <a href="tel:${safePhone}" class="store-tel-link">📞 ${safePhone}</a>
        </p>
      </div>
      <div class="store-action">
        <a href="https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}" 
           target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-directions">
          Chỉ đường ↗
        </a>
      </div>
    </article>
  `;
}

function checkStoreOpenStatus(openTime, closeTime) {
  if (!openTime || !closeTime) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const start = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  return currentMinutes >= start && currentMinutes < end;
}

/**
 * Hiển thị danh sách Đánh giá
 * @param {Array} reviews
 */
export function renderReviews(reviews) {
  const container = document.getElementById('reviews-track');
  if (!container) return;

  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p class="empty-msg">Chưa có đánh giá nào.</p>';
    return;
  }

  container.innerHTML = reviews.map(createReviewCard).join('');
}

function createReviewCard(review) {
  const safeName = escapeHTML(review.name);
  const safeContent = escapeHTML(review.content);
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, review.rating || 5)));

  return `
    <article class="review-card">
      <div class="review-stars" aria-label="${review.rating} sao">${stars}</div>
      <p class="review-content">"${safeContent}"</p>
      <div class="review-author">
        <div class="author-avatar">${safeName.charAt(0)}</div>
        <div class="author-meta">
          <span class="author-name">${safeName}</span>
          <span class="review-date">${escapeHTML(review.date || '')}</span>
        </div>
      </div>
    </article>
  `;
}

/**
 * Cập nhật giao diện Drawer giỏ hàng
 * @param {Array} cartItems
 * @param {Object} state
 * @param {Object|null} appliedPromo
 */
export function renderCart(cartItems, state, appliedPromo) {
  const drawerContainer = document.getElementById('cart-items-container');
  const badge = document.getElementById('cart-badge');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountEl = document.getElementById('cart-discount');
  const totalEl = document.getElementById('cart-total');
  const promoStatusEl = document.getElementById('cart-promo-status');
  const checkoutBtn = document.getElementById('btn-checkout');

  const { subtotal, discount, total, count, validPromo, promoMessage } = getCartTotal(state, cartItems, appliedPromo);

  if (badge) {
    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (discountEl) discountEl.textContent = `-${formatPrice(discount)}`;
  if (totalEl) totalEl.textContent = formatPrice(total);

  if (promoStatusEl) {
    if (appliedPromo && validPromo) {
      promoStatusEl.innerHTML = `<span class="promo-applied-tag">✅ Đã áp dụng: ${escapeHTML(appliedPromo.code)} (-${formatPrice(discount)})</span>`;
    } else if (appliedPromo && !validPromo) {
      promoStatusEl.innerHTML = `<span class="promo-warning-tag">⚠️ ${escapeHTML(promoMessage)}</span>`;
    } else {
      promoStatusEl.innerHTML = '';
    }
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = cartItems.length === 0;
  }

  if (!drawerContainer) return;

  if (cartItems.length === 0) {
    drawerContainer.innerHTML = `
      <div class="cart-empty-state">
        <span class="empty-icon">🍗</span>
        <p>Giỏ hàng của bạn đang trống</p>
        <p class="sub-text">Hãy chọn món ngon từ thực đơn nhé!</p>
      </div>
    `;
    return;
  }

  drawerContainer.innerHTML = cartItems.map(item => createCartItemRow(item, state)).join('');
}

function createCartItemRow(cartItem, state) {
  let title = '';
  let unitPrice = 0;
  let emoji = '🍗';

  if (cartItem.type === 'combo') {
    const combo = state.combos.find(c => c.id === cartItem.id);
    title = combo ? combo.name : cartItem.id;
    unitPrice = combo ? combo.combo_price : 0;
    emoji = '🍱';
  } else {
    const item = state.menu.find(m => m.id === cartItem.id);
    title = item ? item.name : cartItem.id;
    unitPrice = item ? item.price : 0;
    emoji = item ? (CATEGORY_EMOJIS[item.category] || '🍗') : '🍗';
  }

  const lineTotal = unitPrice * cartItem.qty;

  return `
    <div class="cart-row" data-id="${escapeHTML(cartItem.id)}">
      <div class="cart-row-thumb">${emoji}</div>
      <div class="cart-row-info">
        <h4 class="cart-row-name">${escapeHTML(title)}</h4>
        <span class="cart-row-price">${formatPrice(unitPrice)}</span>
      </div>
      <div class="cart-row-controls">
        <button class="btn-qty" data-action="decrease" data-id="${escapeHTML(cartItem.id)}" aria-label="Giảm">−</button>
        <span class="cart-qty-value">${cartItem.qty}</span>
        <button class="btn-qty" data-action="increase" data-id="${escapeHTML(cartItem.id)}" aria-label="Tăng">+</button>
      </div>
      <span class="cart-row-total">${formatPrice(lineTotal)}</span>
      <button class="btn-remove-item" data-id="${escapeHTML(cartItem.id)}" aria-label="Xoá món">✕</button>
    </div>
  `;
}

/**
 * Hiển thị khung tải dữ liệu dạng Skeleton
 * @param {string} containerId
 * @param {number} count
 */
export function renderSkeleton(containerId, count = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const skeletonCards = Array(count).fill(`
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-box skeleton-img"></div>
      <div class="skeleton-box skeleton-title"></div>
      <div class="skeleton-box skeleton-text"></div>
      <div class="skeleton-box skeleton-price"></div>
    </div>
  `).join('');

  container.innerHTML = skeletonCards;
}

/**
 * Hiển thị giao diện báo lỗi khi không nạp được dữ liệu
 * @param {string} message
 * @param {Function} retryFn
 */
export function renderGlobalError(message, retryFn) {
  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
    <div class="global-error-box">
      <div class="error-icon">⚠️</div>
      <h2>Đã có lỗi xảy ra</h2>
      <p>${escapeHTML(message)}</p>
      <button id="btn-global-retry" class="btn btn-primary">Thử lại</button>
    </div>
  `;

  const btn = document.getElementById('btn-global-retry');
  if (btn && typeof retryFn === 'function') {
    btn.addEventListener('click', retryFn);
  }
}
