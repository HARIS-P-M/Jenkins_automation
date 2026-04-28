import React, { useState, useEffect } from 'react'
import { setAuthToken } from '../utils/storage'

const API_BASE = (import.meta.env.VITE_API_BASE || '/api')

const MODES = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT: 'forgot',
  RESET: 'reset'
}

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState(MODES.LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorUserId, setTwoFactorUserId] = useState('')
  const [twoFactorMethod, setTwoFactorMethod] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')

  // Handle URL parameters for password reset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')
    const emailParam = urlParams.get('email')
    
    if (tokenParam && emailParam) {
      setMode(MODES.RESET)
      setToken(tokenParam)
      setEmail(emailParam)
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handle2FAVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/auth/login/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twoFactorUserId, code: twoFactorCode })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Verification failed')
      
      setAuthToken(data.token)
      onAuthSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === MODES.LOGIN || mode === MODES.SIGNUP) {
        const endpoint = mode === MODES.LOGIN ? '/auth/login' : '/auth/signup'
        const body = mode === MODES.LOGIN ? { email, password } : { email, password, name }
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Authentication failed')
        
        if (data.twoFactorRequired) {
          setShow2FA(true)
          setTwoFactorUserId(data.userId)
          setTwoFactorMethod(data.method)
          return
        }

        setAuthToken(data.token)
        onAuthSuccess(data)
      } 
      else if (mode === MODES.LOGIN && show2FA) {
        // Handled by handle2FAVerify
      }
      else if (mode === MODES.FORGOT) {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to send reset code')
        
        setMessage('A secure reset link has been sent to your email!')
        // We stay in FORGOT mode until they click the link in their email
      }
      else if (mode === MODES.RESET) {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token, newPassword })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to reset password')
        
        setMessage('Password reset successful! You can now login with your new password.')
        setMode(MODES.LOGIN)
        setPassword('')
        setToken('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-[440px] animate-slide-up">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Contact Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Professional Enterprise Suite</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {show2FA ? 'Two-Step Verification' : (
              <>
                {mode === MODES.LOGIN && 'Welcome Back'}
                {mode === MODES.SIGNUP && 'Create Account'}
                {mode === MODES.FORGOT && 'Forgot Password'}
                {mode === MODES.RESET && 'Secure Password Reset'}
              </>
            )}
          </h2>

          {show2FA ? (
            <form onSubmit={handle2FAVerify} className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {twoFactorMethod === 'email' 
                    ? "We've sent a 6-digit verification code to your email." 
                    : "Enter the 6-digit code from your authenticator app."}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-[1em] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Complete Sign In'}
              </button>

              <button 
                type="button" 
                onClick={() => setShow2FA(false)} 
                className="w-full text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Cancel and back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-2xl flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {message}
              </div>
            )}

            <div className="space-y-4">
              {mode === MODES.SIGNUP && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === MODES.RESET}
                />
              </div>

              {(mode === MODES.LOGIN || mode === MODES.SIGNUP) && (
                <div>
                  <div className="flex justify-between mb-1.5 ml-1">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                    {mode === MODES.LOGIN && (
                      <button type="button" onClick={() => setMode(MODES.FORGOT)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Forgot Password?</button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {mode === MODES.RESET && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                    <input
                      type="password"
                      required
                      autoFocus
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {mode === MODES.LOGIN && 'Sign In'}
              {mode === MODES.SIGNUP && 'Create Account'}
              {mode === MODES.FORGOT && 'Request Reset Link'}
              {mode === MODES.RESET && 'Update Password'}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setMessage('')
                  if (mode === MODES.LOGIN) setMode(MODES.SIGNUP)
                  else setMode(MODES.LOGIN)
                }}
                className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {mode === MODES.LOGIN ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-slate-400 dark:text-slate-600 text-xs mt-8 font-medium">
          Secure encrypted connection active • v2.4.0-pro
        </p>
      </div>
    </div>
  )
}