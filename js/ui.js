// 导入状态管理模块
import { store } from './store.js';

// 渲染问题列表
function renderQuestions() {
  const { questions, currentPage, pageSize } = store.getState();
  const questionsContainer = document.getElementById('questions');
  
  // 清空容器
  questionsContainer.innerHTML = '';
  
  // 计算当前页的问题
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, questions.length);
  const currentQuestions = questions.slice(startIndex, endIndex);
  
  // 如果没有问题，显示提示
  if (currentQuestions.length === 0) {
    questionsContainer.innerHTML = '<div class="no-questions">没有题目，请上传题库</div>';
    return;
  }
  
  // 渲染每个问题
  currentQuestions.forEach((question, index) => {
    const questionElement = document.createElement('div');
    questionElement.className = 'question';
    questionElement.dataset.index = startIndex + index;
    
    // 构建问题HTML - 移除提示按钮，添加点击提示指示
    questionElement.innerHTML = `
      <div class="question-header">
        <div class="question-title" role="button" tabindex="0">
          <span class="question-number">${startIndex + index + 1}.</span>
          <span class="question-text">${question.zh}</span>
          <span class="tap-hint">提示</span>
        </div>
      </div>
      <div class="answer-container">
        <textarea class="answer-input" placeholder="请输入英文翻译...">${question.userAnswer || ''}</textarea>
        <div class="hint-container ${question.showHint ? 'show' : ''}">
          <div class="hint-content">
            <span class="hint-label">参考答案:</span>
            <span class="hint-text">${question.en}</span>
          </div>
        </div>
      </div>
    `;
    
    // 添加到容器
    questionsContainer.appendChild(questionElement);
    
    // 绑定事件
    const textarea = questionElement.querySelector('.answer-input');
    const questionTitle = questionElement.querySelector('.question-title');
    const hintContainer = questionElement.querySelector('.hint-container');
    
    // 保存答案 - 输入时实时保存
    textarea.addEventListener('input', function() {
      saveUserAnswer(startIndex + index, this.value);
    });
    
    // 焦点离开时保存答案
    textarea.addEventListener('blur', function() {
      saveUserAnswer(startIndex + index, this.value);
    });
    
    // 点击问题标题切换提示显示/隐藏
    questionTitle.addEventListener('click', function() {
      handleHintToggle(startIndex + index, textarea, hintContainer);
    });
    
    // 支持键盘访问
    questionTitle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleHintToggle(startIndex + index, textarea, hintContainer);
      }
    });
    
    // 按Enter键也可以切换提示
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleHintToggle(startIndex + index, textarea, hintContainer);
      }
    });
  });
  
  // 更新分页
  updatePagination();
  
  // 添加Header动画效果
  enhanceHeaderEffects();
}

// 处理提示切换 - 检查用户是否已输入答案
function handleHintToggle(index, textarea, hintContainer) {
  const { questions } = store.getState();
  const question = questions[index];
  const userAnswer = textarea.value.trim();
  
  // 如果已经显示提示，则隐藏
  if (question.showHint) {
    toggleHint(index, hintContainer, false);
    return;
  }
  
  // 如果用户未输入答案，提示用户先输入
  if (!userAnswer) {
    // 轻微抖动输入框提示用户
    textarea.classList.add('shake');
    setTimeout(() => textarea.classList.remove('shake'), 500);
    
    // 显示提示消息
    showToast('请先输入你的答案，再查看提示', 'info');
    
    // 聚焦到输入框
    textarea.focus();
    return;
  }
  
  // 用户已输入答案，显示提示
  toggleHint(index, hintContainer, true);
}

