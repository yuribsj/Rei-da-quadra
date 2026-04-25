import { useState, useEffect } from 'react';
import { ACCENTS, ROUNDS_INIT, computeRanking } from './data.js';
import HomeScreen from './screens/HomeScreen.jsx';
import CreateScreen from './screens/CreateScreen.jsx';
import ChampionshipScreen from './screens/ChampionshipScreen.jsx';
import RegisterScreen from './screens/RegisterScreen.jsx';
import ChampionScreen from './screens/ChampionScreen.jsx';
import PlayerModal from './screens/PlayerModal.jsx';
import MyMatchesScreen from './screens/MyMatchesScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import NavBar from './components/NavBar.jsx';

const TWEAK_DEFAULTS = { accent: 'gold', cardStyle: 'solid' };
const TAB_SCREENS = ['home', 'matches', 'profile'];

function loadTweaks() {
  try { return JSON.parse(localStorage.getItem('rdq_tw') || 'null'); } catch { return null; }
}

export default function App() {
  const [tweaks, setTweaks]       = useState({ ...TWEAK_DEFAULTS, ...(loadTweaks() || {}) });
  const [showTw, setShowTw]       = useState(false);
  const [screen, setScreen]       = useState(() => localStorage.getItem('rdq_screen') || 'home');
  const [navDir, setNavDir]       = useState('push');
  const [rounds, setRounds]       = useState(ROUNDS_INIT);
  const [selMatch, setSelMatch]   = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);

  const ranking = computeRanking(rounds);
  const { accent, cardStyle } = tweaks;
  const { hex: aHex, rgb: aRgb } = ACCENTS[accent];
  const isTabScreen = TAB_SCREENS.includes(screen);

  useEffect(() => {
    const handler = e => {
      if (e.data?.type === '__activate_edit_mode')   setShowTw(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTw(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const go = s => { setNavDir('push'); setScreen(s); localStorage.setItem('rdq_screen', s); };
  const goBack = s => { setNavDir('pop'); setScreen(s || 'home'); localStorage.setItem('rdq_screen', s || 'home'); };

  const applyTweak = (k, v) => {
    const n = { ...tweaks, [k]: v };
    setTweaks(n);
    localStorage.setItem('rdq_tw', JSON.stringify(n));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const handleRegister = (id, res, sc) => {
    setRounds(prev => prev.map(r => ({ ...r, matches: r.matches.map(m => m.id === id ? { ...m, res, sc } : m) })));
    goBack('champ');
  };

  const handleTab = tab => {
    setNavDir('push');
    setScreen(tab);
    localStorage.setItem('rdq_screen', tab);
  };

  const navKey = `${screen}-${navDir}`;
  const anim = navDir === 'push' ? 'push-enter' : 'pop-enter';

  const renderScreen = () => {
    if (screen === 'home')    return <HomeScreen go={go} accent={accent} cardStyle={cardStyle} ranking={ranking} />;
    if (screen === 'matches') return <MyMatchesScreen rounds={rounds} accent={accent} cardStyle={cardStyle} onPlayer={p => setSelPlayer(p)} />;
    if (screen === 'profile') return <ProfileScreen rounds={rounds} accent={accent} cardStyle={cardStyle} />;
    if (screen === 'create')  return <CreateScreen go={go} goBack={() => goBack('home')} accent={accent} />;
    if (screen === 'champ')   return <ChampionshipScreen go={go} goBack={() => goBack('home')} accent={accent} cardStyle={cardStyle} rounds={rounds} ranking={ranking} onRegister={m => { setSelMatch(m); go('register'); }} onPlayer={p => setSelPlayer(p)} />;
    if (screen === 'register' && selMatch) return <RegisterScreen match={selMatch} goBack={() => goBack('champ')} onConfirm={handleRegister} accent={accent} cardStyle={cardStyle} />;
    if (screen === 'champion') return <ChampionScreen ranking={ranking} accent={accent} goBack={() => goBack('champ')} />;
    return null;
  };

  return (
    <>
      <div className="phone-wrap">
        <div className="btn-r" /><div className="btn-l1" /><div className="btn-l2" /><div className="btn-l3" />
        <div className="phone-frame">
          <div className="dyn-island" />
          <div className="screen-root">
            <div key={navKey} className={anim} style={{ position: 'absolute', inset: 0 }}>
              {renderScreen()}
            </div>
            {selPlayer && (
              <PlayerModal player={selPlayer} ranking={ranking} rounds={rounds} accent={accent} onClose={() => setSelPlayer(null)} />
            )}
            {isTabScreen && (
              <NavBar tab={screen} onTab={handleTab} accentHex={aHex} accentRgb={aRgb} />
            )}
          </div>
        </div>
      </div>

      {/* Tweaks panel */}
      {showTw && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20,
          background: 'rgba(16,16,26,0.97)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.13)', borderRadius: 18,
          padding: 18, minWidth: 210, zIndex: 9999,
          fontFamily: "'Space Grotesk', sans-serif", color: '#F0EFFF',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Tweaks</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 7 }}>Cor de destaque</div>
            <div style={{ display: 'flex', gap: 7 }}>
              {Object.entries(ACCENTS).map(([k, v]) => (
                <button key={k} onClick={() => applyTweak('accent', k)} title={v.name} style={{
                  width: 26, height: 26, borderRadius: '50%', background: v.hex,
                  border: `2.5px solid ${accent === k ? '#fff' : 'transparent'}`,
                  cursor: 'pointer', transition: 'border-color .15s',
                }} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 7 }}>Estilo de card</div>
            <div style={{ display: 'flex', gap: 7 }}>
              {['solid', 'glass'].map(s => (
                <button key={s} onClick={() => applyTweak('cardStyle', s)} style={{
                  padding: '5px 12px', borderRadius: 8,
                  border: `1px solid ${cardStyle === s ? aHex : 'rgba(255,255,255,0.12)'}`,
                  background: cardStyle === s ? `rgba(${aRgb},.1)` : 'transparent',
                  color: cardStyle === s ? aHex : '#C0C0D8',
                  fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
                }}>
                  {s === 'solid' ? 'Sólido' : 'Glass'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
