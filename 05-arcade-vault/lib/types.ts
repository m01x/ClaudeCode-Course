export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: GameColor;
  best: number;
  plays: string;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export interface SessionUser {
  name: string;
}

export interface SavedScoreEntry {
  game: string;
  score: number;
  name: string;
  at: number;
}
