---
id: web3-wallet-connection
category: Web3
subcategory: 面试题
type: practice
questionType: qa
question: 在 DApp 前端中，如何实现钱包连接？有哪些常见的钱包连接方式？
---

**钱包连接方式：**

1. **MetaMask**：最常用的浏览器扩展钱包
   - 使用 `window.ethereum` 对象
   - 通过 `eth_requestAccounts` 请求连接
   - 监听 `accountsChanged` 和 `chainChanged` 事件

2. **WalletConnect**：支持移动端钱包
   - 通过二维码或深度链接连接
   - 支持多种钱包（Trust Wallet、Rainbow 等）

3. **Coinbase Wallet**：Coinbase 官方钱包
   - 类似 MetaMask 的 API
   - 支持浏览器扩展和移动端

**实现要点：**
- 检测钱包是否安装
- 处理用户拒绝连接的情况
- 监听账户切换和网络切换
- 提供清晰的连接状态反馈
- 考虑多钱包同时安装的情况
