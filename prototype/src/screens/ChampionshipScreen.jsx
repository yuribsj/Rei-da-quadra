import { useState } from 'react';
import { ACCENTS } from '../data.js';
import { Ic } from '../components/Icons.jsx';
import StatusBar from '../components/StatusBar.jsx';
import BackBtn from '../components/BackBtn.jsx';
import Avatar from '../components/Avatar.jsx';
import MatchCard from '../components/MatchCard.jsx';

export default function ChampionshipScreen({ go, goBack, accent, cardStyle, rounds, ranking, onRegister, onPlayer }) {
  const [tab, setTab] = useState('matches');
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const totalM = rounds.reduce((a, r) => a + r.matches.length, 0);
  const doneM  = rounds.reduce((a, r) => a + r.matches.filter(m => m.res).length, 0);
  const tabs = [
    { id: 'matches', label: 'Partidas', icon: <Ic.Cal s={14} c='currentColor' /> },
    { id: 'ranking', label: 'Ranking',  icon: <Ic.Trophy s={14} c='currentColor' /> },
    { id: 'players', label: 'Jogadores',icon: <Ic.User s={14} c='currentColor' /> },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090E' }}>
      <StatusBar />
      <div style={{ padding: '0 18px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
          <BackBtn onPress={goBack} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: '#F0EFFF', letterSpacing: -0.4 }}>Liga dos Amigos</div>
            <div style={{ fontSize: 11.5, color: '#4A4A6A' }}>Padel · 12 jogadores</div>
          </div>
          <button onClick={() => go('champion')} style={{
            background: `rgba(${aRgb},.12)`, border: `1px solid rgba(${aRgb},.25)`,
            borderRadius: 10, padding: '6px 10px', color: aHex, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Ic.Crown s={12} c={aHex} /> Campeão
          </button>
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
          {[{ l: 'Rodada', v: '4/6' }, { l: 'Partidas', v: `${doneM}/${totalM}` }, { l: 'Jogadores', v: '12' }].map(s => (
            <div key={s.l} style={{ flex: 1, background: '#141421', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F0EFFF' }}>{s.v}</div>
              <div style={{ fontSize: 9.5, color: '#4A4A6A', marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: 3, marginBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none',
              background: tab === t.id ? (cardStyle === 'glass' ? 'rgba(255,255,255,0.09)' : '#1E1D30') : 'transparent',
              color: tab === t.id ? '#F0EFFF' : '#4A4A6A', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontFamily: 'inherit', transition: 'all .15s',
              boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
            }}>{t.icon}{t.label}</button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ padding: '12px 14px 28px' }}>
        {tab === 'matches' && rounds.map(round => {
          const allD = round.matches.every(m => m.res);
          const anyD = round.matches.some(m => m.res);
          return (
            <div key={round.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: anyD ? '#F0EFFF' : '#4A4A6A' }}>Rodada {round.id}</span>
                {allD && <span style={{ fontSize: 9.5, fontWeight: 700, color: aHex, background: `rgba(${aRgb},.12)`, borderRadius: 5, padding: '2px 6px' }}>Concluída</span>}
                {!allD && anyD && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#F5A623', background: 'rgba(245,166,35,.12)', borderRadius: 5, padding: '2px 6px' }}>Em andamento</span>}
                {!anyD && <span style={{ fontSize: 9.5, color: '#2E2E4A', background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: '2px 6px' }}>Pendente</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {round.matches.map(m => <MatchCard key={m.id} match={m} accentHex={aHex} accentRgb={aRgb} cardStyle={cardStyle} onRegister={onRegister} />)}
              </div>
            </div>
          );
        })}

        {tab === 'ranking' && ranking.map((p, i) => {
          const mc = ['#D4A843', '#A8A8C0', '#CD7F32'];
          const top = i < 3;
          const medalRgb = i === 0 ? aRgb : i === 1 ? '168,168,192' : '205,127,50';
          return (
            <div key={p.id} onClick={() => onPlayer(p)} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              background: top && cardStyle === 'solid' ? '#141421' : (top ? 'rgba(255,255,255,0.03)' : 'transparent'),
              border: top ? `1px solid rgba(255,255,255,${i === 0 ? .12 : .06})` : 'none',
              borderRadius: 13, padding: '11px', marginBottom: 7, cursor: 'pointer',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 9, background: top ? `rgba(${medalRgb},.14)` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: top ? mc[i] : '#2E2E4A', flexShrink: 0 }}>
                {i + 1}
              </div>
              <Avatar p={p} s={38} accentHex={aHex} rank={i + 1} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F0EFFF' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 1 }}>{p.wins}V · {p.played - p.wins}D · {p.tbs} TB</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: i === 0 ? aHex : '#F0EFFF' }}>{p.pts}</div>
                <div style={{ fontSize: 9.5, color: '#4A4A6A' }}>pts</div>
              </div>
            </div>
          );
        })}

        {tab === 'players' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {ranking.map((p, i) => (
              <div key={p.id} onClick={() => onPlayer(p)} style={{
                background: cardStyle === 'glass' ? 'rgba(255,255,255,0.04)' : '#141421',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 15, padding: '14px 11px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer',
              }}>
                <Avatar p={p} s={42} accentHex={aHex} rank={i + 1} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F0EFFF', lineHeight: 1.2 }}>{p.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 1 }}>{p.name.split(' ').slice(1).join(' ')}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? aHex : '#F0EFFF' }}>{p.pts} <span style={{ fontSize: 9.5, color: '#4A4A6A', fontWeight: 400 }}>pts</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
