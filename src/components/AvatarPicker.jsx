import React, { useRef, useState } from 'react'

function ImageCropDialog({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(0.8)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef(null)

  React.useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImageLoaded(true)
      drawCanvas()
    }
    img.src = imageUrl
  }, [imageUrl])

  React.useEffect(() => {
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

    // Draw circular overlay
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

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    onSave(croppedImage)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Crop Profile Photo</h2>
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="border-2 border-gray-300 dark:border-white/20 rounded-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="w-full">
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Zoom</label>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Drag the image to reposition • Use the slider to zoom
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AvatarPicker({ value, onChange, size = 80 }) {
  const inputRef = useRef(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [tempImage, setTempImage] = useState('')

  function pickFile() {
    inputRef.current?.click()
  }

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

  function handleCropSave(croppedImage) {
    onChange(croppedImage)
    setShowCropDialog(false)
    setTempImage('')
  }

  function handleCropCancel() {
    setShowCropDialog(false)
    setTempImage('')
  }

  function clearPhoto() {
    onChange('')
  }

  const dim = `${size}px`

  return (
    <>
      <div className="flex items-center gap-4">
        <div
          className="rounded-full overflow-hidden bg-gray-300 dark:bg-neutral-800 grid place-items-center border border-gray-400 dark:border-white/10 flex-shrink-0 hover:border-gray-600 dark:hover:border-white/30 transition-colors cursor-pointer"
          style={{ width: dim, height: dim }}
          onClick={pickFile}
          role="button"
          aria-label="Change photo"
        >
          {value ? (
            <img src={value} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <svg width={Math.min(size * 0.45, 36)} height={Math.min(size * 0.45, 36)} viewBox="0 0 24 24" className="text-gray-600 dark:text-gray-400">
              <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M6.5 19c1-3.2 3.6-4.8 5.5-4.8s4.5 1.6 5.5 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <button type="button" onClick={pickFile} className="text-emerald-400 text-sm hover:underline">{value ? 'Change photo' : 'Add a photo'}</button>
          {value && (
            <button type="button" onClick={clearPhoto} className="text-gray-600 dark:text-gray-400 text-xs text-left hover:text-gray-900 dark:hover:text-gray-200 transition-colors mt-1">Remove</button>
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
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}
    </>
  )
}
