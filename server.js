const socket = io();

const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const roomInput = document.getElementById('roomId');
const statusEl = document.getElementById('status');
const gameEl = document.querySelector('.game');
const boardEl = document.getElementById('board');
const symbolEl = document.getElementById('symbol');
const turnInfo = document.getElementById('turnInfo');
const resultEl = document.getElementById('result');

let roomId = null;
let mySymbol = null;
let myTurn = false;

joinBtn.addEventListener('click', () => {
  const id = roomInput.value.trim();
  if (!id) return;
  roomId = id;

  socket.emit('join', roomId, (res) => {
    if (!res.ok) {
      statusEl.innerText = res.msg;
      return;
    }
    mySymbol = res.symbol;
    statusEl.innerText = `Joined room: ${roomId}`;
    symbolEl.innerText = mySymbol;
    renderBoard(res.board);
    updateTurn(res.turn);

    document.querySelector('.room-container').classList.add('hidden');
    gameEl.classList.remove('hidden');
  });
});

leaveBtn.addEventListener('click', () => {
  if (roomId) {
    socket.emit('leave', roomId);
    resetUI();
  }
});

function renderBoard(board) {
  boardEl.innerHTML = '';
  board.forEach((cell, idx) => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.innerText = cell ? cell : '';
    div.addEventListener('click', () => {
      if (myTurn && !div.innerText) {
        socket.emit('move', { roomId, index: idx });
      }
    });
    boardEl.appendChild(div);
  });
}

function updateTurn(turnIndex) {
  const isMyTurn = (mySymbol === (turnIndex === 0 ? 'X' : 'O'));
  myTurn = isMyTurn;
  turnInfo.innerText = isMyTurn ? "Your turn" : "Opponent's turn";
}

// Socket listeners
socket.on('room_update', ({ players, symbols }) => {
  statusEl.innerText = `Room: ${roomId}, Players: ${players}`;
});

socket.on('move_made', ({ board, by, winner, draw }) => {
  renderBoard(board);
  if (winner) {
    resultEl.innerText = winner === mySymbol ? "🎉 You Win!" : "😢 You Lose!";
  } else if (draw) {
    resultEl.innerText = "🤝 It's a Draw!";
  }
});

socket.on('turn', ({ turn }) => {
  updateTurn(turn);
});

socket.on('reset', ({ board }) => {
  renderBoard(board);
  resultEl.innerText = '';
});

function resetUI() {
  roomId = null;
  mySymbol = null;
  myTurn = false;
  roomInput.value = '';
  statusEl.innerText = '';
  turnInfo.innerText = '';
  resultEl.innerText = '';
  gameEl.classList.add('hidden');
  document.querySelector('.room-container').classList.remove('hidden');
}
