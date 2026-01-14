const Board = (function () {
	let board = Array(9).fill(null);

	// helpers
	function isValidIndex(index) {
		return index >= 0 && index < board.length;
	}

	function isEmptyCell(index) {
		return board[index] === null;
	}

	// internal functions
	function getBoard() {
		return [...board];
	}

	function placeMark(index, mark) {
		if (!isValidIndex(index)) return false;
		if (!isEmptyCell(index)) return false;

		board[index] = mark;
		return true;
	}

	function resetBoard() {
		board = Array(9).fill(null);
	}

	function getEmptyCells() {
		const emptyCells = [];
		for (let i = 0; i < board.length; i++) {
			if (board[i] === null) {
				emptyCells.push(i);
			}
		}
		return emptyCells;
	}

	return {
		getBoard,
		placeMark,
		resetBoard,
		getEmptyCells,
	};
})();

const GameRules = (function () {
	const winningCombinations = [
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
		for (let combo of winningCombinations) {
			const [a, b, c] = combo;
			if (board[a] && board[a] === board[b] && board[a] === board[c]) {
				return board[a];
			}
		}
		return null;
	}

	function isTie(board) {
		const winner = checkWinner(board);

		let isBoardFull = true;
		for (const cell of board) {
			if (cell === null) {
				isBoardFull = false;
				return false;
			}
		}

		if (!winner && isBoardFull) {
			return true;
		}

		return false;
	}

	function isGameOver(board) {
		const winner = checkWinner(board);
		const tie = isTie(board);
		if (winner || tie) {
			return true;
		}
		return false;
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
		isGameOver,
		getGameStatus,
	};
})();

const GameController = (function (deps) {
	let gamePlayers = [];
	let currentPlayer = null;
	let gameStatus = null;
	let roundsPlayed = 0;
	const MAX_ROUNDS = 3;
	let score = { X: 0, O: 0 };

	function startGame({ players, startingPlayer, MAX_ROUNDS = 3 }) {
		if (!Array.isArray(players) || players.length !== 2) {
			throw new Error("startGame requires exactly two players");
		}

		gamePlayers = players;
		if (startingPlayer === "X" || startingPlayer === "O") {
			currentPlayer = gamePlayers.find(
				(player) => player.getMark() === startingPlayer
			);
		} else {
			currentPlayer = gamePlayers[0];
		}

		deps.board.resetBoard();
		roundsPlayed = 0;
		score.X = 0;
		score.O = 0;
		gameStatus = "ongoing";

		return {
			status: gameStatus,
			currentPlayerMark: currentPlayer.getMark(),
		};
	}

	function changeTurn() {
		currentPlayer =
			currentPlayer === gamePlayers[0] ? gamePlayers[1] : gamePlayers[0];
		return currentPlayer;
	}

	function playMove(index) {
		if (gameStatus !== "ongoing") {
			return {
				ok: false,
				reason: "game-over",
			};
		}

		const placed = deps.board.placeMark(index, currentPlayer.getMark());
		if (!placed) {
			return {
				ok: false,
				reason: "invalid-move",
			};
		}

		const board = deps.board.getBoard();
		const result = deps.rules.getGameStatus(board);

		// turno normal
		if (result.status === "ongoing") {
			changeTurn();
			return {
				ok: true,
				state: {
					phase: "turn",
					nextPlayer: currentPlayer.getMark(),
				},
			};
		}

		// fin de ronda
		roundsPlayed++;

		if (result.status === "win") {
			score[result.winner]++;
		}

		if (roundsPlayed === MAX_ROUNDS) {
			gameStatus = "finished";
			return {
				ok: true,
				state: {
					phase: "match-end",
					winner: result.winner || null,
					score: { ...score },
				},
			};
		}

		// nueva ronda
		deps.board.resetBoard();
		if (result.status === "win") {
			currentPlayer = gamePlayers.find(
				(player) => player.getMark() === result.winner
			);
		} else {
			changeTurn();
		}

		return {
			ok: true,
			state: {
				phase: "round-end",
				roundResult: result.status,
				winner: result.winner || null,
				roundsPlayed,
				nextPlayer: currentPlayer.getMark(),
			},
		};
	}

	function getCurrentPlayer() {
		return currentPlayer.getMark();
	}

	function endGame() {
		gamePlayers = [];
		currentPlayer = null;
		gameStatus = null;
	}

	function resetGame() {
		if (gameStatus === "ongoing") {
			startGame({ players: gamePlayers });
			return {
				action: "restart",
				currentPlayer: currentPlayer.getMark(),
			};
		} else {
			endGame();
			return { action: "back-to-setup" };
		}
	}

	return {
		startGame,
		playMove,
		getCurrentPlayer,
		resetGame,
	};
})({
	board: {
		resetBoard: Board.resetBoard,
		placeMark: Board.placeMark,
		getBoard: Board.getBoard,
	},
	rules: {
		getGameStatus: GameRules.getGameStatus,
	},
});

