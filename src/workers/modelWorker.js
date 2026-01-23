/**
 * Web Worker for model inference
 * Runs model loading and text generation in a background thread
 * to prevent blocking the main UI thread
 */

import { pipeline, env, TextStreamer } from '@huggingface/transformers'

// Configure environment for Worker
// Disable local models for security and compatibility reasons:
// 1. Web Workers have limited file system access
// 2. Security: prevents loading models from local file system
// 3. This project only uses remote models from Hugging Face Hub
//
// Caching behavior:
// - transformers.js automatically caches model files to IndexedDB (transformers-cache)
// - First load: Downloads model files from Hugging Face Hub (~500MB) and caches them
// - Subsequent loads: Automatically loads from IndexedDB cache (much faster, no download)
// - Cache persists across browser sessions until manually cleared
env.allowLocalModels = false
env.allowRemoteModels = true
env.backends.onnx.wasm.proxy = false

/**
 * Default model configuration
 * Using Qwen1.5-0.5B-Chat for optimal Chinese support
 * This is a chat-optimized model that works well for conversational tasks
 */
const DEFAULT_MODEL = 'Xenova/Qwen1.5-0.5B-Chat'
const MODEL_SIZE_MB = 500 // Approximate size for q4 quantized model

let generator = null
let modelName = null
let isLoading = false
let backend = null
let dtype = null
let loadingPromise = null  // Promise queue for handling concurrent requests

/**
 * Cache model metadata to IndexedDB
 * Uses the same database as transformers.js for consistency
 */
const DB_NAME = 'transformers-cache'
const DB_VERSION = 1
const STORE_NAME = 'models'

