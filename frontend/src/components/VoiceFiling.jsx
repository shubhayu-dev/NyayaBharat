import React, { useState } from 'react'

export default function VoiceFiling({ apiBase }){
  const [url, setUrl] = useState('')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  async function process(){
    if(!url) return
    setLoading(true)
    try{
      const r = await fetch(`${apiBase}/api/complaint/voice`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ audio_url: url }) })
      const j = await r.json()
      setRes(j)
    }catch(e){ setRes({ error: e.message }) }
    finally{ setLoading(false) }
  }

  return (
    <div className="service-card">
      <h3>🎤 Voice Complaint Filing</h3>
      <input className="input" placeholder="Audio Source URL" value={url} onChange={e=>setUrl(e.target.value)} />
      <div style={{marginTop:8}}>
        <button className="button" onClick={process} disabled={!url || loading}>{loading? 'Processing...' : 'Process Voice Complaint'}</button>
      </div>
      {res && (
        <div style={{marginTop:12}}>
          {res.error ? <div style={{color:'red'}}>{res.error}</div> : (
            <>
              <div style={{color:'green'}}>Complaint Registered! ID: {res.tracking_id}</div>
              <pre style={{background:'#f4f5f7', padding:8}}>{JSON.stringify(res, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}
