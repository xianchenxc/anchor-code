---
id: web3-provider-rpc
category: Web3
subcategory: 基础概念
type: knowledge
title: Web3 Provider 与 RPC
---

在 DApp 前端中，**Provider** 和 **RPC 节点** 是你与区块链交互的入口。

## 什么是 Provider？

Provider 是一个「区块链访问客户端」，负责：

- 发送读请求（例如查询余额、读取合约状态）
- 发送写请求（例如发送交易、调用合约方法）
- 订阅事件和新区块

常见的 Provider 库：

- **ethers.js**
  - API 简洁，TypeScript 友好
  - 区分 `Provider`（只读）和 `Signer`（带签名能力）
- **web3.js**
  - 较早期的库，功能全面
  - 体积较大，API 风格偏旧
- **viem**
  - 现代化、类型安全优先
  - 性能优秀，适合 TypeScript 项目

## 什么是 RPC 节点？

RPC 节点提供 JSON-RPC 接口，处理来自 DApp 的请求：

- 公共 RPC：如 Infura、Alchemy、QuickNode、Ankr
- 自建 RPC：团队自己运行的节点

一个 Provider 通常需要一个或多个 RPC 端点：

```javascript
const rpcEndpoints = {
  mainnet: [
    'https://mainnet.infura.io/v3/YOUR_KEY',
    'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
    'https://rpc.ankr.com/eth'
  ]
}
```

## 浏览器钱包与 Provider

浏览器钱包（如 MetaMask）会在 `window` 上注入对象：

- `window.ethereum`：EIP-1193 Provider 标准
- 前端可以用它创建库自己的 Provider：

```javascript
import { ethers } from 'ethers'

if (window.ethereum) {
  const provider = new ethers.BrowserProvider(window.ethereum)
}
```

与浏览器钱包交互常见流程：

- 检测是否存在 `window.ethereum`
- 调用 `eth_requestAccounts` 请求连接账户
- 监听 `accountsChanged` / `chainChanged` 等事件

## Provider 类型：只读与可写

- **只读 Provider**
  - 只使用 RPC URL（如 Infura）
  - 不需要用户钱包
  - 适合：行情展示、公共数据查询
- **带 Signer 的 Provider**
  - 基于用户钱包（MetaMask 等）
  - 可以发起签名、交易
  - 适合：swap、质押、投票等操作

在前端中，通常会同时维护：

- 一个「公共只读 Provider」
- 一个「用户钱包 Provider + Signer」

## RPC 管理与容灾

为了提高稳定性，前端应当：

- 为每条链配置多个 RPC 端点
- 实现基础的：
  - 健康检查（探测延迟与失败率）
  - 故障转移（当前端点失败时自动切到备用）
  - 重试策略（有限次数重试）

## 最佳实践小结

- 区分「读」和「写」场景，合理选择 Provider
- 对用户钱包使用 EIP-1193 标准接口（`window.ethereum`）
- 为每个网络配置多个 RPC，避免单点故障
- 尽量使用现代库（如 ethers.js / viem），简化类型和错误处理

理解 Provider 与 RPC 的角色，是实现钱包连接、交易发送、事件监听等功能的前置知识。

