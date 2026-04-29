import i18n from './i18n';
import { Match, MatchOutcome, RankingEntry, Result, UserProfile } from './types';

/**
 * Points per outcome from each player's perspective.
 *
 * p1win → pair1 wins outright:  pair1 = 3 pts, pair2 = 0 pts
 * p1tb  → pair1 wins tiebreak:  pair1 = 2 pts, pair2 = 1 pt
 * p2tb  → pair2 wins tiebreak:  pair2 = 2 pts, pair1 = 1 pt
 * p2win → pair2 wins outright:  pair2 = 3 pts, pair1 = 0 pts
 */
const POINTS: Record<MatchOutcome, { pair1: number; pair2: number }> = {
  p1win: { pair1: 3, pair2: 0 },
  p1tb:  { pair1: 2, pair2: 1 },
  p2tb:  { pair1: 1, pair2: 2 },
  p2win: { pair1: 0, pair2: 3 },
};

type MatchWithResult = Match & { results?: Result[] | Result | null };

export function computeRanking(
  matches:  MatchWithResult[],
  members:  UserProfile[],
): RankingEntry[] {
  const map = new Map<string, RankingEntry>();

  // Seed every member so players with 0 pts still appear
  for (const m of members) {
    map.set(m.id, {
      userId:    m.id,
      name:      m.name,
      nickname:  m.nickname,
      avatarUrl: m.avatar_url,
      points:    0,
      wins:      0,
      tbWins:    0,
      tbLosses:  0,
      losses:    0,
      played:    0,
    });
  }

  const credit = (userId: string, pts: number, outcome: MatchOutcome, isPair1: boolean) => {
    const e = map.get(userId);
    if (!e) return;
    e.points += pts;
    e.played += 1;
    if (pts === 3) e.wins    += 1;
    if (pts === 2) e.tbWins  += 1;
    if (pts === 1) e.tbLosses += 1;
    if (pts === 0) e.losses  += 1;
  };

  for (const match of matches) {
    const result = Array.isArray(match.results) ? match.results[0] : match.results;
    if (!result) continue;
    if (result.status !== 'confirmed') continue;

    const { outcome } = result;
    const pts = POINTS[outcome];

    const isSingles = match.pair1_player1_id === match.pair1_player2_id;

    credit(match.pair1_player1_id, pts.pair1, outcome, true);
    if (!isSingles) credit(match.pair1_player2_id, pts.pair1, outcome, true);

    credit(match.pair2_player1_id, pts.pair2, outcome, false);
    if (!isSingles) credit(match.pair2_player2_id, pts.pair2, outcome, false);
  }

  return [...map.values()].sort((a, b) => {
    if (b.points  !== a.points)  return b.points  - a.points;
    if (b.wins    !== a.wins)    return b.wins    - a.wins;
    if (b.tbWins  !== a.tbWins)  return b.tbWins  - a.tbWins;
    return a.userId.localeCompare(b.userId); // stable fallback
  });
}

export function outcomeLabel(outcome: MatchOutcome): string {
  return i18n.t(`rankings.${outcome}`);
}
