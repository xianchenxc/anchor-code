---
id: js-q10
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 数组扁平化
description: 实现一个函数，将多维数组扁平化为一维数组。
template: |
  function flatten(arr) {
    // 你的代码
  }
---

```javascript
// 方法1: 递归
function flatten(arr) {
  const result = [];
  
  for (let item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }
  
  return result;
}

// 方法2: reduce
function flatten(arr) {
  return arr.reduce((prev, curr) => {
    return prev.concat(Array.isArray(curr) ? flatten(curr) : curr);
  }, []);
}

// 方法3: 使用 flat (ES2019)
function flatten(arr) {
  return arr.flat(Infinity);
}

// 方法4: 使用扩展运算符
function flatten(arr) {
  while (arr.some(item => Array.isArray(item))) {
    arr = [].concat(...arr);
  }
  return arr;
}
```
