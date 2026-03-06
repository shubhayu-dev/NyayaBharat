import React, { useState } from 'react'

export default function VoiceFiling({ apiBase }) {
  const [file, setFile] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [view, setView] = useState('complaint') // 'complaint' | 'native' | 'english'

  async function process() {
    if (!file) return
    setLoading(true)
    setRes(null)
    setView('complaint')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch(`${apiBase}/api/complaint/voice`, {
        method: 'POST',
        body: fd
      })
      const j = await r.json()
      if (j.job_name) {
        setRes({ status: 'processing', message: 'Transcription started...' })
        pollResult(j.job_name)
      } else {
        setRes({ error: j.detail || 'Unknown error' })
      }
    } catch (e) {
      setRes({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  function pollResult(jobName) {
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${apiBase}/api/complaint/result/${jobName}`)
        const j = await r.json()
        if (j.status === 'COMPLETED') {
          setRes(j)
          clearInterval(interval)
          setPolling(false)
        } else if (j.status === 'FAILED') {
          setRes({ error: 'Transcription failed.' })
          clearInterval(interval)
          setPolling(false)
        } else {
          setRes({ status: 'processing', message: `Status: ${j.status}...` })
        }
      } catch (e) {
        setRes({ error: e.message })
        clearInterval(interval)
        setPolling(false)
      }
    }, 3000)
  }

  const tabStyle = (active) => ({
    padding: '6px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    background: active ? '#1a1a2e' : '#e2e8f0',
    color: active ? '#fff' : '#333',
    fontSize: 13,
  })

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="service-card">
      <h3>🎤 Voice Complaint Filing</h3>
      <input
        type="file"
        accept="audio/mp3,audio/wav,audio/ogg,audio/*"
        onChange={e => setFile(e.target.files?.[0])}
      />
      <div style={{ marginTop: 8 }}>
        <button
          className="button"
          onClick={process}
          disabled={!file || loading || polling}
        >
          {loading ? 'Uploading...' : polling ? 'Processing...' : 'File Complaint'}
        </button>
      </div>

      {res && (
        <div style={{ marginTop: 12 }}>
          {res.error ? (
            <div style={{ color: 'red' }}>{res.error}</div>
          ) : res.status === 'processing' ? (
            <div style={{ color: '#888' }}>⏳ {res.message}</div>
          ) : (
            <>
              <div style={{ color: 'green', marginBottom: 12 }}>✅ Complaint Ready</div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <button style={tabStyle(view === 'complaint')} onClick={() => setView('complaint')}>
                  📄 Formal Complaint
                </button>
                <button style={tabStyle(view === 'native')} onClick={() => setView('native')}>
                  🌐 Original
                </button>
                <button style={tabStyle(view === 'english')} onClick={() => setView('english')}>
                  🇬🇧 English
                </button>
              </div>

              {/* Formal Complaint */}
              {view === 'complaint' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>AI-formatted legal complaint</span>
                    <button
                      onClick={() => copyToClipboard(res.formal_complaint)}
                      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div style={{ background: '#f0f4ff', padding: 12, whiteSpace: 'pre-wrap', borderRadius: 8, lineHeight: 1.8, fontSize: 14, border: '1px solid #d0d9ff' }}>
                    {res.formal_complaint}
                  </div>
                </div>
              )}

              {/* Native transcript */}
              {view === 'native' && (
                <div style={{ background: '#f4f5f7', padding: 12, whiteSpace: 'pre-wrap', borderRadius: 8, lineHeight: 1.7 }}>
                  {res.native_transcript || 'No native transcript available.'}
                </div>
              )}

              {/* English translation */}
              {view === 'english' && (
                <div style={{ background: '#f4f5f7', padding: 12, whiteSpace: 'pre-wrap', borderRadius: 8, lineHeight: 1.7 }}>
                  {res.english_transcript || 'No English translation available.'}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}