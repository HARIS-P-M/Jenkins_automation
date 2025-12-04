import React from 'react'
import ContactForm from './ContactForm.jsx'

export default function EditContact({ contact, onCancel, onSave, allGroups = [] }) {
  const formId = 'edit-contact-form'
  function handleSubmit(values) {
    onSave({ ...contact, ...values })
  }
  return (
    <section className="flex flex-col min-h-0 h-full">
      <header className="px-4 pt-7 pb-5 sticky top-0 z-10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/40">
        <div className="max-w-md mx-auto flex items-center">
          <button 
            onClick={onCancel} 
            aria-label="Back" 
            className="h-10 w-10 grid place-items-center text-gray-300 hover:text-white hover:bg-white/5 rounded-full flex-shrink-0 mt-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-center flex-1 mx-auto my-3">Edit contact</h1>
          <button 
            form={formId} 
            type="submit" 
            className="px-5 h-10 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all flex-shrink-0 mt-1"
          >
            Save
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <ContactForm formId={formId} initial={contact} onCancel={onCancel} onSubmit={handleSubmit} submitLabel="Save changes" showFooter={false} allGroups={allGroups} />
      </div>
    </section>
  )
}
