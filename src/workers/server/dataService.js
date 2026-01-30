/**
 * Data layer inside Worker: query categories + questions.
 * Data is loaded via initFromBaseUrl(baseUrl) (fetch from served JSON); throws if not initialized.
 */

const NOT_INITIALIZED = 'Data not initialized. Call initOptions({ baseUrl }) first.'

let inited = false
let categories = []
let items = []
let itemsById = new Map()

function ensureInited() {
  if (!inited) {
    throw new Error(NOT_INITIALIZED)
  }
}

/**
 * Load data from served JSON (data/categories.json, data/questions.json) and initialize.
 * @param {string} baseUrl - Full base URL (e.g. origin + base path) for fetch
 */
export async function initFromBaseUrl(baseUrl) {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  const categoriesUrl = new URL('data/categories.json', base).href
  const questionsUrl = new URL('data/questions.json', base).href
  const [catRes, qRes] = await Promise.all([
    fetch(categoriesUrl),
    fetch(questionsUrl)
  ])
  if (!catRes.ok) throw new Error(`Failed to load categories: ${catRes.status}`)
  if (!qRes.ok) throw new Error(`Failed to load questions: ${qRes.status}`)
  const catJson = await catRes.json()
  const qJson = await qRes.json()
  initData({ categories: catJson?.categories || [], items: qJson?.items || [] })
}

/**
 * Initialize from payload (used by initFromBaseUrl after fetch)
 * @param {Object} payload
 * @param {Array} payload.categories - Category tree
 * @param {Array} payload.items - Flat list of question items
 */
export function initData(payload) {
  if (!payload || !Array.isArray(payload.categories) || !Array.isArray(payload.items)) {
    return
  }
  categories = payload.categories
  items = payload.items
  itemsById = new Map(items.map((i) => [i.id, i]))
  inited = true
}

/**
 * @returns {Array} Category tree
 */
export function getCategories() {
  ensureInited()
  return categories
}

/**
 * @returns {Array} All items
 */
export function getItems() {
  ensureInited()
  return items
}

/**
 * @param {string[]} ids - Item ids
 * @returns {Array} Items in order of ids
 */
function getItemsByIds(ids) {
  if (!ids?.length) return []
  return ids.map((id) => itemsById.get(id)).filter(Boolean)
}

/**
 * @param {string} subcategoryId - Subcategory id
 * @returns {Array} Questions for that subcategory
 */
export function getQuestionsBySubcategoryId(subcategoryId) {
  ensureInited()
  function findSubcategory(nodes) {
    if (!nodes || !Array.isArray(nodes)) return []
    for (const node of nodes) {
      if (node.id === subcategoryId && node.itemIds?.length) {
        return getItemsByIds(node.itemIds)
      }
      if (node.children?.length) {
        const found = findSubcategory(node.children)
        if (found.length > 0) return found
      }
    }
    return []
  }
  return findSubcategory(categories)
}

/**
 * @param {string} categoryId - Top-level category id
 * @returns {Array} Questions in tree order for that category
 */
export function getQuestionsByCategoryId(categoryId) {
  ensureInited()
  const category = categories.find((c) => c.id === categoryId)
  if (!category?.children?.length) return []
  const ids = category.children.flatMap((child) => child.itemIds || [])
  return getItemsByIds(ids)
}

/**
 * @returns {Array} All questions from subcategories with type === 'practice'
 */
export function getAllPracticeQuestions() {
  ensureInited()
  const ids = []
  for (const cat of categories) {
    for (const child of cat.children || []) {
      if (child.type === 'practice' && child.itemIds?.length) {
        ids.push(...child.itemIds)
      }
    }
  }
  return getItemsByIds(ids)
}

/**
 * @param {string} categoryId - Top-level category id
 * @returns {Array} Items from the "面试题" / questions subcategory only
 */
export function getInterviewQuestionsByCategoryId(categoryId) {
  ensureInited()
  const category = categories.find((c) => c.id === categoryId)
  if (!category?.children?.length) return []
  const sub = category.children.find(
    (s) => s.subcategory === 'questions' || s.name === '面试题'
  )
  if (!sub?.itemIds?.length) return []
  return sub.itemIds.map((id) => itemsById.get(id)).filter(Boolean)
}
