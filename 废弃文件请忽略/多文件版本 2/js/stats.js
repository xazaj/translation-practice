/**
 * 学习统计和成就系统
 * 用于跟踪用户学习进度，提供成就激励
 */

// 导入状态管理模块
import { store } from './store.js';

// 学习统计数据
let learningStats = {
  totalQuestions: 0,      // 总题目数
  completedQuestions: 0,  // 已完成题目数
  correctAnswers: 0,      // 正确答案数
  studySessions: 0,       // 学习次数
  streakDays: 0,          // 连续学习天数
  lastStudyDate: null,    // 上次学习日期
};

// 成就列表
const achievements = [
  { id: 'first_session', name: '初次学习', description: '完成第一次学习', unlocked: false },
  { id: 'five_questions', name: '起步', description: '完成5道题目', unlocked: false },
  { id: 'twenty_questions', name: '稳步前进', description: '完成20道题目', unlocked: false },
  { id: 'fifty_questions', name: '学习达人', description: '完成50道题目', unlocked: false },
  { id: 'three_day_streak', name: '坚持不懈', description: '连续学习3天', unlocked: false },
  { id: 'seven_day_streak', name: '习惯养成', description: '连续学习7天', unlocked: false },
  { id: 'upload_first', name: '自定义学习', description: '上传第一个题库', unlocked: false },
];

// 初始化统计系统
function initStatsSystem() {
  // 从本地存储加载数据
  loadStats();
  
  // 检查是否需要更新连续学习天数
  updateStreakDays();
  
  // 创建统计面板
  createStatsPanel();
  
  // 监听事件
  setupEventListeners();
}

// 从本地存储加载统计数据
function loadStats() {
  const savedStats = localStorage.getItem('learning_stats');
  if (savedStats) {
    try {
      const parsedStats = JSON.parse(savedStats);
      learningStats = { ...learningStats, ...parsedStats };
      
      // 转换日期字符串为Date对象
      if (learningStats.lastStudyDate) {
        learningStats.lastStudyDate = new Date(learningStats.lastStudyDate);
      }
    } catch (error) {
      console.error('加载学习统计数据时出错:', error);
    }
  }
  
  // 加载成就数据
  const savedAchievements = localStorage.getItem('achievements');
  if (savedAchievements) {
    try {
      const parsedAchievements = JSON.parse(savedAchievements);
      parsedAchievements.forEach((saved, index) => {
        if (index < achievements.length) {
          achievements[index].unlocked = saved.unlocked;
        }
      });
    } catch (error) {
      console.error('加载成就数据时出错:', error);
    }
  }
}

// 保存统计数据到本地存储
function saveStats() {
  localStorage.setItem('learning_stats', JSON.stringify(learningStats));
  localStorage.setItem('achievements', JSON.stringify(achievements));
}

// 更新连续学习天数
function updateStreakDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (learningStats.lastStudyDate) {
    const lastDate = new Date(learningStats.lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // 连续学习
      learningStats.streakDays++;
    } else if (diffDays > 1) {
      // 中断了连续学习
      learningStats.streakDays = 1;
    }
    // 如果是同一天，保持不变
  } else {
    // 第一次学习
    learningStats.streakDays = 1;
  }
  
  // 更新最后学习日期
  learningStats.lastStudyDate = today;
  saveStats();
  
  // 检查连续学习成就
  checkAchievements();
}

// 创建统计面板
function createStatsPanel() {
  const container = document.querySelector('.container');
  const questionsDiv = document.getElementById('questions');
  
  // 创建统计面板元素
  const statsPanel = document.createElement('div');
  statsPanel.className = 'stats-panel';
  statsPanel.id = 'statsPanel';
  
  // 添加统计项
  statsPanel.innerHTML = `
    <div class="stat-item">
      <div class="stat-value" id="totalQuestionsValue">${learningStats.totalQuestions}</div>
      <div class="stat-label">总题目数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="completedValue">${learningStats.completedQuestions}</div>
      <div class="stat-label">已完成</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="streakValue">${learningStats.streakDays}</div>
      <div class="stat-label">连续学习天数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="studyTimeValue">0分钟</div>
      <div class="stat-label">学习时间</div>
    </div>
  `;
  
  // 插入到容器的开头
  container.insertBefore(statsPanel, questionsDiv);
  
  // 定期更新学习时间显示
  updateStudyTimeDisplay();
  setInterval(updateStudyTimeDisplay, 60000); // 每分钟更新一次
}

