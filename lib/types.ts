// ─── Enums ────────────────────────────────────────────────────────────────────

export type ChampionshipStatus = 'waiting' | 'active' | 'finished';
export type MembershipStatus   = 'invited' | 'accepted' | 'declined';
export type MatchOutcome       = 'p1win' | 'p1tb' | 'p2tb' | 'p2win';

// ─── DB Entities ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id:         string;
  name:       string;
  nickname:   string | null;
  phone:      string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Championship {
  id:                   string;
  name:                 string;
  sport:                string;
  max_players:          number;
  status:               ChampionshipStatus;
  admin_id:             string;
  invite_code:          string;
  allow_member_invite:  boolean;
  created_at:           string;
}

export interface Membership {
  id:                string;
  championship_id:   string;
  user_id:           string;
  status:            MembershipStatus;
  invited_by:        string | null;
  joined_at:         string | null;
  created_at:        string;
  users?:            UserProfile;
}

export interface Round {
  id:               string;
  championship_id:  string;
  round_number:     number;
  created_at:       string;
  matches?:         Match[];
}

export interface Match {
  id:                string;
  round_id:          string;
  championship_id:   string;
  pair1_player1_id:  string;
  pair1_player2_id:  string;
  pair2_player1_id:  string;
  pair2_player2_id:  string;
  created_at:        string;
  results?:          Result[] | Result | null;
}

export interface Result {
  id:              string;
  match_id:        string;
  championship_id: string;
  outcome:         MatchOutcome;
  score:           string | null;
  sets:            [number, number][] | null;
  registered_by:   string;
  created_at:      string;
}

// ─── Derived / UI Types ───────────────────────────────────────────────────────

export interface RankingEntry {
  userId:     string;
  name:       string;
  nickname:   string | null;
  avatarUrl:  string | null;
  points:     number;
  wins:       number;
  tbWins:     number;
  tbLosses:   number;
  losses:     number;
  played:     number;
}

export interface ChampionshipWithMemberCount extends Championship {
  memberCount: number;
  myPoints?:   number;
}
