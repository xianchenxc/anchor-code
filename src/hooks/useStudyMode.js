import { useState, useEffect } from 'react'
import serverService from '../services/serverService.js'
import { findNodePath, findFirstNodeWithContent } from '../utils/categoryTreeUtils.js'

/**
 * Data and handlers for Study Mode: categories, selected node, items, breadcrumb path.
 * UI-agnostic; used by StudyMode component.
 */
export function useStudyMode() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeItems, setNodeItems] = useState([])
  const [breadcrumbPath, setBreadcrumbPath] = useState([])

  useEffect(() => {
    serverService
      .getCategories()
      .then((cats) => {
        setCategories(cats)
        const first = findFirstNodeWithContent(cats.filter((cat) => cat.itemIds?.length > 0))
        if (first) setSelectedNode(first)
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedNode?.id) {
      setNodeItems([])
      setBreadcrumbPath([])
      return
    }
    const path = findNodePath(categories, selectedNode.id)
    setBreadcrumbPath(path || [])

    if (!path) {
      setNodeItems([])
      return
    }

    serverService
      .getQuestionsByCategoryId(selectedNode.id, ['knowledge'])
      .then(setNodeItems)
      .catch(() => setNodeItems([]))
  }, [selectedNode?.id, categories])

  const handleNodeSelect = (node) => setSelectedNode(node)
  return {
    categories,
    loading,
    selectedNode,
    nodeItems,
    breadcrumbPath,
    handleNodeSelect,
  }
}