// 更新学习时间显示
function updateStudyTimeDisplay() {
  const studyTimeElement = document.getElementById('studyTimeValue');
  if (studyTimeElement && typeof getFormattedStudyTime === 'function') {
    studyTimeElement.textContent = getFormattedStudyTime();
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 监听题目完成事件
  document.addEventListener('input', function(event) {
    if (event.target.tagName === 'TEXTAREA' && event.target.value.trim() !== '') {
      updateCompletedQuestions();
    }
  });
  
  // 监听文件上传事件
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', function(event) {
      if (event.target.files.length > 0) {
        setTimeout(() => {
          // 更新总题目数
          const { questions } = store.getState();
          learningStats.totalQuestions = questions.length;
          document.getElementById('totalQuestionsValue').textContent = learningStats.totalQuestions;
          saveStats();
          
          // 检查上传成就
          unlockAchievement('upload_first');
        }, 1000); // 给文件处理一些时间
      }
    });
  }
  
  // 初始会话计数
  learningStats.studySessions++;
  saveStats();
  
  // 解锁初次学习成就
  unlockAchievement('first_session');
}

// 更新已完成题目数
function updateCompletedQuestions() {
  // 计算已填写答案的题目数
  const textareas = document.querySelectorAll('textarea');
  let filledCount = 0;
  
  textareas.forEach(textarea => {
    if (textarea.value.trim() !== '') {
      filledCount++;
    }
  });
  
  // 更新统计
  learningStats.completedQuestions = Math.max(learningStats.completedQuestions, filledCount);
  document.getElementById('completedValue').textContent = learningStats.completedQuestions;
  saveStats();
  
  // 检查成就
  checkAchievements();
}

// 检查并解锁成就
function checkAchievements() {
  // 检查题目数量相关成就
  if (learningStats.completedQuestions >= 5) {
    unlockAchievement('five_questions');
  }
  
  if (learningStats.completedQuestions >= 20) {
    unlockAchievement('twenty_questions');
  }
  
  if (learningStats.completedQuestions >= 50) {
    unlockAchievement('fifty_questions');
  }
  
  // 检查连续学习天数成就
  if (learningStats.streakDays >= 3) {
    unlockAchievement('three_day_streak');
  }
  
  if (learningStats.streakDays >= 7) {
    unlockAchievement('seven_day_streak');
  }
}

// 解锁成就
function unlockAchievement(achievementId) {
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    saveStats();
    
    // 显示成就通知
    showAchievementNotification(achievement);
  }
}

// 显示成就通知
function showAchievementNotification(achievement) {
  // 创建成就通知元素
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-info">
      <div class="achievement-title">🎉 解锁成就: ${achievement.name}</div>
      <div class="achievement-description">${achievement.description}</div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 触发动画
  setTimeout(() => notification.classList.add('show'), 10);
  
  // 6秒后自动移除
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 6000);
}

// 统计数据处理
function updateStats() {
  const { questions } = store.getState();
  const stats = {
    totalQuestions: questions.length,
    completed: 0,
    streak: 1,
    studyTime: 0
  };
  
  // 更新DOM元素
  const totalQuestionsValue = document.getElementById('totalQuestionsValue');
  if (totalQuestionsValue) totalQuestionsValue.textContent = stats.totalQuestions;
}

// 在页面加载时初始化统计系统
document.addEventListener('DOMContentLoaded', function() {
  initStatsSystem();
});

export { updateStats };