import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

function ExcelViewer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [excelData, setExcelData] = useState([]);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const fileInputRef = useRef(null);

  // 验证文件类型
  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: '未選擇文件' };
    }
    
    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                             fileName.endsWith('.ods') || fileName.endsWith('.csv');
    
    if (!isValidExtension) {
      return { 
        valid: false, 
        error: '請選擇有效的Excel檔案 (.xls, .xlsx, .ods, .csv)' 
      };
    }
    
    return { valid: true, error: '' };
  };

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      setExcelData([]);
      setIsDataVisible(false);
      setCheckedItems({});
      return;
    }
    
    const validationResult = validateFile(file);
    
    if (!validationResult.valid) {
      setErrorMsg(validationResult.error);
      setSelectedFile(null);
      setExcelData([]);
      setIsDataVisible(false);
      setCheckedItems({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setErrorMsg('');
    setSelectedFile(file);
    setIsDataVisible(false);
    setCheckedItems({});
  };

  // 处理文件上传并解析
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('請先選擇一個檔案');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // 使用FileReader读取文件
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 获取第一个工作表
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 将工作表转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setErrorMsg('檔案中沒有找到數據');
          setIsLoading(false);
          return;
        }
        
        // 寻找付款单号和FB账号字段
        const headers = Object.keys(jsonData[0]);
        const paymentField = findFieldByKeywords(headers, ['付款單號', '付款编号', '訂單編號', '訂單號', 'payment', 'order']);
        const fbField = findFieldByKeywords(headers, ['FB帳號', 'FB账号', 'FB', 'Facebook', '臉書帳號']);
        
        if (!paymentField || !fbField) {
          setErrorMsg('無法找到"付款單號"和"FB帳號"欄位，請確認Excel檔案格式');
          setIsLoading(false);
          return;
        }
        
        // 提取所需字段
        const extractedData = jsonData.map(row => ({
          '付款單號': row[paymentField],
          'FB帳號': row[fbField]
        })).filter(row => row['付款單號'] && row['FB帳號']); // 过滤掉空值
        
        if (extractedData.length === 0) {
          setErrorMsg('未找到有效的付款單號和FB帳號數據');
          setIsLoading(false);
          return;
        }
        
        setExcelData(extractedData);
        setIsDataVisible(true);
        setIsLoading(false);
        // 重置复选框状态
        setCheckedItems({});
      };
      
      reader.onerror = () => {
        setErrorMsg('讀取文件時發生錯誤');
        setIsLoading(false);
      };
      
      // 开始读取文件
      reader.readAsArrayBuffer(selectedFile);
      
    } catch (error) {
      console.error('文件處理錯誤:', error);
      setErrorMsg('檔案處理出錯，請重試');
      setIsLoading(false);
    }
  };

  // 辅助函数：根据关键词寻找字段
  const findFieldByKeywords = (headers, keywords) => {
    for (const keyword of keywords) {
      const field = headers.find(header => 
        typeof header === 'string' && header.toLowerCase().includes(keyword.toLowerCase())
      );
      if (field) return field;
    }
    return null;
  };

  // 清除已选择的文件
  const handleClear = () => {
    setSelectedFile(null);
    setErrorMsg('');
    setExcelData([]);
    setIsDataVisible(false);
    setCheckedItems({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 关闭数据区域
  const hideDataArea = () => {
    setIsDataVisible(false);
  };

  // 处理复选框变化
  const handleCheckboxChange = (event) => {
    setCheckedItems({
      ...checkedItems,
      [event.target.value]: event.target.checked
    });
  };

  // 选择前三项
  const selectFirstThree = () => {
    const newCheckedItems = {};
    // 获取前三项的付款单号作为值
    excelData.slice(0, 3).forEach(item => {
      newCheckedItems[item['付款單號']] = true;
    });
    setCheckedItems(newCheckedItems);
  };

  return (
    <div className="excel-viewer">
      <div className="file-input-section">
        <div className="file-input-container">
          <input
            type="file"
            id="excelPaymentFile"
            onChange={handleFileChange}
            accept=".xls,.xlsx,.ods,.csv"
            disabled={isLoading}
            ref={fileInputRef}
            className="file-input"
          />
          <label htmlFor="excelPaymentFile" className="file-label">
            {selectedFile ? selectedFile.name : '選擇Excel檔案'}
          </label>
        </div>
        
        {selectedFile && (
          <div className="file-info">
            <span>已選擇: {selectedFile.name}</span>
            <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}
        
        <div className="file-actions">
          <button 
            className={`upload-button ${isLoading ? 'loading' : ''}`}
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? '處理中...' : '查看付款信息'}
          </button>
          
          {selectedFile && (
            <button 
              className="clear-button"
              onClick={handleClear}
              disabled={isLoading}
            >
              清除
            </button>
          )}
        </div>
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}
      </div>
      
      {/* 顯示數據區域（直接顯示在主頁面） */}
      {isDataVisible && (
        <div className="data-area">
          <div className="data-header">
            <h3>付款信息列表</h3>
            <div className="data-actions">
              <button className="select-button" onClick={selectFirstThree}>
                選擇前三筆
              </button>
              <button className="data-close" onClick={hideDataArea}>收起</button>
            </div>
          </div>
          <div className="data-content">
            {excelData.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th width="50">選擇</th>
                    <th>付款單號</th>
                    <th>FB帳號</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => (
                    <tr key={index} className={checkedItems[row['付款單號']] ? 'selected' : ''}>
                      <td>
                        <input 
                          type="checkbox" 
                          className="order-checkbox" 
                          name="bills" 
                          value={row['付款單號']}
                          checked={!!checkedItems[row['付款單號']]}
                          onChange={handleCheckboxChange}
                        />
                      </td>
                      <td>{row['付款單號']}</td>
                      <td>{row['FB帳號']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>沒有找到數據</p>
            )}
          </div>
          <div className="data-footer">
            <span>共 {excelData.length} 筆記錄，已選擇 {Object.values(checkedItems).filter(v => v).length} 筆</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelViewer; 