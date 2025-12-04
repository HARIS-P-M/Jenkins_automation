import React, { useState, useEffect } from 'react'

export default function CreateGroupDialog({ open, onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState('')
  
  useEffect(() => {
    if (open) {
      setGroupName('')
    }
  }, [open])

  const handleCreate = () => {
    if (!groupName.trim()) return
    onCreateGroup(groupName.trim())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-5 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
        
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500">
            Groups help you organize your contacts. For example: Family, Work, Friends, etc.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 h-11 rounded-xl border border-white/15 text-gray-300 hover:bg-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!groupName.trim()}
            className="flex-1 h-11 rounded-xl bg-emerald-500 text-white disabled:opacity-50 hover:bg-emerald-600 transition-colors"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}