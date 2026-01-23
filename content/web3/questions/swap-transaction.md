---
id: web3-swap-transaction
category: Web3
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个 DEX swap 交易功能，包括获取报价、检查余额和批准、执行交易，并处理各种错误情况。
description: |
  需要实现：
  1. 获取 swap 报价（输入代币数量，计算输出数量）
  2. 检查用户余额是否充足
  3. 检查并处理代币批准（approval）
  4. 执行 swap 交易
  5. 监听交易状态
  6. 错误处理（余额不足、批准失败、滑点过大等）
template: |
  import { ethers } from 'ethers'
  import ERC20_ABI from './ERC20_ABI.json'
  import DEX_ROUTER_ABI from './DEX_ROUTER_ABI.json'

  class SwapManager {
    constructor(provider, routerAddress) {
      this.provider = provider
      this.router = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, provider)
    }

    // TODO: 获取 swap 报价
    async getQuote(tokenIn, tokenOut, amountIn, slippage = 500) {
      // 参数：tokenIn, tokenOut 是代币地址
      // amountIn 是输入数量（wei）
      // slippage 是滑点容忍度（基点，500 = 5%）
      // 返回：{ amountOut, amountOutMin, priceImpact }
    }

    // TODO: 检查余额
    async checkBalance(tokenAddress, userAddress, requiredAmount) {
      // 返回：{ hasBalance: boolean, balance: BigNumber }
    }

    // TODO: 检查并处理批准
    async checkAndApprove(tokenAddress, spenderAddress, amount, signer) {
      // 检查当前批准额度
      // 如果不足，执行批准交易
      // 返回：{ needsApproval: boolean, txHash?: string }
    }

    // TODO: 执行 swap
    async executeSwap(tokenIn, tokenOut, amountIn, amountOutMin, to, deadline, signer) {
      // 执行 swap 交易
      // 返回：交易哈希
    }

    // TODO: 监听交易状态
    async waitForTransaction(txHash, confirmations = 1) {
      // 等待交易确认
      // 返回：交易收据
    }
  }
---
```javascript
import { ethers } from 'ethers'
import ERC20_ABI from './ERC20_ABI.json'
import DEX_ROUTER_ABI from './DEX_ROUTER_ABI.json'

class SwapManager {
  constructor(provider, routerAddress) {
    this.provider = provider
    this.router = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, provider)
  }

  async getQuote(tokenIn, tokenOut, amountIn, slippage = 500) {
    try {
      // 获取路径（可能涉及多个池子）
      const path = [tokenIn, tokenOut]
      
      // 调用路由合约获取输出数量
      const amountsOut = await this.router.getAmountsOut(amountIn, path)
      const amountOut = amountsOut[amountsOut.length - 1]
      
      // 计算最小输出（考虑滑点）
      const amountOutMin = amountOut.mul(10000 - slippage).div(10000)
      
      // 计算价格影响（简化版，实际需要获取池子流动性）
      const priceImpact = 0 // 需要从池子数据计算
      
      return {
        amountOut,
        amountOutMin,
        priceImpact
      }
    } catch (error) {
      throw new Error(`Failed to get quote: ${error.message}`)
    }
  }

  async checkBalance(tokenAddress, userAddress, requiredAmount) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      const balance = await token.balanceOf(userAddress)
      const hasBalance = balance.gte(requiredAmount)
      
      return {
        hasBalance,
        balance
      }
    } catch (error) {
      throw new Error(`Failed to check balance: ${error.message}`)
    }
  }

  async checkAndApprove(tokenAddress, spenderAddress, amount, signer) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
      const userAddress = await signer.getAddress()
      
      // 检查当前批准额度
      const allowance = await token.allowance(userAddress, spenderAddress)
      
      if (allowance.gte(amount)) {
        return { needsApproval: false }
      }
      
      // 批准最大数量（或只批准需要的数量）
      const maxApproval = ethers.constants.MaxUint256
      const tx = await token.approve(spenderAddress, maxApproval)
      
      return {
        needsApproval: true,
        txHash: tx.hash
      }
    } catch (error) {
      throw new Error(`Approval failed: ${error.message}`)
    }
  }

  async executeSwap(tokenIn, tokenOut, amountIn, amountOutMin, to, deadline, signer) {
    try {
      const routerWithSigner = this.router.connect(signer)
      
      // 构建 swap 参数
      const path = [tokenIn, tokenOut]
      const tx = await routerWithSigner.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
      )
      
      return tx.hash
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('User rejected the transaction')
      }
      if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        throw new Error('Slippage tolerance exceeded')
      }
      throw new Error(`Swap failed: ${error.message}`)
    }
  }

  async waitForTransaction(txHash, confirmations = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations)
      
      if (receipt.status === 0) {
        throw new Error('Transaction failed')
      }
      
      return receipt
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }
}
```
