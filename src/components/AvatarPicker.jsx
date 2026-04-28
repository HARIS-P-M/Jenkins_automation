import React, { useRef, useState, useEffect } from 'react'

function ImageCropDialog({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(0.8)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImageLoaded(true)
      drawCanvas()
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [zoom, position, imageLoaded])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imgRef.current
    
    if (!canvas || !ctx || !img) return

    const size = 300
    canvas.width = size
    canvas.height = size

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)

    const scale = zoom
    const imgWidth = img.width * scale
    const imgHeight = img.height * scale
    
    ctx.drawImage(
      img,
      position.x + (size - imgWidth) / 2,
      position.y + (size - imgHeight) / 2,
      imgWidth,
      imgHeight
    )

    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border-subtle overflow-hidden">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Crop Profile Photo</h2>
        
        <div className="flex flex-col items-center gap-6">
          <div className="relative p-1 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-indigo-500/30">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="rounded-full cursor-move shadow-inner"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onPointerDown={handleMouseDown}
              onPointerMove={handleMouseMove}
              onPointerUp={handleMouseUp}
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Zoom Intensity</label>
              <span className="text-xs font-bold text-indigo-600">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border-subtle font-semibold text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const canvas = canvasRef.current
                if (!canvas) return
                onSave(canvas.toDataURL('image/jpeg', 0.9))
              }}
              className="flex-1 px-4 py-2.5 btn-primary font-bold shadow-lg shadow-indigo-600/20"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AvatarPicker({ value, onChange, size = 100 }) {
  const inputRef = useRef(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [tempImage, setTempImage] = useState('')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setTempImage(String(reader.result))
      setShowCropDialog(true)
    }
    reader.readAsDataURL(file)
  }

  const dim = `${size}px`

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        <div
          className="relative group cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <div 
            className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-border-subtle group-hover:border-indigo-500 transition-all duration-300"
            style={{ width: dim, height: dim }}
          >
            {value ? (
              <img src={value} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              </svg>
            )}
          </div>
          
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-900 scale-0 group-hover:scale-100 transition-transform">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-bold text-indigo-600 hover:underline">
            {value ? 'Update Photo' : 'Upload Image'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-xs font-bold text-rose-500 hover:underline">
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {showCropDialog && (
        <ImageCropDialog
          imageUrl={tempImage}
          onSave={(img) => { onChange(img); setShowCropDialog(false); }}
          onCancel={() => setShowCropDialog(false)}
        />
      )}
    </>
  )
}
