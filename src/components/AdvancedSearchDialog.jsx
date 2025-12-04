import React, { useState } from 'react';

const AdvancedSearchDialog = ({ open, onClose, onSearch, groups }) => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    email: '',
    phone: '',
    group: '',
    hasBirthday: false,
    birthdayMonth: '',
    hasNotes: false,
    isFavorite: false,
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchParams);
    onClose();
  };
  
  const handleClear = () => {
    setSearchParams({
      name: '',
      email: '',
      phone: '',
      group: '',
      hasBirthday: false,
      birthdayMonth: '',
      hasNotes: false,
      isFavorite: false,
    });
  };
  
  if (!open) return null;
  
  const months = [
    { value: '', label: 'Any month' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0a0a] z-10 px-6 pt-5 pb-3 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Advanced Search</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={searchParams.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
                placeholder="Contact name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="text"
                name="email"
                value={searchParams.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={searchParams.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
                placeholder="Phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Group
              </label>
              <select
                name="group"
                value={searchParams.group}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
              >
                <option value="">Any group</option>
                {groups?.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFavorite"
                  name="isFavorite"
                  checked={searchParams.isFavorite}
                  onChange={handleChange}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isFavorite" className="ml-2 text-sm">
                  Favorites only
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasBirthday"
                  name="hasBirthday"
                  checked={searchParams.hasBirthday}
                  onChange={handleChange}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="hasBirthday" className="ml-2 text-sm">
                  Has birthday
                </label>
              </div>
              
              {searchParams.hasBirthday && (
                <div className="pl-6">
                  <select
                    name="birthdayMonth"
                    value={searchParams.birthdayMonth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasNotes"
                  name="hasNotes"
                  checked={searchParams.hasNotes}
                  onChange={handleChange}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="hasNotes" className="ml-2 text-sm">
                  Has notes
                </label>
              </div>
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-[#0a0a0a] px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Clear
            </button>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/10 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSearchDialog;