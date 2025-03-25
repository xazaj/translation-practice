/**
 * 状态管理模块
 * 采用发布订阅模式实现全局状态管理
 */

// 状态管理模块
const store = (function() {
  // 初始状态
  let state = {
    questions: [],
    currentPage: 1,
    pageSize: 5,
  };
  
  // 初始化
  function init() {
    // 从本地存储加载状态
    try {
      const savedState = localStorage.getItem('app_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        state = { ...state, ...parsedState };
      }
    } catch (error) {
      console.error('加载状态时出错:', error);
    }
  }
  
  // 获取状态
  function getState() {
    return state;
  }
  
  // 设置状态
  function setState(key, value) {
    // 支持嵌套路径，如 'user.name'
    if (key.includes('.')) {
      const keys = key.split('.');
      let current = state;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
    } else {
      state[key] = value;
    }
    
    // 保存到本地存储
    saveState();
  }
  
  // 保存状态到本地存储
  function saveState() {
    try {
      localStorage.setItem('app_state', JSON.stringify(state));
    } catch (error) {
      console.error('保存状态时出错:', error);
    }
  }
  
  return {
    init,
    getState,
    setState
  };
})();

// 导出模块
export { store };