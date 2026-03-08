import React, { useState, useEffect } from 'react'
import DashPic from "../assets/Dash_pic.jpg";
import brainIcon from "../assets/icons/brain.png";
import scalesIcon from "../assets/icons/scales.png";
import girlIcon from "../assets/icons/girl.png";
import phoneIcon from "../assets/icons/phone.png";
import micIcon from "../assets/icons/microphone.png";
import searchIcon from "../assets/icons/search.png";
import shieldIcon from "../assets/icons/shield.png";
import shieldIcon2 from "../assets/icons/shield2.png";
import chatIcon from "../assets/icons/chat.png";
import globeIcon from "../assets/icons/globe.png";
import telegramIcon from "../assets/icons/telegram.png";

// ── Typewriter phrases ──────────────────────────────────────────────────────
const PHRASES = [
  "Simplifies Law for You",
  "Files Complaints via Voice Note",
  "Decodes Legal Documents Instantly",
  "Empowers Officers with AI Tools",
]

function useTypewriter(phrases, { typeSpeed = 60, deleteSpeed = 35, pauseMs = 1800 } = {}) {
  const [display, setDisplay] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIdx]
    let timeout

    if (!deleting && charIdx < current.length) {
      // typing
      timeout = setTimeout(() => setCharIdx(i => i + 1), typeSpeed)
    } else if (!deleting && charIdx === current.length) {
      // pause then start deleting
      timeout = setTimeout(() => setDeleting(true), pauseMs)
    } else if (deleting && charIdx > 0) {
      // deleting
      timeout = setTimeout(() => setCharIdx(i => i - 1), deleteSpeed)
    } else if (deleting && charIdx === 0) {
      // move to next phrase
      setDeleting(false)
      setPhraseIdx(i => (i + 1) % phrases.length)
    }

    setDisplay(current.slice(0, charIdx))
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, phraseIdx, phrases, typeSpeed, deleteSpeed, pauseMs])

  return display
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .landing, .landing * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

  .landing {
    background: #120820 !important;
    color: #e5e7eb;
    overflow-x: hidden;
  }

  /* ── HERO ── */
  .landing .hero {
    background: #120820 !important;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    border-radius: 0;
  }

  .landing .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 70% at 80% 50%, rgba(91,33,182,0.18) 0%, transparent 65%),
      radial-gradient(ellipse 40% 50% at 5% 85%, rgba(91,33,182,0.10) 0%, transparent 55%);
    pointer-events: none;
    z-index: 0;
  }

  .landing .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 1160px;
    margin: 0 auto;
    padding: 80px 40px 72px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
  }

  .landing .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(91,33,182,0.2) !important;
    color: #a78bfa !important;
    border: 1px solid rgba(139,92,246,0.35);
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin-bottom: 22px;
  }

  .landing .badge::before {
    content: '';
    width: 6px; height: 6px;
    background: #a78bfa;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(139,92,246,0.25);
    animation: lp-pulse 2s ease-in-out infinite;
  }

  @keyframes lp-pulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
    50%       { box-shadow: 0 0 0 7px rgba(139,92,246,0.07); }
  }

  .landing .hero-left h1 {
    font-size: clamp(28px, 3.4vw, 46px);
    font-weight: 700;
    line-height: 1.2;
    color: #fff !important;
    letter-spacing: -0.02em;
    margin: 0 0 18px;
    min-height: 3.6em;
  }

  .landing .hero-left h1 .static { color: #fff !important; }
  .landing .hero-left h1 .typed  { color: #a78bfa !important; }

  /* blinking cursor */
  .landing .cursor {
    display: inline-block;
    width: 3px;
    height: 0.85em;
    background: #a78bfa;
    margin-left: 3px;
    border-radius: 2px;
    vertical-align: middle;
    animation: lp-blink 0.75s step-end infinite;
  }

  @keyframes lp-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  .landing .lead {
    color: #9ca3af !important;
    font-size: 16px;
    line-height: 1.8;
    margin: 0 0 32px;
  }

  .landing .hero-ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 48px;
  }

  .landing .btn, .landing a.btn {
    text-decoration: none;
  }

  .landing .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .landing .btn-icon {
    width: 16px; height: 16px;
    object-fit: contain;
    filter: none !important;
  }

  .landing .btn.primary {
    background: #5b21b6 !important;
    color: #fff !important;
    box-shadow: 0 4px 20px rgba(91,33,182,0.4);
  }
  .landing .btn.primary:hover {
    background: #6d28d9 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(91,33,182,0.55);
  }

  .landing .btn.ghost {
    background: rgba(255,255,255,0.05) !important;
    color: #d1d5db !important;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .landing .btn.ghost:hover {
    border-color: rgba(139,92,246,0.4);
    color: #a78bfa !important;
    background: rgba(91,33,182,0.1) !important;
    transform: translateY(-2px);
  }

  .landing .btn.large { padding: 13px 30px; font-size: 15px; }

  @keyframes lp-glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(91,33,182,0.4); }
    50%       { box-shadow: 0 8px 36px rgba(91,33,182,0.7); }
  }
  .landing .btn.glowing { animation: lp-glow 2.5s ease-in-out infinite; }

  .landing .kpis {
    list-style: none;
    padding: 0; margin: 0;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .landing .kpis li {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 10px 16px;
  }

  .landing .kpis strong { font-size: 20px; font-weight: 700; color: #a78bfa !important; line-height: 1; }
  .landing .kpis span   { font-size: 12px; color: #6b7280 !important; font-weight: 500; }

  .landing .hero-right { display: flex; align-items: center; justify-content: center; }
  .landing .hero-right img {
    width: 100%;
    max-width: 500px;
    border-radius: 16px;
    border: 1px solid rgba(139,92,246,0.18);
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    display: block;
  }

  /* ── SECTIONS ── */
  .landing .section-inner { max-width: 1160px; margin: 0 auto; }

  .landing .why,
  .landing .features,
  .landing .steps,
  .landing .why-different { padding: 80px 40px; }

  .landing .why,
  .landing .steps {
    background: #0e0618 !important;
    border-top: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .landing .features,
  .landing .why-different {
    background: #120820 !important;
  }

  .landing .section-title {
    font-size: clamp(20px, 2.6vw, 30px);
    font-weight: 700;
    color: #fff !important;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    text-align: center;
  }

  .landing .muted {
    color: #6b7280 !important;
    font-size: 14px;
    text-align: center;
    margin: 0 0 40px;
    line-height: 1.65;
  }

  /* ── WHY CARDS ── */
  .landing .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

  .landing .card {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 14px;
    padding: 28px 24px;
    box-shadow: none !important;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    text-align: center;
  }
  .landing .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(91,33,182,0.18) !important;
    border-color: rgba(139,92,246,0.3) !important;
  }

  .landing .card-icon {
    width: 120px; height: 120px;
    object-fit: contain;
    border-radius: 20px;
    background: none !important;
    border: none !important;
    display: block;
    margin: 0 auto 20px;
    filter: none !important;
  }

  .landing .card h3 { font-size: 15px; font-weight: 700; color: #e5e7eb !important; margin: 0 0 8px; }
  .landing .card p  { color: #6b7280 !important; font-size: 14px; line-height: 1.7; margin: 0; }

  /* ── FEATURES ── */
  .landing .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }

  .landing .feature {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 14px;
    padding: 28px 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    box-shadow: none !important;
  }

  .landing .feature::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: #7c3aed;
    border-radius: 3px 0 0 3px;
    opacity: 0;
    transition: opacity 0.2s;
    box-shadow: 0 0 12px rgba(124,58,237,0.6);
  }

  .landing .feature:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(91,33,182,0.2) !important;
    border-color: rgba(139,92,246,0.3) !important;
    background: rgba(91,33,182,0.07) !important;
  }
  .landing .feature:hover::after { opacity: 1; }

  .landing .feature-icon-wrap {
    width: 56px; height: 56px;
    background: none !important;
    border: none !important;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
  }
  .landing .feature:hover .feature-icon-wrap {
    background: none !important;
    box-shadow: none !important;
  }
  .landing .feature-icon-wrap img {
    width: 56px; height: 56px;
    object-fit: contain;
    border-radius: 14px;
    filter: none !important;
  }

  .landing .feature h4 { font-size: 15px; font-weight: 700; color: #e5e7eb !important; margin: 0 0 8px; }
  .landing .feature p  { color: #6b7280 !important; font-size: 14px; line-height: 1.7; margin: 0; }

  .landing .feature-arrow {
    position: absolute;
    top: 24px; right: 22px;
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(91,33,182,0.15) !important;
    border: 1px solid rgba(139,92,246,0.25);
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transform: translateX(-6px);
    transition: all 0.2s;
  }
  .landing .feature:hover .feature-arrow { opacity: 1; transform: translateX(0); }

  /* ── STEPS ── */
  .landing .steps-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1160px;
    margin: 0 auto;
    position: relative;
  }
  .landing .steps-row::before { display: none; }

  .landing .step {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 14px;
    padding: 32px 22px;
    text-align: center;
    position: relative;
    z-index: 1;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: none !important;
  }
  .landing .step:hover {
    border-color: rgba(139,92,246,0.3) !important;
    box-shadow: 0 12px 32px rgba(91,33,182,0.18) !important;
  }

  .landing .circle {
    width: 52px; height: 52px;
    background: transparent !important;
    border: 2px solid #7c3aed;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #a78bfa !important;
    margin: 0 auto 18px;
    box-shadow: 0 0 18px rgba(124,58,237,0.2), inset 0 0 14px rgba(124,58,237,0.06);
  }

  .landing .step h4 { font-size: 14px; font-weight: 700; color: #e5e7eb !important; margin: 0 0 8px; }
  .landing .step p  { color: #6b7280 !important; font-size: 13px; line-height: 1.7; margin: 0; }

  /* ── WHY DIFFERENT ── */
  .landing .diff-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

  .landing .diff-card {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 14px;
    padding: 32px 24px;
    transition: all 0.2s;
    box-shadow: none !important;
    text-align: center;
  }
  .landing .diff-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(91,33,182,0.18) !important;
    border-color: rgba(139,92,246,0.3) !important;
    background: rgba(91,33,182,0.07) !important;
  }

  .landing .diff-icon {
    width: 36px; height: 36px;
    object-fit: contain;
    padding: 0;
    border-radius: 0;
    background: none !important;
    border: none !important;
    display: block;
    margin: 0 auto 18px;
    filter: none !important;
  }

  .landing .diff-icon-wrap {
    width: 68px; height: 68px;
    border-radius: 16px;
    background: rgba(91,33,182,0.5) !important;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px;
  }

  .landing .diff-card h4 { font-size: 15px; font-weight: 700; color: #e5e7eb !important; margin: 0 0 8px; text-align: center; }
  .landing .diff-card p  { color: #6b7280 !important; font-size: 14px; line-height: 1.7; margin: 0; text-align: center; }

  /* ── CTA ── */
  .landing .cta-block {
    background: #0e0618 !important;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding: 96px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .landing .cta-block::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 55% 80% at 50% 100%, rgba(91,33,182,0.12) 0%, transparent 65%);
    pointer-events: none;
  }
  .landing .cta-block .section-title,
  .landing .cta-block .muted,
  .landing .cta-block .btn { position: relative; z-index: 1; }
  .landing .cta-block .btn { margin-top: 8px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .landing .hero-inner { grid-template-columns: 1fr; gap: 36px; padding: 56px 24px 48px; }
    .landing .hero-right { display: none; }
    .landing .cards,
    .landing .feature-grid,
    .landing .steps-row,
    .landing .diff-cards { grid-template-columns: 1fr; }
    .landing .why,
    .landing .features,
    .landing .steps,
    .landing .why-different,
    .landing .cta-block { padding: 60px 24px; }
    .landing .steps-row::before { display: none; }
    .landing .kpis { gap: 10px; }
  }
`

export default function Landing({ onNavigate }) {
  const typed = useTypewriter(PHRASES)
  const featuresRef = React.useRef(null)
  function scrollToFeatures() {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const features = [
    { icon: micIcon,    title: 'Voice Complaint Filing', desc: 'Simply send a voice note in your language; AI converts speech to text and formats it properly.',              route: 'voice'    },
    { icon: searchIcon, title: 'Legal Lens',              desc: 'AI analyzes your complaint and suggests relevant laws, articles, and frameworks to strengthen your case.',    route: 'document' },
    { icon: shieldIcon, title: 'Officer Mode',            desc: 'Government officials can process multiple complaints efficiently with AI-powered categorization and routing.', route: 'officer'  },
    { icon: chatIcon,   title: 'Rights Chatbot',          desc: 'Get instant answers about your rights, complaint procedures, and government services in simple language.',     route: 'rights'   },
  ]

  return (
    <div className="landing">
      <style>{styles}</style>

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="badge">AI-Powered Legal Aid</div>
            <h1>
              <span className="static">AI That </span>
              <span className="typed">{typed}</span>
              <span className="cursor" />
            </h1>
            <p className="lead">
              Turn voice notes into official complaints.<br />
              
            </p>
            <div className="hero-ctas">
              <a href="https://t.me/NyayaBharat_bot" target="_blank" rel="noopener noreferrer" className="btn primary">
                <img src={telegramIcon} alt="" className="btn-icon" /> Start Filing Now
              </a>
              <button className="btn ghost" onClick={scrollToFeatures}>See How It Works</button>
            </div>
          </div>
          <div className="hero-right">
            <img src={DashPic} alt="Dashboard" />
          </div>
        </div>
      </header>

      <section className="why">
        <div className="section-inner">
          <h2 className="section-title">Filing complaints shouldn't be this difficult</h2>
          <p className="muted">Millions of Indians are shut out by language barriers, legal jargon, and broken portals.</p>
          <div className="cards">
            <div className="card">
              <img src={brainIcon} alt="Language barrier" className="card-icon" />
              <h3>Language Barrier</h3>
              <p>Most government systems operate only in English or Hindi, excluding millions who speak regional languages.</p>
            </div>
            <div className="card">
              <img src={scalesIcon} alt="Legal complexity" className="card-icon" />
              <h3>Legal Complexity</h3>
              <p>Citizens struggle with legal terminology and proper complaint formatting required by government departments.</p>
            </div>
            <div className="card">
              <img src={girlIcon} alt="Digital illiteracy" className="card-icon" />
              <h3>Digital Illiteracy</h3>
              <p>Complex forms and online portals create barriers for citizens unfamiliar with technology and smartphones.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" ref={featuresRef}>
        <div className="section-inner">
          <h2 className="section-title">What NyayaBharat Does</h2>
          <p className="muted">Powerful features that make complaint filing effortless</p>
          <div className="feature-grid">
            {features.map(({ icon, title, desc, route }) => (
              <div
                key={route}
                className="feature"
                onClick={() => onNavigate?.(route)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onNavigate?.(route)}
              >
                <div className="feature-icon-wrap">
                  <img src={icon} alt={title} />
                </div>
                <h4>{title}</h4>
                <p>{desc}</p>
                <div className="feature-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="steps">
        <div className="section-inner">
          <h2 className="section-title">From Voice Note to Official Filing</h2>
          <p className="muted">Three simple steps to make your voice heard</p>
          <div className="steps-row">
            <div className="step">
              <div className="circle">1</div>
              <h4>Send Voice or Image</h4>
              <p>Simply send a voice note, text message, or image on Telegram describing your issue.</p>
            </div>
            <div className="step">
              <div className="circle">2</div>
              <h4>AI Processes & Drafts</h4>
              <p>Our AI analyzes your message, extracts details, and formats it into an official complaint.</p>
            </div>
            <div className="step">
              <div className="circle">3</div>
              <h4>Complaint Filed Automatically</h4>
              <p>The complaint is automatically submitted to the relevant department with tracking.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-different">
        <div className="section-inner">
          <h2 className="section-title">Why NyayaBharat is Different</h2>
          <p className="muted">Built specifically for Indian citizens and our unique needs</p>
          <div className="diff-cards">
            <div className="diff-card">
              <div className="diff-icon-wrap"><img src={phoneIcon} alt="Zero-app" className="diff-icon" /></div>
              <h4>Zero‑App Architecture</h4>
              <p>No downloads needed. Works entirely through Telegram, which hundreds of millions use daily.</p>
            </div>
            <div className="diff-card">
              <div className="diff-icon-wrap"><img src={globeIcon} alt="Languages" className="diff-icon" /></div>
              <h4>Regional Language Support</h4>
              <p>Speak in Hindi, Bengali, Tamil or 15+ Indian languages. AI understands and translates automatically.</p>
            </div>
            <div className="diff-card">
              <div className="diff-icon-wrap"><img src={shieldIcon2} alt="Privacy" className="diff-icon" /></div>
              <h4>Zero‑Retention Privacy</h4>
              <p>Your voice notes are processed and deleted immediately. We never store personal audio or sensitive data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-block">
        <h2 className="section-title">Your Voice Deserves Action.</h2>
        <p className="muted">Start filing complaints in your language, through Telegram, right now.</p>
        <a href="https://t.me/NyayaBharat_bot" target="_blank" rel="noopener noreferrer" className="btn primary large glowing">
          <img src={telegramIcon} alt="" className="btn-icon" /> Start Filing Now
        </a>
      </section>
    </div>
  )
}