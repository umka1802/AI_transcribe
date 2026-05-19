import { useState, useEffect } from 'react'
import { getUsers, updateUser, deleteUser } from '../api/admin'
import type { User } from '../types'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      toast.success(`User ${user.is_active ? 'disabled' : 'enabled'}`)
      load()
    } catch {
      toast.error('Failed to update user')
    }
  }

  const toggleAdmin = async (user: User) => {
    try {
      await updateUser(user.id, { is_admin: !user.is_admin })
      toast.success(`Admin status toggled`)
      load()
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user and all their data?')) return
    try {
      await deleteUser(userId)
      toast.success('User deleted')
      load()
    } catch {
      toast.error('Failed to delete user')
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Username</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Active</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Admin</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tasks</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(u)} className={`px-2 py-1 rounded text-xs font-medium ${
                    u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{u.is_active ? 'Active' : 'Disabled'}</button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAdmin(u)} className={`px-2 py-1 rounded text-xs font-medium ${
                    u.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                  }`}>{u.is_admin ? 'Admin' : 'User'}</button>
                </td>
                <td className="px-4 py-3">{u.total_transcriptions}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
