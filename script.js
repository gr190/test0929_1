const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const HUMAN = BLACK;
const AI = WHITE;

let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let aiLevel = 'medium';
let timeLimit = 0;
let timer;
let remainingTime;

function initializeBoard() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    const mid = BOARD_SIZE / 2;
    board[mid-1][mid-1] = WHITE;
    board[mid-1][mid] = BLACK;
    board[mid][mid-1] = BLACK;
    board[mid][mid] = WHITE;
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.onclick = () => makeMove(i, j);
            if (board[i][j] !== EMPTY) {
                const disc = document.createElement('div');
                disc.className = `disc ${board[i][j] === BLACK ? 'black' : 'white'}`;
                cell.appendChild(disc);
            }
            boardElement.appendChild(cell);
        }
    }
    updateScore();
    updateStatus();
}

function updateScore() {
    let blackCount = 0;
    let whiteCount = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === BLACK) blackCount++;
            if (board[i][j] === WHITE) whiteCount++;
        }
    }
    document.getElementById('black-score').textContent = `黒: ${blackCount}`;
    document.getElementById('white-score').textContent = `白: ${whiteCount}`;
}

function updateStatus() {
    const statusElement = document.getElementById('status');
    if (gameOver) {
        const blackCount = board.flat().filter(cell => cell === BLACK).length;
        const whiteCount = board.flat().filter(cell => cell === WHITE).length;
        if (blackCount > whiteCount) {
            statusElement.textContent = 'プレイヤーの勝利!';
        } else if (whiteCount > blackCount) {
            statusElement.textContent = 'AIの勝利!';
        } else {
            statusElement.textContent = '引き分け!';
        }
    } else {
        statusElement.textContent = `現在の手番: ${currentPlayer === HUMAN ? 'プレイヤー' : 'AI'}`;
    }
}

function isValidMove(row, col, player) {
    if (board[row][col] !== EMPTY) return false;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let flipped = false;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (board[x][y] === EMPTY) break;
            if (board[x][y] === player) {
                if (flipped) return true;
                break;
            }
            flipped = true;
            x += dx;
            y += dy;
        }
    }

    return false;
}

function makeMove(row, col) {
    if (gameOver || currentPlayer !== HUMAN || !isValidMove(row, col, currentPlayer)) return;

    flipDiscs(row, col, currentPlayer);
    currentPlayer = AI;
    renderBoard();
    clearInterval(timer);

    if (canMove(currentPlayer)) {
        setTimeout(makeAIMove, 1000);
    } else {
        currentPlayer = HUMAN;
        if (!canMove(currentPlayer)) {
            gameOver = true;
        }
        renderBoard();
        startTimer();
    }
}

function flipDiscs(row, col, player) {
    board[row][col] = player;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        const toFlip = [];

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (board[x][y] === EMPTY) break;
            if (board[x][y] === player) {
                for (const [fx, fy] of toFlip) {
                    board[fx][fy] = player;
                }
                break;
            }
            toFlip.push([x, y]);
            x += dx;
            y += dy;
        }
    }
}

function canMove(player) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (isValidMove(i, j, player)) {
                return true;
            }
        }
    }
    return false;
}

function makeAIMove() {
    const moves = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (isValidMove(i, j, AI)) {
                const score = evaluateMove(i, j);
                moves.push({ row: i, col: j, score: score });
            }
        }
    }

    if (moves.length > 0) {
        let bestMove;
        switch (aiLevel) {
            case 'easy':
                bestMove = moves[Math.floor(Math.random() * moves.length)];
                break;
            case 'medium':
                moves.sort((a, b) => b.score - a.score);
                bestMove = moves[Math.floor(Math.random() * Math.min(3, moves.length))];
                break;
            case 'hard':
                bestMove = moves.reduce((best, move) => move.score > best.score ? move : best);
                break;
        }
        flipDiscs(bestMove.row, bestMove.col, AI);
    }

    currentPlayer = HUMAN;
    if (!canMove(currentPlayer)) {
        currentPlayer = AI;
        if (!canMove(currentPlayer)) {
            gameOver = true;
        }
    }

    renderBoard();
    startTimer();
}

function evaluateMove(row, col) {
    // 簡単な評価関数：角、端、その他の位置で重み付け
    const weights = [
        [100, -20, 10, 5, 5, 10, -20, 100],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [10, -2, -1, -1, -1, -1, -2, 10],
        [5, -2, -1, -1, -1, -1, -2, 5],
        [5, -2, -1, -1, -1, -1, -2, 5],
        [10, -2, -1, -1, -1, -1, -2, 10],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [100, -20, 10, 5, 5, 10, -20, 100]
    ];
    return weights[row][col];
}

function startTimer() {
    if (timeLimit > 0) {
        remainingTime = timeLimit;
        updateTimerDisplay();
        timer = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) {
                clearInterval(timer);
                makeRandomMove();
            }
        }, 1000);
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `残り時間: ${remainingTime}秒`;
}

function makeRandomMove() {
    const validMoves = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (isValidMove(i, j, HUMAN)) {
                validMoves.push({row: i, col: j});
            }
        }
    }
    if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        makeMove(randomMove.row, randomMove.col);
    }
}

document.getElementById('start-game').addEventListener('click', () => {
    aiLevel = document.getElementById('ai-level').value;
    timeLimit = parseInt(document.getElementById('time-limit').value);
    initializeBoard();
    renderBoard();
    gameOver = false;
    currentPlayer = HUMAN;
    startTimer();
});

initializeBoard();
renderBoard();
