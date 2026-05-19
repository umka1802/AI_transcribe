import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTask } from '../api/tasks'
import type { Task } from '../types'
import { ArrowLeft, Download, FileText, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    getTask(Number(id))
      .then(setTask)
      .catch(() => toast.error('Failed to load task'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopy = async () => {
    if (!task?.result_text) return
    try {
      await navigator.clipboard.writeText(task.result_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const getExportUrl = (taskId: number, format: string) => {
    const token = localStorage.getItem('token')
    return `/api/export/${taskId}/${format}?token=${token}`
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!task) {
    return <div className="text-center py-12 text-gray-500">Task not found</div>
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tasks
      </button>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{task.original_filename}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Size:</span>
            <p className="font-medium">{formatSize(task.file_size)}</p>
          </div>
          <div>
            <span className="text-gray-500">Format:</span>
            <p className="font-medium">{task.file_format}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <p className={`font-medium ${
              task.status === 'completed' ? 'text-green-600' :
              task.status === 'error' ? 'text-red-600' : 'text-blue-600'
            }`}>{task.status}</p>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>
            <p className="font-medium">{new Date(task.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {task.status === 'completed' && task.result_text && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" /> Transcription Result
            </h2>
            <div className="flex space-x-2">
              <button onClick={handleCopy} className="flex items-center px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a href={getExportUrl(task.id, 'txt')} download className="flex items-center px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-1" /> TXT
              </a>
              <a href={getExportUrl(task.id, 'docx')} download className="flex items-center px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-1" /> DOCX
              </a>
              <a href={getExportUrl(task.id, 'pdf')} download className="flex items-center px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-1" /> PDF
              </a>
              <a href={getExportUrl(task.id, 'srt')} download className="flex items-center px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-1" /> SRT
              </a>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
            {task.result_text}
          </div>
        </div>
      )}

      {task.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 text-sm">{task.error_message || 'Unknown error'}</p>
        </div>
      )}

      {task.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-blue-600">Processing transcription...</p>
        </div>
      )}
    </div>
  )
}
