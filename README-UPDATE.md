# Contact Manager Update

This update adds the following features:

## 1. Mobile Number Collection During Signup
- The Auth component now collects mobile numbers during signup
- The User schema has been updated to store mobile numbers
- The signup API endpoint has been updated to handle mobile numbers

## 2. Email Sending Capability
- Added a new EmailSender component to send emails to contacts
- Added a backend API endpoint for sending emails
- Integrated nodemailer for email functionality
- Added an email button to the ContactDetails component

## 3. User Profile Management
- Added a UserProfileDialog component to view and edit profile information
- Added a profile button in the Navbar
- Added a PUT endpoint to update user profile
- Users can now update their name and mobile number

## Setup Instructions

1. Install the new dependencies for the backend:
```bash
cd backend
npm install nodemailer
```

2. Configure email settings:
- Create a .env file in the backend folder
- Add the following environment variables:
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Note: For Gmail, you'll need to use an App Password instead of your regular password. 
You can generate an App Password in your Google Account security settings.

3. Restart the backend server:
```bash
cd backend
npm run dev
```

4. The frontend will automatically use these new features once the backend is running.