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
            className="input-field flex-1"
          />
          {list.length > 1 && (
            <button 
              type="button" 
              onClick={() => removeAt(i)} 
              className="h-10 w-10 rounded-lg border border-border-subtle bg-bg-surface text-text-muted flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors" 
              aria-label="Remove"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      ))}
      <div>
        <button 
          type="button" 
          onClick={addField} 
          className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline transition-colors flex items-center gap-1"
        >
          <span className="text-base">+</span> Add another number
        </button>
      </div>
    </div>
  )
}
