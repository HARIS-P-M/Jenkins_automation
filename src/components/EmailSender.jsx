import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/storage';

// Import the API_BASE URL
const API_BASE = (import.meta.env.VITE_API_BASE || '/api');

export default function EmailSender({ initialRecipient, onClose }) {
  const [recipient, setRecipient] = useState(initialRecipient || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (initialRecipient) setRecipient(initialRecipient);
  }, [initialRecipient]);
  
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h2 className="text-lg font-bold text-text-primary">Send Email</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Message Sent!</h3>
              <p className="text-text-secondary">Your email has been delivered successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-lg text-rose-600 dark:text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">From</label>
                  <input type="text" value={userEmail} disabled className="input-field opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">To</label>
                  <input type="email" value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field" placeholder="recipient@email.com" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" placeholder="What is this about?" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">Message Content</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="input-field min-h-[160px] resize-none" placeholder="Write your message here..." required />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                  Attachments {attachments.length > 0 && `(${getTotalSize()} MB / 10 MB)`}
                </label>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-border-subtle group">
                      <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">{att.filename}</span>
                      <button type="button" onClick={() => removeAttachment(index)} className="text-rose-500 hover:text-rose-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer flex items-center justify-center w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                    <input type="file" onChange={handleFileChange} multiple className="hidden" />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-2 btn-primary shadow-lg shadow-indigo-600/20">
                  {loading ? 'Sending Message...' : 'Send Email Now'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}