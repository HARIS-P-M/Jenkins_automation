import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/storage';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api');

export default function UserProfileDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchUserProfile();
    }
  }, [open]);
  
  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setUserProfile(data);
      setName(data.name || '');
      setMobileNumber(data.mobileNumber || '');
      setRecoveryEmail(data.recoveryEmail || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, mobileNumber, recoveryEmail })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      setEditMode(false);
      // Update global user state if needed
      if (window.onUserUpdate) window.onUserUpdate(updatedProfile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="w-full max-w-lg glass-card rounded-[2.5rem] p-8 md:p-10 relative z-10 fade-in overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-[80px]" />
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Your Profile</h2>
            <p className="text-text-secondary text-sm">Manage your account details and security</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-400 text-sm flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}
        
        {loading && !userProfile ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
            <p className="text-text-secondary font-medium">Loading your profile...</p>
          </div>
        ) : userProfile && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white/5 rounded-3xl border border-white/5">
               <div className="relative group">
                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-violet-500 to-pink-500 p-[2px] shadow-xl shadow-violet-500/20">
                  <div className="h-full w-full bg-[#0a0a0a] rounded-[1.9rem] flex items-center justify-center overflow-hidden">
                    <span className="text-3xl font-bold text-white uppercase">{userProfile.name?.[0] || userProfile.email?.[0]}</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-emerald-500 border-4 border-[#0a0a0a] rounded-full" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-1">{userProfile.name || 'Anonymous User'}</h3>
                <p className="text-text-secondary text-sm font-medium">{userProfile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileItem label="Display Name" value={name} icon={<UserIcon />} isEdit={editMode} onChange={setName} />
              <ProfileItem label="Recovery Email" value={recoveryEmail} icon={<MailIcon />} isEdit={editMode} onChange={setRecoveryEmail} />
              <ProfileItem label="Mobile Number" value={mobileNumber} icon={<PhoneIcon />} isEdit={editMode} onChange={setMobileNumber} />
              <ProfileItem label="Account Type" value="Premium Member" icon={<StarIcon />} isEdit={false} />
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t border-white/5">
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all">Cancel</button>
                  <button onClick={handleSaveProfile} className="flex-1 premium-button px-6 py-4 rounded-2xl font-bold shadow-lg shadow-violet-500/20">{loading ? 'Saving...' : 'Save Changes'}</button>
                </>
              ) : (
                <>
                  <button onClick={window.handleLogout} className="flex-1 px-6 py-4 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-2xl font-bold transition-all">Logout</button>
                  <button onClick={() => setEditMode(true)} className="flex-1 premium-button px-6 py-4 rounded-2xl font-bold shadow-lg shadow-violet-500/20">Edit Profile</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileItem({ label, value, icon, isEdit, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-text-muted ml-1">
        {React.cloneElement(icon, { size: 14, className: 'opacity-70' })}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      {isEdit ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl font-medium text-sm text-text-primary min-h-[46px] flex items-center">
          {value || <span className="text-text-muted italic text-xs">Not provided</span>}
        </div>
      )}
    </div>
  );
}

const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const MailIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const PhoneIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const StarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;