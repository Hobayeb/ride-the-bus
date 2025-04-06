const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory game state
const rooms = new Map();

// Helper functions
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  
  return deck;
};

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on('createRoom', (playerName) => {
    const roomCode = generateRoomCode();
    const deck = shuffleDeck(createDeck());
    
    const newRoom = {
      code: roomCode,
      dealer: socket.id,
      players: [{ id: socket.id, name: playerName, isDealer: true }],
      currentPlayerIndex: 0,
      deck,
      currentCard: null,
      gameState: 'waiting', // waiting, guessing, judging, gameOver
      currentGuess: null,
    };
    
    rooms.set(roomCode, newRoom);
    socket.join(roomCode);
    
    socket.emit('roomCreated', roomCode);
    console.log(`Room created: ${roomCode}`);
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    if (room.players.some(player => player.name === playerName)) {
      socket.emit('error', 'Name already taken in this room');
      return;
    }
    
    room.players.push({ id: socket.id, name: playerName, isDealer: false });
    socket.join(roomCode);
    
    io.to(roomCode).emit('playerJoined', room.players);
    console.log(`Player ${playerName} joined room ${roomCode}`);
  });

  // Start the game
  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    
    if (!room || socket.id !== room.dealer) {
      socket.emit('error', 'Only the dealer can start the game');
      return;
    }
    
    room.gameState = 'guessing';
    room.currentCard = room.deck.pop();
    
    io.to(roomCode).emit('gameStarted', {
      currentPlayer: room.players[room.currentPlayerIndex].name,
      currentCard: room.currentCard
    });
  });

  // Player makes a guess
  socket.on('makeGuess', ({ roomCode, guess }) => {
    const room = rooms.get(roomCode);
    
    if (!room || room.gameState !== 'guessing') {
      socket.emit('error', 'Not in guessing phase');
      return;
    }
    
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('error', 'Not your turn');
      return;
    }
    
    room.currentGuess = guess;
    room.gameState = 'judging';
    
    io.to(roomCode).emit('guessMade', {
      playerName: currentPlayer.name,
      guess,
      card: room.currentCard
    });
  });

  // Dealer judges the guess
  socket.on('judgeGuess', ({ roomCode, isCorrect }) => {
    const room = rooms.get(roomCode);
    
    if (!room || socket.id !== room.dealer || room.gameState !== 'judging') {
      socket.emit('error', 'Only the dealer can judge guesses');
      return;
    }
    
    const currentPlayer = room.players[room.currentPlayerIndex];
    
    // Move to next player
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    room.currentCard = room.deck.pop();
    room.gameState = 'guessing';
    
    io.to(roomCode).emit('guessJudged', {
      playerName: currentPlayer.name,
      guess: room.currentGuess,
      isCorrect,
      nextPlayer: room.players[room.currentPlayerIndex].name,
      remainingCards: room.deck.length
    });
    
    if (room.deck.length === 0) {
      room.gameState = 'gameOver';
      io.to(roomCode).emit('gameOver');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and remove the player from any rooms they're in
    for (const [roomCode, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        // If dealer leaves, disband the room
        if (player.isDealer) {
          io.to(roomCode).emit('roomDisbanded', 'The dealer has left the game');
          rooms.delete(roomCode);
          console.log(`Room disbanded: ${roomCode}`);
        } else {
          io.to(roomCode).emit('playerLeft', player.name);
        }
        
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});