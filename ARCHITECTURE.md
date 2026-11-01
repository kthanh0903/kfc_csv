# ARCHITECTURE.md – Kiến trúc kỹ thuật

## 1. Nguyên tắc
```
CSV (data/) ──fetch──▶ csv.js (parse thành mảng object) ──▶ render.js (tạo HTML)
                                                            ▲
                         cart.js ◀──▶ localStorage ─────────┘
                         main.js: khởi chạy, gắn sự kiện
```
- Mọi dữ liệu nạp **1 lần** khi trang mở, lưu vào biến `state` trong `main.js`.
- Lọc/tìm kiếm/sắp xếp làm trên `state` trong bộ nhớ, không fetch lại.

## 2. Thứ tự nạp script trong `index.html`
Dùng ES Modules để tách file gọn gàng:
```html
<script type="module" src="js/main.js"></script>
```
`main.js` sẽ `import` các module còn lại. (ES Modules cũng cần chạy qua Live Server – xem README.)

## 3. Module và các hàm chính

### `js/csv.js`
| Hàm | Mô tả |
|---|---|
| `loadCSV(path)` | `fetch` file → trả về `Promise<Array<Object>>` |
| `parseCSV(text)` | Tự viết parser: xử lý ngoặc kép, dấu phẩy trong ngoặc kép, `""` escape, xuống dòng `\r\n`, bỏ dòng trống |
| `toCSV(rows, columns)` | Chuyển mảng object → chuỗi CSV (escape đúng chuẩn) |
| `downloadCSV(filename, rows, columns)` | Tạo `Blob` có BOM `\uFEFF` + link tải xuống |

Sau khi parse, ép kiểu: các cột `price`, `popularity`, `rating`, `discount_value`, `min_order`, `combo_price`, `lat`, `lng` → `Number`; `is_*` → `Boolean`; `tags` → mảng (`split('|')`).

> Không dùng thư viện PapaParse — mục tiêu là học tự viết. (Nếu muốn dùng, phải hỏi trước.)

### `js/render.js`
`renderPromotions()`, `renderMenu(items)`, `renderCombos()`, `renderStores(district)`, `renderReviews()`, `renderCart()`, `showToast(message)`, `escapeHTML(str)`, `formatPrice(number)`.

### `js/cart.js`
`addToCart(id, type)`, `updateQty(id, delta)`, `removeFromCart(id)`, `getCartTotal()`, `applyPromoCode(code)` → trả về `{ok, discount, message}`, `checkout()`, `saveCart()`, `loadCart()`.

Luật mã giảm giá: mã phải tồn tại, chưa hết hạn, đã tới `start_date`, tổng đơn ≥ `min_order`. Giảm theo `%` thì làm tròn xuống tới 1.000₫.

### `js/main.js`
```js
const state = { menu: [], combos: [], promotions: [], stores: [], reviews: [] };

async function init() {
  // nạp song song tất cả CSV
  const [menu, combos, promotions, stores, reviews] = await Promise.all([
    loadCSV('data/menu.csv'), loadCSV('data/combos.csv'),
    loadCSV('data/promotions.csv'), loadCSV('data/stores.csv'),
    loadCSV('data/reviews.csv'),
  ]);
  Object.assign(state, { menu, combos, promotions, stores, reviews });
  // render + gắn sự kiện...
}
document.addEventListener('DOMContentLoaded', init);
```
Gắn sự kiện bằng **event delegation** (1 listener trên container) thay vì gắn cho từng nút.

## 4. Cấu trúc `index.html` (khung)
```html
<header id="header">…</header>
<main>
  <section id="hero">…</section>
  <section id="promotions">…</section>
  <section id="menu">…</section>
  <section id="combos">…</section>
  <section id="stores">…</section>
  <section id="reviews">…</section>
  <section id="booking">…</section>
</main>
<footer>…</footer>
<aside id="cart-drawer" aria-hidden="true">…</aside>
<div id="toast" role="status" aria-live="polite"></div>
```
Nội dung động (thẻ món, cửa hàng…) được JS chèn vào các container rỗng, vd `<div id="menu-grid"></div>`.

## 5. SEO cơ bản
- `<title>`, `<meta name="description">`, `<meta name="viewport">`, `lang="vi"`.
- Open Graph (`og:title`, `og:description`, `og:image`) để chia sẻ Facebook/Zalo đẹp.

## 6. Hạn chế đã biết (do không có backend)
- Không lưu đơn/đặt bàn tập trung – mỗi trình duyệt có dữ liệu riêng.
- Muốn cập nhật thực đơn → sửa file CSV rồi deploy lại.
- Mã khuyến mãi nằm công khai trong CSV (chấp nhận được với dự án học).
