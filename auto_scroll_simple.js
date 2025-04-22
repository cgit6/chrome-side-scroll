/**
 * 优化版懒加载触发脚本
 * 确保触发懒加载的同时尽量减少对用户体验的干扰
 * 每3秒触发一次，降低资源占用
 * 检测用户滚动，避免页面抽动
 */

(function() {
  // 配置
  const config = {
    // 滚动间隔（毫秒）- 3000ms（3秒）
    interval: 3000,
    // 触发总次数
    stepCount: 40,
    // 是否打印日志
    debug: false,
    // 是否使用轻微的实际滚动（更有效但可能有轻微干扰）
    useActualScroll: true,
    // 实际滚动的像素距离（如果启用）
    scrollAmount: 100,
    // 恢复原位的延迟（毫秒）
    restoreDelay: 10,
    // 用户滚动检测
    detectUserScrolling: true,
    // 用户滚动后暂停的时间（毫秒）
    userScrollPauseTime: 1500
  };

  // 状态变量
  let isUserScrolling = false;
  let lastUserScrollTime = 0;
  let scrollTimer = null;
  let isScriptScrolling = false;

  // 日志函数
  const log = message => {
    if (config.debug) console.log(`[懒加载触发器] ${message}`);
  };

  // 设置用户滚动检测
  function setupScrollDetection() {
    if (!config.detectUserScrolling) return;
    
    log('启用用户滚动检测');
    
    // 用户滚动时
    window.addEventListener('scroll', () => {
      if (!isScriptScrolling) { // 只有非脚本触发的滚动才计算
        isUserScrolling = true;
        lastUserScrollTime = Date.now();
        
        // 清除之前的定时器
        clearTimeout(scrollTimer);
        
        // 设置新的定时器，用户停止滚动后恢复状态
        scrollTimer = setTimeout(() => {
          isUserScrolling = false;
          log('用户已停止滚动');
        }, 150);
      }
    }, { passive: true });
    
    // 触摸屏幕滚动时
    window.addEventListener('touchmove', () => {
      if (!isScriptScrolling) {
        isUserScrolling = true;
        lastUserScrollTime = Date.now();
      }
    }, { passive: true });
  }

  // 检查是否可以执行实际滚动
  function canPerformActualScroll() {
    if (!config.detectUserScrolling) return true;
    
    if (isUserScrolling) {
      log('用户正在滚动，跳过实际滚动操作');
      return false;
    }
    
    // 检查距离上次滚动的时间
    const timeSinceLastScroll = Date.now() - lastUserScrollTime;
    if (timeSinceLastScroll < config.userScrollPauseTime) {
      log(`用户刚刚滚动过，还需等待${config.userScrollPauseTime - timeSinceLastScroll}ms`);
      return false;
    }
    
    return true;
  }

  // 获取所有可能的懒加载图片元素
  function getLazyElements() {
    return document.querySelectorAll('img[data-src], img.lazy, img[loading="lazy"]');
  }

  // 有效的触发懒加载方法组合
  function triggerLazyLoad() {
    log('触发懒加载');
    
    // 保存当前滚动位置
    const originalPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // 方法1: 触发scroll事件
    window.dispatchEvent(new Event('scroll'));
    
    // 方法2: 尝试更新LazyLoad实例
    if (window.lazyLoadInstance) {
      try {
        window.lazyLoadInstance.update();
        log('LazyLoad实例已更新');
      } catch (e) {
        log('LazyLoad更新失败: ' + e.message);
      }
    }
    
    // 方法3: 触发网站特定事件
    if (document.getElementById('main')) {
      try {
        // 触发多种可能的事件
        document.getElementById('main').dispatchEvent(new Event('bills-loaded'));
        document.getElementById('main').dispatchEvent(new Event('bills-list-loaded'));
        document.getElementById('main').dispatchEvent(new Event('before-scrolling-to-page-bottom'));
      } catch (e) {
        log('触发特定事件失败: ' + e.message);
      }
    }
    
    // 方法4: 如果配置允许且用户没有滚动，进行轻微的实际滚动
    if (config.useActualScroll && canPerformActualScroll()) {
      try {
        // 标记为脚本触发的滚动
        isScriptScrolling = true;
        
        // 向下轻微滚动
        window.scrollBy({
          top: config.scrollAmount,
          behavior: 'auto'
        });
        
        // 在极短延迟后恢复原位
        setTimeout(() => {
          window.scrollTo({
            top: originalPosition,
            behavior: 'auto'
          });
          
          // 取消标记
          setTimeout(() => {
            isScriptScrolling = false;
          }, 50);
        }, config.restoreDelay);
      } catch (e) {
        isScriptScrolling = false;
        log('滚动操作失败: ' + e.message);
      }
    } else if (config.useActualScroll) {
      log('跳过实际滚动，仅使用事件触发');
    }
  }

  // 主函数：执行懒加载触发
  function start() {
    log('开始执行懒加载触发 (每3秒触发一次)');
    
    // 查检测一下初始状态
    const lazyElements = getLazyElements();
    log(`发现${lazyElements.length}个可能的懒加载元素`);
    
    // 设置滚动检测
    setupScrollDetection();
    
    // 计数器
    let counter = 0;
    
    // 设置触发间隔
    const triggerInterval = setInterval(() => {
      counter++;
      log(`执行第 ${counter}/${config.stepCount} 次触发`);
      
      // 触发懒加载
      triggerLazyLoad();
      
      // 达到最大触发次数后停止
      if (counter >= config.stepCount) {
        clearInterval(triggerInterval);
        log('懒加载触发完成');
        
        // 执行最后一次检查
        const finalLazyElements = getLazyElements();
        log(`最终还有${finalLazyElements.length}个未加载的懒加载元素`);
      }
    }, config.interval);
  }

  // 启动脚本
  log('懒加载触发脚本已加载');
  
  if (document.readyState === 'complete') {
    log('页面已加载完成，立即开始');
    // 延迟一点时间再开始，避免干扰初始页面加载
    setTimeout(start, 500);
  } else {
    log('等待页面加载完成...');
    window.addEventListener('load', () => {
      log('页面加载完成，开始执行');
      setTimeout(start, 500);
    });
  }
})(); 