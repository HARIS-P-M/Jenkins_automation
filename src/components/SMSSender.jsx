import React, { useState, useEffect } from 'react'
import { getAuthToken } from '../utils/storage.js'

export default function SMSSender({ recipient, recipientName, onClose }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    try {
      const DEFAULT_TEMPLATES = [
        { id: 1, text: "Hi {name}, I tried calling you but couldn't reach you. Please call me back when you're free. Thanks!" },
        { id: 2, text: "Hello {name}, just a reminder about our scheduled meeting. Looking forward to speaking with you." },
        { id: 3, text: "Hi {name}, please find my contact details saved here. Let's stay in touch!" },
        { id: 4, text: "Greetings {name}, hope you're having a great day. Just checking in on our last discussion." }
      ];
      
      const saved = localStorage.getItem('sms_templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      } else {
        setTemplates(DEFAULT_TEMPLATES);
        localStorage.setItem('sms_templates', JSON.stringify(DEFAULT_TEMPLATES));
      }
    } catch (e) {
      setTemplates([]);
    }
  }, [])

  const charCount = message.length
  const maxChars = 160
  const smsCount = Math.ceil(charCount / maxChars) || 1

  const handleSend = async () => {
    if (!message.trim()) { setError('Please enter a message'); return }
    if (!recipient) { setError('No phone number available'); return }

    setSending(true)
    setError('')
    try {
      const token = getAuthToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE || '/api'}/send-sms`, {
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send SMS')
      }

      setSuccess(true)
      setMessage('')
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err.message || 'Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  const handleUseTemplate = (template) => {
    let text = template.text
    if (recipientName) text = text.replace(/\{name\}/g, recipientName)
    setMessage(text)
    setShowTemplates(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Send SMS</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                To: {recipientName || 'Unknown'} ({recipient || 'N/A'})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">SMS Sent!</h3>
              <p className="text-text-secondary">Your message has been delivered.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-lg text-rose-600 dark:text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Message</label>
                <button onClick={() => setShowTemplates(!showTemplates)} className="text-xs font-bold text-indigo-600 hover:underline">
                  {showTemplates ? 'Close Templates' : 'Use Template'}
                </button>
              </div>

              {showTemplates && templates.length > 0 && (
                <div className="grid grid-cols-1 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border-subtle max-h-32 overflow-y-auto">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => handleUseTemplate(t)} className="text-left p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs text-text-secondary transition-colors truncate">
                      {t.text}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="input-field min-h-[140px] resize-none text-sm"
                placeholder="Type your message... Use {name} for personalization"
                required
              />

              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-text-muted uppercase">
                  {charCount} chars • {smsCount} SMS
                </span>
                {charCount > 160 && (
                  <span className="text-[10px] font-bold text-amber-500 uppercase italic">Multi-part SMS</span>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border-subtle flex gap-3">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  Messages are routed through our enterprise gateway. Standard international rates apply. Please ensure the number is in E.164 format.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button 
                  onClick={handleSend}
                  disabled={sending || !message.trim()} 
                  className="flex-2 btn-primary shadow-lg shadow-emerald-600/20 !bg-emerald-600 hover:!bg-emerald-700"
                >
                  {sending ? 'Sending...' : 'Send SMS Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
