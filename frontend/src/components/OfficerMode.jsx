import React, { useState } from 'react'

export default function OfficerMode({ apiBase }){
  const [file, setFile] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  async function translate(){
    if(!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try{
      const r = await fetch(`${apiBase}/api/officer/translate`, { method:'POST', body: fd })
      const j = await r.json()
      setRes(j)
    }catch(e){ setRes({ error: e.message }) }
    finally{ setLoading(false) }
  }

  return (
    <div className="service-card">
      <h3>👮 Government Officer Portal</h3>
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0])} />
      <div style={{marginTop:8}}>
        <button className="button" onClick={translate} disabled={!file || loading}>{loading? 'Generating...' : 'Generate Official Translation'}</button>
      </div>
      {res && (
        <div style={{marginTop:12}}>
          {res.error ? <div style={{color:'red'}}>{res.error}</div> : (
            <>
              <h4>Formal Document Output</h4>
              <textarea className="textarea" rows={10} value={res.formal_translation} readOnly />
              <div style={{marginTop:8}}>Confidence: {Math.round((res.confidence_score||0)*100)}%</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
