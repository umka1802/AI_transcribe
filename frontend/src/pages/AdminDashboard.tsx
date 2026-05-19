import { useState, useEffect } from 'react'
import { getDashboard } from '../api/admin'
import type { DashboardStats } from '../types'
import { Users, ListTodo, CheckCircle, XCircle, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (!stats) return <div className="text-red-500">Failed to load dashboard</div>

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Tasks', value: stats.total_tasks, icon: ListTodo, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completed', value: stats.completed_tasks, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Failed', value: stats.failed_tasks, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-gray-400" /> Recent Tasks
          </h2>
          {stats.recent_tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No recent tasks</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[200px]">{t.filename}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.status === 'completed' ? 'bg-green-100 text-green-800' :
                    t.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-gray-400" /> Recent Logs
          </h2>
          {stats.recent_logs.length === 0 ? (
            <p className="text-sm text-gray-500">No recent logs</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{l.action}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    l.level === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>{l.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
