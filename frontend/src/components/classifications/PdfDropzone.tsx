'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'

interface PdfDropzoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  error: string | null
}

export function PdfDropzone({ onFileSelect, selectedFile, error }: PdfDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  // State-based colors
  let borderColor = '#D1D5DB'
  let bgColor = '#F9FAFB'
  if (isDragActive) {
    borderColor = '#1D4ED8'
    bgColor = '#EFF6FF'
  } else if (selectedFile && !error) {
    borderColor = '#16A34A'
    bgColor = '#F0FFF4'
  } else if (error) {
    borderColor = '#DC2626'
    bgColor = '#FEF2F2'
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer select-none"
      style={{ height: '180px', background: bgColor, transition: 'background 0.15s ease' }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragActive(true)
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Drop PDF here or press Enter to browse"
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
    >
      {/* SVG animated dashed border — UI-SPEC §Dropzone Animated Dashed Border */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="7"
          ry="7"
          fill="none"
          stroke={borderColor}
          strokeWidth={isDragActive ? 2 : 1.5}
          strokeDasharray={isDragActive ? '8 6' : selectedFile && !error ? '0' : '6 4'}
          style={
            isDragActive
              ? { animation: 'dash-flow 0.8s linear infinite' }
              : { transition: 'stroke 0.15s ease' }
          }
        />
      </svg>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center h-full gap-2" style={{ zIndex: 2 }}>
        {error ? (
          <>
            <AlertCircle className="w-8 h-8 text-[#DC2626]" aria-hidden="true" />
            <p className="text-[14px] text-[#DC2626] text-center px-4">{error}</p>
          </>
        ) : selectedFile ? (
          <>
            <CheckCircle2 className="w-8 h-8 text-[#16A34A]" aria-hidden="true" />
            <p className="text-[14px] text-gray-700 dark:text-gray-200 font-medium">{selectedFile.name}</p>
            <p className="text-[12px] text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </>
        ) : (
          <>
            <Upload
              className={`w-8 h-8 ${isDragActive ? 'text-[#1D4ED8]' : 'text-gray-400'}`}
              aria-hidden="true"
            />
            <p className="text-[14px] text-gray-500 dark:text-gray-400">
              {isDragActive ? (
                'Drop your PDF here'
              ) : (
                <>
                  Drop your PDF here, or{' '}
                  <span className="text-[#1D4ED8] dark:text-[#3B82F6] underline">Browse</span>
                </>
              )}
            </p>
            <p className="text-[12px] text-gray-400">PDF files only · Max 50MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleChange}
        aria-label="Select PDF file"
        tabIndex={-1}
      />
    </div>
  )
}
