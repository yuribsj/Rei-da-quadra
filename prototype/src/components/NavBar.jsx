export default function NavBar({ tab, onTab, accentHex, accentRgb }) {
  const items = [
    {
      id: 'home',
      label: 'Início',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H15v-6h-6v6H4a1 1 0 01-1-1V10.5z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        </svg>
      ),
    },
    {
      id: 'matches',
      label: 'Partidas',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
          <path d="M3 9h18M8 2v4M16 2v4M7 13h4M7 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center',
      padding: '8px 0 28px',
    }}>
      {items.map(item => {
        const active = tab === item.id;
        return (
          <button key={item.id} onClick={() => onTab(item.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: active ? accentHex : '#4A4A6A',
            transition: 'color .15s',
          }}>
            {item.icon(active)}
            <span style={{
              fontSize: 10.5, fontWeight: active ? 700 : 500,
              letterSpacing: 0.2,
            }}>
              {item.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute',
                bottom: 26,
                width: 4, height: 4, borderRadius: '50%',
                background: accentHex,
                boxShadow: `0 0 6px ${accentHex}`,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
