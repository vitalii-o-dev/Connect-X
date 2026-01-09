const CACHE_NAME = 'connectx-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/vite.svg',
  '/icon.svg',
  '/service-worker.js',
];

const ROWS = 6;
const COLS = 7;
const CONNECT_TARGET = 4;

// ------------ FIND AND REMOVE ROWS OF 4 ------------
function findRowsOf4(board, target = CONNECT_TARGET) {
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  const cellsToRemove = new Set(); // Store as "r,c" strings to avoid duplicates
  const playerScores = { red: 0, yellow: 0 };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const color = board[r][c];
      if (!color) continue;

      for (const [dr, dc] of directions) {
        let streak = 1;
        const streakCells = [[r, c]];

        for (let k = 1; k < target; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;

          if (
            nr < 0 ||
            nr >= ROWS ||
            nc < 0 ||
            nc >= COLS ||
            board[nr][nc] !== color
          ) {
            break;
          }

          streak++;
          streakCells.push([nr, nc]);
        }

        if (streak === target) {
          // Mark all 4 cells for removal
          streakCells.forEach(([row, col]) => {
            cellsToRemove.add(`${row},${col}`);
          });
          // Add score for this player
          playerScores[color]++;
        }
      }
    }
  }

  return { cellsToRemove, playerScores };
}

// Remove cells and make pieces fall down
function removeCellsAndFall(board, cellsToRemove) {
  const newBoard = board.map((row) => [...row]);

  // Remove marked cells
  cellsToRemove.forEach((cellKey) => {
    const [r, c] = cellKey.split(',').map(Number);
    newBoard[r][c] = '';
  });

  // Make pieces fall down (gravity)
  for (let c = 0; c < COLS; c++) {
    let writeIndex = ROWS - 1; // Start from bottom
    
    // Move all non-empty cells down
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][c]) {
        if (r !== writeIndex) {
          newBoard[writeIndex][c] = newBoard[r][c];
          newBoard[r][c] = '';
        }
        writeIndex--;
      }
    }
  }

  return newBoard;
}

// Process board until no more rows of 4 exist
function processBoardUntilStable(board, target = CONNECT_TARGET) {
  let currentBoard = board.map((row) => [...row]);
  let totalScores = { red: 0, yellow: 0 };
  let changed = true;

  while (changed) {
    const { cellsToRemove, playerScores } = findRowsOf4(currentBoard, target);
    
    if (cellsToRemove.size === 0) {
      changed = false;
      break;
    }

    // Add scores
    totalScores.red += playerScores.red;
    totalScores.yellow += playerScores.yellow;

    // Remove cells and apply gravity
    currentBoard = removeCellsAndFall(currentBoard, cellsToRemove);
  }

  return { board: currentBoard, scores: totalScores };
}

// Process a move: drop piece, update board, check win
function processMove(board, column, currentPlayer) {
  const newBoard = board.map((row) => [...row]);

  // Drop piece in the column (find first empty spot from bottom)
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!newBoard[row][column]) {
      newBoard[row][column] = currentPlayer;
      break;
    }
  }

  return newBoard;
}

function checkWinner(matrix, row, col, player, target = CONNECT_TARGET) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  const inBounds = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

  const countInDirection = (dr, dc) => {
    let r = row + dr;
    let c = col + dc;
    let count = 0;
    while (inBounds(r, c) && matrix[r][c] === player) {
      count += 1;
      r += dr;
      c += dc;
    }
    return count;
  };

  return directions.some(([dr, dc]) => {
    const total = 1 + countInDirection(dr, dc) + countInDirection(-dr, -dc);
    return total >= target;
  });
}

async function handleGameMove(request) {
  try {
    const { matrix, currentPlayer, column } = await request.json();

    // Validate inputs
    if (!matrix || !currentPlayer || column === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: matrix, currentPlayer, column' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (column < 0 || column >= COLS) {
      return new Response(
        JSON.stringify({ error: 'Invalid column' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if column is full
    if (matrix[0][column]) {
      return new Response(
        JSON.stringify({ error: 'Column is full' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process the move: drop piece and get new matrix
    const newMatrix = processMove(matrix, column, currentPlayer);

    // Process board: remove rows of 4, make pieces fall, calculate scores
    const { board: finalMatrix, scores } = processBoardUntilStable(newMatrix);

    const boardFull = finalMatrix[0].every((cell) => cell !== '');
    return new Response(
      JSON.stringify({
        matrix: finalMatrix,
        scores: scores,
        boardFull,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process move', scores: { red: 0, yellow: 0 } }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleGame2Move(request) {
  try {
    const { matrix, currentPlayer, column, connectTarget } = await request.json();
    const target = connectTarget || CONNECT_TARGET;

    // Basic validation
    if (!matrix || !currentPlayer || column === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: matrix, currentPlayer, column' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (column < 0 || column >= COLS) {
      return new Response(
        JSON.stringify({ error: 'Invalid column' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (matrix[0][column]) {
      return new Response(
        JSON.stringify({ error: 'Column is full' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newBoard = matrix.map((row) => [...row]);
    let placedRow = -1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][column]) {
        newBoard[row][column] = currentPlayer;
        placedRow = row;
        break;
      }
    }

    const hasWinner =
      placedRow >= 0 ? checkWinner(newBoard, placedRow, column, currentPlayer, target) : false;

    const boardFull = newBoard[0].every((cell) => cell !== '');
    return new Response(
      JSON.stringify({
        matrix: newBoard,
        scores: { red: 0, yellow: 0 },
        winnerColor: hasWinner ? currentPlayer : null,
        hasWinner,
        boardFull,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process move', scores: { red: 0, yellow: 0 } }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(), // Take control of all clients immediately
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle game API endpoints (POST requests)
  if (request.method === 'POST') {
    if (url.pathname === '/api/game/move') {
      console.log('Service worker intercepting POST to /api/game/move');
      event.respondWith(handleGameMove(request));
      return;
    }
    if (url.pathname === '/api/game2/move') {
      console.log('Service worker intercepting POST to /api/game2/move');
      event.respondWith(handleGame2Move(request));
      return;
    }
  }

  // Handle GET requests (normal asset fetching)
  if (request.method !== 'GET') return;

  // Always try to serve the app shell for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        if (cached) return cached;
        return fetch(request);
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // If offline and not in cache, just fail gracefully
          return new Response('', {
            status: 503,
            statusText: 'Offline',
          });
        });
    }),
  );
});