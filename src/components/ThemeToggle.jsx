import { useState, useEffect } from 'react';

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // 当组件加载时，检查之前保存的主题设置
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="theme-toggle">
      <span className="theme-icon">☀️</span>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={darkMode}
          onChange={toggleTheme}
        />
        <span className="slider round"></span>
      </label>
      <span className="theme-icon">🌙</span>
    </div>
  );
}

export default ThemeToggle; 