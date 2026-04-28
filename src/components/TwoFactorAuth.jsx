import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getAuthToken } from '../utils/storage';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api');


const TwoFactorAuth = ({ userEmail, onClose, onVerify }) => {
  const [step, setStep] = useState('setup'); // setup, verify
  const [method, setMethod] = useState(''); // email, app
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSelectMethod = async (selectedMethod) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/setup-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ method: selectedMethod })
      });
      const data = await response.json();
      if (response.ok) {
        setMethod(selectedMethod);
        if (selectedMethod === 'app') {
          setSecret(data.secret);
        }
        setStep('verify');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ code, method })
      });
      const data = await response.json();
      if (response.ok) {
        setIsVerified(true);
        if (onVerify) {
          onVerify({
            enabled: true,
            method,
            secret: method === 'app' ? secret : null,
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDisable = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/disable-2fa`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (response.ok) {
        setIsVerified(false);
        if (onVerify) {
          onVerify({ enabled: false, method: null, secret: null });
        }
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const renderSetupScreen = () => (
    <div>
      <h2 className="text-xl font-medium mb-4 text-slate-900 dark:text-white">Set Up Two-Factor Authentication</h2>
      <p className="mb-6 text-slate-600 dark:text-gray-300">
        Two-factor authentication adds an extra layer of security to your account.
      </p>
      
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            <p className="text-sm text-text-muted">Setting up {method} verification...</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => handleSelectMethod('email')}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 dark:bg-[#121212] dark:hover:bg-[#171717] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Email Authentication</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Receive verification codes via email</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-400 dark:text-gray-400">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button
              onClick={() => handleSelectMethod('app')}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 dark:bg-[#121212] dark:hover:bg-[#171717] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Authenticator App</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Use an app like Google Authenticator</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-400 dark:text-gray-400">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
  
  const renderVerifyScreen = () => (
    <div>
      <button onClick={() => setStep('setup')} className="flex items-center mb-4 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      
      <h2 className="text-xl font-medium mb-4 text-slate-900 dark:text-white">
        {method === 'email' ? 'Email Verification' : 'Authenticator App'}
      </h2>
      
      {method === 'app' && (
        <div className="mb-6">
          <p className="mb-2 text-slate-600 dark:text-gray-300">
            Scan the QR code or enter this key in your authenticator app:
          </p>
          <div className="bg-slate-100 dark:bg-white p-4 rounded-lg mb-4 flex flex-col items-center text-center">
            <div className="bg-white p-2 rounded-lg mb-4 inline-block border border-slate-200">
              <QRCodeCanvas 
                value={`otpauth://totp/ContactManager:${userEmail || 'User'}?secret=${secret.replace(/-/g, '')}&issuer=ContactManager`} 
                size={150} 
              />
            </div>
            <div className="text-slate-800 dark:text-gray-800 font-mono text-sm tracking-widest">{secret}</div>
          </div>
        </div>
      )}
      
      {method === 'email' && (
        <p className="mb-6 text-slate-600 dark:text-gray-300">
          We've sent a verification code to your email address. Please enter it below.
        </p>
      )}
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
          Verification Code
        </label>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
          className="w-full px-4 py-2 bg-white dark:bg-[#121212] border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter 6-digit code"
        />
      </div>
      
      {error && <div className="mb-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{error}</div>}

      <button
        onClick={handleVerify}
        disabled={code.length !== 6 || loading}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          code.length === 6 && !loading
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying...
          </div>
        ) : 'Verify'}
      </button>
    </div>
  );
  
  const renderSuccessScreen = () => (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-green-500">
          <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <h2 className="text-xl font-medium mb-2 text-slate-900 dark:text-white">Two-Factor Authentication Enabled</h2>
      <p className="mb-6 text-slate-600 dark:text-gray-300">
        Your account is now protected with an additional layer of security.
      </p>
      
      <div className="flex space-x-4">
        <button
          onClick={handleDisable}
          className="flex-1 py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg font-medium"
        >
          Disable
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 z-[250]">
      <div className="relative bg-white dark:bg-[#0a0a0a] rounded-3xl w-full max-w-md p-6 shadow-xl transition-colors">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-gray-500"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {!isVerified && step === 'setup' && renderSetupScreen()}
        {!isVerified && step === 'verify' && renderVerifyScreen()}
        {isVerified && renderSuccessScreen()}
      </div>
    </div>
  );
};

export default TwoFactorAuth;