// 导入状态管理模块
import { store, timerManager } from './store.js';
import { renderQuestions, showToast } from './ui.js';

// 获取状态
const { questions, currentPage, pageSize } = store.getState();

// 加载默认题目
function loadDefaultQuestions() {
  const defaultQuestions = [];
  for (let i = 1; i <= 20; i++) {
    defaultQuestions.push({ en: `Sample English sentence ${i}`, zh: `示例中文句子 ${i}` });
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
  fileInputWrapper.style.borderLeft = "";
  fileInputWrapper.style.backgroundColor = "";
  
  // 根据状态设置样式
  switch(status) {
    case 'loading':
      fileInputWrapper.style.borderLeft = "4px solid var(--primary-color)";
      fileInputWrapper.style.backgroundColor = "rgba(var(--primary-rgb), 0.05)";
      break;
    case 'success':
      fileInputWrapper.style.borderLeft = "4px solid var(--success-color)";
      fileInputWrapper.style.backgroundColor = "rgba(var(--success-rgb), 0.05)";
      break;
    case 'error':
      fileInputWrapper.style.borderLeft = "4px solid var(--error-color)";
      fileInputWrapper.style.backgroundColor = "rgba(var(--error-rgb), 0.05)";
      break;
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
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载题目，请稍候...</div>
    `;
    
    // 添加到问题容器
    const questionsContainer = document.getElementById('questions');
    questionsContainer.innerHTML = '';
    questionsContainer.appendChild(loadingIndicator);
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
      const content = e.target.result;
      
      // 解析文件内容
      const questions = parseFileContent(content);
      
      if (questions.length > 0) {
        // 清除之前的答题数据
        clearPreviousAnswers();
        
        // 更新问题数据
        updateQuestionsData(questions);
        
        // 更新UI为成功状态
        updateUIForSuccess(questions.length);
      } else {
        // 更新UI为错误状态
        updateUIForError("文件格式错误或没有有效题目");
      }
    } catch (error) {
      console.error("解析文件时出错:", error);
      updateUIForError("解析文件时出错: " + error.message);
    }
  };
  
  reader.onerror = function() {
    console.error("读取文件时出错");
    updateUIForError("读取文件时出错");
  };
  
  reader.readAsText(file);
}

// 清除之前的答题数据
function clearPreviousAnswers() {
  // 清除本地存储中的答题数据
  const currentQuestions = store.getState().questions;
  
  // 创建一个新的问题数组，但不包含用户答案
  const cleanedQuestions = currentQuestions.map(q => ({
    en: q.en,
    zh: q.zh
  }));
  
  // 更新状态
  store.setState('questions', cleanedQuestions);
  store.setState('currentPage', 1);
  
  // 清除本地存储中的答题进度
  localStorage.removeItem('user_answers');
  
  console.log("已清除之前的答题数据");
}

// 解析文件内容
function parseFileContent(content) {
  const lines = content.split('\n');
  const questions = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // 尝试不同的分隔符
    let parts;
    if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('  ')) {
      parts = line.split(/\s{2,}/); // 两个或更多空格
    } else {
      continue; // 跳过无法解析的行
    }
    
    if (parts.length >= 2) {
      const en = parts[0].trim();
      const zh = parts[1].trim();
      
      if (en && zh) {
        questions.push({ en, zh });
      }
    }
  }
  
  return questions;
}

// 更新问题数据
function updateQuestionsData(questions) {
  // 更新状态
  store.setState('questions', questions);
  store.setState('currentPage', 1);
  
  // 渲染问题
  renderQuestions();
  
  console.log(`已加载 ${questions.length} 个问题`);
}

// 更新UI为成功状态
function updateUIForSuccess(questionCount) {
  // 更新文件名显示
  const fileNameElement = document.getElementById('fileName');
  fileNameElement.textContent = `已加载 ${questionCount} 个题目`;
  fileNameElement.style.color = "var(--success-color)";
  
  // 更新文件输入框样式
  updateFileInputStyle('success');
  
  // 隐藏加载指示器
  hideLoadingIndicator();
  
  // 显示成功提示
  showToast(`成功加载 ${questionCount} 个题目`, 'success');
  
  // 关闭上传下拉框
  const uploadDropdown = document.getElementById('uploadDropdown');
  if (uploadDropdown) {
    uploadDropdown.style.display = 'none';
  }
}

// 更新UI为错误状态
function updateUIForError(errorMessage) {
  // 更新文件名显示
  const fileNameElement = document.getElementById('fileName');
  fileNameElement.textContent = `加载失败: ${errorMessage}`;
  fileNameElement.style.color = "var(--error-color)";
  
  // 更新文件输入框样式
  updateFileInputStyle('error');
  
  // 隐藏加载指示器
  hideLoadingIndicator();
  
  // 显示错误提示
  showToast(`加载失败: ${errorMessage}`, 'error');
}

// 上一页
function prevPage() {
  const { currentPage } = store.getState();
  if (currentPage > 1) {
    store.setState('currentPage', currentPage - 1);
    renderQuestions();
  }
}

// 下一页
function nextPage() {
  const { questions, currentPage, pageSize } = store.getState();
  const totalPages = Math.ceil(questions.length / pageSize);
  if (currentPage < totalPages) {
    store.setState('currentPage', currentPage + 1);
    renderQuestions();
  }
}

// 跳转到指定页
function jumpToPage() {
  const { questions, pageSize } = store.getState();
  const page = parseInt(document.getElementById('pageInput').value);
  const totalPages = Math.ceil(questions.length / pageSize);
  if (page >= 1 && page <= totalPages) {
    store.setState('currentPage', page);
    renderQuestions();
  }
}

// 初始化上传按钮功能
function initUploadButton() {
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadDropdown = document.getElementById('uploadDropdown');
  
  if (uploadBtn && uploadDropdown) {
    uploadBtn.addEventListener('click', function() {
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

// 初始化
document.addEventListener('DOMContentLoaded', function() {
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
  
  // 加载默认题目并渲染
  loadDefaultQuestions();
  renderQuestions();
});

// 导出函数供其他模块使用
export {
  loadDefaultQuestions,
  handleFileUpload,
  prevPage,
  nextPage,
  jumpToPage
};