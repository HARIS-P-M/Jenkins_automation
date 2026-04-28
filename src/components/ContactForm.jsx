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
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <div className="surface-card rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center mb-8">
           <AvatarPicker value={avatar} onChange={setAvatar} />
           <p className="text-xs text-text-muted mt-2 uppercase font-bold tracking-widest">Profile Picture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alexander Graham Bell"
              className="input-field"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="input-field"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-text-secondary">Phone Numbers</label>
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl p-4">
              <PhoneNumbersInput phones={phones} onChange={setPhones} />
            </div>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-text-secondary">Group Assignments</label>
              <button
                type="button"
                onClick={() => window.createNewGroup?.()}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                + New Group
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl">
              {allGroups.length === 0 ? (
                <p className="text-xs text-text-muted italic w-full text-center py-2">No groups created yet</p>
              ) : (
                allGroups.map(group => (
                  <button 
                    key={group.id} 
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedGroups.includes(group.id) 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'bg-white dark:bg-slate-800 border border-border-subtle text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {group.name}
                  </button>
                ))
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">Date of Birth</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-text-secondary">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any context or notes here..."
              className="input-field min-h-[120px] resize-none"
            />
          </div>
        </div>
      </div>

      {showFooter && (
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-lg border border-border-subtle font-semibold text-text-secondary hover:bg-bg-hover transition-all">
            Cancel
          </button>
          <button type="submit" className="px-8 py-2.5 btn-primary font-bold shadow-lg shadow-indigo-600/20">
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  )
}
