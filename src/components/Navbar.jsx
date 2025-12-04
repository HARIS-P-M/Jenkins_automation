import React, { useState } from 'react'
import UserProfileDialog from './UserProfileDialog.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function IconContacts({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8"/>
      <circle cx="12" cy="10" r="3" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8"/>
      <path d="M6 18c.8-2.7 3.2-4 6-4s5.2 1.3 6 4" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconAdd({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8"/>
      <path d="M12 8v8M8 12h8" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconHistory({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8"/>
      <path d="M12 7v5l3 2" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconInbox({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8"/>
      <path d="M3 10h5l1.5 3h5l1.5-3h5" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}

function IconEmail({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8"/>
      <path d="M3 7l9 6 9-6" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconSMS({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={active ? '#22c55e' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M6 19c0-3.5 2.5-6 6-6s6 2.5 6 6" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
}

export default function Navbar({ 
  active, 
  onChange, 
  tabs, 
  currentUser,
  onLogout,
  onShowUserSettings,
  onShowBirthdayReminders,
  onShowContactAnalytics,
  onShowImportExport,
  unreadEmailCount = 0,
  unreadSMSCount = 0
}) {
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const items = [
    { key: tabs.CONTACTS, label: 'Contacts', icon: IconContacts, badge: 0 },
    { key: tabs.ADD, label: 'Add', icon: IconAdd, badge: 0 },
    { key: tabs.HISTORY, label: 'History', icon: IconHistory, badge: 0 },
    { key: tabs.EMAIL_INBOX, label: 'Email', icon: IconEmail, badge: unreadEmailCount },
    { key: tabs.SMS_INBOX, label: 'SMS', icon: IconSMS, badge: unreadSMSCount },
  ]
  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gray-50 dark:bg-[#0b0b0b] border-b border-gray-200 dark:border-white/10 z-20">
        <div className="mx-auto max-w-md flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Manager</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full bg-gray-200 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button 
              onClick={() => setShowUserProfile(true)}
              className="h-9 w-9 rounded-full bg-gray-200 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="User Profile"
            >
              <IconUser />
            </button>
          </div>
        </div>
      </header>
      
      <nav className="fixed bottom-0 left-0 right-0 safe-area-bottom bg-gray-50 dark:bg-[#0b0b0b] border-t border-gray-200 dark:border-white/10">
        <div className="mx-auto max-w-md">
          <div className="grid grid-cols-5">
            {items.map(({ key, label, icon: Icon, badge }) => {
              const isActive = active === key
              return (
                <button
                  key={key}
                  onClick={() => onChange(key)}
                  className={`flex flex-col items-center justify-center py-3 gap-1 relative ${isActive ? 'text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}
                  aria-label={label}
                >
                  <div className="relative">
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    <Icon active={isActive} />
                  </div>
                  <span className="text-[11px]">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
      
      <UserProfileDialog 
        open={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
    </>
  )
}
