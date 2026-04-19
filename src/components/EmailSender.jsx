import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/storage';

// Import the API_BASE URL
const API_BASE = (import.meta.env.VITE_API_BASE || '/api');

export default function EmailSender({ recipient, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    // Fetch user profile to get email
    const fetchUserProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${API_BASE}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user profile');
        
        const data = await response.json();
        setUserEmail(data.email || '');
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error('You must be logged in to send emails');
      
      // Check total attachment size
      const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
      if (totalSize > 10 * 1024 * 1024) {
        throw new Error('Total attachments size exceeds 10MB limit');
      }
      
      console.log('Sending email to:', recipient, 'with subject:', subject, 'attachments:', attachments.length);
      const response = await fetch(`${API_BASE}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipient,
          subject,
          message,
          attachments
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send email');
      }
      
      console.log('Email sent response:', data);
      setSuccess(true);
      setSubject('');
      setMessage('');
      setAttachments([]);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Email sending error:', err);
      
      // If this is our first retry, try again automatically
      if (retryCount === 0) {
        setRetryCount(1);
        setError('Retrying...');
        
        // Wait a moment and retry
        setTimeout(() => {
          setError('');
          handleSubmit(e);
        }, 1000);
        return;
      }
      
      setError(err.message || 'Failed to send email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 10MB limit`);
        return;
      }
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        setAttachments(prev => [...prev, {
          filename: file.name,
          data: base64Data,
          contentType: file.type,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }
    
    // Clear the input
    e.target.value = '';
  };
  
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const getTotalSize = () => {
    const total = attachments.reduce((sum, att) => sum + att.size, 0);
    return (total / (1024 * 1024)).toFixed(2);
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] rounded-xl p-6 shadow-lg w-full max-w-md mx-auto my-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Send Email</h2>
      
      {success ? (
        <div className="bg-green-800/30 border border-green-500 text-green-200 rounded-lg p-3 mb-4">
          Email sent successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-800/30 border border-red-500 text-red-200 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">From</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none opacity-75"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">To</label>
            <input
              type="email"
              value={recipient}
              disabled
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none opacity-75"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none"
              placeholder="Email subject"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none min-h-[150px]"
              placeholder="Your message"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">
              Attachments {attachments.length > 0 && `(${getTotalSize()} MB / 10 MB)`}
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
            />
            
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((att, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#1b1b1b] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-300 truncate">{att.filename}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-400 hover:text-red-300 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-white/20 hover:bg-white/5 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}