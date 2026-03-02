---
id: css-bfc
category: CSS
subcategory: 基础知识
type: knowledge
title: BFC
---

1. 什么是 BFC？

BFC（Block Formatting Context，块级格式化上下文）是页面上一个独立的渲染区域，内部子元素不论如何布局，都不会影响外部元素。

渲染规则：

- 内部元素在垂直方向一个接一个放置
- 垂直 margin 重叠：同一个 BFC 下的两个相邻块级元素的 margin 会重叠（取最大值）
- 隔离容器：BFC 区域不会与外部的浮动元素重叠
- 包含浮动：计算 BFC 高度时，会看到所有子元素，包含 float，即解决高度塌陷
- 独立区域：BFC 内部子元素不会影响外部

2. 怎么创建（触发） BFC？

| 触发方式                                                     | 备注              |
| -------------------------------------------------------- | --------------- |
| overflow: hidden/auto/scroll                             | 最常用             |
| display: flex/inline-flex                                | flex 容器天然是 BFC  |
| display: grid/inline-grid                                | grid 容器天然是 BFC  |
| position: absolute/fixed                                 | 会脱落文档流          |
| float: left/right                                        | 不推荐仅为了触发 bfc 而用 |
| display: flow-root/table-cell/table-caption/inline-block |                 |

3. 为什么需要 BFC（应用场景）？

- 清除浮动/解决高度塌陷

让父元素触发 BFC（如：overflow:hidden），它就可以“看到”浮动的子元素

- 防止相邻元素垂直 margin 重叠

```css
/* 下面这两个 margin 本应是 50px，结果只有 30px */
.box1 { margin-bottom: 30px; }
.box2 { margin-top:  50px; }
```

包裹其中一个元素并触发 BFC，就可以防止重叠。

- 阻止浮动元素遮挡

在两列布局中，左侧定宽浮动，右侧元素设置触发 BFC，可以使右侧区域不被左侧浮动元素遮挡，实现自适应两列布局。

```css
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar {
  float: left;
  width: 240px;
  margin-right: 20px;
  background: #34495e;
  color: white;
  padding: 20px;
  border-radius: 6px;
}

.main {
  /* 核心：触发 BFC，自动避开左侧浮动元素 */
  overflow: hidden;           /* 或 display: flow-root;（语义更好） */
  background: white;
  padding: 24px;
  border-radius: 6px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.12);
}
```