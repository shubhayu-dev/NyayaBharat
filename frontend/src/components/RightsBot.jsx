import React, { useState } from 'react'

export default function RightsBot({ apiBase }){
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  async function ask(){
    setLoading(true)
    try{
      const r = await fetch(`${apiBase}/api/rights/query`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ question: q, language:'en' }) })
      const j = await r.json()
      setRes(j)
    }catch(e){
      setRes({ error: e.message })
    }finally{ setLoading(false) }
  }

  return (
    <div className="service-card">
      <h3>🤖 Legal Rights Assistant</h3>
      <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about your rights..." />
      <div style={{marginTop:8}}>
        <button className="button" onClick={ask} disabled={!q || loading}>{loading? 'Thinking...' : 'Get Legal Advice'}</button>
      </div>
      {res && (
        <div style={{marginTop:12}}>
          {res.error ? <div style={{color:'red'}}>{res.error}</div> : (
            <>
              <h4>Answer</h4>
              <div>{res.answer}</div>
              <small style={{color:'#666'}}>Citation: {res.citations?.[0]?.source} Art. {res.citations?.[0]?.article}</small>
            </>
          )}
        </div>
      )}
    </div>
  )
}
