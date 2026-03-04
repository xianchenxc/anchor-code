# Anchor Code

一个面向技术面试的学习和练习工具，支持按分类梳理知识点、刷题和模拟面试，围绕「学习 → 练习 → 模拟面试」完整路径设计。

## 核心功能

- 📚 **学习模式**：按领域（CSS / JavaScript / React / Web3 / Coding …）聚合知识点，单卡片专注学习，支持掌握度标记、薄弱筛选和进度条
- 💪 **练习模式**：问答题和编程题练习，支持代码编辑器，自动保存做题进度
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

## 部署

项目支持 GitHub Pages 部署（通过 GitHub Actions 自动构建）：

1. 确保仓库名称与 `vite.config.js` 中的 `base` 配置一致
2. 在 GitHub 仓库设置中启用 GitHub Pages，选择 GitHub Actions 作为部署源
3. 推送代码到 `main` 分支即可自动部署

## 项目结构

```
src/
  ├── components/          # React 组件
  │   ├── StudyMode.jsx   # 学习模式
  │   ├── PracticeMode.jsx # 练习模式
  │   ├── InterviewMode.jsx # 模拟面试
  │   ├── ChatMode.jsx    # 聊天学习
  │   ├── MasteryStatusControl.jsx # 学习模式中的掌握度状态控件
  │   └── ...
  ├── hooks/              # 自定义 Hooks
  │   ├── useStudyMode.js
  │   ├── useStudyMastery.js      # 学习模式掌握度管理（全局共享状态）
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
