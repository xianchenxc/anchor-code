/**
 * Content extractor inside Worker: format content from catalog for AI prompts.
 * Uses dataService (same process) for data access.
 */

import * as dataService from './dataService.js'

/**
 * Get all content items from a specific category
 * @param {string} categoryId - Category ID (e.g., 'javascript', 'react', 'web3')
 * @returns {Array} Array of all items in the category
 */
export function getCategoryContent(categoryId) {
  return dataService.getQuestionsByCategoryId(categoryId)
}

/**
 * Get relevant content items based on query keywords
 * @param {string} query - User query or question
 * @param {string|null} categoryId - Optional category ID to limit search
 * @param {number} maxItems - Maximum number of items to return (default: 10)
 * @returns {Array} Array of relevant items
 */
export function getRelevantContent(query, categoryId = null, maxItems = 10) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1)
  if (searchTerms.length === 0) return []

  const itemsToSearch = categoryId ? getCategoryContent(categoryId) : dataService.getItems()

  const scoredItems = itemsToSearch.map(item => {
    const searchText = `${item.title || ''} ${item.question || ''} ${item.content || ''} ${item.description || ''}`.toLowerCase()
    const score = searchTerms.reduce((acc, term) => {
      const matches = (searchText.match(new RegExp(term, 'g')) || []).length
      return acc + matches
    }, 0)
    return { item, score }
  })

  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ item }) => item)
}

/**
 * Format content items for use in AI prompts
 * @param {Array} items - Array of content items
 * @param {number} maxLength - Maximum total length of formatted content (default: 2000)
 * @returns {string} Formatted content string
 */
export function formatContentForPrompt(items, maxLength = 2000) {
  if (!items || items.length === 0) return ''

  let formatted = ''
  for (const item of items) {
    let itemText = ''
    if (item.title) itemText += `**${item.title}**\n`
    if (item.question) itemText += `问题：${item.question}\n`
    if (item.content) {
      const contentWithoutCode = item.content.replace(/```[\s\S]*?```/g, '[代码示例]')
      itemText += `${contentWithoutCode}\n`
    }
    if (item.description) itemText += `${item.description}\n`
    itemText += '\n---\n\n'
    if (formatted.length + itemText.length > maxLength) break
    formatted += itemText
  }
  return formatted.trim()
}

/**
 * Get all frontend-related content (JavaScript, React, Web3)
 * @returns {string} Formatted content string with all frontend knowledge
 */
export function getAllFrontendContent() {
  const frontendCategories = ['javascript', 'react', 'web3']
  const allItems = []
  frontendCategories.forEach(categoryId => {
    const categoryItems = getCategoryContent(categoryId)
    allItems.push(...categoryItems)
  })
  return formatContentForPrompt(allItems, 4000)
}

/**
 * Get content for a specific category formatted for prompts
 * @param {string} categoryId - Category ID
 * @returns {string} Formatted content string
 */
export function getCategoryContentForPrompt(categoryId) {
  const categoryItems = getCategoryContent(categoryId)
  return formatContentForPrompt(categoryItems, 3000)
}

/**
 * Get interview questions for a specific category
 * @param {string} categoryId - Category ID
 * @returns {Array} Array of interview question items
 */
export function getCategoryInterviewQuestions(categoryId) {
  return dataService.getInterviewQuestionsByCategoryId(categoryId)
}

/**
 * Format interview questions for prompt context
 * @param {Array} questions - Array of interview question items
 * @param {number} maxQuestions - Maximum number of questions to include (default: 15)
 * @returns {string} Formatted questions string
 */
export function formatInterviewQuestionsForPrompt(questions, maxQuestions = 15) {
  if (!questions || questions.length === 0) return ''

  const limitedQuestions = questions.slice(0, maxQuestions)
  let formatted = '以下是一些相关的面试题和知识点，可以作为参考：\n\n'
  limitedQuestions.forEach((item, index) => {
    formatted += `${index + 1}. `
    if (item.question) formatted += `**问题**：${item.question}\n`
    else if (item.title) formatted += `**${item.title}**\n`
    if (item.content) {
      const content = item.content.length > 500 ? item.content.substring(0, 500) + '...' : item.content
      formatted += `${content}\n`
    }
    formatted += '\n'
  })
  return formatted.trim()
}
