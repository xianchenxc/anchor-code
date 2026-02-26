---
id: css-basics
category: CSS
subcategory: 基础知识
type: knowledge
title: CSS 基础
---

## 引入 CSS 的方式

1. 外部链接（link 标签）

```html
<link rel="stylesheet" type="type/css" href="style.css" />
```

2. 内部样式表（style 标签）

```html
<style rel="stylesheet" type="type/css">
body {
    padding: 0;
}
</style>
```

3. 行内样式（inline style）

```html
<div style="color: red;">click me</div>
```

4. 导入（@import）

[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@import)

```html
<style type="text/css">
@import "style.css";

body {
    padding: 0;
}
</style>
```

*特点：会在页面结构加载完后才加载 CSS，可能导致闪烁。*


## 盒模型

盒模型通常由内容（content）、内边距（padding）、边框（border）、外边距（margin）构成。

### 两个种类

- 标准盒模型（W3C 标准）
    - 块的总宽度 = Content + Padding + Border + Margin
- 怪异盒模型（IE 标准）
    - 块的总宽度 = Content + Margin

怪异盒模型中 Content 宽度 = Content + Padding + Border

### 设置盒模型

通过 box-sizing 设置盒模型：

```css
box-sizing: content-box;  // 标准盒模型
box-sizing: border-box;   // 怪异盒模型
```

## block、inline、inline-block 的区别

1. block 块级元素

- 独占一行
- 可以设置宽高
- padding、margin 水平和垂直设置都有效

2. inline 行内元素

- 不会独占一行，相邻的同一行，一行展示不下会换行
- 不可设置宽高
- padding、margin 水平设置有效，垂直无效

3. inline-block 行内块

- 不会独占一行（同 inline）
- 可设置宽高（同 block）
- padding、margin 水平和垂直设置都有效（同 block）

## display: none、 visibility: hidden、opacity: 0 的区别

|   | 是否占空间 | 是否可点击 | 性能 |
| - | - | - | - |
| display: none | ❌ | ❌ | 回流 + 重绘 |
| visibility: hidden | ✅ | ❌ | 重绘 |
| opacity: 0 | ✅ | ✅ | 重建图层，性能较高 |

## Position

| 值 | 是否脱落文档流 | 可使用边偏移 | 描述 |
| - | - | - | - |
| static | ❌，正常模式 | ❌ | 自动（没有）定位（默认定位方式）|
| relative | ❌，占有位置 | ✅ | 相对定位，相对于其原文档流的位置进行定位 |
| absolute | ✅，不占位置 | ✅ | 绝对定位，相对于其上一个已经定位（不为 static）的父元素进行定位 |
| fixed | ✅，不占位置 | ✅ | 固定定位，相对于浏览器窗口进行定位（老IE不支持）|
| inherit | | | 规定从父元素继承 position 属性的值 | 
