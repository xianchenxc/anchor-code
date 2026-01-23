/**
 * Error message formatting utilities
 * Provides consistent error message formatting across the application
 */

/**
 * Format error message for user display
 * @param {Error|string} error - Error object or error message string
 * @param {string} action - Action description (e.g., "生成回答", "生成问题", "处理回答")
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error, action = '处理请求') {
  const errorMessage = error?.message || error || '未知错误'
  return `抱歉，${action}时出现错误：${errorMessage}。请稍后重试。`
}
