import { useState, useEffect } from 'react'
import { getAllTasks, getTaskStats, retryTask, adminDeleteTask } from '../api/admin'
import type { Task, TaskStats } from '../types'
import toast from 'react-hot-toast'

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [taskData, statsData] = await Promise.all([
        getAllTasks(filter || undefined),
        getTaskStats(),
      ])
      setTasks(taskData)
      setStats(statsData)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const handleRetry = async (taskId: number) => {
    try {
      await retryTask(taskId)
      toast.success('Task queued for retry')
      load()
    } catch {
      toast.error('Failed to retry')
    }
  }

  const handleDelete = async (taskId: number) => {
    if (!confirm('Delete this task?')) return
    try {
      await adminDeleteTask(taskId)
      toast.success('Task deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Task Management</h1>

      {stats && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {Object.entries(stats.by_status).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 capitalize">{status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="error">Error</option>
        </select>
        <span className="ml-2 text-sm text-gray-500">{tasks.length} tasks</span>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Filename</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Size</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{t.id}</td>
                <td className="px-4 py-3">{t.user_id}</td>
                <td className="px-4 py-3 max-w-[200px] truncate font-medium">{t.original_filename}</td>
                <td className="px-4 py-3 text-gray-500">{formatSize(t.file_size)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.status === 'completed' ? 'bg-green-100 text-green-800' :
                    t.status === 'error' ? 'bg-red-100 text-red-800' :
                    t.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{t.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 space-x-2">
                  {t.status === 'error' && (
                    <button onClick={() => handleRetry(t.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Retry</button>
                  )}
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
