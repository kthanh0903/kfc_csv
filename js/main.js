/**
 * js/main.js
 * Điểm khởi chạy chính của ứng dụng KFC Landing Page
 */

import { loadCSV, downloadCSV } from './csv.js';
import { 
  loadCart, addToCart, updateQty, removeFromCart, 
  applyPromoCode, getCartTotal 
} from './cart.js';
import { 
  renderPromotions, renderMenu, renderCombos, 
  renderStores, renderReviews, renderCart, 
  showToast, renderSkeleton, renderGlobalError, 
  formatPrice, escapeHTML 
} from './render.js';
import { openCheckout } from './checkout.js';

// Trạng thái toàn cục của ứng dụng
const state = {
  menu: [],
  combos: [],
  promotions: [],
  stores: [],
  reviews: [],
  cart: [],
  appliedPromo: null,
  activeCategory: 'all',
  searchQuery: '',
  sortOrder: 'popular'
};

/**
 * Hàm khởi chạy ứng dụng khi DOM sẵn sàng
 */
async function init() {
  showInitialSkeletons();

  try {
    const [menu, combos, promotions, stores, reviews] = await Promise.all([
      loadCSV('data/menu.csv'),
      loadCSV('data/combos.csv'),
      loadCSV('data/promotions.csv'),
      loadCSV('data/stores.csv'),
      loadCSV('data/reviews.csv')
    ]);

    Object.assign(state, { menu, combos, promotions, stores, reviews });
    state.cart = loadCart();

    // In kiểm tra dữ liệu theo T3 của TASKS.md
    console.log('✅ Nạp dữ liệu CSV thành công:');
    console.table(menu);
    console.table(combos);
    console.table(promotions);
    console.table(stores);
    console.table(reviews);

    renderAllSections();
    initEventListeners();
    initHeroCountdown();
    initScrollEffects();
  } catch (error) {
    console.error('Lỗi khởi tạo:', error);
    renderGlobalError('Không thể nạp dữ liệu từ các file CSV. Vui lòng kiểm tra kết nối hoặc đường dẫn.', init);
  }
}

function showInitialSkeletons() {
  renderSkeleton('menu-grid', 6);
  renderSkeleton('combos-grid', 3);
  renderSkeleton('stores-grid', 4);
}

function renderAllSections() {
  renderPromotions(state.promotions);
  applyMenuFilters();
  renderCombos(state.combos, state.menu);
  populateStoreFilters();
  renderStores(state.stores, 'all');
  renderReviews(state.reviews);
  renderCart(state.cart, state, state.appliedPromo);
  populateBookingStores();
}

/**
 * Lọc và hiển thị thực đơn theo Tab, Tìm kiếm và Sắp xếp
 */
