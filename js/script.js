const Board = (function () {
	let cells = Array(9).fill(null);

	function isValidIndex(index) {
		return index >= 0 && index < cells.length;
	}

	function isEmptyCell(index) {
		return cells[index] === null;
	}

	function getBoard() {
		return [...cells];
	}

	function placeMark(index, mark) {
		if (!isValidIndex(index)) return false;
		if (!isEmptyCell(index)) return false;

		cells[index] = mark;
		return true;
	}

	function reset() {
		cells = Array(9).fill(null);
	}

	function getEmptyCells() {
		const emptyCells = [];
		for (let i = 0; i < cells.length; i++) {
			if (cells[i] === null) {
				emptyCells.push(i);
			}
		}
		return emptyCells;
	}

	return {
		getBoard,
		placeMark,
		reset,
		getEmptyCells,
	};
})();

const GameRules = (function () {
	const WIN_PATTERNS = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];

	function checkWinner(board) {
		for (let combo of WIN_PATTERNS) {
			const [a, b, c] = combo;
			if (board[a] && board[a] === board[b] && board[a] === board[c]) {
				return board[a];
			}
		}
		return null;
	}

	function isTie(board) {
		const winner = checkWinner(board);
		if (winner) return false;

		for (const cell of board) {
			if (cell === null) {
				return false;
			}
		}

		return true;
	}

	function getGameStatus(board) {
		const winner = checkWinner(board);
		if (winner) {
			return {
				status: "win",
				winner: winner,
			};
		}

		if (isTie(board)) {
			return {
				status: "tie",
			};
		}

		return {
			status: "ongoing",
		};
	}

	return {
		checkWinner,
		isTie,
		getGameStatus,
	};
})();

const GameController = (function (deps) {
	const GAME_STATUS = {
		NOT_STARTED: "not_started",
		ONGOING: "ongoing",
		FINISHED: "finished",
	};

	let players = [];
	let currentPlayer = null;
	let mode = null;
	let gameStatus = GAME_STATUS.NOT_STARTED;

	let roundsPlayed = 0;
	const MAX_ROUNDS = 3;
	let score = { X: 0, O: 0 };

	function createPlayers(selectedMode) {
		if (selectedMode === "singleplayer") {
			return [Player("Human", "X"), Bot("Bot", "O")];
		}

		return [Player("Player 1", "X"), Player("Player 2", "O")];
	}

	const startGame = (selectedMode) => {
		if (gameStatus === GAME_STATUS.ONGOING) {
			throw new Error("Game already in progress");
		}

		players = createPlayers(selectedMode);
		currentPlayer = players[0];
		deps.board.reset();

		roundsPlayed = 0;
		score = { X: 0, O: 0 };
		gameStatus = GAME_STATUS.ONGOING;
		mode = selectedMode;

		return {
			status: gameStatus,
			currentPlayer: getCurrentPlayer(),
			mode,
		};
	};

	function changeTurn() {
		currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
		return currentPlayer;
	}

	function handleRoundEnd(roundResult) {
		if (roundResult.status === "win") {
			score[roundResult.winner]++;
		}

		roundsPlayed++;

		if (roundsPlayed === MAX_ROUNDS) {
			gameStatus = GAME_STATUS.FINISHED;

			const finalWinner =
				score.X > score.O ? "X" : score.O > score.X ? "O" : null;

			return {
				phase: "match-end",
				winner: finalWinner,
				score: { ...score },
			};
		}

		deps.board.reset();

		if (roundResult.status === "win") {
			currentPlayer = players.find(
				(player) => player.getMark() === roundResult.winner
			);
		} else {
			changeTurn();
		}

		return {
			phase: "round-end",
			roundResult: roundResult.status,
			winner: roundResult.winner || null,
			roundsPlayed,
			nextPlayer: currentPlayer.getMark(),
		};
	}

	function playMove(index) {
		if (gameStatus !== GAME_STATUS.ONGOING) {
			return {
				ok: false,
				reason: "game-not-active",
			};
		}

		const placed = deps.board.placeMark(index, getCurrentPlayer());
		if (!placed) {
			return {
				ok: false,
				reason: "invalid-move",
			};
		}

		const board = deps.board.getBoard();
		const result = deps.rules.getGameStatus(board);

		if (result.status !== "ongoing") {
			return {
				ok: true,
				state: handleRoundEnd(result),
			};
		}

		changeTurn();

		return {
			ok: true,
			state: {
				phase: "turn",
				nextPlayer: getCurrentPlayer(),
				shouldBotPlay: currentPlayer.isBot(),
			},
		};
	}

	function playBotMove() {
		if (!currentPlayer || !currentPlayer.isBot()) {
			return {
				ok: false,
				reason: "not-bot-turn",
			};
		}

		const board = deps.board.getBoard();
		const botMove = currentPlayer.chooseMove(board);

		if (botMove === null) {
			return {
				ok: false,
				reason: "not-moves-available",
			};
		}

		const placed = deps.board.placeMark(botMove, getCurrentPlayer());
		if (!placed) {
			return {
				ok: false,
				reason: "invalid-bot-move",
			};
		}

		const boardAfterBot = deps.board.getBoard();
		const result = deps.rules.getGameStatus(boardAfterBot);

		if (result.status !== "ongoing") {
			return {
				ok: true,
				state: handleRoundEnd(result),
			};
		}

		changeTurn();

		return {
			ok: true,
			state: {
				phase: "turn",
				nextPlayer: getCurrentPlayer(),
				shouldBotPlay: false,
			},
		};
	}

	function getCurrentPlayer() {
		return currentPlayer ? currentPlayer.getMark() : null;
	}

	function endGame() {
		players = [];
		currentPlayer = null;
		gameStatus = GAME_STATUS.NOT_STARTED;
		mode = null;
	}

	function resetGame() {
		if (gameStatus === GAME_STATUS.ONGOING) {
			const previousMode = mode;
			endGame();
			return {
				action: "restart",
				mode: previousMode,
			};
		}

		endGame();
		return { action: "back-to-setup" };
	}

	return {
		startGame,
		playMove,
		playBotMove,
		resetGame,
	};
})({
	board: {
		reset: Board.reset,
		placeMark: Board.placeMark,
		getBoard: Board.getBoard,
	},
	rules: {
		getGameStatus: GameRules.getGameStatus,
	},
});

