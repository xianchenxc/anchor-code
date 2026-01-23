import { useState, useEffect } from 'react'
import questionsData from '../data/loadData.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'

function QACard({ item, showAnswer, onToggleAnswer }) {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <span className="text-xs text-primary font-medium mb-3 sm:mb-4 block">问答题</span>
        <div className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">{item.question}</div>
      </div>
      
      <button 
        className="bg-primary text-white border-none px-6 sm:px-8 py-2.5 sm:py-3 cursor-pointer text-xs sm:text-sm font-medium hover:opacity-90 w-full sm:w-auto"
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      
      {showAnswer && (
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <h4 className="text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm font-medium">答案</h4>
          <MarkdownRenderer content={item.content} />
        </div>
      )}
    </>
  )
}

function CodingCard({ item, showAnswer, onToggleAnswer }) {
  const [code, setCode] = useState(item.template || '')
  
  // Reset code when item changes
  useEffect(() => {
    setCode(item.template || '')
  }, [item.id])
  
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <span className="text-xs text-primary font-medium mb-3 sm:mb-4 block">编程题</span>
        <div className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed mb-2 sm:mb-3">{item.question}</div>
        {item.description && (
          <div className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2 sm:mt-3 p-3 sm:p-4 bg-gray-50 border-l-2 border-gray-300">
            <MarkdownRenderer 
              content={item.description} 
              components={{
                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              }}
            />
          </div>
        )}
      </div>
      
      <div className="my-4 sm:my-6">
        <label className="block font-medium mb-2 sm:mb-3 text-xs sm:text-sm text-gray-900">你的代码</label>
        <textarea
          className="w-full min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed border border-gray-300 resize-y bg-white text-gray-900 focus:outline-none focus:border-primary"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="在这里编写你的代码..."
          spellCheck={false}
        />
      </div>
      
      <button 
        className="bg-primary text-white border-none px-6 sm:px-8 py-2.5 sm:py-3 cursor-pointer text-xs sm:text-sm font-medium hover:opacity-90 w-full sm:w-auto"
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      
      {showAnswer && (
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <h4 className="text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm font-medium">参考答案</h4>
          <MarkdownRenderer content={item.content} />
        </div>
      )}
    </>
  )
}

function PracticeCard({ item, showAnswer, onToggleAnswer }) {
  if (item.type === 'qa') {
    return <QACard item={item} showAnswer={showAnswer} onToggleAnswer={onToggleAnswer} />
  } else if (item.type === 'coding') {
    return <CodingCard item={item} showAnswer={showAnswer} onToggleAnswer={onToggleAnswer} />
  }
  return null
}

function PracticeMode() {
  // 收集所有练习题目
  const collectPracticeItems = (node) => {
    let items = []
    if (node.type === 'practice' && node.items) {
      items = node.items
    }
    if (node.children) {
      node.children.forEach(child => {
        items = items.concat(collectPracticeItems(child))
      })
    }
    return items
  }
  
  const allItems = questionsData.categories.reduce((acc, category) => {
    return acc.concat(collectPracticeItems(category))
  }, [])
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  
  const currentItem = allItems[currentIndex]
  const total = allItems.length
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }
  
  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
  }
  
  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
        setShowAnswer(false)
      } else if (e.key === 'ArrowRight' && currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, total])
  
  if (total === 0) {
    return (
      <div className="w-full">
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h2 className="mb-2 sm:mb-3 text-lg sm:text-xl font-light text-gray-900">练习模式</h2>
          <p className="text-gray-500 m-0 text-xs sm:text-sm">练习面试题，先思考再看答案</p>
        </div>
        <div className="text-center py-12 sm:py-14 md:py-16 text-gray-400 text-xs sm:text-sm">
          <p>暂无练习题目</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h2 className="mb-2 sm:mb-3 text-lg sm:text-xl font-light text-gray-900">练习模式</h2>
        <p className="text-gray-500 m-0 text-xs sm:text-sm">练习面试题，先思考再看答案</p>
      </div>
      
      {/* 题目计数器 */}
      <div className="mb-6 sm:mb-8 text-xs sm:text-sm text-gray-500">
        {currentIndex + 1} / {total}
      </div>
      
      {/* 卡片容器 */}
      <div className="relative">
        <div className="bg-white border border-gray-200 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[400px] sm:min-h-[500px]">
          {currentItem && (
            <PracticeCard 
              item={currentItem} 
              showAnswer={showAnswer}
              onToggleAnswer={() => setShowAnswer(!showAnswer)}
            />
          )}
        </div>
        
        {/* 导航按钮 */}
        <div className="flex items-center justify-between mt-6 sm:mt-8 gap-3 sm:gap-4">
          <button
            className="flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← 上一题
          </button>
          
          <button
            className="flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleNext}
            disabled={currentIndex === total - 1}
          >
            下一题 →
          </button>
        </div>
      </div>
    </div>
  )
}

export default PracticeMode
