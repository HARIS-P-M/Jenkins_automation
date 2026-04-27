import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import FAB from './components/FAB.jsx'
// Note: WebRTC service is imported dynamically in handleDial to avoid circular dependencies
import ContactsList from './components/ContactsList.jsx'
import AddContact from './components/AddContact.jsx'
import EditContact from './components/EditContact.jsx'
import CallHistory from './components/CallHistory.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import DialerDialog from './components/DialerDialog.jsx'
import ImportExportDialog from './components/ImportExportDialog.jsx'
import BirthdayRemindersDialog from './components/BirthdayRemindersDialog.jsx'
import UserSettings from './components/UserSettings.jsx'
import ContactAnalytics from './components/ContactAnalytics.jsx'
import AdvancedSearchDialog from './components/AdvancedSearchDialog.jsx'
import Auth from './components/Auth.jsx'
import EmailSender from './components/EmailSender.jsx'
import SMSSender from './components/SMSSender.jsx'
import EmailInbox from './components/EmailInbox.jsx'
import SMSInbox from './components/SMSInbox.jsx'
import CreateGroupDialog from './components/CreateGroupDialog.jsx'
import {
  loadContacts,
  createContact,
  updateContact as apiUpdateContact,
  deleteContact as apiDeleteContact,
  toggleFavorite as apiToggleFavorite,
  loadCallHistory,
  logCallApi,
  seedIfEmpty,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  loadContactsByGroup,
  addContactToGroup,
  removeContactFromGroup,
} from './utils/storage.js'
import { requestNotificationPermission } from './utils/notifications.js'
import { generateId } from './utils/id.js'
import { randomCallDurationSeconds, formatPhone } from './utils/format.js'
import { getCurrentUser, setCurrentUser, clearCurrentUser } from './utils/storage.js'

