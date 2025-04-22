import { useState, useEffect } from 'react';
import '../styles/CheckboxSelector.css';

function CheckboxSelector() {
  const [status, setStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [activeTab, setActiveTab] = useState(null);

  // 获取当前活动标签页信息
  useEffect(() => {
    const getCurrentTab = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
          setActiveTab(tabs[0]);
          setTargetUrl(tabs[0].url || '');
        }
      } catch (error) {
        console.error('获取标签页信息失败:', error);
      }
    };

    getCurrentTab();
  }, []);

  // 检测支持的网站
  const isSupportedWebsite = () => {
    if (!targetUrl) return false;
    
    // 这里列出支持的网站域名
    const supportedDomains = [
      'erp.example.com',  // 示例域名，请替换为实际支持的域名
      'admin.yourshop.com',
      'localhost',
      'jambolive.tv'

    ];
    
    try {
      const url = new URL(targetUrl);
      return supportedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  // 直接操作頁面的方法 - 避免iframe和跨域限制
  const selectDirectly = async () => {
    try {
      // 清除之前的状态
      setStatus('正在检查页面元素...');
      setDebugInfo('');
      
      // 检查当前是否在支持的网站上
      if (!isSupportedWebsite() && targetUrl) {
        setStatus('当前网站不支持此功能');
        setDebugInfo(`当前网址 ${targetUrl} 不在支持列表中。此功能仅适用于特定订单管理系统。`);
        return false;
      }
      
      // 在活动标签页中执行脚本
      if (!activeTab || !activeTab.id) {
        setStatus('错误: 无法获取当前标签页');
        return false;
      }
      
      // 执行内容脚本来查找和选择复选框
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: findAndSelectCheckboxes
      });
      
      // 处理结果
      if (results && results[0]) {
        const result = results[0].result;
        setStatus(result.status);
        setDebugInfo(result.debugInfo);
        return result.success;
      } else {
        setStatus('执行脚本失败');
        setDebugInfo('无法在当前页面执行选择操作');
        return false;
      }
    } catch (error) {
      console.error('操作页面时发生错误:', error);
      setStatus(`错误: ${error.message}`);
      setDebugInfo(`操作失败: ${error.toString()}`);
      return false;
    }
  };
  
  // 检测支持的元素
  const checkSupportedElements = async () => {
    try {
      if (!activeTab || !activeTab.id) {
        setStatus('错误: 无法获取当前标签页');
        return;
      }
      
      setStatus('正在检测页面元素...');
      
      // 执行内容脚本来查找页面中的所有复选框
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: detectCheckboxes
      });
      
      if (results && results[0]) {
        const result = results[0].result;
        if (result.count > 0) {
          setStatus(`找到 ${result.count} 个复选框`);
          setDebugInfo(result.details);
        } else {
          setStatus('未找到复选框');
          setDebugInfo('当前页面没有检测到任何复选框元素。请确保您在正确的订单页面。');
        }
      }
    } catch (error) {
      console.error('检测元素时发生错误:', error);
      setStatus(`检测失败: ${error.message}`);
    }
  };

  return (
    <div className="checkbox-selector">
      <h3>複選框選擇器</h3>
      <p className="description">
        此工具可以自动选择当前页面中的复选框元素。目前设计用于特定的订单管理系统。
      </p>
      
      <div className="url-info">
        <strong>当前页面:</strong> 
        <span className="url-text">{targetUrl || '未获取到URL'}</span>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-button select-button"
          onClick={selectDirectly}
        >
          選擇前三個複選框
        </button>
        
        <button 
          className="action-button detect-button"
          onClick={checkSupportedElements}
        >
          檢測頁面元素
        </button>
      </div>
      
      {status && (
        <div className="status-container">
          <div className="status-message">{status}</div>
          {debugInfo && <div className="debug-info">{debugInfo}</div>}
        </div>
      )}
      
      <div className="instructions">
        <h4>使用說明:</h4>
        <ol>
          <li>打開包含複選框的訂單頁面</li>
          <li>點擊"選擇前三個複選框"按鈕</li>
          <li>如果無法選擇，請先點擊"檢測頁面元素"查看页面中的可用元素</li>
        </ol>
      </div>
    </div>
  );
}

