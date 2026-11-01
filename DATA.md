# DATA.md – "Database" bằng file CSV

## 1. Quy ước chung
- Encoding **UTF-8**, dòng đầu là tên cột, dấu phân cách **dấu phẩy `,`**.
- Giá trị có dấu phẩy → bọc trong ngoặc kép: `"Gà giòn, cay"`.
- Giá: số nguyên VNĐ, không dấu chấm (`89000`).
- Ngày: `YYYY-MM-DD`. Giờ: `HH:MM`.
- Cờ đúng/sai: `1` / `0`.
- Nhiều giá trị trong 1 ô: ngăn bằng `|` (vd: `bestseller|spicy`).
- Tất cả dữ liệu dưới đây là **dữ liệu mẫu tự tạo**, không phải giá/cửa hàng thật.

> ⚠️ Mở/sửa CSV bằng Excel dễ làm hỏng UTF-8. Nên sửa bằng VS Code/Antigravity, hoặc Google Sheets → Tải xuống CSV.

---

## 2. `data/menu.csv`

| Cột | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| id | text | ✅ | Mã món, duy nhất, vd `M001` |
| name | text | ✅ | Tên món |
| category | text | ✅ | `chicken` / `burger` / `side` / `drink` / `dessert` |
| price | số | ✅ | Giá bán |
| description | text | | Mô tả ngắn ≤ 80 ký tự |
| image | text | | Đường dẫn ảnh, vd `assets/img/m001.webp`; rỗng = dùng emoji |
| tags | text | | `bestseller`, `spicy`, `new` (ngăn `|`) |
| popularity | số | | Điểm phổ biến để sắp xếp (cao → đầu) |
| is_available | 0/1 | ✅ | 0 = tạm hết |

```csv
id,name,category,price,description,image,tags,popularity,is_available
M001,Gà Rán Giòn (1 miếng),chicken,36000,Da giòn rụm thịt mọng nước,,bestseller,98,1
M002,Gà Cay Xé Lưỡi (1 miếng),chicken,38000,Lớp tẩm ớt cay nồng khó cưỡng,,spicy|bestseller,95,1
M003,Gà Không Xương (5 miếng),chicken,49000,Phi lê gà chiên giòn chấm sốt,,new,80,1
M004,Cánh Gà Sốt Mật Ong (3 cánh),chicken,52000,"Ngọt, mặn, giòn hài hoà",,,76,1
M005,Burger Gà Giòn,burger,45000,Phi lê gà giòn với xà lách và sốt mayo,,bestseller,90,1
M006,Burger Gà Cay,burger,49000,Phiên bản cay cho người mê vị nồng,,spicy,70,1
M007,Khoai Tây Chiên (vừa),side,25000,Vàng giòn rắc muối,,,85,1
M008,Khoai Nghiền Sốt,side,22000,Mềm mịn với sốt nâu đậm vị,,,60,1
M009,Salad Bắp Cải,side,20000,Giòn mát giải ngấy,,,40,0
M010,Nước Ngọt (vừa),drink,15000,Ướp lạnh sảng khoái,,,88,1
M011,Trà Đào,drink,25000,Thanh mát với miếng đào,,new,55,1
M012,Kem Sundae Socola,dessert,18000,Kem vani phủ sốt socola,,,65,1
```

## 3. `data/combos.csv`

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | text | `C001` |
| name | text | Tên combo |
| items | text | Danh sách `id_món:số_lượng`, ngăn `|` (vd `M001:2|M007:1`) |
| combo_price | số | Giá combo |
| image | text | Tuỳ chọn |
| is_featured | 0/1 | Hiện ở section Combo |

> Giá gốc = tổng (giá món × số lượng) từ `menu.csv` → JS tự tính, không lưu vào CSV.

```csv
id,name,items,combo_price,image,is_featured
C001,Combo Một Mình,M001:2|M007:1|M010:1,99000,,1
C002,Combo Cặp Đôi,M001:3|M002:1|M007:2|M010:2,189000,,1
C003,Combo Gia Đình,M001:6|M003:1|M007:3|M010:4,349000,,1
C004,Combo Burger,M005:1|M007:1|M010:1,75000,,0
```

