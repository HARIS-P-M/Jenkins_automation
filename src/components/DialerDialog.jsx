import { useState, useEffect, useRef } from 'react';
import webRTCService from '../utils/webrtc.mjs';

// Call icon SVG
function CallIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3l3 3-2 2c1.5 3 4 5.5 7 7l2-2 3 3-2 3c-6-.5-12.5-7-13-13L6 3z" />
    </svg>
  );
}

// End call icon SVG
function EndCallIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 6L18 10M18 6L22 10" />
      <path d="M6 3l3 3-2 2c1.5 3 4 5.5 7 7l2-2 3 3-2 3c-6-.5-12.5-7-13-13L6 3z" />
    </svg>
  );
}

export default function DialerDialog({ open = false, contact, onClose, onDial }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (contact?.phones?.length === 1) {
      setPhoneNumber(contact.phones[0]);
    }
  }, [contact]);

  useEffect(() => {
    // Enable audio playback on mobile devices
    const enableAudio = async () => {
      try {
        if (audioRef.current) {
          await audioRef.current.play();
          audioRef.current.pause();
        }
      } catch (err) {
        console.warn('Audio playback failed:', err);
      }
    };

    // Handle incoming call audio
    webRTCService.onCall((stream) => {
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        setIsInCall(true);
        
        // Ensure audio plays on mobile
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Autoplay prevented:', error);
            // Show a button to manually start audio if needed
          });
        }
      }
    });

    webRTCService.onHangup(() => {
      setIsInCall(false);
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    });

    // Enable audio when component mounts
    enableAudio();

    return () => {
      if (isInCall) {
        handleHangup();
      }
    };
  }, []);

  const handleDial = async () => {
    if (!phoneNumber) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      await webRTCService.makeCall(phoneNumber);
      setIsInCall(true);
    } catch (err) {
      console.warn('WebRTC call failed, falling back to native dialer:', err);
      // Fall back to native dialer
      onDial(phoneNumber);
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleHangup = () => {
    webRTCService.endCall();
    setIsInCall(false);
    setPhoneNumber('');
    setError(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">{isInCall ? 'On Call' : 'Dial Number'}</h3>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#222] flex items-center justify-center text-gray-400 hover:bg-[#333]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <audio 
          ref={audioRef} 
          autoPlay 
          playsInline
          className="hidden"
        />

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
          <input
            type="tel"
            inputMode="tel"
            autoFocus
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isInCall || isConnecting}
            placeholder="Enter phone number"
            className={`w-full bg-[#1b1b1b] border ${
              error ? 'border-rose-500' : 'border-white/10'
            } rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors`}
          />
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>

        {!isInCall ? (
          <button
            onClick={handleDial}
            disabled={isConnecting || !phoneNumber}
            className="w-full h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition-colors"
          >
            <CallIcon />
            <span>{isConnecting ? 'Connecting...' : 'Call'}</span>
          </button>
        ) : (
          <button
            onClick={handleHangup}
            className="w-full h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors"
          >
            <EndCallIcon />
            <span>End Call</span>
          </button>
        )}
        
        {isInCall && (
          <div className="mt-4 text-center">
            <p className="text-sm text-emerald-500 animate-pulse">
              Call in progress...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
