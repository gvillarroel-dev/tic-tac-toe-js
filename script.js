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

// ZONA DE PRUEBAS

console.log("\n---------- verificar victoria ----------");
console.log(GameRules.checkWinner(Board.getBoard()));

let boardWin = ["x", "x", "x", "O", "O", null, "O", null, null];
let boardTie = ["x", "O", "x", "O", "O", "X", "O", "X", "O"];
let boardOngoing = ["X", null, null, null, "O", null, null, null, null];
let boardFull = ["O", "X", "O", "O", "X", "X", "X", "O", "X"];

console.log("\n---------- verificar estado del tablero: tablero con ganador ----------");
console.log(GameRules.isTie(boardWin));
console.log("\n---------- verificar estado del tablero: empate ----------");
console.log(GameRules.isTie(boardTie));
console.log("\n---------- verificar estado del tablero: tablero en juego ----------");
console.log(GameRules.isTie(boardOngoing));

console.log("\n---------- verificar juego terminado: sin ganador ----------");
console.log(GameRules.isGameOver(boardFull));

console.log("\n---------- estado del juego: tablero en juego ----------");
console.log(GameRules.getGameStatus(boardOngoing));

console.log("\n---------- estado del juego: juego ganado ----------");
console.log(GameRules.getGameStatus(boardWin));

console.log("\n---------- estado del juego: empate ----------");
console.log(GameRules.getGameStatus(boardTie));
