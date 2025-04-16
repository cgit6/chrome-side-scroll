import { useState, useRef } from 'react';
import { validateExcelFile, processExcelFile, generateExcelFile } from '../utils/excelProcessor';

function FileConverter() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [processedData, setProcessedData] = useState(null);
  const [dataPreview, setDataPreview] = useState([]);
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      setProcessedData(null);
      setDataPreview([]);
      return;
    }
    
    // 使用导入的验证函数
    const validationResult = validateExcelFile(file);
    
    if (!validationResult.valid) {
      setErrorMsg(validationResult.error);
      setSelectedFile(null);
      setProcessedData(null);
      setDataPreview([]);
      event.target.value = null;
      return;
    }
    
    // 清除错误信息和之前的处理结果
    setErrorMsg('');
    setSelectedFile(file);
    setUploadStatus('');
    setProcessedData(null);
    setDataPreview([]);
  };

  // 处理文件上传和处理
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('請先選擇一個檔案');
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('處理中...');
    setErrorMsg('');
    setProcessedData(null);
    setDataPreview([]);
    
    try {
      // 使用FileReader读取文件
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        // 使用导入的处理函数
        const result = processExcelFile(e.target.result);
        
        if (!result.success) {
          setErrorMsg(result.error);
          setIsUploading(false);
          return;
        }
        
        // 保存处理后的数据
        setProcessedData(result.data);
        
        // 设置数据预览（最多显示5行）
        setDataPreview(result.data.slice(0, 5));
        
        // 更新状态
        setUploadStatus(result.message);
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        setErrorMsg('讀取文件時發生錯誤');
        setIsUploading(false);
      };
      
      // 开始读取文件
      reader.readAsArrayBuffer(selectedFile);
      
    } catch (error) {
      console.error('文件上傳處理錯誤:', error);
      setErrorMsg('檔案處理出錯，請重試');
      setUploadStatus('');
      setIsUploading(false);
    }
  };

  // 下载处理后的数据
  const handleDownload = () => {
    // 使用导入的文件生成函数
    const result = generateExcelFile(processedData);
    
    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }
    
    setUploadStatus(result.message);
  };

  // 清除已选择的文件
  const handleClear = () => {
    setSelectedFile(null);
    setUploadStatus('');
    setErrorMsg('');
    setProcessedData(null);
    setDataPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-converter">
      <div className="file-input-container">
        <input
          type="file"
          id="excelFile"
          onChange={handleFileChange}
          accept=".xls,.xlsx,.ods,.csv"
          disabled={isUploading}
          ref={fileInputRef}
          className="file-input"
        />
        <label htmlFor="excelFile" className="file-label">
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
          className={`upload-button ${isUploading ? 'uploading' : ''}`}
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? '處理中...' : '處理檔案'}
        </button>
        
        {processedData && processedData.length > 0 && (
          <button 
            className="download-button"
            onClick={handleDownload}
            disabled={isUploading}
          >
            下載處理後檔案
          </button>
        )}
        
        {selectedFile && (
          <button 
            className="clear-button"
            onClick={handleClear}
            disabled={isUploading}
          >
            清除
          </button>
        )}
      </div>
      
      {dataPreview.length > 0 && (
        <div className="data-preview">
          <h3>數據預覽（前5筆）：</h3>
          <table className="preview-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>商品</th>
              </tr>
            </thead>
            <tbody>
              {dataPreview.map((row, index) => (
                <tr key={index}>
                  <td>{row['姓名']}</td>
                  <td>{row['商品']}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {processedData.length > 5 && (
            <div className="preview-more">
              還有 {processedData.length - 5} 筆數據未顯示...
            </div>
          )}
        </div>
      )}
      
      {errorMsg && <div className="error-message">{errorMsg}</div>}
      {uploadStatus && <div className="status-message">{uploadStatus}</div>}
    </div>
  );
}

export default FileConverter; 