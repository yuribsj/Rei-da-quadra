export default function StatusBar() {
  return (
    <div style={{ height: 59, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 26px 8px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#F0EFFF', letterSpacing: -0.3 }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="#F0EFFF">
          <rect x="0" y="8" width="3" height="4" rx="1" opacity="0.35" />
          <rect x="4.5" y="5" width="3" height="7" rx="1" opacity="0.6" />
          <rect x="9" y="2" width="3" height="10" rx="1" opacity="0.8" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="#F0EFFF">
          <path d="M8 1.5C10.5 1.5 12.7 2.5 14.3 4.2L15.6 2.9C13.6 0.8 10.9-.2 8-.2S2.4.8.4 2.9L1.7 4.2C3.3 2.5 5.5 1.5 8 1.5z" opacity="0.45" />
          <path d="M8 4.8c1.6 0 3 .6 4.1 1.7L13.5 5C12 3.5 10.1 2.6 8 2.6S4 3.5 2.5 5L3.9 6.5C5 5.4 6.4 4.8 8 4.8z" opacity="0.75" />
          <circle cx="8" cy="9.5" r="1.5" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke="#F0EFFF" strokeOpacity="0.35" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="#F0EFFF" />
          <path d="M24 4v4a2 2 0 000-4z" fill="#F0EFFF" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
