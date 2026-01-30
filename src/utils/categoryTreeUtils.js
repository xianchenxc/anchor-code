/**
 * Pure helpers for category tree (breadcrumb path, first node with content, siblings).
 * No React or UI dependencies.
 */

/**
 * Find the path from root to target node.
 * @param {Array} nodes - Category tree
 * @param {string} targetId - Target node id
 * @param {Array} path - Current path (for recursion)
 * @returns {Array|null} Path array or null if not found
 */
export function findNodePath(nodes, targetId, path = []) {
  if (!nodes || !Array.isArray(nodes)) return null

  for (const node of nodes) {
    const currentPath = [...path, node]
    if (node.id === targetId) return currentPath
    if (node.children?.length > 0) {
      const found = findNodePath(node.children, targetId, currentPath)
      if (found) return found
    }
  }
  return null
}

/**
 * Get siblings of a node at the given breadcrumb index.
 * @param {Array} path - Breadcrumb path
 * @param {number} index - Index of node in path
 * @param {Array} categories - All top-level categories (for index 0)
 * @returns {Array} Sibling nodes
 */
export function getBreadcrumbSiblings(path, index, categories) {
  if (index === 0) return categories || []
  const parent = path[index - 1]
  return parent?.children || []
}

/**
 * Find first node that has content (itemIds) in tree order.
 * @param {Array} nodes - Category tree
 * @returns {Object|null} First node with itemIds, or null
 */
export function findFirstNodeWithContent(nodes) {
  if (!nodes || !Array.isArray(nodes)) return null
  for (const node of nodes) {
    if (node.itemIds?.length > 0) return node
    if (node.children?.length > 0) {
      const found = findFirstNodeWithContent(node.children)
      if (found) return found
    }
  }
  return null
}
