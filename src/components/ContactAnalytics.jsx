import React, { useMemo } from 'react';

const ContactAnalytics = ({ contacts, groups, onClose }) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    if (!contacts || contacts.length === 0) {
      return {
        total: 0,
        withEmail: 0,
        withPhone: 0,
        withBirthday: 0,
        withNotes: 0,
        withGroups: 0,
        favorites: 0,
        birthdaysByMonth: Array(12).fill(0),
        contactsByGroup: [],
        recentlyAdded: []
      };
    }

    const withEmail = contacts.filter(c => c.email && c.email !== '').length;
    const withPhone = contacts.filter(c => c.phones && c.phones.length > 0).length;
    const withBirthday = contacts.filter(c => c.birthday).length;
    const withNotes = contacts.filter(c => c.notes && c.notes !== '').length;
    const withGroups = contacts.filter(c => c.groups && c.groups.length > 0).length;
    const favorites = contacts.filter(c => c.favorite).length;
    
    // Count birthdays by month
    const birthdaysByMonth = Array(12).fill(0);
    contacts.forEach(contact => {
      if (contact.birthday) {
        const month = new Date(contact.birthday).getMonth();
        birthdaysByMonth[month]++;
      }
    });
    
    // Count contacts by group
    const contactsByGroup = groups ? groups.map(group => ({
      name: group.name,
      count: contacts.filter(c => c.groups && c.groups.includes(group.id)).length
    })) : [];
    
    // Get recently added contacts (using createdAt if available)
    const sortedContacts = [...contacts].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
    return {
      total: contacts.length,
      withEmail,
      withPhone,
      withBirthday,
      withNotes,
      withGroups,
      favorites,
      birthdaysByMonth,
      contactsByGroup,
      recentlyAdded: sortedContacts.slice(0, 5)
    };
  }, [contacts, groups]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Calculate percentages
  const emailPercent = Math.round((analytics.withEmail / analytics.total) * 100) || 0;
  const phonePercent = Math.round((analytics.withPhone / analytics.total) * 100) || 0;
  const birthdayPercent = Math.round((analytics.withBirthday / analytics.total) * 100) || 0;
  const notesPercent = Math.round((analytics.withNotes / analytics.total) * 100) || 0;
  const groupsPercent = Math.round((analytics.withGroups / analytics.total) * 100) || 0;
  const favoritesPercent = Math.round((analytics.favorites / analytics.total) * 100) || 0;
  
  // Find the current month and next month with birthdays
  const currentMonth = new Date().getMonth();
  const currentMonthBirthdays = analytics.birthdaysByMonth[currentMonth];
  
  // Find next month with birthdays
  let nextBirthdayMonth = -1;
  for (let i = 1; i <= 12; i++) {
    const month = (currentMonth + i) % 12;
    if (analytics.birthdaysByMonth[month] > 0) {
      nextBirthdayMonth = month;
      break;
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0a0a] z-10 px-6 pt-5 pb-3 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contact Analytics</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-[#121212] p-4 rounded-xl border border-white/5">
              <div className="text-2xl font-semibold">{analytics.total}</div>
              <div className="text-sm text-gray-400">Total Contacts</div>
            </div>
            
            <div className="bg-[#121212] p-4 rounded-xl border border-white/5">
              <div className="text-2xl font-semibold text-rose-400">{analytics.favorites}</div>
              <div className="text-sm text-gray-400">Favorites</div>
            </div>
            
            <div className="bg-[#121212] p-4 rounded-xl border border-white/5">
              <div className="text-2xl font-semibold">{analytics.withGroups}</div>
              <div className="text-sm text-gray-400">In Groups</div>
            </div>
          </div>
          
          {/* Completeness */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Contact Completeness</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Email addresses</span>
                  <span>{emailPercent}%</span>
                </div>
                <div className="w-full bg-[#121212] rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${emailPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Phone numbers</span>
                  <span>{phonePercent}%</span>
                </div>
                <div className="w-full bg-[#121212] rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${phonePercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Birthdays</span>
                  <span>{birthdayPercent}%</span>
                </div>
                <div className="w-full bg-[#121212] rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${birthdayPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Notes</span>
                  <span>{notesPercent}%</span>
                </div>
                <div className="w-full bg-[#121212] rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${notesPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Birthday Distribution */}
          {analytics.withBirthday > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Birthday Distribution</h3>
              <div className="grid grid-cols-12 gap-1 h-20 items-end">
                {analytics.birthdaysByMonth.map((count, i) => {
                  // Calculate bar height percentage (max 100%)
                  const maxInMonth = Math.max(...analytics.birthdaysByMonth);
                  const heightPercent = maxInMonth > 0 ? (count / maxInMonth) * 100 : 0;
                  
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div 
                        className={`w-full ${i === currentMonth ? 'bg-emerald-500' : 'bg-[#333]'} rounded-t`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <div className="text-xs mt-1 text-gray-400">{monthNames[i]}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 text-sm">
                <p>
                  {currentMonthBirthdays > 0 ? (
                    <span className="text-emerald-400">
                      {currentMonthBirthdays} {currentMonthBirthdays === 1 ? 'birthday' : 'birthdays'} this month!
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      No birthdays this month.
                    </span>
                  )}
                  {nextBirthdayMonth !== -1 && nextBirthdayMonth !== currentMonth && (
                    <span className="ml-1 text-gray-400">
                      Next birthdays in {monthNames[nextBirthdayMonth]} ({analytics.birthdaysByMonth[nextBirthdayMonth]}).
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* Groups Distribution */}
          {analytics.contactsByGroup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Contacts by Group</h3>
              <div className="space-y-2">
                {analytics.contactsByGroup
                  .sort((a, b) => b.count - a.count)
                  .map((group, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-32 truncate text-sm">{group.name}</div>
                      <div className="flex-1 ml-2">
                        <div className="flex items-center">
                          <div className="flex-1 bg-[#121212] rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(group.count / analytics.total) * 100}%` }}
                            ></div>
                          </div>
                          <div className="ml-2 text-xs text-gray-400">{group.count}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-[#0a0a0a] px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded-lg text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactAnalytics;