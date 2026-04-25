export const ACCENTS = {
  gold:  { hex: '#D4A843', rgb: '212,168,67',  name: 'Ouro'  },
  green: { hex: '#45C47A', rgb: '69,196,122',  name: 'Verde' },
  blue:  { hex: '#4E9CF5', rgb: '78,156,245',  name: 'Azul'  },
};

export const PLAYERS = [
  { id: 0,  name: 'Carlos Pagnano',  ini: 'CP' },
  { id: 1,  name: 'Yuri Martins',    ini: 'YM' },
  { id: 2,  name: 'Bruno Belliboni', ini: 'BB' },
  { id: 3,  name: 'Daniel Campelo',  ini: 'DC' },
  { id: 4,  name: 'Marcio Prado',    ini: 'MP' },
  { id: 5,  name: 'Orlando Soares',  ini: 'OS' },
  { id: 6,  name: 'Moises Cipriano', ini: 'MC' },
  { id: 7,  name: 'Pedro',           ini: 'PE' },
  { id: 8,  name: 'Chico',           ini: 'CH' },
  { id: 9,  name: 'Murilo Carani',   ini: 'MU' },
  { id: 10, name: 'Bruno J.',        ini: 'BJ' },
  { id: 11, name: 'A definir',       ini: '??' },
];

export const AVATAR_COLORS = [
  '#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444',
  '#EC4899','#8B5CF6','#06B6D4','#84CC16','#F97316',
  '#6366F1','#14B8A6',
];

export const ROUNDS_INIT = [
  { id: 1, matches: [
    { id: 'm1-1', p1: [0,1],  p2: [2,3],   res: 'p1win', sc: '6-3' },
    { id: 'm1-2', p1: [4,5],  p2: [6,7],   res: 'p1tb',  sc: '7-6' },
    { id: 'm1-3', p1: [8,9],  p2: [10,11], res: 'p1win', sc: '6-2' },
  ]},
  { id: 2, matches: [
    { id: 'm2-1', p1: [0,2],  p2: [4,6],   res: 'p1win', sc: '6-4' },
    { id: 'm2-2', p1: [1,3],  p2: [8,10],  res: 'p1tb',  sc: '7-6' },
    { id: 'm2-3', p1: [5,7],  p2: [9,11],  res: 'p2win', sc: '3-6' },
  ]},
  { id: 3, matches: [
    { id: 'm3-1', p1: [0,3],  p2: [5,9],   res: 'p2win', sc: '4-6' },
    { id: 'm3-2', p1: [1,2],  p2: [7,8],   res: 'p1win', sc: '6-1' },
    { id: 'm3-3', p1: [4,6],  p2: [10,11], res: 'p2win', sc: '5-7' },
  ]},
  { id: 4, matches: [
    { id: 'm4-1', p1: [0,4],  p2: [1,5],   res: 'p2win', sc: '3-6' },
    { id: 'm4-2', p1: [2,6],  p2: [3,7],   res: null,    sc: null  },
    { id: 'm4-3', p1: [8,11], p2: [9,10],  res: null,    sc: null  },
  ]},
  { id: 5, matches: [
    { id: 'm5-1', p1: [0,5],  p2: [2,8],   res: null,    sc: null  },
    { id: 'm5-2', p1: [1,6],  p2: [4,9],   res: null,    sc: null  },
    { id: 'm5-3', p1: [3,10], p2: [7,11],  res: null,    sc: null  },
  ]},
  { id: 6, matches: [
    { id: 'm6-1', p1: [0,6],  p2: [1,10],  res: null,    sc: null  },
    { id: 'm6-2', p1: [2,9],  p2: [5,11],  res: null,    sc: null  },
    { id: 'm6-3', p1: [3,8],  p2: [4,7],   res: null,    sc: null  },
  ]},
];

export function computeRanking(rounds) {
  const pts = {}, wins = {}, played = {}, tbs = {};
  PLAYERS.forEach(p => { pts[p.id] = 0; wins[p.id] = 0; played[p.id] = 0; tbs[p.id] = 0; });
  rounds.forEach(r => r.matches.forEach(m => {
    if (!m.res) return;
    [...m.p1, ...m.p2].forEach(id => played[id]++);
    if (m.res === 'p1win') { m.p1.forEach(id => { pts[id] += 3; wins[id]++; }); }
    else if (m.res === 'p2win') { m.p2.forEach(id => { pts[id] += 3; wins[id]++; }); }
    else if (m.res === 'p1tb') { m.p1.forEach(id => { pts[id] += 2; wins[id]++; tbs[id]++; }); m.p2.forEach(id => pts[id] += 1); }
    else if (m.res === 'p2tb') { m.p2.forEach(id => { pts[id] += 2; wins[id]++; tbs[id]++; }); m.p1.forEach(id => pts[id] += 1); }
  }));
  return [...PLAYERS]
    .map(p => ({ ...p, pts: pts[p.id], wins: wins[p.id], played: played[p.id], tbs: tbs[p.id] }))
    .sort((a, b) => b.pts - a.pts || b.wins - a.wins);
}
