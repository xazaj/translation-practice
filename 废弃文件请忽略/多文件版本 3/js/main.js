// 导入状态管理模块
import { store, timerManager } from './store.js';
import { renderQuestions, showToast } from './ui.js';

// 获取状态
const { questions, currentPage, pageSize } = store.getState();

// 加载默认题目
function loadDefaultQuestions() {
  const defaultQuestions = [];
  for (let i = 1; i <= 20; i++) {
    defaultQuestions.push({ 
      en: `Sample English sentence ${i}`, 
      zh: `示例中文句子 ${i}`,
      isQuestion: true // 标记中文为题目
    });
  }
  store.setState('questions', defaultQuestions);
}

// 处理文件上传 - 主函数
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 更新UI显示加载状态
  updateUIForLoading(file);
  
  // 读取文件内容
  readFileContent(file);
}

// 更新UI为加载状态
function updateUIForLoading(file) {
  // 更新文件名显示和加载指示器
  const fileNameElement = document.getElementById('fileName');
  fileNameElement.textContent = `正在加载 ${file.name}...`;
  fileNameElement.style.color = "var(--primary-color)";

  // 尝试从文件名中提取题目名称并更新标题
  updatePageTitle(file.name);

  // 更新文件输入框样式
  updateFileInputStyle('loading');
  
  // 显示加载中的提示
  showLoadingIndicator();
}

// 更新页面标题
function updatePageTitle(fileName) {
  let titleFromFile = fileName.replace(/\.[^/.]+$/, ""); // 移除文件扩展名
  console.log("更新标题为:", titleFromFile);
  document.querySelector('.header-content').textContent = `中英翻译练习 - ${titleFromFile}`;
  document.title = `中英翻译练习 - ${titleFromFile}`;
}

// 更新文件输入框样式
function updateFileInputStyle(status) {
  const fileInputWrapper = document.querySelector('.file-input-wrapper');
  
  // 重置样式
  fileInputWrapper.classList.remove('loading', 'success', 'error');
  
  // 添加新状态样式
  if (status) {
    fileInputWrapper.classList.add(status);
  }
}

