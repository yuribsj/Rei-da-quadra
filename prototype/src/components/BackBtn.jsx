import { Ic } from './Icons.jsx';

export default function BackBtn({ onPress }) {
  return (
    <button onClick={onPress} style={{
      width: 36, height: 36, borderRadius: 12,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    }}>
      <Ic.Back s={18} c='#F0EFFF' />
    </button>
  );
}
