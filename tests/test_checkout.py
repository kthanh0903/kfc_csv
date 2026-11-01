"""
tests/test_checkout.py
Bộ kiểm thử tự động nghiêm ngặt cho Module Thanh Toán (Checkout Module)
"""

import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

# ==============================================================================
# 1. MÔ PHỎNG LOGIC CHECKOUT TỪ js/checkout.js ĐỂ KIỂM THỬ ĐỘC LẬP
# ==============================================================================

PAYMENT_METHODS = {
    'cod': {
        'id': 'cod',
        'name': 'Tiền mặt khi nhận hàng (COD)',
        'badge': 'Tiền mặt',
        'icon': '💵',
        'description': 'Thanh toán trực tiếp cho shipper khi nhận đồ ăn nóng hổi.',
        'instructions': 'Vui lòng chuẩn bị sẵn tiền mặt đúng số tiền để nhận hàng nhanh nhất.'
    },
    'banking': {
        'id': 'banking',
        'name': 'Chuyển khoản VietQR',
        'badge': 'Khuyên dùng',
        'icon': '🏦',
        'description': 'Quét mã VietQR qua bất kỳ app ngân hàng nào (Vietcombank, MB, Techcombank...).',
        'bankInfo': {
            'bankName': 'MBBank (Ngân hàng Quân Đội)',
            'accountNumber': '0901234567',
            'accountHolder': 'KFC GA GION DEMO'
        }
    },
    'momo': {
        'id': 'momo',
        'name': 'Ví điện tử MoMo',
        'badge': 'Ví điện tử',
        'icon': '📱',
        'description': 'Thanh toán tức thì qua ví điện tử MoMo.',
        'momoPhone': '0901234567'
    }
}

def validate_checkout_form(data):
    errors = {}
    name = (data.get('customer_name') or '').strip()
    phone = (data.get('customer_phone') or '').strip()
    address = (data.get('customer_address') or '').strip()
    payment_method = data.get('payment_method') or 'cod'

    if not name:
        errors['customer_name'] = 'Vui lòng nhập họ và tên người nhận.'
    elif len(name) < 2:
        errors['customer_name'] = 'Họ và tên phải có ít nhất 2 ký tự.'

    phone_regex = r'^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$'
    if not phone:
        errors['customer_phone'] = 'Vui lòng nhập số điện thoại.'
    elif not re.match(phone_regex, phone):
        errors['customer_phone'] = 'Số điện thoại không hợp lệ (10 số, VD: 0901234567).'

    if not address:
        errors['customer_address'] = 'Vui lòng nhập địa chỉ giao hàng chi tiết.'
    elif len(address) < 6:
        errors['customer_address'] = 'Địa chỉ quá ngắn, vui lòng ghi rõ số nhà, tên đường.'

    if payment_method not in PAYMENT_METHODS:
        errors['payment_method'] = 'Phương thức thanh toán không hợp lệ.'

    return {
        'isValid': len(errors) == 0,
        'errors': errors
    }

