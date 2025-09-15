// server.js (Node backend)
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// in-memory rooms for demo
const rooms = {};

io.on('connection', (socket) => {
  console.log('⚡ New client connected');

  socket.on('join', (roomId, callback) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { board: Array(9).fill(null), turn: 0, players: [] };
    }

    if (rooms[roomId].players.length >= 2) {
      return callback({ ok: false, msg: 'Room full' });
    }

    const symbol = rooms[roomId].players.length === 0 ? 'X' : 'O';
    rooms[roomId].players.push(socket.id);

    socket.join(roomId);
    callback({ ok: true, symbol, board: rooms[roomId].board, turn: rooms[roomId].turn });
    io.to(roomId).emit('room_update', { players: rooms[roomId].players.length });
  });

  socket.on('move', ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room) return;

    const symbol = room.turn === 0 ? 'X' : 'O';
    if (!room.board[index]) {
      room.board[index] = symbol;
      room.turn = 1 - room.turn;
      io.to(roomId).emit('move_made', { board: room.board });
      io.to(roomId).emit('turn', { turn: room.turn });
    }
  });

  socket.on('leave', (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
      if (rooms[roomId].players.length === 0) delete rooms[roomId];
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
