const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const rooms = {};

io.on('connection', (socket) => {
  socket.on('create_room', () => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomCode] = { dealer: socket.id, players: [] };
    socket.join(roomCode);
    socket.emit('room_joined', { roomCode, players: [] });
  });

  socket.on('join_room', (roomCode) => {
    const room = rooms[roomCode];
    if (room) {
      room.players.push({ id: socket.id, guess: null });
      socket.join(roomCode);
      io.to(roomCode).emit('room_joined', { roomCode, players: room.players });
      io.to(roomCode).emit('player_list_update', room.players);
    }
  });

  socket.on('player_guess', ({ roomCode, guess }) => {
    const room = rooms[roomCode];
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.guess = guess;
        io.to(room.dealer).emit('player_list_update', room.players);
      }
    }
  });

  socket.on('confirm_guess', ({ roomCode, playerId, correct }) => {
    io.to(playerId).emit('guess_result', { correct });
    const room = rooms[roomCode];
    if (room) {
      const player = room.players.find(p => p.id === playerId);
      if (player) player.guess = null;
      io.to(roomCode).emit('player_list_update', room.players);
    }
  });

  socket.on('disconnect', () => {
    for (const [roomCode, room] of Object.entries(rooms)) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.dealer === socket.id) {
        delete rooms[roomCode];
        io.to(roomCode).emit('room_closed');
      } else {
        io.to(roomCode).emit('player_list_update', room.players);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
