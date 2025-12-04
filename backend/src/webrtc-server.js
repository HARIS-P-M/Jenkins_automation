import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Enable CORS
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server default port
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected users and their phone numbers
const connectedUsers = new Map();
const phoneToSocket = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle user registration with phone number
  socket.on('register', (data) => {
    console.log('User registered:', socket.id, 'with phone:', data.phone);
    connectedUsers.set(socket.id, { 
      id: socket.id, 
      phone: data.phone 
    });
    phoneToSocket.set(data.phone, socket.id);
    socket.emit('registered', { success: true });
  });

  // Handle call requests
  socket.on('make-call', (data) => {
    const targetSocketId = phoneToSocket.get(data.to);
    const targetUser = targetSocketId ? connectedUsers.get(targetSocketId) : null;
    
    console.log('Call request:', {
      from: socket.id,
      to: data.to,
      targetFound: !!targetUser
    });

    if (targetUser) {
      io.to(targetSocketId).emit('call-made', {
        from: socket.id,
        signal: data.signal
      });
    } else {
      socket.emit('call-failed', { 
        reason: 'User not available',
        to: data.to
      });
    }
  });

  // Handle call answers
  socket.on('make-answer', (data) => {
    const targetUser = connectedUsers.get(data.to);
    if (targetUser) {
      io.to(data.to).emit('answer-made', {
        from: socket.id,
        signal: data.signal
      });
    }
  });

  // Handle call rejections
  socket.on('reject-call', (data) => {
    const targetUser = connectedUsers.get(data.from);
    if (targetUser) {
      io.to(data.from).emit('call-rejected', {
        from: socket.id
      });
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('user-disconnected', { id: socket.id });
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`WebRTC signaling server running on http://localhost:${PORT}`);
});