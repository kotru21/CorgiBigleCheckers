import { describe, expect, it } from "vitest";
import { BEAGLE, BEAGLE_KING, CORGI } from "@/shared/config/constants";
import { boardWith, pos } from "../helpers/boards";
import {
  CLASSIC_RULES,
  createInitialBoard,
  formatGameRecord,
  getLegalMoves,
  moveNotation,
  RUSSIAN_RULES,
  squareLabel,
} from "@/engine";

describe("нотация", () => {
  it("международная: поля 1–50 от стороны чёрных", () => {
    expect(squareLabel(pos(0, 1), CLASSIC_RULES)).toBe("1");
    expect(squareLabel(pos(9, 8), CLASSIC_RULES)).toBe("50");
    expect(squareLabel(pos(6, 1), CLASSIC_RULES)).toBe("31");
  });

  it("русская: буква вертикали и номер горизонтали", () => {
    expect(squareLabel(pos(7, 0), RUSSIAN_RULES)).toBe("a1");
    expect(squareLabel(pos(5, 2), RUSSIAN_RULES)).toBe("c3");
    expect(squareLabel(pos(0, 7), RUSSIAN_RULES)).toBe("h8");
  });

  it("тихий ход и взятие", () => {
    const opening = getLegalMoves(createInitialBoard(8), BEAGLE, RUSSIAN_RULES);
    const c3d4 = opening.find((m) => m.from.col === 2 && m.path[0].col === 3)!;
    expect(moveNotation(c3d4, opening, RUSSIAN_RULES)).toBe("c3-d4");

    const board = boardWith([
      [6, 5, BEAGLE],
      [5, 4, CORGI],
      [3, 4, CORGI],
    ]);
    const legal = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(moveNotation(legal[0], legal, CLASSIC_RULES)).toBe("33x13");
  });

  it("в международной нотации путь пишется, только если иначе неоднозначно", () => {
    const board = boardWith([
      [6, 1, BEAGLE],
      [5, 2, CORGI],
      [3, 2, CORGI],
    ]);
    const legal = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(moveNotation(legal[0], legal, CLASSIC_RULES)).toBe("31x11");

    const viaLeft = {
      from: pos(6, 5),
      path: [pos(4, 3), pos(2, 5)],
      captures: [pos(5, 4), pos(3, 4)],
    };
    const viaRight = {
      from: pos(6, 5),
      path: [pos(4, 7), pos(2, 5)],
      captures: [pos(5, 6), pos(3, 6)],
    };
    expect(moveNotation(viaLeft, [viaLeft, viaRight], CLASSIC_RULES)).toBe(
      "33x22x13"
    );

    const russian = boardWith(
      [
        [5, 0, BEAGLE_KING],
        [4, 1, CORGI],
      ],
      8
    );
    const rLegal = getLegalMoves(russian, BEAGLE, RUSSIAN_RULES);
    expect(rLegal.map((m) => moveNotation(m, rLegal, RUSSIAN_RULES))).toContain(
      "a3:c5"
    );
  });

  it("запись партии нумерует ходы парами", () => {
    expect(formatGameRecord(["32-28", "19-23", "28x19"], true)).toBe(
      "1. 32-28 19-23 2. 28x19"
    );
    expect(formatGameRecord(["19-23"], false)).toBe("1. ... 19-23");
  });
});
