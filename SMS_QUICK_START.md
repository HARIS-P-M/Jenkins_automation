# 📱 SMS Feature - Quick Start Guide

## 🎯 What's New?

Your Contact Manager now has **web-based SMS messaging**! Send text messages to contacts directly from the app.

## 🚀 Quick Test (No Setup Needed)

The app works in **DEMO MODE** by default - no configuration required!

### Test Steps:

1. **Start the app** (if not already running):
   ```powershell
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd ..
   npm run dev
   ```

2. **Open the app** in browser: http://localhost:5173

3. **Find the purple SMS button** on any contact

4. **Click it and try sending an SMS**
   - Type a message
   - Click "Send SMS"
   - See success message (simulated)

5. **Check backend console** - You'll see:
   ```
   DEMO MODE: SMS would be sent with: { ... }
   ```

✅ **That's it!** The feature works in demo mode.

## 🔧 Send Real SMS (Optional)

Want to send **real SMS messages**?

### Requirements:
- Twilio account (free trial available)
- Twilio phone number

### Setup (5 minutes):

1. **Get Twilio credentials:**
   - Sign up: https://www.twilio.com/try-twilio
   - Get a phone number
   - Copy Account SID and Auth Token

2. **Configure backend:**
   ```powershell
   cd backend
   copy .env.example .env
   notepad .env
   ```

3. **Add credentials to `.env`:**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Restart backend:**
   ```powershell
   npm run dev
   ```

5. **Send real SMS!** 🎉

## 📍 Where to Find SMS Button

### Option 1: Contact List
- Purple button next to each contact (between email and call buttons)

### Option 2: Contact Details
- Open any contact
- Look for "Send SMS via Web" option

## 💡 Features

| Feature | Description |
|---------|-------------|
| 📝 **Templates** | Save and reuse common messages |
| 🔢 **Character Counter** | See message length and SMS parts |
| 🏷️ **Variables** | Use `{name}` for contact name |
| ✅ **Demo Mode** | Test without Twilio |
| 🚀 **Real Sending** | Send actual SMS with Twilio |

## 🎨 Button Colors

- 🟢 Green = Call
- 🔵 Blue = Email
- 🟣 **Purple = SMS (NEW!)**

## ❓ FAQ

**Q: Do I need Twilio?**
A: No! Works in demo mode without Twilio.

**Q: Does it cost money?**
A: Demo mode is free. Real SMS costs ~$0.0075 per message.

**Q: Can I send international SMS?**
A: Yes, with Twilio. Add country code: +44, +91, etc.

**Q: Are templates saved?**
A: Yes, in browser localStorage.

## 📚 More Info

See `SMS_FEATURE_README.md` for complete documentation.

## 🐛 Issues?

1. Check browser console (F12)
2. Check backend terminal logs
3. Verify phone number format: `+1234567890`

---

**Happy Messaging!** 📱✨
