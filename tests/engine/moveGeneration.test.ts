import { describe, expect, it } from "vitest";
import {
  CORGI,
  CORGI_KING,
  BEAGLE,
  BEAGLE_KING,
} from "@/shared/config/constants";
import type { PieceMove } from "@/shared/types/game.types";
import { boardWith, pos } from "../helpers/boards";
import { applyMove } from "@/engine/applyMove";
import { copyBoard, createInitialBoard } from "@/engine/board";
import {
  CLASSIC_RULES,
  finalSquare,
  getCaptureSequences,
  getLegalMoves,
  rulesFor,
} from "@/engine";

const describeMove = (move: PieceMove) =>
  [move.from, ...move.path].map((p) => `${p.row}${p.col}`).join("-");

describe("getLegalMoves", () => {
  it("в начальной позиции у игрока 9 ходов, у бота тоже 9", () => {
    const board = createInitialBoard();
    expect(getLegalMoves(board, BEAGLE, CLASSIC_RULES)).toHaveLength(9);
    expect(getLegalMoves(board, CORGI, CLASSIC_RULES)).toHaveLength(9);
  });

  it("простая шашка ходит только вперёд, дамка — на любое расстояние", () => {
    const board = boardWith([
      [5, 6, BEAGLE],
      [9, 0, BEAGLE_KING],
      [0, 9, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES).map(describeMove);
    expect(moves.filter((m) => m.startsWith("56-")).sort()).toEqual([
      "56-45",
      "56-47",
    ]);
    expect(moves.filter((m) => m.startsWith("90-"))).toHaveLength(8);
  });

  it("взятие обязательно: тихие ходы запрещены", () => {
    const board = boardWith([
      [6, 1, BEAGLE],
      [5, 2, CORGI],
      [9, 8, BEAGLE],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(moves.map(describeMove)).toEqual(["61-43"]);
  });

  it("простая шашка бьёт назад", () => {
    const board = boardWith([
      [4, 3, BEAGLE],
      [5, 4, CORGI],
    ]);
    expect(
      getLegalMoves(board, BEAGLE, CLASSIC_RULES).map(describeMove)
    ).toEqual(["43-65"]);
  });

  it("правило большинства: разрешены только самые длинные серии", () => {
    const board = boardWith([
      [6, 1, BEAGLE],
      [5, 2, CORGI],
      [3, 2, CORGI],
      [6, 7, BEAGLE],
      [5, 8, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(moves.map(describeMove)).toEqual(["61-43-21"]);
    expect(moves[0].captures).toEqual([pos(5, 2), pos(3, 2)]);
  });

  it("при равных сериях у двух шашек обе серии допустимы целиком", () => {
    const board = boardWith([
      [6, 1, BEAGLE],
      [5, 2, CORGI],
      [3, 2, CORGI],
      [6, 7, BEAGLE],
      [5, 8, CORGI],
      [3, 8, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES).map(describeMove);
    expect(moves.sort()).toEqual(["61-43-21", "67-49-27"]);
  });

  it("равные по длине варианты одной шашки сохраняются все", () => {
    const board = boardWith([
      [6, 5, BEAGLE],
      [5, 4, CORGI],
      [3, 2, CORGI],
      [3, 4, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES).map(describeMove);
    expect(moves.sort()).toEqual(["65-43-21", "65-43-25"]);
  });
});

describe("серии взятий", () => {
  it("турецкий удар: через побитую шашку нельзя пройти второй раз", () => {
    const board = boardWith([
      [7, 0, BEAGLE_KING],
      [5, 2, CORGI],
      [5, 6, CORGI],
      [8, 7, CORGI],
      [4, 1, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(Math.max(...moves.map((m) => m.captures.length))).toBe(3);
    expect(moves.every((m) => m.captures.length === 3)).toBe(true);
  });

  it("дамка не перепрыгивает две фигуры подряд", () => {
    const board = boardWith([
      [9, 0, BEAGLE_KING],
      [6, 3, CORGI],
      [5, 4, CORGI],
    ]);
    expect(getCaptureSequences(board, pos(9, 0), CLASSIC_RULES)).toEqual([]);
  });

  it("дамка выбирает любое свободное поле за побитой фигурой", () => {
    const board = boardWith([
      [9, 0, BEAGLE_KING],
      [6, 3, CORGI],
    ]);
    const finals = getCaptureSequences(board, pos(9, 0), CLASSIC_RULES).map(
      (m) => finalSquare(m)
    );
    expect(finals).toEqual([
      pos(5, 4),
      pos(4, 5),
      pos(3, 6),
      pos(2, 7),
      pos(1, 8),
      pos(0, 9),
    ]);
  });

  it("дамка может пройти через своё исходное поле и закончить на нём", () => {
    const board = boardWith([
      [6, 1, BEAGLE_KING],
      [5, 2, CORGI],
      [5, 4, CORGI],
      [7, 4, CORGI],
      [7, 2, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(moves.every((m) => m.captures.length === 4)).toBe(true);
    const roundTrip = moves.find(
      (m) => finalSquare(m).row === 6 && finalSquare(m).col === 1
    );
    expect(roundTrip).toBeDefined();

    const after = applyMove(board, roundTrip!);
    expect(after[6][1]).toBe(BEAGLE_KING);
    expect(after.flat().filter((p) => p === CORGI)).toHaveLength(0);
  });

  it("шашка, прошедшая дамочное поле посреди серии, бьёт дальше как простая", () => {
    const board = boardWith([
      [2, 3, BEAGLE],
      [1, 4, CORGI],
      [1, 6, CORGI],
      [9, 0, CORGI],
    ]);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(moves.map(describeMove)).toEqual(["23-05-27"]);

    const after = applyMove(board, moves[0]);
    expect(after[2][7]).toBe(BEAGLE);
    expect(after[1][4]).toBeNull();
    expect(after[1][6]).toBeNull();
  });

  it("шашка становится дамкой, если закончила ход на последней горизонтали", () => {
    const board = boardWith([
      [2, 3, BEAGLE],
      [1, 4, CORGI],
      [9, 0, CORGI],
    ]);
    const [move] = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(applyMove(board, move)[0][5]).toBe(BEAGLE_KING);
  });

  it("корги превращается на девятой горизонтали", () => {
    const board = boardWith([
      [8, 1, CORGI],
      [0, 9, BEAGLE],
    ]);
    const move = getLegalMoves(board, CORGI, CLASSIC_RULES).find(
      (m) => finalSquare(m).col === 0
    )!;
    expect(applyMove(board, move)[9][0]).toBe(CORGI_KING);
  });

  it("«Безумные прыжки»: простая шашка приземляется на любое поле за фигурой", () => {
    const board = boardWith([
      [6, 3, BEAGLE],
      [5, 2, CORGI],
    ]);
    const classic = getCaptureSequences(board, pos(6, 3), CLASSIC_RULES);
    const crazy = getCaptureSequences(
      board,
      pos(6, 3),
      rulesFor("international", "crazy_jumps")
    );
    expect(classic.map(finalSquare)).toEqual([pos(4, 1)]);
    expect(crazy.map(finalSquare)).toEqual([pos(4, 1), pos(3, 0)]);
  });

  it("генерация ходов не меняет доску, applyMove возвращает новую", () => {
    const board = boardWith([
      [6, 1, BEAGLE_KING],
      [5, 2, CORGI],
      [5, 4, CORGI],
    ]);
    const snapshot = copyBoard(board);
    const moves = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(board).toEqual(snapshot);
    applyMove(board, moves[0]);
    expect(board).toEqual(snapshot);
  });
});
