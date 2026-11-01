/**
 * js/csv.js
 * Quản lý đọc, phân tích và xuất dữ liệu CSV thuần (Vanilla JS)
 */

// Danh sách các cột dạng số để tự động ép kiểu
const NUMERIC_COLUMNS = new Set([
  'price', 'popularity', 'rating', 'discount_value',
  'min_order', 'combo_price', 'lat', 'lng'
]);

/**
 * Tải file CSV từ đường dẫn và parse thành mảng object
 * @param {string} path - Đường dẫn tới file .csv
 * @returns {Promise<Array<Object>>}
 */
export async function loadCSV(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Lỗi tải file (${response.status}): ${path}`);
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error('Lỗi khi nạp CSV:', error);
    throw error;
  }
}

/**
 * Phân tích chuỗi CSV theo chuẩn RFC 4180
 * @param {string} text - Nội dung chuỗi CSV
 * @returns {Array<Object>}
 */
export function parseCSV(text) {
  if (!text || !text.trim()) return [];

  const rawRows = splitCSVToRows(text.trim());
  if (rawRows.length < 2) return [];

  const headers = rawRows[0].map(h => h.trim());
  const data = [];

  for (let i = 1; i < rawRows.length; i++) {
    const rowValues = rawRows[i];
    if (rowValues.length === 1 && !rowValues[0].trim()) continue;

    const rowObj = {};
    headers.forEach((header, index) => {
      const rawValue = (rowValues[index] !== undefined) ? rowValues[index].trim() : '';
      rowObj[header] = castCSVValue(header, rawValue);
    });
    data.push(rowObj);
  }

  return data;
}

/**
 * Tách nội dung CSV thành mảng các hàng, mỗi hàng là mảng các ô
 * Xử lý ngoặc kép, dấu phẩy và xuống dòng bên trong ngoặc kép
 * @param {string} text
 * @returns {Array<Array<string>>}
 */
function splitCSVToRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      }
      insideQuotes = !insideQuotes;
      i++;
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
      i++;
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i++;
    } else {
      currentField += char;
      i++;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Ép kiểu dữ liệu từng cột theo quy ước trong DATA.md
 * @param {string} key
 * @param {string} val
 * @returns {any}
 */
function castCSVValue(key, val) {
  if (key.startsWith('is_')) {
    return val === '1' || val.toLowerCase() === 'true';
  }
  if (NUMERIC_COLUMNS.has(key)) {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }
  if (key === 'tags') {
    return val ? val.split('|').map(tag => tag.trim()).filter(Boolean) : [];
  }
  return val;
}

/**
 * Chuyển đổi mảng đối tượng thành chuỗi CSV chuẩn
 * @param {Array<Object>} rows
 * @param {Array<string>} columns
 * @returns {string}
 */
export function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return '';
  const cols = columns || Object.keys(rows[0]);
  
  const headerLine = cols.map(escapeCSVField).join(',');
  const rowLines = rows.map(row => {
    return cols.map(col => escapeCSVField(row[col] ?? '')).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Thoát ký tự ô CSV (bọc ngoặc kép nếu có phẩy, ngoặc kép, xuống dòng)
 * @param {any} val
 * @returns {string}
 */
function escapeCSVField(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Tải xuống file CSV về máy người dùng với BOM UTF-8 (\uFEFF)
 * @param {string} filename - Tên file tải về (ví dụ 'bookings.csv')
 * @param {Array<Object>} rows - Danh sách dữ liệu
 * @param {Array<string>} columns - Danh sách cột
 */
export function downloadCSV(filename, rows, columns) {
  const csvData = toCSV(rows, columns);
  const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
