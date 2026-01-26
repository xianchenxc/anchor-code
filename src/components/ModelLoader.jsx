import { useState, useEffect, useCallback, useRef, useEffectEvent, useMemo } from 'react'
import aiService from '../services/aiService.js'

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
    <div className="w-full max-w-md mx-auto px-4">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
          正在加载 AI 模型...
        </h3>
        <p className="text-sm text-gray-600">
          首次加载可能需要一些时间
        </p>
      </div>
    </div>
  </div>
)

// Error message component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">
          模型加载失败
        </h3>
        <p className="text-sm text-red-700 mb-4">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        )}
      </div>
    </div>
  </div>
)

// Unsupported browser message component
const UnsupportedBrowser = () => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-yellow-900 mb-2">
          AI 功能不可用
        </h3>
        <p className="text-sm text-yellow-800 mb-2">
          您的浏览器不支持 AI 功能。
        </p>
        <p className="text-xs text-yellow-700 mb-4">
          请使用现代浏览器（如 Chrome、Firefox、Safari、Edge 的最新版本）访问此功能。
        </p>
        <div className="text-xs text-yellow-600">
          <p className="mb-1">支持的浏览器：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Chrome 80+</li>
            <li>Firefox 80+</li>
            <li>Safari 15+</li>
            <li>Edge 80+</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)


/**
 * Model loader component for managing AI model loading state
 * Automatically loads the model on mount and handles initialization and error handling
 * 
 * @param {Object} props
 * @param {Function} props.onModelReady - Callback when model is loaded (() => void)
 * @param {Function} props.onError - Error callback ((error: string) => void)
 * @param {React.ReactNode} props.children - Child components to render
 * 
 * @example
 * <ModelLoader onModelReady={() => console.log('Ready!')}>
 *   <ChatInterface />
 * </ModelLoader>
 */
export default function ModelLoader({
  onModelReady,
  onError,
  children
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isReady, setIsReady] = useState(false)
  
  // isSupported is a stable value that doesn't change during component lifecycle
  // Use useMemo to compute it once per component instance
  const isSupported = useMemo(() => aiService.isSupported(), [])
  
  // Use a ref to track initialization state (handles StrictMode double execution)
  // In StrictMode, effect runs twice: first execution sets this to true,
  // cleanup resets it, second execution can proceed
  const initializationStartedRef = useRef(false)
  
  // Use useEffectEvent to create stable event handlers that don't need to be in dependencies
  const handleModelReady = useEffectEvent(() => {
    if (onModelReady) {
      onModelReady()
    }
  })
  
  const handleError = useEffectEvent((errorMessage) => {
    if (onError) {
      onError(errorMessage)
    }
  })

  // Set error if browser is not supported
  useEffect(() => {
    if (!isSupported) {
      setError('AI 功能在此浏览器中不可用')
    }
  }, [isSupported])
  
  // Load model function - Worker layer handles all concurrency protection
  const loadModel = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Worker layer handles duplicate load prevention
      await aiService.loadModel()
      
      // Verify model is actually loaded
      const loaded = await aiService.isModelLoaded()
      
      setIsLoading(false)
      setIsReady(loaded)
      
      if (loaded) {
        handleModelReady()
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to load model'
      setIsLoading(false)
      setError(errorMessage)
      handleError(errorMessage)
    }
  }, [handleModelReady, handleError])

  // Initialize: automatically load model on mount
  // Handle StrictMode: prevent double execution in development
  useEffect(() => {
    // Skip if initialization is already in progress (StrictMode protection)
    if (initializationStartedRef.current) {
      return
    }
    
    initializationStartedRef.current = true
    let cancelled = false

    const initialize = async () => {
      // Small delay to avoid blocking initial render
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (cancelled) return

      // Worker layer handles all cases: already loaded, loading in progress, or new load
      if (!cancelled) {
        loadModel()
      }
    }
    
    initialize()
    
    return () => {
      cancelled = true
      // Reset flag on cleanup to allow second effect execution in StrictMode
      initializationStartedRef.current = false
    }
  }, [loadModel])

  // Render logic
  if (!isSupported) {
    return <UnsupportedBrowser />
  }

  if (isReady) {
    return <>{children}</>
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadModel} />
  }

  // Fallback loading state
  return <LoadingSpinner />
}
