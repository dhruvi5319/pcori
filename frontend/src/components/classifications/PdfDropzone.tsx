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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }, [onFileSelect])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  // Determine border color based on state
  let borderColor = '#D1D5DB'   // default gray dashed
  let bgColor = '#F9FAFB'
  if (isDragActive) { borderColor = '#1D4ED8'; bgColor = '#EFF6FF' }
  if (selectedFile && !error) { borderColor = '#16A34A'; bgColor = '#F0FFF4' }
  if (error) { borderColor = '#DC2626'; bgColor = '#FEF2F2' }

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer"
      style={{ height: '180px', background: bgColor }}
      onDragOver={e => { e.preventDefault(); setIsDragActive(true) }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Drop PDF here or press Enter to browse"
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
    >
      {/* SVG animated dashed border — UI-SPEC §Dropzone Animated Dashed Border */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none dropzone-border-svg" style={{ zIndex: 1 }}>
        <rect
          x="1" y="1"
          width="calc(100% - 2)" height="calc(100% - 2)"
          rx="7" ry="7"
          fill="none"
          stroke={borderColor}
          strokeWidth={isDragActive ? 2 : 1.5}
          strokeDasharray={isDragActive ? "8 6" : selectedFile && !error ? "0" : "6 4"}
          style={isDragActive ? { animation: 'dash-flow 0.8s linear infinite' } : {}}
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
        {error ? (
          <>
            <AlertCircle className="w-8 h-8 text-[#DC2626]" />
            <p className="text-[14px] text-[#DC2626]">{error}</p>
          </>
        ) : selectedFile ? (
          <>
            <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
            <p className="text-[14px] text-gray-700 font-medium">{selectedFile.name}</p>
            <p className="text-[12px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <>
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-[#1D4ED8]' : 'text-gray-400'}`} />
            <p className="text-[14px] text-gray-500">
              {isDragActive ? 'Drop your PDF here' : 'Drop your PDF here, or '}
              {!isDragActive && <span className="text-[#1D4ED8] underline cursor-pointer">Browse</span>}
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
      />
    </div>
  )
}
