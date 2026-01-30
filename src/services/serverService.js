/**
 * Server Service - Single entry for data, agent, and model.
 * Worker loads JSON from baseUrl + 'data/*.json' via initOptions({ baseUrl }).
 * Data/agent/model APIs are forwarded to the Worker; data/agent throw if not initialized.
 */

import * as Comlink from 'comlink'

class ServerService {
  constructor() {
    this.worker = null
    this.workerProxy = null
    this.workerReady = false
    this.workerSupported = typeof Worker !== 'undefined'
    this.initializingWorker = false
    this.streamingCallbacks = new Map()
    this.requestIdCounter = 0
  }

  isSupported() {
    return this.workerSupported
  }

  async _ensureWorker() {
    if (!this.workerSupported) {
      throw new Error('Web Worker is not available in this browser')
    }
    if (this.worker && this.workerReady) return
    if (this.initializingWorker) {
      return new Promise((resolve, reject) => {
        const t = setInterval(() => {
          if (this.workerReady) {
            clearInterval(t)
            resolve()
          }
        }, 50)
        setTimeout(() => {
          clearInterval(t)
          reject(new Error('Worker initialization timeout'))
        }, 10000)
      })
    }

    this.initializingWorker = true
    try {
      this.worker = new Worker(
        new URL('../workers/serverWorker.js', import.meta.url),
        { type: 'module' }
      )
      this.workerProxy = Comlink.wrap(this.worker)

      await this.workerProxy.initOptions()
      try {
        await this.workerProxy.getStatus()
      } catch {
        await new Promise((r) => setTimeout(r, 100))
        await this.workerProxy.getStatus()
      }
      this.workerReady = true
      this.initializingWorker = false

      this.worker.onerror = (err) => {
        console.error('Server worker error:', err)
        this.worker = null
        this.workerProxy = null
        this.workerReady = false
        this.initializingWorker = false
      }

      this.worker.addEventListener('message', (event) => {
        if (event.data?.type === 'streaming-chunk') {
          const { requestId, chunk, fullText } = event.data
          const cb = this.streamingCallbacks.get(requestId)
          if (cb) cb(chunk, fullText)
        }
      })
    } catch (error) {
      console.error('Failed to initialize server worker:', error)
      this.worker = null
      this.workerProxy = null
      this.workerReady = false
      this.initializingWorker = false
      throw error
    }
  }

  // --- Data (async, forwarded to Worker) ---
  async getCategories() {
    await this._ensureWorker()
    return this.workerProxy.getCategories()
  }

  async getQuestionsBySubcategoryId(subcategoryId) {
    await this._ensureWorker()
    return this.workerProxy.getQuestionsBySubcategoryId(subcategoryId)
  }

  async getAllPracticeQuestions() {
    await this._ensureWorker()
    return this.workerProxy.getAllPracticeQuestions()
  }

  // --- Agent ---
  async buildLearningChatMessages(userQuestion, conversationHistory = [], currentTopic = null, maxHistoryLength = 6) {
    await this._ensureWorker()
    return this.workerProxy.buildLearningChatMessages(userQuestion, conversationHistory, currentTopic, maxHistoryLength)
  }

  async buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel) {
    await this._ensureWorker()
    return this.workerProxy.buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel)
  }

  async buildInterviewEvaluationPrompt(question, answer, categoryId = null) {
    await this._ensureWorker()
    return this.workerProxy.buildInterviewEvaluationPrompt(question, answer, categoryId)
  }

  async buildInterviewChatMessages(categoryName, difficultyLevel, question, answer = null, conversationHistory = [], maxHistoryLength = 4) {
    await this._ensureWorker()
    return this.workerProxy.buildInterviewChatMessages(categoryName, difficultyLevel, question, answer, conversationHistory, maxHistoryLength)
  }

  // --- Model (same contract as aiService) ---
  async loadModel(options = {}) {
    const { modelName = null, onProgress = null } = options
    await this._ensureWorker()
    const progressProxy = onProgress ? Comlink.proxy(onProgress) : null
    const result = await this.workerProxy.loadModel(modelName, progressProxy)
    if (!result.success) throw new Error(result.message || 'Failed to load model')
  }

  async generate(promptOrMessages, options = {}) {
    const { onChunk, ...rest } = options
    await this._ensureWorker()
    let requestId = null
    if (onChunk) {
      requestId = `stream-${++this.requestIdCounter}`
      this.streamingCallbacks.set(requestId, onChunk)
    }
    try {
      const fullText = await this.workerProxy.generateTextStream(promptOrMessages, { ...rest, requestId })
      if (requestId) this.streamingCallbacks.delete(requestId)
      return fullText
    } catch (e) {
      if (requestId) this.streamingCallbacks.delete(requestId)
      throw e
    }
  }

  async isModelLoaded() {
    if (!this.workerReady || !this.workerProxy) return false
    try {
      const status = await this.workerProxy.getStatus()
      return status.isLoaded
    } catch {
      return false
    }
  }

  async getModelInfo() {
    if (!this.workerReady || !this.workerProxy) {
      return { modelName: null, backend: null, dtype: null, modelSize: 0, isLoaded: false, isLoading: false }
    }
    try {
      return await this.workerProxy.getModelInfo()
    } catch {
      return { modelName: null, backend: null, dtype: null, modelSize: 0, isLoaded: false, isLoading: false }
    }
  }

  async getModelSize() {
    const info = await this.getModelInfo()
    return info.modelSize
  }

  async getModelName() {
    const info = await this.getModelInfo()
    return info.modelName
  }

  async getBackend() {
    const info = await this.getModelInfo()
    return info.backend
  }

  async unloadModel() {
    if (this.workerProxy) {
      try {
        await this.workerProxy.unload()
        this.workerReady = false
      } catch (e) {
        console.error('Failed to unload model:', e)
      }
    }
  }

  terminateWorker() {
    if (this.workerProxy) {
      this.workerProxy[Comlink.releaseProxy]?.()
      this.workerProxy = null
    }
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.workerReady = false
    }
    this.initializingWorker = false
  }
}

export const serverService = new ServerService()
export default serverService
