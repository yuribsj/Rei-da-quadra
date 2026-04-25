import { AVATAR_COLORS } from '../data.js';
import { Ic } from './Icons.jsx';

export default function Avatar({ p, s = 40, accentHex, rank = null }) {
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      background: AVATAR_COLORS[p.id % AVATAR_COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: s * 0.32, fontWeight: 700, color: '#fff',
      position: 'relative', flexShrink: 0,
      border: rank === 1 ? `2px solid ${accentHex}` : 'none',
    }}>
      {p.ini}
      {rank === 1 && (
        <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)' }}>
          <Ic.Crown s={11} c={accentHex} />
        </div>
      )}
    </div>
  );
}
