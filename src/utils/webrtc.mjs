import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peer = null;
    this.stream = null;
    this.onCallListeners = [];
    this.onHangupListeners = [];
    this.isInCall = false;
    this.isConnecting = false;
    this.connectToSignalingServer();
  }

  connectToSignalingServer() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.socket = io('http://localhost:4000', {
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        this.isConnecting = false;
        this.setupSocketListeners();
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error);
        this.isConnecting = false;
        // Fall back to native dialer if WebRTC is not available
        if (this.onHangupListeners.length > 0) {
          this.onHangupListeners.forEach(listener => listener());
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from signaling server');
        this.isConnecting = false;
        if (this.isInCall) {
          this.endCall();
        }
      });

    } catch (error) {
      console.error('Failed to connect to signaling server:', error);
      this.isConnecting = false;
    }
  }

  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('call-made', async (data) => {
      if (this.isInCall) {
        this.socket.emit('reject-call', { from: data.from });
        return;
      }

      const confirmed = window.confirm(`Incoming call from ${data.from}`);
      if (!confirmed) {
        this.socket.emit('reject-call', { from: data.from });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false
        });
        
        this.stream = stream;
        this.peer = new SimplePeer({
          initiator: false,
          stream: this.stream,
          trickle: true,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('signal', signal => {
          this.socket.emit('make-answer', {
            signal,
            to: data.from
          });
        });

        this.peer.on('stream', remoteStream => {
          this.isInCall = true;
          this.onCallListeners.forEach(listener => listener(remoteStream));
        });

        this.peer.on('error', err => {
          console.error('Peer error:', err);
          this.endCall();
        });

        this.peer.signal(data.signal);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        this.socket.emit('reject-call', { from: data.from });
      }
    });

    this.socket.on('answer-made', data => {
      if (this.peer) {
        this.peer.signal(data.signal);
      }
    });

    this.socket.on('call-rejected', () => {
      alert('Call was rejected');
      this.endCall();
    });

    this.socket.on('user-disconnected', () => {
      if (this.isInCall) {
        this.endCall();
      }
    });
  }

  async makeCall(to) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to signaling server');
    }

    if (this.isInCall) {
      throw new Error('Already in a call');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });

      this.stream = stream;
      this.peer = new SimplePeer({
        initiator: true,
        stream: this.stream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('signal', signal => {
        this.socket.emit('make-call', { to, signal });
      });

      this.peer.on('stream', remoteStream => {
        this.isInCall = true;
        this.onCallListeners.forEach(listener => listener(remoteStream));
      });

      this.peer.on('error', err => {
        console.error('Peer error:', err);
        this.endCall();
      });

    } catch (err) {
      console.error('Error making call:', err);
      this.endCall();
      throw err;
    }
  }

  endCall() {
    this.isInCall = false;

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.onHangupListeners.forEach(listener => listener());
  }

  onCall(callback) {
    this.onCallListeners.push(callback);
  }

  onHangup(callback) {
    this.onHangupListeners.push(callback);
  }
}

const webRTCService = new WebRTCService();
export default webRTCService;