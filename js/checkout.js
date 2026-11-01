/**
 * js/checkout.js
 * Module Thanh Toán (Checkout) cho KFC Landing Page
 * Quản lý phương thức thanh toán, xác thực thông tin, xử lý đơn hàng và xuất hoá đơn
 */

import { loadCart, saveCart, getCartTotal } from './cart.js';
import { formatPrice, escapeHTML, showToast } from './render.js';
import { downloadCSV } from './csv.js';

const ORDERS_STORAGE_KEY = 'orders';

/**
 * Danh mục các phương thức thanh toán hỗ trợ
 */
export const PAYMENT_METHODS = {
  cod: {
    id: 'cod',
    name: 'Tiền mặt khi nhận hàng (COD)',
    badge: 'Tiền mặt',
    icon: '💵',
    description: 'Thanh toán trực tiếp cho shipper khi nhận đồ ăn nóng hổi.',
    instructions: 'Vui lòng chuẩn bị sẵn tiền mặt đúng số tiền để nhận hàng nhanh nhất.'
  },
  banking: {
    id: 'banking',
    name: 'Chuyển khoản VietQR',
    badge: 'Khuyên dùng',
    icon: '🏦',
    description: 'Quét mã VietQR qua bất kỳ app ngân hàng nào.',
    bankInfo: {
      bankName: 'MBBank (Ngân hàng Quân Đội)',
      accountNumber: '0901234567',
      accountHolder: 'KFC GA GION DEMO'
    }
  },
  momo: {
    id: 'momo',
    name: 'Ví điện tử MoMo',
    badge: 'Ví điện tử',
    icon: '📱',
    description: 'Thanh toán tức thì qua ví điện tử MoMo.',
    momoPhone: '0901234567'
  }
};

/**
 * Kiểm tra tính hợp lệ của biểu mẫu thanh toán
 * @param {Object} data - Dữ liệu form nhập
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateCheckoutForm(data) {
  const errors = {};
  validateCustomerName((data.customer_name || '').trim(), errors);
  validateCustomerPhone((data.customer_phone || '').trim(), errors);
  validateCustomerAddress((data.customer_address || '').trim(), errors);
  validatePaymentMethod(data.payment_method || 'cod', errors);

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function validateCustomerName(name, errors) {
  if (!name) {
    errors.customer_name = 'Vui lòng nhập họ và tên người nhận.';
  } else if (name.length < 2) {
    errors.customer_name = 'Họ và tên phải có ít nhất 2 ký tự.';
  }
}

function validateCustomerPhone(phone, errors) {
  const phoneRegex = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  if (!phone) {
    errors.customer_phone = 'Vui lòng nhập số điện thoại.';
  } else if (!phoneRegex.test(phone)) {
    errors.customer_phone = 'Số điện thoại không hợp lệ (10 số, VD: 0901234567).';
  }
}

function validateCustomerAddress(address, errors) {
  if (!address) {
    errors.customer_address = 'Vui lòng nhập địa chỉ giao hàng chi tiết.';
  } else if (address.length < 6) {
    errors.customer_address = 'Địa chỉ quá ngắn, vui lòng ghi rõ số nhà, tên đường.';
  }
}

function validatePaymentMethod(paymentMethod, errors) {
  if (!PAYMENT_METHODS[paymentMethod]) {
    errors.payment_method = 'Phương thức thanh toán không hợp lệ.';
  }
}

/**
 * Xây dựng payload hoàn chỉnh của đơn hàng
 * @param {Object} params
 * @returns {Object}
 */
