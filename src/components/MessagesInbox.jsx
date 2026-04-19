import React, { useState, useEffect } from 'react'
import { getAuthToken } from '../utils/storage.js'

const API_BASE = (import.meta.env.VITE_API_BASE || '/api')

export default function MessagesInbox({ open, onClose, onCompose }) {
  const [activeTab, setActiveTab] = useState('email-received')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchMessages()
    }
  }, [open, activeTab])

  const fetchMessages = async () => {
    setLoading(true)
    setError('')
    
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Not authenticated')

      let endpoint = ''
      if (activeTab === 'email-received') {
        endpoint = '/messages/email/received'
      } else if (activeTab === 'email-sent') {
        endpoint = '/messages/email/sent'
      } else if (activeTab === 'sms-received') {
        endpoint = '/messages/sms/received'
      } else if (activeTab === 'sms-sent') {
        endpoint = '/messages/sms/sent'
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(data)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      const token = getAuthToken()
      const messageType = activeTab.includes('email') ? 'email' : 'sms'
      
      await fetch(`${API_BASE}/messages/${messageType}/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return

    try {
      const token = getAuthToken()
      const messageType = activeTab.includes('email') ? 'email' : 'sms'
      
      await fetch(`${API_BASE}/messages/${messageType}/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setSelectedMessage(null)
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Failed to delete message')
    }
  }

  const handleSelectMessage = (message) => {
    setSelectedMessage(message)
    if (!message.read && activeTab.includes('received')) {
      markAsRead(message.id)
    }
  }

  if (!open) return null

  const tabs = [
    { key: 'email-received', label: 'Inbox', icon: '📧' },
    { key: 'email-sent', label: 'Sent', icon: '📤' },
    { key: 'sms-received', label: 'SMS In', icon: '💬' },
    { key: 'sms-sent', label: 'SMS Out', icon: '📲' }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Messages</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onCompose?.('email')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-1"
            >
              <span>✉️</span> New Email
            </button>
            <button
              onClick={() => onCompose?.('sms')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm flex items-center gap-1"
            >
              <span>💬</span> New SMS
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setSelectedMessage(null)
              }}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-b-2 border-emerald-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Message List */}
          <div className="w-1/3 border-r border-white/10 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No messages
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {messages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition ${
                      selectedMessage?.id === msg.id ? 'bg-white/10' : ''
                    } ${!msg.read && activeTab.includes('received') ? 'bg-emerald-900/10' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium truncate flex items-center gap-2">
                        {!msg.read && activeTab.includes('received') && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        )}
                        {activeTab.includes('sent') ? `To: ${msg.to}` : `From: ${msg.from}`}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    {activeTab.includes('email') && (
                      <div className="text-sm text-gray-400 mb-1 truncate">
                        {msg.subject}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {msg.message}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedMessage ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {activeTab.includes('email') && (
                        <h3 className="text-xl font-semibold mb-3">{selectedMessage.subject}</h3>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {activeTab.includes('sent') ? 'To:' : 'From:'}
                          </span>
                          <span className="text-white">
                            {activeTab.includes('sent') ? selectedMessage.to : selectedMessage.from}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white">
                            {new Date(selectedMessage.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                      title="Delete message"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2M10 11v6M14 11v6M5 6h14l-1 14H6L5 6z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {activeTab.includes('received') && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        onCompose?.(
                          activeTab.includes('email') ? 'email' : 'sms',
                          activeTab.includes('email') ? selectedMessage.from : selectedMessage.from
                        )
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
