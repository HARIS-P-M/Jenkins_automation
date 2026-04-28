import React, { useMemo, useRef, useState } from 'react'
import AlphaIndexBar from './AlphaIndexBar.jsx'
import ContactGroups from './ContactGroups.jsx'
import FilterDialog from './FilterDialog.jsx'
import { formatPhone } from '../utils/format.js'

function ActionButton({ onClick, disabled, color, icon, label, title }) {
  const colorClasses = {
    emerald: 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600',
    blue: 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700',
    purple: 'bg-purple-600 shadow-purple-600/20 hover:bg-purple-700',
    green: 'bg-green-500 shadow-green-500/20 hover:bg-green-600',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 h-11 w-11 rounded-2xl text-white flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90 disabled:opacity-30 disabled:grayscale disabled:pointer-events-none ${colorClasses[color]}`}
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
  const [filtersApplied, setFiltersApplied] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!activeFilters) return contacts;
    return contacts.filter(contact => {
      if (activeFilters.isFavorite && !contact.favorite) return false;
      if (activeFilters.groups?.length > 0) {
        if (!contact.groups || !contact.groups.some(id => activeFilters.groups.includes(id))) return false;
      }
      if (activeFilters.hasEmail && !contact.email) return false;
      if (activeFilters.hasPhone && (!contact.phones || contact.phones.length === 0)) return false;
      if (activeFilters.hasNotes && !contact.notes) return false;
      if (activeFilters.hasBirthday && !contact.birthday) return false;
      return true;
    });
  }, [contacts, activeFilters]);

  const sections = useMemo(() => {
    const groups = new Map()
    const favorites = filteredContacts.filter(c => c.favorite)
    if (favorites.length > 0) groups.set('★ Favorites', favorites)
    
    const nonFavorites = filteredContacts.filter(c => !c.favorite)
    for (const c of nonFavorites) {
      const letter = (c.name?.[0] || '#').toUpperCase()
      const key = /[A-Z]/.test(letter) ? letter : '#'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(c)
    }
    return Array.from(groups.entries()).sort(([a],[b]) => {
      if (a.startsWith('★')) return -1
      if (b.startsWith('★')) return 1
      return a.localeCompare(b)
    })
  }, [filteredContacts])

  const anchorsRef = useRef({})
  function handleJump(letter) {
    const el = anchorsRef.current[letter]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="relative pt-24 pb-32">
      <div className="px-4 max-w-4xl mx-auto space-y-8">
        {/* Filters and Search Summary */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
             <div className="flex-1 overflow-x-auto no-scrollbar">
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
              className={`p-3 rounded-2xl border transition-all ${filtersApplied ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
          </div>

          {filtersApplied && (
            <div className="flex items-center justify-between p-3 bg-violet-500/5 rounded-2xl border border-violet-500/10">
              <span className="text-xs font-bold text-violet-400 tracking-wide uppercase">Filters Active • {filteredContacts.length} found</span>
              <button onClick={() => { setActiveFilters(null); setFiltersApplied(false); }} className="text-xs font-bold text-text-muted hover:text-white">Clear All</button>
            </div>
          )}
        </div>

        {/* Contact Sections */}
        <div className="space-y-12">
          {sections.map(([letter, list]) => (
            <div key={letter} className="space-y-4">
              <div ref={el => anchorsRef.current[letter] = el} className="sticky top-20 z-10 py-2 bg-[#050505]/80 backdrop-blur-md">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-text-muted border-l-2 border-violet-500 pl-3">{letter}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map(c => (
                  <div key={c.id} className="glass-card rounded-[2rem] p-5 hover-scale border-white/5 group relative overflow-hidden">
                    {/* Background Shine */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="flex gap-4 relative z-10">
                      <div className="shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 p-[1px] shadow-inner">
                        <div className="h-full w-full bg-[#0a0a0a] rounded-[0.9rem] overflow-hidden flex items-center justify-center">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-text-muted uppercase">{c.name?.[0] || '?' }</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="font-bold text-lg truncate group-hover:text-violet-400 transition-colors">{c.name}</h3>
                          <button
                            onClick={() => onToggleFavorite?.(c.id, !c.favorite)}
                            className={`p-1.5 rounded-xl hover:bg-white/5 transition-all ${c.favorite ? 'text-pink-500' : 'text-text-muted'}`}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={c.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 4.5l2.8 5.6 6.2.9-4.5 4.4 1 6.2L12 18.8 6.5 21.6l1-6.2L3 11l6.2-.9L12 4.5z"/></svg>
                          </button>
                        </div>
                        <p className="text-xs font-medium text-text-secondary truncate">{c.email || 'No email added'}</p>
                        {c.phones?.[0] && <p className="text-[11px] font-bold text-text-muted mt-1 tracking-wider">{formatPhone(c.phones[0])}</p>}
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <ActionButton color="emerald" label="Call" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3l3 3-2 2c1.5 3 4 5.5 7 7l2-2 3 3-2 3c-6-.5-12.5-7-13-13L6 3z"/></svg>} onClick={() => onDial(c, c.phones?.[0])} disabled={!c.phones?.[0]} />
                        <ActionButton color="blue" label="Email" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} onClick={() => onEmail(c)} disabled={!c.email} />
                        <ActionButton color="purple" label="SMS" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} onClick={() => onSMS(c)} disabled={!c.phones?.[0]} />
                        <ActionButton color="green" label="WhatsApp" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>} onClick={() => window.open(`https://wa.me/${c.phones[0].replace(/[^0-9+]/g, '')}`, '_blank')} disabled={!c.phones?.[0]} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => onEdit(c)} className="p-2.5 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button onClick={() => onDelete(c)} className="p-2.5 text-text-muted hover:text-pink-500 hover:bg-pink-500/5 rounded-xl transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-20 glass-card rounded-[3rem] border-white/5">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">No Contacts Found</h3>
              <p className="text-text-secondary text-sm mb-8">Try adjusting your filters or search query.</p>
              {filtersApplied && <button onClick={() => { setActiveFilters(null); setFiltersApplied(false); }} className="premium-button px-8 py-3 rounded-2xl font-bold">Clear All Filters</button>}
            </div>
          )}
        </div>
      </div>

      <AlphaIndexBar onJump={handleJump} />
      
      <FilterDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApplyFilters={filters => { setActiveFilters(filters); setFiltersApplied(true); }}
        groups={groups}
        currentFilters={activeFilters}
      />
    </div>
  )
}

