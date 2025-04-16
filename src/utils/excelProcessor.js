import * as XLSX from 'xlsx';

/**
 * 检查文件类型是否为有效的Excel文件
 * @param {File} file - 用户选择的文件
 * @returns {Object} 包含是否有效和错误信息的对象
 */
export const validateExcelFile = (file) => {
  if (!file) {
    return { valid: false, error: '未選擇文件' };
  }
  
  // 检查文件类型
  const validTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'text/csv' // .csv
  ];
  
  // 检查文件扩展名，因为有时候MIME类型可能不准确
  const fileName = file.name.toLowerCase();
  const isValidExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                           fileName.endsWith('.ods') || fileName.endsWith('.csv');
  
  if (!validTypes.includes(file.type) && !isValidExtension) {
    return { 
      valid: false, 
      error: '請選擇有效的Excel檔案 (.xls, .xlsx, .ods, .csv)' 
    };
  }
  
  return { valid: true, error: '' };
};

/**
 * 处理Excel文件数据
 * @param {ArrayBuffer} arrayBuffer - 文件的ArrayBuffer数据
 * @returns {Object} 包含处理结果的对象
 */
export const processExcelFile = (arrayBuffer) => {
  try {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // 获取第一个工作表
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 将工作表转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      return { success: false, error: '檔案中沒有找到數據', data: null };
    }
    
    // 处理数据，只保留姓名和商品字段
    const processedRows = processExcelData(jsonData);
    
    if (processedRows.length === 0) {
      return { success: false, error: '無法找到姓名和商品欄位', data: null };
    }
    
    return { 
      success: true, 
      error: '', 
      data: processedRows,
      message: `成功處理 ${processedRows.length} 筆數據` 
    };
  } catch (error) {
    console.error('處理Excel文件錯誤:', error);
    return { success: false, error: '無法處理Excel文件，請確保格式正確', data: null };
  }
};

/**
 * 处理Excel数据，只保留姓名和商品字段
 * @param {Array} jsonData - 从Excel读取的JSON数据
 * @returns {Array} 处理后的数据数组
 */
const processExcelData = (jsonData) => {
  if (!jsonData || jsonData.length === 0) return [];
  
  // 获取表头（第一行的键）
  const headers = Object.keys(jsonData[0]);
  
  // 寻找可能的姓名和商品字段
  const nameField = findFieldByKeywords(headers, ['姓名', '名字', '名稱', 'name', '客戶']);
  const productField = findFieldByKeywords(headers, ['商品', '產品', '品名', 'product', 'item', '貨品']);
  
  if (!nameField || !productField) {
    return [];
  }
  
  // 提取姓名和商品字段
  return jsonData.map(row => ({
    '姓名': row[nameField],
    '商品': row[productField]
  })).filter(row => row['姓名'] && row['商品']); // 过滤掉空值
};

/**
 * 辅助函数：根据关键词寻找字段
 * @param {Array} headers - 表头数组
 * @param {Array} keywords - 关键词数组
 * @returns {String|null} 找到的字段名或null
 */
const findFieldByKeywords = (headers, keywords) => {
  for (const keyword of keywords) {
    const field = headers.find(header => 
      header.toLowerCase().includes(keyword.toLowerCase())
    );
    if (field) return field;
  }
  return null;
};

/**
 * 生成并下载处理后的Excel文件
 * @param {Array} data - 要导出的数据
 * @param {String} fileName - 文件名（不包含扩展名）
 * @returns {Object} 包含是否成功和消息的对象
 */
export const generateExcelFile = (data, fileName = '處理後數據') => {
  if (!data || data.length === 0) {
    return { success: false, message: '沒有可下載的數據' };
  }
  
  try {
    // 创建新的工作簿
    const workbook = XLSX.utils.book_new();
    
    // 处理商品字段中的逗号，在逗号后添加换行符但保留逗号
    const processedData = data.map(row => ({
      '姓名': row['姓名'],
      '商品': row['商品'].replace(/,/g, ',\n')  // 在逗号后添加换行符
    }));
    
    // 创建工作表并设置表头
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['姓名', '商品'], // 表头
      ...processedData.map(row => [row['姓名'], row['商品']]) // 数据行
    ]);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 },  // 姓名列宽
      { wch: 60 }   // 商品列宽，增加宽度以适应保留逗号的情况
    ];
    
    // 设置行高
    worksheet['!rows'] = Array(processedData.length + 1).fill({ hpt: 40 }); // 增加行高
    
    // 获取工作表范围
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // 为每个单元格设置样式
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        
        // 确保单元格存在
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { v: '', t: 's' };
        }
        
        // 设置单元格样式
        worksheet[cellAddress].s = {
          font: {
            name: '微軟正黑體',
            sz: 20, // 字体大小设为20
            bold: R === 0 // 表头加粗
          },
          alignment: {
            vertical: 'center',
            horizontal: 'left',
            wrapText: true, // 启用自动换行
            indent: 1 // 添加缩进
          },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          },
          fill: {
            fgColor: { rgb: R === 0 ? "CCCCCC" : "FFFFFF" } // 表头添加背景色
          }
        };
      }
    }
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '處理後數據');
    
    // 使用完整的写入选项
    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
      cellDates: true,
      compression: true
    });
    
    // 创建Blob并下载
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: '檔案下載成功，已處理格式設定' };
  } catch (error) {
    console.error('下載檔案時發生錯誤:', error);
    return { success: false, message: '下載檔案失敗，請重試' };
  }
}; 