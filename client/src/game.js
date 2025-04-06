export class Game {
  constructor(socket) {
    this.socket = socket;
    this.state = {
      roomCode: null,
      playerName: '',
      isDealer: false,
      players: [],
      gameState: 'lobby', // lobby, waiting, guessing, judging, gameOver
      currentPlayer: null,
      currentCard: null,
      currentGuess: null,
      remainingCards: 0
    };
  }

  createRoom(playerName) {
    this.state.playerName = playerName;
    this.state.isDealer = true;
    this.socket.emit('createRoom', playerName);
  }

  joinRoom(roomCode, playerName) {
    this.state.roomCode = roomCode;
    this.state.playerName = playerName;
    this.socket.emit('joinRoom', { roomCode, playerName });
  }

  startGame() {
    this.socket.emit('startGame', this.state.roomCode);
  }

  makeGuess(guess) {
    this.socket.emit('makeGuess', { roomCode: this.state.roomCode, guess });
  }

  judgeGuess(isCorrect) {
    this.socket.emit('judgeGuess', { roomCode: this.state.roomCode, isCorrect });
  }

  setupSocketListeners(updateCallback) {
    this.socket.on('roomCreated', (roomCode) => {
      this.state.roomCode = roomCode;
      this.state.gameState = 'waiting';
      updateCallback();
    });

    this.socket.on('playerJoined', (players) => {
      this.state.players = players;
      updateCallback();
    });

    this.socket.on('gameStarted', ({ currentPlayer, currentCard }) => {
      this.state.gameState = 'guessing';
      this.state.currentPlayer = currentPlayer;
      this.state.currentCard = currentCard;
      this.state.remainingCards = 51; // 52 cards total - 1 drawn
      updateCallback();
    });

    this.socket.on('guessMade', ({ playerName, guess, card }) => {
      this.state.gameState = 'judging';
      this.state.currentGuess = guess;
      this.state.currentCard = card;
      updateCallback();
    });

    this.socket.on('guessJudged', ({ playerName, guess, isCorrect, nextPlayer, remainingCards }) => {
      this.state.gameState = 'guessing';
      this.state.currentPlayer = nextPlayer;
      this.state.remainingCards = remainingCards;
      updateCallback();
    });

    this.socket.on('gameOver', () => {
      this.state.gameState = 'gameOver';
      updateCallback();
    });

    this.socket.on('roomDisbanded', (message) => {
      alert(message);
      this.state.gameState = 'lobby';
      updateCallback();
    });

    this.socket.on('playerLeft', (playerName) => {
      this.state.players = this.state.players.filter(p => p.name !== playerName);
      updateCallback();
    });

    this.socket.on('error', (message) => {
      alert(message);
    });
  }
}