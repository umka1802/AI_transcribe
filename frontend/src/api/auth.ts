import api from './client'
import type { User } from '../types'

export async function login(username: string, password: string): Promise<string> {
  const { data } = await api.post('/auth/login', { username, password })
  return data.access_token
}

export async function register(email: string, username: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/register', { email, username, password })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return data
}
