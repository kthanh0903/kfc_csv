# PROJECT_SPEC.md – Yêu cầu sản phẩm

## 1. Mục tiêu
Landing page 1 trang quảng cáo gà rán, giúp khách:
1. Thấy ngay khuyến mãi đang chạy.
2. Xem thực đơn & combo, thêm vào giỏ.
3. Tìm cửa hàng gần nhất.
4. Để lại thông tin (đặt bàn / nhận ưu đãi).

**Đối tượng:** người trẻ 16–35 tuổi tại TP.HCM, xem chủ yếu trên điện thoại.
**Giọng văn:** vui, ngắn gọn, kích thích vị giác. Ví dụ: *"Giòn rụm từng miếng – Nóng hổi mỗi ngày!"*

## 2. Các section (theo thứ tự từ trên xuống)

### S1. Header (dính trên cùng – sticky)
- Logo dạng chữ bên trái.
- Menu: Khuyến mãi · Thực đơn · Combo · Cửa hàng · Liên hệ (cuộn mượt tới section).
- Icon giỏ hàng 🛒 có badge số lượng.
- Mobile: menu hamburger.

### S2. Hero banner
- Tiêu đề lớn + câu slogan + 2 nút: **"Đặt ngay"** (cuộn tới Thực đơn), **"Xem khuyến mãi"**.
- Hình minh hoạ miếng gà SVG/emoji, có animation nhẹ (nảy/xoay chậm).
- Đồng hồ đếm ngược tới ngày hết hạn của khuyến mãi nổi bật nhất (lấy từ `promotions.csv`, cột `is_featured=1`).

### S3. Khuyến mãi — đọc từ `promotions.csv`
- Dạng thẻ (card) ngang, cuộn ngang trên mobile.
- Mỗi thẻ: tiêu đề, mô tả, mã code (nút **Sao chép mã**), ngày hết hạn.
- Ẩn khuyến mãi đã hết hạn (so `end_date` với ngày hiện tại).

### S4. Thực đơn — đọc từ `menu.csv`
- Thanh lọc theo danh mục (tab): Tất cả · Gà rán · Burger · Món phụ · Đồ uống · Tráng miệng.
- Ô tìm kiếm theo tên món.
- Sắp xếp: Phổ biến / Giá tăng / Giá giảm.
- Thẻ món: ảnh, tên, mô tả ngắn, giá, nhãn (🔥 Bán chạy / 🌶️ Cay / 🆕 Mới), nút **"+ Thêm"**.
- Món `is_available=0` → hiện mờ, nút đổi thành "Tạm hết".

### S5. Combo — đọc từ `combos.csv`
- 3–4 combo nổi bật, hiện giá gốc gạch ngang + giá combo + % tiết kiệm (tự tính).

### S6. Giỏ hàng (drawer trượt từ phải)
- Danh sách món, tăng/giảm số lượng, xoá.
- Tổng tiền, áp mã khuyến mãi (kiểm tra mã trong `promotions.csv`).
- Nút **"Xác nhận đơn"** → hiện popup tóm tắt đơn + lưu vào `localStorage` (không gửi đi đâu cả).
- Giỏ hàng giữ nguyên khi tải lại trang.

### S7. Cửa hàng — đọc từ `stores.csv`
- Dropdown chọn Quận → lọc danh sách cửa hàng.
- Mỗi cửa hàng: tên, địa chỉ, giờ mở cửa, số điện thoại (bấm gọi được `tel:`), nút **"Chỉ đường"** mở Google Maps (`https://www.google.com/maps/search/?api=1&query=lat,lng`).
- Nhãn "Đang mở cửa"/"Đã đóng cửa" tính theo giờ hiện tại.

### S8. Đánh giá khách hàng — đọc từ `reviews.csv`
- Slider tự chạy, hiện tên, số sao ⭐, nội dung.

### S9. Form đặt bàn / nhận ưu đãi
- Trường: Họ tên, SĐT (10 số, bắt đầu bằng 0), Email (không bắt buộc), Cửa hàng (lấy từ `stores.csv`), Ngày, Giờ, Số người.
- Validate bằng JS, báo lỗi ngay dưới ô nhập.
- Gửi → lưu vào `localStorage` key `bookings`, hiện thông báo thành công.
- Nút **"Tải danh sách đặt bàn (CSV)"** → xuất toàn bộ booking ra file `bookings.csv`.

### S10. Footer
- Thông tin liên hệ, link mạng xã hội (icon SVG), dòng chữ: *"Dự án học tập – không phải website chính thức."*

### Thêm
- Nút "Lên đầu trang" khi cuộn xuống.
- Hiệu ứng xuất hiện khi cuộn (dùng `IntersectionObserver`).

## 3. Ngoài phạm vi (KHÔNG làm)
- Thanh toán online, đăng nhập/tài khoản, gửi email/SMS thật, bản đồ nhúng nặng, đa ngôn ngữ.

## 4. Tiêu chí hoàn thành
- [ ] Tất cả section hiển thị đúng dữ liệu từ CSV.
- [ ] Sửa 1 dòng trong CSV → tải lại trang thấy thay đổi.
- [ ] Giỏ hàng & booking còn sau khi F5.
- [ ] Xuất được file `bookings.csv` mở bằng Excel không lỗi font tiếng Việt.
- [ ] Đẹp trên điện thoại 375px.
