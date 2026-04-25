import { ACCENTS } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import StatusBar from '../components/StatusBar.jsx';
import Avatar from '../components/Avatar.jsx';

export default function ChampionScreen({ ranking, accent, goBack }) {
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const champ = ranking[0];
  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 8 + Math.random() * 84,
    d: 1.8 + Math.random() * 2.8,
    delay: Math.random() * 2.5,
    s: 7 + Math.random() * 9,
  }));
  const podium = [ranking[1], ranking[0], ranking[2]].filter(Boolean);
  const podH = [62, 86, 50];
  const podLabel = ['2º', '1º', '3º'];
  const podCol = ['#A8A8C0', aHex, '#CD7F32'];
  const podRgb = ['168,168,192', aRgb, '205,127,50'];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E', overflow: 'hidden' }}>
      <StatusBar />
      {stars.map(s => (
        <div key={s.id} className="star" style={{ left: `${s.x}%`, bottom: `${5 + Math.random() * 15}%`, animationDuration: `${s.d}s`, animationDelay: `${s.delay}s` }}>
          <Ic.Star s={s.s} c={aHex} />
        </div>
      ))}
      <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, background: `radial-gradient(circle,rgba(${aRgb},.18) 0%,transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
        <div className="fu1" style={{ animation: `crownPulse 2s ease-in-out infinite`, marginBottom: 14, '--a-hex': aHex }}>
          <Ic.Crown s={70} c={aHex} />
        </div>
        <div className="fu2" style={{ fontSize: 11, color: aHex, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 14 }}>Rei da Quadra</div>
        <div className="fu3"><Avatar p={champ} s={84} accentHex={aHex} rank={1} /></div>
        <div className="fu4" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#F0EFFF', letterSpacing: -0.8 }}>{champ.name}</div>
          <div style={{ fontSize: 46, fontWeight: 900, color: aHex, letterSpacing: -2, marginTop: 4, textShadow: `0 0 32px rgba(${aRgb},.55)` }}>
            {champ.pts}<span style={{ fontSize: 18, fontWeight: 400, color: `rgba(${aRgb},.55)` }}> pts</span>
          </div>
        </div>
        <div className="fu4" style={{ display: 'flex', gap: 20, marginTop: 18 }}>
          {[{ l: 'Vitórias', v: champ.wins }, { l: 'Tie-breaks', v: champ.tbs }, { l: 'Partidas', v: champ.played }].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0EFFF' }}>{s.v}</div>
              <div style={{ fontSize: 10.5, color: '#4A4A6A' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Podium */}
        <div className="fu5" style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 26, justifyContent: 'center' }}>
          {podium.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {i !== 1 && <Avatar p={p} s={28} accentHex={aHex} />}
              <div style={{
                width: 58, height: podH[i], borderRadius: '7px 7px 0 0',
                background: `rgba(${podRgb[i]},.18)`,
                border: `1px solid rgba(${podRgb[i]},.28)`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6,
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: podCol[i] }}>{podLabel[i]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 22px 44px' }}>
        <button onClick={goBack} style={{
          width: '100%', padding: '14px', borderRadius: 15,
          background: `rgba(${aRgb},.1)`, border: `1px solid rgba(${aRgb},.25)`,
          color: aHex, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Ver ranking completo
        </button>
      </div>
    </div>
  );
}