// 显示加载指示器
function showLoadingIndicator() {
  // 检查是否已存在加载指示器
  let loadingIndicator = document.getElementById('loadingIndicator');
  
  if (!loadingIndicator) {
    // 创建加载指示器
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <div class="loading-text">正在加载题目，请稍候...</div>
    `;
    
    // 添加到页面
    document.getElementById('questions').innerHTML = '';
    document.getElementById('questions').appendChild(loadingIndicator);
  }
}

// 隐藏加载指示器
function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// 读取文件内容
function readFileContent(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      // 解析文件内容
      const content = e.target.result;
      const questions = parseFileContent(content);
      
      // 更新问题数据
      updateQuestionsData(questions);
      
      // 更新UI为成功状态
      updateUIForSuccess(file, questions.length);
    } catch (error) {
      console.error('解析文件时出错:', error);
      
      // 更新UI为错误状态
      updateUIForError(file, error.message);
    }
  };
  
  reader.onerror = function() {
    console.error('读取文件时出错');
    
    // 更新UI为错误状态
    updateUIForError(file, '读取文件失败，请重试');
  };
  
  reader.readAsText(file);
}

// 解析文件内容
function parseFileContent(content) {
  // 按行分割
  const lines = content.split('\n');
  
  // 过滤空行并解析每行
  const questions = lines
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      try {
        // 检查是否包含分隔符
        if (!line.includes('|')) {
          console.warn(`第 ${index + 1} 行格式不符 (无分隔符): "${line}"`);
          return null;
        }
        
        // 分割英文和中文
        const parts = line.split('|');
        const en = parts[0].trim();
        const zh = parts[1] ? parts[1].trim() : '';
        
        // 验证英文和中文部分
        if (!en || !zh) {
          console.warn(`第 ${index + 1} 行格式不完整: "${line}"`);
          return null;
        }
        
        // 返回问题对象，标记中文为题目
        return { en, zh, isQuestion: true };
      } catch (e) {
        console.warn(`解析第 ${index + 1} 行时出错: "${line}"`, e);
        return null;
      }
    })
    .filter(q => q !== null);
  
  // 检查是否有有效题目
  if (questions.length === 0) {
    throw new Error('未找到有效题目，请检查文件格式');
  }
  
  return questions;
}

// 更新问题数据
function updateQuestionsData(questions) {
  // 清除之前的答案
  clearPreviousAnswers();
  
  // 更新状态
  store.setState('questions', questions);
  store.setState('currentPage', 1);
  
  // 渲染问题
  renderQuestions();
}

// 清除之前的答案
function clearPreviousAnswers() {
  try {
    localStorage.removeItem('user_answers');
  } catch (error) {
    console.error('清除答案数据时出错:', error);
  }
}

// 更新UI为成功状态
function updateUIForSuccess(file, count) {
  // 隐藏加载指示器
  hideLoadingIndicator();
  
  // 更新文件名显示
  const fileNameElement = document.getElementById('fileName');
  fileNameElement.textContent = `${file.name} (${count} 题)`;
  fileNameElement.style.color = "var(--success-color)";
  
  // 更新文件输入框样式
  updateFileInputStyle('success');
  
  // 显示成功提示
  showToast(`成功加载 ${count} 道题目`, 'success');
  
  // 关闭下拉框
  document.getElementById('uploadDropdown').style.display = 'none';
}

// 更新UI为错误状态
function updateUIForError(file, errorMessage) {
  // 隐藏加载指示器
  hideLoadingIndicator();
  
  // 更新文件名显示
  const fileNameElement = document.getElementById('fileName');
  fileNameElement.textContent = `${file.name} (加载失败)`;
  fileNameElement.style.color = "var(--error-color)";
  
  // 更新文件输入框样式
  updateFileInputStyle('error');
  
  // 显示错误提示
  showToast(`加载失败: ${errorMessage}`, 'error');
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

// 初始化上传按钮
function initUploadButton() {
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadDropdown = document.getElementById('uploadDropdown');
  
  if (uploadBtn && uploadDropdown) {
    // 初始化下拉框状态
    uploadDropdown.style.display = 'none';
    
    // 添加点击事件
    uploadBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 阻止事件冒泡
      
      // 切换下拉框显示状态
      if (uploadDropdown.style.display === 'block') {
        uploadDropdown.style.display = 'none';
      } else {
        uploadDropdown.style.display = 'block';
      }
    });
    
    // 点击其他区域关闭下拉框
    document.addEventListener('click', function(event) {
      if (!uploadBtn.contains(event.target) && !uploadDropdown.contains(event.target)) {
        uploadDropdown.style.display = 'none';
      }
    });
  }
}

// 加载用户答案
function loadAnswersFromLocalStorage() {
  try {
    const savedAnswers = localStorage.getItem('user_answers');
    if (savedAnswers) {
      return JSON.parse(savedAnswers);
    }
  } catch (error) {
    console.error('加载答案数据时出错:', error);
  }
  return null;
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM加载完成，初始化应用...');
  
  // 初始化状态管理
  store.init();
  
  // 初始化上传按钮
  initUploadButton();
  
  // 绑定事件监听器
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  document.getElementById('prevBtn').addEventListener('click', prevPage);
  document.getElementById('nextBtn').addEventListener('click', nextPage);
  document.getElementById('pageInput').addEventListener('change', jumpToPage);
  
  // 将关键函数暴露到全局作用域
  window.prevPage = prevPage;
  window.nextPage = nextPage;
  window.jumpToPage = jumpToPage;
  window.handleFileUpload = handleFileUpload;
  
  // 尝试从本地存储加载答案
  const savedAnswers = loadAnswersFromLocalStorage();
  if (savedAnswers && savedAnswers.length > 0) {
    // 使用保存的答案
    store.setState('questions', savedAnswers);
  } else {
    // 加载默认题目
    loadDefaultQuestions();
  }
  
  // 渲染问题
  renderQuestions();
  
  console.log('应用初始化完成');
});

// 导出函数供其他模块使用
export {
  loadDefaultQuestions,
  handleFileUpload,
  prevPage,
  nextPage,
  jumpToPage
};