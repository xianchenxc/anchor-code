import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer.jsx'
import MasteryStatusControl from './MasteryStatusControl.jsx'
import { useStudyMode } from '../hooks/useStudyMode.js'
import { useStudyMastery } from '../hooks/useStudyMastery.js'

function KnowledgeCard({ item, index, showRecallHint }) {
  const { masteryLevels, getMastery, setMastery } = useStudyMastery()
  const [expanded, setExpanded] = useState(false)

  const mastery = getMastery(item.id)

  const handleSetMastery = (level) => {
    setMastery(item.id, level)
  }

  const difficultyLabel = item.difficulty ? { basic: '基础', advanced: '进阶', hard: '困难' }[item.difficulty] : null
  const frequencyLabel = item.frequency ? { high: '高频', medium: '中频', low: '低频' }[item.frequency] : null
  const hasMeta = !!(difficultyLabel || frequencyLabel)

  return (
    <article
      className="pl-4 sm:pl-6 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <header
        className="flex items-start justify-between gap-2 mb-2 sm:mb-3 cursor-pointer group"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-1.5 text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
            {item.title}
          </h3>
          {hasMeta && (
            <div className="space-y-0.5">
              <div className="flex flex-wrap gap-1 mt-1">
                {difficultyLabel && (
                  <span className="inline-flex px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-[10px] text-gray-600 dark:text-gray-300">
                    {difficultyLabel}
                  </span>
                )}
                {frequencyLabel && (
                  <span className="inline-flex px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-[10px] text-gray-600 dark:text-gray-300">
                    {frequencyLabel}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <MasteryStatusControl
          mastery={mastery}
          masteryLevels={masteryLevels}
          onChange={handleSetMastery}
        />
      </header>

      {showRecallHint && !expanded && (
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
          先根据标题在脑中组织一下你的回答，再展开下方内容对照讲解。
        </div>
      )}

      {expanded ? (
        <div className="mt-2 text-gray-700 dark:text-gray-200">
          {item.content ? (
            <MarkdownRenderer content={item.content} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">暂无内容</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200"
        >
          展开内容查看讲解
        </button>
      )}
    </article>
  )
}

function ContentView({ node, items = [], onSelectChild }) {
  if (!node) {
    return (
      <div className="flex items-center justify-center min-h-[200px] py-12">
        <div className="text-center animate-fade-in">
          <BookOpen className="size-12 mb-3 mx-auto text-gray-300" strokeWidth={1.5} />
          <p className="text-sm text-gray-400 dark:text-gray-500">请先从左侧分类中选择要学习的内容</p>
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
              <KnowledgeCard
                key={item.id}
                item={item}
                index={index}
                showRecallHint={index === 0}
              />
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 m-0">
                这部分知识点看完了？试试在「练习模式」里用题目检查一下掌握情况。
              </p>
              <Link
                to="/practice"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl px-3 sm:px-4 py-2 border border-teal-200/80 dark:border-teal-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/30 transition-all"
              >
                用题目检查掌握情况
              </Link>
            </div>
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

function StudyModeCategoryGrid({ categories, onSelect, getNodeStats }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-4 sm:p-6 animate-slide-up">
      <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
        选择分类
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        从这里选择一个方向开始学习，之后可在「练习模式」和「模拟面试」里做强化。
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        {categories.map((category) => {
          const stats = getNodeStats(category.id, category.items || [])
          const learned = stats.mastered + stats.vague
          const hasProgress = stats.total > 0 && learned > 0

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category)}
              className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/80 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-sm transition-all cursor-pointer text-left flex flex-col gap-1.5"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {category.name || category.title}
              </span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-[10px] font-medium text-gray-600 dark:text-gray-200">
                  基础 · 高频
                </span>
                {hasProgress && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-300">
                    已学习 {learned}/{stats.total}
                  </span>
                )}
              </div>
            </button>
          )
        })}
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
  } = useStudyMode()
  const { getNodeStats, getMastery, masteryLevels } = useStudyMastery()
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'weak'

  const hasSelectedNodeWithItems = !!selectedNode && Array.isArray(nodeItems) && nodeItems.length > 0

  // Filter items in focus mode
  const filteredItems = hasSelectedNodeWithItems
    ? nodeItems.filter((item) => {
        if (filterMode === 'all') return true
        const level = getMastery(item.id)
        // 薄弱：未标记 / 模糊 / 不会
        return !level || level === masteryLevels.VAGUE || level === masteryLevels.UNKNOWN
      })
    : []

  const totalCards = filteredItems.length
  const safeIndex = totalCards > 0 ? Math.min(currentIndex, totalCards - 1) : 0
  const currentItem = totalCards > 0 ? filteredItems[safeIndex] : null

  const currentNodeStats = hasSelectedNodeWithItems
    ? getNodeStats(selectedNode.id, nodeItems)
    : { total: 0, mastered: 0, vague: 0, unknown: 0 }

  const learnedCount = currentNodeStats.mastered + currentNodeStats.vague
  const progressPercent =
    currentNodeStats.total > 0 ? Math.min(100, (learnedCount / currentNodeStats.total) * 100) : 0
  const roundedPercent = currentNodeStats.total > 0 ? Math.round(progressPercent) : 0
  const topCategoryName = breadcrumbPath[0]?.name || breadcrumbPath[0]?.title || ''

  // Reset focus index when切换分类或过滤模式
  useEffect(() => {
    setCurrentIndex(0)
    setSessionCompleted(false)
  }, [selectedNode?.id, filterMode, nodeItems.length])

  const handlePrevCard = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1)
    }
  }

  const handleNextCard = () => {
    if (safeIndex < totalCards - 1) {
      setCurrentIndex(safeIndex + 1)
    } else if (totalCards > 0) {
      setSessionCompleted(true)
    }
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      <header className="flex-shrink-0 mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">学习模式</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm m-0 mt-1">按分类浏览知识点，打好基础</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm m-0 mt-1">
          建议先在这里系统梳理知识点，后续可用「练习模式」和「模拟面试」检验掌握情况。
        </p>
      </header>
      {categories.length > 1 && (
        <div className="flex-shrink-0 mb-2 sm:mb-3 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-max">
            {categories.map((category) => {
              const isActive =
                breadcrumbPath[0]?.id === category.id ||
                (!breadcrumbPath.length && selectedNode?.id === category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleNodeSelect(category)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] sm:text-xs whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-transparent hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300'
                  }`}
                >
                  {category.name || category.title}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {hasSelectedNodeWithItems && (
        <div className="flex-shrink-0 mb-2 sm:mb-3 px-0.5 sm:px-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="m-0 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              {(topCategoryName || '当前分类') + ' 学习进度：已标记 '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {learnedCount}/{currentNodeStats.total}
              </span>
              {' 个知识点'}
              {currentNodeStats.total > 0 && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  （约 {roundedPercent}%）
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200/80 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
      {sessionCompleted && hasSelectedNodeWithItems && (
        <div className="flex-shrink-0 mb-2 sm:mb-3 px-0.5 sm:px-1">
          <div className="rounded-lg border border-amber-200/80 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-900/20 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
            <p className="m-0 text-amber-900 dark:text-amber-100">
              本分类共 {currentNodeStats.total} 个知识点，其中{' '}
              {currentNodeStats.total - learnedCount} 个尚未标记为“会说/有点模糊”。
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('weak')
                  setCurrentIndex(0)
                  setSessionCompleted(false)
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium border border-amber-300 bg-white/90 text-amber-800 hover:bg-amber-50 transition-colors"
              >
                只看薄弱知识点再过一遍
              </button>
              <Link
                to="/practice"
                className="px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium border border-teal-300 bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                去练习模式刷相关题目
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <StudyModeLoading />
        ) : !selectedNode && categories.length > 0 ? (
          <StudyModeCategoryGrid
            categories={categories}
            onSelect={handleNodeSelect}
            getNodeStats={getNodeStats}
          />
        ) : hasSelectedNodeWithItems && currentItem ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 px-0.5 sm:px-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-1 rounded-full text-[11px] sm:text-xs border ${
                    filterMode === 'all'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 dark:hover:border-teal-500'
                  }`}
                >
                  全部
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('weak')}
                  className={`px-2 py-1 rounded-full text-[11px] sm:text-xs border ${
                    filterMode === 'weak'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-500'
                  }`}
                >
                  只看薄弱
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  disabled={safeIndex === 0}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-[11px] sm:text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed hover:border-teal-300 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                  aria-label="上一张卡片"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <div className="inline-flex items-center text-[11px] sm:text-xs text-gray-700 dark:text-gray-200">
                  <input
                    type="number"
                    min={1}
                    max={totalCards}
                    value={safeIndex + 1}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (Number.isNaN(v)) return
                      const target = Math.min(Math.max(v - 1, 0), totalCards - 1)
                      setCurrentIndex(target)
                      setSessionCompleted(false)
                    }}
                    className="w-10 px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none"
                    aria-label="当前卡片序号"
                  />
                  <span className="mx-0.5 text-gray-400 dark:text-gray-500">/</span>
                  <span>{totalCards}</span>
                </div>
                <button
                  type="button"
                  onClick={handleNextCard}
                  disabled={safeIndex === totalCards - 1}
                  className="p-1.5 rounded-lg border border-teal-300 bg-teal-600 text-[11px] sm:text-xs text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="下一张卡片"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-4 sm:p-6 md:p-8 animate-slide-up min-h-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <KnowledgeCard item={currentItem} index={0} showRecallHint />
              </div>
              <div className="mt-2 pt-3 border-t border-gray-200/60 dark:border-gray-700">
                <div className="flex flex-row items-center justify-between gap-3 flex-nowrap">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 m-0">
                    这一张标完了吗？感觉还不稳可以多刷几次；如果已经比较熟练，可以去「练习模式」用题目再验证一遍。
                  </p>
                  <Link
                    to="/practice"
                    className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl px-3 sm:px-4 py-2 border border-teal-200/80 dark:border-teal-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/30 transition-all whitespace-nowrap"
                  >
                    去练习
                  </Link>
                </div>
              </div>
            </div>
          </>
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
