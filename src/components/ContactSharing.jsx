import React, { useState } from 'react';
import { formatPhone } from '../utils/format.js';

const ContactSharing = ({ contact, onClose }) => {
  const [shareMethod, setShareMethod] = useState('link'); // 'link', 'email', 'qrcode'
  const [copied, setCopied] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Generate vCard data for the contact
  const generateVCard = () => {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    // Add name
    vcard += `FN:${contact.name}\n`;
    
    // Add email if available
    if (contact.email) {
      vcard += `EMAIL;TYPE=INTERNET:${contact.email}\n`;
    }
    
    // Add phones if available
    if (contact.phones && contact.phones.length > 0) {
      contact.phones.forEach((phone, index) => {
        vcard += `TEL;TYPE=${index === 0 ? 'CELL' : 'WORK'}:${phone}\n`;
      });
    }
    
    // Add birthday if available
    if (contact.birthday) {
      const date = new Date(contact.birthday);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      vcard += `BDAY:${year}${month}${day}\n`;
    }
    
    // Add notes if available
    if (contact.notes) {
      vcard += `NOTE:${contact.notes.replace(/\n/g, '\\n')}\n`;
    }
    
    vcard += 'END:VCARD';
    return vcard;
  };
  
  const vcardData = generateVCard();
  
  // Create a data URL for the vCard
  const vcardURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardData)}`;
  
  const handleCopyLink = () => {
    // In a real app, this would generate a shareable link
    // For this demo, we'll just copy the vCard data to the clipboard
    navigator.clipboard.writeText(vcardData)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };
  
  const handleEmailShare = () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    
    // In a real app, this would send the email with the vCard
    // For this demo, we'll just simulate a successful email send
    setTimeout(() => {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }, 1000);
  };
  
  const handleDownload = () => {
    // Create a temporary link element and trigger download
    const element = document.createElement('a');
    element.setAttribute('href', vcardURL);
    element.setAttribute('download', `${contact.name.replace(/\s+/g, '_')}.vcf`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const generateQRCode = () => {
    // Placeholder for QR code image
    // In a real app, we would use a QR code generation library
    return (
      <div className="bg-white p-6 rounded-lg text-center">
        <div className="w-48 h-48 mx-auto bg-[#121212] flex items-center justify-center mb-2">
          <div className="text-xs text-gray-400">
            QR Code Placeholder<br />
            (In a real app, a QR code would be generated here)
          </div>
        </div>
        <div className="text-black text-sm mt-2">Scan with a QR code reader</div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] rounded-3xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Share Contact</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Contact preview */}
          <div className="bg-[#121212] rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden bg-neutral-700/60 grid place-items-center text-lg">
              {contact.avatar ? (
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300">👤</span>
              )}
            </div>
            <div>
              <h3 className="font-medium">{contact.name}</h3>
              <div className="text-sm text-gray-400">
                {contact.phones && contact.phones.length > 0 ? (
                  <div>{formatPhone(contact.phones[0])}</div>
                ) : (
                  <div>{contact.email || 'No contact info'}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Share method tabs */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setShareMethod('link')}
              className={`flex-1 py-2 text-center text-sm ${
                shareMethod === 'link' 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-gray-400'
              }`}
            >
              Copy Link
            </button>
            <button
              onClick={() => setShareMethod('email')}
              className={`flex-1 py-2 text-center text-sm ${
                shareMethod === 'email' 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-gray-400'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setShareMethod('qrcode')}
              className={`flex-1 py-2 text-center text-sm ${
                shareMethod === 'qrcode' 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-gray-400'
              }`}
            >
              QR Code
            </button>
          </div>
          
          {/* Share content based on method */}
          <div>
            {shareMethod === 'link' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Copy a link to share this contact information with others.
                </p>
                <button
                  onClick={handleCopyLink}
                  className={`w-full py-2 px-4 rounded-lg ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-[#1b1b1b] hover:bg-[#222] text-white'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy vCard Data'}
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full py-2 px-4 bg-[#1b1b1b] hover:bg-[#222] rounded-lg text-white mt-2"
                >
                  Download .vcf File
                </button>
              </div>
            )}
            
            {shareMethod === 'email' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Send this contact information via email.
                </p>
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                  {emailError && (
                    <p className="text-xs text-rose-400">{emailError}</p>
                  )}
                </div>
                <button
                  onClick={handleEmailShare}
                  disabled={emailSent}
                  className={`w-full py-2 px-4 rounded-lg ${
                    emailSent 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-[#1b1b1b] hover:bg-[#222] text-white'
                  }`}
                >
                  {emailSent ? 'Email Sent!' : 'Send Email'}
                </button>
              </div>
            )}
            
            {shareMethod === 'qrcode' && (
              <div className="flex flex-col items-center justify-center py-2">
                {generateQRCode()}
                <p className="text-sm text-gray-400 mt-4 text-center">
                  Show this QR code to share your contact information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSharing;