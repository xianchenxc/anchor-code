/**
 * Model Service - Core model logic
 * Handles model loading, text generation, backend management, and state management
 * This class is independent of communication layer and can be tested in isolation
 */

import { pipeline, TextStreamer } from '@huggingface/transformers'

/**
 * Default model configuration
 * Using Qwen1.5-0.5B-Chat for optimal Chinese support
 * This is a chat-optimized model that works well for conversational tasks
 */
const DEFAULT_MODEL = 'Xenova/Qwen1.5-0.5B-Chat'
const MODEL_SIZE_MB = 500 // Approximate size for q4 quantized model

/**
 * Cache model metadata to IndexedDB
 * Uses the same database as transformers.js for consistency
 */
const DB_NAME = 'transformers-cache'
const DB_VERSION = 1
const STORE_NAME = 'models'

/**
 * Model Service class
 * Manages model lifecycle, generation, and state
 */
export class ModelService {
  constructor() {
    this.generator = null
    this.modelName = null
    this.isLoading = false
    this.backend = null
    this.dtype = null
    this.loadingPromise = null // Promise queue for handling concurrent requests
    this.defaultModel = DEFAULT_MODEL
    this.modelSizeMB = MODEL_SIZE_MB
  }

  /**
   * Cache model metadata to IndexedDB
   * @param {string} modelNameToCache - Model name to cache
   * @param {Object} metadata - Metadata to cache
   * @private
   */
  async _cacheModelMetadata(modelNameToCache, metadata) {
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = () => reject(new Error('Failed to open IndexedDB'))
        request.onsuccess = () => resolve(request.result)
        request.onupgradeneeded = (event) => {
          const db = event.target.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME)
          }
        }
      })

      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const cacheData = {
        modelName: modelNameToCache,
        metadata,
        cachedAt: new Date().toISOString()
      }
      
      await new Promise((resolve, reject) => {
        const request = store.put(cacheData, `metadata-${modelNameToCache}`)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to cache model metadata'))
      })
    } catch (error) {
      // Silently fail - caching is optional and shouldn't block model loading
      console.warn('Failed to cache model metadata:', error)
    }
  }

  /**
   * Check if WebGPU is available in Worker context
   * In Web Workers, use navigator.gpu (WorkerNavigator) instead of self.gpu
   * @returns {Promise<boolean>}
   * @private
   */
  async _checkWebGPUSupport() {
    // In Web Workers, navigator is available as WorkerNavigator
    // Check both navigator.gpu and self.navigator.gpu for compatibility
    const gpu = navigator?.gpu || self.navigator?.gpu
    if (!gpu) {
      return false
    }
    
    try {
      const adapter = await gpu.requestAdapter()
      return adapter !== null
    } catch (error) {
      // Silently fail - WebGPU not available or request failed
      return false
    }
  }

  /**
   * Check if WebAssembly is available
   * @returns {boolean}
   * @private
   */
  _checkWebAssemblySupport() {
    return typeof WebAssembly !== 'undefined'
  }

  /**
   * Get the best available backend
   * @returns {Promise<string>}
   * @private
   */
  async _getBestBackend() {
    if (await this._checkWebGPUSupport()) {
      return 'webgpu'
    }
    if (this._checkWebAssemblySupport()) {
      return 'wasm'
    }
    return 'cpu'
  }

  /**
   * Load the model
   * @param {string|null} modelNameToLoad - Model name to load, or null to use default
   * @param {Function} onProgress - Optional progress callback (progress: number) => void
   * @returns {Promise<{success: boolean, message: string, modelName?: string, backend?: string, dtype?: string, modelSize?: number}>}
   */
  async loadModel(modelNameToLoad = null, onProgress = null) {
    // Use default model if not specified
    const targetModelName = modelNameToLoad || this.defaultModel
    
    // Scenario 1: Model already loaded with same name
    if (this.generator && this.modelName === targetModelName) {
      return { 
        success: true, 
        message: 'Model already loaded',
        modelName: targetModelName,
        backend: this.backend,
        dtype: this.dtype,
        modelSize: this.modelSizeMB
      }
    }

    // Scenario 2: Loading in progress, wait for current load to complete
    if (this.loadingPromise) {
      return await this.loadingPromise
    }

    // Scenario 3: Start new loading
    this.loadingPromise = (async () => {
      this.isLoading = true
      
      // If different model is loaded, unload it first
      if (this.generator && this.modelName !== targetModelName) {
        this.generator = null
        this.modelName = null
        this.backend = null
        this.dtype = null
      }
      
      const targetModel = targetModelName
      this.modelName = targetModel

      try {
        // Initialize backend
        this.backend = await this._getBestBackend()
        
        // Try different quantization options
        const dtypeOptions = ['q4', 'q4f16', 'int8', null]
        let lastError = null
        let successfulDtype = null

        for (const dtypeOption of dtypeOptions) {
          try {
            const options = {
              progress_callback: (progress) => {
                if (progress.status === 'progress') {
                  const percent = Math.min(
                    Math.round((progress.loaded / progress.total) * 100),
                    95
                  )
                  if (onProgress) {
                    onProgress(percent)
                  }
                }
              }
            }

            if (dtypeOption) {
              options.dtype = dtypeOption
            }

            this.generator = await pipeline('text-generation', targetModel, options)
            successfulDtype = dtypeOption || 'auto'
            break
          } catch (error) {
            lastError = error
            if (dtypeOption) {
              console.warn(`Failed to load with dtype '${dtypeOption}', trying next:`, error.message)
            }
          }
        }

        if (!this.generator) {
          throw lastError || new Error('Failed to load model with all dtype options')
        }

        // Send final progress update
        if (onProgress) {
          onProgress(100)
        }

        // Cache model metadata (non-blocking)
        this._cacheModelMetadata(targetModel, {
          modelName: targetModel,
          dtype: successfulDtype,
          backend: this.backend,
          loadedAt: new Date().toISOString()
        }).catch(() => {
          // Silently fail - caching is optional
        })

        this.dtype = successfulDtype
        this.isLoading = false
        return {
          success: true,
          message: 'Model loaded successfully',
          modelName: targetModel,
          backend: this.backend,
          dtype: successfulDtype,
          modelSize: this.modelSizeMB
        }
      } catch (error) {
        this.isLoading = false
        this.generator = null
        this.modelName = null
        this.backend = null
        this.dtype = null
        return {
          success: false,
          message: error.message || 'Failed to load model'
        }
      } finally {
        this.loadingPromise = null
      }
    })()
    
    return await this.loadingPromise
  }

  /**
   * Generate text using async generator for streaming
   * @param {string|Array<{role: string, content: string}>} promptOrMessages - Input prompt or chat messages
   * @param {Object} options - Generation options
   * @param {number} options.maxLength - Maximum output length
   * @param {number} options.temperature - Sampling temperature
   * @param {number} options.topK - Top-k sampling
   * @param {number} options.topP - Top-p (nucleus) sampling
   * @returns {AsyncGenerator<{chunk: string, fullText: string}, string>}
   */
  async *generateTextStream(promptOrMessages, options = {}) {
    if (!this.generator) {
      throw new Error('Model not loaded')
    }

    const {
      maxLength = 512,
      temperature = 0.7,
      topK = 50,
      topP = 0.9
    } = options

    try {
      // Convert string prompt to chat format if needed
      let input
      if (typeof promptOrMessages === 'string') {
        input = [
          { role: 'system', content: '你是一个专业的编程知识助手，擅长用中文解释技术概念。' },
          { role: 'user', content: promptOrMessages }
        ]
      } else if (Array.isArray(promptOrMessages)) {
        input = promptOrMessages
      } else {
        throw new Error('Input must be a string or an array of chat messages')
      }

      // Get tokenizer from generator
      const tokenizer = this.generator.tokenizer || 
                       this.generator.processor?.tokenizer ||
                       (this.generator.model && this.generator.model.tokenizer)
      
      if (!tokenizer) {
        throw new Error('Tokenizer not available for streaming')
      }

      let fullText = ''
      let lastYieldedLength = 0
      let generationComplete = false
      let generationError = null
      
      // Queue to store pending chunks for async generator
      // Using a queue to bridge synchronous callback and async generator
      const chunkQueue = []
      let waitingResolver = null

      // Create a streamer that accumulates text and queues chunks
      const streamer = new TextStreamer(tokenizer, {
        callback_function: (text) => {
          // TextStreamer callback is synchronous, so we can safely update state
          fullText += text
          const chunk = fullText.slice(lastYieldedLength)
          lastYieldedLength = fullText.length
          
          // Queue the chunk for async generator to yield
          chunkQueue.push({ chunk, fullText })
          
          // Wake up waiting generator if any
          if (waitingResolver) {
            const resolver = waitingResolver
            waitingResolver = null
            resolver()
          }
        },
        skip_prompt: true,
        skip_special_tokens: true
      })

      // Start generation in background (non-blocking)
      const generationPromise = this.generator(input, {
        max_new_tokens: maxLength,
        temperature,
        top_k: topK,
        top_p: topP,
        do_sample: temperature > 0,
        return_full_text: false,
        streamer: streamer
      }).then(() => {
        generationComplete = true
        // Wake up generator to check completion
        if (waitingResolver) {
          const resolver = waitingResolver
          waitingResolver = null
          resolver()
        }
      }).catch((error) => {
        generationError = error
        generationComplete = true
        // Wake up generator to handle error
        if (waitingResolver) {
          const resolver = waitingResolver
          waitingResolver = null
          resolver()
        }
      })

      // Yield chunks as they arrive
      while (!generationComplete || chunkQueue.length > 0) {
        // Yield all queued chunks immediately (batch processing for efficiency)
        while (chunkQueue.length > 0) {
          yield chunkQueue.shift()
        }

        // If generation is complete and queue is empty, we're done
        if (generationComplete) {
          break
        }

        // Wait for next chunk with shorter timeout for better responsiveness
        await new Promise((resolve) => {
          waitingResolver = resolve
          // Reduced timeout from 100ms to 20ms for better real-time performance
          // This timeout is a safety mechanism to prevent infinite waiting
          setTimeout(() => {
            if (waitingResolver === resolve) {
              waitingResolver = null
              resolve()
            }
          }, 20)
        })
      }

      // Throw error if generation failed
      if (generationError) {
        throw generationError
      }

      // Return final text (this value is accessible via generator's return value)
      return fullText.trim()
    } catch (error) {
      const raw =
        error instanceof Error
          ? error.message
          : (error && typeof error === 'object' && 'message' in error)
            ? error.message
            : typeof error === 'string'
              ? error
              : String(error != null ? error : 'Unknown error')
      const isInternalCode = /^\d+$/.test(String(raw).trim())
      const msg = isInternalCode
        ? `Model inference failed. Please reload the model and try again. (code: ${raw})`
        : raw
      throw new Error(`Streaming generation failed: ${msg}`)
    }
  }


  /**
   * Get current model status
   * @returns {Promise<{isLoaded: boolean, modelName: string, isLoading: boolean}>}
   */
  async getStatus() {
    return {
      isLoaded: this.generator !== null,
      modelName: this.modelName || this.defaultModel,
      isLoading: this.isLoading
    }
  }

  /**
   * Get model information
   * @returns {Promise<{modelName: string, backend: string|null, dtype: string|null, modelSize: number, isLoaded: boolean, isLoading: boolean}>}
   */
  async getModelInfo() {
    return {
      modelName: this.modelName || this.defaultModel,
      backend: this.backend,
      dtype: this.dtype,
      modelSize: this.modelSizeMB,
      isLoaded: this.generator !== null,
      isLoading: this.isLoading
    }
  }

  /**
   * Unload the model to free memory
   * @returns {Promise<void>}
   */
  async unload() {
    this.generator = null
    this.modelName = null
    this.backend = null
    this.dtype = null
    this.isLoading = false
    this.loadingPromise = null
  }
}