function Player(name, mark) {
	const getName = () => name;
	const getMark = () => mark;
	const isBot = () => false;

	return {
		getName,
		getMark,
		isBot,
	};
}

function Bot(name, mark) {
	const getName = () => name;
	const getMark = () => mark;
	const isBot = () => true;

	function getAvailableMoves(board) {
		return board
			.map((cell, index) => (cell === null ? index : null))
			.filter((index) => index !== null);
	}

	function chooseMove(board) {
		const availableMoves = getAvailableMoves(board);
		if (availableMoves.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * availableMoves.length);
		return availableMoves[randomIndex];
	}

	return {
		getName,
		getMark,
		isBot,
		chooseMove,
	};
}

// UI elements and Display Controller
const UIElements = (function () {
	function createBoard() {
		const section = document.createElement("section");
		section.className = "game-board";

		const statusText = document.createElement("p");
		statusText.id = "game-status";
		statusText.textContent = "Game Started!";

		const grid = document.createElement("div");
		grid.className = "board-grid";

		for (let i = 0; i < 9; i++) {
			const cellBtn = document.createElement("button");
			cellBtn.className = "cell-btn";
			cellBtn.dataset.index = i;
			grid.appendChild(cellBtn);
		}

		const controls = document.createElement("div");
		controls.className = "board-controls";

		const backBtn = document.createElement("button");
		backBtn.className = "btn-secondary";
		backBtn.id = "back-btn";
		backBtn.textContent = "Back";

		const resetBtn = document.createElement("button");
		resetBtn.className = "btn-secondary";
		resetBtn.id = "reset-btn";
		resetBtn.textContent = "Reset";

		controls.appendChild(backBtn);
		controls.appendChild(resetBtn);

		section.appendChild(statusText);
		section.appendChild(grid);
		section.appendChild(controls);

		return {
			section,
			statusText,
			grid,
			backBtn,
			resetBtn,
		};
	}

	return { createBoard };
})();

