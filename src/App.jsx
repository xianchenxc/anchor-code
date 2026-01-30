import { HashRouter, Routes, Route } from 'react-router-dom'
import { Menu, Target } from 'lucide-react'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import StudyMode from './components/StudyMode'
import PracticeMode from './components/PracticeMode'
import ChatMode from './components/ChatMode'
import InterviewMode from './components/InterviewMode'
import Sidebar from './components/Sidebar'

function AppContent() {
  const { setIsMobileOpen, isCollapsed } = useSidebar()

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Row 1: header only */}
      <header className="flex-shrink-0 sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-6 pr-4 sm:pr-6 md:pr-8 lg:pr-12 py-4 sm:py-5 flex items-center gap-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            aria-label="打开菜单"
          >
            <Menu className="size-6 shrink-0" />
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold m-0 flex items-center gap-3 animate-fade-in min-h-[1.5rem]">
            {/* Mobile: always show logo + name */}
            <Target className="size-8 sm:size-9 md:size-10 text-indigo-600 lg:hidden shrink-0" strokeWidth={2.5} />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent lg:hidden">
              Anchor Code
            </span>
            {/* Desktop: show logo when collapsed (same size as menu icon), name when expanded */}
            {isCollapsed ? (
              <Target className="hidden lg:block size-6 text-indigo-600 shrink-0" strokeWidth={2.5} />
            ) : (
              <span className="hidden lg:inline bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Anchor Code
              </span>
            )}
          </h1>
        </div>
      </header>

      {/* Row 2: sider + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12 animate-fade-in">
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
