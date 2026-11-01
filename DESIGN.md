# DESIGN.md – Hệ thống thiết kế

## 1. Màu sắc (khai báo bằng CSS variables trong `:root`)

```css
:root {
  --color-primary: #E4002B;      /* đỏ chủ đạo */
  --color-primary-dark: #B8001F; /* hover */
  --color-secondary: #FFC72C;    /* vàng nhấn: giá, badge */
  --color-dark: #1A1A1A;         /* chữ chính, footer */
  --color-light: #FFF8F0;        /* nền kem */
  --color-white: #FFFFFF;
  --color-gray: #6B6B6B;         /* chữ phụ */
  --color-success: #2E9E44;
  --radius: 16px;
  --shadow: 0 6px 20px rgba(0,0,0,.08);
  --container: 1200px;
}
```

- Nền trang: `--color-light`. Section xen kẽ nền trắng / kem.
- Nút chính: nền đỏ, chữ trắng, bo tròn hoàn toàn (`border-radius: 999px`).
- Giá tiền: chữ đậm, màu đỏ. Giá gốc: gạch ngang, màu xám.

## 2. Font chữ
- Tiêu đề: **Oswald** (đậm, in hoa, mạnh mẽ) – có hỗ trợ tiếng Việt.
- Nội dung: **Be Vietnam Pro** (400, 600).
- Một link Google Fonts duy nhất, có `display=swap`.

| Thành phần | Mobile | Desktop |
|---|---|---|
| H1 hero | 36px | 64px |
| H2 section | 28px | 40px |
| Body | 16px | 16px |
| Giá | 20px | 22px |

## 3. Logo
Không dùng logo thật. Logo bằng chữ:
- Chữ **"GÀ GIÒN"** (hoặc tên bạn tự đặt) font Oswald, màu trắng trên ô vuông đỏ, kèm emoji 🍗.

## 4. Bố cục
- Container tối đa 1200px, padding 2 bên 16px (mobile) / 24px (desktop).
- Lưới thực đơn: 1 cột (<480px) · 2 cột (≥480px) · 3 cột (≥768px) · 4 cột (≥1100px). Dùng CSS Grid.
- Khoảng cách giữa các section: 64px (mobile) / 96px (desktop).
- Thẻ (card): nền trắng, bo góc `--radius`, đổ bóng `--shadow`, hover nhấc lên 4px.

## 5. Hình ảnh – quy định dung lượng
| Loại | Định dạng | Kích thước | Dung lượng tối đa |
|---|---|---|---|
| Hero | SVG | — | 20 KB |
| Ảnh món | WebP hoặc SVG | 400×400 | 40 KB |
| Icon | SVG inline | 24×24 | — |

- Nếu CSV không có ảnh (`image` rỗng) → hiện emoji theo danh mục: Gà rán 🍗, Burger 🍔, Món phụ 🍟, Đồ uống 🥤, Tráng miệng 🍦 trên nền tròn vàng.
- Gợi ý nguồn ảnh miễn phí, nhẹ: tự vẽ SVG, hoặc ảnh từ Unsplash/Pexels rồi nén qua squoosh.app sang WebP.

## 6. Hiệu ứng
- Chuyển động ngắn 200–300ms, `ease-out`.
- Fade-up khi section xuất hiện.
- Nút "Thêm" bấm → giỏ hàng rung nhẹ + badge số nhảy lên.
- Tôn trọng `prefers-reduced-motion`: tắt animation nếu người dùng chọn giảm chuyển động.

## 7. Trạng thái giao diện
- **Đang tải:** khung xám nhấp nháy (skeleton).
- **Lỗi:** hộp thông báo "Không tải được dữ liệu, vui lòng thử lại" + nút Thử lại.
- **Rỗng:** "Không tìm thấy món phù hợp 😢".
