import { useState, useEffect } from 'react'
import questionsData from '../data/loadData.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'

function QACard({ item, showAnswer, onToggleAnswer }) {
  return (
    <>
      <div className="mb-8">
        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold rounded-full mb-4 shadow-sm">
          问答题
        </span>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-relaxed mb-6">
          {item.question}
        </div>
      </div>
      
      <button 
        className="w-full sm:w-auto mb-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      
      {showAnswer && (
        <div className="mt-8 pt-8 border-t border-gray-200/60 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
            <h4 className="text-gray-900 text-lg font-bold">答案</h4>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-6 border border-gray-200/60 shadow-sm">
            <MarkdownRenderer content={item.content} />
          </div>
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
      <div className="mb-8">
        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold rounded-full mb-4 shadow-sm">
          编程题
        </span>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-relaxed mb-4">
          {item.question}
        </div>
        {item.description && (
          <div className="text-gray-600 text-sm leading-relaxed mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
            <MarkdownRenderer 
              content={item.description} 
              components={{
                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              }}
            />
          </div>
        )}
      </div>
      
      <div className="my-6">
        <label className="block font-bold mb-3 text-sm sm:text-base text-gray-900">你的代码</label>
        <textarea
          className="w-full min-h-[200px] sm:min-h-[250px] p-4 font-mono text-sm leading-relaxed resize-y bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="在这里编写你的代码..."
          spellCheck={false}
        />
      </div>
      
      <button 
        className="w-full sm:w-auto mb-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      
      {showAnswer && (
        <div className="mt-8 pt-8 border-t border-gray-200/60 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
            <h4 className="text-gray-900 text-lg font-bold">参考答案</h4>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl p-6 border border-gray-200/60 shadow-sm">
            <MarkdownRenderer content={item.content} />
          </div>
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
          <h2 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            练习模式
          </h2>
          <p className="text-gray-600 m-0 text-sm sm:text-base">练习面试题，先思考再看答案</p>
        </div>
        <div className="text-center py-12 sm:py-14 md:py-16">
          <div className="text-6xl mb-4 opacity-20">📝</div>
          <p className="text-gray-400 text-sm sm:text-base">暂无练习题目</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h2 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          练习模式
        </h2>
        <p className="text-gray-600 m-0 text-sm sm:text-base">练习面试题，先思考再看答案</p>
      </div>
      
      {/* 题目计数器 */}
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
          <span className="text-sm sm:text-base font-semibold text-indigo-700">
            {currentIndex + 1} / {total}
          </span>
        </div>
      </div>
      
      {/* 卡片容器 */}
      <div className="relative">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[400px] sm:min-h-[500px] animate-slide-up">
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
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 text-sm sm:text-base font-semibold hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← 上一题
          </button>
          
          <button
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 text-sm sm:text-base font-semibold hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
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
