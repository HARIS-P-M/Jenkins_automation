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
    setCurrentUser(updatedUser)
    setCurrentUserState(updatedUser)
  }

  useEffect(() => {
    window.onUserUpdate = handleUpdateUser;
    return () => { window.onUserUpdate = undefined; };
  }, []);
  
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
      
      // Directly open without timeout to maintain user gesture
      window.location.href = telUrl
      
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
      <Auth onAuthSuccess={handleAuthSuccess} />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-main transition-colors duration-200">
      <Navbar
        active={activeTab}
        onChange={setActiveTab}
        tabs={TABS}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowBirthdayReminders={() => setShowBirthdayReminders(true)}
        onShowContactAnalytics={() => setShowContactAnalytics(true)}
        onShowImportExport={() => setShowImportExport(true)}
        unreadEmailCount={unreadEmailCount}
        unreadSMSCount={unreadSMSCount}
      />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-40">
        {/* Page Content Header with Search */}
        <div className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {activeTab === TABS.CONTACTS && 'My Contacts'}
              {activeTab === TABS.ADD && 'Add New Contact'}
              {activeTab === TABS.EDIT && 'Edit Contact'}
              {activeTab === TABS.HISTORY && 'Recent Activity'}
              {activeTab === TABS.EMAIL_INBOX && 'Email Inbox'}
              {activeTab === TABS.SMS_INBOX && 'Message Inbox'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {activeTab === TABS.CONTACTS && `You have ${contacts.length} contacts saved.`}
            </p>
          </div>

          {activeTab === TABS.CONTACTS && (
            <div className="flex items-center gap-2 w-full md:w-auto max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (advancedSearchParams) clearAdvancedSearch(); }}
                  placeholder="Search contacts..."
                  className="input-field pl-10"
                />
              </div>
              <button 
                onClick={() => setShowAdvancedSearch(true)}
                className={`p-2.5 rounded-lg border border-border-subtle hover:bg-bg-hover transition-colors ${advancedSearchParams ? 'text-indigo-600 border-indigo-600/30 bg-indigo-50 dark:bg-indigo-900/10' : 'text-text-secondary'}`}
                title="Advanced Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
              </button>
            </div>
          )}
        </div>

        {advancedSearchParams && (
          <div className="mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-lg flex items-center justify-between text-xs font-medium text-indigo-700 dark:text-indigo-400">
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Advanced Search Active
            </span>
            <button onClick={clearAdvancedSearch} className="hover:underline">Clear Filters</button>
          </div>
        )}

        {/* View Content */}
        <div className="flex-1 animate-slide-up">
          {activeTab === TABS.CONTACTS && (
            <ContactsList
              contacts={filteredContacts}
              query={query}
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
          )}

          {activeTab === TABS.ADD && (
            <div className="max-w-2xl">
              <AddContact onCancel={() => setActiveTab(TABS.CONTACTS)} onSave={handleAddContact} allGroups={groups} />
            </div>
          )}

          {activeTab === TABS.EDIT && editingContact && (
            <div className="max-w-2xl">
              <EditContact contact={editingContact} onCancel={() => { setEditingContact(null); setActiveTab(TABS.CONTACTS); }} onSave={handleUpdateContact} allGroups={groups} />
            </div>
          )}

          {activeTab === TABS.HISTORY && (
            <CallHistory callHistory={callHistory} contacts={contacts} onDial={handleDial} onOpenDetails={openEditFromDetails} onToggleFavorite={toggleFavorite} />
          )}
          
          {activeTab === TABS.EMAIL_INBOX && (
            <EmailInbox onClose={() => setActiveTab(TABS.CONTACTS)} onReply={(to) => { setEmailRecipient(to); setShowEmailDialog(true); }} onMessageRead={fetchUnreadCounts} />
          )}
          
          {activeTab === TABS.SMS_INBOX && (
            <SMSInbox onClose={() => setActiveTab(TABS.CONTACTS)} onReply={(phone, name) => { setSMSRecipient({ phone, name }); setShowSMSDialog(true); }} onMessageRead={fetchUnreadCounts} />
          )}
        </div>
      </main>

      {activeTab !== TABS.ADD && activeTab !== TABS.HISTORY && (
        <button 
          onClick={() => setActiveTab(TABS.ADD)}
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center"
          aria-label="Add Contact"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete Contact" description={`Are you sure you want to delete ${pendingDelete?.name}? This action is permanent.`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} onCancel={cancelDelete} />
      <DialerDialog open={!!pendingDial} contact={pendingDial} onClose={() => setPendingDial(null)} onDial={(phone) => { setPendingDial(null); handleDial(pendingDial, phone); }} />
      <ImportExportDialog open={showImportExport} onClose={() => setShowImportExport(false)} onImport={handleImportContacts} onExport={() => {}} contacts={contacts} />
      <CreateGroupDialog open={showCreateGroup} onClose={() => setShowCreateGroup(false)} onCreateGroup={handleCreateGroup} />
      <BirthdayRemindersDialog open={showBirthdayReminders} onClose={() => setShowBirthdayReminders(false)} contacts={contacts} onUpdateContact={handleUpdateContact} />
      <ContactAnalytics open={showContactAnalytics} onClose={() => setShowContactAnalytics(false)} contacts={contacts} groups={groups} callHistory={callHistory} />
      <AdvancedSearchDialog open={showAdvancedSearch} onClose={() => setShowAdvancedSearch(false)} onSearch={handleAdvancedSearch} groups={groups} />
      
      {showEmailDialog && <EmailSender open={showEmailDialog} onClose={() => setShowEmailDialog(false)} initialRecipient={emailRecipient} />}
      {showSMSDialog && <SMSSender open={showSMSDialog} onClose={() => setShowSMSDialog(false)} recipient={smsRecipient.phone} recipientName={smsRecipient.name} />}
    </div>
  )
}