export function createOrderPayload({ customer, cartItems, state, appliedPromo }) {
  const { subtotal, discount, total } = getCartTotal(state, cartItems, appliedPromo);
  const detailedItems = mapCartItemsDetailed(cartItems, state);
  const itemsSummary = detailedItems.map(item => `${item.qty}x ${item.name}`).join(', ');
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const methodObj = PAYMENT_METHODS[customer.payment_method] || PAYMENT_METHODS.cod;

  return {
    id: orderId,
    created_at: new Date().toISOString(),
    customer_name: customer.customer_name.trim(),
    customer_phone: customer.customer_phone.trim(),
    customer_address: customer.customer_address.trim(),
    customer_notes: (customer.customer_notes || '').trim(),
    delivery_time: customer.delivery_time || 'Càng sớm càng tốt (30-45 phút)',
    payment_method: methodObj.id,
    payment_method_name: methodObj.name,
    payment_status: methodObj.id === 'cod' ? 'Chưa thanh toán (COD)' : 'Chờ xác nhận',
    items: detailedItems,
    items_summary: itemsSummary,
    subtotal,
    discount,
    shipping_fee: 0,
    total,
    promo_code: appliedPromo ? appliedPromo.code : '',
    status: 'Đã xác nhận'
  };
}

/**
 * Tra cứu chi tiết từng món trong giỏ hàng từ state
 * @param {Array} cartItems
 * @param {Object} state
 * @returns {Array<Object>}
 */
function mapCartItemsDetailed(cartItems, state) {
  return cartItems.map(entry => {
    const isCombo = entry.type === 'combo';
    const obj = isCombo 
      ? state.combos.find(c => c.id === entry.id)
      : state.menu.find(m => m.id === entry.id);

    const name = obj ? obj.name : entry.id;
    const unitPrice = isCombo ? (obj ? obj.combo_price : 0) : (obj ? obj.price : 0);

    return {
      id: entry.id,
      name,
      type: entry.type,
      qty: entry.qty,
      price: unitPrice,
      line_total: unitPrice * entry.qty
    };
  });
}

/**
 * Lưu đơn hàng vào localStorage và dọn sạch giỏ hàng
 * @param {Object} orderPayload
 * @returns {Object}
 */
export function executeOrder(orderPayload) {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    orders.push(orderPayload);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Lỗi khi lưu đơn hàng vào localStorage:', error);
  }

  saveCart([]);
  return orderPayload;
}

/**
 * Lấy lịch sử tất cả các đơn hàng đã lưu
 * @returns {Array<Object>}
 */
export function getSavedOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Không thể đọc danh sách đơn hàng:', e);
    return [];
  }
}

/**
 * Xuất danh sách đơn hàng ra file orders.csv có BOM UTF-8
 */
export function exportOrdersCSV() {
  const orders = getSavedOrders();
  if (orders.length === 0) {
    showToast('Chưa có đơn hàng nào để xuất CSV!', 'info');
    return;
  }

  const columns = [
    'id', 'created_at', 'customer_name', 'customer_phone', 
    'customer_address', 'payment_method_name', 'items_summary', 
    'subtotal', 'discount', 'total', 'status'
  ];

  downloadCSV('orders.csv', orders, columns);
  showToast('Đã tải xuống file orders.csv thành công!', 'success');
}

/**
 * Kết xuất giao diện biểu mẫu thanh toán trong modal
 * @param {HTMLElement} modalDialog
 * @param {Array} cartItems
 * @param {Object} state
 * @param {Object|null} appliedPromo
 */
export function renderCheckoutView(modalDialog, cartItems, state, appliedPromo) {
  if (!modalDialog) return;

  const { subtotal, discount, total } = getCartTotal(state, cartItems, appliedPromo);
  const items = mapCartItemsDetailed(cartItems, state);

  modalDialog.innerHTML = `
    <div class="modal-header">
      <h3 id="modal-title">Thanh Toán Đơn Hàng 🛍️</h3>
      <button id="btn-close-checkout" class="btn-close-modal" aria-label="Đóng popup">✕</button>
    </div>
    <div class="checkout-grid-container">
      ${renderDeliveryFormHTML(total)}
      ${renderSummaryColumnHTML(items, subtotal, discount, total)}
    </div>
  `;

  bindCheckoutFormEvents(modalDialog, cartItems, state, appliedPromo);
}

