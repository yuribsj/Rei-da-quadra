/**
 * Round-robin schedule generator for padel americano (rotating pairs, 2v2).
 *
 * Uses the Berger/circle method to generate all C(N,2) partnership pairs
 * across rounds, then groups pairs into matches of 4 players.
 *
 * Works for any N >= 4:
 *   - N divisible by 4: every partnership plays exactly once, no byes.
 *   - N even but not divisible by 4: one pair per Berger round has no
 *     opponent; these are collected and scheduled in extra rounds.
 *   - N odd: a BYE slot is added; one player sits out each Berger round.
 *     Leftover pairs are again scheduled in extra rounds.
 */

export interface ScheduleMatch {
  pair1: [string, string];
  pair2: [string, string];
}

export interface ScheduleRound {
  roundNumber: number;
  matches:     ScheduleMatch[];
}

const BYE = '__BYE__';

export function generateSchedule(playerIds: string[]): ScheduleRound[] {
  const n = playerIds.length;

  if (n < 4) throw new Error('Mínimo de 4 jogadores para gerar o cronograma.');

  // If odd, add a BYE placeholder so the Berger method works (needs even count)
  const players = n % 2 !== 0 ? [...playerIds, BYE] : [...playerIds];
  const total = players.length; // always even

  const circle = Array.from({ length: total }, (_, i) => i);
  const numBergerRounds = total - 1;
  const rounds: ScheduleRound[] = [];
  const leftoverPairs: [string, string][] = [];

  // ── Berger rounds ──────────────────────────────────────────────────────────
  for (let r = 0; r < numBergerRounds; r++) {
    // Generate pairs: position k pairs with position (total-1-k)
    const activePairs: [string, string][] = [];
    for (let k = 0; k < total / 2; k++) {
      const a = players[circle[k]];
      const b = players[circle[total - 1 - k]];
      if (a !== BYE && b !== BYE) {
        activePairs.push([a, b]);
      }
    }

    // Group consecutive pairs into matches
    const matches: ScheduleMatch[] = [];
    let i = 0;
    for (; i + 1 < activePairs.length; i += 2) {
      matches.push({ pair1: activePairs[i], pair2: activePairs[i + 1] });
    }

    // Odd pair out — save for extra rounds
    if (i < activePairs.length) {
      leftoverPairs.push(activePairs[i]);
    }

    if (matches.length > 0) {
      rounds.push({ roundNumber: rounds.length + 1, matches });
    }

    // Rotate: fix circle[0], shift circle[1..total-1] right by one
    const last = circle[total - 1];
    for (let j = total - 1; j > 1; j--) circle[j] = circle[j - 1];
    circle[1] = last;
  }

  // ── Extra rounds for leftover pairs ────────────────────────────────────────
  let leftovers = leftoverPairs;

  while (leftovers.length >= 2) {
    const used = new Set<number>();
    const roundPlayers = new Set<string>();
    const matches: ScheduleMatch[] = [];

    for (let i = 0; i < leftovers.length; i++) {
      if (used.has(i)) continue;
      const p1 = leftovers[i];
      if (roundPlayers.has(p1[0]) || roundPlayers.has(p1[1])) continue;

      for (let j = i + 1; j < leftovers.length; j++) {
        if (used.has(j)) continue;
        const p2 = leftovers[j];
        if (roundPlayers.has(p2[0]) || roundPlayers.has(p2[1])) continue;

        // Ensure 4 distinct players
        const all = new Set([p1[0], p1[1], p2[0], p2[1]]);
        if (all.size === 4) {
          matches.push({ pair1: p1, pair2: p2 });
          used.add(i);
          used.add(j);
          all.forEach(p => roundPlayers.add(p));
          break;
        }
      }
    }

    if (matches.length === 0) break; // remaining pairs share players — can't match
    rounds.push({ roundNumber: rounds.length + 1, matches });
    leftovers = leftovers.filter((_, idx) => !used.has(idx));
  }

  return rounds;
}

/**
 * Round-robin schedule for singles (1v1).
 *
 * Uses the standard Berger/circle method. Each round has floor(N/2) matches.
 * Odd player counts get a BYE (one player sits out each round).
 *
 * Returns the same ScheduleMatch shape — pair1 and pair2 each contain
 * the same player ID twice (pair of one).
 */
export function generateSinglesSchedule(playerIds: string[]): ScheduleRound[] {
  const n = playerIds.length;

  if (n < 2) throw new Error('Mínimo de 2 jogadores para gerar o cronograma.');

  const players = n % 2 !== 0 ? [...playerIds, BYE] : [...playerIds];
  const total = players.length;

  const circle = Array.from({ length: total }, (_, i) => i);
  const numRounds = total - 1;
  const rounds: ScheduleRound[] = [];

  for (let r = 0; r < numRounds; r++) {
    const matches: ScheduleMatch[] = [];
    for (let k = 0; k < total / 2; k++) {
      const a = players[circle[k]];
      const b = players[circle[total - 1 - k]];
      if (a !== BYE && b !== BYE) {
        matches.push({ pair1: [a, a], pair2: [b, b] });
      }
    }

    if (matches.length > 0) {
      rounds.push({ roundNumber: rounds.length + 1, matches });
    }

    // Rotate
    const last = circle[total - 1];
    for (let j = total - 1; j > 1; j--) circle[j] = circle[j - 1];
    circle[1] = last;
  }

  return rounds;
}
