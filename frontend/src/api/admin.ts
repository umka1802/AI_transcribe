import api from './client'
import type { User, Task, LogEntry, Setting, DashboardStats, TaskStats } from '../types'

export async function createUser(email: string, username: string, password: string): Promise<User> {
  const { data } = await api.post('/admin/users', { email, username, password })
  return data
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get('/admin/users')
  return data
}

export async function getUser(userId: number): Promise<User> {
  const { data } = await api.get(`/admin/users/${userId}`)
  return data
}

export async function updateUser(userId: number, updates: Partial<User>): Promise<User> {
  const { data } = await api.patch(`/admin/users/${userId}`, updates)
  return data
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`)
}

export async function getAllTasks(status?: string): Promise<Task[]> {
  const params = status ? { status } : {}
  const { data } = await api.get('/admin/tasks', { params })
  return data
}

export async function getTaskStats(): Promise<TaskStats> {
  const { data } = await api.get('/admin/tasks/stats')
  return data
}

export async function retryTask(taskId: number): Promise<void> {
  await api.post(`/admin/tasks/${taskId}/retry`)
}

export async function adminDeleteTask(taskId: number): Promise<void> {
  await api.delete(`/admin/tasks/${taskId}`)
}

export async function getLogs(level?: string): Promise<LogEntry[]> {
  const params = level ? { level } : {}
  const { data } = await api.get('/admin/logs', { params })
  return data
}

export async function getSettings(): Promise<Setting[]> {
  const { data } = await api.get('/admin/settings')
  return data
}

export async function updateSetting(settingId: number, value: string): Promise<Setting> {
  const { data } = await api.put(`/admin/settings/${settingId}`, { value })
  return data
}

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await api.get('/admin/dashboard')
  return data
}