const DisplayController = (function () {
	const gameContainer = document.querySelector(".game-container");
	const setupSection = document.querySelector(".game-setup");
	const singleplayerBtn = document.querySelector("#singleplayer-btn");
	const multiplayerBtn = document.querySelector("#multiplayer-btn");

	let boardElements = null;

	function init() {
		singleplayerBtn.addEventListener("click", () =>
			startGame("singleplayer")
		);
		multiplayerBtn.addEventListener("click", () =>
			startGame("multiplayer")
		);
	}

	function startGame(mode) {
		const result = GameController.startGame(mode);

		gameContainer.removeChild(setupSection);

		boardElements = UIElements.createBoard();
		gameContainer.appendChild(boardElements.section);

		bindBoardEvents();
		renderBoardState();
		updateStatus(`Turn of ${result.currentPlayer}`);
	}

	function bindBoardEvents() {
		const cells = boardElements.grid.querySelectorAll(".cell-btn");

		cells.forEach((cell) => {
			cell.addEventListener("click", () =>
				handleCellClick(parseInt(cell.dataset.index))
			);
		});

		boardElements.backBtn.addEventListener("click", showSetupScreen);
		boardElements.resetBtn.addEventListener("click", handleReset);
	}

	let isProcessing = false;

	function handleCellClick(index) {
		if(isProcessing) return;

		const result = GameController.playMove(index);
		if (!result.ok) return;

		renderBoardState();
		handleGameState(result.state);
	}

	function handleGameState(state) {
		switch (state.phase) {
			case "turn": {
				updateStatus(`Turn of ${state.nextPlayer}`);

				if (state.shouldBotPlay) {
					isProcessing = true;
					disableBoard();

					setTimeout(() => {
						const botResult = GameController.playBotMove();
						if (botResult.ok) {
							renderBoardState();
							handleGameState(botResult.state);
						}

						isProcessing = false;
						enableBoard()
					}, 500);
				}
				break;
			}

			case "round-end": {
				if (state.winner) {
					updateStatus(`${state.winner} wins the round!`);
				} else {
					updateStatus("Round Tied!");
				}

				isProcessing = true;
				disableBoard();

				setTimeout(() => {
					renderBoardState();
					updateStatus(`Round ${state.roundsPlayed + 1} - Turn of ${state.nextPlayer}`);

					isProcessing = false;
					enableBoard()
				}, 900);
				break;
			}

			case "match-end": {
				if (state.winner) {
					updateStatus(`${state.winner} wins the match | X: ${state.score.X} - O: ${state.score.O}`);
				} else {
					updateStatus(`Match tied | X: ${state.score.X} - O: ${state.score.O}`);
				}

				disableBoard();
				break;
			}
			default:
				console.warn(`Unknown game phase: ${state.phase}`);
		}
	}

	function disableBoard() {
		if (!boardElements || !boardElements.grid) return;
		const cells = boardElements.grid.querySelectorAll(".cell-btn");
		
		cells.forEach((cell) => {
			cell.disabled = true;
		});
	}

	function enableBoard() {
		if(!boardElements || !boardElements.grid) return;

		const board = Board.getBoard();
		const cells = boardElements.grid.querySelectorAll(".cell-btn");

		cells.forEach((cell, index) => {
			cell.disabled = board[index] !== null;
		})
	}

	function updateStatus(status) {
		if (boardElements && boardElements.statusText) {
			boardElements.statusText.textContent = status;
		}
	}

	function renderBoardState() {
		const board = Board.getBoard();
		const cells = boardElements.grid.querySelectorAll(".cell-btn");

		cells.forEach((cell, index) => {
			cell.textContent = board[index] ?? "";
			cell.disabled = board[index] !== null;
		});
	}

	function showSetupScreen() {
		if (boardElements && boardElements.section) {
			gameContainer.removeChild(boardElements.section);
			boardElements = null;
		}

		gameContainer.appendChild(setupSection);
	}

	function handleReset() {
		const result = GameController.resetGame();

		if (result.action === "restart") {
			const restartResult = GameController.startGame(result.mode);
			renderBoardState();
			updateStatus(`Turn of ${restartResult.currentPlayer}`);
		}

		if (result.action === "back-to-setup") {
			showSetupScreen();
		}
	}


	init();
})();
