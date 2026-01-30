import { HashRouter, Routes, Route } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import { LogoIcon, LogoFull } from './components/Logo.jsx'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import { useTheme } from './hooks/useTheme'
import StudyMode from './components/StudyMode'
import PracticeMode from './components/PracticeMode'
import ChatMode from './components/ChatMode'
import InterviewMode from './components/InterviewMode'
import Sidebar from './components/Sidebar'

function AppContent() {
  const { setIsMobileOpen, isCollapsed } = useSidebar()
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Row 1: header only */}
      <header className="flex-shrink-0 sticky top-0 z-30 bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm border-b border-transparent dark:border-gray-800">
        <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-6 pr-4 sm:pr-6 md:pr-8 lg:pr-12 py-2 sm:py-2.5 md:py-3 flex items-center gap-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-700 dark:text-gray-200"
            aria-label="打开菜单"
          >
            <Menu className="size-5 shrink-0" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold m-0 flex items-center gap-3 animate-fade-in min-h-[1.5rem] flex-1 min-w-0">
            <span className="sr-only">Shore</span>
            {/* Mobile: icon + brand name */}
            <LogoFull
              className="h-8 sm:h-9 w-auto text-teal-600 dark:text-teal-400 md:hidden shrink-0"
            />
            {/* Desktop: pure icon when collapsed, icon + brand name when expanded */}
            {isCollapsed ? (
              <LogoIcon
                className="hidden md:block size-6 md:size-7 text-teal-600 dark:text-teal-400 shrink-0 h-6 md:h-7"
              />
            ) : (
              <LogoFull
                className="hidden md:block h-8 md:h-10 w-auto text-teal-600 dark:text-teal-400 shrink-0"
              />
            )}
          </h1>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
            aria-label={isDark ? '切换到浅色' : '切换到深色'}
          >
            {isDark ? (
              <Sun className="size-5" aria-hidden />
            ) : (
              <Moon className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </header>

      {/* Row 2: sider + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-4 lg:p-4 xl:p-6 animate-fade-in bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Routes>
            <Route path="/" element={<StudyMode />} />
            <Route path="/study" element={<StudyMode />} />
            <Route path="/practice" element={<PracticeMode />} />
            <Route path="/chat" element={<ChatMode />} />
            <Route path="/interview" element={<InterviewMode />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </HashRouter>
  )
}

export default App
