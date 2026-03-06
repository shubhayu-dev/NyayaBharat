import React from 'react'
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

const featureStyles = `
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 28px;
  }

  .feature {
    background: #fff;
    padding: 28px 24px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    box-shadow: 0 4px 16px rgba(2, 6, 23, 0.07);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
  }

  .feature::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,102,255,0.04), transparent 60%);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .feature:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(0, 102, 255, 0.14);
    border-color: rgba(0,102,255,0.18);
  }

  .feature:hover::before {
    opacity: 1;
  }

  .feature:active {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 102, 255, 0.1);
  }

  .feature-icon-wrap {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, rgba(0,102,255,0.12), rgba(0,102,255,0.06));
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    transition: background 0.2s ease;
  }

  .feature:hover .feature-icon-wrap {
    background: linear-gradient(135deg, rgba(0,102,255,0.2), rgba(0,102,255,0.1));
  }

  .feature-icon-wrap img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .feature h4 {
    margin: 0 0 8px 0;
    font-size: 17px;
    color: #0f0a1e;
    font-weight: 700;
  }

  .feature p {
    margin: 0;
    color: #555;
    line-height: 1.6;
    font-size: 14px;
  }

  .feature-arrow {
    position: absolute;
    top: 24px;
    right: 22px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0,102,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .feature:hover .feature-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  @media (max-width: 900px) {
    .feature-grid { grid-template-columns: 1fr; }
    .feature { align-items: flex-start; }
  }
`

export default function Landing({ onNavigate }) {
  const features = [
    {
      icon: micIcon,
      title: 'Voice Complaint Filing',
      desc: 'Simply send a voice note in your language; AI converts speech to text and formats it properly.',
      route: 'voice',
    },
    {
      icon: searchIcon,
      title: 'Legal Lens',
      desc: 'AI analyzes your complaint and suggests relevant laws, articles, and frameworks to strengthen your case.',
      route: 'document',
    },
    {
      icon: shieldIcon,
      title: 'Officer Mode',
      desc: 'Government officials can process multiple complaints efficiently with AI-powered categorization and routing.',
      route: 'officer',
    },
    {
      icon: chatIcon,
      title: 'Rights Chatbot',
      desc: 'Get instant answers about your rights, complaint procedures, and government services in simple language.',
      route: 'rights',
    },
  ]

  return (
    <div className="landing">
      <style>{featureStyles}</style>

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="badge">AI-Powered Legal Aid</div>
            <h1>AI That simplifies law for you</h1>
            <p className="lead">Turn voice notes into official complaints<br/> Simplify legal documents<br/></p>
            <div className="hero-ctas">
              <button className="btn primary" onClick={() => onNavigate?.('voice')}>
                <img src={telegramIcon} alt="" className="btn-icon" /> Start Filing Now
              </button>
              <button className="btn ghost" onClick={() => onNavigate?.('document')}>See How It Works</button>
            </div>
            <ul className="kpis">
              <li><strong>10K+</strong><span>Complaints Filed</span></li>
              <li><strong>95%</strong><span>Success Rate</span></li>
              <li><strong>&lt;2 min</strong><span>Processing Time</span></li>
            </ul>
          </div>
          <div className="hero-right">
            <img src={DashPic} alt="Dashboard Image" />
          </div>
        </div>
      </header>

      <section className="why">
        <h2>Filing government complaints shouldn't be this difficult</h2>
        <p className="muted">Filing government complaints shouldn't be this difficult</p>
        <div className="cards">
          <div className="card">
            <img src={brainIcon} alt="Language barrier" className="card-icon card-brain" />
            <h3>Language Barrier</h3>
            <p>Most government systems operate only in English or Hindi, excluding millions who speak regional languages.</p>
          </div>
          <div className="card">
            <img src={scalesIcon} alt="Legal complexity" className="card-icon card-scales" />
            <h3>Legal Complexity</h3>
            <p>Citizens struggle with legal terminology and proper complaint formatting required by government departments.</p>
          </div>
          <div className="card">
            <img src={girlIcon} alt="Digital illiteracy" className="card-icon card-phone" />
            <h3>Digital Illiteracy</h3>
            <p>Complex forms and online portals create barriers for citizens unfamiliar with technology and smartphones.</p>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>What NyayaBharat Does</h2>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="steps">
        <h2>From Voice Note to Official Filing</h2>
        <p className="muted">Three simple steps to make your voice heard</p>
        <div className="steps-row">
          <div className="step"> <div className="circle">01</div> <h4>Send Voice or Image</h4> <p>Simply send a voice note, text message, or image on Telegram describing your issue.</p></div>
          <div className="step"> <div className="circle">02</div> <h4>AI Processes & Drafts</h4> <p>Our AI analyzes your message, extracts details, and formats it into an official complaint.</p></div>
          <div className="step"> <div className="circle">03</div> <h4>Complaint Filed Automatically</h4> <p>The complaint is automatically submitted to the relevant department with tracking.</p></div>
        </div>
      </section>

      <section className="why-different">
        <h2>Why NyayaBharat is Different</h2>
        <p className="muted">Built specifically for Indian citizens and our unique needs</p>
        <div className="diff-cards">
          <div className="diff-card">
            <img src={phoneIcon} alt="Zero-app" className="diff-icon" />
            <h4>Zero‑App Architecture</h4>
            <p>No downloads needed. Works entirely through Telegram, which hundreds of millions of users worldwide use daily.</p>
          </div>
          <div className="diff-card">
            <img src={globeIcon} alt="Languages" className="diff-icon" />
            <h4>Regional Language Support</h4>
            <p>Speak in Hindi, Bengali, Tamil or 15+ Indian languages. AI understands and translates automatically.</p>
          </div>
          <div className="diff-card">
            <img src={shieldIcon2} alt="Privacy" className="diff-icon" />
            <h4>Zero‑Retention Privacy</h4>
            <p>Your voice notes are processed and deleted immediately. We never store personal audio or sensitive data.</p>
          </div>
        </div>
      </section>

      <section className="cta-block">
        <h2>Your Voice Deserves Action.</h2>
        <p className="muted">Start filing complaints in your language, through Telegram, right now.</p>
        <button className="btn primary large glowing" onClick={() => onNavigate?.('voice')}>
          <img src={telegramIcon} alt="" className="btn-icon" /> Start Filing Now
        </button>
      </section>
    </div>
  )
}