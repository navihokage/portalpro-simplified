'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase'
import { Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface FileUploaderProps {
  portalId: string
  folderId?: string
  onUploadComplete?: () => void
}

export function FileUploader({ portalId, folderId, onUploadComplete }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const file of files) {
        // Generate unique file path
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${portalId}/${folderId || 'root'}/${timestamp}_${safeName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('portal-files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create file record in database
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            name: file.name,
            mime_type: file.type,
            size: file.size,
            storage_path: filePath,
            portal_id: portalId,
            folder_id: folderId || null,
            uploaded_by_id: user.id,
          })

        if (dbError) throw dbError
      }

      setFiles([])
      onUploadComplete?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-gray-600">Drop the files here...</p>
        ) : (
          <>
            <p className="text-gray-600">Drag & drop files here, or click to select</p>
            <p className="text-sm text-gray-500 mt-1">You can upload multiple files at once</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Files to upload:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={uploading}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ))}
          
          <div className="flex gap-2 pt-2">
            <Button
              onClick={uploadFiles}
              isLoading={uploading}
              disabled={uploading}
            >
              Upload {files.length} file{files.length > 1 ? 's' : ''}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}