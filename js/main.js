// 导入状态管理模块
import { store } from './store.js';
import { renderQuestions, showToast } from './ui.js';

// 获取状态
const { questions, currentPage, pageSize } = store.getState();

// 加载默认题库
async function loadDefaultTxtFile() {
  try {
    // 获取default目录下的所有txt文件
    const defaultFiles = await loadDefaultDirectoryFiles();
    
    if (!defaultFiles || defaultFiles.length === 0) {
      console.log('没有找到默认题库文件，加载示例题目');
      loadDefaultQuestions();
      return;
    }
    
    // 合并所有文件内容
    const mergedQuestions = [];
    let fileNames = [];
    
    for (const file of defaultFiles) {
      try {
        const content = await fetch(file).then(res => res.text());
        const questions = processFileContent(content);
        
        if (questions && questions.length > 0) {
          // 标记来源
          questions.forEach(q => {
            q.source = file;
            mergedQuestions.push(q);
          });
          
          // 收集文件名，用于标题显示
          const fileName = file.split('/').pop().replace(/\.(txt|TXT)$/, '');
          fileNames.push(fileName);
        }
      } catch (error) {
        console.error(`加载默认题库文件失败: ${file}`, error);
      }
    }
    
    if (mergedQuestions.length > 0) {
      // 更新页面标题
      const titleText = fileNames.length > 1 
        ? `中英翻译练习 - 默认题库(${fileNames.length}个文件)` 
        : `中英翻译练习 - ${fileNames[0]}`;
      
      document.querySelector('.header-content').textContent = titleText;
      document.title = titleText;
      
      // 更新状态
      store.setState('questions', mergedQuestions);
      
      // 渲染问题
      renderQuestions();
      
      console.log(`已加载默认题库: ${mergedQuestions.length}题`);
      showToast(`已加载默认题库: ${mergedQuestions.length}题`, 'success');
    } else {
      // 如果解析失败，加载默认示例题目
      loadDefaultQuestions();
    }
  } catch (error) {
    console.error('加载默认题库失败:', error);
    // 加载失败时使用默认示例题目
    loadDefaultQuestions();
  }
}

// 获取default目录下的所有txt文件
async function loadDefaultDirectoryFiles() {
  try {
    // 获取list.txt文件内容
    const response = await fetch('data/list.txt');
    
    if (!response.ok) {
      console.error('无法读取list.txt文件');
      return [];
    }
    
    const content = await response.text();
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // 找出所有default目录下的.txt文件
    const defaultFiles = [];
    
    // 跳过第一行(通常是'.')
    for (const line of lines.slice(1)) {
      // 确保行以.txt结尾且包含默认题库目录
      if (line.endsWith('.txt') && line.split('/')[0] === 'Default') {
        // 构建正确的文件路径
        const filePath = `data/${line}`;
        defaultFiles.push(filePath);
        console.log(`找到默认题库文件: ${filePath}`);
      }
    }
    
    console.log('找到默认题库文件列表:', defaultFiles);
    return defaultFiles;
  } catch (error) {
    console.error('读取default目录失败:', error);
    return [];
  }
}

// 处理文件内容为问题列表
function processFileContent(content) {
  // 按行分割
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // 提取问题
  const questions = [];
  
  lines.forEach((line, index) => {
    // 将行分割成中英文部分
    const parts = line.split('|');
    
    if (parts.length >= 2) {
      // 格式化: 删除多余空格
      const english = parts[0].trim();
      const chinese = parts[1].trim();
      
      if (chinese && english) {
        questions.push({
          id: index + 1,
          en: english,    // 使用en字段以匹配UI.js中的字段名
          zh: chinese,    // 使用zh字段以匹配UI.js中的字段名
          userAnswer: '', // 用户答案
          showHint: false // 是否显示提示
        });
      }
    }
  });
  
  return questions;
}

// 加载默认题目
function loadDefaultQuestions() {
  const defaultQuestions = [];
  for (let i = 1; i <= 20; i++) {
    defaultQuestions.push({ 
      en: `Sample English sentence ${i}`, 
      zh: `示例中文句子 ${i}`,
      userAnswer: '',
      showHint: false
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
  
  // 初始化键盘导航功能
  initKeyboardNavigation();
  
  // 尝试从本地存储加载答案
  const savedAnswers = loadAnswersFromLocalStorage();
  if (savedAnswers && savedAnswers.length > 0) {
    // 使用保存的答案
    store.setState('questions', savedAnswers);
    renderQuestions();
  } else {
    // 尝试加载默认题库
    loadDefaultTxtFile();
  }
  
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

// 在文件处理完成后
function handleFileProcessed(questions) {
  // 更新状态
  store.setState('questions', questions);
  
  // 渲染问题
  renderQuestions();
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

// 初始化键盘导航
function initKeyboardNavigation() {
  // 监听全局键盘事件
  document.addEventListener('keydown', (e) => {
    // 获取当前激活的元素
    const activeElement = document.activeElement;
    
    // 检查是否是文本输入区域
    const isTextInput = activeElement && 
                        (activeElement.tagName === 'TEXTAREA' || 
                         activeElement.tagName === 'INPUT' && 
                         activeElement.type === 'text');
    
    // 如果不是文本输入框，直接返回
    if (!isTextInput) return;
    
    // 获取所有答题输入框
    const inputFields = Array.from(document.querySelectorAll('.answer-input'));
    
    // 如果没有找到输入框，直接返回
    if (inputFields.length === 0) return;
    
    // 找到当前输入框的索引
    const currentIndex = inputFields.indexOf(activeElement);
    
    // 如果当前元素不在答题输入框列表中，直接返回
    if (currentIndex === -1) return;
    
    // 处理向下箭头键
    if (e.key === 'ArrowDown') {
      e.preventDefault(); // 阻止默认滚动行为
      
      // 如果不是最后一个输入框，则移动到下一个输入框
      if (currentIndex < inputFields.length - 1) {
        const nextInput = inputFields[currentIndex + 1];
        nextInput.focus();
        
        // 将光标移至文本末尾
        if (nextInput.value.length) {
          nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
        }
        
        // 平滑滚动到下一个问题
        const questionElement = nextInput.closest('.question');
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    
    // 处理向上箭头键
    if (e.key === 'ArrowUp') {
      e.preventDefault(); // 阻止默认滚动行为
      
      // 如果不是第一个输入框，则移动到上一个输入框
      if (currentIndex > 0) {
        const prevInput = inputFields[currentIndex - 1];
        prevInput.focus();
        
        // 将光标移至文本末尾
        if (prevInput.value.length) {
          prevInput.selectionStart = prevInput.selectionEnd = prevInput.value.length;
        }
        
        // 平滑滚动到上一个问题
        const questionElement = prevInput.closest('.question');
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  });
  
  console.log('键盘导航功能初始化完成');
}