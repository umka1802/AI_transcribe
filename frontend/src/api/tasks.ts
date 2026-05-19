import api from './client'
import type { Task, TaskList } from '../types'

export async function uploadAudio(file: File, language = 'auto'): Promise<{ task_id: number }> {
  const form = new FormData()
  form.append('file', file)
  form.append('language', language)
  const { data } = await api.post('/transcription/upload', form)
  return data
}

export async function startTranscription(taskId: number): Promise<{ task_id: number; status: string }> {
  const { data } = await api.post(`/transcription/${taskId}/transcribe`)
  return data
}

export async function getTasks(page = 1, size = 20): Promise<TaskList> {
  const { data } = await api.get('/transcription/tasks', { params: { page, size } })
  return data
}

export async function getTask(taskId: number): Promise<Task> {
  const { data } = await api.get(`/transcription/tasks/${taskId}`)
  return data
}

export async function deleteTask(taskId: number): Promise<void> {
  await api.delete(`/transcription/tasks/${taskId}`)
}

export function getExportUrl(taskId: number, format: string): string {
  const token = localStorage.getItem('token')
  const base = import.meta.env.VITE_API_URL || '/api'
  return `${base}/export/${taskId}/${format}?token=${token}`
}
