import { useState } from 'react';

const TwoFactorAuth = ({ onClose, onVerify }) => {
  const [step, setStep] = useState('setup'); // setup, verify
  const [method, setMethod] = useState(''); // email, app
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  const generateSecret = () => {
    // In production, this should be done on the server
    const randomBytes = new Uint8Array(20);
    window.crypto.getRandomValues(randomBytes);
    const secret = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    // Format as xxxx-xxxx-xxxx-xxxx-xxxx
    const formattedSecret = secret.match(/.{1,4}/g).join('-');
    setSecret(formattedSecret);
    return formattedSecret;
  };
  
  const handleSelectMethod = (selectedMethod) => {
    setMethod(selectedMethod);
    if (selectedMethod === 'app') {
      generateSecret();
    }
    setStep('verify');
  };
  
  const handleVerify = () => {
    // In a real app, this would verify the code against the secret on the server
    if (code.length === 6) {
      setIsVerified(true);
      if (onVerify) {
        onVerify({
          enabled: true,
          method,
          secret: method === 'app' ? secret : null,
        });
      }
    }
  };
  
  const handleDisable = () => {
    setIsVerified(false);
    if (onVerify) {
      onVerify({
        enabled: false,
        method: null,
        secret: null,
      });
    }
    onClose();
  };
  
  const renderSetupScreen = () => (
    <div>
      <h2 className="text-xl font-medium mb-4">Set Up Two-Factor Authentication</h2>
      <p className="mb-6 text-gray-300">
        Two-factor authentication adds an extra layer of security to your account.
      </p>
      
      <div className="space-y-4">
        <button
          onClick={() => handleSelectMethod('email')}
          className="w-full text-left bg-[#121212] hover:bg-[#171717] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">Email Authentication</div>
            <div className="text-sm text-gray-400">Receive verification codes via email</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <button
          onClick={() => handleSelectMethod('app')}
          className="w-full text-left bg-[#121212] hover:bg-[#171717] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">Authenticator App</div>
            <div className="text-sm text-gray-400">Use an app like Google Authenticator</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
  
  const renderVerifyScreen = () => (
    <div>
      <button onClick={() => setStep('setup')} className="flex items-center mb-4 text-gray-400 hover:text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      
      <h2 className="text-xl font-medium mb-4">
        {method === 'email' ? 'Email Verification' : 'Authenticator App'}
      </h2>
      
      {method === 'app' && (
        <div className="mb-6">
          <p className="mb-2 text-gray-300">
            Scan the QR code or enter this key in your authenticator app:
          </p>
          <div className="bg-white p-4 rounded-lg mb-4 text-center">
            <div className="text-gray-800 font-mono text-sm mb-2">{secret}</div>
            <div className="text-gray-600 text-xs">QR Code would appear here</div>
          </div>
        </div>
      )}
      
      {method === 'email' && (
        <p className="mb-6 text-gray-300">
          We've sent a verification code to your email address. Please enter it below.
        </p>
      )}
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Verification Code
        </label>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
          className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter 6-digit code"
        />
      </div>
      
      <button
        onClick={handleVerify}
        disabled={code.length !== 6}
        className={`w-full py-2 px-4 rounded-lg font-medium ${
          code.length === 6 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-600/50 text-white/50 cursor-not-allowed'
        }`}
      >
        Verify
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
      
      <h2 className="text-xl font-medium mb-2">Two-Factor Authentication Enabled</h2>
      <p className="mb-6 text-gray-300">
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] rounded-3xl w-full max-w-md p-6 shadow-xl">
        {!isVerified && step === 'setup' && renderSetupScreen()}
        {!isVerified && step === 'verify' && renderVerifyScreen()}
        {isVerified && renderSuccessScreen()}
      </div>
    </div>
  );
};

export default TwoFactorAuth;