// Statistics management for game history

export type GameStats = {
  player1: string;
  player2: string;
  gameType: "game1" | "game2";
  timestamp: number;
  // For game1: final scores
  player1Score?: number;
  player2Score?: number;
  // For game2: winner
  winner?: string;
};

const STORAGE_KEY = "connect-x-game-stats";

export function saveGameStats(stats: GameStats): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      console.warn("localStorage is not available");
      return;
    }
    const existing = getGameStats();
    existing.push(stats);
    // Keep only last 50 games
    const recent = existing.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error("Failed to save game stats:", error);
  }
}

export function getGameStats(): GameStats[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load game stats:", error);
    return [];
  }
}

export function getGameStatsForPlayers(
  player1: string,
  player2: string,
  gameType: "game1" | "game2"
): GameStats[] {
  const allStats = getGameStats();
  return allStats.filter(
    (stat) =>
      stat.gameType === gameType &&
      ((stat.player1 === player1 && stat.player2 === player2) ||
        (stat.player1 === player2 && stat.player2 === player1))
  );
}

export function clearGameStats(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear game stats:", error);
  }
}

