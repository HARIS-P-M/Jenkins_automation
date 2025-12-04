import React, { useState } from 'react'
import PhoneNumbersInput from './PhoneNumbersInput.jsx'
import AvatarPicker from './AvatarPicker.jsx'

export default function ContactForm({
  initial = { name: '', email: '', phones: [''], avatar: '', groups: [], birthday: '', notes: '' },
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  formId,
  showFooter = true,
  allGroups = [],
}) {
  const [name, setName] = useState(initial.name || '')
  const [email, setEmail] = useState(initial.email || '')
  const [phones, setPhones] = useState(initial.phones?.length ? initial.phones : [''])
  const [avatar, setAvatar] = useState(initial.avatar || '')
  const [selectedGroups, setSelectedGroups] = useState(initial.groups || [])
  const [birthday, setBirthday] = useState(initial.birthday ? formatDateForInput(initial.birthday) : '')
  const [notes, setNotes] = useState(initial.notes || '')
  
  // Format date for input field (YYYY-MM-DD)
  function formatDateForInput(dateStr) {
    const date = new Date(dateStr)
    return date && !isNaN(date.getTime())
      ? date.toISOString().split('T')[0]
      : ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    const cleaned = phones.map(p => p.trim()).filter(Boolean)
    onSubmit({ 
      name: name.trim(), 
      email: email.trim(), 
      phones: cleaned, 
      avatar, 
      groups: selectedGroups, 
      birthday: birthday ? new Date(birthday) : null,
      notes: notes.trim()
    })
  }
  
  function toggleGroup(groupId) {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId))
    } else {
      setSelectedGroups([...selectedGroups, groupId])
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="px-4 pt-3 pb-6 space-y-5 max-w-md mx-auto w-full">
      <div className="rounded-2xl p-4 sm:p-5 border border-white/10 bg-[#111] shadow-lg space-y-5">
        <AvatarPicker value={avatar} onChange={setAvatar} />

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-[#1b1b1b] text-white border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-[#1b1b1b] text-white border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Phone numbers</label>
          <div className="bg-[#1b1b1b] border border-white/10 rounded-xl p-3">
            <PhoneNumbersInput phones={phones} onChange={setPhones} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Groups</label>
            {allGroups.length > 0 && (
              <span className="text-xs text-gray-400">
                {selectedGroups.length} selected
              </span>
            )}
          </div>
          <div className="bg-[#1b1b1b] border border-white/10 rounded-xl p-3">
            {allGroups.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-sm text-gray-500 mb-3">No groups available</p>
                <button
                  type="button"
                  onClick={() => window.createNewGroup && window.createNewGroup()}
                  className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Create your first group
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allGroups.map(group => (
                    <button 
                      key={group.id} 
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedGroups.includes(group.id) 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => window.createNewGroup && window.createNewGroup()}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    + Add New Group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Birthday</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full bg-[#1b1b1b] text-white border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 transition-colors"
          />
          <p className="text-xs text-gray-500">Birthday reminders will be shown for upcoming birthdays</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add personal notes about this contact"
            className="w-full bg-[#1b1b1b] text-white border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-500 min-h-[100px] resize-y"
          />
        </div>
      </div>

      {showFooter && (
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 h-12 rounded-xl border border-white/15 text-gray-300 active:scale-[0.98]">
            Cancel
          </button>
          <button type="submit" className="flex-1 h-12 rounded-xl bg-emerald-500 text-white active:scale-[0.98]">
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  )
}
