// 渲染题目列表
function renderQuestions() {
  const container = document.getElementById('questions');
  const start = (currentPage - 1) * pageSize;
  const pageQuestions = questions.slice(start, start + pageSize);
  const totalPages = Math.ceil(questions.length / pageSize);

  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('pageInput').value = currentPage;
  
  // 更新进度
  const progress = Math.min(currentPage * pageSize, questions.length);
  document.getElementById('progressText').textContent = `${progress} / ${questions.length}`;
  
  // 更新进度条
  const progressPercentage = (progress / questions.length) * 100;
  document.getElementById('progressBar').style.width = `${progressPercentage}%`;

  container.innerHTML = '';
  pageQuestions.forEach((q, i) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.style.animationDelay = `${i * 0.05}s`;
    
    questionDiv.innerHTML = `
      <div class="zh-text">
        <span class="question-number">${start + i + 1}</span>
        ${q.zh}
      </div>
      <textarea placeholder="请在此翻译为英文..." aria-label="翻译为英文"></textarea>
      <button class="btn btn-primary" onclick="showAnswer(${start + i})">
        <span class="material-icons material-icon">visibility</span>查看推荐译文
      </button>
    `;
    
    container.appendChild(questionDiv);
  });
}

// 显示答案模态框
function showAnswer(index) {
  if (index >= 0 && index < questions.length) {
    const answer = questions[index].en;
    const userAnswer = document.querySelectorAll('textarea')[index % pageSize].value.trim();
    
    // 创建带动画的模态框
    const modal = document.createElement('div');
    modal.className = 'answer-modal';
    
    const content = document.createElement('div');
    content.className = 'answer-modal-content';
    
    // 比较用户答案和推荐答案
    let comparisonHtml = '';
    if (userAnswer) {
      comparisonHtml = `
        <div class="user-answer">
          <h4>你的翻译</h4>
          <p>${userAnswer}</p>
        </div>
      `;
    }
    
    content.innerHTML = `
      <div class="answer-header">
        <h3>推荐译文</h3>
        <button class="close-btn"><span class="material-icons">close</span></button>
      </div>
      <div class="answer-body">
        ${comparisonHtml}
        <div class="recommended-answer">
          <h4>${userAnswer ? '参考译文' : '推荐译文'}</h4>
          <p>${answer}</p>
        </div>
      </div>
      <div class="answer-footer">
        <button class="btn btn-primary">关闭</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 添加动画类，短暂延迟后
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 关闭模态框处理器
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => document.body.removeChild(modal), 300);
    };
    
    modal.addEventListener('click', closeModal);
    content.querySelector('.close-btn').addEventListener('click', closeModal);
    content.querySelector('.btn-primary').addEventListener('click', closeModal);
    
    content.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
}

// 提示通知函数
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.classList.add(`toast-${type}`);
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 触发动画
  setTimeout(() => toast.classList.add('show'), 10);
  
  // 4秒后自动移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 4000);
}

// 上传按钮交互
document.addEventListener('DOMContentLoaded', function() {
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadDropdown = document.getElementById('uploadDropdown');
  
  uploadBtn.addEventListener('click', function() {
    uploadDropdown.classList.toggle('show');
  });
  
  // 点击其他区域关闭下拉菜单
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.upload-nav')) {
      uploadDropdown.classList.remove('show');
    }
  });
  
  // 保存用户输入到本地存储
  document.addEventListener('input', function(event) {
    if (event.target.tagName === 'TEXTAREA') {
      const textareas = document.querySelectorAll('textarea');
      const answers = Array.from(textareas).map(textarea => textarea.value);
      
      // 保存当前页面的答案
      localStorage.setItem(`answers_page_${currentPage}`, JSON.stringify(answers));
    }
  });
  
  // 添加键盘快捷键
  document.addEventListener('keydown', function(event) {
    // 左右箭头导航
    if (event.key === 'ArrowLeft' && !event.ctrlKey && !event.metaKey) {
      document.getElementById('prevBtn').click();
    } else if (event.key === 'ArrowRight' && !event.ctrlKey && !event.metaKey) {
      document.getElementById('nextBtn').click();
    }
    
    // Ctrl+S 或 Cmd+S 保存当前进度
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveProgress();
      showToast('已保存当前进度', 'success');
    }
  });
  
  // 初始化主题切换
  initThemeToggle();
});

// 保存进度
function saveProgress() {
  const data = {
    questions: questions,
    currentPage: currentPage,
    answers: {}
  };
  
  // 收集所有页面的答案
  for (let i = 1; i <= Math.ceil(questions.length / pageSize); i++) {
    const pageAnswers = localStorage.getItem(`answers_page_${i}`);
    if (pageAnswers) {
      data.answers[i] = JSON.parse(pageAnswers);
    }
  }
  
  localStorage.setItem('translation_progress', JSON.stringify(data));
}

// 加载进度
function loadProgress() {
  const savedData = localStorage.getItem('translation_progress');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      questions = data.questions || [];
      currentPage = data.currentPage || 1;
      
      // 渲染题目
      renderQuestions();
      
      // 加载当前页面的答案
      const pageAnswers = data.answers[currentPage];
      if (pageAnswers) {
        const textareas = document.querySelectorAll('textarea');
        pageAnswers.forEach((answer, index) => {
          if (textareas[index]) {
            textareas[index].value = answer;
          }
        });
      }
      
      showToast('已恢复上次的进度', 'info');
    } catch (error) {
      console.error('加载进度时出错:', error);
    }
  }
}

// 初始化主题切换
function initThemeToggle() {
  // 检查用户偏好
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // 应用主题
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
    document.body.classList.add('dark-theme');
  }
  
  // 创建主题切换按钮
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.innerHTML = '<span class="material-icons">dark_mode</span>';
  themeToggle.title = '切换主题';
  
  // 添加到页面
  document.body.appendChild(themeToggle);
  
  // 添加切换事件
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // 更新图标
    this.innerHTML = `<span class="material-icons">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
  });
}

// 导出进度为文件
function exportProgress() {
  saveProgress();
  const data = localStorage.getItem('translation_progress');
  
  if (data) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '翻译练习进度.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('进度已导出为文件', 'success');
  }
}

// 导入进度文件
function importProgress(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = e.target.result;
      localStorage.setItem('translation_progress', data);
      loadProgress();
      showToast('进度已成功导入', 'success');
    } catch (error) {
      console.error('导入进度时出错:', error);
      showToast('导入进度失败，文件格式不正确', 'error');
    }
  };
  
  reader.readAsText(file);
}