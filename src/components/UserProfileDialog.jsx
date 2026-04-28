import React, { useState, useEffect } from 'react'
import { getAuthToken, clearAuthToken } from '../utils/storage'
import AvatarPicker from './AvatarPicker.jsx'
import TwoFactorAuth from './TwoFactorAuth.jsx'

const API_BASE = (import.meta.env.VITE_API_BASE || '/api')

export default function UserProfileDialog({ open, onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    recoveryEmail: '',
    avatar: ''
  })

  useEffect(() => {
    if (open) {
      fetchProfile()
    }
  }, [open])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data)
        setFormData({
          name: data.name || '',
          mobileNumber: data.mobileNumber || '',
          recoveryEmail: data.recoveryEmail || '',
          avatar: data.avatar || ''
        })
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data)
        setEditMode(false)
        if (window.onUserUpdate) window.onUserUpdate(data)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    window.location.reload()
  }

  const handle2FAUpdate = async (result) => {
    // The TwoFactorAuth component now handles all API calls internally.
    // We just need to update the local user state to reflect the change.
    setUser(prev => ({ ...prev, twoFactorEnabled: result.enabled }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[90vh] animate-slide-up no-scrollbar">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-text-primary">User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-indigo-600/20 border-2 border-indigo-100 dark:border-indigo-900/30">
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-600/20">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-text-primary">{user?.name}</h3>
                  <p className="text-sm text-text-muted">{user?.email}</p>
                </div>
              </div>

              {editMode ? (
                <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col items-center justify-center mb-6">
                    <AvatarPicker value={formData.avatar} onChange={(val) => setFormData({...formData, avatar: val})} size={100} />
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2">Profile Picture</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">Mobile Number</label>
                    <input type="tel" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="input-field" placeholder="+1 234 567 890" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">Recovery Email</label>
                    <input type="email" value={formData.recoveryEmail} onChange={e => setFormData({...formData, recoveryEmail: e.target.value})} className="input-field" placeholder="backup@email.com" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEditMode(false)} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Mobile</p>
                      <p className="text-sm font-medium text-text-primary">{user?.mobileNumber || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Recovery Email</p>
                      <p className="text-sm font-medium text-text-primary truncate">{user?.recoveryEmail || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.twoFactorEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">Two-Step Verification</h4>
                          <p className="text-[11px] font-medium text-text-muted">{user?.twoFactorEnabled ? 'Enabled & Active' : 'Not configured'}</p>
                        </div>
                      </div>
                      <button onClick={() => setShow2FA(true)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${user?.twoFactorEnabled ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40'}`}>
                        {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>

                    <button onClick={() => setEditMode(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit Profile Information
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {show2FA && <TwoFactorAuth onClose={() => setShow2FA(false)} onVerify={handle2FAUpdate} />}
    </div>
  )
}