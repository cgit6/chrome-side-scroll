import { useState } from 'react'
import './App.css'
import ScrollButton from './components/ScrollButton'

function App() {
  return (
    <div className="app-container">

      {/* 導航欄位 */}
      <nav className="app-navbar">
        <div className="navbar-brand">
          <img src="/logo.png" className="navbar-logo" alt="Logo" />
          <h1>KQ 服飾</h1>
        </div>
        <div className="navbar-actions">
          {/* 预留未来可能添加的导航选项 */}
        </div>
      </nav>
      
      <main className="app-main">
        <ScrollButton />
      </main>
      
      <footer className="app-footer">
        <p></p>
      </footer>
    </div>
  )
}

export default App
