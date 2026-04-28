import React, { useState } from 'react'
import UserProfileDialog from './UserProfileDialog.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

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
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { key: tabs.CONTACTS, label: 'Contacts', icon: <ContactsIcon /> },
    { key: tabs.ADD, label: 'Add New', icon: <AddIcon /> },
    { key: tabs.HISTORY, label: 'History', icon: <HistoryIcon /> },
    { key: tabs.EMAIL_INBOX, label: 'Emails', icon: <EmailIcon />, badge: unreadEmailCount },
    { key: tabs.SMS_INBOX, label: 'Messages', icon: <SMSIcon />, badge: unreadSMSCount },
  ]

  return (
    <>
      <header className="nav-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <ContactsIcon />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">Contact <span className="text-indigo-600">Manager</span></span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${active === item.key ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-text-secondary hover:bg-bg-hover'}`}
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-px bg-border-subtle mx-2 hidden sm:block"></div>
              
              <button onClick={onShowContactAnalytics} className="p-2 text-text-secondary hover:text-indigo-600 hover:bg-bg-hover rounded-lg transition-colors hidden sm:block" title="Analytics">
                <AnalyticsIcon />
              </button>
              
              <button onClick={onShowBirthdayReminders} className="p-2 text-text-secondary hover:text-indigo-600 hover:bg-bg-hover rounded-lg transition-colors hidden sm:block" title="Birthdays">
                <BirthdayIcon />
              </button>

              <button onClick={toggleTheme} className="p-2 text-text-secondary hover:text-indigo-600 hover:bg-bg-hover rounded-lg transition-colors">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>

              <button 
                onClick={() => setShowUserProfile(true)}
                className="flex items-center gap-2 ml-2 p-1 pr-3 bg-bg-hover rounded-full hover:ring-2 hover:ring-indigo-500/20 transition-all border border-border-subtle"
              >
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold text-white uppercase">
                  {currentUser?.name?.[0] || 'U'}
                </div>
                <span className="text-xs font-semibold text-text-secondary hidden sm:block truncate max-w-[100px]">
                  {currentUser?.name || 'Account'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-card border-t py-2 px-4 flex justify-around items-center">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active === item.key ? 'text-indigo-600' : 'text-text-muted'}`}
          >
            <div className="relative">
              {React.cloneElement(item.icon, { className: 'w-6 h-6' })}
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-slate-800">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <UserProfileDialog open={showUserProfile} onClose={() => setShowUserProfile(false)} />
    </>
  )
}

const ContactsIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const EmailIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const SMSIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
const AnalyticsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>;
const BirthdayIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SunIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
