import React, { useState } from 'react'

const FORWARDING_OPTIONS = [
  { id: 'always', label: 'Always forward', code: '*21*{number}#', description: 'Forward all calls to this number' },
  { id: 'busy', label: 'When busy', code: '*67*{number}#', description: 'Forward calls when you\'re on another call' },
  { id: 'noanswer', label: 'When no answer', code: '*61*{number}#', description: 'Forward calls after 20 seconds' },
  { id: 'unreachable', label: 'When unreachable', code: '*62*{number}#', description: 'Forward when phone is off or out of service' },
]

export default function CallForwardingDialog({ open, onClose, contact }) {
  const [selectedOption, setSelectedOption] = useState('always')
  const [forwardNumber, setForwardNumber] = useState(contact?.phones?.[0] || '')

  function handleSetup() {
    const option = FORWARDING_OPTIONS.find(o => o.id === selectedOption)
    if (!option || !forwardNumber) return
    
    const code = option.code.replace('{number}', forwardNumber)
    
    // Show the USSD code to dial
    alert(`Dial this code to set up call forwarding:\n\n${code}\n\nThis will ${option.description.toLowerCase()}.`)
    
    // Optionally open the dialer with the code
    if (confirm('Open dialer with this code?')) {
      window.location.href = `tel:${code}`
    }
    
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-4 sm:p-5 shadow-xl">
        <h3 className="text-lg sm:text-xl font-semibold">Call Forwarding</h3>
        <p className="text-sm text-gray-400 mt-1">Set up call forwarding for {contact?.name || 'this contact'}</p>
        
        <div className="mt-5 space-y-3">
          {FORWARDING_OPTIONS.map(option => (
            <label 
              key={option.id} 
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                selectedOption === option.id 
                  ? 'border-emerald-500/40 bg-emerald-500/5' 
                  : 'border-white/10 hover:bg-[#1a1a1a]'
              } cursor-pointer transition-colors`}
            >
              <input
                type="radio"
                name="forwarding"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1 accent-emerald-500"
              />
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium mb-2">Forward to number</label>
          <input
            type="tel"
            value={forwardNumber}
            onChange={(e) => setForwardNumber(e.target.value)}
            placeholder="Enter phone number"
            className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="flex-1 h-11 rounded-xl border border-white/15 text-gray-300 hover:bg-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSetup}
            disabled={!forwardNumber}
            className="flex-1 h-11 rounded-xl bg-emerald-500 text-white disabled:opacity-50 hover:bg-emerald-600 transition-colors"
          >
            Setup
          </button>
        </div>
      </div>
    </div>
  )
}
