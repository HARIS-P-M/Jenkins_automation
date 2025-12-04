# 🎨 SMS Feature Visual Guide

## Where to Find the SMS Feature

### 1. Contact List View

```
┌─────────────────────────────────────────────────┐
│  Search Contacts                        [+]     │
├─────────────────────────────────────────────────┤
│  Groups: [All] [Family] [Work] [Friends]       │
├─────────────────────────────────────────────────┤
│  ★ Favorites                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 John Doe              [✏️] [🗑️]         │ │
│  │    john@email.com                         │ │
│  │    +1 (555) 123-4567                      │ │
│  │                     [💬] [📧] [📞]         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  A                                              │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Alice Smith           [✏️] [🗑️]         │ │
│  │    alice@email.com                        │ │
│  │    +1 (555) 234-5678                      │ │
│  │                     [💬] [📧] [📞]         │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Legend:
💬 = SMS Button (Purple) ← NEW!
📧 = Email Button (Blue)
📞 = Call Button (Green)
```

### 2. Contact Details View

```
┌─────────────────────────────────────────────────┐
│  ← Details                              ⭐ Edit  │
├─────────────────────────────────────────────────┤
│                                                 │
│      👤        John Doe                         │
│    (Avatar)                                     │
│                                                 │
│    +1 (555) 123-4567                    [📞]    │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 💬 Send SMS via Web                    → │ │ ← NEW!
│  │    Send text message through web service  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📞 Call Forwarding                     → │ │
│  │    Set up call forwarding rules           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 💬 Send Message                        → │ │
│  │    Using templates                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📧 Send Email                          → │ │
│  │    john@email.com                          │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3. SMS Dialog

```
┌───────────────────────────────────────────────────┐
│  Send SMS                                    ✕   │
│  To: John Doe (+1 555-123-4567)                  │
├───────────────────────────────────────────────────┤
│                                                   │
│  ✅ SMS sent successfully!                        │
│                                                   │
│  Message                    [Templates ▼] [Save] │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │ Type your message here...                  │ │
│  │                                             │ │
│  │ Use {name} for recipient's name            │ │
│  │                                             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│  142 characters • 1 SMS                          │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ ℹ️  About Web SMS                            │ │
│  │                                               │ │
│  │ Messages are sent through a web service      │ │
│  │ (Twilio). Standard SMS rates may apply.      │ │
│  │ Make sure the phone number is valid and      │ │
│  │ in international format.                     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│         [Cancel]              [📤 Send SMS]       │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 4. SMS Dialog with Templates

```
┌───────────────────────────────────────────────────┐
│  Send SMS                                    ✕   │
│  To: John Doe (+1 555-123-4567)                  │
├───────────────────────────────────────────────────┤
│                                                   │
│  Message              [Templates ▼] [Save]       │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Meeting Reminder                   [Use]    │ │
│  │ Running late, will be there in 10 [Use]    │ │
│  │ Thanks for your help!              [Use]    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │ Hi {name}, just wanted to check if...      │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│  89 characters • 1 SMS                           │
│                                                   │
├───────────────────────────────────────────────────┤
│         [Cancel]              [📤 Send SMS]       │
└───────────────────────────────────────────────────┘
```

## Button Color Guide

### Before (Old)
```
[Edit] [Delete] | [Email 🔵] [Call 🟢]
```

### After (New)
```
[Edit] [Delete] | [SMS 🟣] [Email 🔵] [Call 🟢]
                    ↑
                  NEW!
```

## Feature Flow Diagram

```
User clicks SMS button
         ↓
SMS Dialog opens
         ↓
User types message (or selects template)
         ↓
{name} replaced with "John Doe"
         ↓
User clicks "Send SMS"
         ↓
Frontend → Backend API
         ↓
Backend checks Twilio config
         ↓
    ┌────────┴─────────┐
    ↓                  ↓
Demo Mode         Real Mode
(Simulate)        (Twilio)
    ↓                  ↓
    └────────┬─────────┘
         ↓
Success response
         ↓
Show success message
         ↓
Auto-close dialog
```

## Character Counter States

### Normal (Under 160)
```
┌──────────────────────────────────────────┐
│ Hello, this is a test message            │
└──────────────────────────────────────────┘
35 characters • 1 SMS
```

### Warning (Over 160)
```
┌──────────────────────────────────────────┐
│ This is a very long message that...      │
└──────────────────────────────────────────┘
178 characters • 2 SMS ⚠️ Long message will be split
```

## Template Variables

### Before Send
```
Hi {name}, your appointment is tomorrow at 2pm.
```

### After Variable Replacement
```
Hi John Doe, your appointment is tomorrow at 2pm.
```

## Status Messages

### Loading State
```
┌────────────────────────────────┐
│ [⏳] Sending...                │
└────────────────────────────────┘
```

### Success State (Demo)
```
┌────────────────────────────────────────────┐
│ ✅ SMS sent successfully (demo mode)       │
└────────────────────────────────────────────┘
```

### Success State (Real)
```
┌────────────────────────────────┐
│ ✅ SMS sent successfully!       │
└────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────────────────┐
│ ❌ Failed to send SMS. Please try again.  │
└────────────────────────────────────────────┘
```

## Mobile View

```
┌─────────────────────┐
│  ← Details    ⭐ Edit│
├─────────────────────┤
│                     │
│    👤  John Doe     │
│                     │
│  +1 (555) 123-4567  │
│         [📞]         │
│                     │
├─────────────────────┤
│ 💬 Send SMS via Web │ ← NEW!
│    Send text...     │
├─────────────────────┤
│ 📞 Call Forwarding  │
│    Set up...        │
├─────────────────────┤
│ 💬 Send Message     │
│    Using templates  │
└─────────────────────┘
```

## Color Scheme

| Element | Color | Hex Code |
|---------|-------|----------|
| SMS Button | Purple | `#9333EA` |
| Email Button | Blue | `#2563EB` |
| Call Button | Green | `#10B981` |
| Success Message | Emerald | `#10B981` |
| Error Message | Rose | `#F43F5E` |
| Warning Text | Yellow | `#EAB308` |

## Icons Used

- 💬 SMS/Message icon (purple circle)
- 📧 Email icon (blue circle)  
- 📞 Call icon (green circle)
- ✕ Close button
- ▼ Dropdown arrow
- 📤 Send icon
- ⏳ Loading spinner
- ✅ Success checkmark
- ❌ Error icon
- ℹ️ Info icon

---

**Visual Design:** Modern, clean, consistent with existing UI
**Accessibility:** All buttons have aria-labels and titles
**Responsive:** Works on desktop, tablet, and mobile
**User-Friendly:** Clear labels, helpful tooltips, instant feedback