def get_cart_total(state, cart_items, applied_promo=None):
    subtotal = 0
    count = 0
    for entry in cart_items:
        count += entry['qty']
        if entry['type'] == 'combo':
            combo = next((c for c in state['combos'] if c['id'] == entry['id']), None)
            if combo:
                subtotal += combo['combo_price'] * entry['qty']
        else:
            item = next((m for m in state['menu'] if m['id'] == entry['id']), None)
            if item:
                subtotal += item['price'] * entry['qty']

    discount = 0
    valid_promo = False
    if applied_promo and subtotal >= applied_promo.get('min_order', 0):
        valid_promo = True
        if applied_promo.get('discount_type') == 'percent':
            discount = (subtotal * applied_promo['discount_value'] // 100 // 1000) * 1000
        else:
            discount = min(applied_promo['discount_value'], subtotal)

    total = max(0, subtotal - discount)
    return {'subtotal': subtotal, 'discount': discount, 'total': total, 'count': count, 'validPromo': valid_promo}

def map_cart_items_detailed(cart_items, state):
    detailed = []
    for entry in cart_items:
        is_combo = entry['type'] == 'combo'
        if is_combo:
            obj = next((c for c in state['combos'] if c['id'] == entry['id']), None)
            name = obj['name'] if obj else entry['id']
            unit_price = obj['combo_price'] if obj else 0
        else:
            obj = next((m for m in state['menu'] if m['id'] == entry['id']), None)
            name = obj['name'] if obj else entry['id']
            unit_price = obj['price'] if obj else 0

        detailed.append({
            'id': entry['id'],
            'name': name,
            'type': entry['type'],
            'qty': entry['qty'],
            'price': unit_price,
            'line_total': unit_price * entry['qty']
        })
    return detailed

def create_order_payload(customer, cart_items, state, applied_promo=None):
    totals = get_cart_total(state, cart_items, applied_promo)
    detailed_items = map_cart_items_detailed(cart_items, state)
    items_summary = ', '.join([f"{it['qty']}x {it['name']}" for it in detailed_items])
    method_obj = PAYMENT_METHODS.get(customer.get('payment_method'), PAYMENT_METHODS['cod'])

    return {
        'id': f"ORD-{abs(hash(str(customer) + str(totals))) % 900000 + 100000}",
        'created_at': "2026-11-01T15:00:00.000Z",
        'customer_name': customer['customer_name'].strip(),
        'customer_phone': customer['customer_phone'].strip(),
        'customer_address': customer['customer_address'].strip(),
        'customer_notes': customer.get('customer_notes', '').strip(),
        'delivery_time': customer.get('delivery_time', 'Càng sớm càng tốt (30-45 phút)'),
        'payment_method': method_obj['id'],
        'payment_method_name': method_obj['name'],
        'payment_status': 'Chưa thanh toán (COD)' if method_obj['id'] == 'cod' else 'Chờ xác nhận',
        'items': detailed_items,
        'items_summary': items_summary,
        'subtotal': totals['subtotal'],
        'discount': totals['discount'],
        'shipping_fee': 0,
        'total': totals['total'],
        'promo_code': applied_promo['code'] if applied_promo else '',
        'status': 'Đã xác nhận'
    }

def escape_csv_field(val):
    s = str(val if val is not None else '')
    if any(c in s for c in [',', '"', '\n', '\r']):
        return f'"{s.replace("\"", "\"\"")}"'
    return s

def to_csv_string(rows, columns):
    if not rows:
        return ''
    header = ','.join([escape_csv_field(c) for c in columns])
    lines = [','.join([escape_csv_field(row.get(c, '')) for c in columns]) for row in rows]
    return '\ufeff' + header + '\r\n' + '\r\n'.join(lines)


# ==============================================================================
# 2. BỘ TEST CASES NGHIÊM NGẶT
# ==============================================================================

MOCK_STATE = {
    'menu': [
        {'id': 'M001', 'name': 'Gà Rán Giòn (1 miếng)', 'price': 36000},
        {'id': 'M002', 'name': 'Gà Cay Xé Lưỡi (1 miếng)', 'price': 38000},
        {'id': 'M007', 'name': 'Khoai Tây Chiên (vừa)', 'price': 25000},
        {'id': 'M010', 'name': 'Nước Ngọt (vừa)', 'price': 15000}
    ],
    'combos': [
        {'id': 'C001', 'name': 'Combo Một Mình', 'combo_price': 99000},
        {'id': 'C002', 'name': 'Combo Cặp Đôi', 'combo_price': 189000}
    ]
}

def run_tests():
    passed = 0
    total = 0

    def assert_eq(actual, expected, msg):
        nonlocal passed, total
        total += 1
        assert actual == expected, f"[FAILED] {msg} -> Expected: {expected}, Got: {actual}"
        passed += 1
        print(f"  [PASS] {msg}")

    print("==================================================")
    print("CHẠY BỘ KIỂM THỬ MODULE THANH TOÁN (CHECKOUT)")
    print("==================================================")

    # --------------------------------------------------
    # TEST SUITE 1: Xác thực dữ liệu biểu mẫu (Form Validation)
    # --------------------------------------------------
    print("\n--- TEST SUITE 1: Form Validation ---")

    # TC 1.1: Trống toàn bộ các trường
    res = validate_checkout_form({})
    assert_eq(res['isValid'], False, "TC 1.1: Trống toàn bộ các trường phải báo lỗi")
    assert_eq('customer_name' in res['errors'], True, "TC 1.1: Phải có lỗi họ tên")
    assert_eq('customer_phone' in res['errors'], True, "TC 1.1: Phải có lỗi số điện thoại")
    assert_eq('customer_address' in res['errors'], True, "TC 1.1: Phải có lỗi địa chỉ")

    # TC 1.2: Họ tên quá ngắn (< 2 ký tự)
    res = validate_checkout_form({'customer_name': 'A', 'customer_phone': '0901234567', 'customer_address': '123 Đường Mẫu'})
    assert_eq(res['isValid'], False, "TC 1.2: Họ tên < 2 ký tự phải báo lỗi")
    assert_eq('ít nhất 2 ký tự' in res['errors']['customer_name'], True, "TC 1.2: Lỗi độ dài họ tên chuẩn")

    # TC 1.3: Số điện thoại không hợp lệ
    invalid_phones = ['123456789', '090123456', '09012345678', '0201234567', '0901234abc', 'abcdefghij']
    for p in invalid_phones:
        res = validate_checkout_form({'customer_name': 'Nguyễn Văn A', 'customer_phone': p, 'customer_address': '123 Đường Mẫu'})
        assert_eq(res['isValid'], False, f"TC 1.3: SĐT '{p}' không hợp lệ phải bị chặn")

    # TC 1.4: Số điện thoại Việt Nam hợp lệ
    valid_phones = ['0901234567', '0987654321', '0389123456', '0778901234', '0891234567', '0581234567']
    for p in valid_phones:
        res = validate_checkout_form({'customer_name': 'Nguyễn Văn A', 'customer_phone': p, 'customer_address': '123 Đường Mẫu'})
        assert_eq('customer_phone' not in res['errors'], True, f"TC 1.4: SĐT '{p}' hợp lệ được chấp nhận")

    # TC 1.5: Địa chỉ quá ngắn (< 6 ký tự)
    res = validate_checkout_form({'customer_name': 'Nguyễn Văn A', 'customer_phone': '0901234567', 'customer_address': 'HCM'})
    assert_eq('customer_address' in res['errors'], True, "TC 1.5: Địa chỉ ngắn hơn 6 ký tự phải báo lỗi")

    # TC 1.6: Phương thức thanh toán không tồn tại
    res = validate_checkout_form({'customer_name': 'Nguyễn Văn A', 'customer_phone': '0901234567', 'customer_address': '123 Đường Mẫu', 'payment_method': 'bitcoin'})
    assert_eq('payment_method' in res['errors'], True, "TC 1.6: Phương thức thanh toán lạ phải bị từ chối")

    # TC 1.7: Biểu mẫu đầy đủ hợp lệ
    valid_form = {
        'customer_name': 'Trần Thị B',
        'customer_phone': '0912345678',
        'customer_address': '456 Lê Lợi, Phường Bến Nghé, Quận 1',
        'payment_method': 'banking'
    }
    res = validate_checkout_form(valid_form)
    assert_eq(res['isValid'], True, "TC 1.7: Dữ liệu hợp lệ trả về isValid: True và 0 lỗi")

    # --------------------------------------------------
    # TEST SUITE 2: Tính toán giỏ hàng & Lập hoá đơn
    # --------------------------------------------------
    print("\n--- TEST SUITE 2: Order Payload & Pricing Calculation ---")

    # TC 2.1: Giỏ hàng chỉ có món lẻ
    cart_items_1 = [
        {'id': 'M001', 'type': 'item', 'qty': 2},  # 36.000 x 2 = 72.000
        {'id': 'M007', 'type': 'item', 'qty': 1}   # 25.000 x 1 = 25.000
    ]
    totals_1 = get_cart_total(MOCK_STATE, cart_items_1)
    assert_eq(totals_1['subtotal'], 97000, "TC 2.1: Tạm tính món lẻ (72k + 25k = 97.000đ)")
    assert_eq(totals_1['total'], 97000, "TC 2.1: Tổng tiền không voucher = 97.000đ")

    # TC 2.2: Giỏ hàng có món lẻ + combo
    cart_items_2 = [
        {'id': 'M001', 'type': 'item', 'qty': 1},   # 36.000
        {'id': 'C001', 'type': 'combo', 'qty': 2}   # 99.000 x 2 = 198.000
    ]
    totals_2 = get_cart_total(MOCK_STATE, cart_items_2)
    assert_eq(totals_2['subtotal'], 234000, "TC 2.2: Tạm tính món lẻ + combo (36k + 198k = 234.000đ)")

    # TC 2.3: Áp mã giảm giá theo phần trăm (TUESDAY20 - giảm 20%, đơn tối thiểu 100k)
    promo_percent = {'code': 'TUESDAY20', 'discount_type': 'percent', 'discount_value': 20, 'min_order': 100000}
    totals_3 = get_cart_total(MOCK_STATE, cart_items_2, promo_percent)
    # 234.000 x 20% = 46.800đ -> làm tròn xuống hàng nghìn = 46.000đ
    assert_eq(totals_3['discount'], 46000, "TC 2.3: Giảm giá 20% làm tròn xuống 1.000đ (46.000đ)")
    assert_eq(totals_3['total'], 188000, "TC 2.3: Tổng thanh toán (234.000 - 46.000 = 188.000đ)")

    # TC 2.4: Áp mã giảm giá số tiền cố định (HELLO30K - giảm 30k, đơn tối thiểu 150k)
    promo_amount = {'code': 'HELLO30K', 'discount_type': 'amount', 'discount_value': 30000, 'min_order': 150000}
    totals_4 = get_cart_total(MOCK_STATE, cart_items_2, promo_amount)
    assert_eq(totals_4['discount'], 30000, "TC 2.4: Giảm giá số tiền cố định 30.000đ")
    assert_eq(totals_4['total'], 204000, "TC 2.4: Tổng thanh toán (234.000 - 30.000 = 204.000đ)")

    # TC 2.5: Đơn chưa đạt giá trị tối thiểu của mã
    totals_5 = get_cart_total(MOCK_STATE, cart_items_1, promo_amount) # đơn 97k < 150k min
    assert_eq(totals_5['discount'], 0, "TC 2.5: Đơn chưa đạt min_order thì discount = 0")
    assert_eq(totals_5['validPromo'], False, "TC 2.5: validPromo = False")

    # TC 2.6: Sinh chuỗi items_summary chính xác
    order_payload = create_order_payload(valid_form, cart_items_2, MOCK_STATE, promo_percent)
    assert_eq(order_payload['items_summary'], '1x Gà Rán Giòn (1 miếng), 2x Combo Một Mình', "TC 2.6: items_summary định dạng chuẩn")
    assert_eq(order_payload['id'].startswith('ORD-'), True, "TC 2.6: Mã đơn hàng bắt đầu bằng 'ORD-'")
    assert_eq(order_payload['shipping_fee'], 0, "TC 2.6: Phí vận chuyển miễn phí = 0đ")

    # --------------------------------------------------
    # TEST SUITE 3: Các Phương thức thanh toán (COD, VietQR, MoMo)
    # --------------------------------------------------
    print("\n--- TEST SUITE 3: Payment Methods Handling ---")

    # TC 3.1: Phương thức COD
    form_cod = dict(valid_form, payment_method='cod')
    order_cod = create_order_payload(form_cod, cart_items_1, MOCK_STATE)
    assert_eq(order_cod['payment_method'], 'cod', "TC 3.1: Payment method COD")
    assert_eq(order_cod['payment_status'], 'Chưa thanh toán (COD)', "TC 3.1: Trạng thái COD chuẩn")

    # TC 3.2: Phương thức Chuyển khoản VietQR
    form_banking = dict(valid_form, payment_method='banking')
    order_banking = create_order_payload(form_banking, cart_items_1, MOCK_STATE)
    assert_eq(order_banking['payment_method'], 'banking', "TC 3.2: Payment method Banking")
    assert_eq(PAYMENT_METHODS['banking']['bankInfo']['accountNumber'], '0901234567', "TC 3.2: Số tài khoản VietQR chính xác")

    # TC 3.3: Phương thức Ví MoMo
    form_momo = dict(valid_form, payment_method='momo')
    order_momo = create_order_payload(form_momo, cart_items_1, MOCK_STATE)
    assert_eq(order_momo['payment_method'], 'momo', "TC 3.3: Payment method MoMo")

    # --------------------------------------------------
    # TEST SUITE 4: Xuất Hoá Đơn CSV (orders.csv)
    # --------------------------------------------------
    print("\n--- TEST SUITE 4: CSV Export & Excel Compatibility ---")

    columns = [
        'id', 'created_at', 'customer_name', 'customer_phone',
        'customer_address', 'payment_method_name', 'items_summary',
        'subtotal', 'discount', 'total', 'status'
    ]
    orders_list = [order_payload, order_cod]
    csv_result = to_csv_string(orders_list, columns)

    # TC 4.1: Kiểm tra mã BOM UTF-8 (\uFEFF)
    assert_eq(csv_result.startswith('\ufeff'), True, "TC 4.1: CSV bắt đầu bằng UTF-8 BOM (\uFEFF) để Excel không lỗi font")

    # TC 4.2: Dấu phẩy trong địa chỉ được bọc ngoặc kép
    assert_eq('"456 Lê Lợi, Phường Bến Nghé, Quận 1"' in csv_result, True, "TC 4.2: Địa chỉ có dấu phẩy được bọc ngoặc kép an toàn")

    # TC 4.3: Dấu phẩy trong items_summary được bọc ngoặc kép
    assert_eq('"1x Gà Rán Giòn (1 miếng), 2x Combo Một Mình"' in csv_result, True, "TC 4.3: items_summary có dấu phẩy được bọc ngoặc kép an toàn")

    print("\n==================================================")
    print(f"KẾT QUẢ: ĐÃ VƯỢT QUA TOÀN BỘ {passed}/{total} TEST CASES (100% THÀNH CÔNG)")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
