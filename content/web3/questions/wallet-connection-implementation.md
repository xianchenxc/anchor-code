---
id: web3-wallet-connection-impl
category: Web3
subcategory: 面试题
type: practice
questionType: coding
question: 实现一个钱包连接功能，支持检测 MetaMask、连接钱包、监听账户和网络变化，并处理各种错误情况。
description: |
  需要实现：
  1. 检测 MetaMask 是否安装
  2. 连接钱包并获取账户
  3. 监听账户切换（accountsChanged）
  4. 监听网络切换（chainChanged）
  5. 处理用户拒绝连接的情况
  6. 处理网络错误
template: |
  import { ethers } from 'ethers'

  class WalletManager {
    constructor() {
      this.provider = null
      this.signer = null
      this.account = null
      this.chainId = null
    }

    // TODO: 检测 MetaMask 是否安装
    isMetaMaskInstalled() {
      // 你的代码
    }

    // TODO: 连接钱包
    async connect() {
      // 你的代码
    }

    // TODO: 监听账户变化
    onAccountsChanged(callback) {
      // 你的代码
    }

    // TODO: 监听网络变化
    onChainChanged(callback) {
      // 你的代码
    }

    // TODO: 获取当前账户
    getAccount() {
      // 你的代码
    }

    // TODO: 获取当前网络 ID
    async getChainId() {
      // 你的代码
    }
  }
---
```javascript
import { ethers } from 'ethers'

class WalletManager {
  constructor() {
    this.provider = null
    this.signer = null
    this.account = null
    this.chainId = null
  }

  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  async connect() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed')
    }

    try {
      // 请求连接
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      // 创建 provider 和 signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      this.signer = this.provider.getSigner()
      this.account = await this.signer.getAddress()
      this.chainId = await this.signer.getChainId()
      
      return {
        account: this.account,
        chainId: this.chainId
      }
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request')
      }
      throw error
    }
  }

  onAccountsChanged(callback) {
    if (!this.isMetaMaskInstalled()) return

    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length === 0) {
        this.account = null
        this.signer = null
        callback(null)
      } else {
        this.account = accounts[0]
        this.signer = this.provider.getSigner()
        callback(this.account)
      }
    })
  }

  onChainChanged(callback) {
    if (!this.isMetaMaskInstalled()) return

    window.ethereum.on('chainChanged', async (chainId) => {
      // chainId 是十六进制字符串，需要转换为数字
      this.chainId = parseInt(chainId, 16)
      // 重新创建 provider（某些库需要）
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      this.signer = this.provider.getSigner()
      callback(this.chainId)
    })
  }

  getAccount() {
    return this.account
  }

  async getChainId() {
    if (this.provider) {
      this.chainId = await this.provider.getNetwork().then(network => network.chainId)
    }
    return this.chainId
  }
}
```
