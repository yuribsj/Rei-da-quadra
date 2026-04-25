import { ACCENTS, ROUNDS_INIT } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import StatusBar from '../components/StatusBar.jsx';

export default function HomeScreen({ go, accent, cardStyle, ranking }) {
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const totalM = ROUNDS_INIT.reduce((a, r) => a + r.matches.length, 0);
  const doneM  = ROUNDS_INIT.reduce((a, r) => a + r.matches.filter(m => m.res).length, 0);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E' }}>
      <StatusBar />
      <div style={{ padding: '2px 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <Ic.Crown s={21} c={aHex} />
            <span style={{ fontSize: 19, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5, whiteSpace: 'nowrap' }}>Rei da Quadra</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#4A4A6A' }}>Seus campeonatos</div>
        </div>
        <button onClick={() => go('create')} style={{
          width: 40, height: 40, borderRadius: 13,
          background: `rgba(${aRgb},.14)`, border: `1px solid rgba(${aRgb},.28)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Ic.Plus s={19} c={aHex} />
        </button>
      </div>

      <div className="scroll" style={{ padding: '0 14px 100px' }}>
        {/* Championship card */}
        <div onClick={() => go('champ')} style={{
          background: cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : `linear-gradient(140deg, #1C1B2E 0%, #12121C 100%)`,
          border: `1px solid rgba(${aRgb},.22)`, borderRadius: 22, padding: 22, marginBottom: 14,
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, background: `radial-gradient(circle,rgba(${aRgb},.16) 0%,transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10.5, color: aHex, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4 }}>● Ativo</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.4 }}>Liga dos Amigos</div>
              <div style={{ fontSize: 12, color: '#4A4A6A', marginTop: 2 }}>12 jogadores · Padel</div>
            </div>
            <div style={{ background: `rgba(${aRgb},.12)`, border: `1px solid rgba(${aRgb},.2)`, borderRadius: 12, padding: '7px 12px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: aHex, fontWeight: 500 }}>Rodada</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5 }}>4<span style={{ fontSize: 13, color: '#4A4A6A', fontWeight: 400 }}>/6</span></div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11.5, color: '#4A4A6A' }}>{doneM} de {totalM} partidas</span>
              <span style={{ fontSize: 11.5, color: aHex, fontWeight: 700 }}>{Math.round(doneM / totalM * 100)}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${aHex},rgba(${aRgb},.4))`, width: `${doneM / totalM * 100}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '9px 11px' }}>
            <Ic.Trophy s={14} c={aHex} />
            <span style={{ fontSize: 12, color: '#6A6A8A' }}>Líder:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F0EFFF' }}>{ranking[0]?.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: aHex }}>{ranking[0]?.pts} pts</span>
          </div>
        </div>

        {/* New champ teaser */}
        <div onClick={() => go('create')} style={{ border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: 18, padding: '18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic.Plus s={17} c='#4A4A6A' />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6A6A8A' }}>Novo campeonato</div>
            <div style={{ fontSize: 11.5, color: '#2E2E4A', marginTop: 2 }}>Crie um novo torneio</div>
          </div>
        </div>
      </div>
    </div>
  );
}
