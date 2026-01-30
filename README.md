# Anchor Code

一个面向面试的学习和练习工具，支持按分类收集知识点和面试题，提供学习模式、练习模式和 AI 辅助学习。

## 核心功能

- 📚 **学习模式**：按分类树级展示知识点，系统学习
- 💪 **练习模式**：问答题和编程题练习，支持代码编辑器，自动保存学习进度
- 💬 **聊天学习**：基于本地 AI 模型的智能问答，支持流式输出
- 🎯 **模拟面试**：AI 驱动的模拟面试场景，支持 JavaScript、React、Web3 领域

## 技术架构

### 前端技术栈
- **React 19** + **React Router** - UI 框架和路由
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **自定义 Vite 插件** - 构建时处理 Markdown 内容

### AI 推理架构
- **@huggingface/transformers** - 本地模型推理（Qwen1.5-0.5B-Chat）
- **Web Worker** - 后台线程运行模型，避免阻塞主线程
- **Comlink** - 简化 Worker 通信
- **IndexedDB** - 模型缓存（自动缓存到本地）

### 架构分层
```
UI 层 (React Components)
  ↓
Services (serverService.js - 统一入口)
  ↓
Web Worker (serverWorker.js)
  ↓
Server Services (dataService, agentService, contentExtractor)
  ↓
Model Service (模型加载/推理)
```

**设计优势**：
- 通信层与业务逻辑分离，易于切换实现（Worker/API）
- 模型在后台线程运行，保证 UI 流畅
- 自动选择最佳后端（WebGPU > WASM > CPU）
- UI 层不直接依赖 Worker，通过 services 统一接口

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview
```

**注意**：首次加载 AI 模型需要下载约 500MB 文件，会自动缓存到 IndexedDB，后续加载会更快。

## 功能特性

### 学习模式
- 分类树导航，支持展开/折叠
- 面包屑导航
- 内容支持 Markdown 渲染，包括代码高亮和数学公式

### 练习模式
- 问答题和编程题两种类型
- 代码编辑器支持语法高亮
- **进度自动保存**：使用 localStorage 保存当前题目位置，下次打开自动恢复
- 进度条可视化，hover 显示当前进度
- 键盘快捷键支持（左右箭头切换题目）

### 模拟面试
- 支持选择面试领域（JavaScript、React、Web3）
- 支持选择难度级别（简单、中等、困难）
- AI 自动提问和评估回答
- 面试历史记录

### 响应式设计
- **移动端（< 768px）**：侧边栏从顶部落下，全屏宽度，高度自适应
- **桌面端（≥ 768px）**：左侧固定侧边栏，可折叠
- 优化的间距和布局，提升空间利用率

## 部署

项目支持 GitHub Pages 部署（通过 GitHub Actions 自动构建）：

1. 确保仓库名称与 `vite.config.js` 中的 `base` 配置一致
2. 在 GitHub 仓库设置中启用 GitHub Pages，选择 GitHub Actions 作为部署源
3. 推送代码到 `main` 分支即可自动部署

## 内容管理

内容使用 Markdown 文件存储在 `content/` 目录，按分类组织。构建时自动处理为 JSON 数据。

### 目录结构
```
content/
  ├── javascript/
  │   ├── basics/        # 知识点
  │   ├── advanced/
  │   └── questions/     # 面试题
  ├── react/
  │   ├── basics/
  │   ├── hooks/
  │   └── questions/
  └── web3/
      ├── basics/
      └── questions/
```

### 文件格式

**知识点** (`type: knowledge`)：
```markdown
---
id: unique-id
category: JavaScript
subcategory: 基础语法
type: knowledge
title: 知识点标题
---

内容支持 Markdown 格式。
```

**问答题** (`type: practice`, `questionType: qa`)：
```markdown
---
id: question-id
type: practice
questionType: qa
question: 问题内容
---

答案内容。
```

**编程题** (`type: practice`, `questionType: coding`)：
```markdown
---
id: coding-id
type: practice
questionType: coding
question: 题目
template: |
  function example() {
    // 你的代码
  }
description: 题目描述（可选）
---

```javascript
function solution() {
  // 参考答案（第一个代码块）
}
```
```

### 约定优于配置
- 分类名称：自动从目录名格式化（`javascript` → `JavaScript`）
- 排序：使用数字前缀控制顺序（`01-basics/` 优先于 `advanced/`）
- 显示名称：优先使用 frontmatter，否则使用目录名

## 项目结构

```
src/
  ├── components/          # React 组件
  │   ├── StudyMode.jsx   # 学习模式
  │   ├── PracticeMode.jsx # 练习模式
  │   ├── InterviewMode.jsx # 模拟面试
  │   ├── ChatMode.jsx    # 聊天学习
  │   └── ...
  ├── hooks/              # 自定义 Hooks
  │   ├── useStudyMode.js
  │   └── usePracticeProgress.js
  ├── services/           # 服务层（统一入口）
  │   └── serverService.js
  ├── workers/            # Web Worker
  │   ├── serverWorker.js
  │   ├── modelService.js
  │   └── server/
  ├── utils/              # 工具函数
  └── contexts/           # React Context
```

## 开发规范

- **组件**：PascalCase，默认导出，文件名与组件名一致
- **工具函数**：camelCase
- **文档注释**：使用英文 JSDoc
- **Git 提交**：使用英文，简洁准确
- **UI 文本**：使用中文

## License

MIT
