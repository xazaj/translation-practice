/**
 * 状态管理模块
 * 采用发布订阅模式实现全局状态管理
 */

// 状态存储
const store = {
  state: {
    questions: [],
    currentPage: 1,
    pageSize: 10,
    studyTime: {
      startTime: null,
      totalTime: 0,
      pauseTime: null
    },
    settings: {
      isEyeProtectMode: false,
      theme: 'light'
    }
  },
  
  // 订阅者列表
  subscribers: new Map(),
  
  // 获取状态
  getState() {
    return this.state;
  },
  
  // 设置状态
  setState(path, value) {
    let target = this.state;
    const parts = path.split('.');
    
    // 遍历路径
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    
    // 设置值
    const lastPart = parts[parts.length - 1];
    target[lastPart] = value;
    
    // 通知订阅者
    this.notify(path);
    
    // 保存到本地存储
    this.saveToLocalStorage();
  },
  
  // 订阅状态变化
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path).add(callback);
    
    // 返回取消订阅的函数
    return () => {
      this.subscribers.get(path).delete(callback);
    };
  },
  
  // 通知订阅者
  notify(path) {
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(callback => {
        callback(this.state);
      });
    }
  },
  
  // 保存到本地存储
  saveToLocalStorage() {
    try {
      const stateToSave = {
        currentPage: this.state.currentPage,
        settings: this.state.settings,
        studyTime: {
          totalTime: this.state.studyTime.totalTime
        }
      };
      
      localStorage.setItem('app_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('保存状态数据时出错:', error);
    }
  },
  
  // 从本地存储加载
  loadFromLocalStorage() {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // 合并状态
        this.state.currentPage = parsedState.currentPage || 1;
        this.state.settings = { ...this.state.settings, ...parsedState.settings };
        this.state.studyTime.totalTime = parsedState.studyTime?.totalTime || 0;
      } catch (error) {
        console.error('加载状态数据时出错:', error);
      }
    }
  },
  
  // 初始化
  init() {
    this.loadFromLocalStorage();
  }
};

// 定时器管理模块
const timerManager = {
  timers: new Map(),
  
  // 创建定时器
  create(id, callback, interval) {
    this.clear(id); // 清除同ID的已存在定时器
    const timer = setInterval(callback, interval);
    this.timers.set(id, timer);
    return timer;
  },
  
  // 清除定时器
  clear(id) {
    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id));
      this.timers.delete(id);
    }
  },
  
  // 清除所有定时器
  clearAll() {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
  }
};

// 导出模块
export { store, timerManager };