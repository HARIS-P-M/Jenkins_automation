import React, { useState, useRef } from 'react'

export default function ImportExportDialog({ 
  open,
  onClose,
  onImport,
  onExport,
  contacts
}) {
  const [activeTab, setActiveTab] = useState('import')
  const [importFormat, setImportFormat] = useState('csv')
  const [exportFormat, setExportFormat] = useState('csv')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef(null)

  if (!open) return null
  
  const handleImportFile = (e) => {
    setImportError('')
    setImportSuccess(false)
    
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        let data
        
        if (importFormat === 'csv') {
          data = parseCSV(event.target.result)
        } else if (importFormat === 'json') {
          data = JSON.parse(event.target.result)
        } else if (importFormat === 'vcf') {
          data = parseVCF(event.target.result)
        }
        
        onImport(data)
        setImportSuccess(true)
      } catch (error) {
        console.error('Import error:', error)
        setImportError(`Failed to import: ${error.message}`)
      }
    }
    
    reader.onerror = () => {
      setImportError('Failed to read file')
    }
    
    if (importFormat === 'csv' || importFormat === 'vcf') {
      reader.readAsText(file)
    } else {
      reader.readAsText(file)
    }
  }
  
  const handleExport = () => {
    try {
      let content, mimeType, extension, fileName
      
      if (exportFormat === 'csv') {
        content = generateCSV(contacts)
        mimeType = 'text/csv'
        extension = 'csv'
      } else if (exportFormat === 'json') {
        content = JSON.stringify(contacts, null, 2)
        mimeType = 'application/json'
        extension = 'json'
      } else if (exportFormat === 'vcf') {
        content = generateVCF(contacts)
        mimeType = 'text/vcard'
        extension = 'vcf'
      }
      
      fileName = `contacts-${new Date().toISOString().split('T')[0]}.${extension}`
      
      // Create download link
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export: ${error.message}`)
    }
  }
  
  const parseCSV = (csvText) => {
    // Simple CSV parser - could be enhanced for more complex CSVs
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const contacts = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Handle quoted values in CSV
      const values = line.match(/(?:"([^"]*)"|([^,]+))/g)?.map(v => 
        v.replace(/^"|"$/g, '').trim()
      ) || []
      
      const contact = { phones: [] }
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].toLowerCase()
        const value = values[j]?.trim() || ''
        
        if (header === 'name' || header === 'full name' || header === 'fullname') {
          contact.name = value
        } else if (header === 'email' || header === 'email address') {
          contact.email = value
        } else if (header.includes('phone') || header === 'mobile' || header === 'tel') {
          if (value) contact.phones.push(value)
        }
      }
      
      // Ensure at least a name exists
      if (contact.name || contact.email || contact.phones.length > 0) {
        contact.name = contact.name || contact.email || contact.phones[0] || 'Unknown'
        contacts.push(contact)
      }
    }
    
    return contacts
  }
  
  const parseVCF = (vcfText) => {
    // Basic vCard/VCF parser
    const cards = vcfText.split('BEGIN:VCARD')
    const contacts = []
    
    for (let i = 1; i < cards.length; i++) {
      const card = 'BEGIN:VCARD' + cards[i]
      const contact = { phones: [] }
      
      // Extract name (try FN first, then N)
      const fnLine = card.match(/FN:(.*?)(?:\r?\n|$)/)
      if (fnLine && fnLine[1]) {
        contact.name = fnLine[1].trim()
      } else {
        // Try N format (Last;First;Middle;Prefix;Suffix)
        const nLine = card.match(/N:(.*?)(?:\r?\n|$)/)
        if (nLine && nLine[1]) {
          const parts = nLine[1].split(';').filter(p => p)
          contact.name = parts.reverse().join(' ').trim()
        }
      }
      
      // Extract email
      const emailLine = card.match(/EMAIL[^:]*:(.*?)(?:\r?\n|$)/)
      if (emailLine && emailLine[1]) {
        contact.email = emailLine[1].trim()
      }
      
      // Extract phones - handle multiple
      const phonePattern = /TEL[^:]*:(.*?)(?:\r?\n|$)/g
      let phoneMatch
      while ((phoneMatch = phonePattern.exec(card)) !== null) {
        const phone = phoneMatch[1].trim()
        if (phone) contact.phones.push(phone)
      }
      
      // Ensure at least a name exists
      if (contact.name || contact.email || contact.phones.length > 0) {
        contact.name = contact.name || contact.email || contact.phones[0] || 'Unknown'
        contacts.push(contact)
      }
    }
    
    return contacts
  }
  
  const generateCSV = (contacts) => {
    const headers = ['Name', 'Email', 'Phone']
    const rows = [headers.join(',')]
    
    contacts.forEach(contact => {
      const phone = (contact.phones || [])[0] || ''
      rows.push(`${contact.name || ''},${contact.email || ''},${phone}`)
    })
    
    return rows.join('\n')
  }
  
  const generateVCF = (contacts) => {
    const vcards = contacts.map(contact => {
      let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n'
      
      // Add name
      vcard += `FN:${contact.name || ''}\r\n`
      
      // Add email
      if (contact.email) {
        vcard += `EMAIL:${contact.email}\r\n`
      }
      
      // Add phones
      if (contact.phones && contact.phones.length > 0) {
        contact.phones.forEach(phone => {
          vcard += `TEL:${phone}\r\n`
        })
      }
      
      vcard += 'END:VCARD\r\n'
      return vcard
    })
    
    return vcards.join('\r\n')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Import/Export Contacts</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          
          <div className="flex mt-2 border-b border-white/10">
            <button
              className={`px-4 py-2 ${activeTab === 'import' ? 'border-b-2 border-emerald-500 text-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('import')}
            >
              Import
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'export' ? 'border-b-2 border-emerald-500 text-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'import' ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Import Format</label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="vcf">vCard (VCF)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Select File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={importFormat === 'csv' ? '.csv' : importFormat === 'json' ? '.json' : '.vcf'}
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-full h-12 border border-dashed border-white/20 rounded-xl flex items-center justify-center text-gray-300 hover:bg-[#1b1b1b]"
                >
                  Click to select file
                </button>
              </div>
              
              {importError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-200">
                  {importError}
                </div>
              )}
              
              {importSuccess && (
                <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-sm text-emerald-200">
                  Import successful!
                </div>
              )}
              
              <div className="text-sm text-gray-400 mt-2">
                {importFormat === 'csv' && (
                  <p>CSV format should have columns: Name, Email, Phone</p>
                )}
                {importFormat === 'json' && (
                  <p>JSON format should be an array of contact objects with name, email, and phones properties</p>
                )}
                {importFormat === 'vcf' && (
                  <p>Standard vCard format from most contact applications</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="vcf">vCard (VCF)</option>
                </select>
              </div>
              
              <div className="mb-4 text-sm text-gray-300">
                {contacts.length} contacts will be exported
              </div>
              
              <button
                onClick={handleExport}
                className="w-full h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center"
              >
                Export {contacts.length} Contacts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}