import React, { useState } from 'react'
import Landing from './components/Landing'
import RightsBot from './components/RightsBot'
import LegalLens from './components/LegalLens'
import OfficerMode from './components/OfficerMode'
import VoiceFiling from './components/VoiceFiling'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export default function App(){
  const [view, setView] = React.useState('landing')

  function navigate(v){
    setView(v)
    window.scrollTo({top:0, behavior:'smooth'})
  }

  return (
    <div className="app">
      <div className="content">
        {view === 'landing' && <Landing onNavigate={navigate} />}
        {view === 'rights' && <RightsBot apiBase={API_BASE} />}
        {view === 'document' && <LegalLens apiBase={API_BASE} />}
        {view === 'officer' && <OfficerMode apiBase={API_BASE} />}
        {view === 'voice' && <VoiceFiling apiBase={API_BASE} />}
      </div>
    </div>
  )
}
