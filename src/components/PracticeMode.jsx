import { useState, useEffect } from 'react'
import questionsData from '../data/loadData.js'

function QACard({ item, showAnswer, onToggleAnswer }) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <span className="text-xs text-primary font-medium mb-4 block">问答题</span>
        <div className="text-base font-medium text-gray-900 leading-relaxed">{item.question}</div>
      </div>
      
      <button 
        className="bg-primary text-white border-none px-8 py-3 cursor-pointer text-sm font-medium hover:opacity-90"
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      
      {showAnswer && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-gray-900 mb-4 text-sm font-medium">答案</h4>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{item.answer}</div>
        </div>
      )}
    </div>
  )
}

function CodingCard({ item, showAnswer, onToggleAnswer }) {
  const [code, setCode] = useState(item.template || '')
  
  // Reset code when item changes
  useEffect(() => {
    setCode(item.template || '')
  }, [item.id])
  
  return (
    <div className="w-full">
      <div className="mb-8">
        <span className="text-xs text-primary font-medium mb-4 block">编程题</span>
        <div className="text-base font-medium text-gray-900 leading-relaxed mb-3">{item.question}</div>
        {item.description && (
          <div className="text-gray-600 text-sm leading-relaxed mt-3 p-4 bg-gray-50 border-l-2 border-gray-300">{item.description}</div>
        )}
      </div>
      
      <div className="my-6">
        <label className="block font-medium mb-3 text-sm text-gray-900">你的代码</label>
        <textarea
          className="w-full min-h-[200px] p-4 font-mono text-sm leading-relaxed border border-gray-300 resize-y bg-white text-gray-900 focus:outline-none focus:border-primary"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="在这里编写你的代码..."
          spellCheck={false}
        />
      </div>
      
      <button 
        className="bg-primary text-white border-none px-8 py-3 cursor-pointer text-sm font-medium hover:opacity-90"
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      
      {showAnswer && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-gray-900 mb-4 text-sm font-medium">参考答案</h4>
          <pre className="bg-gray-50 border border-gray-200 p-4 overflow-x-auto m-0 font-mono text-sm leading-relaxed text-gray-900"><code>{item.answer}</code></pre>
        </div>
      )}
    </div>
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
        <div className="mb-12">
          <h2 className="mb-3 text-xl font-light text-gray-900">练习模式</h2>
          <p className="text-gray-500 m-0 text-sm">练习面试题，先思考再看答案</p>
        </div>
        <div className="text-center py-16 text-gray-400 text-sm">
          <p>暂无练习题目</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="mb-12">
        <h2 className="mb-3 text-xl font-light text-gray-900">练习模式</h2>
        <p className="text-gray-500 m-0 text-sm">练习面试题，先思考再看答案</p>
      </div>
      
      {/* 题目计数器 */}
      <div className="mb-8 text-sm text-gray-500">
        <span>{currentIndex + 1} / {total}</span>
      </div>
      
      {/* 卡片容器 */}
      <div className="relative">
        <div className="bg-white border border-gray-200 p-12 min-h-[500px]">
          {currentItem && (
            <PracticeCard 
              item={currentItem} 
              showAnswer={showAnswer}
              onToggleAnswer={() => setShowAnswer(!showAnswer)}
            />
          )}
        </div>
        
        {/* 导航按钮 */}
        <div className="flex items-center justify-between mt-8">
          <button
            className="px-8 py-3 border border-gray-300 bg-white text-gray-900 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← 上一题
          </button>
          
          <button
            className="px-8 py-3 border border-gray-300 bg-white text-gray-900 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
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
