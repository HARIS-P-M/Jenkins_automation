import { useState, useEffect } from 'react';

const UserSettings = ({ user, onUpdateUser, onClose }) => {
  

  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      
      <div className="bg-[#0a0a0a] rounded-3xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Account Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* User Profile */}
          <div className="border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">User Profile</h3>
            <div className="mb-3">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-white">{user.email}</div>
            </div>
            {user.name && (
              <div>
                <div className="text-xs text-gray-500">Name</div>
                <div className="text-white">{user.name}</div>
              </div>
            )}
          </div>
          
          {/* Security */}
          <div className="border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Security</h3>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-white text-sm">Change Password</div>
                <div className="text-xs text-gray-500">Update your account password</div>
              </div>
              <button
                className="px-3 py-1 rounded-lg text-xs font-medium bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white"
              >
                Change
              </button>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="border border-red-900/30 bg-red-950/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-white text-sm">Delete Account</div>
                <div className="text-xs text-gray-500">
                  Permanently delete your account and all data
                </div>
              </div>
              <button
                className="px-3 py-1 rounded-lg text-xs font-medium bg-red-600/20 hover:bg-red-600/30 text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UserSettings;