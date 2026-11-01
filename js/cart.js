/**
 * js/cart.js
 * Quản lý giỏ hàng và lưu trữ đơn hàng với localStorage
 */

const CART_KEY = 'cart';
const ORDERS_KEY = 'orders';

/**
 * Tải danh sách món trong giỏ hàng từ localStorage
 * @returns {Array<{id: string, type: 'item'|'combo', qty: number}>}
 */
export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Không thể đọc giỏ hàng:', e);
    return [];
  }
}

/**
 * Lưu danh sách món trong giỏ hàng vào localStorage
 * @param {Array} cartItems
 */
export function saveCart(cartItems) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  } catch (e) {
    console.error('Không thể lưu giỏ hàng:', e);
  }
}

/**
 * Thêm một món hoặc combo vào giỏ hàng
 * @param {string} id - Mã món (Mxxx) hoặc combo (Cxxx)
 * @param {'item'|'combo'} type
 * @returns {Array} - Danh sách giỏ hàng sau khi thêm
 */
export function addToCart(id, type = 'item') {
  const cart = loadCart();
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, type, qty: 1 });
  }

  saveCart(cart);
  return cart;
}

/**
 * Cập nhật số lượng của một món trong giỏ
 * @param {string} id
 * @param {number} delta - Số lượng thay đổi (+1 hoặc -1)
 * @returns {Array}
 */
export function updateQty(id, delta) {
  let cart = loadCart();
  const item = cart.find(entry => entry.id === id);

  if (!item) return cart;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(entry => entry.id !== id);
  }

  saveCart(cart);
  return cart;
}

/**
 * Xoá hẳn một món khỏi giỏ hàng
 * @param {string} id
 * @returns {Array}
 */
export function removeFromCart(id) {
  const cart = loadCart().filter(item => item.id !== id);
  saveCart(cart);
  return cart;
}

/**
 * Tính toán chi tiết giá trị giỏ hàng
 * @param {Object} state - Chứa { menu, combos, promotions }
 * @param {Array} cartItems
 * @param {Object|null} appliedPromo - Khuyến mãi đang chọn
 * @returns {{ subtotal: number, discount: number, total: number, count: number, validPromo: boolean }}
 */
export function getCartTotal(state, cartItems, appliedPromo = null) {
  let subtotal = 0;
  let count = 0;

  for (const entry of cartItems) {
    count += entry.qty;
    if (entry.type === 'combo') {
      const combo = state.combos.find(c => c.id === entry.id);
      if (combo) subtotal += combo.combo_price * entry.qty;
    } else {
      const item = state.menu.find(m => m.id === entry.id);
      if (item) subtotal += item.price * entry.qty;
    }
  }

  let discount = 0;
  let validPromo = false;

  if (appliedPromo && subtotal >= appliedPromo.min_order) {
    validPromo = true;
    if (appliedPromo.discount_type === 'percent') {
      discount = Math.floor((subtotal * appliedPromo.discount_value / 100) / 1000) * 1000;
    } else {
      discount = Math.min(appliedPromo.discount_value, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total, count, validPromo };
}

/**
 * Kiểm tra và áp dụng mã khuyến mãi
 * @param {string} code - Mã do người dùng nhập
 * @param {number} subtotal - Tổng phụ giỏ hàng
 * @param {Array} promotions - Danh sách khuyến mãi
 * @returns {{ ok: boolean, promo?: Object, discount?: number, message: string }}
 */
export function applyPromoCode(code, subtotal, promotions) {
  if (!code || !code.trim()) {
    return { ok: false, message: 'Vui lòng nhập mã khuyến mãi.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const promo = promotions.find(p => p.code.toUpperCase() === cleanCode);

  if (!promo) {
    return { ok: false, message: 'Mã khuyến mãi không hợp lệ hoặc không tồn tại.' };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (todayStr < promo.start_date) {
    return { ok: false, message: `Mã chỉ áp dụng từ ngày ${promo.start_date}.` };
  }

  if (todayStr > promo.end_date) {
    return { ok: false, message: 'Mã khuyến mãi này đã hết hạn sử dụng.' };
  }

  if (subtotal < promo.min_order) {
    const minOrderFormatted = new Intl.NumberFormat('vi-VN').format(promo.min_order) + ' ₫';
    return { ok: false, message: `Đơn hàng chưa đạt mức tối thiểu ${minOrderFormatted}.` };
  }

  let discount = 0;
  if (promo.discount_type === 'percent') {
    discount = Math.floor((subtotal * promo.discount_value / 100) / 1000) * 1000;
  } else {
    discount = Math.min(promo.discount_value, subtotal);
  }

  return { ok: true, promo, discount, message: `Áp dụng mã ${promo.code} thành công!` };
}

/**
 * Xác nhận đơn hàng và lưu vào localStorage
 * @param {Object} orderData
 * @returns {Object} Đơn hàng đã tạo
 */
export function checkout(orderData) {
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    created_at: new Date().toISOString(),
    ...orderData
  };

  try {
    const rawOrders = localStorage.getItem(ORDERS_KEY);
    const orders = rawOrders ? JSON.parse(rawOrders) : [];
    orders.push(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Lỗi khi lưu đơn hàng:', e);
  }

  // Xoá giỏ hàng sau khi đặt thành công
  saveCart([]);
  return newOrder;
}
