import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ListTodo, ScrollText, Settings, ArrowLeft } from 'lucide-react'

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/admin/logs', icon: ScrollText, label: 'Logs' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout() {
  const location = useLocation()

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to app
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(item) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10 flex justify-around p-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center px-2 py-1 text-xs ${
              isActive(item) ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <item.icon className="h-5 w-5 mb-1" />
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
