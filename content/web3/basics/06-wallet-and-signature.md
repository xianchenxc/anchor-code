---
id: web3-wallet-signature
category: Web3
subcategory: 基础概念
type: knowledge
title: 钱包与签名
---

在 DApp 中，「钱包」是用户身份与资产的载体，也是所有需要签名操作的入口。

## 钱包的角色

一个区块链钱包通常负责：

- 管理私钥与地址
- 展示资产余额与交易历史
- 为 DApp 提供签名能力（消息签名、交易签名）

常见钱包：

- 浏览器扩展钱包：MetaMask、Coinbase Wallet、Rabby 等
- 移动端钱包：Trust Wallet、imToken、Rainbow 等
- 钱包连接协议：WalletConnect 等

## 钱包连接流程（以 MetaMask 为例）

1. 检测是否安装钱包：

   ```javascript
   const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum
   ```

2. 请求连接账户：

   ```javascript
   const accounts = await window.ethereum.request({
     method: 'eth_requestAccounts'
   })
   const account = accounts[0]
   ```

3. 监听账户与网络变化：

   ```javascript
   window.ethereum.on('accountsChanged', (accounts) => {
     // 更新当前账户
   })

   window.ethereum.on('chainChanged', (chainId) => {
     // 处理网络切换
   })
   ```

## 签名与交易的区别

- **消息签名（Sign Message）**
  - 不上链，没有 Gas 费用
  - 常用于登录、授权、链下证明
  - 示例：EIP-712 Typed Data 签名

- **交易签名（Sign & Send Transaction）**
  - 需要被打包进区块，消耗 Gas
  - 常用于转账、调用智能合约
  - 包含 `to`、`data`、`value`、`gas` 等字段

前端一般：

- 用「消息签名」实现无 Gas 的登录/授权
- 用「交易签名」执行真正的链上状态变更

## 多钱包场景

当用户安装了多个钱包时（如 MetaMask + Rabby）：

- 浏览器中可能存在多个 Provider
- 钱包扩展之间会争夺 `window.ethereum`
- 需要提供「钱包选择弹窗」让用户显式选择

常见实践：

- 使用第三方 SDK（如 wagmi、rainbowkit、web3modal）统一管理多钱包
- 或自己封装一层，抽象成统一的 `WalletManager`

## 安全与 UX 注意点

- 清楚提示用户当前连接的是哪个地址、哪条网络
- 在签名弹窗前，给出清晰、简明的操作说明
- 避免频繁弹出签名请求，尽可能合并操作
- 不在前端暴露私钥、助记词等任何敏感信息

钱包与签名是用户参与任何 Web3 交互的入口，理解其基本工作方式，有助于设计更安全、友好的连接和交互体验。

