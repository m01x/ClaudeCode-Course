import type { SavedScoreEntry, SessionUser } from "./types";

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export function getUser(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setUser(user: SessionUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function getScores(): SavedScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addScore(entry: Omit<SavedScoreEntry, "at">): void {
  try {
    const all = getScores();
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