// 切换提示显示/隐藏
function toggleHint(index, hintContainer, show) {
  const { questions } = store.getState();
  
  // 更新问题数据
  const updatedQuestions = [...questions];
  updatedQuestions[index] = {
    ...updatedQuestions[index],
    showHint: show
  };
  
  // 更新状态
  store.setState('questions', updatedQuestions);
  
  // 更新UI
  if (show) {
    // 显示提示
    hintContainer.classList.add('show');
    
    // 平滑滚动到提示区域
    setTimeout(() => {
      hintContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  } else {
    // 隐藏提示
    hintContainer.classList.remove('show');
  }
  
  // 保存到本地存储
  saveAnswersToLocalStorage(updatedQuestions);
}

// 保存用户答案
function saveUserAnswer(index, answer) {
  const { questions } = store.getState();
  
  // 更新问题数据
  const updatedQuestions = [...questions];
  updatedQuestions[index] = {
    ...updatedQuestions[index],
    userAnswer: answer
  };
  
  // 更新状态
  store.setState('questions', updatedQuestions);
  
  // 保存到本地存储
  saveAnswersToLocalStorage(updatedQuestions);
}

// 保存答案到本地存储
function saveAnswersToLocalStorage(questions) {
  try {
    localStorage.setItem('user_answers', JSON.stringify(questions));
  } catch (error) {
    console.error('保存答案到本地存储时出错:', error);
  }
}

// 从本地存储加载答案
function loadAnswersFromLocalStorage() {
  try {
    const savedAnswers = localStorage.getItem('user_answers');
    if (savedAnswers) {
      return JSON.parse(savedAnswers);
    }
  } catch (error) {
    console.error('从本地存储加载答案时出错:', error);
  }
  return null;
}

// 更新分页
function updatePagination() {
  const { currentPage, questions, pageSize } = store.getState();
  const totalPages = Math.ceil(questions.length / pageSize);
  
  // 更新页码输入框
  const pageInput = document.getElementById('pageInput');
  pageInput.value = currentPage;
  pageInput.max = totalPages;
  
  // 更新总页数显示
  document.getElementById('totalPages').textContent = totalPages;
  
  // 更新上一页/下一页按钮状态
  document.getElementById('prevBtn').disabled = currentPage <= 1;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

// 上一页
function prevPage() {
  const { currentPage } = store.getState();
  if (currentPage > 1) {
    store.setState('currentPage', currentPage - 1);
    renderQuestions();
    window.scrollTo(0, 0);
  }
}

// 下一页
function nextPage() {
  const { currentPage, questions, pageSize } = store.getState();
  const totalPages = Math.ceil(questions.length / pageSize);
  
  if (currentPage < totalPages) {
    store.setState('currentPage', currentPage + 1);
    renderQuestions();
    window.scrollTo(0, 0);
  }
}

// 跳转到指定页
function jumpToPage() {
  const { questions, pageSize } = store.getState();
  const totalPages = Math.ceil(questions.length / pageSize);
  
  // 获取输入的页码
  const pageInput = document.getElementById('pageInput');
  let targetPage = parseInt(pageInput.value);
  
  // 验证页码
  if (isNaN(targetPage) || targetPage < 1) {
    targetPage = 1;
  } else if (targetPage > totalPages) {
    targetPage = totalPages;
  }
  
  // 更新输入框
  pageInput.value = targetPage;
  
  // 跳转
  store.setState('currentPage', targetPage);
  renderQuestions();
  window.scrollTo(0, 0);
}

// 显示Toast提示
function showToast(message, type = 'info', duration = 3000) {
  // 检查是否已存在Toast
  let toast = document.querySelector('.toast');
  
  // 如果已存在，先移除
  if (toast) {
    document.body.removeChild(toast);
  }
  
  // 创建新的Toast
  toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 显示Toast
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // 如果设置了持续时间，定时关闭
  if (duration > 0) {
    // 3秒后自动隐藏
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
  
  // 返回toast元素，以便调用者可以手动关闭
  return toast;
}

// 显示答案弹框
function showAnswerModal(question) {
  // 创建弹框
  const modal = document.createElement('div');
  modal.className = 'answer-modal';
  
  // 创建弹框内容
  const modalContent = document.createElement('div');
  modalContent.className = 'answer-modal-content';
  
  // 添加标题
  const title = document.createElement('h3');
  title.className = 'modal-title';
  title.textContent = '题目详情';
  modalContent.appendChild(title);
  
  // 添加内容 - 显示中文和英文
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="modal-question">${question.zh}</div>
    <div class="modal-answer">${question.en}</div>
  `;
  modalContent.appendChild(content);
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = 'var(--text-secondary)';
  modalContent.appendChild(closeBtn);
  
  // 添加到弹框
  modal.appendChild(modalContent);
  
  // 添加到页面
  document.body.appendChild(modal);
  
  // 显示弹框
  requestAnimationFrame(() => {
    modal.classList.add('show');
  });
  
  // 绑定关闭事件
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 300);
  });
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      }, 300);
    }
  });
  
  // 按ESC关闭
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      modal.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      }, 300);
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
}

// 检测是否为iOS设备
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// 增强Header效果
function enhanceHeaderEffects() {
  // 添加滚动效果
  window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 10) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  }, { passive: true }); // 使用passive监听器提高滚动性能
  
  // 添加上传按钮悬停效果
  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('mouseenter', function() {
      this.classList.add('btn-hover');
    });
    
    uploadBtn.addEventListener('mouseleave', function() {
      this.classList.remove('btn-hover');
    });
    
    // 为iOS设备添加触摸反馈
    if (isIOS()) {
      uploadBtn.addEventListener('touchstart', function() {
        this.classList.add('btn-touch');
      }, { passive: true });
      
      uploadBtn.addEventListener('touchend', function() {
        this.classList.remove('btn-touch');
        // 延迟移除以提供视觉反馈
        setTimeout(() => {
          this.classList.remove('btn-hover');
        }, 150);
      }, { passive: true });
    }
  }
  
  // 优化iOS上的输入体验
  if (isIOS()) {
    // 防止iOS上的双击缩放
    document.addEventListener('touchend', function(event) {
      if (event.target.tagName === 'TEXTAREA' || 
          event.target.classList.contains('answer-input')) {
        event.preventDefault();
      }
    }, { passive: false });
    
    // 修复iOS上输入框滚动问题
    document.querySelectorAll('textarea, .answer-input').forEach(input => {
      input.addEventListener('focus', function() {
        // 滚动到可见区域
        setTimeout(() => {
          this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    });
  }
}

// 在文档加载完成后应用iOS特定优化
document.addEventListener('DOMContentLoaded', function() {
  if (isIOS()) {
    document.body.classList.add('ios-device');
    
    // 优化iOS上的视觉反馈
    document.querySelectorAll('button, .btn').forEach(btn => {
      btn.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
      }, { passive: true });
      
      btn.addEventListener('touchend', function() {
        this.style.transform = '';
      }, { passive: true });
    });
  }
});

// 导出函数
export { renderQuestions, showToast, showAnswerModal, loadAnswersFromLocalStorage };