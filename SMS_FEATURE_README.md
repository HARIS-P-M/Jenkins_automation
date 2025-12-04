# SMS Messaging Feature - Contact Manager

## Overview

The Contact Manager app now supports **web-based SMS messaging** that allows users to send text messages to contacts directly through the web interface using the Twilio API.

## Features

✅ **Web-Based SMS Sending** - Send SMS messages through a web service (Twilio)
✅ **SMS Templates** - Save and reuse common message templates
✅ **Character Counter** - Real-time character count with multi-part SMS detection
✅ **Variable Replacement** - Use {name} placeholder for contact names
✅ **Demo Mode** - Works without Twilio credentials for testing
✅ **Purple SMS Button** - Easy access from contact list and contact details
✅ **Template Management** - Create, save, and delete SMS templates

## User Interface

### SMS Button Locations

1. **Contact List** - Purple SMS button next to each contact
2. **Contact Details** - "Send SMS via Web" option in actions menu

### SMS Dialog Features

- **Recipient Display** - Shows contact name and phone number
- **Message Composer** - Large text area with character counter
- **Templates Dropdown** - Quick access to saved templates
- **Save as Template** - Save current message as a template
- **Character Counter** - Shows character count and SMS parts
- **Send Button** - Sends SMS with loading state

## Setup Instructions

### Option 1: Demo Mode (No Setup Required)

The app works in **demo mode** by default. SMS messages are simulated and logged to console without actually sending.

**No configuration needed!** Just use the app and see simulated SMS sending.

### Option 2: Production Mode (Twilio Setup)

To send **real SMS messages**, you need to configure Twilio:

#### Step 1: Get Twilio Credentials

1. Sign up for Twilio: https://www.twilio.com/try-twilio
2. Get a Twilio phone number
3. Copy your credentials from the Twilio Console:
   - Account SID
   - Auth Token
   - Twilio Phone Number

#### Step 2: Configure Backend

1. Navigate to backend directory:
   ```powershell
   cd backend
   ```

2. Copy `.env.example` to `.env`:
   ```powershell
   copy .env.example .env
   ```

3. Edit `.env` and add your Twilio credentials:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

#### Step 3: Install Twilio Package

```powershell
cd backend
npm install
```

This will install the Twilio package automatically.

#### Step 4: Restart Backend Server

```powershell
npm run dev
```

## Usage Guide

### Sending an SMS

1. **From Contact List:**
   - Click the purple SMS button next to any contact
   - Or click a contact to open details, then click "Send SMS via Web"

2. **Compose Message:**
   - Type your message (max 160 characters per SMS)
   - Use {name} to insert the contact's name
   - Message will be split into multiple SMS if > 160 characters

3. **Use Templates (Optional):**
   - Click "Templates" to see saved templates
   - Click a template to use it
   - Variables like {name} are automatically replaced

4. **Send:**
   - Click "Send SMS" button
   - Wait for confirmation message
   - Dialog closes automatically on success

### Managing Templates

#### Create a Template

1. Type a message in the SMS composer
2. Click "Save as template"
3. Template is saved to browser storage

#### Use a Template

1. Click "Templates" dropdown
2. Click any template to load it
3. Edit if needed, then send

#### Template Variables

- `{name}` - Replaced with contact's name
- More variables can be added in future

## Technical Details

### Frontend Component

**File:** `src/components/SMSSender.jsx`

Features:
- React component with state management
- localStorage for template persistence
- Real-time character counting
- SMS API integration with error handling
- Loading states and success feedback

### Backend API

**Endpoint:** `POST /api/send-sms`

**Request:**
```json
{
  "to": "+1234567890",
  "message": "Hello, this is a test message"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "messageId": "SM..."
}
```

**Response (Demo Mode):**
```json
{
  "success": true,
  "message": "SMS sent successfully (demo mode)",
  "messageId": "demo_1234567890"
}
```

### SMS Workflow

1. User clicks SMS button on contact
2. `SMSSender` component opens with contact info
3. User composes message (can use templates)
4. Frontend sends request to `/api/send-sms`
5. Backend checks Twilio configuration:
   - **If configured:** Send real SMS via Twilio
   - **If not configured:** Run in demo mode (simulate)
6. Backend returns success/error response
7. Frontend shows confirmation and closes

### Demo Mode vs Production Mode

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| Setup Required | ❌ None | ✅ Twilio credentials |
| SMS Sent | ❌ Simulated | ✅ Real SMS |
| Cost | 💰 Free | 💰 Twilio rates apply |
| Testing | ✅ Perfect for dev | ✅ Live messaging |
| Console Logs | ✅ Shows details | ✅ Shows Twilio SID |

## Button Colors

- 🟢 **Green** - Call button
- 🔵 **Blue** - Email button
- 🟣 **Purple** - SMS button (NEW!)

## SMS Pricing

When using Twilio in production mode:
- **Outbound SMS**: ~$0.0075 per message (US)
- **Varies by country**
- Check Twilio pricing: https://www.twilio.com/sms/pricing

## Troubleshooting

### SMS Not Sending

1. **Check Twilio Credentials**
   - Verify `.env` file has correct values
   - Account SID starts with `AC`
   - Auth Token is valid
   - Phone number is in format `+1234567890`

2. **Check Console Logs**
   - Backend logs show "DEMO MODE" if credentials missing
   - Look for Twilio errors in backend console

3. **Verify Phone Number Format**
   - Must include country code: `+1` for US
   - Example: `+15551234567`
   - International format: `+44` for UK, `+91` for India

4. **Check Twilio Balance**
   - Log into Twilio Console
   - Verify account has credit

### Demo Mode Always Active

If demo mode is always active even with credentials:
- Check `.env` file location (must be in `backend/` folder)
- Restart backend server after editing `.env`
- Verify environment variables are loaded:
  ```javascript
  console.log(process.env.TWILIO_ACCOUNT_SID)
  ```

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` file** to version control
2. **Use strong Twilio Auth Token**
3. **Implement rate limiting** (add in future)
4. **Validate phone numbers** on backend
5. **Log SMS sending** for audit trail
6. **Set spending limits** in Twilio Console

## Future Enhancements

Possible future features:
- [ ] SMS delivery status tracking
- [ ] Message history per contact
- [ ] Scheduled SMS sending
- [ ] Bulk SMS to groups
- [ ] Two-way SMS conversations
- [ ] SMS templates with more variables
- [ ] Rate limiting and spam prevention
- [ ] Multiple SMS provider support
- [ ] SMS analytics dashboard

## API Documentation

### Send SMS Endpoint

**URL:** `/api/send-sms`
**Method:** `POST`
**Auth:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| to | string | Yes | Phone number in international format |
| message | string | Yes | Message text (max 1600 chars) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Error Response (400/500):**
```json
{
  "error": "Failed to send SMS",
  "details": "Error message here"
}
```

## License

This feature is part of the Contact Manager application.

## Support

For issues or questions:
1. Check this README
2. Review console logs (frontend & backend)
3. Check Twilio documentation: https://www.twilio.com/docs/sms
4. Verify environment configuration

---

**Last Updated:** November 20, 2025
**Version:** 1.0.0
**Author:** Contact Manager Team
