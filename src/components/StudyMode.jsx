import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import questionsData from '../data/loadData.js'

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
    <div className="mb-0.5">
      <div
        className={`
          flex items-center px-4 py-3 select-none
          ${isSelected
            ? 'bg-primary text-white font-medium'
            : isSelectable || hasItems
              ? 'cursor-pointer hover:bg-gray-50'
              : hasChildren
                ? 'cursor-pointer hover:bg-gray-50'
                : 'cursor-default'
          }
        `}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
      >
        {hasChildren ? (
          <span
            className="expand-icon mr-3 text-sm shrink-0 cursor-pointer flex items-center justify-center w-4 h-4"
            onClick={handleExpandClick}
            onMouseDown={(e) => e.stopPropagation()}
            title={isExpanded ? '折叠' : '展开'}
          >
            {isExpanded ? '−' : '+'}
          </span>
        ) : (
          <span className="mr-3 text-sm shrink-0 w-4 h-4 flex items-center justify-center">·</span>
        )}
        <span className={`flex-1 truncate text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
          {node.name || node.title}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-1">
          {hasChildren && node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ContentView({ node }) {
  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">请从左侧选择一个节点查看内容</p>
      </div>
    )
  }

  const hasItems = node.items && node.items.length > 0
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="bg-white h-full">
      <div className="mb-12 pb-8 border-b border-gray-200">
        <h2 className="text-2xl font-light text-gray-900 m-0 inline">{node.name || node.title}</h2>
      </div>

      <div className="text-gray-700">
        {hasItems ? (
          <div className="flex flex-col gap-12">
            {node.items.map(item => (
              <div key={item.id} className="border-l-2 border-primary pl-8">
                <h3 className="text-lg font-medium mb-6 text-gray-900">{item.title}</h3>
                <div className="text-gray-700 leading-relaxed text-sm prose prose-sm max-w-none">
                  {item.content ? (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        strong: ({ node, children, ...props }) => (
                          <strong className="font-semibold text-gray-900" {...props}>
                            {children}
                          </strong>
                        ),
                        code: ({ node, inline, className, children, ...props }) => {
                          // Determine if this is a code block:
                          // 1. inline is explicitly false
                          // 2. className contains 'language-' (from fenced code blocks)
                          // 3. children is a string containing newlines
                          const childrenStr = typeof children === 'string' ? children : String(children || '');
                          const hasNewlines = childrenStr.includes('\n');
                          const isCodeBlock = inline === false || (className && className.includes('language-')) || hasNewlines;
                          
                          if (isCodeBlock) {
                            return <code className={`block bg-gray-50 p-4 rounded overflow-x-auto text-sm font-mono ${className || ''}`} {...props}>{children}</code>;
                          }
                          // All other cases: render as inline code
                          return <code className={`bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 inline ${className || ''}`} {...props}>{children}</code>;
                        },
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900" {...props} />,
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400">暂无内容</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : hasChildren ? (
          <div className="py-12">
            <p className="text-gray-600 mb-8 text-sm">该分类包含以下子分类：</p>
            <ul className="list-none p-0 m-0 mb-12 flex flex-col gap-2">
              {node.children.map(child => (
                <li key={child.id} className="py-3 flex items-center gap-3 text-sm text-gray-700">
                  <span>{child.name}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-500 text-sm">请从左侧选择具体的子分类查看内容</p>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">
            <p>该节点暂无内容</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StudyMode() {
  const [selectedNode, setSelectedNode] = useState(null)

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-12">
        <h2 className="mb-3 text-xl font-light text-gray-900">学习模式</h2>
        <p className="text-gray-500 m-0 text-sm">按分类树形结构浏览知识点</p>
      </div>

      <div className="flex gap-12 flex-1 min-h-0 flex-row">
        <div className="w-72 min-w-[240px] max-w-[280px] flex-shrink-0">
          <div className="bg-white border-r border-gray-200 h-full overflow-y-auto pr-6">
            {questionsData.categories.map(category => (
              <TreeNode
                key={category.id}
                node={category}
                selectedId={selectedNode?.id}
                onSelect={setSelectedNode}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[400px] overflow-y-auto">
          <ContentView node={selectedNode} />
        </div>
      </div>
    </div>
  )
}

export default StudyMode
