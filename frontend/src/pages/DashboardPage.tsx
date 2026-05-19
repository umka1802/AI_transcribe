import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { uploadAudio, startTranscription, getTasks, deleteTask } from '../api/tasks'
import type { Task, TaskList } from '../types'
import { Upload, File, Trash2, Play, Download, Clock, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  uploaded: <Clock className="h-5 w-5 text-yellow-500" />,
  processing: <Loader className="h-5 w-5 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
}

const STATUS_LABELS: Record<string, string> = {
  uploaded: 'Uploaded',
  processing: 'Processing',
  completed: 'Completed',
  error: 'Error',
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()
  const pageSize = 20

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks(page, pageSize)
      setTasks(data.items)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadTasks() }, [loadTasks])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    setUploading(true)
    try {
      const file = acceptedFiles[0]
      const result = await uploadAudio(file)
      toast.success('File uploaded')
      await startTranscription(result.task_id)
      loadTasks()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [loadTasks])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(taskId)
      toast.success('Task deleted')
      loadTasks()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const getExportUrl = (taskId: number, format: string) => {
    const token = localStorage.getItem('token')
    return `/api/export/${taskId}/${format}?token=${token}`
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } ${uploading ? 'opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg font-medium text-gray-700">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop file here' : 'Drop audio file or click to upload'}
        </p>
        <p className="mt-1 text-sm text-gray-500">MP3, WAV, M4A, OGG, AAC, FLAC (max 500 MB)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Transcription Tasks</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <File className="mx-auto h-12 w-12 mb-2" />
            <p>No tasks yet. Upload an audio file to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {STATUS_ICONS[task.status] || <AlertCircle className="h-5 w-5 text-gray-400" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.original_filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatSize(task.file_size)} · {task.file_format} · {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'error' ? 'bg-red-100 text-red-800' :
                    task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                  {task.status === 'completed' && (
                    <>
                      <button onClick={() => navigate(`/tasks/${task.id}`)} className="text-blue-600 hover:text-blue-800">
                        <Play className="h-4 w-4" />
                      </button>
                      <a href={getExportUrl(task.id, 'txt')} download className="text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </a>
                    </>
                  )}
                  <button onClick={() => handleDelete(task.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t flex justify-between items-center">
            <span className="text-sm text-gray-500">{total} total tasks</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
