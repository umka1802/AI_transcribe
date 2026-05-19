import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Mic, FileText, LogOut, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Mic className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">AI Transcriber</span>
              </Link>
              <div className="hidden md:flex ml-10 space-x-4">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  <FileText className="inline h-4 w-4 mr-1" />Tasks
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {user?.is_admin && (
                <Link to="/admin" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  location.pathname.startsWith('/admin') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  <Shield className="h-4 w-4 mr-1" />Admin
                </Link>
              )}
              <span className="text-sm text-gray-500">{user?.username}</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-500">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded text-sm">Tasks</Link>
            {user?.is_admin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded text-sm">Admin Panel</Link>
            )}
            <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block px-3 py-2 rounded text-sm text-red-600">Logout</button>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
