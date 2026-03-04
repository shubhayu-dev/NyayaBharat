import React, { useState } from 'react'

export default function LegalLens({ apiBase }){
  const [file, setFile] = useState(null)
  const [lang, setLang] = useState('en')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  async function upload(){
    if(!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('language', lang)
    try{
      const r = await fetch(`${apiBase}/api/document/process`, { method:'POST', body: fd })
      const j = await r.json()
      setRes(j)
    }catch(e){ setRes({ error: e.message }) }
    finally{ setLoading(false) }
  }

  return (
    <div className="service-card">
      <h3>🔍 Legal Lens: Document Simplifier</h3>
      <input type="file" onChange={e=>setFile(e.target.files?.[0])} />
      <div style={{marginTop:8}}>
        <select value={lang} onChange={e=>setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
        <button className="button" onClick={upload} style={{marginLeft:8}} disabled={!file || loading}>{loading? 'Processing...' : 'Simplify'}</button>
      </div>
      {res && (
        <div style={{marginTop:12}}>
          {res.error ? <div style={{color:'red'}}>{res.error}</div> : (
            <>
              <h4>What this means</h4>
              <div>{res.simplified_text}</div>
              <div style={{display:'flex', gap:12, marginTop:8}}>
                <div><strong>Deadlines</strong><div>{res.deadlines?.join(', ')}</div></div>
                <div><strong>Actions</strong><div>{(res.action_items||[]).join(', ')}</div></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
