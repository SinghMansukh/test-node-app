// server.js test
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve static files from /public demo
app.use(express.static(path.join(__dirname, 'public')));

// In-memory rooms data (for demo only)
const rooms = {}; // { roomId: { board: Array(9), players: [socketId,...], turn: 0, symbols: {socketId: 'X'|'O'} } }

function createRoom(roomId) {
  rooms[roomId] = {
    board: Array(9).fill(null),
    players: [],
    turn: 0, // index in players array
    symbols: {}
  };
}

io.on('connection', (socket) => {
  console.log('conn:', socket.id);

  socket.on('join', (roomId, cb) => {
    if (!rooms[roomId]) createRoom(roomId);
    const room = rooms[roomId];

    if (!room.players.includes(socket.id)) {
      if (room.players.length >= 2) {
        cb({ ok: false, msg: 'Room full' });
        return;
      }
      room.players.push(socket.id);
      room.symbols[socket.id] = room.players.length === 1 ? 'X' : 'O';
    }

    socket.join(roomId);
    io.to(roomId).emit('room_update', {
      players: room.players.length,
      symbols: room.symbols
    });

    cb({ ok: true, symbol: room.symbols[socket.id], board: room.board, turn: room.turn });
  });

  socket.on('move', ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room) return;
    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex === -1) return;
    if (room.turn !== playerIndex) return; // not your turn
    if (room.board[index] !== null) return; // occupied

    room.board[index] = room.symbols[socket.id];

    // check win/draw
    const winner = checkWinner(room.board);
    const draw = room.board.every(cell => cell !== null);

    io.to(roomId).emit('move_made', { board: room.board, by: socket.id, winner, draw });

    if (winner || draw) {
      // reset after short delay
      setTimeout(() => {
        room.board = Array(9).fill(null);
        room.turn = 0;
        io.to(roomId).emit('reset', { board: room.board });
      }, 4000);
    } else {
      room.turn = 1 - room.turn;
      io.to(roomId).emit('turn', { turn: room.turn });
    }
  });

  socket.on('leave', (roomId) => {
    cleanupSocketFromRoom(socket, roomId);
  });

  socket.on('disconnect', () => {
    // remove from any rooms
    for (const roomId of Object.keys(rooms)) {
      cleanupSocketFromRoom(socket, roomId);
    }
  });
});

function cleanupSocketFromRoom(socket, roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const idx = room.players.indexOf(socket.id);
  if (idx !== -1) {
    room.players.splice(idx, 1);
    delete room.symbols[socket.id];

    io.to(roomId).emit('room_update', { players: room.players.length, symbols: room.symbols });

    if (room.players.length === 0) {
      delete rooms[roomId];
    } else {
      if (room.turn >= room.players.length) room.turn = 0;
      io.to(roomId).emit('turn', { turn: room.turn });
    }
  }
}

function checkWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b1,c] of lines) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  return null;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
