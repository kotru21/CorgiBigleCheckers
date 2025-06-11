import { PLAYER, PLAYER_KING, BOT, BOT_KING } from "../models/Constants";

// Утилиты для работы с фигурами
export const pieceUtils = {
  isPlayerPiece: (piece) => piece === PLAYER || piece === PLAYER_KING,
  isBotPiece: (piece) => piece === BOT || piece === BOT_KING,
  isKing: (piece) => piece === PLAYER_KING || piece === BOT_KING,
  
  getPieceType: (piece) => {
    if (piece === PLAYER || piece === PLAYER_KING) return "player";
    if (piece === BOT || piece === BOT_KING) return "bot";
    return null;
  },
  
  shouldPromoteToKing: (piece, row, boardSize) => {
    return (piece === PLAYER && row === 0) || 
           (piece === BOT && row === boardSize - 1);
  }
};

// Утилиты для работы с доской
export const boardUtils = {
  isDarkSquare: (row, col) => (row + col) % 2 === 1,
  isValidPosition: (row, col, boardSize = 10) => 
    row >= 0 && row < boardSize && col >= 0 && col < boardSize,
  
  countPieces: (board) => {
    let playerPieces = 0;
    let botPieces = 0;
    
    board.forEach(row => {
      row.forEach(piece => {
        if (pieceUtils.isPlayerPiece(piece)) playerPieces++;
        if (pieceUtils.isBotPiece(piece)) botPieces++;
      });
    });
    
    return { playerPieces, botPieces };
  }
};

// Утилиты для валидации ходов
export const moveUtils = {
  isCapture: (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return rowDiff > 1 || colDiff > 1;
  },
  
  getCapturedPosition: (fromRow, fromCol, toRow, toCol) => {
    if (!moveUtils.isCapture(fromRow, fromCol, toRow, toCol)) {
      return null;
    }
    
    return {
      row: fromRow + Math.sign(toRow - fromRow),
      col: fromCol + Math.sign(toCol - fromCol)
    };
  }
};

// Кэш для оптимизации повторных вычислений
export class GameCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // Перемещаем в конец для LRU
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Удаляем самый старый элемент
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear() {
    this.cache.clear();
  }
  
  getBoardKey(board) {
    return board.map(row => row.join('')).join('|');
  }
}
