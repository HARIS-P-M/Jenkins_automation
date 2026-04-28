import React from 'react'
import ContactForm from './ContactForm.jsx'

export default function AddContact({ onCancel, onSave, allGroups = [] }) {
  return (
    <div className="animate-slide-up">
      <ContactForm onCancel={onCancel} onSubmit={onSave} submitLabel="Create Contact" allGroups={allGroups} />
    </div>
  )
}
