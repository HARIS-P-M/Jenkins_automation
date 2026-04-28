import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { createServer } from 'http'
import { Server } from 'socket.io'
import nodemailer from 'nodemailer'
import promBundle from 'express-prom-bundle'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const DEFAULT_FRONTEND_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3001'
]

const FRONTEND_ORIGINS = [
  ...new Set([
    ...(process.env.FRONTEND_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    ...DEFAULT_FRONTEND_ORIGINS,
  ]),
]

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'] // Enable all transport methods
})

app.use(cors({
  origin: FRONTEND_ORIGINS,
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

// Configure Prometheus metrics endpoint
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  promClient: {
    collectDefaultMetrics: {}
  }
});
app.use(metricsMiddleware)

// Configure nodemailer
const EMAIL_USER = process.env.EMAIL_USER || 'your_email@gmail.com'
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_app_password'
// Only use demo mode if credentials are missing
const DEMO_MODE = EMAIL_USER === 'your_email@gmail.com' || !EMAIL_PASS;

console.log('Setting up email transporter with:', EMAIL_USER, '(Demo mode:', DEMO_MODE ? 'enabled' : 'disabled', ')');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  debug: true, // Enable debug logging
  logger: true  // Enable logging
})

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/contact_manager'
try {
  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
} catch (e) {
  console.error('MongoDB connection error:', e.message)
}

const ContactSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phones: { type: [String], default: [] },
  avatar: { type: String, default: '' },
  favorite: { type: Boolean, default: false },
  groups: { type: [mongoose.Schema.Types.ObjectId], ref: 'ContactGroup', default: [] },
  birthday: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true })

const ContactGroupSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name: { type: String, required: true },
}, { timestamps: true })

// Normalize id in JSON for groups
ContactGroupSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    return ret
  }
})

// Normalize id in JSON
ContactSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    return ret
  }
})

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  recoveryEmail: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorMethod: { type: String, enum: ['email', 'app'], default: null },
  twoFactorSecret: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true })

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.passwordHash
    delete ret.salt
    return ret
  }
})

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
  return jwt.verify(token, secret)
}

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const CallLogSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  type: { type: String, enum: ['incoming', 'outgoing', 'missed'], required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
  name: { type: String, default: '' },
  phone: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 0 },
}, { timestamps: true })

CallLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    return ret
  }
})

const Contact = mongoose.model('Contact', ContactSchema)
const User = mongoose.model('User', UserSchema)
const CallLog = mongoose.model('CallLog', CallLogSchema)
const ContactGroup = mongoose.model('ContactGroup', ContactGroupSchema)

// Email Message Schema
const EmailMessageSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  attachments: [{
    filename: String,
    data: String,  // Base64 encoded file data
    contentType: String,
    size: Number
  }],
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['sent', 'received'], required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true })

EmailMessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    // Keep _id for compatibility
    return ret
  }
})

// SMS Message Schema
const SMSMessageSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['sent', 'received'], required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true })

SMSMessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    // Keep _id for compatibility
    return ret
  }
})

const EmailMessage = mongoose.model('EmailMessage', EmailMessageSchema)
const SMSMessage = mongoose.model('SMSMessage', SMSMessageSchema)

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, name, mobileNumber, password, recoveryEmail } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already registered' })
    const salt = generateSalt()
    const passwordHash = hashPassword(password, salt)
    const user = await User.create({ email, name, mobileNumber, recoveryEmail: recoveryEmail || '', passwordHash, salt })
    const token = signToken({ userId: user.id })
    res.status(201).json({ token, user })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    // Try to find user by email or recovery email
    let user = await User.findOne({ email })
    if (!user) {
      user = await User.findOne({ recoveryEmail: email })
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const passwordHash = hashPassword(password, user.salt)
    if (passwordHash !== user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ userId: user.id })
    res.json({ token, user })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 2FA Setup endpoint