async function cacheModelMetadata(modelNameToCache, metadata) {
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
 */
async function checkWebGPUSupport() {
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
 */
function checkWebAssemblySupport() {
  return typeof WebAssembly !== 'undefined'
}

/**
 * Get the best available backend
 */
async function getBestBackend() {
  if (await checkWebGPUSupport()) {
    return 'webgpu'
  }
  if (checkWebAssemblySupport()) {
    return 'wasm'
  }
  return 'cpu'
}

/**
 * Load the model in the Worker
 * @param {string|null} modelNameToLoad - Model name to load, or null to use default
 */
async function loadModel(modelNameToLoad = null, onProgress) {
  // Use default model if not specified
  const targetModelName = modelNameToLoad || DEFAULT_MODEL
  
  // Scenario 1: Model already loaded with same name
  if (generator && modelName === targetModelName) {
    return { 
      success: true, 
      message: 'Model already loaded',
      modelName: targetModelName,
      backend,
      dtype,
      modelSize: MODEL_SIZE_MB
    }
  }

  // Scenario 2: Loading in progress, wait for current load to complete
  if (loadingPromise) {
    return await loadingPromise
  }

  // Scenario 3: Start new loading
  loadingPromise = (async () => {
    isLoading = true
    
    // If different model is loaded, unload it first
    if (generator && modelName !== targetModelName) {
      generator = null
      modelName = null
      backend = null
      dtype = null
    }
    
    const targetModel = targetModelName
    modelName = targetModel

  try {
    // Initialize backend
    backend = await getBestBackend()
    
    // Try different quantization options
    const dtypeOptions = ['q4', 'q4f16', 'int8', null]
    let lastError = null
    let successfulDtype = null

    for (const dtypeOption of dtypeOptions) {
      try {
        const options = {
          progress_callback: (progress) => {
            if (progress.status === 'progress' && onProgress) {
              const percent = Math.min(
                Math.round((progress.loaded / progress.total) * 100),
                95
              )
              self.postMessage({
                type: 'load-progress',
                progress: percent
              })
            }
          }
        }

        if (dtypeOption) {
          options.dtype = dtypeOption
        }

        generator = await pipeline('text-generation', targetModel, options)
        successfulDtype = dtypeOption || 'auto'
        break
      } catch (error) {
        lastError = error
        if (dtypeOption) {
          console.warn(`Failed to load with dtype '${dtypeOption}', trying next:`, error.message)
        }
      }
    }

    if (!generator) {
      throw lastError || new Error('Failed to load model with all dtype options')
    }

    self.postMessage({
      type: 'load-progress',
      progress: 100
    })

    // Cache model metadata in Worker (non-blocking)
    cacheModelMetadata(targetModel, {
      modelName: targetModel,
      dtype: successfulDtype,
      backend,
      loadedAt: new Date().toISOString()
    }).catch(() => {
      // Silently fail - caching is optional
    })

    dtype = successfulDtype
    isLoading = false
    return {
      success: true,
      message: 'Model loaded successfully',
      modelName: targetModel,
      backend,
      dtype: successfulDtype,
      modelSize: MODEL_SIZE_MB
    }
  } catch (error) {
    isLoading = false
    generator = null
    modelName = null
    backend = null
    dtype = null
    return {
      success: false,
      message: error.message || 'Failed to load model'
    }
  } finally {
    loadingPromise = null
  }
  })()
  
  return await loadingPromise
}

/**
 * Generate text using the loaded model with streaming support
 */
async function generateText(promptOrMessages, options) {
  if (!generator) {
    throw new Error('Model not loaded')
  }

  const {
    maxLength = 512,
    temperature = 0.7,
    topK = 50,
    topP = 0.9,
    streaming = false,
    requestId
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

    // If streaming is enabled, use TextStreamer
    if (streaming) {
      try {
        let fullText = ''
        
        // Get tokenizer from generator (pipeline object has tokenizer property)
        // Try different possible locations for tokenizer
        const tokenizer = generator.tokenizer || 
                         generator.processor?.tokenizer ||
                         (generator.model && generator.model.tokenizer)
        
        if (!tokenizer) {
          // Fallback to non-streaming if tokenizer not available
          console.warn('Tokenizer not available for streaming, falling back to non-streaming mode')
        } else {
          // Create a streamer that sends chunks to the main thread
          const streamer = new TextStreamer(tokenizer, {
            callback_function: (text) => {
              fullText += text
              // Send chunk to main thread via postMessage
              self.postMessage({
                type: 'generate-chunk',
                requestId,
                chunk: text,
                fullText: fullText
              })
            },
            skip_prompt: true,
            skip_special_tokens: true
          })

          // Generate with streamer
          await generator(input, {
            max_new_tokens: maxLength,
            temperature,
            top_k: topK,
            top_p: topP,
            do_sample: temperature > 0,
            return_full_text: false,
            streamer: streamer
          })

          // Send final result
          return fullText.trim()
        }
      } catch (streamError) {
        // If streaming fails, fallback to non-streaming
        console.warn('Streaming failed, falling back to non-streaming mode:', streamError.message)
      }
    }

    // Non-streaming generation (original behavior)
    const output = await generator(input, {
      max_new_tokens: maxLength,
      temperature,
      top_k: topK,
      top_p: topP,
      do_sample: temperature > 0,
      return_full_text: false
    })

    // Extract generated text
    let generatedText = null
    
    if (Array.isArray(output)) {
      if (output.length > 0 && output[0]?.generated_text) {
        generatedText = output[0].generated_text
      }
    } else if (output?.generated_text) {
      generatedText = output.generated_text
    }

    // Handle chat format
    if (Array.isArray(generatedText)) {
      const assistantMessage = generatedText
        .slice()
        .reverse()
        .find(msg => msg.role === 'assistant')
      if (assistantMessage?.content) {
        return assistantMessage.content
      }
      return ''
    }

    // Handle plain text format
    if (typeof generatedText === 'string') {
      return generatedText
    }

    return ''
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`)
  }
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'load-model': {
        const { modelName: modelNameToLoad = null, requestId } = payload || {}
        const result = await loadModel(modelNameToLoad)
        self.postMessage({
          type: 'load-complete',
          requestId,  // Include requestId for matching
          success: result.success,
          message: result.message,
          modelName: result.modelName,
          backend: result.backend,
          dtype: result.dtype,
          modelSize: result.modelSize
        })
        break
      }

      case 'generate': {
        const { promptOrMessages, options, requestId } = payload
        const generateOptions = { ...options, requestId }
        try {
          const text = await generateText(promptOrMessages, generateOptions)
          self.postMessage({
            type: 'generate-complete',
            requestId,
            text,
            success: true
          })
        } catch (error) {
          self.postMessage({
            type: 'error',
            requestId,
            message: error.message || 'Generation failed',
            success: false
          })
        }
        break
      }

      case 'check-status': {
        self.postMessage({
          type: 'status',
          isLoaded: generator !== null,
          modelName: modelName || DEFAULT_MODEL,
          isLoading
        })
        break
      }

      case 'get-model-info': {
        self.postMessage({
          type: 'model-info',
          modelName: modelName || DEFAULT_MODEL,
          backend,
          dtype,
          modelSize: MODEL_SIZE_MB,
          isLoaded: generator !== null,
          isLoading
        })
        break
      }

      case 'unload': {
        generator = null
        modelName = null
        backend = null
        dtype = null
        isLoading = false
        self.postMessage({
          type: 'unload-complete',
          success: true
        })
        break
      }

      default:
        self.postMessage({
          type: 'error',
          message: `Unknown message type: ${type}`
        })
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message || 'Unknown error occurred',
      requestId: event.data.payload?.requestId
    })
  }
})

// Notify main thread that worker is ready
self.postMessage({ type: 'worker-ready' })
