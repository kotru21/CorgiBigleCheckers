import { BEAGLE } from "@/shared/config/constants";
import type {
  Board,
  MatchResult,
  PieceMove,
  Player,
} from "@/shared/types/game.types";
import {
  createMatchPosition,
  getLegalMoves,
  isSameMove,
  moveNotation,
  opponentOf,
  playMove,
  rulesFor,
  type DrawTracker,
  type MatchPosition,
  type RuleOptions,
} from "@/engine";
import { getModeNameShort } from "./modeHelpers";
import type { MoveSelection } from "./moveSelection";
import { botSideOf, isHumanControlled, type MatchSettings } from "./settings";

export interface HistoryEntry {
  move: PieceMove;
  notation: string;
  before: MatchPosition;
}

export interface MatchStart {
  board: Board;
  turn: Player;
}

export interface MatchSlice {
  matchId: number;
  revision: number;
  settings: MatchSettings;
  rules: RuleOptions;
  start: MatchStart;
  board: Board;
  turn: Player;
  draw: DrawTracker;
  result: MatchResult | null;
  history: HistoryEntry[];
  displayBoard: Board | null;
  selection: MoveSelection | null;
  hint: PieceMove | null;
  puzzleMistakes: number;
  gameMessage: string;
}

export function createMatchSlice(
  settings: MatchSettings,
  matchId: number,
  revision: number,
  start?: MatchStart
): MatchSlice {
  const rules = rulesFor(settings.variant, settings.mode);
  const position = createMatchPosition(rules, start?.board, start?.turn);
  return {
    matchId,
    revision,
    settings,
    rules,
    start: { board: position.board, turn: position.turn },
    board: position.board,
    turn: position.turn,
    draw: position.draw,
    result: null,
    history: [],
    displayBoard: null,
    selection: null,
    hint: null,
    puzzleMistakes: 0,
    gameMessage: turnMessage(settings, position.turn),
  };
}

export type MatchProgress = Pick<
  MatchSlice,
  "board" | "turn" | "draw" | "result" | "history"
>;

export function advanceMatch(
  slice: MatchSlice,
  move: Pick<PieceMove, "from" | "path">
): MatchProgress {
  const legal = getLegalMoves(slice.board, slice.turn, slice.rules);
  const chosen = legal.find((candidate) => isSameMove(candidate, move));
  if (!chosen) {
    throw new Error("Недопустимый ход");
  }
  const before: MatchPosition = {
    board: slice.board,
    turn: slice.turn,
    draw: slice.draw,
  };
  const { position, result } = playMove(before, chosen, slice.rules);
  return {
    board: position.board,
    turn: position.turn,
    draw: position.draw,
    result,
    history: [
      ...slice.history,
      {
        move: chosen,
        notation: moveNotation(chosen, legal, slice.rules),
        before,
      },
    ],
  };
}

const TEAM = { beagle: "бигли", corgi: "корги" } as const;
const TEAM_GENITIVE = { beagle: "биглей", corgi: "корги" } as const;
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

export const matchLabel = (settings: MatchSettings): string => {
  if (settings.puzzleId) {
    return "Задача";
  }
  const mode = getModeNameShort(settings.mode);
  return settings.variant === "russian" ? `Русские · ${mode}` : mode;
};

export function turnMessage(settings: MatchSettings, turn: Player): string {
  const label = matchLabel(settings);
  if (settings.opponent === "human") {
    return `${label} · ход ${TEAM_GENITIVE[turn]}`;
  }
  if (isHumanControlled(settings, turn)) {
    return `${label} · ваш ход`;
  }
  return `${label} · ${TEAM[turn]} думают…`;
}

export function resultMessage(
  result: MatchResult,
  settings: MatchSettings,
  rules: RuleOptions
): string {
  if (result.kind === "draw") {
    switch (result.reason) {
      case "repetition":
        return "Ничья: позиция повторилась трижды";
      case "kingMoves":
        return `Ничья: ${rules.kingMoveDrawPlies / 2} ходов только дамками без взятий`;
      case "endgame16":
        return "Ничья: 16 ходов против одинокой дамки";
      case "endgame15":
        return "Ничья: 15 ходов против одинокой дамки";
      case "endgame5":
        return "Ничья: 5 ходов против одинокой дамки";
    }
  }

  const { winner } = result;
  const loser = opponentOf(winner);
  if (settings.opponent === "human") {
    return result.byResignation
      ? `${capitalize(TEAM[loser])} сдались — победили ${TEAM[winner]}!`
      : `Победили ${TEAM[winner]}!`;
  }
  if (winner === settings.humanSide) {
    return settings.puzzleId
      ? "Задача решена!"
      : `Вы победили! ${capitalize(TEAM[winner])} одержали верх!`;
  }
  const bot = botSideOf(settings) ?? loser;
  return result.byResignation
    ? `Вы сдались. ${capitalize(TEAM[bot])} празднуют победу.`
    : `Вы проиграли! ${capitalize(TEAM[bot])} оказались хитрее!`;
}

export const humanMovesCount = (history: HistoryEntry[], side: Player) =>
  history.filter((entry) => entry.before.turn === side).length;

export const canUndo = (
  history: HistoryEntry[],
  settings: MatchSettings
): boolean =>
  settings.opponent === "human"
    ? history.length > 0
    : history.some((entry) => entry.before.turn === settings.humanSide);

export const isWhite = (side: Player) => side === BEAGLE;
