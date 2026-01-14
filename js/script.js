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

	function startGame({ players, startingPlayer }) {
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
		gameStatus = "ongoing";
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
		if (result.status === "ongoing") {
			changeTurn();
		} else {
			gameStatus = result.status;
		}

		return {
			ok: true,
			status: result.status,
			winner: result.winner || null,
			nextPlayer:
				result.status === "ongoing" ? currentPlayer.getMark() : null,
		};
	}

	function getCurrentPlayer() {
		return currentPlayer.getMark();
	}

	function resetGame() {
		startGame({ players: gamePlayers });
	}

	return {
		changeTurn,
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
	}

	function boardRender() {
		const boardSection = document.createElement("section");
		boardSection.className = "game-board";

		const statusText = document.createElement("p");
		statusText.id = "game-status";

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

		const resetBtn = document.createElement("button");
		resetBtn.className = "btn-secondary";
		resetBtn.id = "reset-btn";
		resetBtn.textContent = "Reset";

		boardControls.appendChild(backBtn);
		boardControls.appendChild(resetBtn);

		boardSection.appendChild(statusText);
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

				if (result.status === "ongoing") {
					updateStatus(`Turn of ${result.nextPlayer}`);
				} else {
					updateStatus(
						result.winner ? `${result.winner} win` : "It's a Tie"
					);
				}
			});
		});
	}

	function updateStatus(status) {
		const statusText = document.querySelector("#game-status");
		if (statusText) {
			statusText.textContent = status;
		}
	}

	function renderBoardState() {
		const board = Board.getBoard();
		const cells = document.querySelectorAll(".cell-btn");

		cells.forEach((cell, index) => {
			cell.textContent = board[index] ?? "";
		});
	}

	init();
})();
