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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-[81px] h-[calc(100vh-81px)]
          lg:relative lg:top-auto lg:h-full lg:flex-shrink-0
          z-40 bg-white/90 backdrop-blur-xl border-r border-gray-200/60 shadow-xl
          transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? 'w-16' : 'w-64'}
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
      {/* Mobile close button */}
      <div className="p-4 border-b border-gray-200/60 flex items-center justify-end lg:hidden">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="关闭侧边栏"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            {!isCollapsed && (
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
      <div className="p-4 border-t border-gray-200/60 flex items-center justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            p-2 rounded-lg hover:bg-gray-100 transition-colors
            hidden lg:block
          `}
          aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>
      </div>
    </aside>
    </>
  )
}

