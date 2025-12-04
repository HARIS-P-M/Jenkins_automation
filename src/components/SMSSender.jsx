import React, { useState, useEffect } from 'react'
import { getAuthToken } from '../utils/storage.js'

export default function SMSSender({ recipient, recipientName, onClose }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])

  // Load SMS templates from localStorage
  useEffect(() => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('sms_templates') || '[]')
      setTemplates(savedTemplates)
    } catch (e) {
      console.error('Failed to load SMS templates:', e)
      setTemplates([])
    }
  }, [])

  // Character counter
  const charCount = message.length
  const maxChars = 160 // Standard SMS length
  const smsCount = Math.ceil(charCount / maxChars) || 1

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    if (!recipient) {
      setError('No phone number available')
      return
    }

    setSending(true)
    setError('')
    setSuccess(false)

    try {
      const token = getAuthToken()
      const response = await fetch('http://localhost:4000/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipient,
          message: message.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS')
      }

      setSuccess(true)
      setMessage('')
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error('SMS send error:', err)
      setError(err.message || 'Failed to send SMS. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleUseTemplate = (template) => {
    let text = template.text
    // Replace placeholders
    if (recipientName) {
      text = text.replace(/\{name\}/g, recipientName)
    }
    setMessage(text)
    setShowTemplates(false)
  }

  const saveAsTemplate = () => {
    if (!message.trim()) return

    const newTemplate = {
      id: Date.now().toString(),
      text: message.trim()
    }

    const updated = [...templates, newTemplate]
    localStorage.setItem('sms_templates', JSON.stringify(updated))
    setTemplates(updated)
    alert('Template saved!')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl my-8">
        <div className="sticky top-0 bg-[#121212] border-b border-white/10 p-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-lg font-semibold">Send SMS</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            To: {recipientName ? `${recipientName} (${recipient})` : recipient}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            SMS sent successfully!
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">Message</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                Templates
              </button>
              {message.trim() && (
                <button
                  onClick={saveAsTemplate}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Save as template
                </button>
              )}
            </div>
          </div>
          
          {showTemplates && templates.length > 0 && (
            <div className="mb-3 bg-[#1b1b1b] border border-white/10 rounded-xl p-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className="w-full text-left text-xs p-2 rounded-lg hover:bg-white/5 text-gray-300 line-clamp-2"
                  >
                    {template.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here... Use {name} for recipient's name"
            rows="6"
            className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>
              {charCount} characters • {smsCount} SMS {smsCount > 1 && '(multiple parts)'}
            </span>
            {charCount > maxChars && (
              <span className="text-yellow-400">Long message will be split</span>
            )}
          </div>
        </div>
        
        <div className="bg-[#1b1b1b] border border-white/10 rounded-xl p-3">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <div>
              <p className="text-gray-300 font-medium mb-1">About Web SMS</p>
              <p>Messages are sent through a web service (Twilio). Standard SMS rates may apply. Make sure the phone number is valid and in international format.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="sticky bottom-0 bg-[#121212] border-t border-white/10 p-4 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 px-4 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 transition-colors font-medium"
          disabled={sending}
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send SMS
            </>
          )}
        </button>
      </div>
      </div>
    </div>
  )
}
