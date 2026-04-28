import React, { useMemo, useRef, useState } from 'react'
import ContactGroups from './ContactGroups.jsx'
import FilterDialog from './FilterDialog.jsx'
import { formatPhone } from '../utils/format.js'

function ActionButton({ onClick, disabled, color, icon, label, title }) {
  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none',
    slate: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
    rose: 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 dark:text-rose-400',
    emerald: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${colorClasses[color] || colorClasses.slate}`}
      aria-label={label}
      title={title}
    >
      {icon}
    </button>
  )
}

export default function ContactsList({ 
  contacts, 
  query, 
  onEdit, 
  onDelete, 
  onDial, 
  onEmail, 
  onSMS, 
  onToggleFavorite, 
  groups, 
  selectedGroup, 
  onSelectGroup, 
  onCreateGroup, 
  onDeleteGroup, 
  onEditGroup 
}) {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);

  const filteredContacts = useMemo(() => {
    let result = contacts;
    if (activeFilters) {
      result = result.filter(contact => {
        if (activeFilters.isFavorite && !contact.favorite) return false;
        if (activeFilters.groups?.length > 0) {
          if (!contact.groups || !contact.groups.some(id => activeFilters.groups.includes(id))) return false;
        }
        if (activeFilters.hasEmail && !contact.email) return false;
        if (activeFilters.hasPhone && (!contact.phones || contact.phones.length === 0)) return false;
        return true;
      });
    }
    return result;
  }, [contacts, activeFilters]);

  const sections = useMemo(() => {
    const map = new Map()
    const sorted = [...filteredContacts].sort((a, b) => a.name.localeCompare(b.name))
    
    for (const c of sorted) {
      const letter = (c.name?.[0] || '#').toUpperCase()
      const key = /[A-Z]/.test(letter) ? letter : '#'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(c)
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b))
  }, [filteredContacts])

  return (
    <div className="space-y-6">
      {/* Groups & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 overflow-x-auto no-scrollbar py-1">
          <ContactGroups
            groups={groups || []}
            selectedGroup={selectedGroup}
            onSelectGroup={onSelectGroup}
            onCreateGroup={onCreateGroup}
            onDeleteGroup={onDeleteGroup}
            onEditGroup={onEditGroup}
          />
        </div>
        <button
          onClick={() => setShowFilterDialog(true)}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-surface-card border-border-subtle text-text-secondary hover:bg-bg-hover'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* List Grid */}
      <div className="space-y-10">
        {sections.map(([letter, list]) => (
          <div key={letter} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{letter}</h2>
              <div className="flex-1 h-px bg-border-subtle"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {list.map(c => (
                <div key={c.id} className="surface-card rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="shrink-0 h-14 w-14 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold uppercase overflow-hidden border border-indigo-100 dark:border-indigo-800/30">
                      {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : c.name?.[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-text-primary truncate">{c.name}</h3>
                        <button
                          onClick={() => onToggleFavorite?.(c.id, !c.favorite)}
                          className={`shrink-0 transition-colors ${c.favorite ? 'text-amber-500' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={c.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 4.5l2.8 5.6 6.2.9-4.5 4.4 1 6.2L12 18.8 6.5 21.6l1-6.2L3 11l6.2-.9L12 4.5z"/></svg>
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{c.email || 'No email'}</p>
                      {c.phones?.[0] && <p className="text-xs font-medium text-text-muted mt-1">{formatPhone(c.phones[0])}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ActionButton color="emerald" label="Call" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3l3 3-2 2c1.5 3 4 5.5 7 7l2-2 3 3-2 3c-6-.5-12.5-7-13-13L6 3z"/></svg>} onClick={() => onDial(c)} disabled={!c.phones?.[0]} />
                      <ActionButton color="indigo" label="Email" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} onClick={() => onEmail(c)} disabled={!c.email} />
                      <ActionButton color="slate" label="SMS" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} onClick={() => onSMS(c)} disabled={!c.phones?.[0]} />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(c)} className="p-2 text-text-muted hover:text-indigo-600 transition-colors" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button onClick={() => onDelete(c)} className="p-2 text-text-muted hover:text-rose-600 transition-colors" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="text-center py-24 surface-card rounded-2xl">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h3 className="text-lg font-bold">No contacts found</h3>
            <p className="text-text-secondary text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <FilterDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApplyFilters={filters => { setActiveFilters(filters); }}
        groups={groups}
        currentFilters={activeFilters}
      />
    </div>
  )
}
