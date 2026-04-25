import { ACCENTS, PLAYERS, computeRanking } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import StatusBar from '../components/StatusBar.jsx';
import Avatar from '../components/Avatar.jsx';

// Yuri Martins is player id 1
const ME = PLAYERS.find(p => p.id === 1);

export default function ProfileScreen({ rounds, accent, cardStyle }) {
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const ranking = computeRanking(rounds);
  const rank = ranking.findIndex(p => p.id === ME.id) + 1;
  const me = ranking.find(p => p.id === ME.id) || ME;

  const myMatches = rounds.flatMap(r =>
    r.matches.filter(m => (m.p1.includes(ME.id) || m.p2.includes(ME.id)) && m.res)
  );
  const losses = me.played - me.wins;
  const winRate = me.played > 0 ? Math.round((me.wins / me.played) * 100) : 0;

  const partnerIds = new Set();
  rounds.forEach(r => r.matches.forEach(m => {
    if (m.p1.includes(ME.id)) m.p1.forEach(id => id !== ME.id && partnerIds.add(id));
    if (m.p2.includes(ME.id)) m.p2.forEach(id => id !== ME.id && partnerIds.add(id));
  }));
  const partners = [...partnerIds].map(id => PLAYERS.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E' }}>
      <StatusBar />

      <div className="scroll" style={{ padding: '0 0 100px' }}>
        {/* Header */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          padding: '16px 22px 28px',
          background: `linear-gradient(160deg, rgba(${aRgb},.12) 0%, transparent 60%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle,rgba(${aRgb},.14) 0%,transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar p={ME} s={70} accentHex={aHex} rank={rank} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5 }}>{ME.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <div style={{ background: `rgba(${aRgb},.14)`, borderRadius: 7, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ic.Crown s={11} c={aHex} />
                  <span style={{ fontSize: 11.5, color: aHex, fontWeight: 700 }}>#{rank} no ranking</span>
                </div>
                <span style={{ fontSize: 11.5, color: '#4A4A6A' }}>· Padel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: '0 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Estatísticas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Pontuação', v: me.pts, unit: 'pts', accent: true },
              { l: 'Taxa de vitória', v: `${winRate}%`, unit: '', accent: false },
              { l: 'Vitórias', v: me.wins, unit: '', accent: false },
              { l: 'Derrotas', v: losses, unit: '', accent: false },
              { l: 'Tie-breaks', v: me.tbs, unit: '', accent: false },
              { l: 'Partidas', v: me.played, unit: '', accent: false },
            ].map(s => (
              <div key={s.l} style={{ background: cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421', border: `1px solid rgba(255,255,255,${s.accent ? '.1' : '.06'})`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.accent ? aHex : '#F0EFFF', letterSpacing: -0.5 }}>
                  {s.v}<span style={{ fontSize: 12, fontWeight: 400, color: s.accent ? `rgba(${aRgb},.6)` : '#4A4A6A', marginLeft: 2 }}>{s.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Win rate bar */}
        <div style={{ padding: '0 14px', marginBottom: 20 }}>
          <div style={{ background: cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#F0EFFF' }}>Aproveitamento</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: aHex }}>{winRate}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${aHex},rgba(${aRgb},.4))`, width: `${winRate}%`, transition: 'width .6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10.5, color: '#4A4A6A' }}>{me.wins} vitórias</span>
              <span style={{ fontSize: 10.5, color: '#4A4A6A' }}>{losses} derrotas</span>
            </div>
          </div>
        </div>

        {/* Partners */}
        {partners.length > 0 && (
          <div style={{ padding: '0 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Parceiros</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {partners.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, padding: '7px 11px' }}>
                  <Avatar p={p} s={24} accentHex={aHex} />
                  <span style={{ fontSize: 12, color: '#CCCCE0', fontWeight: 500 }}>{p.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent matches */}
        <div style={{ padding: '0 14px' }}>
          <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Últimas partidas</div>
          {myMatches.length === 0 && <div style={{ fontSize: 12.5, color: '#2E2E4A' }}>Nenhuma partida registrada ainda</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {myMatches.slice(-5).reverse().map(m => {
              const inP1 = m.p1.includes(ME.id);
              const won = (inP1 && (m.res === 'p1win' || m.res === 'p1tb')) || (!inP1 && (m.res === 'p2win' || m.res === 'p2tb'));
              const tb = m.res?.includes('tb');
              const opp = (inP1 ? m.p2 : m.p1).map(id => PLAYERS.find(p => p.id === id)?.name.split(' ')[0]).join(' & ');
              const partnerId = (inP1 ? m.p1 : m.p2).find(id => id !== ME.id);
              const partner = PLAYERS.find(p => p.id === partnerId);

              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 13, padding: '11px 13px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: won ? `rgba(${aRgb},.13)` : 'rgba(255,80,80,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: won ? aHex : '#FF6B6B' }}>
                    {won ? 'W' : 'L'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F0EFFF' }}>vs {opp}</div>
                    <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 1 }}>
                      c/ {partner?.name.split(' ')[0] || '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F0EFFF' }}>{m.sc}</div>
                    {tb && <div style={{ fontSize: 9.5, color: aHex, background: `rgba(${aRgb},.12)`, borderRadius: 4, padding: '1px 5px', marginTop: 2, display: 'inline-block' }}>TB</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
