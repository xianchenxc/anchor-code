/**
 * AI Service - Pure communication layer
 * Handles communication with Worker, all model configuration and state is managed in Worker
 * This abstraction allows easy switching to API-based implementations in the future
 * UI layer should not be aware of implementation details (Web Worker, API, etc.)
 */
class AIService {
  constructor() {
    this.worker = null
    this.workerReady = false
    this.pendingRequests = new Map() // Map<requestId, {resolve, reject, onChunk?}>
    this.pendingLoadRequests = new Map() // Map<requestId, {resolve, reject}>
    this.requestIdCounter = 0
    this.workerSupported = this._checkWorkerSupport()
    this.initializingWorker = false // Prevent concurrent initialization
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
   * Currently uses Web Worker, but implementation can be swapped without affecting UI
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

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(
          new URL('../workers/modelWorker.js', import.meta.url),
          { type: 'module' }
        )

        this.worker.onmessage = (event) => {
          const { type, ...data } = event.data

          switch (type) {
            case 'worker-ready':
              this.workerReady = true
              this.initializingWorker = false
              resolve()
              break

            case 'load-complete':
              // Handle load-complete with requestId matching
              const loadRequest = data.requestId
                ? this.pendingLoadRequests.get(data.requestId)
                : null
              if (loadRequest) {
                this.pendingLoadRequests.delete(data.requestId)
                if (data.success) {
                  loadRequest.resolve()
                } else {
                  loadRequest.reject(new Error(data.message || 'Failed to load model'))
                }
              }
              break

            case 'generate-chunk':
              const chunkRequest = this.pendingRequests.get(data.requestId)
              if (chunkRequest && chunkRequest.onChunk) {
                chunkRequest.onChunk(data.chunk, data.fullText)
              }
              break

            case 'generate-complete':
              const request = this.pendingRequests.get(data.requestId)
              if (request) {
                this.pendingRequests.delete(data.requestId)
                if (data.success) {
                  request.resolve(data.text)
                } else {
                  request.reject(new Error(data.message || 'Generation failed'))
                }
              }
              break

            case 'model-info':
              // Model info response - handled by getModelInfo()
              break

            case 'status':
              // Status response - handled by isModelLoaded()
              break

            case 'error':
              const errorRequest = data.requestId
                ? this.pendingRequests.get(data.requestId)
                : null
              if (errorRequest) {
                this.pendingRequests.delete(data.requestId)
                errorRequest.reject(new Error(data.message || 'Unknown error'))
              } else {
                console.error('Worker error:', data.message)
              }
              break

            default:
              console.warn('Unknown worker message type:', type)
          }
        }

        this.worker.onerror = (error) => {
          console.error('Worker error:', error)
          this.worker = null
          this.workerReady = false
          this.initializingWorker = false
          reject(error)
        }

        // Timeout for worker initialization
        setTimeout(() => {
          if (!this.workerReady) {
            this.initializingWorker = false
            reject(new Error('Worker initialization timeout'))
          }
        }, 10000)
      } catch (error) {
        console.error('Failed to initialize worker:', error)
        this.worker = null
        this.workerReady = false
        this.initializingWorker = false
        reject(error)
      }
    })
  }

  /**
   * Load the text generation model
   * @param {Object} options - Loading options
   * @param {string|null} options.modelName - Optional model name, uses default if not provided
   * @returns {Promise<void>}
   */
  async loadModel(options = {}) {
    if (!this.workerSupported) {
      throw new Error('AI functionality is not available in this browser. Please use a modern browser.')
    }

    const { modelName = null } = options

    // Initialize worker if needed
    await this.initializeWorker()
    if (!this.workerReady) {
      throw new Error('Worker failed to initialize')
    }

    // Generate requestId for this load request
    const requestId = ++this.requestIdCounter

    try {
      // Load model in worker (Worker layer handles all state checks)
      this.worker.postMessage({
        type: 'load-model',
        payload: { modelName, requestId }
      })

      // Wait for load to complete with requestId matching
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingLoadRequests.delete(requestId)
          reject(new Error('Model loading timeout'))
        }, 300000) // 5 minutes timeout

        this.pendingLoadRequests.set(requestId, {
          resolve: () => {
            clearTimeout(timeout)
            resolve()
          },
          reject: (error) => {
            clearTimeout(timeout)
            reject(error)
          }
        })
      })
    } catch (error) {
      // Clean up pending request on error
      this.pendingLoadRequests.delete(requestId)
      throw error
    }
  }

  /**
   * Generate text based on input prompt or chat messages (Worker mode only)
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

    if (!this.workerReady) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    const requestId = ++this.requestIdCounter
    const { onChunk, ...generationOptions } = options
    const streaming = !!onChunk

    return new Promise((resolve, reject) => {
      // Store request handlers with optional chunk callback
      this.pendingRequests.set(requestId, { 
        resolve, 
        reject,
        onChunk: onChunk || null
      })

      // Send generation request to worker
      this.worker.postMessage({
        type: 'generate',
        payload: {
          promptOrMessages,
          options: {
            ...generationOptions,
            streaming
          },
          requestId
        }
      })

      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error('Generation timeout'))
        }
      }, 60000)
    })
  }

  /**
   * Check if model is loaded
   * @returns {Promise<boolean>}
   */
  async isModelLoaded() {
    if (!this.workerSupported || !this.workerReady) {
      return false
    }

    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(false)
        return
      }
      this.worker.postMessage({ type: 'check-status' })
      const checkStatus = (event) => {
        if (event.data.type === 'status') {
          this.worker.removeEventListener('message', checkStatus)
          resolve(event.data.isLoaded)
        }
      }
      this.worker.addEventListener('message', checkStatus)
      setTimeout(() => {
        this.worker.removeEventListener('message', checkStatus)
        resolve(false)
      }, 1000)
    })
  }

  /**
   * Get model information from Worker
   * @returns {Promise<{modelName: string, backend: string|null, dtype: string|null, modelSize: number, isLoaded: boolean, isLoading: boolean}>}
   */
  async getModelInfo() {
    if (!this.workerSupported || !this.workerReady) {
      return {
        modelName: null,
        backend: null,
        dtype: null,
        modelSize: 0,
        isLoaded: false,
        isLoading: false
      }
    }

    return new Promise((resolve) => {
      if (!this.worker) {
        resolve({
          modelName: null,
          backend: null,
          dtype: null,
          modelSize: 0,
          isLoaded: false,
          isLoading: false
        })
        return
      }
      this.worker.postMessage({ type: 'get-model-info' })
      const checkInfo = (event) => {
        if (event.data.type === 'model-info') {
          this.worker.removeEventListener('message', checkInfo)
          resolve({
            modelName: event.data.modelName,
            backend: event.data.backend,
            dtype: event.data.dtype,
            modelSize: event.data.modelSize,
            isLoaded: event.data.isLoaded,
            isLoading: event.data.isLoading
          })
        }
      }
      this.worker.addEventListener('message', checkInfo)
      setTimeout(() => {
        this.worker.removeEventListener('message', checkInfo)
        resolve({
          modelName: null,
          backend: null,
          dtype: null,
          modelSize: 0,
          isLoaded: false,
          isLoading: false
        })
      }, 1000)
    })
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
  unloadModel() {
    if (this.worker) {
      this.worker.postMessage({ type: 'unload' })
      this.workerReady = false
    }
  }

  /**
   * Terminate worker (cleanup)
   */
  terminateWorker() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.workerReady = false
      this.pendingRequests.clear()
      this.pendingLoadRequests.clear()
    }
    this.initializingWorker = false
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService
