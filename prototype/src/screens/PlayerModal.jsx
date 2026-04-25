import { ACCENTS, PLAYERS } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import Avatar from '../components/Avatar.jsx';

export default function PlayerModal({ player, ranking, rounds, onClose, accent }) {
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const rank = ranking.findIndex(p => p.id === player.id) + 1;
  const fp = ranking.find(p => p.id === player.id) || player;
  const matches = rounds.flatMap(r => r.matches.filter(m => (m.p1.includes(player.id) || m.p2.includes(player.id)) && m.res));

  const partnerIds = new Set();
  rounds.forEach(r => r.matches.forEach(m => {
    if (m.p1.includes(player.id)) m.p1.forEach(id => id !== player.id && partnerIds.add(id));
    if (m.p2.includes(player.id)) m.p2.forEach(id => id !== player.id && partnerIds.add(id));
  }));
  const partners = [...partnerIds].map(id => PLAYERS.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-enter" style={{ background: '#141421', borderRadius: '22px 22px 0 0', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '78%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '11px 0 0' }}>
          <div style={{ width: 34, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.14)' }} />
        </div>
        <div className="scroll" style={{ padding: '14px 18px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
            <Avatar p={fp} s={54} accentHex={aHex} rank={rank} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.4 }}>{fp.name}</div>
              <div style={{ fontSize: 12, color: '#4A4A6A', marginTop: 2 }}>#{rank} no ranking</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Ic.X s={14} c='#6A6A8A' />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 18 }}>
            {[{ l: 'Pontos', v: fp.pts, c: aHex }, { l: 'Vitórias', v: fp.wins, c: '#F0EFFF' }, { l: 'Partidas', v: fp.played, c: '#F0EFFF' }].map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '11px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 10.5, color: '#4A4A6A', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {partners.length > 0 && <>
            <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 9 }}>Parceiros</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {partners.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '5px 9px' }}>
                  <Avatar p={p} s={20} accentHex={aHex} />
                  <span style={{ fontSize: 11.5, color: '#CCCCE0' }}>{p.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </>}

          <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 9 }}>Últimas partidas</div>
          {matches.length === 0 && <div style={{ fontSize: 12.5, color: '#2E2E4A' }}>Nenhuma partida registrada ainda</div>}
          {matches.slice(-4).reverse().map(m => {
            const inP1 = m.p1.includes(player.id);
            const won = (inP1 && (m.res === 'p1win' || m.res === 'p1tb')) || (!inP1 && (m.res === 'p2win' || m.res === 'p2tb'));
            const tb = m.res?.includes('tb');
            const opp = (inP1 ? m.p2 : m.p1).map(id => PLAYERS.find(p => p.id === id)?.name.split(' ')[0]).join(' & ');
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: won ? `rgba(${aRgb},.13)` : 'rgba(255,100,100,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: won ? aHex : '#FF6B6B' }}>
                  {won ? 'W' : 'L'}
                </div>
                <div style={{ flex: 1, fontSize: 12.5, color: '#6A6A8A' }}>vs {opp}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#F0EFFF' }}>{m.sc}</span>
                  {tb && <span style={{ fontSize: 9.5, color: aHex, background: `rgba(${aRgb},.12)`, borderRadius: 4, padding: '1px 5px' }}>TB</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
