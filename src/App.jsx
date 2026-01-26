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
      className={`
        relative no-underline px-4 sm:px-5 py-2.5 text-sm font-semibold 
        transition-all duration-300 rounded-xl
        ${isActive 
          ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg scale-105' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:scale-105'
        }
      `}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold m-0 flex items-center gap-3 animate-fade-in">
                  <span className="text-2xl sm:text-3xl md:text-4xl bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    🎯
                  </span>
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Anchor Code
                  </span>
                </h1>
              </div>
              <nav className="flex gap-2 sm:gap-3 flex-wrap">
                <NavLink to="/study">📚 学习模式</NavLink>
                <NavLink to="/practice">💪 练习模式</NavLink>
                <NavLink to="/chat">💬 聊天学习</NavLink>
                <NavLink to="/interview">🎯 模拟面试</NavLink>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 max-w-7xl w-full mx-auto animate-fade-in">
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
