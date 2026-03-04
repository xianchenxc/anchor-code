import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function MasteryStatusControl({ mastery, masteryLevels, onChange }) {
  const [showMenu, setShowMenu] = useState(false)

  const renderMasteryLabel = () => {
    if (mastery === masteryLevels.MASTERED) return '掌握'
    if (mastery === masteryLevels.VAGUE) return '有点模糊'
    if (mastery === masteryLevels.UNKNOWN) return '不会'
    return '未标记'
  }

  const masteryPillClass =
    mastery === masteryLevels.MASTERED
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : mastery === masteryLevels.VAGUE
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : mastery === masteryLevels.UNKNOWN
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-gray-50 text-gray-500 border-gray-200'

  const handleSelect = (level) => {
    onChange(level)
    setShowMenu(false)
  }

  return (
    <div className="relative flex flex-col items-end gap-1.5 pr-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu((prev) => !prev)
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] sm:text-xs ${masteryPillClass}`}
      >
        <span>{renderMasteryLabel()}</span>
        <ChevronDown
          className={`size-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            showMenu ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>
      {showMenu && (
        <div
          className="absolute z-10 mt-1 w-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 text-[11px] sm:text-xs text-gray-700 dark:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleSelect(masteryLevels.MASTERED)}
            className={`block w-full px-3 py-1 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ${
              mastery === masteryLevels.MASTERED ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''
            }`}
          >
            掌握
          </button>
          <button
            type="button"
            onClick={() => handleSelect(masteryLevels.VAGUE)}
            className={`block w-full px-3 py-1 text-left hover:bg-amber-50 dark:hover:bg-amber-900/30 ${
              mastery === masteryLevels.VAGUE ? 'text-amber-700 dark:text-amber-300 font-medium' : ''
            }`}
          >
            有点模糊
          </button>
          <button
            type="button"
            onClick={() => handleSelect(masteryLevels.UNKNOWN)}
            className={`block w-full px-3 py-1 text-left hover:bg-rose-50 dark:hover:bg-rose-900/30 ${
              mastery === masteryLevels.UNKNOWN ? 'text-rose-700 dark:text-rose-300 font-medium' : ''
            }`}
          >
            不会
          </button>
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`block w-full px-3 py-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !mastery ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            清除标记
          </button>
        </div>
      )}
    </div>
  )
}

export default MasteryStatusControl

