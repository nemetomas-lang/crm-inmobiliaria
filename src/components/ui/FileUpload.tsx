'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, X, ExternalLink, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'

export type BucketName =
  | 'property-photos'
  | 'property-videos'
  | 'property-contracts'
  | 'property-documents'
  | 'garante-recibos'

interface FileUploadProps {
  bucket: BucketName
  // For single-file fields: pass current url + setter
  value?: string | null
  onChange?: (url: string | null) => void
  // For multi-file fields: pass current urls + setter
  values?: string[]
  onChangeMulti?: (urls: string[]) => void
  accept?: string
  label?: string
  // Folder path (e.g. property id) inside the bucket
  folder?: string
  multiple?: boolean
}

const PUBLIC_BUCKETS: BucketName[] = ['property-photos', 'property-videos']

async function getDisplayUrl(bucket: BucketName, path: string): Promise<string> {
  const supabase = createClient()
  if (PUBLIC_BUCKETS.includes(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? ''
}

export function FileUpload({
  bucket,
  value,
  onChange,
  values,
  onChangeMulti,
  accept,
  label,
  folder = '',
  multiple = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)

    const supabase = createClient()
    const uploadedUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const safeName = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9-_]/g, '_')
          .slice(0, 40)
        const path = `${folder ? folder + '/' : ''}${Date.now()}-${safeName}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: false, contentType: file.type })

        if (uploadErr) throw uploadErr

        // For public buckets we store the public URL; for private buckets we
        // store the storage path (the consumer calls createSignedUrl to view).
        const stored = PUBLIC_BUCKETS.includes(bucket)
          ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
          : path
        uploadedUrls.push(stored)
      }

      if (multiple && onChangeMulti) {
        onChangeMulti([...(values ?? []), ...uploadedUrls])
      } else if (onChange) {
        onChange(uploadedUrls[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeSingle = () => onChange?.(null)
  const removeAt = (idx: number) => {
    if (!onChangeMulti || !values) return
    onChangeMulti(values.filter((_, i) => i !== idx))
  }

  const isImage = bucket === 'property-photos'
  const isVideo = bucket === 'property-videos'

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wide">{label}</label>}

      {/* Existing files preview */}
      {multiple && values && values.length > 0 && (
        <div className={`grid gap-2 ${isImage ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1'}`}>
          {values.map((url, idx) => (
            <FilePreview key={idx} bucket={bucket} path={url} onRemove={() => removeAt(idx)} variant={isImage ? 'image' : isVideo ? 'video' : 'file'} />
          ))}
        </div>
      )}
      {!multiple && value && (
        <FilePreview bucket={bucket} path={value} onRemove={removeSingle} variant={isImage ? 'image' : isVideo ? 'video' : 'file'} />
      )}

      {/* Upload trigger */}
      {(multiple || !value) && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id={`file-upload-${bucket}-${folder}`}
          />
          <label
            htmlFor={`file-upload-${bucket}-${folder}`}
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm text-ink-3 cursor-pointer hover:border-orange hover:text-orange transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Upload size={16} />
            {uploading ? 'Subiendo...' : multiple ? 'Agregar archivos' : 'Subir archivo'}
          </label>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function FilePreview({ bucket, path, onRemove, variant }: { bucket: BucketName; path: string; onRemove: () => void; variant: 'image' | 'video' | 'file' }) {
  const [displayUrl, setDisplayUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // For public buckets, `path` is already a full URL we can render directly.
  // For private buckets we need to mint a signed URL.
  useEffect(() => {
    let alive = true
    if (PUBLIC_BUCKETS.includes(bucket)) {
      setDisplayUrl(path)
      setLoading(false)
    } else {
      getDisplayUrl(bucket, path).then((url) => {
        if (!alive) return
        setDisplayUrl(url)
        setLoading(false)
      })
    }
    return () => {
      alive = false
    }
  }, [bucket, path])

  if (variant === 'image') {
    return (
      <div className="relative group aspect-square rounded-xl overflow-hidden bg-surface border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {displayUrl && <img src={displayUrl} alt="" className="w-full h-full object-cover" />}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/80 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Eliminar"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  if (variant === 'video') {
    return (
      <div className="flex items-center gap-3 p-3 border border-border rounded-xl bg-surface">
        <div className="w-10 h-10 rounded-lg bg-orange-soft text-orange grid place-items-center flex-shrink-0">
          <VideoIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink truncate">{path.split('/').pop()}</p>
        </div>
        {displayUrl && (
          <a href={displayUrl} target="_blank" rel="noreferrer" className="text-ink-3 hover:text-orange">
            <ExternalLink size={16} />
          </a>
        )}
        <button type="button" onClick={onRemove} className="text-ink-3 hover:text-red-600">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-xl bg-surface">
      <div className="w-10 h-10 rounded-lg bg-orange-soft text-orange grid place-items-center flex-shrink-0">
        <FileText size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink truncate">{path.split('/').pop()}</p>
        <p className="text-xs text-ink-3">{loading ? 'Generando link...' : displayUrl ? 'Listo' : 'Archivo'}</p>
      </div>
      {displayUrl && (
        <a href={displayUrl} target="_blank" rel="noreferrer" className="text-ink-3 hover:text-orange" aria-label="Abrir">
          <ExternalLink size={16} />
        </a>
      )}
      <button type="button" onClick={onRemove} className="text-ink-3 hover:text-red-600" aria-label="Eliminar">
        <X size={16} />
      </button>
    </div>
  )
}

// Helper for non-React contexts that need to resolve a signed URL on the fly.
export { getDisplayUrl }

// Use ImageIcon to keep tree-shaking happy if someone imports it from this module
export const _ImageIcon = ImageIcon
