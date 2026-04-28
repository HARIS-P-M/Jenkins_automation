import React from 'react'
import ContactForm from './ContactForm.jsx'

export default function EditContact({ contact, onCancel, onSave, allGroups = [] }) {
  if (!contact) return null

  return (
    <div className="animate-slide-up">
      <ContactForm
        initial={contact}
        onCancel={onCancel}
        onSubmit={(data) => onSave({ id: contact.id, ...data })}
        submitLabel="Update Contact"
        allGroups={allGroups}
      />
    </div>
  )
}
