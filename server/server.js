
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Configure CORS - use environment variable for production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : "*";

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

let waitingPool = [];
const userPartners = {}; // Maps a user's socket.id to their partner's socket.id

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_waiting_pool', () => {
    console.log(`User ${socket.id} joined the waiting pool.`);
    
    // Ensure user is not already in the pool
    if (waitingPool.includes(socket.id)) return;

    if (waitingPool.length > 0) {
      // Pair found
      const partnerId = waitingPool.shift();
      console.log(`Pairing ${socket.id} with ${partnerId}`);
      
      userPartners[socket.id] = partnerId;
      userPartners[partnerId] = socket.id;

      // Notify both users they are matched
      io.to(socket.id).emit('matched', { partnerId });
      io.to(partnerId).emit('matched', { partnerId: socket.id });
    } else {
      // No pair found, add to waiting pool
      waitingPool.push(socket.id);
    }
  });

  socket.on('signal', (data) => {
    const { partnerId, signalData } = data;
    console.log(`Relaying signal from ${socket.id} to ${partnerId}`);
    io.to(partnerId).emit('signal', { signalData });
  });

  const cleanup = (initiatorId) => {
    const partnerId = userPartners[initiatorId];
    if (partnerId) {
        console.log(`Cleaning up session between ${initiatorId} and ${partnerId}`);
        io.to(partnerId).emit('user_left');
        delete userPartners[initiatorId];
        delete userPartners[partnerId];
    }
    // Also remove from waiting pool if they were in it
    waitingPool = waitingPool.filter(id => id !== initiatorId);
  }

  socket.on('hangup', () => {
    cleanup(socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    cleanup(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});
