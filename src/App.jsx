import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import StudyMode from './components/StudyMode'
import PracticeMode from './components/PracticeMode'
import ChatMode from './components/ChatMode'
import InterviewMode from './components/InterviewMode'

function NavLink({ to, children }) {
  const location = useLocation()
  // In HashRouter, use pathname instead of hash
  // Default route '/' should activate '/study'
  const isActive = location.pathname === to || (to === '/study' && location.pathname === '/')

  return (
    <Link
      to={to}
      className={`text-white no-underline px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${isActive ? 'opacity-100 font-semibold' : 'opacity-80 hover:opacity-100'}`}
    >
      {children}
    </Link>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white">
        <header className="sticky top-0 z-50 bg-primary text-white px-4 sm:px-8 md:px-12 py-3 sm:py-4 border-b border-primary/20 shadow-sm">
          <h1 className="text-lg sm:text-xl font-light m-0 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🎯</span>
            <span>Anchor Code</span>
          </h1>
            <nav className="flex gap-3 sm:gap-6">
              <NavLink to="/study">📚 学习模式</NavLink>
              <NavLink to="/practice">💪 练习模式</NavLink>
              <NavLink to="/chat">💬 聊天学习</NavLink>
              <NavLink to="/interview">🎯 模拟面试</NavLink>
            </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<StudyMode />} />
            <Route path="/study" element={<StudyMode />} />
            <Route path="/practice" element={<PracticeMode />} />
            <Route path="/chat" element={<ChatMode />} />
            <Route path="/interview" element={<InterviewMode />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
