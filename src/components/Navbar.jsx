import React, { useState } from 'react'
import UserProfileDialog from './UserProfileDialog.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function NavIcon({ name, active }) {
  const icons = {
    contacts: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    add: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    history: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    email: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    sms: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    )
  }
  return React.cloneElement(icons[name], { className: active ? 'text-violet-400' : 'text-text-muted transition-colors duration-300' });
}

export default function Navbar({ 
  active, 
  onChange, 
  tabs, 
  currentUser,
  onLogout,
  onShowBirthdayReminders,
  onShowContactAnalytics,
  onShowImportExport,
  unreadEmailCount = 0,
  unreadSMSCount = 0
}) {
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { key: tabs.CONTACTS, label: 'Contacts', icon: 'contacts', badge: 0 },
    { key: tabs.ADD, label: 'Create', icon: 'add', badge: 0 },
    { key: tabs.HISTORY, label: 'History', icon: 'history', badge: 0 },
    { key: tabs.EMAIL_INBOX, label: 'Email', icon: 'email', badge: unreadEmailCount },
    { key: tabs.SMS_INBOX, label: 'SMS', icon: 'sms', badge: unreadSMSCount },
  ]

  return (
    <>
      {/* Premium Top Bar */}
      <header className="fixed top-4 left-4 right-4 z-[100] flex justify-center">
        <div className="w-full max-w-4xl glass-card rounded-[1.5rem] px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <span className="font-bold tracking-tight text-sm hidden sm:block">Contact <span className="gradient-text">Manager</span></span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowTools(!showTools)}
                className={`p-2.5 rounded-xl transition-all ${showTools ? 'bg-violet-500/20 text-violet-500' : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary'}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              
              {showTools && (
                <div className="absolute top-full right-0 mt-3 w-56 glass-card rounded-2xl p-2 shadow-2xl fade-in">
                  <ToolItem label="Analytics" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>} onClick={() => { onShowContactAnalytics(); setShowTools(false); }} />
                  <ToolItem label="Birthdays" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} onClick={() => { onShowBirthdayReminders(); setShowTools(false); }} />
                  <ToolItem label="Import/Export" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>} onClick={() => { onShowImportExport(); setShowTools(false); }} />
                </div>
              )}
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button 
              onClick={() => setShowUserProfile(true)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all border border-black/5 dark:border-white/5 group"
            >
              <div className="w-7 h-7 bg-violet-500 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                {currentUser?.name?.[0] || currentUser?.email?.[0] || 'U'}
              </div>
            </button>
          </div>
        </div>
      </header>
      
      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg">
        <div className="glass-card rounded-[2rem] p-2 flex justify-around items-center shadow-2xl">
          {navItems.map(({ key, label, icon, badge }) => {
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => onChange(key)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl relative transition-all duration-300 ${isActive ? 'bg-violet-500/10 scale-110' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {badge > 0 && (
                  <span className="absolute top-2 right-2 bg-pink-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-lg border-2 border-white dark:border-[#050505]">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                <NavIcon name={icon} active={isActive} />
                <span className={`text-[9px] mt-1 font-bold tracking-wide uppercase transition-colors duration-300 ${isActive ? 'text-violet-500' : 'text-text-secondary'}`}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-violet-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
      
      <UserProfileDialog 
        open={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
    </>
  )
}

function ToolItem({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-text-secondary hover:text-white group"
    >
      <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-all">
        {icon}
      </div>
      <span className="text-xs font-bold tracking-wide">{label}</span>
    </button>
  )
}

