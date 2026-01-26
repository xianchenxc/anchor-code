import { useState, useEffect } from 'react'
import questionsData from '../data/loadData.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'

function TreeNode({ node, level = 0, selectedId, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(level < 2)

  const hasChildren = node.children && node.children.length > 0
  const hasItems = node.items && node.items.length > 0
  const isSelected = selectedId === node.id
  const isSelectable = hasItems || (!hasChildren && !hasItems)

  const handleClick = (e) => {
    // Don't handle if clicking on expand icon
    if (e.target.closest('.expand-icon')) {
      return
    }

    e.stopPropagation()

    // Priority 1: If node has items, select it to show content (don't toggle expand)
    if (hasItems && onSelect) {
      onSelect(node)
      return
    }

    // Priority 2: If node has children but no items, toggle expand only
    if (hasChildren && !hasItems) {
      setIsExpanded(!isExpanded)
      return
    }

    // Priority 3: Leaf node (no children, no items) - select it
    if (!hasChildren && !hasItems && onSelect) {
      onSelect(node)
    }
  }

  // Handle expand/collapse separately for nodes with both children and items
  const handleExpandClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="mb-1">
      <div
        className={`
          flex items-center px-4 py-2.5 select-none rounded-xl transition-all duration-200
          ${isSelected
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg scale-[1.02]'
            : isSelectable || hasItems
              ? 'cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-md hover:scale-[1.01]'
              : hasChildren
                ? 'cursor-pointer hover:bg-gray-50 hover:shadow-sm'
                : 'cursor-default'
          }
        `}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
      >
        {hasChildren ? (
          <span
            className="expand-icon mr-3 text-sm shrink-0 cursor-pointer flex items-center justify-center w-5 h-5 rounded hover:bg-white/20 transition-colors"
            onClick={handleExpandClick}
            onMouseDown={(e) => e.stopPropagation()}
            title={isExpanded ? '折叠' : '展开'}
          >
            {isExpanded ? '−' : '+'}
          </span>
        ) : (
          <span className="mr-3 text-sm shrink-0 w-4 h-4 flex items-center justify-center text-gray-400">·</span>
        )}
        <span className={`flex-1 truncate text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
          {node.name || node.title}
        </span>
      </div>

      {isExpanded && hasChildren && node.children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function ContentView({ node }) {
  if (!node) {
    return (
      <div className="flex items-center justify-center py-16 sm:py-24 md:py-32">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4 opacity-20">📚</div>
          <p className="text-sm text-gray-400">请从左侧选择一个节点查看内容</p>
        </div>
      </div>
    )
  }

  const hasItems = node.items && node.items.length > 0
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 p-6 sm:p-8 md:p-10 animate-slide-up">
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200/60">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 m-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {node.name || node.title}
        </h2>
      </div>

      {hasItems ? (
        <div className="text-gray-700 flex flex-col gap-8 sm:gap-10 md:gap-12">
          {node.items.map((item, index) => (
            <div 
              key={item.id} 
              className="border-l-4 border-indigo-500 pl-6 sm:pl-8 md:pl-10 py-4 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-transparent rounded-r-xl shadow-sm animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">{item.title}</h3>
              {item.content ? (
                <MarkdownRenderer content={item.content} />
              ) : (
                <p className="text-gray-400">暂无内容</p>
              )}
            </div>
          ))}
        </div>
      ) : hasChildren ? (
        <div className="text-gray-700 py-8 sm:py-10 md:py-12">
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm">该分类包含以下子分类：</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 sm:mb-10 md:mb-12">
            {node.children.map(child => (
              <div 
                key={child.id} 
                className="p-4 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200/60 hover:border-indigo-400 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              >
                <span className="text-sm text-gray-700 font-semibold">{child.name}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm">请从左侧选择具体的子分类查看内容</p>
        </div>
      ) : (
        <div className="text-center py-12 sm:py-14 md:py-16">
          <div className="text-4xl mb-4 opacity-20">📝</div>
          <p className="text-gray-400 text-sm">该节点暂无内容</p>
        </div>
      )}
    </div>
  )
}

function StudyMode() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSidebarOpen && window.innerWidth < 768) {
        const sidebar = document.querySelector('.sidebar-mobile')
        if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
          setIsSidebarOpen(false)
        }
      }
    }

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSidebarOpen])

  // Close sidebar when selecting a node on mobile
  const handleNodeSelect = (node) => {
    setSelectedNode(node)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              学习模式
            </h2>
            <p className="text-gray-600 m-0 text-sm sm:text-base">按分类树形结构浏览知识点</p>
          </div>
          <button
            className="sidebar-toggle md:hidden px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div className="flex gap-6 md:gap-8 flex-col md:flex-row items-start">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div 
          className={`
            sidebar-mobile
            w-full md:w-80 md:min-w-[280px] md:max-w-[320px] 
            flex-shrink-0 
            bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60
            p-4 md:p-6
            overflow-y-auto
            fixed md:sticky
            top-0 md:top-4
            left-0
            h-full md:h-auto
            z-50 md:z-auto
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            md:transform-none
            max-h-screen md:max-h-[calc(100vh-2rem)]
          `}
        >
          <div className="space-y-1">
            {questionsData.categories.map(category => (
              <TreeNode
                key={category.id}
                node={category}
                selectedId={selectedNode?.id}
                onSelect={handleNodeSelect}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 w-full md:min-w-[400px]">
          <ContentView node={selectedNode} />
        </div>
      </div>
    </div>
  )
}

export default StudyMode
