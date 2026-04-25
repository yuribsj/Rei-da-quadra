import { useState } from 'react';
import { ACCENTS, PLAYERS } from '../data.js';
import StatusBar from '../components/StatusBar.jsx';
import BackBtn from '../components/BackBtn.jsx';

const inp = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
  padding: '12px 14px', color: '#F0EFFF', fontSize: 14.5,
  fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
};

export default function CreateScreen({ go, goBack, accent }) {
  const [step, setStep]   = useState(1);
  const [name, setName]   = useState('Liga dos Amigos');
  const [pNames, setPNames] = useState(PLAYERS.map(p => p.name));
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E' }}>
      <StatusBar />
      <div style={{ padding: '0 22px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <BackBtn onPress={step === 1 ? goBack : () => setStep(s => s - 1)} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, color: '#F0EFFF' }}>{['', 'Novo campeonato', 'Jogadores', 'Confirmar'][step]}</div>
          <div style={{ fontSize: 11.5, color: '#4A4A6A', marginTop: 1 }}>Passo {step} de 3</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: s <= step ? 22 : 7, height: 7, borderRadius: 4, background: s <= step ? aHex : 'rgba(255,255,255,0.1)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      <div className="scroll" style={{ padding: '6px 22px 100px' }}>
        {step === 1 && <>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5, marginBottom: 7 }}>Qual o nome do campeonato?</div>
          <div style={{ fontSize: 13, color: '#4A4A6A', marginBottom: 24 }}>Escolha um nome para o seu grupo</div>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Liga dos Amigos" />
          <div style={{ marginTop: 10, fontSize: 11.5, color: '#2E2E4A' }}>Padel · Duplas rotativas · Round-robin</div>
        </>}

        {step === 2 && <>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5, marginBottom: 7 }}>Quem vai jogar?</div>
          <div style={{ fontSize: 13, color: '#4A4A6A', marginBottom: 18 }}>{pNames.length} jogadores</div>
          {pNames.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 11, background: `rgba(${aRgb},.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, color: aHex, flexShrink: 0 }}>{i + 1}</div>
              <input style={{ ...inp, flex: 1 }} value={n} onChange={e => { const a = [...pNames]; a[i] = e.target.value; setPNames(a); }} placeholder={`Jogador ${i + 1}`} />
            </div>
          ))}
        </>}

        {step === 3 && <>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.5, marginBottom: 7 }}>Tudo certo?</div>
          <div style={{ fontSize: 13, color: '#4A4A6A', marginBottom: 22 }}>Revise antes de criar</div>
          <div style={{ background: '#141421', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, marginBottom: 11 }}>
            <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Campeonato</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#F0EFFF' }}>{name}</div>
            <div style={{ fontSize: 12, color: '#4A4A6A', marginTop: 3 }}>Padel · Duplas rotativas</div>
          </div>
          <div style={{ background: '#141421', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, marginBottom: 11 }}>
            <div style={{ fontSize: 10, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{pNames.length} Jogadores</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pNames.map((n, i) => <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '4px 9px', fontSize: 11.5, color: '#CCCCE0' }}>{n}</div>)}
            </div>
          </div>
          <div style={{ background: `rgba(${aRgb},.08)`, border: `1px solid rgba(${aRgb},.18)`, borderRadius: 13, padding: 14 }}>
            <div style={{ fontSize: 11.5, color: aHex, fontWeight: 700, marginBottom: 6 }}>Pontuação</div>
            <div style={{ fontSize: 12, color: '#6A6A8A', lineHeight: 1.9 }}>
              Vitória → 3 pts<br />Vitória no tie-break → 2 pts / 1 pt<br />Derrota → 0 pts
            </div>
          </div>
        </>}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 22px 38px', background: 'linear-gradient(transparent,#09090E 40%)' }}>
        <button
          onClick={step < 3 ? () => setStep(s => s + 1) : () => go('champ')}
          style={{
            width: '100%', padding: '14px', borderRadius: 15,
            background: `linear-gradient(135deg,${aHex},rgba(${aRgb},.65))`,
            border: 'none', color: '#000', fontSize: 14.5, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 8px 24px rgba(${aRgb},.3)`,
          }}
        >
          {step < 3 ? 'Continuar' : 'Criar campeonato'}
        </button>
      </div>
    </div>
  );
}
