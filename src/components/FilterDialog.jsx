import React, { useState, useEffect } from 'react';

const FilterDialog = ({ open, onClose, onApplyFilters, groups, currentFilters }) => {
  const [filters, setFilters] = useState({
    groups: currentFilters?.groups || [],
    hasBirthday: currentFilters?.hasBirthday || false,
    birthdayMonth: currentFilters?.birthdayMonth || '',
    hasEmail: currentFilters?.hasEmail || false,
    hasPhone: currentFilters?.hasPhone || false,
    hasNotes: currentFilters?.hasNotes || false,
    isFavorite: currentFilters?.isFavorite || false
  });

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setFilters(currentFilters || {
        groups: [],
        hasBirthday: false,
        birthdayMonth: '',
        hasEmail: false,
        hasPhone: false,
        hasNotes: false,
        isFavorite: false
      });
    }
  }, [open, currentFilters]);

  const handleToggleGroup = (groupId) => {
    setFilters(prev => {
      const newGroups = prev.groups?.includes(groupId)
        ? prev.groups.filter(id => id !== groupId)
        : [...(prev.groups || []), groupId];
      
      return { ...prev, groups: newGroups };
    });
  };

  const handleReset = () => {
    setFilters({
      groups: [],
      hasBirthday: false,
      birthdayMonth: '',
      hasEmail: false,
      hasPhone: false,
      hasNotes: false,
      isFavorite: false
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
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
      <div className="bg-[#0a0a0a] rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0a0a] z-10 px-6 pt-5 pb-3 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Filter Contacts</h2>
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

        <div className="px-6 py-4 space-y-6">
          {/* Groups Filter */}
          {groups?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Groups</h3>
              <div className="flex flex-wrap gap-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleToggleGroup(group.id)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      filters.groups?.includes(group.id)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-[#1b1b1b] border-white/10 text-gray-300'
                    } border`}
                  >
                    {group.name} ({group.count || 0})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Birthday Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Birthday</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasBirthday}
                  onChange={() => setFilters(prev => ({ ...prev, hasBirthday: !prev.hasBirthday }))}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm">Has birthday</span>
              </label>

              {filters.hasBirthday && (
                <div>
                  <select
                    value={filters.birthdayMonth}
                    onChange={(e) => setFilters(prev => ({ ...prev, birthdayMonth: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1b1b1b] border border-white/10 rounded-lg text-white focus:outline-none"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Other Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Contact Details</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasEmail}
                  onChange={() => setFilters(prev => ({ ...prev, hasEmail: !prev.hasEmail }))}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm">Has email</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasPhone}
                  onChange={() => setFilters(prev => ({ ...prev, hasPhone: !prev.hasPhone }))}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm">Has phone number</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasNotes}
                  onChange={() => setFilters(prev => ({ ...prev, hasNotes: !prev.hasNotes }))}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm">Has notes</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isFavorite}
                  onChange={() => setFilters(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                  className="w-4 h-4 rounded-sm bg-[#1b1b1b] border border-white/20 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm">Favorites only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0a0a0a] px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Reset
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDialog;