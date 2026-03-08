import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Landing from './components/Landing'
import RightsBot from './components/RightsBot'
import LegalLens from './components/LegalLens'
import OfficerMode from './components/OfficerMode'
import VoiceFiling from './components/VoiceFiling'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://nyayabharat.saturnapi.in'
const TTL_MS = 2 * 24 * 60 * 60 * 1000

const NAVBAR_H = 53

function lsSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now() })) } catch {}
}
function lsLoad(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > TTL_MS) { localStorage.removeItem(key); return null }
    return value
  } catch { return null }
}

function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: NAVBAR_H,
      background: '#1a1a2e',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
      boxSizing: 'border-box',
    }}>
      <NavLink to="/" style={{ fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
        NyayaBharat
      </NavLink>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { to: '/rights',   label: 'Rights Bot' },
          { to: '/document', label: 'Legal Lens' },
          { to: '/officer',  label: 'Officer Mode' },
          { to: '/voice',    label: 'Voice Filing' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              padding: '6px 14px',
              borderRadius: 6,
              border: isActive ? '1px solid #fff' : '1px solid transparent',
              color: isActive ? '#fff' : '#ccc',
              textDecoration: 'none',
              fontSize: 14,
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const [rightsHistory, setRightsHistoryState] = useState(() => lsLoad('rightsHistory') || [])
  const [legalLensResult, setLegalLensResultState] = useState(() => lsLoad('legalLensResult'))
  const [officerResult, setOfficerResultState] = useState(() => lsLoad('officerResult'))
  const [voiceResult, setVoiceResultState] = useState(() => lsLoad('voiceResult'))

  function setRightsHistory(val) {
    const next = typeof val === 'function' ? val(rightsHistory) : val
    setRightsHistoryState(next); lsSave('rightsHistory', next)
  }
  function setLegalLensResult(val) { setLegalLensResultState(val); lsSave('legalLensResult', val) }
  function setOfficerResult(val) { setOfficerResultState(val); lsSave('officerResult', val) }
  function setVoiceResult(val) { setVoiceResultState(val); lsSave('voiceResult', val) }

  function navigate(v) {
    window.location.href = `/${v === 'landing' ? '' : v}`
  }

  return (
    <BrowserRouter>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #120820; }
        #root { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .content { flex: 1; overflow: auto; position: relative; }
      `}</style>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/"         element={<Landing onNavigate={navigate} />} />
          <Route path="/rights"   element={<RightsBot  apiBase={API_BASE} history={rightsHistory}   setHistory={setRightsHistory} />} />
          <Route path="/document" element={<LegalLens  apiBase={API_BASE} result={legalLensResult}  setResult={setLegalLensResult} />} />
          <Route path="/officer"  element={<OfficerMode apiBase={API_BASE} result={officerResult}   setResult={setOfficerResult} />} />
          <Route path="/voice"    element={<VoiceFiling apiBase={API_BASE} result={voiceResult}     setResult={setVoiceResult} />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}