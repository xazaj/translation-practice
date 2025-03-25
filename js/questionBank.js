// 导入状态管理模块
import { store } from './store.js';
import { renderQuestions, showToast } from './ui.js';

// 全局变量
let questionBankModal = null;
let directoryCache = {};
let currentAppliedBank = '';
const CACHE_TIMEOUT = 500; // 缓存机制超时时间（毫秒）

// 初始化题库管理器
function initQuestionBankManager() {
  console.log('初始化题库管理器');
  
  // 设置当前已应用的题库路径（如果有）
  const currentQuestions = store.getState().questions || [];
  if (currentQuestions.length > 0 && currentQuestions[0].source) {
    currentAppliedBank = currentQuestions[0].source;
  }
  
  // 初始化模态框
  createModal();
  
  // 添加按钮点击事件
  document.querySelector('.manage-btn').addEventListener('click', openQuestionBankManager);
}

// 创建模态框
function createModal() {
  const modalHtml = `
    <div class="modal fade" id="questionBankModal" tabindex="-1" aria-labelledby="questionBankModalLabel" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="questionBankModalLabel">题库管理</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
          </div>
          <div class="modal-body">
            <div class="question-bank-tree" id="questionBankTree"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
  
  // 获取模态框引用
  questionBankModal = new bootstrap.Modal(document.getElementById('questionBankModal'), {
    keyboard: true, // 允许使用键盘 ESC 关闭
    focus: true    // 显示时自动获取焦点
  });
  
  // 添加模态框事件监听
  const modalElement = document.getElementById('questionBankModal');
  modalElement.addEventListener('shown.bs.modal', function () {
    // 当模态框显示时，将焦点设置到关闭按钮
    const closeButton = this.querySelector('.btn-close');
    if (closeButton) {
      closeButton.focus();
    }
  });
}

// 打开题库管理器
function openQuestionBankManager() {
  if (!questionBankModal) {
    console.error('题库管理模态框未初始化');
    return;
  }
  
  // 打开模态框
  questionBankModal.show();
  
  // 每次打开时重新加载题库树
  loadQuestionBankTree();
}

// 加载题库树
async function loadQuestionBankTree() {
  const treeContainer = document.getElementById('questionBankTree');
  
  if (!treeContainer) {
    console.error('未找到题库树容器');
    return;
  }
  
  // 显示加载中
  treeContainer.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <div>正在加载题库列表...</div>
    </div>
  `;
  
  try {
    // 从list.txt加载题库列表
    const directoryData = await getDirectoryFromListFile();
    
    if (directoryData && directoryData.length > 0) {
      // 渲染树形结构
      renderTree(treeContainer, directoryData);
    } else {
      // 显示空状态
      treeContainer.innerHTML = `
        <div class="empty-placeholder">
          <div class="empty-icon">📁</div>
          <div class="empty-text">没有找到题库</div>
          <div class="empty-desc">请在data目录下添加题库文件，或检查list.txt文件格式是否正确</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('加载题库失败:', error);
    
    // 显示错误状态
    treeContainer.innerHTML = `
      <div class="error-placeholder">
        <div class="error-icon">⚠️</div>
        <div class="error-text">加载题库失败</div>
        <div class="error-desc">${error.message || '请检查网络连接或刷新页面重试'}</div>
      </div>
    `;
  }
}

// 从list.txt获取目录结构
async function getDirectoryFromListFile() {
  // 使用缓存机制避免频繁请求
  if (directoryCache.rootData && (Date.now() - directoryCache.timestamp < CACHE_TIMEOUT)) {
    console.log('使用缓存的目录数据');
    return directoryCache.rootData;
  }
  
  try {
    // 获取list.txt文件内容
    const response = await fetch('data/list.txt');
    
    if (!response.ok) {
      throw new Error(`无法获取list.txt文件: ${response.status}`);
    }
    
    const content = await response.text();
    
    // 解析目录结构
    const treeData = parseTreeOutput(content);
    
    // 过滤掉根目录下的文件
    const filteredData = treeData.filter(node => node.isDirectory || node.path.startsWith('data/') && node.path.split('/').length > 2);
    
    // 缓存结果
    directoryCache = {
      rootData: filteredData,
      timestamp: Date.now()
    };
    
    return filteredData;
  } catch (error) {
    console.error('获取目录结构失败:', error);
    throw error;
  }
}

// 解析tree命令输出内容
function parseTreeOutput(treeContent) {
  const lines = treeContent.split('\n').filter(line => line.trim() !== '');
  
  // 忽略第一行(通常是'.')和list.txt文件
  const dataLines = lines.slice(1).filter(line => !line.endsWith('list.txt') && line !== 'filename.py');
  
  // 构建目录结构
  const rootNodes = [];
  let idCounter = 1;
  
  // 创建节点映射，用于快速查找父节点
  const nodeMap = new Map();
  
  // 第一次遍历：创建所有目录节点
  for (const line of dataLines) {
    // 跳过空行
    if (!line.trim()) continue;
    
    // 分割路径
    const pathParts = line.split('/');
    
    // 跳过根目录下的文件
    if (pathParts.length === 1) continue;
    
    // 构建目录路径
    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;
      const isFile = isLast && part.endsWith('.txt');
      
      // 构建当前层级的完整路径
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // 如果是文件，跳过目录节点创建
      if (isFile) continue;
      
      // 如果该路径的节点还不存在，创建它
      if (!nodeMap.has(currentPath)) {
        const nodeId = `node-${idCounter++}`;
        const node = {
          id: nodeId,
          name: part,
          isDirectory: true,
          isFile: false,
          children: [],
          expanded: i === 0, // 只有根目录默认展开
          path: currentPath
        };
        
        // 检查是否为季节目录
        if (node.name.toLowerCase().includes('season') || 
            node.name.match(/s\d+/i) ||
            node.name.match(/第.*季/)) {
          node.isSeason = true;
        }
        
        nodeMap.set(currentPath, node);
        
        // 如果是根级目录，添加到rootNodes
        if (i === 0) {
          rootNodes.push(node);
        } else {
          // 否则添加到父节点的children中
          const parentPath = pathParts.slice(0, i).join('/');
          const parentNode = nodeMap.get(parentPath);
          if (parentNode) {
            parentNode.children.push(node);
          }
        }
      }
    }
  }
  
  // 第二次遍历：添加文件节点
  for (const line of dataLines) {
    if (!line.trim() || !line.endsWith('.txt')) continue;
    
    const pathParts = line.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    
    // 创建文件节点
    const nodeId = `node-${idCounter++}`;
    const fileNode = {
      id: nodeId,
      name: fileName,
      isDirectory: false,
      isFile: true,
      children: [],
      expanded: false,
      path: `data/${line}`
    };
    
    // 将文件添加到父目录
    const parentNode = nodeMap.get(parentPath);
    if (parentNode) {
      parentNode.children.push(fileNode);
    }
  }
  
  // 递归排序所有节点
  const sortNodes = (nodes) => {
    return nodes.sort((a, b) => {
      // 首先按类型排序（目录在前，文件在后）
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      
      // 如果都是目录，按照数字前缀排序
      if (a.isDirectory && b.isDirectory) {
        const aNum = parseInt(a.name.match(/^\d+/)?.[0] || '0');
        const bNum = parseInt(b.name.match(/^\d+/)?.[0] || '0');
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      }
      
      // 最后按名称字母顺序排序
      return a.name.localeCompare(b.name);
    }).map(node => {
      if (node.children.length > 0) {
        node.children = sortNodes(node.children);
      }
      return node;
    });
  };
  
  // 应用排序
  return sortNodes(rootNodes);
}

// 渲染树形结构
function renderTree(container, treeData) {
  // 清空容器
  container.innerHTML = '';

  // 创建根节点容器
  const rootElement = document.createElement('div');
  rootElement.className = 'tree-container';
  
  // 递归渲染节点
  treeData.forEach(node => {
    const nodeElement = createNode(node);
    rootElement.appendChild(nodeElement);
  });
  
  // 添加到容器
  container.appendChild(rootElement);
}

// 创建树节点
function createNode(node) {
  const nodeElement = document.createElement('div');
  nodeElement.className = 'tree-node';
  nodeElement.dataset.id = node.id;
  nodeElement.dataset.path = node.path || '';
  
  if (node.isFile && node.path === currentAppliedBank) {
    nodeElement.classList.add('current-applied');
  }

  // 创建节点内容
  const nodeContent = document.createElement('div');
  nodeContent.className = 'tree-node-content';
  
  // 添加图标
  const iconElement = document.createElement('span');
  iconElement.className = node.isDirectory 
    ? 'tree-node-icon folder' 
    : 'tree-node-icon file';
  
  if (node.isDirectory) {
    // 目录图标（可折叠三角形）
    iconElement.innerHTML = node.expanded ? '▼' : '▶';
    
    // 设置点击事件（展开/折叠）为整个节点内容
    nodeContent.addEventListener('click', (e) => {
      // 防止冒泡
      e.stopPropagation();
      
      // 切换展开状态
      node.expanded = !node.expanded;
      iconElement.innerHTML = node.expanded ? '▼' : '▶';
      
      // 获取或创建子节点容器
      let childrenContainer = nodeElement.querySelector('.tree-children');
      
      if (node.expanded) {
        // 展开子节点
        if (!childrenContainer) {
          childrenContainer = document.createElement('div');
          childrenContainer.className = 'tree-children';
          nodeElement.appendChild(childrenContainer);
          
          // 渲染子节点
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              const childElement = createNode(child);
              childrenContainer.appendChild(childElement);
            });
          } else {
            childrenContainer.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); text-align: center; font-style: italic;">此文件夹为空</div>';
          }
        } else {
          // 已存在子节点容器，显示即可
          childrenContainer.style.display = 'block';
        }
      } else if (childrenContainer) {
        // 折叠子节点
        childrenContainer.style.display = 'none';
      }
    });
  } else {
    // 文件图标
    iconElement.innerHTML = node.fileType === 'txt' ? '📄' : '📝';
  }
  
  nodeContent.appendChild(iconElement);
  
  // 添加标题
  const titleElement = document.createElement('div');
  titleElement.className = node.isSeason 
    ? 'tree-node-title season' 
    : 'tree-node-title';
  titleElement.textContent = node.name;
  
  // 如果是txt文件，添加点击事件
  if (node.isFile && node.name.endsWith('.txt')) {
    titleElement.style.cursor = 'pointer';
    titleElement.addEventListener('click', async (e) => {
      e.stopPropagation();
      await applyQuestionBank(node);
    });
  }
  
  nodeContent.appendChild(titleElement);
  
  // 如果是当前应用的文件，添加标记
  if (node.isFile && node.path === currentAppliedBank) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'current-file-badge';
    badgeEl.innerHTML = '当前应用';
    titleElement.appendChild(badgeEl);
  }
  
  // 对TXT文件添加应用按钮
  if (node.isFile && node.name.endsWith('.txt')) {
    const applyButton = document.createElement('button');
    applyButton.className = 'tree-node-apply';
    applyButton.textContent = '应用';
    applyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      applyQuestionBank(node);
    });
    nodeContent.appendChild(applyButton);
  }
  
  nodeElement.appendChild(nodeContent);
  
  // 如果节点已展开，递归渲染子节点
  if (node.isDirectory && node.expanded && node.children) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    
    node.children.forEach(child => {
      const childElement = createNode(child);
      childrenContainer.appendChild(childElement);
    });
    
    nodeElement.appendChild(childrenContainer);
  }
  
  return nodeElement;
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
          en: english,     // 使用en字段以匹配UI.js中的字段名
          zh: chinese,     // 使用zh字段以匹配UI.js中的字段名
          userAnswer: '',  // 用户答案
          showHint: false  // 是否显示提示
        });
      }
    }
  });
  
  return questions;
}

// 应用题库
async function applyQuestionBank(node) {
  const loadingToast = showToast(`正在加载题库: ${node.name}...`, 'info', 0);
  
  try {
    console.log('开始应用题库:', node);
    
    // 加载文件内容
    const fileContent = await loadFileContent(node.path);
    console.log('文件内容已加载，长度:', fileContent.length);
    
    // 处理文件内容
    const questions = processFileContent(fileContent);
    console.log('已处理题目:', questions.length);
    
    if (questions.length > 0) {
      // 将文件路径保存到问题中
      questions.forEach(q => q.source = node.path);
      
      // 更新状态
      store.setState('questions', questions);
      console.log('已更新状态 - 题目数量:', questions.length);
      
      // 更新已应用的题库路径
      currentAppliedBank = node.path;
      
      // 更新树中的高亮
      updateAppliedHighlight(node.id);
      
      // 隐藏模态框 - 使用Bootstrap 5方式
      questionBankModal.hide();
      
      // 更新页面标题
      updatePageTitle(node.name);
      
      // 显示成功提示
      showToast(`已应用题库: ${node.name}`, 'success');
      
      // 移除加载中提示
      if (loadingToast) {
        loadingToast.remove();
      }
      
      // 渲染问题
      renderQuestions();
      
      console.log(`已应用题库: ${node.name} (${questions.length}题)`);
    } else {
      throw new Error('题库内容格式不正确');
    }
  } catch (error) {
    console.error('应用题库失败:', error);
    
    // 移除加载中提示
    if (loadingToast) {
      loadingToast.remove();
    }
    
    // 显示错误提示
    showToast(`应用题库失败: ${error.message || '未知错误'}`, 'error');
  }
}

// 加载文件内容
async function loadFileContent(filePath) {
  try {
    console.log('尝试加载文件:', filePath);
    
    // 确保路径格式正确
    const cleanPath = filePath.startsWith('data/') ? filePath : `data/${filePath}`;
    
    console.log('处理后的路径:', cleanPath);
    
    const response = await fetch(cleanPath);
    
    if (!response.ok) {
      throw new Error(`无法获取文件: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('加载文件内容失败:', error);
    throw error;
  }
}

// 更新页面标题
function updatePageTitle(fileName) {
  // 从文件名提取标题，移除扩展名和数字前缀
  let title = fileName
    .replace(/\.(txt|TXT)$/, '')                 // 移除文件扩展名
    .replace(/^\d+[\.-]\s*/, '')                 // 移除数字前缀（如 "1-" 或 "1."）
    .replace(/^Minimum-Viable-Product$/, 'MVP')   // 简化特定长标题
    .replace(/-/g, ' ');                         // 将连字符替换为空格
  
  // 更新页面标题，使用更简洁的格式
  document.querySelector('.header-content').textContent = title;
  document.title = `翻译练习 - ${title}`;
}

// 更新应用高亮
function updateAppliedHighlight(nodeId) {
  // 移除之前的高亮和标记
  document.querySelectorAll('.tree-node.current-applied').forEach(el => {
    el.classList.remove('current-applied');
  });
  
  document.querySelectorAll('.current-file-badge').forEach(el => {
    el.remove();
  });
  
  // 添加新的高亮
  const nodeElement = document.querySelector(`.tree-node[data-id="${nodeId}"]`);
  if (nodeElement) {
    nodeElement.classList.add('current-applied');
    
    // 添加当前应用标记
    const titleEl = nodeElement.querySelector('.tree-node-title');
    if (titleEl) {
      const badgeEl = document.createElement('span');
      badgeEl.className = 'current-file-badge';
      badgeEl.innerHTML = '当前应用';
      titleEl.appendChild(badgeEl);
    }
  }
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', initQuestionBankManager);

// 导出函数
export {
  initQuestionBankManager,
  openQuestionBankManager,
  applyQuestionBank
}; 