// 在内容脚本中执行的函数
function findAndSelectCheckboxes() {
  try {
    // 目标选择器
    const selector = 'input[type="checkbox"].order-checkbox[name="bills"]';
    
    // 尝试找到所有可能的复选框
    let checkboxes = document.querySelectorAll(selector);
    
    // 如果没找到特定类名的复选框，尝试查找所有复选框
    if (checkboxes.length === 0) {
      // 尝试查找所有name为bills的复选框
      checkboxes = document.querySelectorAll('input[type="checkbox"][name="bills"]');
      
      // 如果还是没找到，尝试查找所有复选框
      if (checkboxes.length === 0) {
        checkboxes = document.querySelectorAll('input[type="checkbox"]');
      }
    }
    
    // 如果页面中有iframe，尝试在iframe中查找
    if (checkboxes.length === 0) {
      const iframes = document.querySelectorAll('iframe');
      for (let i = 0; i < iframes.length; i++) {
        try {
          const iframe = iframes[i];
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          
          // 尝试各种选择器
          let iframeCheckboxes = iframeDoc.querySelectorAll(selector);
          if (iframeCheckboxes.length === 0) {
            iframeCheckboxes = iframeDoc.querySelectorAll('input[type="checkbox"][name="bills"]');
          }
          if (iframeCheckboxes.length === 0) {
            iframeCheckboxes = iframeDoc.querySelectorAll('input[type="checkbox"]');
          }
          
          if (iframeCheckboxes.length > 0) {
            checkboxes = iframeCheckboxes;
            break;
          }
        } catch (e) {
          // iframe可能有跨域限制，忽略错误
        }
      }
    }
    
    // 如果找到了复选框
    if (checkboxes.length > 0) {
      // 计算要选择的数量 (最多3个)
      const count = Math.min(3, checkboxes.length);
      let selected = 0;
      
      // 选中前三个未选中的复选框
      for (let i = 0; i < checkboxes.length && selected < count; i++) {
        if (!checkboxes[i].checked && !checkboxes[i].disabled) {
          checkboxes[i].checked = true;
          
          // 触发change事件
          try {
            const event = new Event('change', { bubbles: true });
            checkboxes[i].dispatchEvent(event);
          } catch (eventError) {
            // 忽略事件触发错误
          }
          
          selected++;
        }
      }
      
      return {
        success: true,
        status: `已选中 ${selected} 个复选框`,
        debugInfo: `找到 ${checkboxes.length} 个复选框，成功选中 ${selected} 个`
      };
    } else {
      return {
        success: false,
        status: '未找到复选框',
        debugInfo: '找不到任何复选框元素。请确保您在正确的订单页面。'
      };
    }
  } catch (error) {
    return {
      success: false,
      status: '操作失败',
      debugInfo: `发生错误: ${error.message}`
    };
  }
}

// 检测页面中的所有复选框
function detectCheckboxes() {
  try {
    // 收集页面中所有的复选框信息
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const checkboxDetails = [];
    
    allCheckboxes.forEach((checkbox, index) => {
      if (index < 10) { // 只显示前10个以避免信息过多
        const classes = checkbox.className;
        const name = checkbox.getAttribute('name');
        const id = checkbox.getAttribute('id');
        
        checkboxDetails.push(`#${index+1}: ${id ? `id="${id}"` : ''} ${name ? `name="${name}"` : ''} ${classes ? `class="${classes}"` : ''}`);
      }
    });
    
    // 如果复选框过多，只显示部分
    if (allCheckboxes.length > 10) {
      checkboxDetails.push(`...以及另外 ${allCheckboxes.length - 10} 个复选框`);
    }
    
    return {
      count: allCheckboxes.length,
      details: checkboxDetails.join('\n')
    };
  } catch (error) {
    return {
      count: 0,
      details: `检测时发生错误: ${error.message}`
    };
  }
}

export default CheckboxSelector; 