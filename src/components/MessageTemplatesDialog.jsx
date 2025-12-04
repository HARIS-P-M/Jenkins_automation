import React, { useState, useEffect } from 'react'

export default function MessageTemplatesDialog({ 
  open,
  onClose,
  onSendMessage,
  contact
}) {
  const [templates, setTemplates] = useState([])
  const [newTemplate, setNewTemplate] = useState('')
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editText, setEditText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Load templates from localStorage
  useEffect(() => {
    if (open) {
      try {
        const savedTemplates = JSON.parse(localStorage.getItem('message_templates') || '[]')
        setTemplates(savedTemplates)
      } catch (e) {
        console.error('Failed to load templates:', e)
        setTemplates([])
      }
    }
  }, [open])
  
  // Save templates to localStorage
  const saveTemplates = (updatedTemplates) => {
    try {
      localStorage.setItem('message_templates', JSON.stringify(updatedTemplates))
      setTemplates(updatedTemplates)
    } catch (e) {
      console.error('Failed to save templates:', e)
    }
  }
  
  // Add a new template
  const handleAddTemplate = () => {
    if (!newTemplate.trim()) return
    
    const template = {
      id: Date.now().toString(),
      text: newTemplate.trim()
    }
    
    const updated = [...templates, template]
    saveTemplates(updated)
    setNewTemplate('')
  }
  
  // Start editing a template
  const handleStartEdit = (template) => {
    setEditingTemplate(template.id)
    setEditText(template.text)
  }
  
  // Save edited template
  const handleSaveEdit = () => {
    if (!editText.trim() || !editingTemplate) return
    
    const updated = templates.map(t => 
      t.id === editingTemplate ? { ...t, text: editText.trim() } : t
    )
    
    saveTemplates(updated)
    setEditingTemplate(null)
    setEditText('')
  }
  
  // Delete a template
  const handleDeleteTemplate = (templateId) => {
    const updated = templates.filter(t => t.id !== templateId)
    saveTemplates(updated)
  }
  
  // Use a template to send message
  const handleUseTemplate = (template) => {
    if (!contact) return
    
    // Replace placeholders with contact info
    let message = template.text
    if (contact.name) {
      message = message.replace(/\{name\}/g, contact.name)
    }
    if (contact.email) {
      message = message.replace(/\{email\}/g, contact.email)
    }
    
    onSendMessage(message, contact)
    onClose()
  }
  
  // Filter templates by search query
  const filteredTemplates = templates.filter(template => 
    template.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Message Templates</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        
        <div className="p-2 max-h-[40vh] overflow-y-auto">
          {filteredTemplates.length > 0 ? (
            <ul className="divide-y divide-white/5">
              {filteredTemplates.map(template => (
                <li key={template.id} className="py-2 px-2">
                  {editingTemplate === template.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-2 min-h-[80px] outline-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="px-3 py-1 text-sm rounded-lg bg-[#2a2a2a] text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 text-sm rounded-lg bg-emerald-500 text-white"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap pr-2">{template.text}</p>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="p-1.5 text-xs rounded-lg bg-emerald-500 text-white"
                          title="Use template"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleStartEdit(template)}
                          className="p-1.5 text-xs rounded-lg bg-[#2a2a2a] text-gray-300"
                          title="Edit template"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-xs rounded-lg bg-[#2a2a2a] text-gray-300"
                          title="Delete template"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : searchQuery ? (
            <div className="text-center py-6 text-gray-400">
              <p>No templates match your search.</p>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>No templates yet.</p>
              <p className="text-sm mt-2">Create your first template below.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/10">
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">New Template</label>
            <textarea
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              placeholder="Type a message template... Use {name} to insert contact name"
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-2 min-h-[80px] outline-none"
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Variables: {"{name}"}, {"{email}"}
              </div>
              <button
                onClick={handleAddTemplate}
                disabled={!newTemplate.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white disabled:opacity-50"
              >
                Add Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}