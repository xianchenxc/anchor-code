---
id: web3-transaction-lifecycle
category: Web3
subcategory: 基础概念
type: knowledge
title: 交易生命周期
---

在 EVM 链上，一笔交易从发起到最终确认，会经历多个阶段。前端需要正确感知并反馈这些状态。

## 交易的基本组成

一笔链上交易通常包含：

- `from`：发送方地址
- `to`：接收方地址（或合约地址）
- `value`：转账金额（可为 0）
- `data`：调用合约的编码数据
- `gas` / `gasLimit`：最大 Gas 消耗
- `maxFeePerGas` / `gasPrice`：每单位 Gas 费用
- `nonce`：发送方地址的交易序号

## 交易生命周期阶段

1. **Created / Prepared（准备中）**
   - 前端构建交易参数（目标合约、方法、参数、gas 预估等）
   - 向用户展示交易摘要和费用

2. **Signed（已签名，待发送）**
   - 用户在钱包中确认交易并签名
   - 钱包返回已签名交易或直接广播

3. **Pending（待打包）**
   - 交易已广播，等待被矿工/验证者打包进区块
   - 前端通常：
     - 显示「Pending」状态
     - 提供区块浏览器链接（根据交易哈希）

4. **Mined / Included（已打包）**
   - 交易被打包进某个区块
   - 可以获取交易收据（receipt），其中包含：
     - `status`（1=成功，0=失败）
     - `blockNumber`、`transactionIndex`
     - `logs`（事件日志）

5. **Confirmed（已确认）**
   - 在交易所在区块之后，又追加了若干新区块
   - 通常以「确认数」衡量安全性（比如 1 / 3 / 12 个确认）

## 前端如何追踪交易状态

- 发送交易后，获得 `txHash`
- 使用 Provider：

```javascript
// 轮询方式
const receipt = await provider.waitForTransaction(txHash, confirmations)

if (receipt.status === 1) {
  // success
} else {
  // failed
}
```

或结合区块事件、合约事件监听来更新 UI。

## 常见失败原因

- 用户在钱包中拒绝交易
- Gas 不足（Out of Gas）
- 交易被回滚（`revert`）
- nonce 冲突或过低
- 交易长时间未被打包而过期

前端在处理失败时应：

- 显示尽量友好的错误信息（而不是纯技术报错）
- 给出「重试」或「修改参数后重试」的选项
- 在必要时提示用户可以尝试「加速」或「取消」交易

## UX 与工程实践

- 使用 toast / modal 实时提示交易状态变化
- 在 Pending 状态下，允许用户继续浏览，而不是「卡死」页面
- 对资产余额等信息，可以采用「乐观更新」+ 失败回滚的模式
- 提供交易历史列表，让用户可以回看和追踪

理解交易的完整生命周期，是实现交易状态管理、错误处理和良好用户体验的基础。

