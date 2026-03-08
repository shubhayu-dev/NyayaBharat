import React, { useState, useRef, useEffect } from 'react'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .rb-overlay {
    position: fixed;
    top: 53px; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex; align-items: flex-start; justify-content: stretch;
    z-index: 99; font-family: 'DM Sans', sans-serif;
  }

  .rb-panel { background: #120820; width: 100%; height: 100%; display: flex; flex-direction: column; }

  .rb-panel-inner {
    max-width: 680px; margin: 0 auto; width: 100%;
    display: flex; flex-direction: column; height: 100%;
  }

  .rb-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 32px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
  }
  .rb-header-left { display: flex; align-items: center; gap: 12px; }
  .rb-avatar {
    width: 38px; height: 38px; border-radius: 50%; background: #5b21b6;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rb-header-text h3 { margin: 0; font-size: 16px; font-weight: 700; color: #fff; }
  .rb-header-text span { font-size: 12px; color: #6d28d9; font-weight: 500; }
  .rb-header-right { display: flex; align-items: center; gap: 12px; }
  .rb-lang-select {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #ccc; border-radius: 8px; padding: 6px 10px;
    font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none;
  }
  .rb-lang-select:focus { border-color: rgba(139,92,246,0.5); }
  .rb-close { background: none; border: none; color: #aaa; font-size: 18px; cursor: pointer; line-height: 1; padding: 0; }
  .rb-close:hover { color: #fff; }

  .rb-messages {
    flex: 1; overflow-y: auto; padding: 24px 32px;
    display: flex; flex-direction: column; gap: 16px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .rb-messages::-webkit-scrollbar { width: 4px; }
  .rb-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  .rb-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; padding: 40px 0; text-align: center;
  }
  .rb-empty-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(91,33,182,0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .rb-empty h4 { margin: 0; font-size: 17px; color: #e5e7eb; font-weight: 600; }
  .rb-empty p { margin: 0; font-size: 13px; color: #6b7280; max-width: 300px; line-height: 1.6; }

  .rb-suggestions {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; margin-top: 4px;
  }
  .rb-suggestion {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: #a78bfa; border-radius: 20px; padding: 7px 14px;
    font-size: 12px; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: background 0.2s, border-color 0.2s;
  }
  .rb-suggestion:hover { background: rgba(91,33,182,0.2); border-color: rgba(139,92,246,0.4); }

  .rb-msg { display: flex; gap: 10px; align-items: flex-end; }
  .rb-msg.user { flex-direction: row-reverse; }

  .rb-msg-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 13px;
  }
  .rb-msg.bot .rb-msg-avatar { background: #5b21b6; }

  .rb-bubble {
    max-width: 78%; padding: 12px 16px;
    border-radius: 16px; font-size: 14px; line-height: 1.6;
    white-space: pre-wrap;
  }
  .rb-msg.user .rb-bubble {
    background: #5b21b6; color: #fff; border-bottom-right-radius: 4px;
  }
  .rb-msg.bot .rb-bubble {
    background: rgba(255,255,255,0.07); color: #e5e7eb; border-bottom-left-radius: 4px;
  }

  /* Streaming cursor */
  .rb-cursor {
    display: inline-block;
    width: 2px; height: 14px;
    background: #a78bfa;
    margin-left: 2px;
    vertical-align: middle;
    border-radius: 1px;
    animation: rb-blink 0.7s ease-in-out infinite;
  }
  @keyframes rb-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .rb-citations {
    margin-top: 10px; padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex; flex-direction: column; gap: 4px;
  }
  .rb-citation {
    font-size: 11px; color: #a78bfa;
    display: flex; align-items: center; gap: 5px;
  }
  .rb-error-bubble { background: rgba(220,38,38,0.15); color: #f87171; border-bottom-left-radius: 4px; }

  /* Typing indicator (initial wait before stream starts) */
  .rb-typing { display: flex; gap: 4px; align-items: center; padding: 6px 0; }
  .rb-dot {
    width: 7px; height: 7px; background: #6b7280;
    border-radius: 50%; animation: rb-bounce 1.2s ease-in-out infinite;
  }
  .rb-dot:nth-child(2) { animation-delay: 0.2s; }
  .rb-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes rb-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-6px); opacity: 1; }
  }

  .rb-inputbar {
    padding: 16px 32px 20px;
    border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
  }
  .rb-input-row {
    display: flex; gap: 10px; align-items: center;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 10px 14px; transition: border-color 0.2s;
  }
  .rb-input-row:focus-within { border-color: rgba(139,92,246,0.5); }
  .rb-input {
    flex: 1; background: none; border: none; outline: none;
    color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif;
    resize: none; min-height: 22px; max-height: 100px; line-height: 1.5;
  }
  .rb-input::placeholder { color: #4b5563; }
  .rb-send-btn {
    width: 36px; height: 36px; border-radius: 8px; border: none;
    background: #5b21b6; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: background 0.2s, opacity 0.2s, transform 0.1s;
  }
  .rb-send-btn:hover { background: #6d28d9; transform: scale(1.05); }
  .rb-send-btn:active { transform: scale(0.97); }
  .rb-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
`

// Simple markdown renderer: handles ###, **bold**, - bullets
function renderMarkdown(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    // Headings
    if (line.startsWith('#### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: '#c4b5fd', marginTop: 8 }}>{line.slice(5)}</div>
    if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa', marginTop: 10 }}>{line.slice(4)}</div>
    if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 700, fontSize: 15, color: '#8b5cf6', marginTop: 12 }}>{line.slice(3)}</div>
    // Bullet
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <div key={i} style={{ paddingLeft: 12, marginTop: 2 }}>• {formatInline(line.slice(2))}</div>
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      return <div key={i} style={{ paddingLeft: 12, marginTop: 2 }}>{formatInline(line)}</div>
    }
    // Empty line
    if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
    // Normal
    return <div key={i} style={{ marginTop: 2 }}>{formatInline(line)}</div>
  })
}

function formatInline(text) {
  // Bold: **text**
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#e5e7eb' }}>{p}</strong> : p)
}

const SUGGESTIONS = [
  'What are my rights if arrested?',
  'How do I file an RTI?',
  'Rights against police harassment',
  'Consumer protection rights',
]

export default function RightsBot({ apiBase = '', onClose }) {
  const [messages, setMessages] = useState([])
  const [q, setQ] = useState('')
  const [lang, setLang] = useState('en')
  const [loading, setLoading] = useState(false)   // true = waiting for first byte
  const [streaming, setStreaming] = useState(false) // true = characters arriving
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function ask(question) {
    const text = (question ?? q).trim()
    if (!text) return
    setQ('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    // Add empty bot message placeholder
    const botIdx = Date.now()
    setMessages(prev => [...prev, { role: 'bot', text: '', citations: [], streaming: true, id: botIdx }])

    try {
      const r = await fetch(`${apiBase}/api/rights/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, language: lang })
      })

      setLoading(false)
      setStreaming(true)

      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''
      let citations = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const event = JSON.parse(raw)
            if (event.type === 'citations') {
              citations = event.citations
              const relevanceScore = event.relevance_score
              const fromCache = event.from_cache
              const similarity = event.similarity
              const modelUsed = fromCache
                ? `💾 Cached (${similarity}% match)`
                : event.model_used?.includes('pro') ? '⚡ Nova Pro' : '🔹 Nova Lite'
              setMessages(prev => prev.map(m =>
                m.id === botIdx ? { ...m, citations, relevanceScore, modelUsed, fromCache } : m
              ))
            } else if (event.type === 'chunk') {
              accumulated += event.text
              const snap = accumulated
              setMessages(prev => prev.map(m =>
                m.id === botIdx ? { ...m, text: snap } : m
              ))
            } else if (event.type === 'ragas') {
              setMessages(prev => prev.map(m =>
                m.id === botIdx ? { ...m, ragas: event } : m
              ))
            } else if (event.type === 'done') {
              // stream finished
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch {}
        }
      }

      // Mark streaming done
      setMessages(prev => prev.map(m =>
        m.id === botIdx ? { ...m, streaming: false } : m
      ))
    } catch (e) {
      setLoading(false)
      setMessages(prev => prev.map(m =>
        m.id === botIdx ? { ...m, text: '', error: e.message, streaming: false } : m
      ))
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() }
  }

  const empty = messages.length === 0

  return (
    <>
      <style>{styles}</style>
      <div className="rb-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
        <div className="rb-panel">
          <div className="rb-panel-inner">

            {/* Header */}
            <div className="rb-header">
              <div className="rb-header-left">
                <div className="rb-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <div className="rb-header-text">
                  <h3>Legal Rights Assistant</h3>
                  <span>Powered by AI · Know your rights</span>
                </div>
              </div>
              <div className="rb-header-right">
                <select className="rb-lang-select" value={lang} onChange={e => setLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="bn">Bengali</option>
                  <option value="te">Telugu</option>
                  <option value="mr">Marathi</option>
                  <option value="ta">Tamil</option>
                  <option value="gu">Gujarati</option>
                  <option value="kn">Kannada</option>
                  <option value="ml">Malayalam</option>
                  <option value="pa">Punjabi</option>
                  <option value="or">Odia</option>
                  <option value="as">Assamese</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="rb-messages">
              {empty ? (
                <div className="rb-empty">
                  <div className="rb-empty-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h4>Ask about your legal rights</h4>
                  <p>Get clear, plain-language answers about Indian law and your rights as a citizen.</p>
                  <div className="rb-suggestions">
                    {SUGGESTIONS.map(s => (
                      <button key={s} className="rb-suggestion" onClick={() => ask(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div key={m.id ?? i} className={`rb-msg ${m.role}`}>
                      <div className="rb-msg-avatar">
                        {m.role === 'bot'
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                          : '👤'
                        }
                      </div>
                      <div className={`rb-bubble${m.error ? ' rb-error-bubble' : ''}`}>
                        {m.error
                          ? `⚠ ${m.error}`
                          : m.role === 'bot' && loading && m.streaming && m.text === ''
                            /* waiting for first byte: show bouncing dots */
                            ? <div className="rb-typing"><div className="rb-dot"/><div className="rb-dot"/><div className="rb-dot"/></div>
                            : <>
                                {m.streaming ? m.text : renderMarkdown(m.text)}
                                {/* blinking cursor while streaming */}
                                {m.streaming && m.text !== '' && <span className="rb-cursor" />}
                              </>
                        }
                        {!m.streaming && m.ragas && (
                          <div style={{
                            marginTop: 10, padding: '10px 12px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>
                              RAGAS EVALUATION
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {[
                                { label: 'Faithfulness', val: m.ragas.faithfulness },
                                { label: 'Relevance', val: m.ragas.answer_relevance },
                                { label: 'Precision', val: m.ragas.context_precision },
                              ].map(({ label, val }) => (
                                <div key={label} style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                                  <div style={{
                                    fontSize: 16, fontWeight: 700,
                                    color: val >= 0.8 ? '#34d399' : val >= 0.6 ? '#fbbf24' : '#f87171'
                                  }}>{Math.round(val * 100)}%</div>
                                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{label}</div>
                                </div>
                              ))}
                              <div style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                                <div style={{
                                  fontSize: 16, fontWeight: 700,
                                  color: m.ragas.overall >= 0.8 ? '#34d399' : m.ragas.overall >= 0.6 ? '#fbbf24' : '#f87171'
                                }}>{Math.round(m.ragas.overall * 100)}%</div>
                                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Overall</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {!m.streaming && m.citations?.length > 0 && (
                          <div className="rb-citations">
                            {m.relevanceScore !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '3px 8px', borderRadius: 12,
                                  background: m.relevanceScore >= 0.7 ? 'rgba(16,185,129,0.15)' :
                                              m.relevanceScore >= 0.4 ? 'rgba(245,158,11,0.15)' :
                                              'rgba(239,68,68,0.15)',
                                  color: m.relevanceScore >= 0.7 ? '#34d399' :
                                         m.relevanceScore >= 0.4 ? '#fbbf24' : '#f87171',
                                  fontSize: 11, fontWeight: 600
                                }}>
                                  ◉ Relevance: {Math.round(m.relevanceScore * 100)}%
                                </div>
                                {m.modelUsed && (
                                  <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 8px', borderRadius: 12,
                                    background: 'rgba(139,92,246,0.15)',
                                    color: '#a78bfa', fontSize: 11, fontWeight: 600
                                  }}>
                                    {m.modelUsed}
                                  </div>
                                )}
                              </div>
                            )}
                            {m.citations.map((c, ci) => (
                              <div key={ci} className="rb-citation">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                {c.source?.replace('s3://', '').split('/').pop()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="rb-inputbar">
              <div className="rb-input-row">
                <textarea
                  ref={inputRef}
                  className="rb-input"
                  rows={1}
                  placeholder="Ask about your rights..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={onKey}
                />
                <button className="rb-send-btn" onClick={() => ask()} disabled={!q.trim() || loading || streaming}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}