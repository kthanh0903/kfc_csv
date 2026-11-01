# 🍗 KFC Landing Page – Dự án học Vibe Coding

> Dự án luyện tập: landing page quảng cáo gà rán, **chỉ dùng HTML + CSS + JavaScript thuần**, dữ liệu lưu trong **file .CSV**, **không có backend**.
> ⚠️ Đây là dự án học tập, không phải website chính thức của KFC. Không sao chép logo, hình ảnh hay nhân vật thương hiệu chính thức.

## 1. Bộ tài liệu .MD (đọc theo thứ tự)

| File | Vai trò | Ai đọc |
|---|---|---|
| `README.md` | Tổng quan, cách chạy | Bạn + AI |
| `AGENTS.md` | **Luật bắt buộc** cho AI agent khi code | AI (quan trọng nhất) |
| `PROJECT_SPEC.md` | Yêu cầu sản phẩm: có những section nào, chức năng gì | AI |
| `DESIGN.md` | Màu sắc, font, bố cục, quy định hình ảnh | AI |
| `DATA.md` | Cấu trúc các file CSV + dữ liệu mẫu | AI |
| `ARCHITECTURE.md` | Cấu trúc thư mục, cách JS đọc CSV | AI |
| `TASKS.md` | Kế hoạch làm từng bước + câu prompt mẫu | Bạn |

## 2. Cấu trúc thư mục dự kiến

```
kfc-landing/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── csv.js        # hàm đọc & parse CSV
│   ├── render.js     # hiển thị dữ liệu ra HTML
│   ├── cart.js       # giỏ hàng (localStorage)
│   └── main.js       # khởi chạy
├── data/
│   ├── menu.csv
│   ├── combos.csv
│   ├── promotions.csv
│   ├── stores.csv
│   └── reviews.csv
├── assets/
│   └── img/          # ảnh nhẹ: .svg / .webp
└── docs/             # (tuỳ chọn) để các file .md vào đây, trừ README & AGENTS
```

## 3. Cách chạy

Trình duyệt **chặn `fetch()` file CSV** khi mở trực tiếp `index.html` (giao thức `file://`). Phải chạy qua một web server tĩnh – vẫn không phải backend:

- **Cách 1 (dễ nhất):** VS Code / Antigravity → cài extension **Live Server** → chuột phải `index.html` → *Open with Live Server*.
- **Cách 2:** mở terminal tại thư mục dự án:
  ```bash
  python -m http.server 5500
  ```
  rồi mở `http://localhost:5500`.

## 4. Deploy (miễn phí, không cần server)

GitHub Pages / Netlify / Vercel đều chạy được vì toàn bộ là file tĩnh.

## 5. Cách dùng với Antigravity

1. Tạo thư mục `kfc-landing/`, chép toàn bộ file .md vào.
2. Mở thư mục bằng Antigravity.
3. Prompt đầu tiên: *"Đọc AGENTS.md, PROJECT_SPEC.md, DESIGN.md, DATA.md, ARCHITECTURE.md. Tóm tắt lại hiểu biết của bạn và lập kế hoạch, CHƯA code."*
4. Sau đó làm lần lượt theo `TASKS.md`.