app.post('/api/auth/setup-2fa', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const { method } = req.body

    if (!['email', 'app'].includes(method)) {
      return res.status(400).json({ error: 'Invalid 2FA method' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Generate a random secret for app-based 2FA
    let secret = null
    if (method === 'app') {
      // In a production app, use a proper TOTP library
      secret = crypto.randomBytes(20).toString('hex').toUpperCase()
    }

    user.twoFactorMethod = method
    user.twoFactorSecret = secret
    user.twoFactorEnabled = false // Will be enabled after verification
    await user.save()

    res.json({
      success: true,
      method,
      secret
    })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 2FA Verification endpoint
app.post('/api/auth/verify-2fa', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const { code, method } = req.body

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // In a real app, validate the code against the method and secret
    // For this demo, we'll just accept any 6-digit code

    user.twoFactorEnabled = true
    await user.save()

    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 2FA Disable endpoint
app.post('/api/auth/disable-2fa', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.twoFactorEnabled = false
    user.twoFactorMethod = null
    user.twoFactorSecret = null
    await user.save()

    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Forgot Password - Send Code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const user = await User.findOne({ 
      $or: [{ email: email }, { recoveryEmail: email }] 
    })

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' })
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Base URL for reset link
    const resetUrl = `${process.env.APP_URL || 'https://54.80.120.125'}/reset-password?token=${resetToken}&email=${user.email}`

    // Send Email
    const isDemoMode = DEMO_MODE || EMAIL_USER === 'your_email@gmail.com'
    
    if (isDemoMode) {
      console.log(`[FORGOT PASSWORD] Reset link for ${user.email} is: ${resetUrl}`)
    } else {
      await transporter.sendMail({
        from: `"Contact Manager Support" <${EMAIL_USER}>`,
        to: user.email,
        subject: '🔐 Reset Your Password - Contact Manager Pro',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background-color: #4f46e5; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <span style="font-size: 32px; color: white;">🛡️</span>
                </div>
                <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.025em;">Password Reset Request</h1>
                <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">A secure link has been generated for your account</p>
              </div>

              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">
                  Reset Password Now
                </a>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">This link will expire in 1 hour.</p>
              </div>

              <div style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button above to set a new password. If the button doesn't work, copy and paste the link below into your browser:</p>
                <p style="word-break: break-all; font-family: monospace; font-size: 12px; color: #4f46e5; background: #f3f4f6; padding: 10px; border-radius: 8px;">
                  ${resetUrl}
                </p>
                <p style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 12px; color: #9a3412; font-size: 14px;">
                  <strong>Important:</strong> If you did not request this, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">© 2026 Contact Manager Enterprise. All rights reserved.</p>
                <p style="margin: 4px 0;">Professional Suite • Secure Connection</p>
              </div>
            </div>
          </div>
        `
      })
    }

    res.json({ success: true, message: 'Reset code sent to your email' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Reset Password - Verify Code & Update
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token and new password are required' })
    }

    const user = await User.findOne({ 
      $or: [{ email: email }, { recoveryEmail: email }],
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' })
    }

    // Update password
    const salt = generateSalt()
    user.salt = salt
    user.passwordHash = hashPassword(newPassword, salt)
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    await user.save()

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Return only necessary user data
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      mobileNumber: user.mobileNumber,
      recoveryEmail: user.recoveryEmail,
      twoFactorEnabled: user.twoFactorEnabled
    })

  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Update user profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const { name, mobileNumber, recoveryEmail } = req.body

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Update only allowed fields
    if (name !== undefined) user.name = name
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber
    if (recoveryEmail !== undefined) user.recoveryEmail = recoveryEmail

    await user.save()

    // Return updated user data
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      mobileNumber: user.mobileNumber,
      recoveryEmail: user.recoveryEmail,
      twoFactorEnabled: user.twoFactorEnabled
    })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Contacts (scoped)
app.get('/api/contacts', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase()
  const all = await Contact.find({ ownerId: req.user.userId }).sort({ favorite: -1, name: 1 })
  const filtered = q
    ? all.filter(c => (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      (c.phones || []).some(p => p.toLowerCase().includes(q))
    ))
    : all
  res.json(filtered)
})

app.post('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body, ownerId: req.user.userId }
    const created = await Contact.create(payload)
    res.status(201).json(created)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.put('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await Contact.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.userId }, req.body, { new: true })
    res.json(updated)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    await Contact.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Favorites toggle
app.post('/api/contacts/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body
    const contact = await Contact.findOne({ _id: req.params.id, ownerId: req.user.userId })
    if (!contact) return res.status(404).json({ error: 'Not found' })
    contact.favorite = typeof value === 'boolean' ? value : !contact.favorite
    await contact.save()
    res.json(contact)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Call logs
app.get('/api/calls', authMiddleware, async (req, res) => {
  const logs = await CallLog.find({ ownerId: req.user.userId }).sort({ timestamp: -1 }).limit(200)
  res.json(logs)
})

app.post('/api/calls', authMiddleware, async (req, res) => {
  try {
    const created = await CallLog.create({ ...req.body, ownerId: req.user.userId })
    res.status(201).json(created)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Contact Groups
app.get('/api/groups', authMiddleware, async (req, res) => {
  try {
    const groups = await ContactGroup.find({ ownerId: req.user.userId }).sort({ name: 1 })
    // Count contacts in each group
    const counts = await Promise.all(groups.map(async group => {
      const count = await Contact.countDocuments({
        ownerId: req.user.userId,
        groups: group._id
      })
      return { id: group._id.toString(), count }
    }))

    const result = groups.map(g => {
      const countObj = counts.find(c => c.id === g._id.toString())
      return { ...g.toJSON(), count: countObj ? countObj.count : 0 }
    })

    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/api/groups', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Group name is required' })

    const created = await ContactGroup.create({
      name,
      ownerId: req.user.userId
    })
    res.status(201).json(created)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.put('/api/groups/:id', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Group name is required' })

    const updated = await ContactGroup.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { name },
      { new: true }
    )

    if (!updated) return res.status(404).json({ error: 'Group not found' })
    res.json(updated)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/groups/:id', authMiddleware, async (req, res) => {
  try {
    const group = await ContactGroup.findOne({ _id: req.params.id, ownerId: req.user.userId })
    if (!group) return res.status(404).json({ error: 'Group not found' })

    // Remove group from all contacts
    await Contact.updateMany(
      { ownerId: req.user.userId, groups: group._id },
      { $pull: { groups: group._id } }
    )

    // Delete the group
    await ContactGroup.deleteOne({ _id: group._id })

    res.status(200).json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Add contact to group
app.post('/api/contacts/:id/groups', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.body
    if (!groupId) return res.status(400).json({ error: 'Group ID is required' })

    // Verify group exists and belongs to user
    const group = await ContactGroup.findOne({ _id: groupId, ownerId: req.user.userId })
    if (!group) return res.status(404).json({ error: 'Group not found' })

    // Add contact to group
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { $addToSet: { groups: group._id } },
      { new: true }
    )

    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    res.json(contact)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Remove contact from group
app.delete('/api/contacts/:id/groups/:groupId', authMiddleware, async (req, res) => {
  try {
    // Verify group exists and belongs to user
    const group = await ContactGroup.findOne({ _id: req.params.groupId, ownerId: req.user.userId })
    if (!group) return res.status(404).json({ error: 'Group not found' })

    // Remove contact from group
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { $pull: { groups: group._id } },
      { new: true }
    )

    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    res.json(contact)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Get contacts by group
app.get('/api/groups/:id/contacts', authMiddleware, async (req, res) => {
  try {
    const group = await ContactGroup.findOne({ _id: req.params.id, ownerId: req.user.userId })
    if (!group) return res.status(404).json({ error: 'Group not found' })

    const contacts = await Contact.find({
      ownerId: req.user.userId,
      groups: group._id
    }).sort({ favorite: -1, name: 1 })

    res.json(contacts)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

async function migrateOwnerIds() {
  try {
    const stringContacts = await Contact.find({ ownerId: { $type: 'string' } }).select('_id ownerId')
    for (const doc of stringContacts) {
      try {
        const oid = new mongoose.Types.ObjectId(doc.ownerId)
        await Contact.updateOne({ _id: doc._id }, { $set: { ownerId: oid } })
      } catch (e) {
        console.warn('Skipping contact with invalid ownerId string', doc._id)
      }
    }
    const stringLogs = await CallLog.find({ ownerId: { $type: 'string' } }).select('_id ownerId')
    for (const doc of stringLogs) {
      try {
        const oid = new mongoose.Types.ObjectId(doc.ownerId)
        await CallLog.updateOne({ _id: doc._id }, { $set: { ownerId: oid } })
      } catch (e) {
        console.warn('Skipping call log with invalid ownerId string', doc._id)
      }
    }
    if (stringContacts.length || stringLogs.length) {
      console.log(`Migrated ownerId types - contacts: ${stringContacts.length}, call logs: ${stringLogs.length}`)
    }
  } catch (e) {
    console.warn('Migration error:', e.message)
  }
}

// Run lightweight migration on startup (non-blocking)
try { migrateOwnerIds() } catch { }

const port = process.env.PORT || 4000
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// WebSocket server
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Send email endpoint
app.post('/api/send-email', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const { to, subject, message, attachments } = req.body

    console.log('Email request received:', { to, subject, messageLength: message?.length, attachmentsCount: attachments?.length || 0 });

    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'To, subject and message are required' })
    }

    // Validate attachments size (max 10MB total)
    if (attachments && attachments.length > 0) {
      const totalSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0)
      if (totalSize > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Total attachments size exceeds 10MB limit' })
      }
    }

    // Get user details for the 'from' field
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    console.log('User found:', user.email);

    // Email configuration for demo
    const isDemoMode = DEMO_MODE || EMAIL_USER === 'your_email@gmail.com';

    if (isDemoMode) {
      // In demo mode, just log the email and return success
      console.log('DEMO MODE: Email would be sent with:', {
        from: user.email,
        to,
        subject,
        messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : '')
      });

      // Wait a bit to simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save email to database as sent
      await EmailMessage.create({
        ownerId: userId,
        from: user.email,
        to,
        subject,
        message,
        attachments: attachments || [],
        type: 'sent',
        timestamp: new Date()
      });

      // Check if recipient is a registered user and create received message
      const recipient = await User.findOne({ email: to });
      if (recipient) {
        await EmailMessage.create({
          ownerId: recipient._id,
          from: user.email,
          to,
          subject,
          message,
          attachments: attachments || [],
          type: 'received',
          timestamp: new Date()
        });
      }

      // Return success response
      return res.json({ success: true, message: 'Email sent successfully (demo mode)' });
    }

    // In production mode with real credentials:
    const mailOptions = {
      from: EMAIL_USER,
      to,
      subject,
      text: message,
      replyTo: user.email
    }

    console.log('Sending email with options:', {
      from: EMAIL_USER,
      to,
      subject,
      replyTo: user.email
    });

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.response);

    // Save email to database as sent
    await EmailMessage.create({
      ownerId: userId,
      from: user.email,
      to,
      subject,
      message,
      attachments: attachments || [],
      type: 'sent',
      timestamp: new Date()
    });

    // Check if recipient is a registered user and create received message
    const recipient = await User.findOne({ email: to });
    if (recipient) {
      await EmailMessage.create({
        ownerId: recipient._id,
        from: user.email,
        to,
        subject,
        message,
        attachments: attachments || [],
        type: 'received',
        timestamp: new Date()
      });
    }

    res.json({ success: true, message: 'Email sent successfully' })
  } catch (e) {
    console.error('Error sending email:', e)
    res.status(500).json({ error: 'Failed to send email', details: e.message })
  }
});

// Send SMS endpoint
app.post('/api/send-sms', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const { to, message } = req.body

    console.log('SMS request received:', { to, messageLength: message?.length });

    if (!to || !message) {
      return res.status(400).json({ error: 'Recipient phone number and message are required' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

    const isTwilioConfigured = TWILIO_ACCOUNT_SID && 
                             TWILIO_AUTH_TOKEN && 
                             TWILIO_PHONE_NUMBER && 
                             !TWILIO_ACCOUNT_SID.includes('your_')

    const fromNumber = user.mobileNumber || user.email || 'System'

    // Ensure 'to' number is in E.164 format (starts with +)
    let formattedTo = to.trim()
    if (!formattedTo.startsWith('+')) {
      // Default to +91 if not specified and starts with 10 digits
      if (formattedTo.length === 10) formattedTo = '+91' + formattedTo
      else if (formattedTo.length > 10) formattedTo = '+' + formattedTo
    }

    // Optional: Allow forcing demo mode via env
    const forceDemo = process.env.FORCE_DEMO_SMS === 'true' || process.env.DEMO_MODE === 'true'

    if (!isTwilioConfigured || forceDemo) {
      console.log('SMS [DEMO]:', { from: fromNumber, to: formattedTo });

      try {
        const sentMsg = await SMSMessage.create({
          ownerId: userId,
          from: String(fromNumber),
          to: String(formattedTo),
          message: String(message),
          type: 'sent',
          timestamp: new Date()
        })

        return res.json({ 
          success: true, 
          message: 'SMS logged in demo mode',
          id: sentMsg._id
        })
      } catch (dbErr) {
        console.error('SMS DB Error (Demo):', dbErr.message)
        return res.json({ success: true, message: 'SMS sent (demo, db save failed)' })
      }
    }

    // Production (Twilio)
    try {
      const twilio = await import('twilio')
      // Twilio package usually has a default export that is the client factory
      const TwilioClient = twilio.default || twilio
      const client = typeof TwilioClient === 'function' ? TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : new TwilioClient.RestClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
      
      const twilioRes = await client.messages.create({
        body: String(message),
        from: String(TWILIO_PHONE_NUMBER).startsWith('+') ? String(TWILIO_PHONE_NUMBER) : `+${TWILIO_PHONE_NUMBER}`,
        to: String(formattedTo)
      })

      let msgId = null
      try {
        const sentMsg = await SMSMessage.create({
          ownerId: userId,
          from: String(TWILIO_PHONE_NUMBER),
          to: String(formattedTo),
          message: String(message),
          type: 'sent',
          timestamp: new Date()
        })
        msgId = sentMsg._id
      } catch (dbErr) {
        console.error('SMS DB Error (Twilio):', dbErr.message)
      }

      res.json({ success: true, message: 'SMS sent via Twilio', sid: twilioRes.sid, id: msgId })
    } catch (err) {
      console.error('Twilio critical failure:', err.message)
      res.status(400).json({ 
        error: 'Twilio delivery failed', 
        details: err.message,
        hint: 'Check your Twilio credentials and ensure both numbers are in +91... format.'
      })
    }
  } catch (e) {
    console.error('Global Error in send-sms:', e)
    res.status(500).json({ error: 'Internal system error', details: e.message })
  }
})

// Get received emails
app.get('/api/messages/email/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    const messages = await EmailMessage.find({
      to: user.email,
      type: 'received'
    }).sort({ timestamp: -1 });

    res.json({ success: true, messages });
  } catch (e) {
    console.error('Error fetching received emails:', e);
    res.status(500).json({ error: 'Failed to fetch received emails', details: e.message });
  }
});

// Get sent emails
app.get('/api/messages/email/sent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    const messages = await EmailMessage.find({
      from: user.email,
      type: 'sent'
    }).sort({ timestamp: -1 });

    res.json({ success: true, messages });
  } catch (e) {
    console.error('Error fetching sent emails:', e);
    res.status(500).json({ error: 'Failed to fetch sent emails', details: e.message });
  }
});

// Get received SMS
app.get('/api/messages/sms/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    const messages = await SMSMessage.find({
      to: user.mobileNumber || user.email,
      type: 'received'
    }).sort({ timestamp: -1 });

    res.json({ success: true, messages });
  } catch (e) {
    console.error('Error fetching received SMS:', e);
    res.status(500).json({ error: 'Failed to fetch received SMS', details: e.message });
  }
});

// Get sent SMS
app.get('/api/messages/sms/sent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await SMSMessage.find({
      ownerId: userId,
      type: 'sent'
    }).sort({ timestamp: -1 });

    res.json({ success: true, messages });
  } catch (e) {
    console.error('Error fetching sent SMS:', e);
    res.status(500).json({ error: 'Failed to fetch sent SMS', details: e.message });
  }
});

// Get unread email count
app.get('/api/messages/email/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await EmailMessage.countDocuments({
      ownerId: userId,
      type: 'received',
      read: { $ne: true }
    });

    res.json({ success: true, count });
  } catch (e) {
    console.error('Error fetching unread email count:', e);
    res.status(500).json({ error: 'Failed to fetch unread email count', details: e.message });
  }
});

// Get unread SMS count
app.get('/api/messages/sms/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await SMSMessage.countDocuments({
      ownerId: userId,
      type: 'received',
      read: { $ne: true }
    });

    res.json({ success: true, count });
  } catch (e) {
    console.error('Error fetching unread SMS count:', e);
    res.status(500).json({ error: 'Failed to fetch unread SMS count', details: e.message });
  }
});

// Mark message as read
app.post('/api/messages/:type/:id/read', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'email' ? EmailMessage : SMSMessage;

    const message = await Model.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message });
  } catch (e) {
    console.error('Error marking message as read:', e);
    res.status(500).json({ error: 'Failed to mark message as read', details: e.message });
  }
});

// Delete message
app.delete('/api/messages/:type/:id', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'email' ? EmailMessage : SMSMessage;

    const message = await Model.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (e) {
    console.error('Error deleting message:', e);
    res.status(500).json({ error: 'Failed to delete message', details: e.message });
  }
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${port}`);
});
