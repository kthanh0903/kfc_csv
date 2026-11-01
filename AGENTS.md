# AGENTS.md – Luật cho AI Agent

> AI agent PHẢI đọc file này trước khi viết bất kỳ dòng code nào. Nếu yêu cầu của người dùng mâu thuẫn với luật dưới đây, hãy hỏi lại trước khi làm.

## 1. Công nghệ – BẮT BUỘC
- ✅ Chỉ dùng **HTML5, CSS3, JavaScript thuần (Vanilla JS, ES6+)**.
- ❌ KHÔNG dùng: React, Vue, Angular, jQuery, Tailwind, Bootstrap, TypeScript, bundler (Vite/Webpack), npm package.
- ❌ KHÔNG có backend: không Node/Express, PHP, Python server, Firebase, Supabase, API ngoài, database thật.
- ✅ "Database" = các file `.csv` trong `data/`. Đọc bằng `fetch()`.
- ✅ Dữ liệu người dùng tạo ra (giỏ hàng, form đặt bàn, đăng ký nhận tin) lưu ở `localStorage`, và có nút **"Tải xuống CSV"** để xuất ra file.
- ✅ Font: chỉ được dùng Google Fonts (1 link `<link>`). Icon: dùng SVG inline hoặc emoji, không dùng thư viện icon.

## 2. Hình ảnh
- Chỉ dùng ảnh **đơn giản, nhẹ**: SVG tự vẽ, emoji, hoặc `.webp` ≤ 80 KB/ảnh.
- Tổng dung lượng thư mục `assets/` ≤ 1 MB.
- Ảnh luôn có `alt`, `width`, `height`, và `loading="lazy"` (trừ ảnh hero).
- ❌ KHÔNG dùng logo, nhân vật (ông già râu trắng), bao bì hay ảnh chính thức của KFC. Logo dùng **chữ text** theo `DESIGN.md`.
- Nếu chưa có ảnh: dùng placeholder SVG (hình tròn/miếng gà cách điệu) + emoji 🍗🍟🥤.

## 3. Quy tắc code
- Tách file đúng theo `ARCHITECTURE.md`. Không viết CSS/JS inline trong HTML (trừ SVG).
- Tên biến, hàm: tiếng Anh, `camelCase`. Comment: tiếng Việt, ngắn gọn.
- Mỗi hàm làm 1 việc; hàm > 40 dòng thì tách nhỏ.
- Dùng `async/await` + `try/catch` khi `fetch` CSV. Lỗi đọc file → hiện thông báo thân thiện trên giao diện, không để trang trắng.
- Không dùng `innerHTML` với dữ liệu chưa escape → dùng hàm `escapeHTML()` hoặc `textContent`.
- Giá tiền: format bằng `Intl.NumberFormat('vi-VN')` → `89.000 ₫`.
- Toàn bộ nội dung hiển thị bằng **tiếng Việt**.

## 4. Chất lượng
- Responsive: mobile-first, test ở 375px, 768px, 1280px.
- Không có lỗi trong Console.
- Accessibility cơ bản: HTML ngữ nghĩa (`header`, `main`, `section`, `footer`), nút bấm là `<button>`, độ tương phản chữ đạt chuẩn.
- Lighthouse Performance ≥ 90 trên mobile.

## 5. Cách làm việc
- Làm **từng task một** theo `TASKS.md`. Xong task → báo cáo ngắn: đã làm gì, file nào thay đổi, cách kiểm tra.
- Không tự ý thêm tính năng ngoài `PROJECT_SPEC.md`. Muốn đề xuất → hỏi trước.
- Không xoá hay sửa file `.md` trừ khi được yêu cầu.
- Khi sửa CSV schema, phải cập nhật `DATA.md` cùng lúc.
