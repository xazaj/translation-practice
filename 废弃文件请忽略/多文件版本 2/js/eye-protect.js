/**
 * 眼部保护和学习时间管理模块
 * 用于减少视觉疲劳，提高长时间学习的舒适度
 */

// 导入状态管理模块
import { store, timerManager } from './store.js';

// 获取状态
const { studyTime, settings } = store.getState();

// 初始化眼部保护模式
function initEyeProtection() {
  // 创建眼部保护模式切换按钮
  const eyeProtectToggle = document.createElement('button');
  eyeProtectToggle.className = 'eye-protect-toggle';
  eyeProtectToggle.textContent = '护眼模式';
  eyeProtectToggle.title = '护眼模式';
  
  // 添加到页面
  document.body.appendChild(eyeProtectToggle);
  
  // 检查本地存储中的设置
  if (localStorage.getItem('eye_protect_mode') === 'true') {
    document.body.classList.add('eye-protect-mode');
    isEyeProtectMode = true;
    eyeProtectToggle.textContent = '关闭护眼';
  }
  
  // 添加切换事件
  eyeProtectToggle.addEventListener('click', function() {
    document.body.classList.toggle('eye-protect-mode');
    isEyeProtectMode = document.body.classList.contains('eye-protect-mode');
    localStorage.setItem('eye_protect_mode', isEyeProtectMode);
    
    // 更新文本
    this.textContent = isEyeProtectMode ? '关闭护眼' : '护眼模式';
    
    // 显示提示
    showToast(`护眼模式已${isEyeProtectMode ? '开启' : '关闭'}`, 'info');
  });
  
  // 初始化学习时间追踪
  initStudyTimeTracking();
}

// 初始化学习时间追踪
function initStudyTimeTracking() {
  // 开始计时
  startStudyTimer();
  
  // 设置休息提醒 - 每25分钟提醒一次
  const reminderInterval = 25 * 60 * 1000; // 25分钟
  timerManager.create('restReminder', showRestReminder, reminderInterval);
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 页面关闭前保存学习时间
  window.addEventListener('beforeunload', saveStudyTime);
}

// 开始学习计时器
function startStudyTimer() {
  const { studyTime } = store.getState();
  if (!studyTime.startTime) {
    store.setState('studyTime.startTime', new Date());
  } else if (studyTime.pauseTime) {
    // 如果是从暂停恢复，计算暂停的时间差
    const pauseDuration = new Date() - studyTime.pauseTime;
    store.setState('studyTime.startTime', new Date(studyTime.startTime.getTime() + pauseDuration));
    store.setState('studyTime.pauseTime', null);
  }
}

// 暂停学习计时器
function pauseStudyTimer() {
  const { studyTime } = store.getState();
  if (studyTime.startTime && !studyTime.pauseTime) {
    // 计算当前学习时间并累加到总时间
    const currentSession = new Date() - studyTime.startTime;
    store.setState('studyTime.totalTime', studyTime.totalTime + currentSession);
    
    // 标记暂停时间
    store.setState('studyTime.pauseTime', new Date());
  }
}

// 处理页面可见性变化
function handleVisibilityChange() {
  if (document.hidden) {
    // 页面不可见时暂停计时
    pauseStudyTimer();
  } else {
    // 页面可见时恢复计时
    startStudyTimer();
  }
}

// 保存学习时间
function saveStudyTime() {
  const { studyTime } = store.getState();
  if (studyTime.startTime && !studyTime.pauseTime) {
    // 计算当前学习时间并累加到总时间
    const currentSession = new Date() - studyTime.startTime;
    store.setState('studyTime.totalTime', studyTime.totalTime + currentSession);
  }
}

// 显示休息提醒
function showRestReminder() {
  // 创建提醒元素
  const reminder = document.createElement('div');
  reminder.className = 'timer-reminder';
  reminder.innerHTML = `
    <div>
      <strong>休息提醒</strong><br>
      您已连续学习25分钟，建议休息5分钟，活动一下眼睛和身体。
    </div>
  `;
  
  document.body.appendChild(reminder);
  
  // 触发动画
  setTimeout(() => reminder.classList.add('show'), 10);
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '关闭';
  closeBtn.style.marginLeft = '10px';
  reminder.appendChild(closeBtn);
  
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    reminder.classList.remove('show');
    setTimeout(() => document.body.removeChild(reminder), 300);
  });
  
  // 30秒后自动关闭
  setTimeout(() => {
    if (document.body.contains(reminder)) {
      reminder.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(reminder)) {
          document.body.removeChild(reminder);
        }
      }, 300);
    }
  }, 30000);
}

// 获取格式化的学习时间
function getFormattedStudyTime() {
  const { studyTime } = store.getState();
  let timeInSeconds = Math.floor(studyTime.totalTime / 1000);
  
  if (studyTime.startTime && !studyTime.pauseTime) {
    timeInSeconds += Math.floor((new Date() - studyTime.startTime) / 1000);
  }
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

// 清理计时器
function cleanupStudyTimers() {
  timerManager.clearAll();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initEyeProtection();
});