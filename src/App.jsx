import { useState } from 'react'
import './App.css'
import ScrollButton from './components/ScrollButton'
import ThemeToggle from './components/ThemeToggle'
import Card from './components/Card'

function App() {
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
      
      <main className="app-main">
        <div className="cards-container">
          <Card className="scroll-card">
            <ScrollButton />
          </Card>
          {/* 可以在这里添加更多卡片 */}
        </div>
      </main>
      
      <footer className="app-footer">
        <p></p>
      </footer>
    </div>
  )
}

export default App
