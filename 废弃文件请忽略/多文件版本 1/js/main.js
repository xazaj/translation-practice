// 全局变量
let questions = [];
let currentPage = 1;
const pageSize = 10;

// 加载默认题目
function loadDefaultQuestions() {
  questions = [];
  for (let i = 1; i <= 20; i++) {
    questions.push({ en: `Sample English sentence ${i}`, zh: `示例中文句子 ${i}` });
  }
}

// 处理文件上传
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 更新文件名显示和加载指示器
  const fileNameElement = document.getElementById('fileName');
  fileNameElement.textContent = `正在加载 ${file.name}...`;
  fileNameElement.style.color = "var(--primary-color)";

  // 尝试从文件名中提取题目名称
  let titleFromFile = file.name.replace(/\.[^/.]+$/, ""); // 移除文件扩展名
  
  // 立即更新标题，不等待文件加载完成
  console.log("更新标题为:", titleFromFile);
  document.querySelector('.header-content').textContent = `中英翻译练习 - ${titleFromFile}`;
  document.title = `中英翻译练习 - ${titleFromFile}`;

  // 使用正确的元素选择器，因为HTML中没有.upload元素
  const uploadNav = document.querySelector('.upload-nav');
  const fileInputWrapper = document.querySelector('.file-input-wrapper');
  fileInputWrapper.style.borderLeft = "3px solid var(--primary-color)";
  fileInputWrapper.style.backgroundColor = "rgba(63, 140, 181, 0.05)";
  
  // 显示加载中的提示
  const container = document.getElementById('questions');
  container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--primary-color);"><span class="material-icons" style="font-size: 36px; margin-bottom: 10px;">hourglass_top</span><p>正在加载题目，请稍候...</p></div>';

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const lines = e.target.result.split(/\r?\n/);
      const newQuestions = [];
      
      // 调试信息
      console.log(`文件内容行数: ${lines.length}`);
      
      lines.forEach((line, index) => {
        if (line.trim() === '') return; // 跳过空行
        
        const parts = line.split('|');
        if (parts.length === 2) {
          const en = parts[0].trim();
          const zh = parts[1].trim();
          if (en && zh) {
            newQuestions.push({ en, zh });
          } else {
            console.log(`第${index+1}行格式不正确:`, line);
          }
        } else {
          console.log(`第${index+1}行分隔符数量不正确:`, line);
        }
      });
      
      console.log(`解析出有效题目数量: ${newQuestions.length}`);

      if (newQuestions.length > 0) {
        // 清空原有题目，完全替换为新题目
        questions = [];
        questions = [...newQuestions];
        currentPage = 1;
        
        // 再次确保标题已更新（双重保险）
        document.querySelector('.header-content').textContent = `中英翻译练习 - ${titleFromFile}`;
        document.title = `中英翻译练习 - ${titleFromFile}`;
        
        // 确保调用renderQuestions()来更新题目
        renderQuestions();
        console.log('题目已更新:', questions.length, '道题目');
        
        // 显示成功反馈
        fileNameElement.textContent = `已成功加载: ${file.name} (${newQuestions.length}题)`;
        fileNameElement.style.color = "var(--success-color)";
        const fileInputWrapper = document.querySelector('.file-input-wrapper');
        fileInputWrapper.style.borderLeft = "3px solid var(--success-color)";
        fileInputWrapper.style.backgroundColor = "rgba(76, 175, 80, 0.05)";
        
        // 创建提示通知
        showToast(`成功加载${newQuestions.length}道题目，题目已更新`, 'success');
        
        // 关闭上传下拉菜单
        document.getElementById('uploadDropdown').classList.remove('show');
        
        setTimeout(() => {
          fileInputWrapper.style.backgroundColor = "";
          fileNameElement.style.color = "var(--text-secondary)";
        }, 3000);
        
        // 强制重新渲染一次，确保题目更新
        setTimeout(() => renderQuestions(), 100);
      } else {
        // 显示错误反馈
        fileNameElement.textContent = "上传失败 - 未识别到有效题目";
        fileNameElement.style.color = "var(--error-color)";
        const fileInputWrapper = document.querySelector('.file-input-wrapper');
        fileInputWrapper.style.borderLeft = "3px solid var(--error-color)";
        fileInputWrapper.style.backgroundColor = "rgba(244, 67, 54, 0.05)";
        
        showToast("未能识别任何有效题目，请检查文件格式是否为 '英文 | 中文'。无效行将被忽略。", 'error');
      }
    } catch (error) {
      console.error('文件解析错误:', error);
      fileNameElement.textContent = "上传失败 - 文件解析错误";
      fileNameElement.style.color = "var(--error-color)";
      const fileInputWrapper = document.querySelector('.file-input-wrapper');
      fileInputWrapper.style.borderLeft = "3px solid var(--error-color)";
      fileInputWrapper.style.backgroundColor = "rgba(244, 67, 54, 0.05)";
      
      showToast("文件解析出错，请检查文件格式是否正确", 'error');
    }
  };
  
  reader.onerror = function() {
    console.error('FileReader 错误');
    const fileNameElement = document.getElementById('fileName');
    fileNameElement.textContent = "上传失败 - 读取文件错误";
    fileNameElement.style.color = "var(--error-color)";
    
    const fileInputWrapper = document.querySelector('.file-input-wrapper');
    fileInputWrapper.style.borderLeft = "3px solid var(--error-color)";
    fileInputWrapper.style.backgroundColor = "rgba(244, 67, 54, 0.05)";
    
    showToast("读取文件时出错，请重试", 'error');
  };
  
  reader.readAsText(file, 'UTF-8');
}

// 页面导航函数
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderQuestions();
    
    // 添加过渡反馈
    const btn = document.querySelector('.btn-secondary');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 200);
  }
}

function nextPage() {
  if (currentPage * pageSize < questions.length) {
    currentPage++;
    renderQuestions();
    
    // 添加过渡反馈
    const btn = document.querySelector('.btn-primary');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 200);
  }
}

function jumpToPage() {
  const page = parseInt(document.getElementById('pageInput').value);
  const totalPages = Math.ceil(questions.length / pageSize);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderQuestions();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  // 绑定事件监听器
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  document.getElementById('prevBtn').addEventListener('click', prevPage);
  document.getElementById('nextBtn').addEventListener('click', nextPage);
  document.getElementById('pageInput').addEventListener('change', jumpToPage);
  
  // 加载默认题目并渲染
  loadDefaultQuestions();
  renderQuestions();
});