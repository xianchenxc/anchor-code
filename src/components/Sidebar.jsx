import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  Wrench,
  Target,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { useSidebar } from '../contexts/SidebarContext'

/**
 * Sidebar navigation component with collapsible groups
 * Shows Dashboard (Study, Practice) and Tools (Interview) sections
 */
export default function Sidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const location = useLocation()

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname, setIsMobileOpen])

  const isActive = (path) => {
    return location.pathname === path || (path === '/study' && location.pathname === '/')
  }

  const menuItems = [
    {
      group: 'Dashboard',
      Icon: LayoutDashboard,
      items: [
        { path: '/study', Icon: BookOpen, label: '学习模式' },
        { path: '/practice', Icon: Dumbbell, label: '练习模式' }
      ]
    },
    {
      group: 'Tools',
      Icon: Wrench,
      items: [
        { path: '/interview', Icon: Target, label: '模拟面试' }
      ]
    }
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-x-0 top-0 w-full max-h-[85vh] min-h-0
          md:inset-auto md:top-auto md:max-h-none md:min-h-0
          md:relative md:left-0 md:right-auto md:flex-shrink-0 md:h-full
          z-40
          bg-white dark:bg-gray-900 md:bg-transparent md:dark:bg-transparent
          transition-transform duration-300 ease-in-out flex flex-col
          md:transition-all
          ${isCollapsed ? 'md:w-16' : 'md:w-56'}
          ${isMobileOpen ? 'translate-y-0' : '-translate-y-full md:translate-y-0 md:translate-x-0'}
        `}
      >
      {/* Mobile close button */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/60 dark:border-gray-700 flex items-center justify-end md:hidden">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
          aria-label="关闭侧边栏"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Menu items - flex-1 so toggle button stays at bottom */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            {!isCollapsed && (
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${active
                        ? 'bg-teal-50 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : ''}
                  >
                    <item.Icon className="size-5 flex-shrink-0" strokeWidth={2.5} />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Toggle button at bottom */}
      <div className="flex-shrink-0 py-2 px-2 flex items-center justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-colors hidden md:flex items-center justify-center"
          aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>
    </aside>
    </>
  )
}

