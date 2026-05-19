import { useState, useEffect } from 'react'
import { getLogs } from '../api/admin'
import type { LogEntry } from '../types'

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getLogs(level || undefined)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [level])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Logs</h1>

      <div className="mb-4">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          <option value="INFO">INFO</option>
          <option value="ERROR">ERROR</option>
          <option value="WARNING">WARNING</option>
        </select>
        <span className="ml-2 text-sm text-gray-500">{logs.length} entries</span>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Level</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No logs found</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      l.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                      l.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{l.level}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{l.action}</td>
                  <td className="px-4 py-3 text-gray-500">{l.user_id ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{l.details ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