## 4. `data/promotions.csv`

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | text | `P001` |
| title | text | Tiêu đề |
| description | text | Mô tả |
| code | text | Mã giảm giá (IN HOA) |
| discount_type | text | `percent` hoặc `amount` |
| discount_value | số | 20 (=20%) hoặc 30000 (=30.000₫) |
| min_order | số | Đơn tối thiểu để áp mã |
| start_date | ngày | |
| end_date | ngày | |
| is_featured | 0/1 | Dùng cho đồng hồ đếm ngược ở Hero (chỉ 1 dòng = 1) |
| max_discount | số | Mức giảm tối đa (VNĐ), để trống nếu không giới hạn |
| date_rule | text | Quy tắc ngày áp dụng; `day_equals_month` = ngày và tháng trùng nhau |

```csv
id,title,description,code,discount_type,discount_value,min_order,start_date,end_date,is_featured,max_discount,date_rule
P001,Thứ Ba Vui Vẻ,Giảm 20% mọi đơn hàng vào thứ Ba,TUESDAY20,percent,20,100000,2026-11-01,2026-12-31,0,,
P002,Chào Bạn Mới,Giảm 30.000₫ cho đơn đầu tiên,HELLO30K,amount,30000,150000,2026-11-01,2026-11-30,1,,
P003,Tiệc Cuối Năm,Giảm 15% combo gia đình,PARTY15,percent,15,300000,2026-12-01,2027-01-15,0,,
P004,Ngày Đôi Rộn Ràng,"Giảm 50% tối đa 500.000₫ vào ngày trùng tháng (1/1, 2/2, ... 12/12)",NGAYDOI50,percent,50,0,2026-01-01,2099-12-31,0,500000,day_equals_month
```

## 5. `data/stores.csv`

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | text | `S001` |
| name | text | Tên cửa hàng |
| district | text | Quận/Phường – dùng để lọc |
| address | text | Địa chỉ |
| phone | text | Số điện thoại |
| open_time | giờ | `08:00` |
| close_time | giờ | `22:00` |
| lat | số | Vĩ độ |
| lng | số | Kinh độ |

```csv
id,name,district,address,phone,open_time,close_time,lat,lng
S001,Cửa hàng Mẫu Trung Tâm,Quận 1,"123 Đường Mẫu, Quận 1",0280000001,08:00,22:00,10.7769,106.7009
S002,Cửa hàng Mẫu Phú Nhuận,Phú Nhuận,"45 Đường Mẫu, Phú Nhuận",0280000002,09:00,22:00,10.7990,106.6800
S003,Cửa hàng Mẫu Thủ Đức,Thủ Đức,"789 Đường Mẫu, Thủ Đức",0280000003,08:30,21:30,10.8500,106.7700
S004,Cửa hàng Mẫu Bình Thạnh,Bình Thạnh,"12 Đường Mẫu, Bình Thạnh",0280000004,07:30,23:00,10.8100,106.7100
```

## 6. `data/reviews.csv`

```csv
id,name,rating,content,date
R001,Minh Anh,5,Gà giòn ngon lắm, lần nào cũng gọi combo cặp đôi!,2026-10-12
R002,Tuấn,4,Gà cay đúng vị, khoai hơi ít một chút.,2026-10-20
R003,Hồng Nhung,5,Giao nhanh, đồ ăn còn nóng hổi.,2026-10-25
```
> Lưu ý: cột `content` trên có dấu phẩy → khi tạo file thật PHẢI bọc ngoặc kép, vd `"Gà giòn ngon lắm, lần nào..."`. Đây cũng là bài test cho hàm parse CSV.

---

## 7. Dữ liệu người dùng (lưu trong `localStorage`, không ghi được vào file CSV)

Trình duyệt **không thể ghi đè** file CSV trên server khi không có backend. Vì vậy:

| Key localStorage | Nội dung | Xuất CSV |
|---|---|---|
| `cart` | `[{id, type:"item"|"combo", qty}]` | Không |
| `orders` | Đơn đã xác nhận | `orders.csv` |
| `bookings` | Đặt bàn từ form | `bookings.csv` |

Cột `bookings.csv` khi xuất:
```
created_at,full_name,phone,email,store_id,date,time,guests
```
Khi xuất CSV phải thêm **BOM UTF-8** (`\uFEFF`) ở đầu file để Excel hiển thị đúng tiếng Việt.
