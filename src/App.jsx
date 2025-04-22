import { useState } from 'react'
import './App.css'
import ScrollButton from './components/ScrollButton'
import ThemeToggle from './components/ThemeToggle'
import Card from './components/Card'
import FileConverter from './components/FileConverter'
import ExcelViewer from './components/ExcelViewer'
import CheckboxSelector from './components/CheckboxSelector'
import ErrorConsole from './components/ErrorConsole'
import DebugTester from './components/DebugTester'

function App() {
  const [activeTab, setActiveTab] = useState('excel'); // 默認顯示excel查看器

  // 切換頁籤
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="app-container">
      {/* 導航欄位 */}
      <nav className="app-navbar">
        <div className="navbar-brand">
          <img src="/logo.png" className="navbar-logo" alt="Logo" />
          <h1>KQ 服飾工具包</h1>
        </div>
        <div className="navbar-actions">
          <ThemeToggle />
        </div>
      </nav>
      
      {/* 頁籤導航 */}
      <div className="app-tabs">
        <button 
          className={`tab-button ${activeTab === 'scroll' ? 'active' : ''}`} 
          onClick={() => handleTabChange('scroll')}
        >
          滾動工具
        </button>
        <button 
          className={`tab-button ${activeTab === 'file' ? 'active' : ''}`} 
          onClick={() => handleTabChange('file')}
        >
          文件轉換
        </button>
        <button 
          className={`tab-button ${activeTab === 'excel' ? 'active' : ''}`} 
          onClick={() => handleTabChange('excel')}
        >
          付款信息查看
        </button>
        <button 
          className={`tab-button ${activeTab === 'selector' ? 'active' : ''}`} 
          onClick={() => handleTabChange('selector')}
        >
          複選框選擇器
        </button>
        <button 
          className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`} 
          onClick={() => handleTabChange('debug')}
        >
          调试工具
        </button>
      </div>
      
      <main className="app-main">
        {activeTab === 'scroll' && (
          <div className="tab-content">
            <h2 className="tab-title">滾動工具</h2>
            <ScrollButton />
          </div>
        )}
        
        {activeTab === 'file' && (
          <div className="tab-content">
            <h2 className="tab-title">文件轉換</h2>
            <FileConverter />
          </div>
        )}
        
        {activeTab === 'excel' && (
          <div className="tab-content">
            <h2 className="tab-title">付款信息查看器</h2>
            <ExcelViewer />
          </div>
        )}

        {activeTab === 'selector' && (
          <div className="tab-content">
            <h2 className="tab-title">複選框選擇器</h2>
            <CheckboxSelector />
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="tab-content">
            <h2 className="tab-title">调试工具</h2>
            <DebugTester />
          </div>
        )}
      </main>
      
      {/* 错误控制台组件 */}
      <ErrorConsole />
      
      <footer className="app-footer">
        <p>KQ 服飾工具包 © 2023</p>
      </footer>
    </div>
  )
}

export default App
