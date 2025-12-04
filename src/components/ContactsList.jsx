import React, { useMemo, useRef, useState } from 'react'
import AlphaIndexBar from './AlphaIndexBar.jsx'
import ContactGroups from './ContactGroups.jsx'
import FilterDialog from './FilterDialog.jsx'
import { formatPhone } from '../utils/format.js'

function CallButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center active:scale-95 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20"
      aria-label="Call"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 3l3 3-2 2c1.5 3 4 5.5 7 7l2-2 3 3-2 3c-6-.5-12.5-7-13-13L6 3z" fill="currentColor"/>
      </svg>
    </button>
  )
}

function EmailButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
      aria-label="Email"
      title={disabled ? 'No email address available' : 'Send email'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    </button>
  )
}

function SMSButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/20 active:scale-95 disabled:opacity-50 disabled:hover:bg-purple-600 disabled:cursor-not-allowed"
      aria-label="SMS"
      title={disabled ? 'No phone number available' : 'Send SMS'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function WhatsAppButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20 active:scale-95 disabled:opacity-50 disabled:hover:bg-green-500 disabled:cursor-not-allowed"
      aria-label="WhatsApp"
      title={disabled ? 'No phone number available' : 'Open in WhatsApp'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </button>
  )
}

export default function ContactsList({ contacts, totalCount, query, onQueryChange, onEdit, onDelete, onDial, onEmail, onSMS, onToggleFavorite, groups, selectedGroup, onSelectGroup, onCreateGroup, onDeleteGroup, onEditGroup }) {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  // Apply advanced filters to contacts
  const filteredContacts = useMemo(() => {
    if (!activeFilters) return contacts;
    
    return contacts.filter(contact => {
      // Filter by favorite status
      if (activeFilters.isFavorite && !contact.favorite) {
        return false;
      }
      
      // Filter by groups
      if (activeFilters.groups?.length > 0) {
        if (!contact.groups || !contact.groups.some(groupId => activeFilters.groups.includes(groupId))) {
          return false;
        }
      }
      
      // Filter by has email
      if (activeFilters.hasEmail && (!contact.email || contact.email === '')) {
        return false;
      }
      
      // Filter by has phone
      if (activeFilters.hasPhone && (!contact.phones || contact.phones.length === 0)) {
        return false;
      }
      
      // Filter by has notes
      if (activeFilters.hasNotes && (!contact.notes || contact.notes === '')) {
        return false;
      }
      
      // Filter by has birthday
      if (activeFilters.hasBirthday && !contact.birthday) {
        return false;
      }
      
      // Filter by birthday month
      if (activeFilters.hasBirthday && activeFilters.birthdayMonth !== '' && contact.birthday) {
        const birthdayDate = new Date(contact.birthday);
        const birthdayMonth = birthdayDate.getMonth().toString();
        if (birthdayMonth !== activeFilters.birthdayMonth) {
          return false;
        }
      }
      
      return true;
    });
  }, [contacts, activeFilters]);
  
  const handleApplyFilters = (filters) => {
    // Check if any filter is active
    const hasActiveFilters = 
      filters.groups?.length > 0 ||
      filters.hasBirthday ||
      filters.hasEmail ||
      filters.hasPhone ||
      filters.hasNotes ||
      filters.isFavorite;
    
    setActiveFilters(filters);
    setFiltersApplied(hasActiveFilters);
  };
  
  const clearFilters = () => {
    setActiveFilters(null);
    setFiltersApplied(false);
  };
  
  const sections = useMemo(() => {
    const groups = new Map()
    // Add favorites section first
    const favorites = filteredContacts.filter(c => c.favorite)
    if (favorites.length > 0) {
      groups.set('★', favorites)
    }
    
    // Group remaining contacts by first letter
    const nonFavorites = filteredContacts.filter(c => !c.favorite)
    for (const c of nonFavorites) {
      const letter = (c.name?.[0] || '#').toUpperCase()
      const key = /[A-Z]/.test(letter) ? letter : '#'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(c)
    }
    return Array.from(groups.entries()).sort(([a],[b]) => {
      if (a === '★') return -1
      if (b === '★') return 1
      return a.localeCompare(b)
    })
  }, [filteredContacts])

  const anchorsRef = useRef({})
  function handleJump(letter) {
    const el = anchorsRef.current[letter]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const phoneInQuery = useMemo(() => {
    const digits = (query || '').replace(/[^0-9+]/g, '')
    return digits.length >= 3 ? digits : ''
  }, [query])

  return (
    <section className="relative">
      {/* Header moved to App.jsx - keep spacer for layout consistency if needed */}
      <div className="hidden"></div>

      {/* Contact Groups and Filter Button */}
      <div className="px-4 mt-1 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <ContactGroups
              groups={groups || []}
              selectedGroup={selectedGroup}
              onSelectGroup={onSelectGroup}
              onCreateGroup={onCreateGroup}
              onDeleteGroup={onDeleteGroup}
              onEditGroup={onEditGroup}
            />
          </div>
          <div className="ml-2">
            <button
              onClick={() => setShowFilterDialog(true)}
              className={`relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm border ${filtersApplied 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-gray-100 dark:bg-[#1b1b1b] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222]'}`}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-1.5"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
              {filtersApplied && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
                  ✓
                </span>
              )}
            </button>
          </div>
        </div>
        
        {filtersApplied && (
          <div className="flex items-center justify-between py-1 px-2 bg-gray-200 dark:bg-[#171717] rounded-lg mb-2">
            <div className="text-xs text-emerald-400">
              Filters applied • {filteredContacts.length} results
            </div>
            <button 
              onClick={clearFilters}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="pb-8">{/* Add bottom padding for the last contact */}
        {/* Add right padding so items do not overlap AlphaIndexBar (≈ 20–30px) */}
        <div className="px-2 pr-8 sm:pr-10 md:pr-12 lg:pr-16 space-y-3 max-w-2xl mx-auto pb-32">
          {sections.map(([letter, list]) => (
            <div key={letter}>
              <div
                ref={(el) => (anchorsRef.current[letter] = el)}
                className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10"
              >
                {letter}
              </div>
              <ul className="space-y-2">
                {list.map((c) => (
                  <li key={c.id} className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-white/5 p-3 hover:border-gray-300 dark:hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-300 dark:bg-neutral-700/60 grid place-items-center text-sm border border-gray-400 dark:border-white/10">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300">👤</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <h3 className="font-medium truncate text-gray-900 dark:text-white">{c.name}</h3>
                            <button
                              onClick={() => onToggleFavorite && onToggleFavorite(c.id, !c.favorite)}
                              className={`shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${c.favorite ? 'text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}
                              aria-label={c.favorite ? 'Remove from favorites' : 'Add to favorites'}
                              title={c.favorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill={c.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                <path d="M12 4.5l2.8 5.6 6.2.9-4.5 4.4 1 6.2L12 18.8 6.5 21.6l1-6.2L3 11l6.2-.9L12 4.5z"/>
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEdit(c)}
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg transition-colors"
                              aria-label="Edit"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5z" stroke="currentColor" strokeWidth="1.6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDelete(c)}
                              className="text-gray-500 dark:text-gray-400 hover:text-rose-400 p-2 rounded-lg transition-colors"
                              aria-label="Delete"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M6 7h12M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="1.6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-none truncate">{c.email || 'No email'}</p>
                          {(c.phones || []).slice(0, 1).map((p, i) => (
                            <p key={i} className="text-[13px] text-gray-700 dark:text-gray-300 leading-none">{formatPhone(p)}</p>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <WhatsAppButton
                          onClick={() => {
                            const phone = (c.phones || [])[0];
                            if (phone) {
                              // Remove all non-numeric characters except +
                              const cleanPhone = phone.replace(/[^0-9+]/g, '');
                              // Open WhatsApp Web or mobile app
                              window.open(`https://wa.me/${cleanPhone}`, '_blank');
                            }
                          }}
                          disabled={!c.phones || c.phones.length === 0}
                        />
                        <SMSButton 
                          onClick={() => {
                            if (typeof onSMS === 'function') {
                              onSMS(c);
                            }
                          }} 
                          disabled={!c.phones || c.phones.length === 0} 
                        />
                        <EmailButton 
                          onClick={() => {
                            if (typeof onEmail === 'function') {
                              onEmail(c);
                            } else if (c.email) {
                              window.location.href = `mailto:${c.email}`;
                            }
                          }} 
                          disabled={!c.email} 
                        />
                        <CallButton onClick={() => onDial(c, (c.phones || [])[0])} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              {filtersApplied 
                ? <>
                    <p>No contacts match the current filters.</p>
                    <button 
                      onClick={clearFilters}
                      className="mt-2 text-sm text-emerald-500 hover:underline"
                    >
                      Clear filters
                    </button>
                  </>
                : 'No contacts found.'}
            </div>
          )}
        </div>
      </div>

      <AlphaIndexBar onJump={handleJump} />
      
      <FilterDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApplyFilters={handleApplyFilters}
        groups={groups}
        currentFilters={activeFilters}
      />
    </section>
  )
}
