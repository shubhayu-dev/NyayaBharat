import React, { useState } from 'react'

export default function VoiceFiling({ apiBase }) {
  const [file, setFile] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [jobName, setJobName] = useState(null)
  const [polling, setPolling] = useState(false)

  async function process() {
    if (!file) return
    setLoading(true)
    setRes(null)
    const fd = new FormData()
    fd.append('file', file)           // ← colleague uses 'file'
    try {
      const r = await fetch(`${apiBase}/api/complaint/voice`, {  // ← colleague's route
        method: 'POST',
        body: fd
      })
      const j = await r.json()
      setJobName(j.job_name)
      setRes({ status: 'processing', message: 'Transcription started...' })
      pollResult(j.job_name)          // start polling automatically
    } catch (e) {
      setRes({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function pollResult(job) {
    setPolling(true)
    // Poll every 3 seconds until completed
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${apiBase}/api/complaint/result`)
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

  return (
    <div className="service-card">
      <h3>🎤 Voice Complaint Filing</h3>
      <input
        type="file"
        accept="audio/mp3,audio/wav,audio/ogg,audio/*"
        onChange={e => setFile(e.target.files?.[0])}
      />
      <div style={{ marginTop: 8 }}>
        <button className="button" onClick={process} disabled={!file || loading || polling}>
          {loading ? 'Uploading...' : polling ? 'Transcribing...' : 'File Complaint'}
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
              <div style={{ color: 'green', marginBottom: 8 }}>✅ Transcription Complete</div>
              <h4>Transcript</h4>
              <div style={{ background: '#f4f5f7', padding: 8, whiteSpace: 'pre-wrap' }}>
                {res.transcript}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}