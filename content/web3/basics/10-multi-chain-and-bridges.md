---
id: web3-multi-chain-bridges
category: Web3
subcategory: 基础概念
type: knowledge
title: 多链与跨链桥
---

随着各类公链与二层网络的发展，越来越多 DApp 需要支持「多链」甚至「跨链」体验。

## 多链（Multi-chain）基础

多链 DApp 至少要处理好以下问题：

- 识别当前网络（`chainId`）
- 为不同链配置：
  - RPC 端点
  - 合约地址
  - 区块浏览器链接
  - 链的名称与图标

一个典型的多链配置结构：

```javascript
const chains = {
  1:   { name: 'Ethereum',  rpcUrls: [...], explorer: 'https://etherscan.io' },
  56:  { name: 'BSC',       rpcUrls: [...], explorer: 'https://bscscan.com' },
  137: { name: 'Polygon',   rpcUrls: [...], explorer: 'https://polygonscan.com' },
  42161: { name: 'Arbitrum', rpcUrls: [...], explorer: 'https://arbiscan.io' }
}
```

前端需要根据 `chainId`：

- 选择正确的 RPC 与 Provider
- 实例化正确地址的合约
- 构建正确的区块浏览器链接

## 网络检测与切换

典型流程：

1. 读取当前网络 `chainId`
2. 如果不是目标网络：
   - 提示用户切换
   - 提供一键调用 `wallet_switchEthereumChain` 或 `wallet_addEthereumChain`
3. 监听 `chainChanged` 事件，重置状态

常见用户体验：

- 在不支持当前链时，展示「当前网络不支持」提示
- 提供网络选择器（下拉列表）
- 在切换链时，展示适当的加载态

## 合约地址与多链部署

同一套合约往往会在多个链分别部署：

- 不同链上有不同的合约地址
- 某些功能可能只在部分链上可用

前端需要维护一份「合约地址映射表」：

```javascript
const contracts = {
  router: {
    1: '0x...',
    56: '0x...',
    137: '0x...'
  }
}
```

并在运行时根据当前 `chainId` 选择合适地址。

## 跨链桥（Bridge）基础

跨链桥用于在不同链之间转移资产：

- 锁定源链资产，在目标链铸造对应资产
- 或在目标链释放之前锁定的资产

从前端视角看，跨链交互通常涉及：

- 选择源链与目标链
- 选择资产与数量
- 在源链上发起锁定/授权交易
- 监听桥接进度与状态

常见 UX 设计：

- 清晰展示当前所处步骤（源链确认 / 中间状态 / 目标链到账）
- 提供跨链时间预估与风险提示
- 在异常时提供客服或故障说明

## 多链与跨链的常见问题

- 不同链的：
  - Gas 代币不同（ETH、BNB、MATIC 等）
  - Gas 价格与确认速度不同
  - 区块时间与安全确认数不同
- 用户可能：
  - 拒绝网络切换
  - 在错误的网络上操作
  - 没有目标链的 Gas 代币，无法完成交易

前端需要：

- 在重要操作前检查当前网络是否正确
- 提示用户在目标链上需要准备少量 Gas 代币
- 对「不支持的网络」给出明确反馈，而不是静默失败

掌握多链与跨链的基础概念，有助于你理解后续的多链支持题目和工程实现细节。