function renderDeliveryFormHTML(total) {
  return `
    <form id="checkout-form" class="checkout-form-body" novalidate>
      <h4 class="checkout-sub-title">1. Thông tin giao hàng</h4>
      <div class="form-group">
        <label class="form-label" for="co-name">Họ và tên người nhận *</label>
        <input type="text" id="co-name" name="customer_name" class="form-input" placeholder="Ví dụ: Nguyễn Văn A" required>
        <span id="err-customer_name" class="field-error"></span>
      </div>
      <div class="form-group">
        <label class="form-label" for="co-phone">Số điện thoại nhận hàng *</label>
        <input type="tel" id="co-phone" name="customer_phone" class="form-input" placeholder="Ví dụ: 0901234567" required>
        <span id="err-customer_phone" class="field-error"></span>
      </div>
      <div class="form-group">
        <label class="form-label" for="co-address">Địa chỉ giao hàng chi tiết *</label>
        <input type="text" id="co-address" name="customer_address" class="form-input" placeholder="Số nhà, tên đường, phường, quận" required>
        <span id="err-customer_address" class="field-error"></span>
      </div>
      <div class="form-group">
        <label class="form-label" for="co-time">Thời gian giao</label>
        <select id="co-time" name="delivery_time" class="form-select">
          <option value="Càng sớm càng tốt (30-45 phút)">⚡ Càng sớm càng tốt (30-45 phút)</option>
          <option value="Giao trong vòng 1-2 giờ tới">🕒 Giao trong vòng 1-2 giờ tới</option>
          <option value="Hẹn giao vào buổi chiều / tối">🌆 Hẹn giao vào buổi tối</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="co-notes">Ghi chú (tuỳ chọn)</label>
        <textarea id="co-notes" name="customer_notes" class="form-input" rows="2" placeholder="Ví dụ: Đóng gói thêm tương ớt..."></textarea>
      </div>
      <h4 class="checkout-sub-title" style="margin-top: 16px;">2. Phương thức thanh toán</h4>
      <div class="payment-options-group" role="radiogroup">${renderPaymentMethodOptions('cod')}</div>
      <span id="err-payment_method" class="field-error"></span>
      <div id="payment-method-details" class="payment-method-details">${renderPaymentInstructions('cod', total)}</div>
      <button type="submit" id="btn-submit-order" class="btn btn-primary btn-submit-checkout">
        Xác Nhận Đặt Hàng (${formatPrice(total)}) 🍗
      </button>
    </form>
  `;
}

