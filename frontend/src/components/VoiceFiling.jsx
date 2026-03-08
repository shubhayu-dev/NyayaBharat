import React, { useState, useRef } from 'react'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .vf-overlay {
    position: fixed;
    top: 53px; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex; align-items: flex-start; justify-content: stretch;
    z-index: 99; font-family: 'DM Sans', sans-serif;
  }
  .vf-panel { background: #120820; width: 100%; height: 100%; display: flex; flex-direction: column; }
  .vf-inner {
    max-width: 720px; margin: 0 auto; width: 100%;
    display: flex; flex-direction: column; height: 100%;
  }
  .vf-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 32px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
  }
  .vf-header-left { display: flex; align-items: center; gap: 12px; }
  .vf-avatar {
    width: 38px; height: 38px; border-radius: 50%; background: #5b21b6;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .vf-header-text h3 { margin: 0; font-size: 16px; font-weight: 700; color: #fff; }
  .vf-header-text span { font-size: 12px; color: #6d28d9; font-weight: 500; }
  .vf-close { background: none; border: none; color: #aaa; font-size: 18px; cursor: pointer; padding: 0; }
  .vf-close:hover { color: #fff; }
  .vf-body {
    flex: 1; overflow-y: auto; padding: 28px 32px 60px;
    display: flex; flex-direction: column; gap: 20px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .vf-body::-webkit-scrollbar { width: 4px; }
  .vf-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  .vf-label { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }

  /* Recorder zone */
  .vf-recorder {
    background: rgba(255,255,255,0.04); border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 12px; padding: 32px 24px;
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; transition: border-color 0.2s, background 0.2s; text-align: center;
  }
  .vf-recorder.recording {
    border-color: rgba(220,38,38,0.45);
    background: rgba(220,38,38,0.05);
  }
  .vf-recorder.has-rec {
    border-color: rgba(139,92,246,0.4);
    background: rgba(91,33,182,0.07);
  }
  .vf-mic-wrap {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(91,33,182,0.22);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .vf-mic-wrap.recording {
    background: rgba(220,38,38,0.2);
    animation: vf-pulse 1.2s ease-in-out infinite;
  }
  @keyframes vf-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
    50%      { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
  }
  .vf-mic-icon { color: #a78bfa; }
  .vf-mic-wrap.recording .vf-mic-icon { color: #f87171; }

  .vf-timer {
    font-size: 24px; font-weight: 700; letter-spacing: 3px;
    color: #f87171; font-variant-numeric: tabular-nums;
  }
  .vf-recorder-title { font-size: 14px; font-weight: 600; color: #e5e7eb; margin: 0; }
  .vf-recorder-sub   { font-size: 12px; color: #6b7280; margin: 0; }
  .vf-recorded-name  { font-size: 13px; color: #a78bfa; font-weight: 600; margin: 0; }

  .vf-rec-btn {
    padding: 10px 28px; border-radius: 10px; border: none;
    font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: background 0.2s, transform 0.1s;
    background: #5b21b6; color: #fff; min-width: 180px; justify-content: center;
  }
  .vf-rec-btn:hover  { background: #6d28d9; }
  .vf-rec-btn:active { transform: scale(0.98); }
  .vf-rec-btn.stop   { background: #dc2626; }
  .vf-rec-btn.stop:hover { background: #b91c1c; }

  /* Divider */
  .vf-divider {
    display: flex; align-items: center; gap: 12px;
  }
  .vf-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
  .vf-divider-text { font-size: 11px; color: #4b5563; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }

  /* Upload zone */
  .vf-upload-zone {
    background: rgba(255,255,255,0.04); border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 12px; padding: 20px 24px;
    display: flex; align-items: center; gap: 14px;
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
  }
  .vf-upload-zone:hover { border-color: rgba(139,92,246,0.5); background: rgba(91,33,182,0.08); }
  .vf-upload-zone.has-file { border-color: rgba(139,92,246,0.4); background: rgba(91,33,182,0.1); }
  .vf-upload-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(91,33,182,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .vf-upload-texts { flex: 1; }
  .vf-upload-title { font-size: 14px; font-weight: 600; color: #e5e7eb; margin: 0 0 2px; }
  .vf-upload-title.picked { color: #a78bfa; }
  .vf-upload-sub   { font-size: 12px; color: #6b7280; margin: 0; }

  .vf-submit-btn {
    width: 100%; padding: 12px 20px; border-radius: 10px; border: none;
    background: #5b21b6; color: #fff; font-size: 15px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.2s, opacity 0.2s;
  }
  .vf-submit-btn:hover { background: #6d28d9; }
  .vf-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .vf-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: vf-spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes vf-spin { to { transform: rotate(360deg); } }

  .vf-processing {
    display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px; border-radius: 10px;
    background: rgba(91,33,182,0.1); border: 1px solid rgba(139,92,246,0.2);
  }
  .vf-steps { display: flex; flex-direction: column; gap: 8px; }
  .vf-step { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4b5563; }
  .vf-step.active { color: #a78bfa; font-weight: 600; }
  .vf-step.done   { color: #34d399; }
  .vf-step-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.1); flex-shrink: 0; }
  .vf-step.active .vf-step-dot { background: #a78bfa; }
  .vf-step.done   .vf-step-dot { background: #34d399; }

  .vf-success-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(16,185,129,0.15); color: #34d399;
    border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600;
  }
  .vf-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .vf-tab {
    padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    background: rgba(255,255,255,0.04); color: #9ca3af; transition: all 0.2s;
  }
  .vf-tab.active { background: #5b21b6; border-color: #5b21b6; color: #fff; font-weight: 700; }
  .vf-tab:hover:not(.active) { background: rgba(255,255,255,0.08); color: #e5e7eb; }

  .vf-result-card { background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; }
  .vf-result-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .vf-result-title { font-size: 13px; font-weight: 600; color: #a78bfa; }
  .vf-result-body  { padding: 16px 18px; font-size: 14px; color: #d1d5db; white-space: pre-wrap; line-height: 1.8; max-height: 420px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
  .vf-result-body::-webkit-scrollbar { width: 4px; }
  .vf-result-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  .vf-btn-row { display: flex; gap: 6px; }
  .vf-copy-btn {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    color: #a78bfa; border-radius: 6px; padding: 5px 12px;
    font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.2s;
  }
  .vf-copy-btn:hover { background: rgba(91,33,182,0.2); }
  .vf-error {
    background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.2);
    color: #f87171; border-radius: 10px; padding: 14px 18px; font-size: 13px;
  }
`

const STEPS = ['Uploading audio…', 'Transcribing speech…', 'Translating language…', 'Generating formal complaint…']

export default function VoiceFiling({ apiBase = '', onClose, result, setResult }) {
  const [uploadedFile, setUploadedFile] = useState(null)   // file picked from disk
  const [recordedFile, setRecordedFile] = useState(null)   // file from mic
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [view, setView] = useState('complaint')
  const [currentStep, setCurrentStep] = useState(0)
  const [copied, setCopied] = useState(false)

  const fileRef   = useRef()
  const mediaRef  = useRef()
  const chunksRef = useRef([])
  const timerRef  = useRef()
  const intervalRef = useRef()

  const res    = result
  const setRes = setResult

  // active file = whichever was set most recently
  const activeFile = recordedFile ?? uploadedFile

  /* ── Recording ── */
  function fmtTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  }

  async function toggleRecording() {
    if (recording) {
      clearInterval(timerRef.current)
      mediaRef.current?.stop()
      setRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        chunksRef.current = []
        const mr = new MediaRecorder(stream)
        mr.ondataavailable = e => chunksRef.current.push(e.data)
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/mpeg' })
          const f = new File([blob], 'recording.mp3', { type: 'audio/mpeg' })
          setRecordedFile(f)
          setUploadedFile(null)   // clear upload when a new recording is made
          stream.getTracks().forEach(t => t.stop())
        }
        mr.start()
        mediaRef.current = mr
        setSeconds(0)
        setRecording(true)
        setRes(null)
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      } catch {
        alert('Microphone access denied.')
      }
    }
  }

  /* ── Submit ── */
  async function process() {
    if (!activeFile) return
    setLoading(true)
    setRes(null)
    setView('complaint')
    setCurrentStep(0)
    const fd = new FormData()
    fd.append('file', activeFile)
    try {
      const r = await fetch(`${apiBase}/api/complaint/voice`, { method: 'POST', body: fd })
      const j = await r.json()
      if (j.job_name) {
        setCurrentStep(1)
        setRes({ status: 'processing' })
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
    let step = 1
    intervalRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${apiBase}/api/complaint/result/${jobName}`)
        const j = await r.json()
        if (j.status === 'COMPLETED') {
          setCurrentStep(3); setRes(j)
          clearInterval(intervalRef.current); setPolling(false)
        } else if (j.status === 'FAILED') {
          setRes({ error: 'Transcription failed. Please try again.' })
          clearInterval(intervalRef.current); setPolling(false)
        } else {
          step = step >= 2 ? 1 : step + 1
          setCurrentStep(step)
        }
      } catch (e) {
        setRes({ error: e.message })
        clearInterval(intervalRef.current); setPolling(false)
      }
    }, 3000)
  }

  /* ── Actions ── */
  function copy() {
    const text = view === 'complaint' ? res?.formal_complaint
               : view === 'native'    ? res?.native_transcript
               :                        res?.english_transcript
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    if (!res?.formal_complaint) return
    window.open(`https://wa.me/?text=${encodeURIComponent('NyayaBharat - Formal Legal Complaint\n\n' + res.formal_complaint)}`, '_blank')
  }

  function shareEmail() {
    if (!res?.formal_complaint) return
    window.open(`mailto:?subject=${encodeURIComponent('Formal Legal Complaint - NyayaBharat')}&body=${encodeURIComponent(res.formal_complaint)}`, '_blank')
  }

  const isProcessing = loading || polling

  return (
    <>
      <style>{styles}</style>
      <div className="vf-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
        <div className="vf-panel">
          <div className="vf-inner">

            {/* Header */}
            <div className="vf-header">
              <div className="vf-header-left">
                <div className="vf-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
                <div className="vf-header-text">
                  <h3>Voice Complaint Filing</h3>
                  <span>Speak your grievance · AI formats it legally</span>
                </div>
              </div>
              <button className="vf-close" onClick={onClose}>✕</button>
            </div>

            <div className="vf-body">

              {/* ── Recorder ── */}
              <div>
                <div className="vf-label">Record your complaint</div>
                <div className={`vf-recorder${recording ? ' recording' : recordedFile ? ' has-rec' : ''}`}>
                  <div className={`vf-mic-wrap${recording ? ' recording' : ''}`}>
                    <svg className="vf-mic-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </div>

                  {recording
                    ? <div className="vf-timer">{fmtTime(seconds)}</div>
                    : recordedFile
                    ? <p className="vf-recorded-name">🎵 recording.mp3 · ready</p>
                    : <>
                        <p className="vf-recorder-title">Tap to start recording</p>
                        <p className="vf-recorder-sub">Speak clearly in any Indian language</p>
                      </>
                  }

                  <button className={`vf-rec-btn${recording ? ' stop' : ''}`} onClick={toggleRecording}>
                    {recording
                      ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg> Stop Recording</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg> {recordedFile ? 'Re-record' : 'Start Recording'}</>
                    }
                  </button>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="vf-divider">
                <div className="vf-divider-line" />
                <span className="vf-divider-text">or upload a file</span>
                <div className="vf-divider-line" />
              </div>

              {/* ── File upload ── */}
              <div
                className={`vf-upload-zone${uploadedFile ? ' has-file' : ''}`}
                onClick={() => fileRef.current.click()}
              >
                <div className="vf-upload-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="vf-upload-texts">
                  <p className={`vf-upload-title${uploadedFile ? ' picked' : ''}`}>
                    {uploadedFile ? uploadedFile.name : 'Upload Voice Recording'}
                  </p>
                  <p className="vf-upload-sub">MP3, WAV, OGG · Click to browse</p>
                </div>
                <input ref={fileRef} type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/*"
                  style={{ display: 'none' }}
                  onChange={e => { setUploadedFile(e.target.files?.[0]); setRecordedFile(null); setRes(null) }} />
              </div>

              {/* ── Submit ── */}
              <button className="vf-submit-btn" onClick={process} disabled={!activeFile || isProcessing}>
                {isProcessing
                  ? <><div className="vf-spinner" /> Processing…</>
                  : <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      File Complaint
                    </>
                }
              </button>

              {/* ── Processing steps ── */}
              {isProcessing && (
                <div className="vf-processing">
                  <div className="vf-spinner" style={{ marginTop: 3 }} />
                  <div className="vf-steps">
                    {STEPS.map((s, i) => (
                      <div key={i} className={`vf-step${i === currentStep ? ' active' : i < currentStep ? ' done' : ''}`}>
                        <div className="vf-step-dot" />
                        {i < currentStep ? '✓ ' : ''}{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Results ── */}
              {res && !isProcessing && (
                res.error ? (
                  <div className="vf-error">⚠ {res.error}</div>
                ) : res.status !== 'processing' && (
                  <>
                    <div className="vf-success-tag">✓ Complaint Ready</div>
                    <div className="vf-tabs">
                      {[
                        { key: 'complaint', label: '📄 Formal Complaint' },
                        { key: 'native',    label: '🌐 Original' },
                        { key: 'english',   label: '🇬🇧 English' },
                      ].map(t => (
                        <button key={t.key} className={`vf-tab${view === t.key ? ' active' : ''}`} onClick={() => setView(t.key)}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="vf-result-card">
                      <div className="vf-result-header">
                        <div className="vf-result-title">
                          {view === 'complaint' && '📄 AI-Formatted Legal Complaint'}
                          {view === 'native'    && '🌐 Original Transcript'}
                          {view === 'english'   && '🇬🇧 English Translation'}
                        </div>
                        {view === 'complaint' && (
                          <div className="vf-btn-row">
                            <button className="vf-copy-btn" onClick={copy}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                            <button className="vf-copy-btn" onClick={shareWhatsApp} style={{ color: '#34d399' }}>💬 WhatsApp</button>
                            <button className="vf-copy-btn" onClick={shareEmail} style={{ color: '#60a5fa' }}>✉ Email</button>
                          </div>
                        )}
                      </div>
                      <div className="vf-result-body">
                        {view === 'complaint' && (res.formal_complaint    || 'No complaint generated.')}
                        {view === 'native'    && (res.native_transcript   || 'No transcript available.')}
                        {view === 'english'   && (res.english_transcript  || 'No translation available.')}
                      </div>
                    </div>
                  </>
                )
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}