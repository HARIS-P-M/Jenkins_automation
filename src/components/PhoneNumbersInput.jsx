import React from 'react'

export default function PhoneNumbersInput({ phones, onChange }) {
  function updateAt(index, value) {
    const next = [...phones]
    next[index] = value
    onChange(next)
  }

  function addField() {
    onChange([...(phones || []), ''])
  }

  function removeAt(index) {
    const next = [...phones]
    next.splice(index, 1)
    onChange(next)
  }

  const list = phones && phones.length ? phones : ['']

  return (
    <div className="space-y-3">
      {list.map((p, i) => (
        <div key={i} className="flex items-center gap-2 w-full">
          <input
            type="tel"
            inputMode="tel"
            value={p}
            onChange={(e) => updateAt(i, e.target.value)}
            placeholder="e.g. +91 63850 78998"
            className="flex-1 w-full bg-[#101010] text-white border border-white/10 rounded-xl px-3 py-2 outline-emerald-500 placeholder:text-gray-500 focus:border-emerald-500 transition-colors"
          />
          {list.length > 1 && (
            <button 
              type="button" 
              onClick={() => removeAt(i)} 
              className="h-10 w-10 rounded-xl bg-[#161616] border border-white/10 text-gray-300 flex items-center justify-center hover:bg-[#202020] hover:text-white transition-colors" 
              aria-label="Remove"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <div>
        <button 
          type="button" 
          onClick={addField} 
          className="text-emerald-400 text-sm hover:underline transition-colors flex items-center gap-1"
        >
          <span className="text-base">+</span> Add another
        </button>
      </div>
    </div>
  )
}
