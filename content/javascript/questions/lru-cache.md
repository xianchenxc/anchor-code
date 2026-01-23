---
id: js-q12
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 实现 LRU 缓存
description: 实现一个 LRU (Least Recently Used) 缓存，支持 get 和 put 操作，当缓存达到容量上限时，删除最近最少使用的项。
template: |
  class LRUCache {
    constructor(capacity) {
      // 你的代码
    }
    
    get(key) {
      // 你的代码
    }
    
    put(key, value) {
      // 你的代码
    }
  }
---

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }
    
    // 将访问的项移到末尾（最近使用）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  put(key, value) {
    if (this.cache.has(key)) {
      // 如果已存在，删除后重新添加（移到末尾）
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 如果容量已满，删除最久未使用的项（第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // 添加新项到末尾
    this.cache.set(key, value);
  }
}
```
