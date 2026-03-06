import React, { useState, useRef } from 'react'

export default function RightsBot({ apiBase }) {
  const [q, setQ] = useState('')
  const [lang, setLang] = useState('en')
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  async function ask() {
    if (!q) return
    setLoading(true)
    setAnswer('')
    setCitations([])
    setError(null)

    // Cancel any previous stream
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${apiBase}/api/rights/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, language: lang }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'citations') {
              setCitations(event.citations)
            } else if (event.type === 'chunk') {
              setAnswer(prev => prev + event.text)
            } else if (event.type === 'error') {
              setError(event.message)
            }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="service-card">
      <h3>🤖 Legal Rights Assistant</h3>

      <input
        className="input"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Ask about your rights..."
        onKeyDown={e => e.key === 'Enter' && !loading && ask()}
      />

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <select value={lang} onChange={e => setLang(e.target.value)}>
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
        <button className="button" onClick={ask} disabled={!q || loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
        {loading && (
          <button
            style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
            onClick={() => abortRef.current?.abort()}
          >
            Stop
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, color: 'red' }}>{error}</div>
      )}

      {(answer || loading) && (
        <div style={{ marginTop: 16 }}>
          <h4>Answer</h4>
          <div style={{
            background: '#f4f5f7',
            padding: 12,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            minHeight: 48,
          }}>
            {answer}
            {/* Blinking cursor while streaming */}
            {loading && (
              <span style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: '#333',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ fontSize: 13, color: '#666' }}>Sources</h4>
          {citations.map((c, i) => (
            <div key={i} style={{
              fontSize: 12,
              color: '#888',
              marginTop: 4,
              padding: '4px 8px',
              background: '#f9f9f9',
              borderLeft: '3px solid #ccc',
              borderRadius: 2,
            }}>
              {c.source.replace('s3://', '').split('/').pop()}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}