function renderSummaryColumnHTML(items, subtotal, discount, total) {
  const itemsHTML = items.map(it => `
    <li class="checkout-item-row">
      <div class="checkout-item-name"><span class="qty">${it.qty}x</span> <span>${escapeHTML(it.name)}</span></div>
      <span class="checkout-item-price">${formatPrice(it.line_total)}</span>
    </li>
  `).join('');

  return `
    <div class="checkout-summary-column">
      <h4 class="checkout-sub-title">Đơn hàng của bạn (${items.length} món)</h4>
      <div class="checkout-items-card">
        <ul class="checkout-items-list">${itemsHTML}</ul>
        <div class="checkout-calc-rows">
          <div class="calc-row"><span>Tạm tính:</span> <span>${formatPrice(subtotal)}</span></div>
          ${discount > 0 ? `<div class="calc-row discount-row"><span>Ưu đãi:</span> <span>-${formatPrice(discount)}</span></div>` : ''}
          <div class="calc-row"><span>Phí giao:</span> <span class="free-badge">Miễn phí 🛵</span></div>
          <div class="calc-row total-row"><span>Tổng:</span> <span class="highlight-total">${formatPrice(total)}</span></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Sinh HTML các lựa chọn phương thức thanh toán
 * @param {string} selectedId
 * @returns {string}
 */
function renderPaymentMethodOptions(selectedId = 'cod') {
  return Object.values(PAYMENT_METHODS).map(method => `
    <label class="payment-option-card ${method.id === selectedId ? 'is-selected' : ''}" data-method-id="${method.id}">
      <input type="radio" name="payment_method" value="${method.id}" ${method.id === selectedId ? 'checked' : ''} class="payment-radio-input">
      <span class="payment-icon">${method.icon}</span>
      <div class="payment-meta">
        <div class="payment-top-line">
          <strong class="payment-name">${escapeHTML(method.name)}</strong>
          <span class="payment-badge">${escapeHTML(method.badge)}</span>
        </div>
        <p class="payment-desc">${escapeHTML(method.description)}</p>
      </div>
    </label>
  `).join('');
}

/**
 * Sinh nội dung hướng dẫn ứng với phương thức thanh toán được chọn
 * @param {string} methodId
 * @param {number} total
 * @returns {string}
 */
function renderPaymentInstructions(methodId, total) {
  const method = PAYMENT_METHODS[methodId] || PAYMENT_METHODS.cod;

  if (methodId === 'banking') {
    const bank = method.bankInfo;
    const orderRef = `KFC${Date.now().toString().slice(-6)}`;
    return `
      <div class="banking-instruction-card">
        <div class="banking-qr-mock">
          <div class="qr-code-box"><span class="qr-icon">📲</span><span class="qr-note">VietQR</span></div>
        </div>
        <div class="banking-details">
          <p><strong>Ngân hàng:</strong> ${escapeHTML(bank.bankName)}</p>
          <p><strong>Số TK:</strong> <span class="copyable-text">${escapeHTML(bank.accountNumber)}</span></p>
          <p><strong>Chủ TK:</strong> ${escapeHTML(bank.accountHolder)}</p>
          <p><strong>Số tiền:</strong> <span class="highlight-price">${formatPrice(total)}</span></p>
          <p><strong>Nội dung:</strong> <code class="copyable-text">${orderRef}</code></p>
        </div>
      </div>
    `;
  }

  if (methodId === 'momo') {
    return `<div class="momo-instruction-card"><p>📱 Vui lòng quét mã MoMo hoặc chuyển đến số <strong>${escapeHTML(method.momoPhone)}</strong> với nội dung là Mã đơn hàng.</p></div>`;
  }

  return `<div class="cod-instruction-card"><p>💵 ${escapeHTML(method.instructions)}</p></div>`;
}

/**
 * Gắn sự kiện cho form thanh toán
 */
function bindCheckoutFormEvents(modalDialog, cartItems, state, appliedPromo) {
  const form = modalDialog.querySelector('#checkout-form');
  const detailsBox = modalDialog.querySelector('#payment-method-details');
  const { total } = getCartTotal(state, cartItems, appliedPromo);

  modalDialog.querySelectorAll('.payment-option-card').forEach(card => {
    card.addEventListener('click', () => {
      const methodId = card.dataset.methodId;
      modalDialog.querySelectorAll('.payment-option-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      if (detailsBox) detailsBox.innerHTML = renderPaymentInstructions(methodId, total);
    });
  });

  const closeBtn = modalDialog.querySelector('#btn-close-checkout');
  if (closeBtn) closeBtn.addEventListener('click', () => closeCheckoutModal());

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      handleFormSubmit(form, modalDialog, cartItems, state, appliedPromo);
    });
  }
}

/**
 * Xử lý khi người dùng nhấn xác nhận đơn hàng
 */
function handleFormSubmit(form, modalDialog, cartItems, state, appliedPromo) {
  clearCheckoutErrors(modalDialog);
  const formData = {
    customer_name: form.customer_name.value,
    customer_phone: form.customer_phone.value,
    customer_address: form.customer_address.value,
    customer_notes: form.customer_notes.value,
    delivery_time: form.delivery_time.value,
    payment_method: form.payment_method.value
  };

  const validation = validateCheckoutForm(formData);
  if (!validation.isValid) {
    displayCheckoutErrors(modalDialog, validation.errors);
    showToast('Vui lòng kiểm tra lại thông tin nhận hàng!', 'error');
    return;
  }

  const orderPayload = createOrderPayload({ customer: formData, cartItems, state, appliedPromo });
  const savedOrder = executeOrder(orderPayload);
  renderSuccessReceipt(modalDialog, savedOrder);
  showToast('🎉 Đặt hàng thành công!', 'success');
  window.dispatchEvent(new CustomEvent('orderCompleted', { detail: savedOrder }));
}

function displayCheckoutErrors(container, errors) {
  Object.keys(errors).forEach(key => {
    const errorEl = container.querySelector(`#err-${key}`);
    if (errorEl) errorEl.textContent = errors[key];
  });
}

