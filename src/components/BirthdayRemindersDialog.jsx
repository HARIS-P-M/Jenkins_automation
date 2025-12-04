import React, { useState, useEffect } from 'react'

export default function BirthdayRemindersDialog({ 
  open,
  onClose,
  contacts,
  onUpdateContact
}) {
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([])
  
  useEffect(() => {
    if (open) {
      calculateUpcomingBirthdays()
    }
  }, [open, contacts])
  
  const calculateUpcomingBirthdays = () => {
    const today = new Date()
    const filteredContacts = contacts.filter(contact => contact.birthday)
    
    // Calculate days until birthday for each contact
    const contactsWithDays = filteredContacts.map(contact => {
      const birthday = new Date(contact.birthday)
      
      // Set birthday to current year
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
      
      // If birthday has passed this year, calculate for next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }
      
      const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24))
      const age = today.getFullYear() - birthday.getFullYear() - 
                  (today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate()) ? 1 : 0)
                  
      return {
        ...contact,
        daysUntil,
        upcomingAge: age + 1,
        formattedBirthday: formatDate(birthday)
      }
    })
    
    // Sort by days until birthday
    const sorted = contactsWithDays.sort((a, b) => a.daysUntil - b.daysUntil)
    
    // Filter to show only upcoming birthdays (next 30 days)
    const upcoming = sorted.filter(c => c.daysUntil <= 30)
    setUpcomingBirthdays(upcoming)
  }
  
  const formatDate = (date) => {
    const options = { month: 'long', day: 'numeric' }
    return date.toLocaleDateString(undefined, options)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Upcoming Birthdays</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {upcomingBirthdays.length > 0 ? (
            <ul className="divide-y divide-white/5">
              {upcomingBirthdays.map(contact => (
                <li key={contact.id} className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-400">
                      {contact.formattedBirthday} (turning {contact.upcomingAge})
                    </div>
                  </div>
                  <div className={`text-sm rounded-full px-3 py-1 ${
                    contact.daysUntil === 0 
                      ? 'bg-rose-900/40 text-rose-300' 
                      : contact.daysUntil <= 7
                        ? 'bg-amber-900/40 text-amber-300'
                        : 'bg-emerald-900/40 text-emerald-300'
                  }`}>
                    {contact.daysUntil === 0 
                      ? 'Today!' 
                      : contact.daysUntil === 1
                        ? 'Tomorrow'
                        : `${contact.daysUntil} days`}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No upcoming birthdays in the next 30 days.</p>
              <p className="text-sm mt-2">Add birthdays to your contacts to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}