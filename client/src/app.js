import { Game } from './game.js';
import { getCardDisplay } from './utils.js';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');
const game = new Game(socket);

const app = document.getElementById('app');

function render() {
  switch (game.state.gameState) {
    case 'lobby':
      renderLobby();
      break;
    case 'waiting':
      renderWaitingRoom();
      break;
    case 'guessing':
      renderGuessing();
      break;
    case 'judging':
      renderJudging();
      break;
    case 'gameOver':
      renderGameOver();
      break;
  }
}

function renderLobby() {
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-3xl font-bold text-center mb-6">Ride the Bus</h1>
      
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-4">Create a Room</h2>
        <div class="flex flex-col space-y-4">
          <input id="createName" type="text" placeholder="Your Name" class="input" required>
          <button id="createBtn" class="btn btn-primary">Create Room</button>
        </div>
      </div>
      
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-4">Join a Room</h2>
        <div class="flex flex-col space-y-4">
          <input id="joinCode" type="text" placeholder="Room Code" class="input" required>
          <input id="joinName" type="text" placeholder="Your Name" class="input" required>
          <button id="joinBtn" class="btn btn-secondary">Join Room</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('createBtn').addEventListener('click', () => {
    const name = document.getElementById('createName').value.trim();
    if (name) game.createRoom(name);
  });

  document.getElementById('joinBtn').addEventListener('click', () => {
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const name = document.getElementById('joinName').value.trim();
    if (code && name) game.joinRoom(code, name);
  });
}

function renderWaitingRoom() {
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-3xl font-bold text-center mb-6">Room: ${game.state.roomCode}</h1>
      
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2">Players (${game.state.players.length})</h2>
        <ul class="space-y-2">
          ${game.state.players.map(p => `
            <li class="flex items-center">
              <span class="font-medium">${p.name}</span>
              ${p.isDealer ? '<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Dealer</span>' : ''}
            </li>
          `).join('')}
        </ul>
      </div>
      
      ${game.state.isDealer ? `
        <button id="startBtn" class="btn btn-primary w-full">Start Game</button>
      ` : `
        <p class="text-center text-gray-600">Waiting for dealer to start the game...</p>
      `}
    </div>
  `;

  if (game.state.isDealer) {
    document.getElementById('startBtn').addEventListener('click', () => {
      if (game.state.players.length >= 2) {
        game.startGame();
      } else {
        alert('You need at least 2 players to start the game');
      }
    });
  }
}

function renderGuessing() {
  const card = getCardDisplay(game.state.currentCard);
  const isCurrentPlayer = game.state.currentPlayer === game.state.playerName;

  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold">Room: ${game.state.roomCode}</h1>
        <span class="px-3 py-1 bg-gray-200 rounded-full text-sm">Cards left: ${game.state.remainingCards}</span>
      </div>
      
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2">Current Player: ${game.state.currentPlayer}</h2>
        
        ${card ? `
          <div class="card ${card.color === 'red' ? 'card-red' : 'card-black'} mb-4">
            <div class="text-center">
              <div class="text-4xl">${card.symbol}</div>
              <div class="text-xl">${card.value}</div>
            </div>
          </div>
        ` : ''}
        
        ${isCurrentPlayer ? `
          <div class="mt-6 space-y-3">
            <p class="text-lg font-medium">Guess the next card:</p>
            <div class="flex space-x-4 justify-center">
              <button id="guessRed" class="btn btn-danger">Red</button>
              <button id="guessBlack" class="btn btn-secondary">Black</button>
            </div>
          </div>
        ` : `
          <p class="text-center text-gray-600 mt-4">Waiting for ${game.state.currentPlayer} to make a guess...</p>
        `}
      </div>
      
      <div class="mt-6">
        <h3 class="font-semibold mb-2">Players</h3>
        <ul class="space-y-2">
          ${game.state.players.map(p => `
            <li class="flex items-center ${p.name === game.state.currentPlayer ? 'font-bold text-blue-600' : ''}">
              ${p.name}
              ${p.isDealer ? '<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Dealer</span>' : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

  if (isCurrentPlayer) {
    document.getElementById('guessRed').addEventListener('click', () => game.makeGuess('red'));
    document.getElementById('guessBlack').addEventListener('click', () => game.makeGuess('black'));
  }
}

function renderJudging() {
  const card = getCardDisplay(game.state.currentCard);
  const isDealer = game.state.isDealer;

  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold">Room: ${game.state.roomCode}</h1>
        <span class="px-3 py-1 bg-gray-200 rounded-full text-sm">Cards left: ${game.state.remainingCards}</span>
      </div>
      
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2">${game.state.currentPlayer} guessed: ${game.state.currentGuess}</h2>
        
        ${card ? `
          <div class="card ${card.color === 'red' ? 'card-red' : 'card-black'} mb-4">
            <div class="text-center">
              <div class="text-4xl">${card.symbol}</div>
              <div class="text-xl">${card.value}</div>
            </div>
          </div>
        ` : ''}
        
        <p class="text-lg font-medium mb-4">The card was ${card.color}</p>
        
        ${isDealer ? `
          <div class="flex space-x-4 justify-center">
            <button id="correctBtn" class="btn btn-success">Correct</button>
            <button id="incorrectBtn" class="btn btn-danger">Incorrect</button>
          </div>
        ` : `
          <p class="text-center text-gray-600">Waiting for dealer to judge the guess...</p>
        `}
      </div>
    </div>
  `;

  if (isDealer) {
    document.getElementById('correctBtn').addEventListener('click', () => game.judgeGuess(true));
    document.getElementById('incorrectBtn').addEventListener('click', () => game.judgeGuess(false));
  }
}

function renderGameOver() {
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
      <h1 class="text-3xl font-bold mb-6">Game Over!</h1>
      <p class="text-xl mb-6">All cards have been drawn.</p>
      <button id="newGameBtn" class="btn btn-primary">Back to Lobby</button>
    </div>
  `;

  document.getElementById('newGameBtn').addEventListener('click', () => {
    game.state.gameState = 'lobby';
    render();
  });
}

// Initialize socket listeners
game.setupSocketListeners(render);

// Initial render
render();