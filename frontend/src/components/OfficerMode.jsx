import React, { useState, useEffect, useRef } from 'react'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .om-overlay {
    position: fixed;
    top: 53px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: flex-start;
    justify-content: stretch;
    z-index: 99;
    font-family: 'DM Sans', sans-serif;
  }

  .om-panel {
    background: #120820;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .om-inner {
    max-width: 720px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .om-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }

  .om-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .om-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #5b21b6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .om-header-text h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
  }

  .om-header-text span {
    font-size: 12px;
    color: #6d28d9;
    font-weight: 500;
  }

  .om-close {
    background: none;
    border: none;
    color: #aaa;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .om-close:hover { color: #fff; }

  /* KEY FIX: body must scroll, not the panel */
  .om-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 28px 32px 60px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
    -webkit-overflow-scrolling: touch;
  }
  .om-body::-webkit-scrollbar { width: 4px; }
  .om-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  .om-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #6b7280;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .om-upload-zone {
    background: rgba(255,255,255,0.04);
    border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    text-align: center;
  }
  .om-upload-zone:hover, .om-upload-zone.drag {
    border-color: rgba(139,92,246,0.5);
    background: rgba(91,33,182,0.08);
  }
  .om-upload-zone.has-file {
    border-color: rgba(139,92,246,0.4);
    background: rgba(91,33,182,0.1);
  }

  .om-upload-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(91,33,182,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .om-upload-title {
    font-size: 14px;
    font-weight: 600;
    color: #e5e7eb;
    margin: 0;
  }

  .om-upload-sub {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
  }

  .om-preview {
    width: 100%;
    max-height: 180px;
    object-fit: contain;
    border-radius: 8px;
    margin-top: 4px;
  }

  .om-selects-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .om-select-group {
    flex: 1;
    min-width: 160px;
  }

  .om-select {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
    transition: border-color 0.2s;
  }
  .om-select:focus { border-color: rgba(139,92,246,0.5); }
  .om-select option { background: #1e1030; }

  .om-submit-btn {
    width: 100%;
    padding: 13px;
    border-radius: 10px;
    border: none;
    background: #5b21b6;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s, opacity 0.2s, transform 0.1s;
  }
  .om-submit-btn:hover { background: #6d28d9; }
  .om-submit-btn:active { transform: scale(0.99); }
  .om-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .om-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: om-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes om-spin { to { transform: rotate(360deg); } }

  .om-result-card {
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    overflow: hidden;
    /* KEY FIX: don't constrain height here */
  }

  .om-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
    gap: 8px;
  }

  .om-result-title {
    font-size: 13px;
    font-weight: 600;
    color: #a78bfa;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .om-result-meta {
    font-size: 11px;
    color: #4b5563;
  }

  /* KEY FIX: result body shows full content, no max-height clipping */
  .om-result-body {
    padding: 16px 18px;
    font-size: 13px;
    color: #d1d5db;
    white-space: pre-wrap;
    line-height: 1.7;
    word-break: break-word;
  }

  /* KEY FIX: textarea expands to show all content */
  .om-formal-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #d1d5db;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    line-height: 1.7;
    resize: vertical;
    min-height: 300px;
    box-sizing: border-box;
  }

  .om-action-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .om-copy-btn {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: #a78bfa;
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 12px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.2s;
  }
  .om-copy-btn:hover { background: rgba(91,33,182,0.2); }

  .om-pdf-btn {
    background: #5b21b6;
    border: none;
    color: #fff;
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 12px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }
  .om-pdf-btn:hover { background: #6d28d9; }

  .om-success-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
  }

  .om-error {
    background: rgba(220,38,38,0.1);
    border: 1px solid rgba(220,38,38,0.2);
    color: #f87171;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
  }

  .om-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
  }
