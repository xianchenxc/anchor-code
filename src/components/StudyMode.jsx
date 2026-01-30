import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, ChevronRight } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer.jsx'
import { useStudyMode } from '../hooks/useStudyMode.js'
import { getBreadcrumbSiblings } from '../utils/categoryTreeUtils.js'

const POPOVER_SHOW_DELAY_MS = 200
const POPOVER_HIDE_DELAY_MS = 150

function ContentView({ node, items = [], onSelectChild }) {
  if (!node) {
    return (
      <div className="flex items-center justify-center min-h-[200px] py-12">
        <div className="text-center animate-fade-in">
          <BookOpen className="size-12 mb-3 mx-auto text-gray-300" strokeWidth={1.5} />
          <p className="text-sm text-gray-400 dark:text-gray-500">请从面包屑导航选择分类查看内容</p>
        </div>
      </div>
    )
  }

  const hasItems = items.length > 0
  const hasChildren = node.children?.length > 0

  if (hasChildren && !hasItems) {
    return (
      <div className="flex flex-col py-6 sm:py-8 animate-fade-in">
        <p className="text-gray-500 text-sm mb-4">请选择子分类以查看内容</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 w-full">
          {node.children.map((child) => (
            <button
              key={child.id}
              onClick={() => onSelectChild?.(child)}
              className="p-3 sm:p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:shadow transition-all cursor-pointer text-left"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {child.name || child.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-4 sm:p-6 md:p-8 animate-slide-up min-h-0">
      {hasItems ? (
        <>
          <div className="text-gray-700 dark:text-gray-300 flex flex-col gap-5 sm:gap-6 md:gap-7">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="border-l-4 border-teal-500 dark:border-teal-400 pl-4 sm:pl-6 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                {item.content ? (
                  <MarkdownRenderer content={item.content} />
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">暂无内容</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-gray-700">
            <Link
              to="/practice"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl px-4 py-2.5 border border-teal-200/80 dark:border-teal-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/30 transition-all"
            >
              去练习巩固 →
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-10">
          <FileText className="size-10 mb-3 mx-auto text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-400 dark:text-gray-500 text-sm">该节点暂无内容</p>
        </div>
      )}
    </div>
  )
}

function SiblingPopover({ siblings, selectedId, onSelect, onClose }) {
  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm py-1.5 min-w-[120px] animate-fade-in">
      {siblings.map((sibling) => {
        const isSelected = sibling.id === selectedId
        return (
          <button
            key={sibling.id}
            onClick={() => {
              onSelect(sibling)
              onClose?.()
            }}
            type="button"
            className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
              isSelected ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {sibling.name || sibling.title}
          </button>
        )
      })}
    </div>
  )
}

function Breadcrumb({ path, onSelect, categories, selectedId }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const hoverTimeoutRef = useRef(null)

  const scheduleShow = (index) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => setHoveredIndex(index), POPOVER_SHOW_DELAY_MS)
  }

  const scheduleHide = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => setHoveredIndex(null), POPOVER_HIDE_DELAY_MS)
  }

  useEffect(() => () => clearTimeout(hoverTimeoutRef.current), [])

  if (!path?.length) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap relative" aria-label="面包屑导航">
      {path.map((node, index) => {
        const isLast = index === path.length - 1
        const siblings = getBreadcrumbSiblings(path, index, categories)
        const showPopover = hoveredIndex === index && siblings.length > 1
        const hasSiblings = siblings.length > 1

        return (
          <div key={node.id} className="flex items-center gap-1.5 relative">
            {index > 0 && (
              <ChevronRight className="size-3.5 text-gray-400 dark:text-gray-500 shrink-0" strokeWidth={2} />
            )}
            <div
              className="relative"
              onMouseEnter={() => hasSiblings && scheduleShow(index)}
              onMouseLeave={hasSiblings ? scheduleHide : undefined}
            >
              {isLast && hasSiblings ? (
                <>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-md transition-all duration-200 text-sm relative z-10 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-current="page"
                  >
                    {node.name || node.title}
                  </button>
                  {showPopover && (
                    <SiblingPopover
                      siblings={siblings}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onClose={() => setHoveredIndex(null)}
                    />
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => !isLast && onSelect(node)}
                    className={`px-2.5 py-1 rounded-md transition-all duration-200 text-sm relative z-10 ${
                      isLast
                        ? 'text-gray-900 dark:text-gray-100 font-semibold cursor-default'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer'
                    }`}
                    disabled={isLast}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {node.name || node.title}
                  </button>
                  {showPopover && (
                    <SiblingPopover
                      siblings={siblings}
                      selectedId={node.id}
                      onSelect={onSelect}
                      onClose={() => setHoveredIndex(null)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function StudyModeLoading() {
  return (
    <div className="flex items-center justify-center min-h-[160px] py-10">
      <div className="text-center animate-fade-in">
        <BookOpen className="size-12 mb-2 mx-auto text-gray-300 animate-pulse" strokeWidth={1.5} />
        <p className="text-sm text-gray-400 dark:text-gray-500">加载中...</p>
      </div>
    </div>
  )
}

function StudyModeCategoryGrid({ categories, onSelect }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-4 sm:p-6 animate-slide-up">
      <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
        选择分类
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category)}
            className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/80 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-sm transition-all cursor-pointer text-left"
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
              {category.name || category.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StudyMode() {
  const {
    categories,
    loading,
    selectedNode,
    nodeItems,
    breadcrumbPath,
    handleNodeSelect,
    handleBreadcrumbSelect,
  } = useStudyMode()

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      <header className="flex-shrink-0 mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">学习模式</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm m-0 mt-1">按分类浏览知识点，打好基础</p>
      </header>
      {breadcrumbPath.length > 0 && (
        <div className="flex-shrink-0 mb-2 sm:mb-3">
          <Breadcrumb
            path={breadcrumbPath}
            onSelect={handleBreadcrumbSelect}
            categories={categories}
            selectedId={selectedNode?.id}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <StudyModeLoading />
        ) : !selectedNode && categories.length > 0 ? (
          <StudyModeCategoryGrid categories={categories} onSelect={handleNodeSelect} />
        ) : (
          <ContentView
            node={selectedNode}
            items={nodeItems}
            onSelectChild={handleNodeSelect}
          />
        )}
      </div>
    </div>
  )
}