const TABS = {
  CONTACTS: 'contacts',
  ADD: 'add',
  HISTORY: 'history',
  EDIT: 'edit',
  EMAIL_INBOX: 'email-inbox',
  SMS_INBOX: 'sms-inbox',
}

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.CONTACTS)
  const [contacts, setContacts] = useState([])
  const [callHistory, setCallHistory] = useState([])
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [pendingDial, setPendingDial] = useState(null)
  const [isAuthed, setIsAuthed] = useState(!!getAuthToken())
  const [currentUser, setCurrentUserState] = useState(getCurrentUser())
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showImportExport, setShowImportExport] = useState(false)
  const [showBirthdayReminders, setShowBirthdayReminders] = useState(false)
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showContactAnalytics, setShowContactAnalytics] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedSearchParams, setAdvancedSearchParams] = useState(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [showSMSDialog, setShowSMSDialog] = useState(false)
  const [smsRecipient, setSMSRecipient] = useState({ phone: '', name: '' })
  const [unreadEmailCount, setUnreadEmailCount] = useState(0)
  const [unreadSMSCount, setUnreadSMSCount] = useState(0)

  function handleLogout() {
    clearAuthToken()
    clearCurrentUser()
    setIsAuthed(false)
    setCurrentUserState(null)
    setContacts([])
    setCallHistory([])
    setQuery('')
    setActiveTab(TABS.CONTACTS)
    setEditingContact(null)
    setPendingDelete(null)
    setPendingDial(null)
    setShowImportExport(false)
    setShowUserSettings(false)
  }
  
  function handleUpdateUser(updatedUser) {
    // Update user in localStorage and state
    setCurrentUser(updatedUser)
    setCurrentUserState(updatedUser)
  }
  
  async function handleImportContacts(importedContacts) {
    try {
      if (!Array.isArray(importedContacts) || importedContacts.length === 0) {
        alert('No contacts to import')
        return
      }
      
      let successCount = 0
      let errorCount = 0
      
      // Create each contact from the imported data
      for (const contact of importedContacts) {
        try {
          // Ensure required fields exist
          const contactData = {
            name: contact.name || 'Unknown',
            email: contact.email || '',
            phones: Array.isArray(contact.phones) ? contact.phones : (contact.phone ? [contact.phone] : []),
            favorite: false,
            avatar: contact.avatar || '',
            birthday: contact.birthday || null,
            notes: contact.notes || ''
          }
          
          await createContact(contactData)
          successCount++
        } catch (contactError) {
          console.error('Failed to import contact:', contact, contactError)
          errorCount++
        }
      }
      
      // Refresh contacts list
      const freshContacts = await loadContacts()
      setContacts(freshContacts)
      
      // Show result message
      if (successCount > 0) {
        alert(`Successfully imported ${successCount} contact${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. Failed to import ${errorCount} contact${errorCount > 1 ? 's' : ''}.` : '!'}`)
      } else {
        alert('Failed to import contacts')
      }
      
      setShowImportExport(false)
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to import contacts: ' + e.message)
      }
    }
  }

  function handleApiError(e) {
    if ((e?.message || '').toLowerCase().includes('unauthorized')) {
      handleLogout()
      return true
    }
    return false
  }

  function handleAuthSuccess({ token, user }) {
    setAuthToken(token)
    setCurrentUser(user)
    setCurrentUserState(user)
    setIsAuthed(true)
  }

  useEffect(() => {
    seedIfEmpty()
  }, [])
  
  // Make createGroup function accessible from anywhere
  useEffect(() => {
    if (isAuthed) {
      window.createNewGroup = () => setShowCreateGroup(true);
      window.handleLogout = handleLogout;
      window.showImportExport = () => setShowImportExport(true);
    }
    return () => {
      window.createNewGroup = undefined;
      window.handleLogout = undefined;
      window.showImportExport = undefined;
    };
  }, [isAuthed])

  // Make createGroup function available globally for use in contact forms
  useEffect(() => {
    window.createNewGroup = () => setShowCreateGroup(true)
    return () => {
      window.createNewGroup = undefined
    }
  }, [])

  // Fetch unread message counts
  const fetchUnreadCounts = async () => {
    if (!isAuthed) return
    try {
      const token = getAuthToken()
      const [emailRes, smsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE || '/api'}/messages/email/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE || '/api'}/messages/sms/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      if (emailRes.ok) {
        const emailData = await emailRes.json()
        setUnreadEmailCount(emailData.count || 0)
      }
      
      if (smsRes.ok) {
        const smsData = await smsRes.json()
        setUnreadSMSCount(smsData.count || 0)
      }
    } catch (e) {
      console.error('Failed to fetch unread counts:', e)
    }
  }

  useEffect(() => {
    if (!isAuthed) return
    ;(async () => {
      try {
        const [cts, calls, grps] = await Promise.all([
          loadContacts(),
          loadCallHistory(),
          loadGroups(),
        ])
        setContacts(cts)
        setCallHistory(calls)
        setGroups(grps)
        
        // Fetch initial unread counts
        await fetchUnreadCounts()
      } catch (e) {
        if (!handleApiError(e)) console.error(e)
      }
    })()

    requestNotificationPermission().then(() => {})
    
    // Poll for unread counts every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [isAuthed])

  const filteredContacts = useMemo(() => {
    let filtered = contacts
    
    // Filter by group if one is selected
    if (selectedGroup) {
      filtered = filtered.filter(contact => 
        contact.groups && contact.groups.includes(selectedGroup)
      )
    }
    
    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phones || []).some(p => p.toLowerCase().includes(q))
      )
    }
    
    // Apply advanced search filters if present
    if (advancedSearchParams) {
      const params = advancedSearchParams;
      
      filtered = filtered.filter(contact => {
        // Filter by name
        if (params.name && !contact.name.toLowerCase().includes(params.name.toLowerCase())) {
          return false;
        }
        
        // Filter by email
        if (params.email && (!contact.email || !contact.email.toLowerCase().includes(params.email.toLowerCase()))) {
          return false;
        }
        
        // Filter by phone
        if (params.phone) {
          const hasMatchingPhone = (contact.phones || []).some(phone => 
            phone.includes(params.phone)
          );
          if (!hasMatchingPhone) return false;
        }
        
        // Filter by group
        if (params.group && (!contact.groups || !contact.groups.includes(params.group))) {
          return false;
        }
        
        // Filter by favorite status
        if (params.isFavorite && !contact.favorite) {
          return false;
        }
        
        // Filter by has birthday
        if (params.hasBirthday && !contact.birthday) {
          return false;
        }
        
        // Filter by birthday month
        if (params.hasBirthday && params.birthdayMonth && contact.birthday) {
          const birthdayMonth = new Date(contact.birthday).getMonth().toString();
          if (birthdayMonth !== params.birthdayMonth) {
            return false;
          }
        }
        
        // Filter by has notes
        if (params.hasNotes && (!contact.notes || contact.notes === '')) {
          return false;
        }
        
        return true;
      });
    }
    
    return filtered
  }, [contacts, query, selectedGroup, advancedSearchParams])
  
  async function handleCreateGroup(name) {
    try {
      const created = await createGroup(name)
      setGroups(prev => [...prev, created])
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to create group')
      }
    }
  }
  
  async function handleUpdateGroup(groupId, name) {
    try {
      const updated = await updateGroup(groupId, name)
      setGroups(prev => prev.map(g => g.id === groupId ? updated : g))
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to update group')
      }
    }
  }
  
  async function handleDeleteGroup(groupId) {
    try {
      await deleteGroup(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
      if (selectedGroup === groupId) {
        setSelectedGroup(null)
      }
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to delete group')
      }
    }
  }
  
  function handleSelectGroup(groupId) {
    setSelectedGroup(groupId)
  }
  
  function handleAdvancedSearch(searchParams) {
    setAdvancedSearchParams(searchParams);
    // Clear the regular search query when applying advanced search
    setQuery('');
  }
  
  function clearAdvancedSearch() {
    setAdvancedSearchParams(null);
  }

  async function handleAddContact(newContact) {
    try {
      // Remove groups from contact before API call
      const { groups: contactGroups, ...contactData } = newContact
      const created = await createContact({ favorite: false, ...contactData })
      
      // Add contact to selected groups if any
      if (contactGroups && contactGroups.length > 0) {
        for (const groupId of contactGroups) {
          await addContactToGroup(created.id, groupId)
        }
        // Refresh contact with groups
        const updatedContact = { ...created, groups: contactGroups }
        setContacts(prev => [updatedContact, ...prev])
      } else {
        setContacts(prev => [created, ...prev])
      }
      
      setActiveTab(TABS.CONTACTS)
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to save contact')
      }
    }
  }

  function handleEditContact(selectContact) {
    setEditingContact(selectContact)
    setActiveTab(TABS.EDIT)
  }

  async function handleUpdateContact(updated) {
    try {
      // Get current contact to compare groups
      const currentContact = contacts.find(c => c.id === updated.id)
      const currentGroups = currentContact?.groups || []
      const newGroups = updated.groups || []
      
      // Remove groups property before API call
      const { groups: updatedGroups, ...contactData } = updated
      const saved = await apiUpdateContact(updated.id, contactData)
      
      // Handle group changes
      const groupsToAdd = newGroups.filter(g => !currentGroups.includes(g))
      const groupsToRemove = currentGroups.filter(g => !newGroups.includes(g))
      
      // Add contact to new groups
      for (const groupId of groupsToAdd) {
        await addContactToGroup(saved.id, groupId)
      }
      
      // Remove contact from removed groups
      for (const groupId of groupsToRemove) {
        await removeContactFromGroup(saved.id, groupId)
      }
      
      // Update contact in state with groups
      const finalContact = { ...saved, groups: newGroups }
      setContacts(prev => prev.map(c => (c.id === finalContact.id ? finalContact : c)))
      setEditingContact(null)
      setActiveTab(TABS.CONTACTS)
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to update contact')
      }
    }
  }

  async function toggleFavorite(contactId, value) {
    try {
      const saved = await apiToggleFavorite(contactId, value)
      setContacts(prev => prev.map(c => (c.id === saved.id ? saved : c)))
    } catch (e) {
      if (!handleApiError(e)) console.error(e)
    }
  }

  function requestDelete(contact) {
    setPendingDelete(contact)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    try {
      await apiDeleteContact(id)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        alert('Failed to delete contact')
      }
    }
    setPendingDelete(null)
  }

  function cancelDelete() {
    setPendingDelete(null)
  }

  async function logCall(contact, phone) {
    const entry = {
      type: 'outgoing',
      contactId: contact?.id || null,
      name: contact?.name || 'Unknown',
      phone,
      timestamp: Date.now(),
      durationSeconds: randomCallDurationSeconds(25, 180),
    }
    try {
      const saved = await logCallApi(entry)
      setCallHistory(prev => [saved, ...prev])
    } catch (e) {
      if (!handleApiError(e)) {
        console.error(e)
        // optimistic fallback
        setCallHistory(prev => [{ ...entry, id: generateId() }, ...prev])
      }
    }
  }

  async function handleEmail(contact) {
    if (!contact || !contact.email) {
      alert('This contact has no email address');
      return;
    }
    
    // Show email dialog using EmailSender component
    setShowEmailDialog(true);
    setEmailRecipient(contact.email);
  }

  async function handleSMS(contact) {
    if (!contact || !contact.phones || contact.phones.length === 0) {
      alert('This contact has no phone number');
      return;
    }
    
    // Show SMS dialog using SMSSender component
    setShowSMSDialog(true);
    setSMSRecipient({ 
      phone: contact.phones[0], 
      name: contact.name 
    });
  }

  async function handleDial(contact, phone) {
    if (contact && (contact.phones?.length || 0) > 1 && !phone) {
      setPendingDial(contact)
      return
    }
    if (!phone) phone = contact?.phones?.[0]
    if (!phone) return
    
    // Log the call first
    logCall(contact, phone)
    
    // Try to initiate the call
    try {
      // Method 1: Use tel: protocol (works on mobile devices)
      const telUrl = `tel:${phone}`
      console.log('Initiating call to:', phone, 'via URL:', telUrl)
      
      // Create a temporary link and click it
      const link = document.createElement('a')
      link.href = telUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Alternative method: try window.open
      setTimeout(() => {
        try {
          window.open(telUrl, '_self')
        } catch (e) {
          console.log('window.open failed, trying location.href')
          window.location.href = telUrl
        }
      }, 100)
      
    } catch (error) {
      console.error('Failed to initiate call:', error)
      // Fallback: show a message with the number
      alert(`Call failed. Please dial ${phone} manually.`)
    }
  }

  function openEditFromDetails(target) {
    if (!target) return
    // If target has an id treat as existing contact, otherwise prefill Add screen
    if (target.id) {
      handleEditContact(target)
    } else {
      setActiveTab(TABS.ADD)
      // We don't have a prop for prefill in AddContact; a quick approach is to store a temp draft in sessionStorage or extend AddContact.
      // Keeping simple for now: the user can hit Save and select storage target.
    }
  }

  // If not authenticated, show Auth screen
  if (!isAuthed) {
    return (
      <Auth onSuccess={handleAuthSuccess} />
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Main search bar */}
      <div className="fixed top-[48px] left-0 right-0 z-40 bg-white/90 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-white/10">
        <div className="mx-auto px-3 md:px-4 py-2">
          <div className="pr-8 sm:pr-10 md:pr-12 lg:pr-16">
            <div className="relative">
              <label className="w-full flex items-center gap-2 bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-300 dark:border-white/10 px-3 py-1.5">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600 dark:text-gray-400">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                  <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    // Clear advanced search when using regular search
                    if (advancedSearchParams) clearAdvancedSearch();
                  }}
                  placeholder={`${contacts.length} contacts`}
                  className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-gray-600 dark:text-gray-500 px-1" aria-label="Clear">
                    ✕
                  </button>
                )}
                <button 
                  onClick={() => setShowAdvancedSearch(true)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  aria-label="Advanced Search"
                  title="Advanced Search"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 4h18M3 12h18M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18 7l.01.01M18 15l.01.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M6 15l.01.01M6 7l.01.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </button>
              </label>
              
              {advancedSearchParams && (
                <div className="mt-2 py-1.5 px-3 bg-[#1b1b1b] border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-emerald-400">
                    Advanced search applied
                  </span>
                  <button 
                    onClick={clearAdvancedSearch}
                    className="text-gray-400 hover:text-white ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Optional: dial suggestion if query contains a phone */}
          {(() => {
            const digits = (query || '').replace(/[^0-9+]/g, '')
            if (digits.length >= 3) {
              return (
                <button
                  onClick={() => handleDial(null, digits)}
                  className="w-full text-left text-emerald-400 text-sm"
                >
                  Call {formatPhone(digits)}
                </button>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Add top padding so content is not hidden behind fixed header */}
      <main className="flex-1 overflow-y-auto pb-28 pt-[65px] safe-area-bottom">
        {activeTab === TABS.CONTACTS && (
          <div>
            <ContactsList
              contacts={filteredContacts}
              totalCount={contacts.length}
              query={query}
              onQueryChange={setQuery}
              onEdit={handleEditContact}
              onDelete={requestDelete}
              onDial={handleDial}
              onEmail={handleEmail}
              onSMS={handleSMS}
              onToggleFavorite={toggleFavorite}
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={handleSelectGroup}
              onCreateGroup={handleCreateGroup}
              onDeleteGroup={handleDeleteGroup}
              onEditGroup={handleUpdateGroup}
            />
          </div>
        )}

        {activeTab === TABS.ADD && (
          <AddContact 
            onCancel={() => setActiveTab(TABS.CONTACTS)} 
            onSave={handleAddContact} 
            allGroups={groups}
          />
        )}

        {activeTab === TABS.EDIT && editingContact && (
          <EditContact
            contact={editingContact}
            onCancel={() => {
              setEditingContact(null)
              setActiveTab(TABS.CONTACTS)
            }}
            onSave={handleUpdateContact}
            allGroups={groups}
          />
        )}

        {activeTab === TABS.HISTORY && (
          <CallHistory
            callHistory={callHistory}
            contacts={contacts}
            onDial={handleDial}
            onOpenDetails={openEditFromDetails}
            onToggleFavorite={toggleFavorite}
          />
        )}
        
        {activeTab === TABS.EMAIL_INBOX && (
          <EmailInbox
            onClose={() => setActiveTab(TABS.CONTACTS)}
            onReply={(to) => {
              setEmailRecipient(to)
              setShowEmailDialog(true)
            }}
            onMessageRead={fetchUnreadCounts}
          />
        )}
        
        {activeTab === TABS.SMS_INBOX && (
          <SMSInbox
            onClose={() => setActiveTab(TABS.CONTACTS)}
            onReply={(phone, name) => {
              setSMSRecipient({ phone, name })
              setShowSMSDialog(true)
            }}
            onMessageRead={fetchUnreadCounts}
          />
        )}
      </main>

      <Navbar
        active={activeTab}
        onChange={setActiveTab}
        tabs={TABS}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowUserSettings={() => setShowUserSettings(true)}
        onShowBirthdayReminders={() => setShowBirthdayReminders(true)}
        onShowContactAnalytics={() => setShowContactAnalytics(true)}
        unreadEmailCount={unreadEmailCount}
        unreadSMSCount={unreadSMSCount}
        onShowImportExport={() => setShowImportExport(true)}
      />

      {activeTab !== TABS.ADD && activeTab !== TABS.HISTORY && (
        <FAB ariaLabel="Add contact" onClick={() => setActiveTab(TABS.ADD)} />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete contact?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <DialerDialog
        open={!!pendingDial}
        contact={pendingDial}
        onClose={() => setPendingDial(null)}
        onDial={(phone) => {
          setPendingDial(null)
          handleDial(pendingDial, phone)
        }}
      />
      
      <ImportExportDialog
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
        onImport={handleImportContacts}
        onExport={() => {}}
        contacts={contacts}
      />
      
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
      />
      
      <BirthdayRemindersDialog
        open={showBirthdayReminders}
        onClose={() => setShowBirthdayReminders(false)}
        contacts={contacts}
        onUpdateContact={handleUpdateContact}
      />
      
      {showUserSettings && (
        <UserSettings 
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onClose={() => setShowUserSettings(false)}
        />
      )}
      
      {showContactAnalytics && (
        <ContactAnalytics
          contacts={contacts}
          groups={groups}
          onClose={() => setShowContactAnalytics(false)}
        />
      )}
      
      <AdvancedSearchDialog
        open={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
        groups={groups}
      />
      
      {showEmailDialog && (
        <EmailSender
          recipient={emailRecipient}
          onClose={() => setShowEmailDialog(false)}
        />
      )}
      
      {showSMSDialog && (
        <SMSSender
          recipient={smsRecipient.phone}
          recipientName={smsRecipient.name}
          onClose={() => setShowSMSDialog(false)}
        />
      )}
    </div>
  )
}