import React, { useState, useEffect } from 'react'

export default function EmailDialog({ open, contact, onClose, onSend }) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (contact?.email) {
      setTo(contact.email)
    }
    // Reset form when dialog opens with a new contact
    if (open) {
      setSubject('')
      setMessage('')
      setError(null)
    }
  }, [contact, open])

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Email address is required')
      return
    }

    if (!subject.trim()) {
      setError('Subject is required')
      return
    }

    if (!message.trim()) {
      setError('Message is required')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await onSend({ to, subject, message })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">Send Email</h3>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#222] flex items-center justify-center text-gray-400 hover:bg-[#333]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Message:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors min-h-[150px] resize-y"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="flex-1 h-12 rounded-xl border border-white/15 text-gray-300 hover:bg-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending || !to.trim() || !subject.trim() || !message.trim()}
            className="flex-1 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition-colors"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13"></path>
                  <path d="M22 2L15 22L11 13L2 9L22 2z"></path>
                </svg>
                <span>Send Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}