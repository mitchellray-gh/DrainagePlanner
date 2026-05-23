import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react'
import { uploadFiles } from '../lib/api'

const PHOTO_TYPES = [
  { value: 'site', label: 'General Site' },
  { value: 'problem_area', label: 'Problem Area / Ponding' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'downspout', label: 'Downspout/Gutter' },
  { value: 'slope', label: 'Slope/Grade' },
  { value: 'drain_existing', label: 'Existing Drain' },
  { value: 'structure', label: 'Structure' },
  { value: 'landscape', label: 'Landscaping' },
]

export default function Photos({ currentProject, showNotification }) {
  const [photos, setPhotos] = useState(currentProject?.photos || [])
  const [uploading, setUploading] = useState(false)
  const [photoType, setPhotoType] = useState('site')
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef(null)

  if (!currentProject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="text-5xl mb-4">📸</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Project Selected</h2>
        <p className="text-slate-500">Create or select a project first.</p>
      </motion.div>
    )
  }

  const handleFiles = async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      const data = await uploadFiles(`/api/photos/upload/${currentProject.id}`, files, { type: photoType })
      if (data.success) {
        setPhotos(prev => [...prev, ...(data.photos || [])])
        showNotification(`${files.length} photo(s) uploaded!`, 'success')
      } else {
        showNotification('Upload failed: ' + (data.error || 'Unknown'), 'error')
      }
    } catch (err) {
      showNotification('Upload error: ' + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Site Photos</h1>

      {/* Upload zone */}
      <div className="section-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <select value={photoType} onChange={e => setPhotoType(e.target.value)} className="input-field sm:w-48">
            {PHOTO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200
            ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}
          `}
        >
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
                <Upload size={24} className="text-brand-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-700">{uploading ? 'Uploading...' : 'Drop photos here or click to browse'}</p>
              <p className="text-sm text-slate-400 mt-1">Supports JPG, PNG, HEIC, WebP · GPS EXIF data extracted</p>
            </div>
          </div>
          <input
            ref={fileInput} type="file" multiple accept="image/*"
            onChange={(e) => handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, i) => (
            <div key={photo.id || i} className="glass-card overflow-hidden group">
              <div className="aspect-square bg-slate-100 relative">
                <img
                  src={photo.thumbnail_url || photo.url || `/uploads/${photo.filename}`}
                  alt={photo.description || 'Site photo'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = ''; e.target.className = 'hidden' }}
                />
                {!photo.url && !photo.filename && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon size={32} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-slate-700 truncate">{photo.description || photo.type || 'Photo'}</p>
                <p className="text-xs text-slate-400 capitalize">{photo.type?.replace('_', ' ') || ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="text-center py-8 text-slate-400">
          <Camera size={40} className="mx-auto mb-3 opacity-40" />
          <p>No photos uploaded yet</p>
        </div>
      )}
    </motion.div>
  )
}
