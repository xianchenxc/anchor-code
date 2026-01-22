import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import StudyMode from './components/StudyMode'
import PracticeMode from './components/PracticeMode'

function NavLink({ to, children }) {
  const location = useLocation()
  const isActive = location.hash === `#${to}` || (to === '/study' && location.hash === '#/')

  return (
    <Link
      to={to}
      className={`text-white no-underline px-6 py-2 font-medium ${isActive ? 'border-b-2 border-white' : 'opacity-80 hover:opacity-100'}`}
    >
      {children}
    </Link>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white">
        <header className="bg-primary text-white px-12 py-8 border-b border-primary/20">
          <h1 className="text-2xl font-light mb-6">Anchor Code</h1>
          <nav className="flex gap-8">
            <NavLink to="/study">学习模式</NavLink>
            <NavLink to="/practice">练习模式</NavLink>
          </nav>
        </header>

        <main className="flex-1 p-12 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<StudyMode />} />
            <Route path="/study" element={<StudyMode />} />
            <Route path="/practice" element={<PracticeMode />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