function Player(playerName, playerMark, playerType) {
	const name = playerName;
	const mark = playerMark;
	const type = playerType;

	function getName() {
		return name;
	}

	function getMark() {
		return mark;
	}

	function isHuman() {
		return type === "human";
	}

	return {
		getName,
		getMark,
		isHuman,
	};
}

const DisplayController = (function () {
	const gameContainer = document.querySelector(".game-container");
	const setupSection = document.querySelector(".game-setup");
	let boardSection = null;
	let boardStatusText = null;

	function init() {
		const form = document.querySelector("#setup-form");
		form.addEventListener("submit", handleStartGame);

		gameContainer.appendChild(setupSection);
	}

	function handleStartGame(event) {
		event.preventDefault();

		const player1Name = document.querySelector("#player1-name").value;
		const player2Name = document.querySelector("#player2-name").value;

		const players = [
			Player(player1Name, "X", "human"),
			Player(player2Name, "O", "human"),
		];
		GameController.startGame({ players });

		gameContainer.removeChild(setupSection);
		boardRender();
		bindCellEvents();
		updateStatus("Game started!");

		boardSection = document.querySelector(".game-board");
		boardStatusText = document.querySelector("#game-status");
	}

	function boardRender() {
		boardSection = document.createElement("section");
		boardSection.className = "game-board";

		boardStatusText = document.createElement("p");
		boardStatusText.id = "game-status";
		boardStatusText.textContent = "Game Started!";

		const board = document.createElement("div");
		board.className = "board-grid";

		for (let i = 0; i < 9; i++) {
			const cellBtn = document.createElement("button");
			cellBtn.className = "cell-btn";
			cellBtn.dataset.index = i;
			board.appendChild(cellBtn);
		}

		const boardControls = document.createElement("div");
		boardControls.className = "board-controls";

		const backBtn = document.createElement("button");
		backBtn.className = "btn-secondary";
		backBtn.id = "back-btn";
		backBtn.textContent = "Back";
		backBtn.addEventListener("click", showSetupScreen);

		const resetBtn = document.createElement("button");
		resetBtn.className = "btn-secondary";
		resetBtn.id = "reset-btn";
		resetBtn.textContent = "Reset";
		resetBtn.addEventListener("click", resetGame);

		boardControls.appendChild(backBtn);
		boardControls.appendChild(resetBtn);

		boardSection.appendChild(boardStatusText);
		boardSection.appendChild(board);
		boardSection.appendChild(boardControls);

		gameContainer.appendChild(boardSection);
	}

	function bindCellEvents() {
		const cells = document.querySelectorAll(".cell-btn");

		cells.forEach((cell) => {
			cell.addEventListener("click", () => {
				const result = GameController.playMove(cell.dataset.index);
				if (!result.ok) return;
				renderBoardState();

				if (result.state.status === "ongoing") {
					updateStatus(`Turn of ${result.state.nextPlayer}`);
				} else if (result.state.status === "win") {
					updateStatus(`${result.state.winner} wins!`);
				} else {
					updateStatus("It's a Tie!");
				}
			});
		});
	}

	function updateStatus(status) {
		if (boardStatusText) {
			boardStatusText.textContent = status;
		}
	}

	function renderBoardState() {
		const board = Board.getBoard();
		const cells = document.querySelectorAll(".cell-btn");

		cells.forEach((cell, index) => {
			cell.textContent = board[index] ?? "";
		});
	}

	function showSetupScreen() {
		gameContainer.removeChild(boardSection);
		boardSection = null;
		boardStatusText = null;
		gameContainer.appendChild(setupSection);
	}

	function resetGame() {
		const result = GameController.resetGame();
		if (result.action === "restart") {
			renderBoardState();
			updateStatus(`Turn of ${result.currentPlayer}`);
		}

		if (result.action === "back-to-setup") {
			showSetupScreen();
		}
	}

	init();
})();