`

export default function OfficerMode({ apiBase = '', onClose, result, setResult }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [department, setDepartment] = useState('general')
  const [departments, setDepartments] = useState({ general: 'General' })
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef()
  const resultRef = useRef()

  // Use lifted state: res = result prop, setRes = setResult prop
  const res = result
  const setRes = setResult

  useEffect(() => {
    fetch(`${apiBase}/api/officer/departments`)
      .then(r => r.json())
      .then(j => setDepartments(j.departments))
      .catch(() => {})
  }, [apiBase])

  useEffect(() => {
    if (res && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [res])

  function pickFile(f) {
    if (!f) return
    setFile(f)
    setRes(null)
    setPreview(URL.createObjectURL(f))
  }

  const [step, setStep] = useState('')

  async function scan() {
    if (!file) return
    setLoading(true)
    setRes(null)
    setStep('📸 Reading handwriting...')
    const fd = new FormData()
    fd.append('image', file)
    fd.append('department', department)
    fd.append('language', 'en')
    try {
      const r = await fetch(`${apiBase}/api/officer/scan-petition`, { method: 'POST', body: fd })
      setRes(await r.json())
    } catch (e) {
      setRes({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  function copyDoc() {
    if (!res?.formal_document) return
    navigator.clipboard.writeText(res.formal_document)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadPDF() {
    // Load jsPDF dynamically
    if (window.jspdf) { generatePDF(); return; }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = generatePDF
    document.head.appendChild(script)
  }

  function generatePDF() {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('FORMAL COMPLAINT / PETITION', pageWidth / 2, y, { align: 'center' })
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Department: ${res.department}`, pageWidth / 2, y, { align: 'center' })
    y += 6
    doc.text(`Generated by NyayaBharat on ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, y, { align: 'center' })
    y += 10

    // Divider
    doc.setDrawColor(200)
    doc.setLineWidth(0.4)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Body
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)

    const lines = doc.splitTextToSize(res.formal_document, maxWidth)
    lines.forEach(line => {
      if (y > 272) { doc.addPage(); y = 20 }
      doc.text(line, margin, y)
      y += 6
    })

    // Footer
    if (y > 265) { doc.addPage(); y = 20 }
    y += 8
    doc.setFontSize(9)
    doc.setTextColor(160)
    doc.text('Generated by NyayaBharat AI — AI-assisted legal platform for Indian citizens.', margin, y, { maxWidth })

    doc.save(`NyayaBharat_${res.department?.replace(/\s+/g, '_') || 'Complaint'}.pdf`)
  }

  return (
    <>
      <style>{styles}</style>
      <div className="om-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
        <div className="om-panel">
          <div className="om-inner">

            {/* Header */}
            <div className="om-header">
              <div className="om-header-left">
                <div className="om-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
                    <path d="M8 7V5a2 2 0 0 0-4 0v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                  </svg>
                </div>
                <div className="om-header-text">
                  <h3>Government Officer Portal</h3>
                  <span>Scan &amp; formalize petitions</span>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="om-body">

              {/* Upload */}
              <div>
                <div className="om-label">Upload Petition Image</div>
                <div
                  className={`om-upload-zone${drag ? ' drag' : ''}${file ? ' has-file' : ''}`}
                  onClick={() => fileRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]) }}
                >
                  {preview ? (
                    <>
                      <img src={preview} className="om-preview" alt="Preview" />
                      <p className="om-upload-sub">{file.name} · Click to change</p>
                    </>
                  ) : (
                    <>
                      <div className="om-upload-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <p className="om-upload-title">Drop image here or click to browse</p>
                      <p className="om-upload-sub">Supports JPG, PNG, WEBP · Handwritten or printed petitions</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile(e.target.files?.[0])} />
                </div>
              </div>

              {/* Selects */}
              <div className="om-selects-row">
                <div className="om-select-group">
                  <div className="om-label">Department</div>
                  <select className="om-select" value={department} onChange={e => setDepartment(e.target.value)}>
                    {Object.entries(departments).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button className="om-submit-btn" onClick={scan} disabled={!file || loading}>
                {loading
                  ? <><div className="om-spinner" /> Generating Document…</>
                  : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                      </svg>
                      Generate Formal Document
                    </>
                }
              </button>

              {/* Results */}
              {res && (
                <div ref={resultRef}>
                  {res.error ? (
                    <div className="om-error">⚠ {res.error}</div>
                  ) : (
                    <>
                      <div className="om-success-tag" style={{ marginBottom: 16 }}>✓ Document Generated</div>

                      {/* Transcription */}
                      <div className="om-result-card" style={{ marginBottom: 12 }}>
                        <div className="om-result-header">
                          <div className="om-result-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Transcription
                          </div>
                          <span className="om-result-meta">Handwritten text detected</span>
                        </div>
                        <div className="om-result-body">{res.transcription}</div>
                      </div>

                      <div className="om-divider" style={{ marginBottom: 12 }} />

                      {/* Formal document */}
                      <div className="om-result-card">
                        <div className="om-result-header">
                          <div className="om-result-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            Formal Document · {res.language}
                          </div>
                          <div className="om-action-row">
                            <button className="om-copy-btn" onClick={copyDoc}>
                              {copied ? '✓ Copied' : 'Copy'}
                            </button>
                            <button className="om-pdf-btn" onClick={downloadPDF}>
                              ⬇ Download PDF
                            </button>
                          </div>
                        </div>
                        <div className="om-result-body">
                          <textarea
                            className="om-formal-textarea"
                            defaultValue={res.formal_document}
                            rows={Math.max(10, (res.formal_document || '').split('\n').length + 2)}
                          />
                        </div>
                        {(res.department || res.model) && (
                          <div style={{ padding: '0 18px 14px', fontSize: 11, color: '#4b5563' }}>
                            {res.department && `Dept: ${res.department}`}{res.department && res.model && ' · '}{res.model && `Model: ${res.model}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}