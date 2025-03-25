/**
 * 眼部保护和学习时间管理模块
 * 用于减少视觉疲劳，提高长时间学习的舒适度
 */

// 导入状态管理模块
import { store, timerManager } from './store.js';
import { showToast } from './ui.js';

// 获取状态
const { studyTime, settings } = store.getState();

// 初始化眼部保护模式
function initEyeProtection() {
  // 获取已存在的护眼模式按钮
  const eyeProtectToggle = document.getElementById('eyeProtectToggle');
  
  if (!eyeProtectToggle) {
    console.error('护眼模式按钮未找到');
    return;
  }
  
  // 检查本地存储中的设置
  let isEyeProtectMode = false;
  if (localStorage.getItem('eye_protect_mode') === 'true') {
    document.body.classList.add('eye-protect-mode');
    isEyeProtectMode = true;
    eyeProtectToggle.querySelector('.eye-icon').textContent = '👁️‍🗨️';
  }
  
  // 添加切换事件
  eyeProtectToggle.addEventListener('click', function() {
    document.body.classList.toggle('eye-protect-mode');
    isEyeProtectMode = document.body.classList.contains('eye-protect-mode');
    localStorage.setItem('eye_protect_mode', isEyeProtectMode);
    
    // 更新图标
    this.querySelector('.eye-icon').textContent = isEyeProtectMode ? '👁️‍🗨️' : '👁️';
    
    // 显示提示
    showToast(`护眼模式已${isEyeProtectMode ? '开启' : '关闭'}`, 'info');
  });
  
  // 设置定时提醒
  setupEyeRestReminder();
}

// 设置眼睛休息提醒
function setupEyeRestReminder() {
  // 每30分钟提醒休息一次
  timerManager.create('eyeRestReminder', function() {
    showToast('建议休息一下眼睛，看看远处或闭目片刻', 'warning');
  }, 1800000); // 30分钟 = 1800000毫秒
  
  // 每60分钟提醒站起来活动
  timerManager.create('stretchReminder', function() {
    showToast('建议站起来活动一下，伸展身体', 'warning');
  }, 3600000); // 60分钟 = 3600000毫秒
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

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initEyeProtection();
  
  // 每30秒检查一次学习时间
  timerManager.create('studyTimeTracker', function() {
    // 更新学习时间
    const { studyTime } = store.getState();
    if (studyTime.startTime && !studyTime.pauseTime) {
      const currentTime = Date.now();
      const sessionTime = Math.floor((currentTime - studyTime.startTime) / 1000);
      const totalTime = studyTime.totalTime + sessionTime;
      
      // 更新状态
      store.setState('studyTime.totalTime', totalTime);
      
      // 如果学习时间超过2小时，提醒休息
      if (sessionTime > 7200) { // 2小时 = 7200秒
        showToast('您已连续学习超过2小时，建议休息一下', 'warning');
      }
    }
  }, 30000);
});