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
	let currentPlayer = null;
	let gameStatus = null;

	function startGame(initialPlayer) {
		if (initialPlayer !== "X" && initialPlayer !== "O") {
			currentPlayer = "X";
		} else {
			currentPlayer = initialPlayer;
		}

		deps.board.resetBoard();
		gameStatus = "ongoing";
	}

	function changeTurn() {
		currentPlayer = currentPlayer === "X" ? "O" : "X";
		return currentPlayer;
	}

	function playMove(index) {
		if (gameStatus !== "ongoing") {
			return {
				ok: false,
				reason: "game-over",
			};
		}

		const placed = deps.board.placeMark(index, currentPlayer);
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
			nextPlayer: gameStatus === "ongoing" ? currentPlayer : null,
		};
	}

	function getCurrentPlayer() {
		return currentPlayer;
	}

	function resetGame() {
		startGame(currentPlayer);
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

// ZONA DE PRUEBAS
console.log("------------ juego simple -------------");
GameController.startGame("X");
console.log(GameController.playMove(0));
console.log(GameController.playMove(1));
console.log(GameController.playMove(4));
console.log(GameController.playMove(2));
console.log(GameController.playMove(8));
console.log(GameController.playMove(3));

const res = GameController.getCurrentPlayer();
console.log(res);
