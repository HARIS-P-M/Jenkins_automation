import React, { useState, useEffect } from 'react'
import { getAuthToken } from '../utils/storage.js'

const API_BASE = 'http://localhost:4000/api'

export default function SMSInbox({ onClose, onReply, onMessageRead }) {
  const [activeTab, setActiveTab] = useState('inbox') // 'inbox' | 'sent'
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMessages()
  }, [activeTab])

  const fetchMessages = async () => {
    setLoading(true)
    setError('')
    try {
      const token = getAuthToken()
      const endpoint = activeTab === 'inbox' 
        ? '/messages/sms/received' 
        : '/messages/sms/sent'
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
      setSelectedMessage(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE}/messages/sms/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Update local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ))
      if (selectedMessage?._id === messageId) {
        setSelectedMessage({ ...selectedMessage, read: true })
      }
      
      // Notify parent to update unread count
      if (onMessageRead) {
        onMessageRead()
      }
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const handleDelete = async (messageId) => {
    if (!confirm('Delete this SMS?')) return
    
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE}/messages/sms/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setMessages(messages.filter(msg => msg._id !== messageId))
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null)
      }
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Failed to delete message')
    }
  }

  const handleSelectMessage = (message) => {
    setSelectedMessage(message)
    if (!message.read) {
      handleMarkAsRead(message._id)
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

  return (
    <div className="h-full bg-[#0b0b0b] flex flex-col">
      {/* Header */}
      <div className="bg-[#0e0e0e] border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Contacts
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">💬 SMS</h1>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'inbox'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            📥 Inbox {unreadCount > 0 && activeTab === 'inbox' && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'sent'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            📤 Sent
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Message List */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          )}
          
          {error && (
            <div className="p-4 text-red-400 text-sm">{error}</div>
          )}
          
          {!loading && !error && messages.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No {activeTab === 'inbox' ? 'received' : 'sent'} SMS messages
            </div>
          )}
          
          {!loading && !error && messages.map((message) => (
            <button
              key={message._id}
              onClick={() => handleSelectMessage(message)}
              className={`w-full text-left p-4 border-b border-white/10 hover:bg-[#1a1a1a] transition ${
                selectedMessage?._id === message._id ? 'bg-[#1a1a1a]' : ''
              } ${!message.read ? 'bg-purple-900/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-medium text-white truncate">
                  {activeTab === 'inbox' ? message.from : message.to}
                </div>
                {!message.read && (
                  <span className="flex-shrink-0 h-2 w-2 rounded-full bg-purple-500"></span>
                )}
              </div>
              <div className="text-sm text-gray-400 truncate mb-1">
                {message.message.substring(0, 50)}...
              </div>
              <div className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>

        {/* Message Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  SMS Message
                </h2>
                <div className="flex gap-2">
                  {activeTab === 'inbox' && (
                    <button
                      onClick={() => onReply(
                        selectedMessage.from,
                        selectedMessage.from
                      )}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                    >
                      Reply
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-sm text-gray-400 mb-1">
                  <span className="font-medium">From:</span> {selectedMessage.from || 'Unknown'}
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  <span className="font-medium">To:</span> {selectedMessage.to || 'Unknown'}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Date:</span> {selectedMessage.timestamp ? new Date(selectedMessage.timestamp).toLocaleString() : 'Unknown'}
                </div>
              </div>
              
              <div className="text-gray-200 whitespace-pre-wrap">
                {selectedMessage.message || 'No message content'}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a message to read
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
