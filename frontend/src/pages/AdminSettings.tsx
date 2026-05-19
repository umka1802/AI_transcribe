import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '../api/admin'
import type { Setting } from '../types'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const load = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (settingId: number) => {
    try {
      await updateSetting(settingId, editValue)
      toast.success('Setting updated')
      setEditing(null)
      load()
    } catch {
      toast.error('Failed to update setting')
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>
      <p className="text-sm text-gray-500 mb-4">
        Manage global system settings. Changes take effect immediately.
      </p>

      <div className="bg-white rounded-xl border overflow-hidden">
        {settings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No settings configured. Default values are used automatically.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Key</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Value</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {settings.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{s.key}</td>
                  <td className="px-4 py-3">
                    {editing === s.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border rounded px-2 py-1 w-full text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-700 max-w-xs truncate block">{s.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.description ?? '-'}</td>
                  <td className="px-4 py-3">
                    {editing === s.id ? (
                      <div className="space-x-2">
                        <button onClick={() => handleSave(s.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Save</button>
                        <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditing(s.id); setEditValue(s.value) }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
