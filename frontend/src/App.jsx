import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Landing from './components/Landing'
import RightsBot from './components/RightsBot'
import LegalLens from './components/LegalLens'
import OfficerMode from './components/OfficerMode'
import VoiceFiling from './components/VoiceFiling'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://nyayabharat.saturnapi.in'

function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: '#1a1a2e',
      position: 'sticky',
      top: 0,
      zIndex: 100,
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
  function navigate(v) {
    window.location.href = `/${v === 'landing' ? '' : v}`
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/"         element={<Landing onNavigate={navigate} />} />
          <Route path="/rights"   element={<RightsBot  apiBase={API_BASE} />} />
          <Route path="/document" element={<LegalLens  apiBase={API_BASE} />} />
          <Route path="/officer"  element={<OfficerMode apiBase={API_BASE} />} />
          <Route path="/voice"    element={<VoiceFiling apiBase={API_BASE} />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
