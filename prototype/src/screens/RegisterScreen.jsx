import { useState } from 'react';
import { ACCENTS, PLAYERS } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import StatusBar from '../components/StatusBar.jsx';
import BackBtn from '../components/BackBtn.jsx';
import Avatar from '../components/Avatar.jsx';

export default function RegisterScreen({ match, goBack, onConfirm, accent }) {
  const [res, setRes] = useState(null);
  const [sc, setSc]   = useState('');
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const gp = ids => ids.map(id => PLAYERS.find(p => p.id === id));
  const pair1 = gp(match.p1), pair2 = gp(match.p2);

  const opts = [
    { id: 'p1win', label: `${pair1.map(p => p.name.split(' ')[0]).join(' & ')} venceu`, sub: 'Vitória direta',     pts: '3 pts' },
    { id: 'p1tb',  label: `${pair1.map(p => p.name.split(' ')[0]).join(' & ')} no tie-break`, sub: 'Venceu no tie-break', pts: '2 pts' },
    { id: 'p2tb',  label: `${pair2.map(p => p.name.split(' ')[0]).join(' & ')} no tie-break`, sub: 'Venceu no tie-break', pts: '2 pts' },
    { id: 'p2win', label: `${pair2.map(p => p.name.split(' ')[0]).join(' & ')} venceu`, sub: 'Vitória direta',     pts: '3 pts' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E' }}>
      <StatusBar />
      <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
        <BackBtn onPress={goBack} />
        <div style={{ fontSize: 16.5, fontWeight: 700, color: '#F0EFFF' }}>Registrar Resultado</div>
      </div>

      <div className="scroll" style={{ padding: '0 18px 100px' }}>
        <div style={{ background: '#141421', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, marginBottom: 18, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            {pair1.map(pl => (
              <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <Avatar p={pl} s={30} accentHex={aHex} />
                <span style={{ fontSize: 13, color: '#F0EFFF', fontWeight: 500 }}>{pl.name}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#4A4A6A', padding: '0 10px' }}>VS</div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {pair2.map(pl => (
              <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 13, color: '#F0EFFF', fontWeight: 500 }}>{pl.name}</span>
                <Avatar p={pl} s={30} accentHex={aHex} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#4A4A6A', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quem venceu?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          {opts.map(o => (
            <button key={o.id} onClick={() => setRes(o.id)} style={{
              width: '100%', padding: '13px 14px', borderRadius: 13, fontFamily: 'inherit', cursor: 'pointer',
              background: res === o.id ? `rgba(${aRgb},.11)` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${res === o.id ? `rgba(${aRgb},.35)` : 'rgba(255,255,255,0.07)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .15s',
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F0EFFF' }}>{o.label}</div>
                <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 2 }}>{o.sub}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: res === o.id ? aHex : '#4A4A6A' }}>{o.pts}</span>
                {res === o.id && (
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: aHex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ic.Check s={12} c='#000' />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#4A4A6A', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Placar (opcional)</div>
        <input
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 13px', color: '#F0EFFF', fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', outline: 'none' }}
          placeholder="Ex: 6-4 ou 7-6"
          value={sc}
          onChange={e => setSc(e.target.value)}
        />
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 18px 38px', background: 'linear-gradient(transparent,#09090E 40%)' }}>
        <button
          onClick={() => res && onConfirm(match.id, res, sc || '—')}
          disabled={!res}
          style={{
            width: '100%', padding: '14px', borderRadius: 15, border: 'none', fontFamily: 'inherit',
            background: res ? `linear-gradient(135deg,${aHex},rgba(${aRgb},.6))` : 'rgba(255,255,255,0.06)',
            color: res ? '#000' : '#2E2E4A', fontSize: 14.5, fontWeight: 800,
            cursor: res ? 'pointer' : 'default',
            boxShadow: res ? `0 8px 24px rgba(${aRgb},.28)` : 'none', transition: 'all .2s',
          }}
        >
          Confirmar resultado
        </button>
      </div>
    </div>
  );
}
