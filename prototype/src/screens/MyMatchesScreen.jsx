import { ACCENTS, PLAYERS, computeRanking } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import StatusBar from '../components/StatusBar.jsx';
import Avatar from '../components/Avatar.jsx';

// Yuri Martins is player id 1
const ME = PLAYERS.find(p => p.id === 1);

export default function MyMatchesScreen({ rounds, accent, cardStyle, onPlayer }) {
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const ranking = computeRanking(rounds);

  const myRounds = rounds.map(r => ({
    ...r,
    matches: r.matches.filter(m => m.p1.includes(ME.id) || m.p2.includes(ME.id)),
  })).filter(r => r.matches.length > 0);

  const allMyMatches = rounds.flatMap(r =>
    r.matches.filter(m => m.p1.includes(ME.id) || m.p2.includes(ME.id))
  );
  const played = allMyMatches.filter(m => m.res).length;
  const pending = allMyMatches.filter(m => !m.res).length;
  const wins = allMyMatches.filter(m => {
    const inP1 = m.p1.includes(ME.id);
    return m.res && ((inP1 && (m.res === 'p1win' || m.res === 'p1tb')) || (!inP1 && (m.res === 'p2win' || m.res === 'p2tb')));
  }).length;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E' }}>
      <StatusBar />
      <div style={{ padding: '2px 22px 18px', flexShrink: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5, marginBottom: 2 }}>Minhas Partidas</div>
        <div style={{ fontSize: 12.5, color: '#4A4A6A' }}>Liga dos Amigos · Padel</div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 7, padding: '0 14px', marginBottom: 14, flexShrink: 0 }}>
        {[
          { l: 'Jogadas', v: played },
          { l: 'Vitórias', v: wins },
          { l: 'Pendentes', v: pending },
        ].map(s => (
          <div key={s.l} style={{ flex: 1, background: '#141421', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.l === 'Vitórias' ? aHex : '#F0EFFF' }}>{s.v}</div>
            <div style={{ fontSize: 9.5, color: '#4A4A6A', marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="scroll" style={{ padding: '0 14px 100px' }}>
        {myRounds.map(round => (
          <div key={round.id} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F0EFFF', marginBottom: 9 }}>Rodada {round.id}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {round.matches.map(m => {
                const inP1 = m.p1.includes(ME.id);
                const partnerId = (inP1 ? m.p1 : m.p2).find(id => id !== ME.id);
                const partner = PLAYERS.find(p => p.id === partnerId);
                const oppIds = inP1 ? m.p2 : m.p1;
                const opps = oppIds.map(id => PLAYERS.find(p => p.id === id));
                const won = m.res && ((inP1 && (m.res === 'p1win' || m.res === 'p1tb')) || (!inP1 && (m.res === 'p2win' || m.res === 'p2tb')));
                const tb = m.res?.includes('tb');
                const cbg = cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421';

                return (
                  <div key={m.id} style={{ background: cbg, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: '14px' }}>
                    {/* My side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: -6 }}>
                        <Avatar p={ME} s={32} accentHex={aHex} />
                        {partner && <Avatar p={partner} s={32} accentHex={aHex} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F0EFFF' }}>
                          Eu{partner ? ` & ${partner.name.split(' ')[0]}` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 1 }}>Minha dupla</div>
                      </div>
                      {m.res ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 8,
                            background: won ? `rgba(${aRgb},.14)` : 'rgba(255,80,80,.1)',
                            color: won ? aHex : '#FF6B6B',
                          }}>
                            {won ? (tb ? 'Vitória TB' : 'Vitória') : (tb ? 'Derrota TB' : 'Derrota')}
                          </div>
                          {m.sc && <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 3, textAlign: 'right' }}>{m.sc}</div>}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#F5A623', background: 'rgba(245,166,35,.1)', borderRadius: 7, padding: '3px 9px' }}>
                          Pendente
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      <div style={{ fontSize: 10, color: '#2E2E4A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Adversários</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {opps.map(pl => (
                          <button key={pl.id} onClick={() => onPlayer(pl)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '5px 9px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Avatar p={pl} s={20} accentHex={aHex} />
                            <span style={{ fontSize: 11.5, color: '#CCCCE0' }}>{pl.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
