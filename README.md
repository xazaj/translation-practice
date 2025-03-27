<h1 align="center">🌏 中英翻译练习</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Language-English%20%7C%20中文-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Responsive-%E2%9C%94-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Framework-None-lightgrey?style=flat-square" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=flat-square" />
</p>

<p align="center">
  一个 ✨优雅简洁、轻量高效 的中英翻译练习工具，专为语言学习者设计，支持📱移动端优化、自定义题库与🧠智能提示。
</p>

<p align="center">
  <a href="https://translation-practice.aibrev.com/" target="_blank"><strong>🌐 在线体验 →</strong></a>
  &nbsp;&nbsp;&nbsp;
  <a href="#️-一键部署-vercel"><strong>🚀 一键部署 →</strong></a>
</p>

---

## 📦 项目介绍

> **中英翻译练习** 是一个帮助语言学习者进行英文写作与中译英训练的开源小工具，使用原生 JavaScript 编写，轻量、无需后端，自动保存进度。

- ✅ **自定义题库**：上传格式化 TXT 文件（支持 UTF-8），轻松构建你的练习集  
- 💾 **实时保存**：使用本地存储记录每道题的练习答案，随时断点续练  
- 💡 **智能提示**：点击中文句子或按下回车显示参考答案  
- 📱 **移动端优化**：全面适配触控设备，随时随地流畅练习  

---

## 🧭 目录

- [🚀 在线体验](#-在线体验)
- [🔧 功能详情](#-功能详情)
- [📚 题库格式](#-题库格式)
- [🖥 使用方法](#-使用方法)
- [⚙ 技术说明](#-技术说明)
- [☁️ 一键部署 Vercel](#️-一键部署-vercel)

---

## 🚀 在线体验

👉 [https://translation-practice.aibrev.com/](https://translation-practice.aibrev.com/)

---

## 🔧 功能详情

- ✍️ **练习翻译**：输入你的英文翻译，检验思维与表达  
- 📖 **查看答案**：点击中文句子或按下回车，快速获取参考翻译  
- 📁 **上传题库**：支持本地 `.txt` 文件格式（详见下方格式示例）  
- 📱 **移动端优化**：适配 iOS、Android 手机与平板触摸体验  

---

## 📚 题库格式

题库使用 UTF-8 编码，`.txt` 文件中每行格式如下：

```txt
英文句子|中文句子
````

例如：

```txt
This is an example sentence.|这是一个示例句子。
Practice makes perfect.|熟能生巧。
Learning a new language is fun.|学习一门新语言很有趣。
```

---

## 🖥 使用方法

### 📤 上传题库

1. 点击页面顶部的 **"上传题库"** 按钮
    
2. 选择 TXT 文件，确保每行为 `英文|中文` 格式
    
3. 题库加载后即自动展示题目列表
    

### 🧠 练习流程

1. 阅读中文句子，在下方输入英文翻译
    
2. 回车或点击句子查看参考答案
    
3. 使用底部分页浏览其他题目
    

---

## ⚙ 技术说明

- 💻 **技术栈**：Vanilla JavaScript（无框架依赖）
    
- 🧩 **前端功能**：FileReader 解析题库 / localStorage 持久化答案
    
- 📱 **响应式设计**：适配各种屏幕尺寸，支持触控手势
    
- ☁️ **部署建议**：支持 GitHub Pages、Vercel、Netlify 等平台
    

---

## ☁️ 一键部署 Vercel

你可以用 Vercel 快速部署本项目：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xazaj/translation-practice&project-name=translation-practice&repository-name=translation-practice)

部署成功后，你将获得一个专属的在线中英翻译练习平台！

---

## 📄 License

[MIT](https://chatgpt.com/c/LICENSE)

---

> Made with ❤️ by [xazaj](https://github.com/xazaj)

