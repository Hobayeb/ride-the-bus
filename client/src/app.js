import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001');

export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [players, setPlayers] = useState([]);
  const [guess, setGuess] = useState('');

  useEffect(() => {
    socket.on('room_joined', ({ roomCode, players }) => {
      setJoinedRoom(true);
      setPlayers(players);
    });

    socket.on('player_list_update', setPlayers);
  }, []);

  const createRoom = () => {
    socket.emit('create_room');
    setIsDealer(true);
  };

  const joinRoom = () => {
    if (roomCode) {
      socket.emit('join_room', roomCode);
    }
  };

  const sendGuess = () => {
    socket.emit('player_guess', { roomCode, guess });
    setGuess('');
  };

  const handleConfirmGuess = (playerId, correct) => {
    socket.emit('confirm_guess', { roomCode, playerId, correct });
  };

  return (
    <div className="p-4 text-center">
      {!joinedRoom ? (
        <div>
          <button onClick={createRoom} className="btn">Create Room</button>
          <div className="my-4">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="border px-2 py-1"
            />
            <button onClick={joinRoom} className="btn ml-2">Join Room</button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Room: {roomCode}</h2>
          <h3 className="mb-2">Players:</h3>
          <ul className="mb-4">
            {players.map((p) => (
              <li key={p.id}>
                {p.id}
                {isDealer && (
                  <span className="ml-4">
                    <button onClick={() => handleConfirmGuess(p.id, true)} className="btn mr-1 bg-green-600 hover:bg-green-700">✔</button>
                    <button onClick={() => handleConfirmGuess(p.id, false)} className="btn bg-red-600 hover:bg-red-700">✖</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {!isDealer && (
            <div>
              <input
                type="text"
                placeholder="Your guess"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="border px-2 py-1"
              />
              <button onClick={sendGuess} className="btn ml-2">Submit Guess</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
