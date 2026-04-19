import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/storage';

// Import the API_BASE URL from storage.js
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
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setUserProfile(data);
      setName(data.name || '');
      setMobileNumber(data.mobileNumber || '');
      setRecoveryEmail(data.recoveryEmail || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          mobileNumber,
          recoveryEmail
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] rounded-xl p-6 shadow-lg w-full max-w-md mx-auto my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Your Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading && <div className="text-center py-4">Loading...</div>}
        
        {error && (
          <div className="bg-red-800/30 border border-red-500 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        
        {userProfile && !loading && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-neutral-800 grid place-items-center text-gray-400 border border-white/10">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                </div>
              </div>
              
              {editMode ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={userProfile.email}
                      disabled
                      className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none opacity-75"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none"
                      placeholder="Your mobile number"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-1">Recovery Email</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 outline-none"
                      placeholder="recovery@example.com"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400">Email</label>
                    <div className="text-white">{userProfile.email}</div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400">Name</label>
                    <div className="text-white">{userProfile.name || '(Not provided)'}</div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400">Name</label>
                    <div className="text-white">{userProfile.name || '(Not provided)'}</div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400">Mobile Number</label>
                    <div className="text-white">{userProfile.mobileNumber || '(Not provided)'}</div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400">Recovery Email</label>
                    <div className="text-white">{userProfile.recoveryEmail || '(Not provided)'}</div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="border-t border-white/10 my-2 pt-3">
                <button
                  onClick={() => window.showImportExport()}
                  className="w-full py-2 px-4 bg-[#1b1b1b] hover:bg-[#222] text-left rounded-lg flex items-center gap-2 transition"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                    <path d="M5 15v4h14v-4" />
                  </svg>
                  Import/Export Contacts
                </button>
              </div>
              <div className="flex justify-between gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 bg-transparent border border-white/20 hover:bg-white/5 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={window.handleLogout}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}