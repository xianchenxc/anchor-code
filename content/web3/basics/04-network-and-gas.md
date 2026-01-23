---
id: web3-network-gas
category: Web3
subcategory: 基础概念
type: knowledge
title: 区块链网络与 Gas
---

区块链网络（如 Ethereum、BSC、Polygon 等）本质上是不同的链环境，每条链都有自己的：

- 链 ID（chainId）
- 原生代币（ETH、BNB、MATIC 等）
- RPC 节点
- 区块浏览器

在 DApp 开发中，你需要理解以下几个关键概念：

## 网络与 ChainId

- **主网（Mainnet）**：真实资产、真实交易的生产网络
- **测试网（Testnet）**：用于开发调试（如 Sepolia、Goerli、BSC Testnet 等）
- **二层网络（L2）**：在主网之上进行扩容的网络（如 Arbitrum、Optimism）

每个网络都有唯一的 `chainId`，前端需要根据 `chainId`：

- 判断当前连接的是哪条链
- 选择正确的合约地址
- 生成正确的区块浏览器链接

## 什么是 Gas？

**Gas 是在 EVM 链上执行操作所需计算资源的计量单位。**

- 每次调用合约或发送交易，都会消耗一定量的 Gas
- Gas 消耗多少由操作的复杂度决定（如存储写入比读取更贵）
- Gas 本身不是钱，但需要用链的原生代币去支付（例如以太坊上用 ETH 支付 Gas 费）

## Gas Price 与 Gas Limit

- **Gas Price**：你愿意为每个 Gas 单位支付多少费用（以前是 `gwei`，EIP-1559 后拆成 base fee + priority fee）
- **Gas Limit**：你愿意为这次交易最多消耗多少 Gas

交易费用大致为：

- `Gas Used × Gas Price`

如果实际执行消耗的 Gas 超过 Gas Limit，交易会失败，并且通常会消耗掉大部分 Gas 费用。

## EIP-1559 与 Fee 结构

在支持 EIP-1559 的链上，费用参数被拆成：

- `maxFeePerGas`：用户愿意支付的每单位 Gas 的最高费用
- `maxPriorityFeePerGas`：用户愿意给矿工/验证者的小费
- 实际支付：`baseFee + priorityFee`，且不超过 `maxFeePerGas`

前端常见做法：

- 调用钱包或 RPC 获取当前建议的 fee 数据
- 提供「慢 / 标准 / 快」预设选项
- 显示预估的总 Gas 成本

## 为什么需要 Gas？

Gas 的核心目的：

- 防止恶意用户发起无限循环或超复杂计算，阻塞网络
- 让计算资源变成「有价格的稀缺资源」
- 鼓励开发者写更节省 Gas 的智能合约

## 前端开发中的 Gas 相关实践

- 在发送交易前，调用 `estimateGas` 预估所需 Gas
- 向用户展示：
  - 预估 Gas 消耗
  - 预估手续费（换算成 USD）
- 在网络拥堵时，提示用户 Gas 费用较高
- 对新手用户：
  - 解释「为什么要付手续费」
  - 说明即使交易失败，Gas 费也可能会损失

掌握网络与 Gas 的基本概念，是理解后续交易流程、Gas 优化、费用展示等内容的基础。