function clearCheckoutErrors(container) {
  container.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

/**
 * Hiển thị màn hình hoá đơn / biên nhận đơn hàng thành công
 * @param {HTMLElement} modalDialog
 * @param {Object} order
 */
export function renderSuccessReceipt(modalDialog, order) {
  if (!modalDialog) return;

  modalDialog.innerHTML = `
    <div class="receipt-container">
      <div class="receipt-icon-wrapper">🎉</div>
      <h3 class="receipt-title">ĐẶT HÀNG THÀNH CÔNG!</h3>
      <p class="receipt-subtitle">Đơn hàng của bạn đang được chuẩn bị và chuyển đi!</p>
      <div class="receipt-order-id-card">
        <span class="label">Mã đơn hàng</span>
        <strong class="order-id-code">${escapeHTML(order.id)}</strong>
      </div>
      <div class="receipt-card-details">
        ${renderReceiptCustomerInfoHTML(order)}
        ${renderReceiptItemsHTML(order.items)}
        ${renderReceiptTotalsHTML(order)}
      </div>
      <div class="receipt-actions">
        <button id="btn-export-current-order" class="btn btn-secondary">📥 Tải danh sách đơn hàng (CSV)</button>
        <button id="btn-finish-checkout" class="btn btn-primary">Tiếp tục xem thực đơn 🍗</button>
      </div>
    </div>
  `;

  const exportBtn = modalDialog.querySelector('#btn-export-current-order');
  if (exportBtn) exportBtn.addEventListener('click', () => exportOrdersCSV());

  const finishBtn = modalDialog.querySelector('#btn-finish-checkout');
  if (finishBtn) finishBtn.addEventListener('click', () => closeCheckoutModal());
}

function renderReceiptCustomerInfoHTML(order) {
  return `
    <h4 class="receipt-section-heading">Thông tin người nhận</h4>
    <div class="receipt-info-grid">
      <div><span class="dim">Họ tên:</span> <strong>${escapeHTML(order.customer_name)}</strong></div>
      <div><span class="dim">SĐT:</span> <strong>${escapeHTML(order.customer_phone)}</strong></div>
      <div class="full-w"><span class="dim">Địa chỉ:</span> <strong>${escapeHTML(order.customer_address)}</strong></div>
      <div><span class="dim">Thời gian:</span> <span>${escapeHTML(order.delivery_time)}</span></div>
      <div><span class="dim">Thanh toán:</span> <span class="badge-pay">${escapeHTML(order.payment_method_name)}</span></div>
    </div>
  `;
}

function renderReceiptItemsHTML(items) {
  const rows = items.map(it => `
    <li class="receipt-item-row">
      <span>${it.qty}x ${escapeHTML(it.name)}</span>
      <strong>${formatPrice(it.line_total)}</strong>
    </li>
  `).join('');
  return `<h4 class="receipt-section-heading" style="margin-top: 14px;">Món ăn đã đặt</h4><ul class="receipt-items-list">${rows}</ul>`;
}

function renderReceiptTotalsHTML(order) {
  return `
    <div class="receipt-totals-box">
      <div class="row"><span>Tạm tính:</span> <span>${formatPrice(order.subtotal)}</span></div>
      ${order.discount > 0 ? `<div class="row discount"><span>Khuyến mãi:</span> <span>-${formatPrice(order.discount)}</span></div>` : ''}
      <div class="row total"><span>Tổng:</span> <span class="highlight-total">${formatPrice(order.total)}</span></div>
    </div>
  `;
}

/**
 * Đóng cửa sổ modal thanh toán
 */
export function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Mở modal thanh toán và khởi chạy hiển thị
 * @param {Object} options - { state, appliedPromo }
 */
export function openCheckout({ state, appliedPromo }) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const cart = loadCart();
  if (cart.length === 0) {
    showToast('Giỏ hàng của bạn đang trống!', 'info');
    return;
  }

  let dialog = modal.querySelector('.modal-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-lg';
    modal.appendChild(dialog);
  }

  renderCheckoutView(dialog, cart, state, appliedPromo);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