function applyMenuFilters() {
  let list = [...state.menu];

  if (state.activeCategory !== 'all') {
    list = list.filter(item => item.category === state.activeCategory);
  }

  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    list = list.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query))
    );
  }

  if (state.sortOrder === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (state.sortOrder === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else {
    list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  renderMenu(list);
}

/**
 * Đổ danh sách quận vào bộ lọc Cửa hàng
 */
function populateStoreFilters() {
  const select = document.getElementById('store-district-filter');
  if (!select) return;

  const districts = [...new Set(state.stores.map(s => s.district).filter(Boolean))];
  select.innerHTML = '<option value="all">Tất cả quận/huyện</option>' + 
    districts.map(d => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('');
}

/**
 * Đổ danh sách cửa hàng vào Form Đặt bàn
 */
function populateBookingStores() {
  const select = document.getElementById('booking-store');
  if (!select) return;

  select.innerHTML = '<option value="">-- Chọn cửa hàng gần bạn --</option>' +
    state.stores.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} (${escapeHTML(s.district)})</option>`).join('');
}

/**
 * Đồng hồ đếm ngược cho khuyến mãi nổi bật ở Hero
 */
function initHeroCountdown() {
  const countdownEl = document.getElementById('hero-countdown');
  if (!countdownEl) return;

  const featured = state.promotions.find(p => p.is_featured) || state.promotions[0];
  if (!featured || !featured.end_date) {
    countdownEl.style.display = 'none';
    return;
  }

  const targetDate = new Date(`${featured.end_date}T23:59:59`).getTime();

  function update() {
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownEl.innerHTML = '<span class="countdown-expired">Ưu đãi đã kết thúc</span>';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const pad = n => String(n).padStart(2, '0');
    countdownEl.innerHTML = `
      <div class="countdown-item"><span class="countdown-num">${pad(days)}</span><span class="countdown-label">Ngày</span></div>
      <div class="countdown-item"><span class="countdown-num">${pad(hours)}</span><span class="countdown-label">Giờ</span></div>
      <div class="countdown-item"><span class="countdown-num">${pad(mins)}</span><span class="countdown-label">Phút</span></div>
      <div class="countdown-item"><span class="countdown-num">${pad(secs)}</span><span class="countdown-label">Giây</span></div>
    `;
  }

  update();
  setInterval(update, 1000);
}

/**
 * Thiết lập các sự kiện tương tác của ứng dụng
 */
function initEventListeners() {
  initCartEvents();
  initMenuControlEvents();
  initDrawerAndModalEvents();
  initBookingFormEvents();
  initHeaderAndNavEvents();
}

/**
 * Sự kiện thêm món, xoá, tăng giảm giỏ hàng
 */
function initCartEvents() {
  document.addEventListener('click', e => {
    const addBtn = e.target.closest('.btn-add-cart');
    if (addBtn) {
      const id = addBtn.dataset.id;
      const type = addBtn.dataset.type || 'item';
      state.cart = addToCart(id, type);
      renderCart(state.cart, state, state.appliedPromo);
      animateCartBadge();
      showToast('Đã thêm vào giỏ hàng! 🍗', 'success');
      return;
    }

    const qtyBtn = e.target.closest('.btn-qty');
    if (qtyBtn) {
      const id = qtyBtn.dataset.id;
      const delta = qtyBtn.dataset.action === 'increase' ? 1 : -1;
      state.cart = updateQty(id, delta);
      renderCart(state.cart, state, state.appliedPromo);
      return;
    }

    const removeBtn = e.target.closest('.btn-remove-item');
    if (removeBtn) {
      state.cart = removeFromCart(removeBtn.dataset.id);
      renderCart(state.cart, state, state.appliedPromo);
      showToast('Đã xoá món khỏi giỏ.', 'info');
      return;
    }

    const copyBtn = e.target.closest('.btn-copy-code');
    if (copyBtn) {
      const code = copyBtn.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Đã sao chép mã ${code}!`, 'success');
      }).catch(() => {
        showToast(`Mã: ${code}`, 'info');
      });
    }
  });

  const applyPromoBtn = document.getElementById('btn-apply-promo');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', handleApplyPromo);
  }
}

function handleApplyPromo() {
  const input = document.getElementById('input-promo-code');
  if (!input) return;

  const { subtotal } = getCartTotal(state, state.cart, null);
  const result = applyPromoCode(input.value, subtotal, state.promotions);

  if (result.ok) {
    state.appliedPromo = result.promo;
    showToast(result.message, 'success');
  } else {
    state.appliedPromo = null;
    showToast(result.message, 'error');
  }
  renderCart(state.cart, state, state.appliedPromo);
}

function animateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  badge.classList.remove('bounce');
  void badge.offsetWidth;
  badge.classList.add('bounce');
}

/**
 * Sự kiện điều khiển Thực đơn và Cửa hàng
 */
function initMenuControlEvents() {
  const tabsContainer = document.getElementById('menu-category-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category || 'all';
      applyMenuFilters();
    });
  }

  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value.trim();
      applyMenuFilters();
    });
  }

  const sortSelect = document.getElementById('menu-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      state.sortOrder = e.target.value;
      applyMenuFilters();
    });
  }

  const storeFilter = document.getElementById('store-district-filter');
  if (storeFilter) {
    storeFilter.addEventListener('change', e => {
      renderStores(state.stores, e.target.value);
    });
  }
}

/**
 * Sự kiện mở/đóng Giỏ hàng drawer & Popup thanh toán
 */
