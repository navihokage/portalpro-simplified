'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/files/file-uploader'
import { Plus, FileText, Download, Trash2, Folder, ChevronRight } from 'lucide-react'

export default function FilesPage() {
  const [portals, setPortals] = useState<any[]>([])
  const [selectedPortal, setSelectedPortal] = useState<string>('')
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userProfile } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single()

      if (userProfile?.account_id) {
        // Load portals
        const { data: portalsData } = await supabase
          .from('portals')
          .select('id, name')
          .eq('account_id', userProfile.account_id)
          .order('name')

        if (portalsData) {
          setPortals(portalsData)
          const portalId = searchParams.get('portal') || portalsData[0]?.id || ''
          setSelectedPortal(portalId)
        }
      }
      
      setLoading(false)
    }

    loadData()
  }, [searchParams, supabase])

  useEffect(() => {
    if (selectedPortal) {
      loadFiles()
    }
  }, [selectedPortal, currentFolder])

  async function loadFiles() {
    const { data: filesData } = await supabase
      .from('files')
      .select('*, uploaded_by:users(name)')
      .eq('portal_id', selectedPortal)
      .eq('folder_id', currentFolder || null)
      .order('created_at', { ascending: false })

    if (filesData) {
      setFiles(filesData)
    }

    // Load folders
    const { data: foldersData } = await supabase
      .from('folders')
      .select('*')
      .eq('portal_id', selectedPortal)
      .eq('parent_id', currentFolder || null)
      .order('name')

    if (foldersData) {
      setFolders(foldersData)
    }
  }

  async function downloadFile(file: any) {
    const { data } = await supabase.storage
      .from('portal-files')
      .download(file.storage_path)

    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  async function deleteFile(file: any) {
    if (!confirm('Are you sure you want to delete this file?')) return

    await supabase.storage
      .from('portal-files')
      .remove([file.storage_path])

    await supabase
      .from('files')
      .delete()
      .eq('id', file.id)

    loadFiles()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (portals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portals yet</h3>
          <p className="text-gray-500 mb-4">
            Create a portal before uploading files.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage files for your clients.
          </p>
        </div>
        <div className="flex gap-4">
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={selectedPortal}
            onChange={(e) => {
              setSelectedPortal(e.target.value)
              setCurrentFolder(null)
            }}
          >
            {portals.map((portal) => (
              <option key={portal.id} value={portal.id}>
                {portal.name}
              </option>
            ))}
          </select>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowUploader(true)}
          >
            Upload Files
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="mb-4 flex items-center text-sm">
          <button
            onClick={() => setCurrentFolder(null)}
            className="text-blue-600 hover:underline"
          >
            Files
          </button>
          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          <span className="text-gray-600">Current Folder</span>
        </div>
      )}

      {/* Upload modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload files to {portals.find(p => p.id === selectedPortal)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                portalId={selectedPortal}
                folderId={currentFolder || undefined}
                onUploadComplete={() => {
                  setShowUploader(false)
                  loadFiles()
                }}
              />
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" onClick={() => setShowUploader(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Folders and Files */}
      <div className="space-y-4">
        {/* Folders */}
        {folders.map((folder) => (
          <Card key={folder.id} className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentFolder(folder.id)}
          >
            <CardContent className="flex items-center p-4">
              <Folder className="h-8 w-8 text-blue-600 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{folder.name}</p>
                <p className="text-sm text-gray-500">Folder</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        ))}

        {/* Files */}
        {files.map((file) => (
          <Card key={file.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • Uploaded by {file.uploaded_by?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(file)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFile(file)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {files.length === 0 && folders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
              <p className="text-gray-500 mb-4">
                Upload files to share with your clients.
              </p>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowUploader(true)}
              >
                Upload Files
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}