import { PLAYERS } from '../data.js';
import Avatar from './Avatar.jsx';

export default function MatchCard({ match, accentHex, accentRgb, cardStyle, onRegister }) {
  const gp = ids => ids.map(id => PLAYERS.find(p => p.id === id));
  const pair1 = gp(match.p1), pair2 = gp(match.p2);
  const p1w = match.res === 'p1win' || match.res === 'p1tb';
  const p2w = match.res === 'p2win' || match.res === 'p2tb';
  const tb  = match.res?.includes('tb');
  const cbg = cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421';
  const cborder = cardStyle === 'glass' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.07)';

  return (
    <div style={{ background: cbg, border: `1px solid ${cborder}`, borderRadius: 16, padding: '13px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
            {pair1.map(pl => <Avatar key={pl.id} p={pl} s={30} accentHex={accentHex} />)}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: p1w ? 600 : 400, color: p1w ? '#F0EFFF' : '#4A4A6A', lineHeight: 1.3 }}>
            {pair1.map(pl => pl.name.split(' ')[0]).join(' & ')}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          {match.res ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EFFF', letterSpacing: 0.5 }}>{match.sc}</div>
              {tb && (
                <div style={{ fontSize: 9.5, color: accentHex, fontWeight: 700, marginTop: 2, background: `rgba(${accentRgb},.14)`, borderRadius: 4, padding: '1px 5px', display: 'inline-block' }}>TB</div>
              )}
            </>
          ) : (
            <button onClick={() => onRegister(match)} style={{
              background: `rgba(${accentRgb},.13)`, border: `1px solid rgba(${accentRgb},.28)`,
              borderRadius: 9, padding: '5px 8px', color: accentHex, fontSize: 10.5, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Registrar</button>
          )}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', marginBottom: 5 }}>
            {pair2.map(pl => <Avatar key={pl.id} p={pl} s={30} accentHex={accentHex} />)}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: p2w ? 600 : 400, color: p2w ? '#F0EFFF' : '#4A4A6A', lineHeight: 1.3 }}>
            {pair2.map(pl => pl.name.split(' ')[0]).join(' & ')}
          </div>
        </div>
      </div>
    </div>
  );
}
