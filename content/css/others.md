---
category: CSS
subcategory: basics
type: knowledge
title: basics
---

## 现代布局方案（面试高频）

- **Flex 布局**
  - 应用场景：一维布局（横向或纵向），导航、按钮组、居中
  - 容器属性：`display: flex`、`flex-direction`、`justify-content`、`align-items`、`flex-wrap`
  - 子项属性：`flex: 1`、`flex-grow`、`flex-shrink`、`flex-basis`、`align-self`

- **Grid 布局**
  - 应用场景：二维布局，复杂栅格
  - 基础属性：`display: grid`、`grid-template-columns`、`grid-template-rows`、`gap`

- **传统布局**
  - 浮动布局：两列/三列布局（已较少新项目使用）
  - 行内块布局：多列、水平居中

## 颜色、字体与文本

- **颜色**
  - 表示方式：十六进制、`rgb/rgba`、`hsl/hsla`
  - 渐变：`linear-gradient`、`radial-gradient`

- **字体与文本**
  - 常用属性：`font-size`、`font-weight`、`line-height`、`font-family`
  - 文本控制：`text-align`、`text-decoration`、`text-overflow`、`white-space`
  - 多行省略：`-webkit-line-clamp`（常见面试点）

## 响应式与适配

- **媒体查询**
  - `@media (max-width: 768px) { ... }`
  - 移动优先 vs PC 优先

- **单位选择**
  - 绝对单位：`px`
  - 相对单位：`%`、`em`、`rem`、`vw`、`vh`

- **常见响应式技巧**
  - 流式布局 + 最大宽度：`max-width`、`margin: 0 auto`
  - 图片自适应：`max-width: 100%`

## 动画与过渡

- **transition（过渡）**
  - 基本语法：`transition: property duration timing-function delay`
  - 常配合 `:hover`、类名切换

- **transform（变换）**
  - `translate`、`scale`、`rotate`、`skew`
  - `transform-origin`

- **animation（关键帧动画）**
  - `@keyframes` 定义关键帧
  - 属性：`animation-name`、`duration`、`timing-function`、`delay`、`iteration-count`、`fill-mode`

## 实战与工程中的 CSS

- **命名与可维护性**
  - BEM 命名思想：`block__element--modifier`
  - 避免全局污染：作用域与模块化

- **预处理与工程化（了解）**
  - 预处理器：Sass / Less
  - 后处理：PostCSS、自动补前缀

- **现代方案（了解）**
  - CSS Modules、CSS-in-JS、原子化（如 Tailwind）

## 浏览器渲染与性能（常问但不必太细）

- **重排（回流）与重绘**
  - 重排触发场景：改变布局、尺寸、位置
  - 减少重排：合并读写、使用 `transform`/`opacity` 做动画

- **层与合成**
  - `will-change`、`transform: translateZ(0)` 触发合成层（谨慎使用）


