import React, { useState, useEffect } from 'react'

export default function ContactGroups({ 
  groups, 
  selectedGroup, 
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
  onEditGroup 
}) {
  const [newGroupName, setNewGroupName] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editName, setEditName] = useState('')

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return
    onCreateGroup(newGroupName.trim())
    setNewGroupName('')
    setIsAddingGroup(false)
  }

  const handleStartEdit = (group) => {
    setEditingGroup(group.id)
    setEditName(group.name)
  }

  const handleConfirmEdit = () => {
    if (!editName.trim() || !editingGroup) return
    onEditGroup(editingGroup, editName.trim())
    setEditingGroup(null)
    setEditName('')
  }

  const handleCancelEdit = () => {
    setEditingGroup(null)
    setEditName('')
  }

  return (
    <div className="mb-4 pb-3 border-b border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Groups
          <span className="ml-1 text-xs text-gray-400">({groups.length})</span>
        </h2>
        {!isAddingGroup && (
          <button 
            onClick={() => setIsAddingGroup(true)}
            className="text-xs py-1 px-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors"
          >
            + Add Group
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <button 
          onClick={() => onSelectGroup(null)} 
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5
            ${!selectedGroup 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-[#1b1b1b] text-gray-300 hover:bg-[#222]'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
          All Contacts
        </button>
        
        {groups.map(group => (
          <div key={group.id} className="relative group">
            {editingGroup === group.id ? (
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#1b1b1b] border border-emerald-500 rounded-lg text-xs px-2 py-1 w-24 outline-none"
                  autoFocus
                />
                <button 
                  onClick={handleConfirmEdit}
                  className="text-emerald-400 p-1 hover:text-emerald-300"
                >
                  ✓
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="text-gray-400 p-1 hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => onSelectGroup(group.id)} 
                  className={`px-2 py-1 rounded-lg text-xs 
                    ${selectedGroup === group.id 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-[#1b1b1b] text-gray-300 hover:bg-[#222]'}`}
                >
                  {group.name} <span className="text-[10px] text-gray-400">({group.count || 0})</span>
                </button>
                <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(group);
                    }}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-700 text-[10px] text-white hover:bg-gray-600"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup(group.id);
                    }}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-red-900 text-[10px] text-white hover:bg-red-800"
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {isAddingGroup && (
        <div className="flex flex-col gap-2 mt-2 bg-[#1a1a1a] p-3 rounded-lg border border-emerald-500/20">
          <input 
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400"
            autoFocus
          />
          <div className="flex gap-2">
            <button 
              onClick={handleAddGroup}
              className="flex-1 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
              disabled={!newGroupName.trim()}
            >
              Create Group
            </button>
            <button 
              onClick={() => {
                setNewGroupName('');
                setIsAddingGroup(false);
              }}
              className="px-3 py-1.5 bg-[#2a2a2a] text-gray-300 hover:bg-[#333] text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}