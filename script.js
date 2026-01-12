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


// ZONA DE PRUEBAS
console.log("-------------- obtener board --------------");
console.log(Board.getBoard().data);

console.log("\n-------------- colocar una marca válida --------------");
console.log(Board.placeMark(0, "X"));

console.log("\n-------------- colocar una marca duplicada --------------");
console.log(Board.placeMark(0, "X"));

console.log("\n-------------- colocar marcas consecutivas --------------");
console.log(Board.placeMark(1, "X"));
console.log(Board.placeMark(2, "X"));
console.log(Board.getBoard());

console.log("\n-------------- obtener celdas vacías --------------");
console.log(Board.getEmptyCells());

console.log("\n-------------- resetear tablero --------------");
Board.resetBoard();
console.log(Board.getBoard());

console.log("\n---------- obtener celdas vacías luego de resetear ----------");
console.log(Board.getEmptyCells());
