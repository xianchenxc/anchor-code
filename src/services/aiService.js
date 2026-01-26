/**
 * AI Service - Pure communication layer
 * Uses Comlink to simplify Web Worker communication
 * All model configuration and state is managed in Worker
 * This abstraction allows easy switching to API-based implementations in the future
 * UI layer should not be aware of implementation details (Web Worker, API, etc.)
 */

import * as Comlink from 'comlink'

class AIService {
  constructor() {
    this.worker = null
    this.workerProxy = null
    this.workerReady = false
    this.workerSupported = this._checkWorkerSupport()
    this.initializingWorker = false // Prevent concurrent initialization
    this.streamingCallbacks = new Map() // Store streaming callbacks by request ID
    this.requestIdCounter = 0
  }

  /**
   * Check if browser supports Web Workers with ES modules (internal)
   * @private
   * @returns {boolean}
   */
  _checkWorkerSupport() {
    if (typeof Worker === 'undefined') {
      return false
    }
    // Check if browser supports module workers
    try {
      // Modern browsers support { type: 'module' } option
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if AI service is supported in this environment
   * UI layer should use this method instead of checking implementation details
   * @returns {boolean}
   */
  isSupported() {
    return this.workerSupported
  }

  /**
   * Initialize model inference backend (internal)
   * Currently uses Web Worker with Comlink, but implementation can be swapped without affecting UI
   * @private
   * @returns {Promise<void>}
   */
  async initializeWorker() {
    if (!this.workerSupported) {
      throw new Error('AI functionality is not available in this browser')
    }

    if (this.worker && this.workerReady) {
      return
    }

    // Prevent concurrent initialization
    if (this.initializingWorker) {
      // Wait for existing initialization
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.workerReady) {
            clearInterval(checkInterval)
            resolve()
          } else if (!this.initializingWorker) {
            clearInterval(checkInterval)
            reject(new Error('Worker initialization failed'))
          }
        }, 50)
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Worker initialization timeout'))
        }, 5000)
      })
    }

    this.initializingWorker = true

    try {
      this.worker = new Worker(
        new URL('../workers/modelWorker.js', import.meta.url),
        { type: 'module' }
      )

      // Wrap worker with Comlink
      this.workerProxy = Comlink.wrap(this.worker)

      // Wait for worker to be ready (Comlink handles this automatically)
      // We can check if the proxy is ready by trying to call a method
      try {
        await this.workerProxy.getStatus()
        this.workerReady = true
        this.initializingWorker = false
      } catch (error) {
        // Worker might not be ready yet, wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100))
        await this.workerProxy.getStatus()
        this.workerReady = true
        this.initializingWorker = false
      }

      // Handle worker errors
      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
        this.worker = null
        this.workerProxy = null
        this.workerReady = false
        this.initializingWorker = false
      }

      // Handle streaming messages from worker
      // Use addEventListener to avoid conflicts with Comlink's message handling
      this.worker.addEventListener('message', (event) => {
        // Check if this is a streaming chunk message (not a Comlink message)
        // Comlink messages have a special format, so we check for our custom type
        if (event.data && typeof event.data === 'object' && event.data.type === 'streaming-chunk') {
          const { requestId, chunk, fullText } = event.data
          const callback = this.streamingCallbacks.get(requestId)
          if (callback) {
            callback(chunk, fullText)
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize worker:', error)
      this.worker = null
      this.workerProxy = null
      this.workerReady = false
      this.initializingWorker = false
      throw error
    }
  }

  /**
   * Load the text generation model
   * @param {Object} options - Loading options
   * @param {string|null} options.modelName - Optional model name, uses default if not provided
   * @param {Function} options.onProgress - Optional progress callback (progress: number) => void
   * @returns {Promise<void>}
   */
  async loadModel(options = {}) {
    if (!this.workerSupported) {
      throw new Error('AI functionality is not available in this browser. Please use a modern browser.')
    }

    const { modelName = null, onProgress = null } = options

    // Initialize worker if needed
    await this.initializeWorker()
    if (!this.workerReady || !this.workerProxy) {
      throw new Error('Worker failed to initialize')
    }

    try {
      // Wrap progress callback with Comlink.proxy if provided
      const progressProxy = onProgress ? Comlink.proxy(onProgress) : null

      // Call loadModel directly via Comlink proxy
      const result = await this.workerProxy.loadModel(modelName, progressProxy)

      if (!result.success) {
        throw new Error(result.message || 'Failed to load model')
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate text based on input prompt or chat messages (Worker mode only)
   * Always uses streaming via async generator
   * @param {string|Array<{role: string, content: string}>} promptOrMessages - Input prompt (string) or chat messages (array)
   * @param {Object} options - Generation options
   * @param {number} options.maxLength - Maximum output length
   * @param {number} options.temperature - Sampling temperature (0-1)
   * @param {number} options.topK - Top-k sampling
   * @param {number} options.topP - Top-p (nucleus) sampling
   * @param {Function} options.onChunk - Optional callback for streaming chunks (chunk: string, fullText: string) => void
   * @returns {Promise<string>}
   */
  async generate(promptOrMessages, options = {}) {
    if (!this.workerSupported) {
      throw new Error('AI functionality is not available in this browser. Please use a modern browser.')
    }

    if (!this.workerReady || !this.workerProxy) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    const { onChunk, ...generationOptions } = options

    // Use event-based streaming since Comlink doesn't natively support async generators
    let requestId = null
    if (onChunk) {
      requestId = `stream-${++this.requestIdCounter}`
      this.streamingCallbacks.set(requestId, onChunk)
    }

    try {
      // Call generateTextStream which will use postMessage for streaming
      const fullText = await this.workerProxy.generateTextStream(promptOrMessages, {
        ...generationOptions,
        requestId: requestId // Pass request ID for event-based streaming
      })

      // Clean up callback after generation completes
      if (requestId) {
        this.streamingCallbacks.delete(requestId)
      }

      return fullText
    } catch (error) {
      // Clean up callback on error
      if (requestId) {
        this.streamingCallbacks.delete(requestId)
      }
      throw error
    }
  }

  /**
   * Check if model is loaded
   * @returns {Promise<boolean>}
   */
  async isModelLoaded() {
    if (!this.workerSupported || !this.workerReady || !this.workerProxy) {
      return false
    }

    try {
      const status = await this.workerProxy.getStatus()
      return status.isLoaded
    } catch (error) {
      console.error('Failed to check model status:', error)
      return false
    }
  }

  /**
   * Get model information from Worker
   * @returns {Promise<{modelName: string, backend: string|null, dtype: string|null, modelSize: number, isLoaded: boolean, isLoading: boolean}>}
   */
  async getModelInfo() {
    if (!this.workerSupported || !this.workerReady || !this.workerProxy) {
      return {
        modelName: null,
        backend: null,
        dtype: null,
        modelSize: 0,
        isLoaded: false,
        isLoading: false
      }
    }

    try {
      return await this.workerProxy.getModelInfo()
    } catch (error) {
      console.error('Failed to get model info:', error)
      return {
        modelName: null,
        backend: null,
        dtype: null,
        modelSize: 0,
        isLoaded: false,
        isLoading: false
      }
    }
  }

  /**
   * Get model size in MB (async, from Worker)
   * @returns {Promise<number>}
   */
  async getModelSize() {
    const info = await this.getModelInfo()
    return info.modelSize
  }

  /**
   * Get current model name (async, from Worker)
   * @returns {Promise<string|null>}
   */
  async getModelName() {
    const info = await this.getModelInfo()
    return info.modelName
  }

  /**
   * Get current backend (async, from Worker)
   * @returns {Promise<string|null>}
   */
  async getBackend() {
    const info = await this.getModelInfo()
    return info.backend
  }

  /**
   * Unload the model to free memory
   */
  async unloadModel() {
    if (this.workerProxy) {
      try {
        await this.workerProxy.unload()
        this.workerReady = false
      } catch (error) {
        console.error('Failed to unload model:', error)
      }
    }
  }

  /**
   * Terminate worker (cleanup)
   */
  terminateWorker() {
    if (this.workerProxy) {
      // Release Comlink proxy
      this.workerProxy[Comlink.releaseProxy]()
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

// Export singleton instance
export const aiService = new AIService()
export default aiService
