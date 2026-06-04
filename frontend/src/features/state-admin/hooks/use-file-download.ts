import { useCallback, useRef, useState } from 'react'

interface UseFileDownloadOptions {
  getDownloadUrl: () => Promise<string> | string
  filename: string | (() => string)
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

interface UseFileDownloadReturn {
  download: () => Promise<void>
  isDownloading: boolean
}

const VALID_CONTENT_TYPES = ['text/csv', 'application/csv', 'application/octet-stream']
const MAX_FILE_SIZE = 50 * 1024 * 1024

export function useFileDownload(options: UseFileDownloadOptions): UseFileDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const download = useCallback(async () => {
    setIsDownloading(true)
    try {
      const url = await optionsRef.current.getDownloadUrl()
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`Download failed: ${res.status}`)

      const contentType = res.headers.get('content-type') ?? ''
      const isValidType = VALID_CONTENT_TYPES.some((type) => contentType.includes(type))
      if (!isValidType) throw new Error(`Unexpected file type: ${contentType}`)

      const contentLength = parseInt(res.headers.get('content-length') ?? '', 10)
      if (!isNaN(contentLength) && contentLength > MAX_FILE_SIZE)
        throw new Error('File exceeds 50 MB limit')

      const blob = await res.blob()
      if (blob.size > MAX_FILE_SIZE) throw new Error('File exceeds 50 MB limit')

      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const { filename } = optionsRef.current
      a.download = typeof filename === 'function' ? filename() : filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)

      optionsRef.current.onSuccess?.()
    } catch (error) {
      optionsRef.current.onError?.(error)
      throw error
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return { download, isDownloading }
}
