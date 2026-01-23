---
id: js-q4
category: JavaScript
subcategory: 面试题
type: practice
questionType: coding
question: 手写 Promise 实现(实现状态管理, 实现 then、catch、finally 方法)
template: |
  function FakePromise(obj) {
    // 你的代码
  }
---

```javascript
class SimplePromise {
  constructor(executor) {
    this.state = 'pending'
    this.value = undefined
    this.callbacks = []
    
    const resolve = value => {
      if (this.state !== 'pending') return
      
      // 处理 promise 返回 promise 的情况
      if (value instanceof SimplePromise) {
        return value.then(resolve, reject)
      }
      
      this.state = 'fulfilled'
      this.value = value
      this.callbacks.forEach(cb => this._handle(cb))
    }
    
    const reject = reason => {
      if (this.state !== 'pending') return
      
      this.state = 'rejected'
      this.value = reason
      this.callbacks.forEach(cb => this._handle(cb))
    }
    
    // ✅ 修复：用 try-catch 包裹 executor
    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)  // 捕获 executor 中的同步错误
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
    
    return new SimplePromise((resolve, reject) => {
      this._pushCallback({
        onFulfilled,
        onRejected,
        resolve,
        reject
      })
    })
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  _pushCallback(callback) {
    if (this.state === 'pending') {
      this.callbacks.push(callback)
    } else {
      setTimeout(() => this._handle(callback), 0)
    }
  }

  _handle(callback) {
    const { onFulfilled, onRejected, resolve, reject } = callback
    
    try {
      if (this.state === 'fulfilled') {
        const result = onFulfilled(this.value)
        resolve(result)
      } else if (this.state === 'rejected') {
        const result = onRejected(this.value)
        resolve(result)
      }
    } catch (error) {
      reject(error)  // 捕获回调函数中的错误
    }
  }
}

const promise1 = new Promise((resolve) => setTimeout(resolve, 1000))
```