function initDrawerAndModalEvents() {
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const openCartBtn = document.getElementById('btn-open-cart');
  const closeCartBtn = document.getElementById('btn-close-cart');
  const checkoutBtn = document.getElementById('btn-checkout');

  const toggleCart = open => {
    if (!cartDrawer) return;
    cartDrawer.classList.toggle('is-open', open);
    cartDrawer.setAttribute('aria-hidden', !open);
    if (cartOverlay) cartOverlay.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
  if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      toggleCart(false);
      openCheckout({ state, appliedPromo: state.appliedPromo });
    });
  }

  // Lắng nghe sự kiện hoàn tất đơn hàng từ module Thanh Toán
  window.addEventListener('orderCompleted', () => {
    state.cart = [];
    state.appliedPromo = null;
    renderCart(state.cart, state, null);
  });
}

/**
 * Xử lý Form đặt bàn và xuất CSV
 */
function initBookingFormEvents() {
  const form = document.getElementById('booking-form');
  const exportBtn = document.getElementById('btn-export-bookings');

  if (form) {
    form.addEventListener('submit', handleBookingSubmit);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportBookings);
  }
}

function handleBookingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  clearBookingErrors();

  const fullName = form.full_name.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();
  const storeId = form.store_id.value;
  const date = form.date.value;
  const time = form.time.value;
  const guests = Number(form.guests.value);

  let hasError = false;

  if (!fullName) {
    showFieldError('full_name', 'Vui lòng nhập họ và tên');
    hasError = true;
  }
  if (!/^0[0-9]{9}$/.test(phone)) {
    showFieldError('phone', 'SĐT không hợp lệ (10 số, bắt đầu bằng 0)');
    hasError = true;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('email', 'Email không đúng định dạng');
    hasError = true;
  }
  if (!storeId) {
    showFieldError('store_id', 'Vui lòng chọn cửa hàng');
    hasError = true;
  }
  if (!date) {
    showFieldError('date', 'Vui lòng chọn ngày');
    hasError = true;
  }
  if (!time) {
    showFieldError('time', 'Vui lòng chọn giờ');
    hasError = true;
  }
  if (!guests || guests < 1) {
    showFieldError('guests', 'Số lượng khách ít nhất là 1');
    hasError = true;
  }

  if (hasError) return;

  const storeObj = state.stores.find(s => s.id === storeId);
  const newBooking = {
    created_at: new Date().toISOString(),
    full_name: fullName,
    phone,
    email: email || '',
    store_id: storeId,
    store_name: storeObj ? storeObj.name : storeId,
    date,
    time,
    guests
  };

  saveBookingToStorage(newBooking);
  form.reset();
  showToast('Đặt bàn thành công! Cửa hàng đã ghi nhận.', 'success');
}

function showFieldError(fieldName, msg) {
  const errorEl = document.getElementById(`error-${fieldName}`);
  if (errorEl) errorEl.textContent = msg;
}

function clearBookingErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

function saveBookingToStorage(booking) {
  try {
    const raw = localStorage.getItem('bookings');
    const bookings = raw ? JSON.parse(raw) : [];
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
  } catch (err) {
    console.error('Lỗi lưu đặt bàn:', err);
  }
}

function handleExportBookings() {
  try {
    const raw = localStorage.getItem('bookings');
    const bookings = raw ? JSON.parse(raw) : [];
    if (bookings.length === 0) {
      showToast('Chưa có dữ liệu đặt bàn nào để xuất!', 'info');
      return;
    }

    const columns = ['created_at', 'full_name', 'phone', 'email', 'store_id', 'date', 'time', 'guests'];
    downloadCSV('bookings.csv', bookings, columns);
    showToast('Đã tải xuống file bookings.csv thành công!', 'success');
  } catch (err) {
    console.error('Lỗi khi xuất CSV:', err);
    showToast('Lỗi khi xuất file CSV.', 'error');
  }
}

/**
 * Hiệu ứng Header, Menu Hamburger và Cuộn trang
 */
function initHeaderAndNavEvents() {
  const hamburgerBtn = document.getElementById('btn-hamburger');
  const navMenu = document.getElementById('nav-menu');

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section, .reveal-on-scroll').forEach(section => {
    section.classList.add('reveal-on-scroll');
    observer.observe(section);
  });
}

// Khởi chạy khi DOM load xong
document.addEventListener('DOMContentLoaded', init);
